import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API = import.meta.env.VITE_BACKEND_URL;

// ── ID comparison helper (handles ObjectId objects vs strings) ─────────────
const idEq = (a, b) => a?.toString() === b?.toString();
const idIncludes = (arr, id) => (arr || []).some(item => idEq(item, id));

const getImageSrc = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${API}${path}`;
};

const PdfInlineViewer = ({ url, title }) => {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);

    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error('Failed to load PDF');
        return res.blob();
      })
      .then(blob => {
        if (active) {
          const pdfBlob = new Blob([blob], { type: 'application/pdf' });
          const localUrl = URL.createObjectURL(pdfBlob);
          setBlobUrl(localUrl);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error('Error loading PDF blob:', err);
        if (active) {
          setError(true);
          setLoading(false);
        }
      });

    return () => {
      active = false;
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [url]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-48 bg-gray-50 rounded-xl border border-dashed border-gray-200">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
        <span className="text-gray-500 font-medium mt-2">Loading PDF inline...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-48 bg-red-50 rounded-xl border border-red-200 p-6 text-center">
        <div className="text-4xl mb-2">⚠️</div>
        <p className="text-gray-700 font-semibold mb-2">Could not display PDF inline</p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-bold transition"
        >
          Open PDF in New Tab ↗
        </a>
      </div>
    );
  }

  return (
    <iframe
      src={blobUrl}
      className="w-full"
      style={{ height: 400 }}
      title={title}
    />
  );
};

// ── YouTube Player Hook ───────────────────────────────────────────────────────
const useYouTubePlayer = (videoUrl, playerRef) => {
  const [player, setPlayer] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [muted, setMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [buffered, setBuffered] = useState(0);
  const intervalRef = useRef(null);

  const getVideoId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  useEffect(() => {
    const videoId = getVideoId(videoUrl);
    if (!videoId || !playerRef.current) return;

    const initPlayer = () => {
      if (player) { player.destroy(); }
      const newPlayer = new window.YT.Player(playerRef.current, {
        videoId,
        playerVars: {
          controls: 0,
          disablekb: 1,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          fs: 0,
          iv_load_policy: 3,
        },
        events: {
          onReady: (e) => {
            setDuration(e.target.getDuration());
            setVolume(e.target.getVolume());
            setPlayer(e.target);
          },
          onStateChange: (e) => {
            if (e.data === window.YT.PlayerState.PLAYING) {
              setPlaying(true);
              intervalRef.current = setInterval(() => {
                setCurrentTime(e.target.getCurrentTime());
                setBuffered(e.target.getVideoLoadedFraction() * e.target.getDuration());
              }, 500);
            } else {
              setPlaying(false);
              clearInterval(intervalRef.current);
            }
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(script);
      }
    }

    return () => clearInterval(intervalRef.current);
  }, [videoUrl]);

  const togglePlay = () => {
    if (!player) return;
    playing ? player.pauseVideo() : player.playVideo();
  };

  const seek = (time) => {
    if (!player) return;
    player.seekTo(time, true);
    setCurrentTime(time);
  };

  const changeVolume = (v) => {
    if (!player) return;
    player.setVolume(v);
    setVolume(v);
    if (v === 0) { player.mute(); setMuted(true); }
    else { player.unMute(); setMuted(false); }
  };

  const toggleMute = () => {
    if (!player) return;
    if (muted) { player.unMute(); player.setVolume(volume || 50); setMuted(false); }
    else { player.mute(); setMuted(true); }
  };

  const changeRate = (rate) => {
    if (!player) return;
    player.setPlaybackRate(rate);
    setPlaybackRate(rate);
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return { playing, currentTime, duration, volume, muted, playbackRate, buffered, togglePlay, seek, changeVolume, toggleMute, changeRate, formatTime };
};

// ── Video Player Component ────────────────────────────────────────────────────
const VideoPlayer = ({ videoUrl, onEnded }) => {
  const containerRef = useRef(null);
  const iframeRef = useRef(null);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const hideTimer = useRef(null);

  const { playing, currentTime, duration, volume, muted, playbackRate, buffered, togglePlay, seek, changeVolume, toggleMute, changeRate, formatTime } =
    useYouTubePlayer(videoUrl, iframeRef);

  const handleMouseMove = () => {
    setShowControls(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowControls(false), 3000);
  };

  useEffect(() => {
    if (duration > 0 && currentTime >= duration - 1) onEnded?.();
  }, [currentTime, duration]);

  const toggleFullscreen = () => {
    if (!fullscreen) {
      containerRef.current?.requestFullscreen?.();
      setFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setFullscreen(false);
    }
  };

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPct = duration > 0 ? (buffered / duration) * 100 : 0;

  return (
    <div ref={containerRef}
      className="relative bg-black w-full select-none"
      style={{ aspectRatio: '16/9' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setShowControls(false)}
      onClick={togglePlay}>

      {/* YouTube iframe */}
      <div ref={iframeRef} className="w-full h-full" />

      {/* Overlay — blocks YouTube clicks so our controls work */}
      <div className="absolute inset-0 z-10" onClick={togglePlay} />

      {/* Play/Pause center flash */}
      <div className={`absolute inset-0 z-20 flex items-center justify-center pointer-events-none transition-opacity duration-200 ${playing ? 'opacity-0' : 'opacity-100'}`}>
        <div className="bg-black/40 rounded-full p-5">
          <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </div>
      </div>

      {/* Controls Bar */}
      <div className={`absolute bottom-0 left-0 right-0 z-30 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
        onClick={e => e.stopPropagation()}>

        {/* Progress Bar */}
        <div className="px-4 pb-1">
          <div className="relative h-1.5 bg-white/30 rounded-full cursor-pointer group"
            onClick={e => {
              const rect = e.currentTarget.getBoundingClientRect();
              seek(((e.clientX - rect.left) / rect.width) * duration);
            }}>
            {/* Buffered */}
            <div className="absolute top-0 left-0 h-full bg-white/40 rounded-full" style={{ width: `${bufferedPct}%` }} />
            {/* Played */}
            <div className="absolute top-0 left-0 h-full bg-blue-500 rounded-full" style={{ width: `${progressPct}%` }} />
            {/* Thumb */}
            <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `calc(${progressPct}% - 7px)` }} />
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="bg-gradient-to-t from-black/80 to-transparent px-4 py-2 flex items-center gap-3">
          {/* Play/Pause */}
          <button onClick={togglePlay} className="text-white hover:text-blue-400 transition">
            {playing ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </button>

          {/* Volume */}
          <div className="flex items-center gap-1 group/vol">
            <button onClick={toggleMute} className="text-white hover:text-blue-400 transition">
              {muted || volume === 0 ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16.5 12A4.5 4.5 0 0014 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
                </svg>
              )}
            </button>
            <input type="range" min="0" max="100" value={muted ? 0 : volume}
              onChange={e => changeVolume(Number(e.target.value))}
              className="w-16 h-1 accent-blue-500 opacity-0 group-hover/vol:opacity-100 transition-opacity" />
          </div>

          {/* Time */}
          <span className="text-white text-xs font-mono">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <div className="flex-1" />

          {/* Playback Speed */}
          <div className="relative">
            <button onClick={() => setShowSettings(s => !s)}
              className="text-white text-xs font-bold hover:text-blue-400 transition px-2 py-1 bg-white/10 rounded">
              {playbackRate}x
            </button>
            {showSettings && (
              <div className="absolute bottom-8 right-0 bg-gray-900 rounded-lg shadow-xl overflow-hidden z-50">
                {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map(rate => (
                  <button key={rate} onClick={() => { changeRate(rate); setShowSettings(false); }}
                    className={`block w-full px-4 py-2 text-sm text-left transition ${playbackRate === rate ? 'bg-blue-600 text-white' : 'text-gray-200 hover:bg-gray-700'}`}>
                    {rate}x
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Fullscreen */}
          <button onClick={toggleFullscreen} className="text-white hover:text-blue-400 transition">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Status Badge ──────────────────────────────────────────────────────────────
const ItemStatusBadge = ({ status }) => {
  const cfg = {
    graded:   { label: '✓ Graded',        cls: 'bg-green-100 text-green-700' },
    pending:  { label: '⏳ Submitted',     cls: 'bg-yellow-100 text-yellow-700' },
    late:     { label: '⚠ Late',          cls: 'bg-orange-100 text-orange-700' },
    missing:  { label: '✕ Missing',        cls: 'bg-red-100 text-red-700' },
    upcoming: { label: '→ Not submitted',  cls: 'bg-gray-100 text-gray-600' },
  };
  const c = cfg[status] || cfg.upcoming;
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${c.cls}`}>{c.label}</span>;
};

// ── Main Component ────────────────────────────────────────────────────────────
const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [completedLessons, setCompletedLessons] = useState([]); // string[]
  const [progress, setProgress] = useState(0);
  const [selectedItem, setSelectedItem] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});
  const [submissionMap, setSubmissionMap] = useState({});
  const [quizResultMap, setQuizResultMap] = useState({});

  // Assignment submission state
  const [assignmentText, setAssignmentText] = useState('');
  const [assignmentFile, setAssignmentFile] = useState(null);
  const [submittingAssignment, setSubmittingAssignment] = useState(false);

  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState([]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [timerActive, setTimerActive] = useState(false);

  // Review
  const [review, setReview] = useState({ rating: 5, comment: '' });
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  // ── FIX: track course completion state ─────────────────────────────────────
  const [isCourseCompleted, setIsCourseCompleted] = useState(false);

  const userId = user?._id || user?.id;
  const isEnrolled = !!user && !!userId && course?.enrolledStudents?.some(
    s => idEq(s._id, userId) || idEq(s, userId)
  );

  // ── Fetch ───────────────────────────────────────────────────────────────────
  useEffect(() => { fetchAll(); }, [id]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/courses/${id}`);
      if (!res.ok) throw new Error('Course not found');
      const data = await res.json();
      setCourse(data.course);

      setExpandedSections({ 0: true });

      const sorted = [...(data.course.lessons || [])].sort((a, b) => a.order - b.order);
      if (sorted.length > 0) setSelectedItem({ type: 'lesson', data: sorted[0] });

      if (user) {
        const token = localStorage.getItem('token');

        // ── Load progress from backend ──────────────────────────────────────
        const progRes = await fetch(`${API}/api/courses/${id}/my-progress`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (progRes.ok) {
          const progData = await progRes.json();
          const rawCompleted = progData.completedLessons || [];
          const normalizedCompleted = rawCompleted.map(item =>
            typeof item === 'object' ? (item._id?.toString() || item.toString()) : item.toString()
          );
          setCompletedLessons(normalizedCompleted);

          const totalLessons = data.course.lessons?.length || 0;
          const calculatedProgress = totalLessons > 0
            ? Math.round((normalizedCompleted.length / totalLessons) * 100)
            : 0;
          setProgress(calculatedProgress);

          // ── FIX: set course completion state from backend ─────────────────
          setIsCourseCompleted(progData.completed === true || calculatedProgress === 100);
        }

        // Track recently viewed
        fetch(`${API}/api/users/recently-viewed/${id}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });

        // Check if bookmarked
        const bmRes = await fetch(`${API}/api/users/bookmarks`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (bmRes.ok) {
          const bmData = await bmRes.json();
          setIsBookmarked(bmData.bookmarks.some(b => idEq(b._id, id) || idEq(b, id)));
        }

        // Load submissions for assignments
        if (data.course.assignments?.length > 0) {
          const subMap = {};
          await Promise.all(data.course.assignments.map(async (a) => {
            const r = await fetch(`${API}/api/courses/${id}/assignments/${a._id}/submission`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (r.ok) {
              const d = await r.json();
              if (d.submission) subMap[a._id] = d.submission;
            }
          }));
          setSubmissionMap(subMap);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Timer ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!timerActive || timeLeft === null) return;
    if (timeLeft === 0) {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 880; osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 1.5);
      setTimerActive(false);
      handleSubmitQuiz();
      return;
    }
    const t = setInterval(() => setTimeLeft(p => p - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft, timerActive]);

  // ── Section grouping ────────────────────────────────────────────────────────
  const buildCurriculum = () => {
    if (!course) return [];

    if (course.curriculumOrder?.length > 0) {
      const sections = [];
      let currentSection = { index: 0, title: 'Week 1', lessons: [], assignments: [], quizzes: [], isSequenced: true };
      let weekNum = 1;

      course.curriculumOrder.sort((a, b) => a.order - b.order).forEach((item) => {
        if (item.itemType === 'lesson') {
          const lesson = course.lessons?.find(l => idEq(l._id, item.itemId));
          if (lesson) currentSection.lessons.push(lesson);
        } else if (item.itemType === 'assignment') {
          const assignment = course.assignments?.find(a => idEq(a._id, item.itemId));
          if (assignment) {
            if (currentSection.lessons.length > 0) {
              sections.push({ ...currentSection });
              weekNum++;
              currentSection = { index: sections.length, title: `Week ${weekNum}`, lessons: [], assignments: [], quizzes: [], isSequenced: true };
            }
            sections.push({ index: sections.length, title: `📝 ${assignment.title}`, lessons: [], assignments: [assignment], quizzes: [], isExtra: true, isSequenced: true });
            currentSection = { index: sections.length, title: `Week ${weekNum}`, lessons: [], assignments: [], quizzes: [], isSequenced: true };
          }
        } else if (item.itemType === 'quiz') {
          const quiz = course.quizzes?.find(q => idEq(q._id, item.itemId));
          if (quiz) {
            if (currentSection.lessons.length > 0) {
              sections.push({ ...currentSection });
              weekNum++;
              currentSection = { index: sections.length, title: `Week ${weekNum}`, lessons: [], assignments: [], quizzes: [], isSequenced: true };
            }
            sections.push({ index: sections.length, title: `❓ ${quiz.title}`, lessons: [], assignments: [], quizzes: [quiz], isExtra: true, isSequenced: true });
            currentSection = { index: sections.length, title: `Week ${weekNum}`, lessons: [], assignments: [], quizzes: [], isSequenced: true };
          }
        }
      });

      if (currentSection.lessons.length > 0) sections.push(currentSection);
      return sections.filter(s => s.lessons.length > 0 || s.assignments?.length > 0 || s.quizzes?.length > 0);
    }

    // Fallback: auto-group every 5 lessons
    const sorted = [...course.lessons].sort((a, b) => a.order - b.order);
    const SECTION_SIZE = 5;
    const sections = [];
    for (let i = 0; i < sorted.length; i += SECTION_SIZE) {
      sections.push({ index: sections.length, title: `Week ${sections.length + 1}`, lessons: sorted.slice(i, i + SECTION_SIZE) });
    }
    if (course.assignments?.length > 0 || course.quizzes?.length > 0) {
      sections.push({ index: sections.length, title: '📝 Assignments & Quizzes', lessons: [], assignments: course.assignments || [], quizzes: course.quizzes || [], isExtra: true });
    }
    return sections;
  };

  const buildFlatSequence = () => {
    if (!course) return [];
    const flat = [];
    const curriculum = buildCurriculum();
    curriculum.forEach(section => {
      if (section.isExtra) {
        section.assignments?.forEach(a => flat.push({ type: 'assignment', id: a._id?.toString(), data: a }));
        section.quizzes?.forEach(q => flat.push({ type: 'quiz', id: q._id?.toString(), data: q }));
      } else {
        section.lessons?.forEach(l => flat.push({ type: 'lesson', id: l._id?.toString(), data: l }));
      }
    });
    return flat;
  };

  // ── Lock logic ──────────────────────────────────────────────────────────────
  const isItemUnlocked = (type, itemId) => {
    if (!isEnrolled) {
      if (type === 'lesson') {
        const lesson = course.lessons.find(l => idEq(l._id, itemId));
        return lesson?.isPreview ?? false;
      }
      return false;
    }

    const seq = buildFlatSequence();
    const idx = seq.findIndex(s => s.type === type && idEq(s.id, itemId));
    if (idx <= 0) return true;

    const prev = seq[idx - 1];
    if (prev.type === 'lesson') return idIncludes(completedLessons, prev.id);
    if (prev.type === 'assignment') return !!submissionMap[prev.id];
    if (prev.type === 'quiz') return !!quizResultMap[prev.id];
    return false;
  };

  // ── FIX: handleCompleteLesson — saves progress and updates enrollment record ─
  const handleCompleteLesson = async (lessonId) => {
    if (!user) { navigate('/login'); return; }
    const lessonIdStr = lessonId?.toString();
    if (idIncludes(completedLessons, lessonIdStr)) return;

    const token = localStorage.getItem('token');
    const res = await fetch(`${API}/api/courses/${id}/complete-lesson`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId: lessonIdStr })
    });

    if (res.ok) {
      const responseData = await res.json().catch(() => ({}));

      setCompletedLessons(prev => {
        const updated = [...prev, lessonIdStr];
        const total = course.lessons?.length || 0;
        const newProgress = total > 0 ? Math.round((updated.length / total) * 100) : 0;
        setProgress(newProgress);

        // ── FIX: check if all lessons completed → mark course done ──────────
        const isNowComplete = newProgress === 100;
        if (isNowComplete) {
          setIsCourseCompleted(true);
          // Tell backend to mark enrollment as completed and update progress field
          fetch(`${API}/api/courses/${id}/complete`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          }).catch(() => {});
        } else {
          // ── FIX: update the progress % in the enrollment record so dashboard stays in sync
          fetch(`${API}/api/courses/${id}/update-progress`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ progress: newProgress })
          }).catch(() => {});
        }

        return updated;
      });

      // If backend returns updated progress/completion, use those values
      if (responseData.progress !== undefined) {
        setProgress(responseData.progress);
      }
      if (responseData.completed !== undefined) {
        setIsCourseCompleted(responseData.completed);
      }
    }
  };

  const handleBookmark = async () => {
    if (!user) { navigate('/login'); return; }
    const token = localStorage.getItem('token');
    const res = await fetch(`${API}/api/users/bookmarks/${id}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setIsBookmarked(data.bookmarked);
    }
  };

  const handleEnroll = async () => {
    if (!user) { navigate('/login'); return; }
    if (user?.role === 'admin') {
      alert('Admins cannot purchase or enroll in student courses.');
      return;
    }
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API}/api/courses/${id}/enroll`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.session && data.session.url) {
          // Redirect to checkout session URL (Stripe or Simulated)
          window.location.href = data.session.url.startsWith('http') 
            ? data.session.url 
            : `${window.location.origin}${data.session.url}`;
        } else {
          alert('Successfully enrolled!'); 
          fetchAll();
        }
      } else {
        const e = await res.json(); 
        alert(e.message || 'Failed to enroll');
      }
    } catch (err) {
      console.error('Enrollment error:', err);
      alert('Failed to connect to enrollment server');
    }
  };

  const handleSubmitAssignment = async () => {
    if (!assignmentText.trim() && !assignmentFile) {
      alert('Please write your answer or attach a PDF');
      return;
    }
    const assignment = selectedItem.data;
    setSubmittingAssignment(true);
    try {
      const token = localStorage.getItem('token');
      let res;
      if (assignmentFile) {
        const fd = new FormData();
        fd.append('text', assignmentText);
        fd.append('file', assignmentFile);
        res = await fetch(`${API}/api/courses/${id}/assignments/${assignment._id}/submit`, {
          method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd
        });
      } else {
        res = await fetch(`${API}/api/courses/${id}/assignments/${assignment._id}/submit`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: assignmentText })
        });
      }
      if (res.ok) {
        alert('Assignment submitted! 🎉');
        setAssignmentText(''); setAssignmentFile(null);
        fetchAll();
      } else {
        const e = await res.json(); alert(e.message || 'Failed to submit');
      }
    } finally { setSubmittingAssignment(false); }
  };

  const handleStartQuiz = (quiz) => {
    setQuizAnswers(new Array(quiz.questions.length).fill(null));
    setQuizSubmitted(false);
    setQuizResult(null);
    setTimeLeft((quiz.duration || 10) * 60);
    setTimerActive(true);
  };

  const handleSubmitQuiz = async () => {
    setTimerActive(false);
    const quiz = selectedItem?.data;
    if (!quiz) return;
    if (quizAnswers.some(a => a === null)) { alert('Please answer all questions'); return; }
    const token = localStorage.getItem('token');
    const res = await fetch(`${API}/api/courses/${id}/quizzes/${quiz._id}/submit`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: quizAnswers })
    });
    if (res.ok) {
      const result = await res.json();
      setQuizResult(result);
      setQuizSubmitted(true);
      setQuizResultMap(p => ({ ...p, [quiz._id]: result }));
    } else {
      const e = await res.json(); alert(e.message || 'Failed to submit quiz');
    }
  };

  const handleReview = async () => {
    if (!review.comment.trim()) { alert('Please write a comment'); return; }
    setSubmittingReview(true);
    const token = localStorage.getItem('token');
    const res = await fetch(`${API}/api/courses/${id}/review`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(review)
    });
    if (res.ok) { alert('Review submitted!'); setReview({ rating: 5, comment: '' }); fetchAll(); }
    else { const e = await res.json(); alert(e.message || 'Failed'); }
    setSubmittingReview(false);
  };

  // ── Render Content Area ──────────────────────────────────────────────────────
  const renderContent = () => {
    if (!selectedItem) return (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded-xl">
        <div className="text-center"><div className="text-6xl mb-4">📚</div>
          <p className="text-gray-500">Select a lesson to start</p></div>
      </div>
    );

    const { type, data } = selectedItem;
    if (type === 'lesson') return renderLesson(data);
    if (type === 'assignment') return renderAssignment(data);
    if (type === 'quiz') return renderQuiz(data);
  };

  const renderLesson = (lesson) => {
    const unlocked = isItemUnlocked('lesson', lesson._id);
    const completed = idIncludes(completedLessons, lesson._id);

    if (!unlocked) return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <p className="text-gray-600 font-semibold mb-1">Lesson Locked</p>
          <p className="text-gray-400 text-sm">Complete the previous lesson to unlock</p>
        </div>
      </div>
    );

    return (
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {lesson.type === 'video' && lesson.videoUrl && (
          <VideoPlayer
            videoUrl={lesson.videoUrl}
            onEnded={() => !completed && handleCompleteLesson(lesson._id)}
          />
        )}

        {lesson.type === 'pdf' && lesson.pdfUrl && (
          <div className="bg-gray-800 p-4 text-center">
            <a href={getImageSrc(lesson.pdfUrl)} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold">
              📄 Open PDF Lesson
            </a>
          </div>
        )}

        {lesson.type === 'text' && (
          <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-b">
            <div className="text-6xl text-center py-8">📄</div>
          </div>
        )}

        <div className="p-6">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{lesson.title}</h2>
              <p className="text-gray-500 mt-1">{lesson.description}</p>
            </div>
            {isEnrolled && (
              <button onClick={() => handleCompleteLesson(lesson._id)} disabled={completed}
                className={`ml-4 px-5 py-2 rounded-xl font-semibold text-sm transition flex-shrink-0 ${
                  completed ? 'bg-green-100 text-green-700 cursor-default' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                {completed ? '✓ Completed' : 'Mark Complete'}
              </button>
            )}
          </div>

          {lesson.type === 'text' && lesson.content && (
            <div className="mt-4 bg-gray-50 rounded-xl p-6 border whitespace-pre-wrap text-gray-700">
              {lesson.content}
            </div>
          )}

          <div className="flex items-center gap-3 mt-5 pt-5 border-t">
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold uppercase">{lesson.type}</span>
            {lesson.duration && <span className="text-gray-400 text-sm">⏱ {lesson.duration}</span>}
            {lesson.isPreview && <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">Free Preview</span>}
          </div>
        </div>
      </div>
    );
  };

  const renderAssignment = (assignment) => {
    if (!isItemUnlocked('assignment', assignment._id)) return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <p className="text-gray-600 font-semibold mb-1">Assignment Locked</p>
          <p className="text-gray-400 text-sm">Complete the previous item to unlock</p>
        </div>
      </div>
    );

    const submission = submissionMap[assignment._id];
    const isLate = submission?.submittedAt && new Date(submission.submittedAt) > new Date(assignment.deadline);
    const status = submission
      ? (submission.graded ? 'graded' : isLate ? 'late' : 'pending')
      : (new Date() > new Date(assignment.deadline) ? 'missing' : 'upcoming');

    return (
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-blue-200 text-sm font-semibold mb-1">📝 ASSIGNMENT</p>
              <h2 className="text-2xl font-bold">{assignment.title}</h2>
            </div>
            <ItemStatusBadge status={status} />
          </div>
          <div className="flex gap-4 mt-4 text-sm text-blue-200">
            <span>📅 Due: {new Date(assignment.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            <span>🎯 {assignment.maxGrade} points</span>
          </div>
        </div>

        <div className="p-6">
          <p className="text-gray-600 mb-6">{assignment.description}</p>

          {assignment.attachments?.length > 0 && (
            <div className="mb-6">
              <h3 className="font-bold text-gray-800 mb-3">Attachments</h3>
              <div className="flex flex-wrap gap-3">
                {assignment.attachments.map((att, i) => {
                  const name = att.split('/').pop();
                  return (
                    <a key={i} href={getImageSrc(att)} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition text-sm font-medium text-gray-700">
                      📎 {name}
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {submission?.graded && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-green-800">Grade</h3>
                <span className="text-2xl font-bold text-green-600">{submission.grade} / {assignment.maxGrade}</span>
              </div>
              {submission.feedback && (
                <div className="bg-white rounded-lg p-3 border border-green-100 mt-2">
                  <p className="text-xs font-semibold text-green-700 mb-1">Teacher Feedback:</p>
                  <p className="text-sm text-gray-700">{submission.feedback}</p>
                </div>
              )}
            </div>
          )}

          {submission?.files?.length > 0 && (
            <div className="mb-6">
              <h3 className="font-bold text-gray-800 mb-3">Your Submission</h3>
              {submission.content && (
                <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-4 border mb-3">{submission.content}</p>
              )}
              {submission.files.map((f, i) => (
                <div key={i} className="border border-gray-200 rounded-xl overflow-hidden mb-3">
                  <div className="flex items-center justify-between bg-gray-50 px-4 py-2 border-b">
                    <span className="text-sm font-medium text-gray-700">📄 {f.originalName || f.filename}</span>
                    <a href={getImageSrc(f.path)} target="_blank" rel="noopener noreferrer"
                      className="text-xs bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700">Open ↗</a>
                  </div>
                  {f.mimetype === 'application/pdf' && (
                    <PdfInlineViewer url={getImageSrc(f.path)} title={f.originalName} />
                  )}
                </div>
              ))}
            </div>
          )}

          {isEnrolled && !submission?.graded && (
            <div className="border-t pt-6">
              <h3 className="font-bold text-gray-800 mb-4">
                {submission ? 'Resubmit' : 'Submit Your Work'}
              </h3>
              <textarea value={assignmentText} onChange={e => setAssignmentText(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none mb-4 resize-none"
                rows={5} placeholder="Write your answer or paste a link..." />

              {!assignmentFile ? (
                <label className="flex items-center gap-2 w-fit cursor-pointer mb-4 px-5 py-2.5 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 text-sm text-gray-500 transition">
                  📎 Attach PDF
                  <input type="file" accept="application/pdf" className="hidden"
                    onChange={e => {
                      const f = e.target.files[0];
                      if (f?.type === 'application/pdf') setAssignmentFile(f);
                      else alert('PDF files only');
                    }} />
                </label>
              ) : (
                <div className="mb-4 flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-3">
                  <span className="text-red-500">📄</span>
                  <span className="text-sm font-medium flex-1 truncate">{assignmentFile.name}</span>
                  <button onClick={() => setAssignmentFile(null)} className="text-red-500 hover:text-red-700 text-sm">✕</button>
                </div>
              )}

              <button onClick={handleSubmitAssignment} disabled={submittingAssignment}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50">
                {submittingAssignment ? 'Submitting...' : submission ? 'Resubmit' : 'Hand In'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderQuiz = (quiz) => {
    const existingResult = quizResultMap[quiz._id];

    if (quizSubmitted && quizResult) return (
      <div className="bg-white rounded-xl shadow p-8 text-center">
        <div className="text-6xl mb-4">{quizResult.passed ? '🎉' : '📚'}</div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          {quizResult.passed ? 'Congratulations!' : 'Keep Learning!'}
        </h2>
        <div className="text-5xl font-bold mb-4" style={{ color: quizResult.passed ? '#16a34a' : '#dc2626' }}>
          {quizResult.score?.toFixed(1)}%
        </div>
        <p className="text-gray-500 mb-1">{quizResult.correct} / {quizResult.total} correct</p>
        <p className="text-gray-400 text-sm mb-8">Passing score: {quiz.passingScore}%</p>
        <div className="flex justify-center gap-3">
          <button onClick={() => setQuizSubmitted(false)}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition">
            Back to Quiz
          </button>
          {!quizResult.passed && (
            <button onClick={() => { handleStartQuiz(quiz); setQuizSubmitted(false); }}
              className="px-6 py-2.5 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition">
              Try Again
            </button>
          )}
        </div>
      </div>
    );

    if (!quizAnswers.length || quizAnswers.length !== quiz.questions?.length) return (
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6">
          <p className="text-purple-200 text-sm font-semibold mb-1">❓ QUIZ</p>
          <h2 className="text-2xl font-bold">{quiz.title}</h2>
          <p className="text-purple-200 mt-2">{quiz.description}</p>
          <div className="flex gap-4 mt-4 text-sm text-purple-200">
            <span>📋 {quiz.questions?.length} Questions</span>
            <span>⏱ {quiz.duration} minutes</span>
            <span>✅ Pass: {quiz.passingScore}%</span>
          </div>
        </div>
        <div className="p-6">
          {existingResult && (
            <div className={`mb-6 p-4 rounded-xl border ${existingResult.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <p className="font-semibold text-gray-800">Previous attempt: <span className={existingResult.passed ? 'text-green-600' : 'text-red-600'}>{existingResult.score?.toFixed(1)}% — {existingResult.passed ? 'Passed' : 'Failed'}</span></p>
            </div>
          )}
          {isEnrolled && (
            <button onClick={() => handleStartQuiz(quiz)}
              className="px-8 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition">
              {existingResult ? 'Retake Quiz' : 'Start Quiz'}
            </button>
          )}
        </div>
      </div>
    );

    return (
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="bg-gray-900 px-6 py-3 flex items-center justify-between">
          <h3 className="text-white font-bold">{quiz.title}</h3>
          <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-bold ${
            timeLeft <= 60 ? 'bg-red-500 text-white animate-pulse' :
            timeLeft <= 180 ? 'bg-orange-500 text-white' : 'bg-blue-600 text-white'}`}>
            ⏱ {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}
          </div>
        </div>

        <div className="p-6 space-y-8">
          {quiz.questions.map((q, qi) => (
            <div key={qi} className="border-b pb-6 last:border-0">
              <h4 className="font-semibold text-gray-900 mb-4">{qi + 1}. {q.question}</h4>
              <div className="space-y-2">
                {q.options.map((opt, oi) => (
                  <label key={oi}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                      quizAnswers[qi] === oi ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:bg-gray-50'}`}>
                    <input type="radio" name={`q${qi}`} checked={quizAnswers[qi] === oi}
                      onChange={() => { const a = [...quizAnswers]; a[qi] = oi; setQuizAnswers(a); }}
                      className="accent-blue-600" />
                    <span className="text-gray-700 text-sm">{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
          <button onClick={handleSubmitQuiz}
            className="w-full py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition">
            Submit Quiz
          </button>
        </div>
      </div>
    );
  };

  // ── Sidebar ──────────────────────────────────────────────────────────────────
  const renderSidebar = () => {
    const curriculum = buildCurriculum();

    return (
      <div className="bg-white rounded-xl shadow overflow-hidden h-fit sticky top-4">
        {/* Sidebar header */}
        <div className="bg-gray-900 text-white p-4">
          <h3 className="font-bold text-base">Course Content</h3>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex-1 bg-white/20 rounded-full h-1.5">
              <div className="bg-blue-400 h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-blue-300 text-xs font-bold">{Math.round(progress)}%</span>
          </div>
          <p className="text-gray-400 text-xs mt-1">
            {completedLessons.length}/{course?.lessons?.length || 0} lessons completed
          </p>
          {/* ── FIX: show completion badge in sidebar ─────────────────────── */}
          {isCourseCompleted && (
            <div className="mt-2 flex items-center gap-1.5 bg-green-500/20 border border-green-400/30 rounded-lg px-3 py-1.5">
              <span className="text-green-400 text-sm">🎓</span>
              <span className="text-green-300 text-xs font-semibold">Course Completed!</span>
            </div>
          )}
        </div>

        {/* Sections */}
        <div className="max-h-[calc(100vh-200px)] overflow-y-auto divide-y divide-gray-100">
          {curriculum.map((section) => {
            const expanded = expandedSections[section.index];
            const sectionCompleted = section.lessons.filter(l => idIncludes(completedLessons, l._id)).length;

            return (
              <div key={section.index}>
                <button onClick={() => setExpandedSections(p => ({ ...p, [section.index]: !p[section.index] }))}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition text-left">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-800">{section.title}</p>
                    {!section.isExtra && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {sectionCompleted}/{section.lessons.length} • {section.lessons.reduce((s, l) => s + (l.duration ? parseInt(l.duration) : 0), 0)} min
                      </p>
                    )}
                  </div>
                  <svg className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {expanded && (
                  <div>
                    {/* Lessons */}
                    {section.lessons.map((lesson) => {
                      const unlocked = isItemUnlocked('lesson', lesson._id);
                      const completed = idIncludes(completedLessons, lesson._id);
                      const selected = selectedItem?.type === 'lesson' && idEq(selectedItem?.data?._id, lesson._id);
                      const typeIcon = { video: '▶', pdf: '📄', text: '📝', quiz: '❓' }[lesson.type] || '📄';

                      return (
                        <button key={lesson._id}
                          onClick={() => unlocked && setSelectedItem({ type: 'lesson', data: lesson })}
                          disabled={!unlocked}
                          className={`w-full text-left px-4 py-3 flex items-start gap-3 transition border-l-2 ${
                            selected ? 'bg-blue-50 border-l-blue-600' :
                            completed ? 'border-l-green-400 hover:bg-gray-50' :
                            unlocked ? 'border-l-transparent hover:bg-gray-50' :
                            'border-l-transparent opacity-40 cursor-not-allowed'}`}>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
                            completed ? 'bg-green-500 text-white' :
                            selected ? 'bg-blue-600 text-white' :
                            unlocked ? 'bg-gray-200 text-gray-600' :
                            'bg-gray-100 text-gray-400'}`}>
                            {completed ? '✓' : unlocked ? typeIcon : '🔒'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${selected ? 'text-blue-600' : 'text-gray-800'}`}>
                              {lesson.title}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-gray-400 capitalize">{lesson.type}</span>
                              {lesson.duration && <span className="text-xs text-gray-400">{lesson.duration}</span>}
                              {lesson.isPreview && <span className="text-xs text-blue-500 font-semibold">Preview</span>}
                            </div>
                          </div>
                        </button>
                      );
                    })}

                    {/* Assignments */}
                    {section.isExtra && section.assignments?.map((assignment) => {
                      const sub = submissionMap[assignment._id];
                      const selected = selectedItem?.type === 'assignment' && idEq(selectedItem?.data?._id, assignment._id);
                      const status = sub ? (sub.graded ? 'graded' : 'pending') : 'upcoming';
                      const unlocked = isItemUnlocked('assignment', assignment._id);

                      return (
                        <button key={assignment._id}
                          onClick={() => unlocked && setSelectedItem({ type: 'assignment', data: assignment })}
                          disabled={!unlocked}
                          className={`w-full text-left px-4 py-3 flex items-start gap-3 transition border-l-2 ${
                            selected ? 'bg-blue-50 border-l-blue-600' :
                            unlocked ? 'border-l-transparent hover:bg-gray-50' :
                            'border-l-transparent opacity-40 cursor-not-allowed'}`}>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5 ${
                            selected ? 'bg-blue-600 text-white' : 'bg-orange-100 text-orange-600'}`}>
                            📝
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${selected ? 'text-blue-600' : 'text-gray-800'}`}>
                              {assignment.title}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-gray-400">Assignment</span>
                              <ItemStatusBadge status={status} />
                            </div>
                          </div>
                        </button>
                      );
                    })}

                    {/* Quizzes */}
                    {section.isExtra && section.quizzes?.map((quiz) => {
                      const result = quizResultMap[quiz._id];
                      const selected = selectedItem?.type === 'quiz' && idEq(selectedItem?.data?._id, quiz._id);
                      const unlocked = isItemUnlocked('quiz', quiz._id);

                      return (
                        <button key={quiz._id}
                          onClick={() => unlocked && setSelectedItem({ type: 'quiz', data: quiz })}
                          disabled={!unlocked}
                          className={`w-full text-left px-4 py-3 flex items-start gap-3 transition border-l-2 ${
                            selected ? 'bg-blue-50 border-l-blue-600' :
                            unlocked ? 'border-l-transparent hover:bg-gray-50' :
                            'border-l-transparent opacity-40 cursor-not-allowed'}`}>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5 ${
                            selected ? 'bg-blue-600 text-white' : 'bg-purple-100 text-purple-600'}`}>
                            ❓
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${selected ? 'text-blue-600' : 'text-gray-800'}`}>
                              {quiz.title}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-gray-400">{quiz.questions?.length} questions</span>
                              {result && (
                                <span className={`text-xs font-bold ${result.passed ? 'text-green-600' : 'text-red-600'}`}>
                                  {result.score?.toFixed(0)}%
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ── Loading / Error ──────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4" />
        <p className="text-gray-500">Loading course...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-center">
      <div className="text-5xl mb-4">⚠️</div>
      <p className="text-red-500 text-lg mb-4">{error}</p>
      <button onClick={() => navigate('/courses')} className="text-blue-600 hover:text-blue-800">← Back to Courses</button>
    </div>
  );

  if (!course) return null;

  const averageRating = course.averageRating || 0;
  const totalRatings = course.totalRatings || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-gray-900 text-white sticky top-0 z-40 shadow">
        <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center gap-4">
          <button onClick={() => navigate('/courses')} className="text-gray-400 hover:text-white transition text-sm flex items-center gap-1">
            ← Courses
          </button>
          <div className="h-4 w-px bg-gray-700" />
          <h1 className="font-bold text-sm truncate flex-1">{course.title}</h1>
          {/* ── FIX: show completion badge in top bar ──────────────────────── */}
          {isCourseCompleted && (
            <span className="hidden sm:flex items-center gap-1 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">
              🎓 Completed
            </span>
          )}
          {user && (
            <button
              onClick={handleBookmark}
              title={isBookmarked ? 'Remove bookmark' : 'Save for later'}
              className={`transition ${isBookmarked ? 'text-yellow-400' : 'text-gray-400 hover:text-yellow-300'}`}
            >
              <svg className="w-5 h-5" fill={isBookmarked ? 'currentColor' : 'none'}
                stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-4-7 4V5z" />
              </svg>
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className="w-24 bg-gray-700 rounded-full h-1.5">
              <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-xs text-gray-400">{Math.round(progress)}%</span>
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Main content */}
          <div className="lg:col-span-2 space-y-4">
            {renderContent()}

            {/* Course Info Card */}
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900">{course.title}</h2>
                  <p className="text-gray-500 mt-1">{course.description}</p>
                  <div className="flex flex-wrap gap-3 mt-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                        {course.instructor?.name?.charAt(0)}
                      </div>
                      <span className="text-sm text-gray-700 font-medium">{course.instructor?.name}</span>
                    </div>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">{course.level}</span>
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">{course.category}</span>
                    <div className="flex items-center gap-1 text-sm">
                      <span className="text-yellow-400">★</span>
                      <span className="font-bold text-gray-800">{averageRating.toFixed(1)}</span>
                      <span className="text-gray-400">({totalRatings})</span>
                    </div>
                    <span className="text-gray-400 text-sm">👥 {course.enrolledStudents?.length || 0}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">{course.price === 0 ? 'Free' : `$${course.price}`}</p>
                  {!isEnrolled && course.isPublished && (
                    <button onClick={handleEnroll}
                      className="mt-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition">
                      {course.price === 0 ? 'Enroll Free' : 'Buy Course'}
                    </button>
                  )}
                  {isEnrolled && (
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-green-600 font-semibold text-sm">✓ Enrolled</span>
                      {/* ── FIX: show completed badge in course info card ─── */}
                      {isCourseCompleted && (
                        <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold">
                          🎓 Course Completed!
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Reviews */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-5">
                Student Reviews ({course.ratings?.length || 0})
              </h2>
              {course.ratings?.length > 0 ? (
                <div className="space-y-4 mb-6">
                  {course.ratings.map((r, i) => (
                    <div key={i} className="flex items-start gap-3 border-b pb-4 last:border-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                        {r.user?.name?.charAt(0) || 'U'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-gray-900 text-sm">{r.user?.name || 'Anonymous'}</span>
                          <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex mt-0.5">{[...Array(5)].map((_, j) => (
                          <span key={j} className={j < r.rating ? 'text-yellow-400' : 'text-gray-200'}>★</span>
                        ))}</div>
                        <p className="text-gray-600 text-sm mt-1">{r.comment}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm mb-6">No reviews yet. Be the first!</p>
              )}

              {user && isEnrolled && (
                <div className="border-t pt-5">
                  <h3 className="font-bold text-gray-800 mb-4">Write a Review</h3>
                  <select value={review.rating} onChange={e => setReview({ ...review, rating: parseInt(e.target.value) })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm mb-3 focus:ring-2 focus:ring-blue-500 outline-none">
                    {[5, 4, 3, 2, 1].map(n => (
                      <option key={n} value={n}>{'★'.repeat(n)} {n} Star{n > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                  <textarea value={review.comment} onChange={e => setReview({ ...review, comment: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    rows={4} placeholder="Share your experience..." />
                  <button onClick={handleReview} disabled={submittingReview}
                    className="mt-3 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50">
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {renderSidebar()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;