// pages/teacher/TeacherDashboard.jsx
// Merged: TeacherDashboard + TeacherCourses into one unified page

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  BookOpen, Users, ClipboardList, CheckSquare,
  Plus, FileText, HelpCircle, LayoutDashboard,
  RefreshCw, ArrowRight, GraduationCap, TrendingUp,
  Clock, AlertCircle, ToggleLeft, ToggleRight,
  Trash2, Edit, Search
} from 'lucide-react';

const API = import.meta.env.VITE_BACKEND_URL;

const TeacherDashboard = () => {
  const { user } = useAuth();

  // ── Dashboard state ──────────────────────────────────────────────
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    pendingSubmissions: 0,
    activeCourses: 0,
    totalEarnings: 0,
    totalSales: 0
  });
  const [loading, setLoading] = useState(true);

  // ── Courses state ────────────────────────────────────────────────
  const [courses, setCourses]   = useState([]);
  const [filter, setFilter]     = useState('all');
  const [search, setSearch]     = useState('');
  const [success, setSuccess]   = useState('');
  const [error, setError]       = useState('');

  useEffect(() => { fetchAll(); }, []);

  const notify = (type, msg) => {
    if (type === 'success') { setSuccess(msg); setTimeout(() => setSuccess(''), 4000); }
    else                    { setError(msg);   setTimeout(() => setError(''),   4000); }
  };

  // Fetch dashboard stats + courses in parallel
  const fetchAll = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [dashRes, coursesRes] = await Promise.all([
        fetch(`${API}/api/teacher/dashboard`, { headers }),
        fetch(`${API}/api/teacher/courses`,   { headers }),
      ]);

      if (dashRes.ok) {
        const data = await dashRes.json();
        setStats(data.stats);
      }
      if (coursesRes.ok) {
        const data = await coursesRes.json();
        setCourses(data.courses || []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const togglePublish = async (courseId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/teacher/courses/${courseId}/publish`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !currentStatus })
      });
      if (res.ok) {
        fetchAll();
        notify('success', `Course ${!currentStatus ? 'published' : 'unpublished'} successfully`);
      }
    } catch { notify('error', 'Failed to update course'); }
  };

  const deleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/teacher/courses/${courseId}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) { fetchAll(); notify('success', 'Course deleted successfully'); }
    } catch { notify('error', 'Failed to delete course'); }
  };

  const filteredCourses = courses.filter(c => {
    const matchFilter =
      filter === 'published' ? c.isPublished :
      filter === 'draft'     ? !c.isPublished : true;
    const matchSearch = !search || c.title?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const publishedCount = courses.filter(c => c.isPublished).length;
  const draftCount     = courses.filter(c => !c.isPublished).length;

  const card = "bg-white rounded-2xl shadow-sm border border-slate-200";

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-500">Loading dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center">
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 leading-tight">Teacher Dashboard</h1>
                <p className="text-xs text-slate-500">Welcome back, {user?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/teacher/courses/create"
                className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-800 transition shadow-sm"
              >
                <Plus className="w-4 h-4" /> Create Course
              </Link>
              <button
                onClick={fetchAll}
                className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 font-medium px-3 py-1.5 rounded-lg hover:bg-slate-100 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh
              </button>
              <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-slate-600" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* ── Notifications ───────────────────────────────────────────────── */}
        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-sm font-medium">
            ✓ {success}
          </div>
        )}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl text-sm font-medium">
            ✕ {error}
          </div>
        )}

        {/* ── Stats Grid ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: 'Total Courses',        value: stats.totalCourses,        icon: BookOpen,      bg: 'bg-slate-900',   text: 'text-slate-900' },
            { label: 'Total Students',        value: stats.totalStudents,        icon: Users,         bg: 'bg-teal-600',    text: 'text-teal-600' },
            { label: 'Pending Submissions',   value: stats.pendingSubmissions,   icon: ClipboardList, bg: 'bg-amber-500',   text: 'text-amber-600' },
            { label: 'Active Courses',        value: stats.activeCourses,        icon: CheckSquare,   bg: 'bg-sky-600',     text: 'text-sky-600' },
            { label: 'Total Net Earnings',    value: `$${stats.totalEarnings !== undefined ? stats.totalEarnings.toFixed(2) : '0.00'}`, icon: TrendingUp, bg: 'bg-emerald-600', text: 'text-emerald-600' },
          ].map(({ label, value, icon: Icon, bg, text }) => (
            <div key={label} className={`${card} p-6 hover:shadow-md transition-shadow`}>
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

        {/* ── Quick Actions ────────────────────────────────────────────────── */}
        <div className={`${card} p-6`}>
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <div className="w-6 h-6 bg-slate-100 rounded-md flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-slate-600" />
            </div>
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                to: '/teacher/courses/create',
                icon: Plus,
                iconBg: 'bg-slate-900',
                cardBg: 'hover:bg-slate-50',
                title: 'Create New Course',
                desc: 'Start building a new course',
              },
              {
                to: '/teacher/assignments',
                icon: FileText,
                iconBg: 'bg-teal-600',
                cardBg: 'hover:bg-teal-50/50',
                title: 'View Assignments',
                desc: 'Check student submissions',
              },
              {
                to: '/teacher/quizzes',
                icon: HelpCircle,
                iconBg: 'bg-sky-600',
                cardBg: 'hover:bg-sky-50/50',
                title: 'Create Quiz',
                desc: 'Add new quiz to courses',
              },
            ].map(({ to, icon: Icon, iconBg, cardBg, title, desc }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-4 p-4 border border-slate-200 rounded-xl ${cardBg} transition-all hover:shadow-sm group`}
              >
                <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>

        {/* ── Pending Submissions Alert ────────────────────────────────────── */}
        {stats.pendingSubmissions > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-900">
                  {stats.pendingSubmissions} submission{stats.pendingSubmissions !== 1 ? 's' : ''} awaiting review
                </p>
                <p className="text-xs text-amber-700 mt-0.5">Students are waiting for feedback on their work</p>
              </div>
            </div>
            <Link
              to="/teacher/assignments"
              className="inline-flex items-center gap-1.5 bg-amber-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-amber-700 transition flex-shrink-0"
            >
              Review Now
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* ── My Courses (full management, merged from TeacherCourses) ────── */}
        <div className={`${card} overflow-hidden`}>

          {/* Section header */}
          <div className="px-6 py-4 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Title + mini-stats */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-slate-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">My Courses</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-500">{courses.length} total</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-xs text-emerald-600 font-medium">{publishedCount} published</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-xs text-amber-600 font-medium">{draftCount} drafts</span>
                  </div>
                </div>
              </div>

              {/* Filter tabs + search */}
              <div className="flex flex-col sm:flex-row gap-3 sm:ml-auto items-start sm:items-center">
                <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
                  {[
                    { k: 'all',       label: `All (${courses.length})` },
                    { k: 'published', label: `Published (${publishedCount})` },
                    { k: 'draft',     label: `Drafts (${draftCount})` },
                  ].map(({ k, label }) => (
                    <button key={k} onClick={() => setFilter(k)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        filter === k ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                      }`}>
                      {label}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search courses..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9 pr-4 py-1.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 w-44 transition-all bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Courses list */}
          {filteredCourses.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-7 h-7 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-600 mb-1">No courses found</p>
              <p className="text-xs text-slate-400 mb-5">
                {search ? 'Try a different search term' : 'Create your first course to get started'}
              </p>
              <Link
                to="/teacher/courses/create"
                className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-800 transition"
              >
                <Plus className="w-4 h-4" /> Create Course
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredCourses.map(course => (
                <div
                  key={course._id}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/50 transition-colors group"
                >
             <div className="w-14 h-14 rounded-xl bg-slate-100 flex-shrink-0 overflow-hidden border border-slate-200">
  {course.thumbnail?.startsWith('http') ? (
    <img
      src={course.thumbnail}
      alt={course.title}
      className="w-full h-full object-cover"
    />
  ) : (
    <div className="w-full h-full flex items-center justify-center">
      <BookOpen className="w-6 h-6 text-slate-400" />
    </div>
  )}
</div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{course.title}</p>
                    <p className="text-xs text-slate-400 truncate mt-0.5 line-clamp-1">{course.description}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Users className="w-3 h-3" />
                        {course.enrolledStudents?.length || 0} students
                      </span>
                      <span className="text-xs text-slate-400">
                        {course.lessons?.length || 0} lessons
                      </span>
                      {course.pendingSubmissions > 0 && (
                        <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                          <Clock className="w-3 h-3" />
                          {course.pendingSubmissions} pending
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status badge */}
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold flex-shrink-0 ${
                    course.isPublished ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${course.isPublished ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    {course.isPublished ? 'Published' : 'Draft'}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link
                      to={`/teacher/courses/${course._id}/edit`}
                      className="inline-flex items-center gap-1.5 text-slate-600 hover:text-white hover:bg-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    >
                      <Edit className="w-3.5 h-3.5" /> Edit
                    </Link>
                    <button
                      onClick={() => togglePublish(course._id, course.isPublished)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        course.isPublished
                          ? 'text-amber-700 hover:text-white hover:bg-amber-500 bg-amber-50'
                          : 'text-emerald-700 hover:text-white hover:bg-emerald-600 bg-emerald-50'
                      }`}
                    >
                      {course.isPublished
                        ? <><ToggleRight className="w-3.5 h-3.5" />Unpublish</>
                        : <><ToggleLeft  className="w-3.5 h-3.5" />Publish</>}
                    </button>
                    <button
                      onClick={() => deleteCourse(course._id)}
                      className="inline-flex items-center gap-1.5 text-rose-700 hover:text-white hover:bg-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default TeacherDashboard;