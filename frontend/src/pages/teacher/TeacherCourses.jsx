// pages/teacher/TeacherCourses.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, Plus, Users, ToggleLeft, ToggleRight,
  Trash2, Edit, RefreshCw, Search, ChevronDown, LayoutDashboard
} from 'lucide-react';

const API = import.meta.env.VITE_BACKEND_URL;

const TeacherCourses = () => {
  const [courses, setCourses]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('all');
  const [search, setSearch]     = useState('');
  const [success, setSuccess]   = useState('');
  const [error, setError]       = useState('');

  useEffect(() => { fetchCourses(); }, []);

  const notify = (type, msg) => {
    if (type === 'success') { setSuccess(msg); setTimeout(() => setSuccess(''), 4000); }
    else                    { setError(msg);   setTimeout(() => setError(''),   4000); }
  };

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/teacher/courses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) { const data = await res.json(); setCourses(data.courses || []); }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const togglePublish = async (courseId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/teacher/courses/${courseId}/publish`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !currentStatus })
      });
      if (res.ok) { fetchCourses(); notify('success', `Course ${!currentStatus ? 'published' : 'unpublished'} successfully`); }
    } catch (err) { notify('error', 'Failed to update course'); }
  };

  const deleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/teacher/courses/${courseId}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) { fetchCourses(); notify('success', 'Course deleted successfully'); }
    } catch (err) { notify('error', 'Failed to delete course'); }
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

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 leading-tight">My Courses</h1>
                <p className="text-xs text-slate-500">Manage and create your courses</p>
              </div>
            </div>
            <Link
              to="/teacher/courses/create"
              className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-800 transition shadow-sm"
            >
              <Plus className="w-4 h-4" /> Create Course
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Notifications */}
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

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Total Courses',     value: courses.length,   bg: 'bg-slate-900', text: 'text-slate-900' },
            { label: 'Published',         value: publishedCount,   bg: 'bg-emerald-600', text: 'text-emerald-600' },
            { label: 'Drafts',            value: draftCount,       bg: 'bg-amber-500', text: 'text-amber-600' },
          ].map(({ label, value, bg, text }) => (
            <div key={label} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-500">{label}</span>
                <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center`}>
                  <BookOpen className="w-4 h-4 text-white" />
                </div>
              </div>
              <span className={`text-3xl font-bold ${text}`}>{value}</span>
            </div>
          ))}
        </div>

        {/* Filter + Search */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Filter tabs */}
            <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
              {[
                { k: 'all',       label: `All (${courses.length})` },
                { k: 'published', label: `Published (${publishedCount})` },
                { k: 'draft',     label: `Drafts (${draftCount})` },
              ].map(({ k, label }) => (
                <button key={k} onClick={() => setFilter(k)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    filter === k ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}>
                  {label}
                </button>
              ))}
            </div>

            {/* Search + Refresh */}
            <div className="flex gap-3 sm:ml-auto items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Search courses..." value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 w-52 transition-all bg-white" />
              </div>
              <button onClick={fetchCourses}
                className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 font-medium px-2 py-1.5 rounded-lg hover:bg-slate-100">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Courses list */}
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-slate-500">Loading courses...</p>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-7 h-7 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-600 mb-1">No courses found</p>
              <p className="text-xs text-slate-400 mb-5">
                {search ? 'Try a different search term' : 'Create your first course to get started'}
              </p>
              <Link to="/teacher/courses/create"
                className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-800 transition">
                <Plus className="w-4 h-4" /> Create Course
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredCourses.map(course => (
                <div key={course._id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/50 transition-colors group">
                  {/* Thumbnail */}
                  <div className="w-14 h-14 rounded-xl bg-slate-100 flex-shrink-0 overflow-hidden border border-slate-200">
                    {course.thumbnail ? (
                      <img src={`${API}${course.thumbnail}`} alt={course.title} className="w-full h-full object-cover" />
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
                        <Users className="w-3 h-3" /> {course.enrolledStudents?.length || 0} students
                      </span>
                      <span className="text-xs text-slate-400">
                        {course.lessons?.length || 0} lessons
                      </span>
                    </div>
                  </div>

                  {/* Status */}
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold flex-shrink-0 ${
                    course.isPublished ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${course.isPublished ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    {course.isPublished ? 'Published' : 'Draft'}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link to={`/teacher/courses/${course._id}/edit`}
                      className="inline-flex items-center gap-1.5 text-slate-600 hover:text-white hover:bg-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all">
                      <Edit className="w-3.5 h-3.5" /> Edit
                    </Link>
                    <button onClick={() => togglePublish(course._id, course.isPublished)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        course.isPublished
                          ? 'text-amber-700 hover:text-white hover:bg-amber-500 bg-amber-50'
                          : 'text-emerald-700 hover:text-white hover:bg-emerald-600 bg-emerald-50'
                      }`}>
                      {course.isPublished
                        ? <><ToggleRight className="w-3.5 h-3.5" />Unpublish</>
                        : <><ToggleLeft className="w-3.5 h-3.5" />Publish</>}
                    </button>
                    <button onClick={() => deleteCourse(course._id)}
                      className="inline-flex items-center gap-1.5 text-rose-700 hover:text-white hover:bg-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all">
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

export default TeacherCourses;