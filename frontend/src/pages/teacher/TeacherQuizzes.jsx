// pages/teacher/TeacherQuizzes.jsx
import { useState, useEffect } from 'react';
import { 
  HelpCircle, Search, RefreshCw, Users, 
  Award, Trophy, Clock, ChevronRight 
} from 'lucide-react';

const API = import.meta.env.VITE_BACKEND_URL;

// ══════════════════════════════════════════════════════════════════════════════
// QUIZ RESULTS MODAL
// ══════════════════════════════════════════════════════════════════════════════
const QuizResultsModal = ({ quiz, onClose }) => {
  const [attempts, setAttempts]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [expandedIdx, setExpandedIdx] = useState(null);

  useEffect(() => {
    fetch(`${API}/api/teacher/quizzes/${quiz._id}/results`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(r => r.json())
      .then(d => setAttempts(d.attempts || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [quiz._id]);

  // Stats
  const total     = attempts.length;
  const passed    = attempts.filter(a => a.passed).length;
  const avgScore  = total ? (attempts.reduce((s, a) => s + a.score, 0) / total).toFixed(1) : '—';
  const passRate  = total ? Math.round((passed / total) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-6 rounded-t-2xl">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold">{quiz.title}</h2>
              <p className="text-slate-350 text-sm mt-1">{quiz.course?.title}</p>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white text-2xl">✕</button>
          </div>
          {/* Summary stats */}
          <div className="grid grid-cols-4 gap-3 mt-5">
            {[
              { label: 'Total Attempts', value: total },
              { label: 'Passed',         value: passed },
              { label: 'Pass Rate',      value: `${passRate}%` },
              { label: 'Avg Score',      value: `${avgScore}%` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/10 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-slate-300 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="py-12 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-900 border-t-transparent mx-auto mb-3" />
              <p className="text-gray-400">Loading results...</p>
            </div>
          ) : attempts.length === 0 ? (
            <div className="py-12 text-center">
              <div className="text-5xl mb-3">📊</div>
              <p className="text-gray-500 font-semibold">No attempts yet</p>
              <p className="text-gray-400 text-sm mt-1">Results will appear here once students take the quiz.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-805 text-sm">Student Attempts</h3>
                <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full font-semibold">
                  Passing score: {quiz.passingScore}%
                </span>
              </div>

              {attempts.map((attempt, i) => (
                <div key={i} className="border border-slate-205 rounded-2xl overflow-hidden bg-white">
                  {/* Row */}
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition"
                    onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {attempt.student?.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{attempt.student?.name || 'Unknown'}</p>
                        <p className="text-xs text-slate-400">{attempt.student?.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className={`text-sm font-bold ${attempt.passed ? 'text-green-600' : 'text-rose-500'}`}>
                          {Math.round(attempt.score)}%
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {new Date(attempt.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${attempt.passed ? 'bg-green-105 text-green-700' : 'bg-rose-105 text-rose-600'}`}>
                        {attempt.passed ? 'Passed' : 'Failed'}
                      </span>
                      <span className="text-slate-400 text-xs">{expandedIdx === i ? '▲' : '▼'}</span>
                    </div>
                  </div>

                  {/* Expanded: per-question breakdown */}
                  {expandedIdx === i && (
                    <div className="px-4 pb-4 bg-slate-50 border-t border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-3 mb-2">Answer Breakdown</p>
                      <div className="space-y-2">
                        {quiz.questions?.map((q, qi) => {
                          const selected = attempt.answers?.[qi];
                          const isCorrect = selected === q.correctAnswer;
                          return (
                            <div key={qi} className={`rounded-xl p-3 border text-sm ${isCorrect ? 'bg-green-50/50 border-green-200' : 'bg-rose-50/50 border-rose-200'}`}>
                              <p className="font-semibold text-slate-805 mb-1.5">{qi + 1}. {q.question}</p>
                              <div className="grid grid-cols-2 gap-1.5">
                                {q.options.map((opt, oi) => {
                                  const isSelected = oi === selected;
                                  const isAnswer   = oi === q.correctAnswer;
                                  return (
                                    <div key={oi} className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1
                                      ${isAnswer   ? 'bg-green-200 text-green-900 font-semibold' : ''}
                                      ${isSelected && !isAnswer ? 'bg-rose-200 text-rose-900 font-semibold' : ''}
                                      ${!isSelected && !isAnswer ? 'bg-white text-slate-500 border border-slate-100' : ''}`}>
                                      {String.fromCharCode(65 + oi)}. {opt}
                                      {isAnswer   && <span className="ml-auto">✓</span>}
                                      {isSelected && !isAnswer && <span className="ml-auto">✗</span>}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TeacherQuizzes = () => {
  const [quizzes, setQuizzes]               = useState([]);
  const [loading, setLoading]               = useState(true);
  const [resultsQuiz, setResultsQuiz]       = useState(null);
  const [search, setSearch]                 = useState('');

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/teacher/quizzes`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      const data = await res.json();
      setQuizzes(data.quizzes || []);
    } catch (err) { console.error('Error fetching quizzes:', err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchQuizzes(); }, []);

  const totalAttempts = quizzes.reduce((acc, q) => acc + (q.attempts?.length || 0), 0);
  let totalScoreSum = 0;
  let attemptCount = 0;
  quizzes.forEach(q => {
    (q.attempts || []).forEach(att => {
      totalScoreSum += att.score;
      attemptCount++;
    });
  });
  const globalAvgScore = attemptCount ? `${Math.round(totalScoreSum / attemptCount)}%` : '—';

  const filteredQuizzes = quizzes.filter(q =>
    !search || 
    q.title?.toLowerCase()?.includes(search.toLowerCase()) || 
    q.course?.title?.toLowerCase()?.includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-2 border-slate-300 border-t-slate-900" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 leading-tight">Quizzes & Results</h1>
                <p className="text-xs text-slate-500">Track and analyze quiz scores for your students</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Total Quizzes', value: quizzes.length, bg: 'bg-slate-900', text: 'text-slate-900', icon: HelpCircle },
            { label: 'Total Attempts', value: totalAttempts, bg: 'bg-indigo-600', text: 'text-indigo-650', icon: Users },
            { label: 'Average Score', value: globalAvgScore, bg: 'bg-emerald-600', text: 'text-emerald-600', icon: Trophy },
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
            <div className="flex items-center">
              <span className="text-sm font-bold text-slate-700">Quiz Inventory</span>
            </div>

            {/* Search + Refresh */}
            <div className="flex gap-3 sm:ml-auto items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Search quizzes..." value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 w-52 transition-all bg-white" />
              </div>
              <button onClick={fetchQuizzes}
                className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 font-medium px-2 py-1.5 rounded-lg hover:bg-slate-100">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* List Content */}
          {filteredQuizzes.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <HelpCircle className="w-7 h-7 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-600 mb-1">No quizzes found</p>
              <p className="text-xs text-slate-400">
                {search ? 'Try a different search term' : 'Quizzes can be created in the course editor.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredQuizzes.map(quiz => (
                <div key={quiz._id} className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-slate-50/50 transition-colors group">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="w-10 h-10 bg-purple-50 text-purple-750 rounded-xl flex items-center justify-center flex-shrink-0 font-semibold text-lg">
                      ❓
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{quiz.title}</p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{quiz.description}</p>
                      <div className="flex flex-wrap gap-4 text-xs text-slate-400 mt-2">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-semibold">📚 {quiz.course?.title || 'N/A'}</span>
                        <span>❓ {quiz.questions?.length || 0} Questions</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" /> {quiz.duration} min
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-slate-400" /> {quiz.attempts?.length || 0} Student Attempts
                        </span>
                        <span>🎯 Pass score: {quiz.passingScore}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setResultsQuiz(quiz)}
                      className="inline-flex items-center gap-1.5 text-emerald-700 hover:text-white hover:bg-emerald-600 bg-emerald-50 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border border-emerald-100"
                    >
                      📊 Results
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Results Modal */}
      {resultsQuiz && (
        <QuizResultsModal quiz={resultsQuiz} onClose={() => setResultsQuiz(null)} />
      )}
    </div>
  );
};

export default TeacherQuizzes;