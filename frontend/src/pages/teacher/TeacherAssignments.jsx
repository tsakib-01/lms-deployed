// pages/teacher/TeacherAssignments.jsx
import { useState, useEffect } from 'react';
import { 
  ClipboardList, Search, RefreshCw, Calendar, Users, 
  CheckCircle2, Clock, FileText 
} from 'lucide-react';

const API = import.meta.env.VITE_BACKEND_URL;

const getFileSrc = (path) => {
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
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-900 border-t-transparent" />
        <span className="text-gray-500 font-medium mt-2 text-xs">Loading PDF inline...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-48 bg-red-50 rounded-xl border border-red-200 p-6 text-center">
        <div className="text-3xl mb-2">⚠️</div>
        <p className="text-gray-700 font-semibold mb-2 text-xs">Could not display PDF inline</p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-[10px] font-bold transition"
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
      style={{ height: '400px' }}
      title={title}
    />
  );
};

const SubmissionCard = ({ submission, onGrade }) => {
  const [grade, setGrade] = useState(submission.grade !== undefined && submission.grade !== null ? submission.grade : '');
  const [feedback, setFeedback] = useState(submission.feedback || '');
  const [showGradeForm, setShowGradeForm] = useState(false);

  useEffect(() => {
    setGrade(submission.grade !== undefined && submission.grade !== null ? submission.grade : '');
    setFeedback(submission.feedback || '');
  }, [submission]);

  const handleGrade = () => {
    if (grade === '') {
      alert('Please enter a grade');
      return;
    }
    onGrade(submission._id, grade, feedback);
    setShowGradeForm(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4 hover:shadow-md transition">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold text-slate-900 text-base">{submission.assignment?.title}</h3>
          <p className="text-slate-600 text-xs mt-1">Student: <span className="font-medium text-slate-800">{submission.student?.name}</span> ({submission.student?.email})</p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Submitted: {new Date(submission.submittedAt).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {submission.graded ? (
            <div className="text-right">
              <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-bold">
                Graded: {submission.grade}/{submission.assignment?.maxGrade || 100}
              </span>
              {submission.feedback && (
                <p className="text-[10px] text-slate-500 mt-1 italic max-w-[200px] truncate">
                  "{submission.feedback}"
                </p>
              )}
            </div>
          ) : (
            <span className="text-xs bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full font-bold">
              Pending Grade
            </span>
          )}
          <button
            onClick={() => setShowGradeForm(!showGradeForm)}
            className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-slate-800 transition"
          >
            {showGradeForm ? 'Cancel' : submission.graded ? 'Change Grade' : 'Grade Submission'}
          </button>
        </div>
      </div>

      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-slate-800">
        <p className="font-semibold text-[10px] text-slate-400 uppercase tracking-wide mb-2">Student Notes / Submission Content</p>
        <p className="whitespace-pre-wrap font-sans text-slate-700 text-sm">{submission.content}</p>

        {submission.files && submission.files.length > 0 && (
          <div className="mt-4 space-y-3">
            <p className="text-xs font-semibold text-slate-500">📎 Submitted Files:</p>
            {submission.files.map((file, index) => (
              <div key={index} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                <div className="flex items-center justify-between bg-slate-50/50 px-4 py-2 border-b border-slate-100">
                  <div className="flex items-center gap-2 max-w-[70%]">
                    <svg className="w-4 h-4 text-rose-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 18h12V6h-4V2H4v16zm8-17.4L15.4 4H12V.6zM2 0v20h16V5l-5-5H2z"/>
                    </svg>
                    <span className="text-xs font-medium text-slate-750 truncate">
                      {file.originalName || file.filename}
                    </span>
                    <span className="text-[10px] text-slate-400 flex-shrink-0">
                      ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <a 
                    href={getFileSrc(file.path)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-lg hover:bg-slate-250 transition flex items-center gap-1 font-semibold border border-slate-200"
                  >
                    Open ↗
                  </a>
                </div>

                {file.mimetype === 'application/pdf' && (
                  <PdfInlineViewer url={getFileSrc(file.path)} title={file.originalName || file.filename} />
                )}

                {file.mimetype?.startsWith('image/') && (
                  <img
                    src={getFileSrc(file.path)}
                    alt={file.originalName}
                    className="w-full max-h-64 object-contain p-2"
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showGradeForm && (
        <div className="border-t border-slate-100 pt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Grade (0-100)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 outline-none text-sm transition"
                placeholder="e.g. 95"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              Feedback (Optional)
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 outline-none text-sm transition resize-none"
              rows="3"
              placeholder="Good job! Focus on layout next time..."
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleGrade}
              className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-xs font-semibold hover:bg-emerald-700 transition"
            >
              Submit Grade
            </button>
            <button
              onClick={() => setShowGradeForm(false)}
              className="bg-slate-100 text-slate-700 px-5 py-2.5 rounded-xl text-xs font-semibold hover:bg-slate-200 transition border border-slate-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const TeacherAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('assignments');
  const [subTab, setSubTab] = useState('pending'); // 'pending' | 'graded' | 'all'
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchAssignments();
    fetchSubmissions();
  }, []);

  const fetchAssignments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/api/teacher/assignments`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAssignments(data.assignments || []);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/api/teacher/submissions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSubmissions(data.submissions || []);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
    }
  };

  const gradeSubmission = async (submissionId, grade, feedback) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/api/teacher/submissions/${submissionId}/grade`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ grade, feedback })
      });

      if (response.ok) {
        fetchSubmissions();
      }
    } catch (error) {
      console.error('Error grading submission:', error);
    }
  };

  const pendingSubmissions = submissions.filter(s => !s.graded);
  const gradedSubmissions = submissions.filter(s => s.graded);
  const gradedSubmissionsCount = gradedSubmissions.length;

  const filteredAssignments = assignments.filter(a => 
    !search || 
    a.title?.toLowerCase()?.includes(search.toLowerCase()) || 
    a.course?.title?.toLowerCase()?.includes(search.toLowerCase())
  );

  const filteredSubmissions = (
    subTab === 'pending' ? pendingSubmissions :
    subTab === 'graded' ? gradedSubmissions : submissions
  ).filter(s => 
    !search || 
    s.assignment?.title?.toLowerCase()?.includes(search.toLowerCase()) || 
    s.student?.name?.toLowerCase()?.includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-slate-300 border-t-slate-900" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 leading-tight">Assignments & Submissions</h1>
                <p className="text-xs text-slate-500">View assignments and grade student submissions</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Total Assignments', value: assignments.length, bg: 'bg-slate-900', text: 'text-slate-900', icon: ClipboardList },
            { label: 'Pending Grading', value: pendingSubmissions.length, bg: 'bg-amber-500', text: 'text-amber-600', icon: Clock },
            { label: 'Graded Work', value: gradedSubmissionsCount, bg: 'bg-emerald-600', text: 'text-emerald-600', icon: CheckCircle2 },
          ].map(({ label, value, bg, text, icon: Icon }) => (
            <div key={label} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-500">{label}</span>
                <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
              </div>
              <span className={`text-3xl font-bold ${text}`}>{value}</span>
            </div>
          ))}
        </div>

        {/* Filter + Search */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Tabs */}
            <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
              {[
                { k: 'assignments', label: `Assignments (${assignments.length})` },
                { k: 'submissions', label: `Pending Submissions (${pendingSubmissions.length})` },
              ].map(({ k, label }) => (
                <button key={k} onClick={() => setActiveTab(k)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === k ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}>
                  {label}
                </button>
              ))}
            </div>

            {/* Search + Refresh */}
            <div className="flex gap-3 sm:ml-auto items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder={activeTab === 'assignments' ? "Search assignments..." : "Search submissions..."} value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 w-52 transition-all bg-white" />
              </div>
              <button onClick={() => { fetchAssignments(); fetchSubmissions(); }}
                className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 font-medium px-2 py-1.5 rounded-lg hover:bg-slate-100">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* List Content */}
          {activeTab === 'assignments' ? (
            filteredAssignments.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-7 h-7 text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-600 mb-1">No assignments found</p>
                <p className="text-xs text-slate-400">
                  {search ? 'Try a different search term' : 'Assignments can be created in the course editor.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredAssignments.map(assignment => (
                  <div key={assignment._id} className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-slate-50/50 transition-colors group">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="w-10 h-10 bg-orange-50 text-orange-700 rounded-xl flex items-center justify-center flex-shrink-0 font-semibold text-lg">
                        📝
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{assignment.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{assignment.description}</p>
                        <div className="flex flex-wrap gap-4 text-xs text-slate-400 mt-2.5">
                          <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-semibold">📚 {assignment.course?.title || 'N/A'}</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" /> Due: {new Date(assignment.deadline).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-slate-400" /> {assignment.submissions?.length || 0} Submissions
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      <button
                        onClick={() => {
                          setActiveTab('submissions');
                          setSubTab('all');
                          setSearch(assignment.title);
                        }}
                        className="inline-flex items-center gap-1.5 text-xs bg-slate-105 hover:bg-slate-200 text-slate-705 px-3 py-2 rounded-xl font-bold border border-slate-200 transition"
                      >
                        View Submissions ↗
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="flex flex-col">
              <div className="bg-slate-50 border-b border-slate-100 px-6 py-3 flex gap-2">
                {[
                  { k: 'pending', label: `Pending Grading (${pendingSubmissions.length})` },
                  { k: 'graded',  label: `Graded (${gradedSubmissions.length})` },
                  { k: 'all',     label: `All Submissions (${submissions.length})` },
                ].map(sub => (
                  <button
                    key={sub.k}
                    onClick={() => setSubTab(sub.k)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      subTab === sub.k 
                        ? 'bg-slate-900 text-white shadow-sm' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>

              {filteredSubmissions.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-7 h-7 text-slate-400" />
                  </div>
                  <p className="text-sm font-medium text-slate-600 mb-1">No submissions found</p>
                  <p className="text-xs text-slate-400">There are no submissions matching this filter.</p>
                </div>
              ) : (
                <div className="p-6 space-y-6 bg-slate-50/50">
                  {filteredSubmissions.map(submission => (
                    <SubmissionCard
                      key={submission._id}
                      submission={submission}
                      onGrade={gradeSubmission}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherAssignments;