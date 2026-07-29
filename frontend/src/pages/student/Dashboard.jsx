import { useState, useEffect, useRef } from "react";

import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

import { getStudentDashboard } from '../../services/userService';



// ── helpers ──────────────────────────────────────────────────────────────────

const API = import.meta.env.VITE_BACKEND_URL;



// Handles both Cloudinary full URLs and legacy local paths

const getImageSrc = (path) => {

  if (!path) return null;

  if (path.startsWith('http')) return path;   // Cloudinary URL — use as-is

  return `${API}${path}`;                     // local path — prepend API base

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



const statusConfig = {

  graded:   { label: '✓ Graded',         cls: 'bg-green-100 text-green-700 border-green-200' },

  pending:  { label: '⏳ Pending Review', cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' },

  late:     { label: '⚠ Turned in Late', cls: 'bg-orange-100 text-orange-700 border-orange-200' },

  missing:  { label: '✕ Missing',         cls: 'bg-red-100 text-red-700 border-red-200' },

  upcoming: { label: '→ Not submitted',   cls: 'bg-gray-100 text-gray-600 border-gray-200' },

  draft:    { label: '✎ Draft',           cls: 'bg-blue-100 text-blue-700 border-blue-200' },

};



const StatusBadge = ({ status }) => {

  const cfg = statusConfig[status] || statusConfig.missing;

  return (

    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.cls}`}>

      {cfg.label}

    </span>

  );

};



const StatCard = ({ icon, value, label, gradient }) => (

  <div className={`${gradient} rounded-2xl shadow-lg p-5 text-white`}>

    <div className="text-2xl mb-2">{icon}</div>

    <p className="text-3xl font-bold">{value}</p>

    <p className="text-xs opacity-80 mt-1 font-medium">{label}</p>

  </div>

);



const getDaysUntil = (date) => Math.ceil((new Date(date) - new Date()) / 86400000);



// ── Reusable mini course row ──────────────────────────────────────────────────

const MiniCourseRow = ({ course, onNavigate, rightSlot }) => (

  <div

    onClick={() => onNavigate(course._id)}

    className="flex items-center gap-3 p-2.5 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition cursor-pointer group"

  >

    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden shadow">

      {course.thumbnail ? (

        <img src={getImageSrc(course.thumbnail)} alt={course.title} className="w-full h-full object-cover"

          onError={(e) => { e.target.style.display = 'none'; }} />

      ) : course.title?.charAt(0)}

    </div>

    <div className="flex-1 min-w-0">

      <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-blue-600 transition">{course.title}</p>

      <p className="text-xs text-gray-400 truncate">{course.instructor?.name}</p>

    </div>

    {rightSlot}

  </div>

);



// ── Certificate Card ──────────────────────────────────────────────────────────

const CertificateCard = ({ cert, onView }) => (

  <div

    onClick={() => onView(cert)}

    className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-amber-200 hover:bg-amber-50/50 transition cursor-pointer"

  >

    <div className="flex-1 min-w-0">

      <h4 className="font-semibold text-gray-900 text-sm truncate">

        {cert.course?.title || 'Certificate of Completion'}

      </h4>

      <p className="text-xs text-gray-400 mt-0.5">

        Instructor: {cert.teacher?.name || 'Instructor'} • No: {cert.certificateNumber}

      </p>

      {cert.grade != null && (

        <p className="text-xs text-amber-600 font-bold mt-1">

          Grade: {cert.grade}%

        </p>

      )}

      {cert.completionDate && (

        <p className="text-xs text-gray-400 mt-0.5">

          Issued {new Date(cert.completionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}

        </p>

      )}

    </div>

    <div className="flex flex-col items-end gap-1.5 ml-3 flex-shrink-0">

      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">

        ✓ Issued

      </span>

      {cert.completionDate && (

        <p className="text-xs text-gray-400">

          Issued {new Date(cert.completionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}

        </p>

      )}

      <span className="text-xs text-blue-500 font-medium">Click to view →</span>

    </div>

  </div>

);



// ── Certificate View Modal ────────────────────────────────────────────────────

const CertificateModal = ({ cert, user, onClose }) => {

  const handlePrint = () => window.print();



  return (

    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>

      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] overflow-y-auto"

        onClick={e => e.stopPropagation()}>



        {/* Modal header */}

        <div className="flex items-center justify-between p-4 border-b border-gray-100">

          <h2 className="font-bold text-gray-800">Your Certificate</h2>

          <div className="flex items-center gap-2">

            <button onClick={handlePrint}

              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition">

              🖨 Print

            </button>

            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>

          </div>

        </div>



        {/* Certificate document */}

        <div className="p-6 print:p-0" id="certificate-print">

          <div className="border-8 border-double border-amber-400 rounded-2xl p-8 bg-gradient-to-br from-amber-50 via-white to-yellow-50 text-center">



            {/* Top decoration */}

            <div className="flex justify-center mb-4">

              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center text-3xl shadow-lg">

                🏆

              </div>

            </div>



            <p className="text-xs font-bold tracking-[0.3em] text-amber-600 uppercase mb-2">

              SkillBridge Academy

            </p>



            <h1 className="text-3xl font-extrabold text-gray-800 mb-1">

              Certificate of Completion

            </h1>



            <div className="w-24 h-1 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full mx-auto mb-6" />



            <p className="text-gray-500 text-sm mb-2">This is to certify that</p>



            <h2 className="text-3xl font-bold text-amber-600 mb-2" style={{ fontFamily: 'Georgia, serif' }}>

              {user?.name}

            </h2>



            <p className="text-gray-500 text-sm mb-2">has successfully completed the course</p>



            <h3 className="text-xl font-bold text-gray-800 mb-4 px-4">

              "{cert.course?.title}"

            </h3>



            {cert.grade != null && (

              <div className="inline-block bg-amber-100 border border-amber-300 rounded-xl px-6 py-2 mb-4">

                <p className="text-sm text-amber-700 font-semibold">Final Grade</p>

                <p className="text-2xl font-extrabold text-amber-600">{cert.grade}%</p>

              </div>

            )}



            <div className="grid grid-cols-2 gap-4 mt-6 mb-6">

              <div className="text-center">

                <div className="border-t-2 border-gray-300 pt-2 mt-8">

                  <p className="text-sm font-bold text-gray-700">{cert.teacher?.name}</p>

                  <p className="text-xs text-gray-400">Instructor</p>

                </div>

              </div>

              <div className="text-center">

                <div className="border-t-2 border-gray-300 pt-2 mt-8">

                  <p className="text-sm font-bold text-gray-700">

                    {new Date(cert.completionDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}

                  </p>

                  <p className="text-xs text-gray-400">Date of Completion</p>

                </div>

              </div>

            </div>



            {/* Certificate number + verification */}

            <div className="bg-white border border-amber-200 rounded-xl px-4 py-3 text-xs text-gray-500 space-y-1">

              <p>

                <span className="font-semibold text-gray-700">Certificate No:</span>{' '}

                <span className="font-mono">{cert.certificateNumber}</span>

              </p>

              <p>

                <span className="font-semibold text-gray-700">Verification Code:</span>{' '}

                <span className="font-mono">{cert.verificationCode}</span>

              </p>

            </div>

          </div>

        </div>

      </div>

    </div>

  );

};



// ── Assignment Detail Modal ───────────────────────────────────────────────────

const AssignmentModal = ({ assignment, onClose, onDeleted, onUpdated }) => {

  const [editMode, setEditMode] = useState(false);

  const [text, setText] = useState(assignment.content || '');

  const [file, setFile] = useState(null);

  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem('token');



  const handleDelete = async () => {

    if (!window.confirm('Delete this submission? This cannot be undone.')) return;

    setLoading(true);

    try {

      const res = await fetch(

        `${API}/api/courses/${assignment.courseId}/assignments/${assignment._id}/submission`,

        { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }

      );

      if (res.ok) { onDeleted(assignment._id); onClose(); }

      else { const e = await res.json(); alert(e.message); }

    } finally { setLoading(false); }

  };



  const handleUpdate = async () => {

    if (!text.trim() && !file) return alert('Please provide text or a PDF file');

    setLoading(true);

    try {

      let res;

      if (file) {

        const fd = new FormData();

        fd.append('text', text);

        fd.append('file', file);

        res = await fetch(

          `${API}/api/courses/${assignment.courseId}/assignments/${assignment._id}/submission`,

          { method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: fd }

        );

      } else {

        res = await fetch(

          `${API}/api/courses/${assignment.courseId}/assignments/${assignment._id}/submission`,

          {

            method: 'PUT',

            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },

            body: JSON.stringify({ text })

          }

        );

      }

      if (res.ok) {

        const data = await res.json();

        onUpdated(assignment._id, data.submission);

        setEditMode(false);

        onClose();

      } else {

        const e = await res.json(); alert(e.message);

      }

    } finally { setLoading(false); }

  };



  const isGraded = assignment.status === 'graded';



  return (

    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>

      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"

        onClick={e => e.stopPropagation()}>

        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl">

          <div className="flex items-start justify-between">

            <div>

              <h2 className="text-xl font-bold">{assignment.title}</h2>

              <p className="text-blue-200 text-sm mt-1">{assignment.courseName}</p>

            </div>

            <button onClick={onClose} className="text-white/70 hover:text-white text-2xl">✕</button>

          </div>

          <div className="flex items-center gap-3 mt-4">

            <StatusBadge status={assignment.status} />

            <span className="text-sm text-blue-200">

              Due: {new Date(assignment.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}

            </span>

            {assignment.isLate && (

              <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full font-semibold">Turned in Late</span>

            )}

          </div>

        </div>

        <div className="p-6 space-y-5">

          {isGraded && (

            <div className="bg-green-50 border border-green-200 rounded-xl p-4">

              <div className="flex items-center justify-between mb-2">

                <h3 className="font-bold text-green-800">Grade Received</h3>

                <span className="text-2xl font-bold text-green-600">{assignment.grade} / {assignment.points}</span>

              </div>

              {assignment.feedback && (

                <div className="mt-2">

                  <p className="text-xs font-semibold text-green-700 mb-1">Teacher Feedback:</p>

                  <p className="text-sm text-green-800 bg-white rounded-lg p-3 border border-green-100">{assignment.feedback}</p>

                </div>

              )}

            </div>

          )}

          {!editMode ? (

            <div>

              <h3 className="font-semibold text-gray-700 mb-2 text-sm">Your Submission</h3>

              {assignment.content && (

                <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-4 border">{assignment.content}</p>

              )}

              {assignment.files && assignment.files.length > 0 && (

                <div className="mt-3 space-y-3">

                  {assignment.files.map((f, i) => (

                    <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">

                      <div className="flex items-center justify-between bg-gray-50 px-4 py-2 border-b">

                        <div className="flex items-center gap-2">

                          <span className="text-red-500">📄</span>

                          <span className="text-sm font-medium text-gray-700 truncate">{f.originalName || f.filename}</span>

                          <span className="text-xs text-gray-400">({(f.size / 1024).toFixed(1)} KB)</span>

                        </div>

                        <a href={getImageSrc(f.path)} target="_blank" rel="noopener noreferrer"

                          className="text-xs bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition">

                          Open ↗

                        </a>

                      </div>

                      {f.mimetype === 'application/pdf' && (

                        <PdfInlineViewer url={getImageSrc(f.path)} title={f.originalName} />

                      )}

                    </div>

                  ))}

                </div>

              )}

              {!isGraded && (

                <div className="flex gap-3 mt-4">

                  <button onClick={() => setEditMode(true)}

                    className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition">

                    ✎ Edit Submission

                  </button>

                  <button onClick={handleDelete} disabled={loading}

                    className="flex-1 py-2 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition disabled:opacity-50">

                    🗑 Delete Submission

                  </button>

                </div>

              )}

            </div>

          ) : (

            <div>

              <h3 className="font-semibold text-gray-700 mb-2 text-sm">Edit Submission</h3>

              <textarea value={text} onChange={e => setText(e.target.value)}

                className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"

                rows={5} placeholder="Update your answer..." />

              {!file ? (

                <label className="mt-3 flex items-center gap-2 w-fit cursor-pointer px-4 py-2 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 text-sm text-gray-500 transition">

                  📎 Replace PDF

                  <input type="file" accept="application/pdf" className="hidden" onChange={e => setFile(e.target.files[0])} />

                </label>

              ) : (

                <div className="mt-3 flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl p-3">

                  <span className="text-red-500">📄</span>

                  <span className="text-sm text-gray-700 flex-1 truncate">{file.name}</span>

                  <button onClick={() => setFile(null)} className="text-red-500 text-sm">✕</button>

                </div>

              )}

              <div className="flex gap-3 mt-4">

                <button onClick={handleUpdate} disabled={loading}

                  className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50">

                  {loading ? 'Saving...' : '✓ Save Changes'}

                </button>

                <button onClick={() => setEditMode(false)}

                  className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-300 transition">

                  Cancel

                </button>

              </div>

            </div>

          )}

        </div>

      </div>

    </div>

  );

};



// ── Settings Modal ────────────────────────────────────────────────────────────

const SettingsModal = ({ user, onClose, onUpdated }) => {

  const [name, setName] = useState(user?.name || '');

  const [avatar, setAvatar] = useState(null);

  const [preview, setPreview] = useState(user?.avatar ? getImageSrc(user.avatar) : null);

  const [loading, setLoading] = useState(false);

  const fileRef = useRef();

  const token = localStorage.getItem('token');



  const handleAvatarChange = (e) => {

    const f = e.target.files[0];

    if (!f) return;

    setAvatar(f);

    setPreview(URL.createObjectURL(f));

  };



  const handleSave = async () => {

    if (!name.trim()) return alert('Name cannot be empty');

    setLoading(true);

    try {

      const fd = new FormData();

      fd.append('name', name);

      if (avatar) fd.append('avatar', avatar);

      const res = await fetch(`${API}/api/users/me`, {

        method: 'PUT',

        headers: { Authorization: `Bearer ${token}` },

        body: fd,

      });

      if (res.ok) {

        const data = await res.json();

        const existingUser = JSON.parse(localStorage.getItem('user') || '{}');

        const mergedUser = { ...existingUser, ...data.user };

        localStorage.setItem('user', JSON.stringify(mergedUser));

        if (data.user?.avatar) setPreview(getImageSrc(data.user.avatar));

        onUpdated(mergedUser);

        onClose();

      } else {

        const e = await res.json();

        alert(e.message || 'Failed to update profile');

      }

    } catch (err) {

      alert('Network error. Please try again.');

    } finally { setLoading(false); }

  };



  return (

    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>

      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>

        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-2xl">

          <div className="flex items-center justify-between">

            <h2 className="text-xl font-bold">Profile Settings</h2>

            <button onClick={onClose} className="text-white/70 hover:text-white text-2xl">✕</button>

          </div>

        </div>

        <div className="p-6 space-y-5">

          <div className="flex flex-col items-center gap-3">

            <div className="relative">

              <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-3xl font-bold border-4 border-white shadow-lg">

                {preview

                  ? <img src={preview} alt="avatar" className="w-full h-full object-cover" />

                  : user?.name?.charAt(0)}

              </div>

              <button onClick={() => fileRef.current.click()}

                className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center shadow hover:bg-blue-700 transition text-sm">

                ✎

              </button>

              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />

            </div>

            <p className="text-xs text-gray-400">Click the pencil to change your photo</p>

          </div>

          <div>

            <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>

            <input value={name} onChange={e => setName(e.target.value)}

              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"

              placeholder="Your full name" />

          </div>

          <div>

            <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>

            <input value={user?.email || ''} disabled

              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed" />

            <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>

          </div>

          <button onClick={handleSave} disabled={loading}

            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50">

            {loading ? 'Saving...' : 'Save Changes'}

          </button>

        </div>

      </div>

    </div>

  );

};



// ── Main Dashboard ────────────────────────────────────────────────────────────

const Dashboard = () => {

  const [dashboardData, setDashboardData]           = useState(null);

  const [loading, setLoading]                       = useState(true);

  const [error, setError]                           = useState(null);

  const [activeTab, setActiveTab]                   = useState('assignments');

  const [selectedAssignment, setSelectedAssignment] = useState(null);

  const [showSettings, setShowSettings]             = useState(false);



  // ── bookmark state ──────────────────────────────────────────────────────

  const [bookmarkedIds, setBookmarkedIds]           = useState(new Set());

  const [bookmarkedCourses, setBookmarkedCourses]   = useState([]);



  // ── recently viewed state ───────────────────────────────────────────────

  const [recentlyViewed, setRecentlyViewed]         = useState([]);



  // ── certificates state ──────────────────────────────────────────────────

  const [certificates, setCertificates]             = useState([]);

  const [selectedCert, setSelectedCert]             = useState(null);



  // ── inbox (contact messages) state ──────────────────────────────────────

  const [inboxMessages, setInboxMessages]           = useState([]);

  const [inboxLoading, setInboxLoading]             = useState(false);

  const [inboxExpanded, setInboxExpanded]           = useState(null);

  const [inboxReplyText, setInboxReplyText]         = useState({});

  const [inboxReplySending, setInboxReplySending]   = useState({});



  const navigate = useNavigate();

  const { user, setUser } = useAuth();

  const token = localStorage.getItem('token');



  // ── fetch dashboard ─────────────────────────────────────────────────────

  const fetchDashboard = async () => {

    try {

      setLoading(true);

      setError(null);

      const response = await getStudentDashboard();

      setDashboardData(response.data);

    } catch (err) {

      setError(err.response?.data?.message || 'Failed to load dashboard');

    } finally {

      setLoading(false);

    }

  };



  // ── fetch bookmarks ─────────────────────────────────────────────────────

  const fetchBookmarks = async () => {

    try {

      const res = await fetch(`${API}/api/users/bookmarks`, {

        headers: { Authorization: `Bearer ${token}` }

      });

      if (res.ok) {

        const data = await res.json();

        setBookmarkedCourses(data.bookmarks || []);

        setBookmarkedIds(new Set((data.bookmarks || []).map(c => c._id)));

      }

    } catch (_) {}

  };



  // ── fetch recently viewed ───────────────────────────────────────────────

  const fetchRecentlyViewed = async () => {

    try {

      const res = await fetch(`${API}/api/users/recently-viewed`, {

        headers: { Authorization: `Bearer ${token}` }

      });

      if (res.ok) {

        const data = await res.json();

        setRecentlyViewed(data.recentlyViewed || []);

      }

    } catch (_) {}

  };



  // ── fetch certificates ──────────────────────────────────────────────────

  // Uses existing GET /api/certificates/my route (student-only, returns issued certs)

  const fetchCertificates = async () => {

    try {

      const res = await fetch(`${API}/api/certificates/my`, {

        headers: { Authorization: `Bearer ${token}` }

      });

      if (res.ok) {

        const data = await res.json();

        setCertificates(data.data || []);

      }

    } catch (_) {}

  };



  // ── fetch inbox messages ────────────────────────────────────────────────

  const fetchInbox = async () => {

    if (!user?.email) return;

    setInboxLoading(true);

    try {

      const res = await fetch(

        `${API}/api/contact/my-messages?email=${encodeURIComponent(user.email)}`

      );

      const data = await res.json();

      if (data.success) setInboxMessages(data.data);

    } catch (_) {}

    finally { setInboxLoading(false); }

  };



  const sendStudentReply = async (msgId) => {

    const text = inboxReplyText[msgId]?.trim();

    if (!text) return;

    setInboxReplySending(prev => ({ ...prev, [msgId]: true }));

    try {

      const res = await fetch(`${API}/api/contact/messages/${msgId}/student-reply`, {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ studentReply: text, email: user.email })

      });

      const data = await res.json();

      if (data.success) {

        setInboxMessages(prev => prev.map(m => m._id === msgId ? data.data : m));

        setInboxReplyText(prev => ({ ...prev, [msgId]: '' }));

      }

    } catch (_) {}

    finally { setInboxReplySending(prev => ({ ...prev, [msgId]: false })); }

  };



  useEffect(() => {

    if (!user) return;



    fetchDashboard();

    fetchBookmarks();

    fetchRecentlyViewed();

    fetchCertificates();

    fetchInbox();



    const handleVisibilityChange = () => {

      if (document.visibilityState === 'visible') {

        fetchDashboard();

        fetchRecentlyViewed();

        fetchCertificates();

      }

    };

    const handleFocus = () => {

      fetchDashboard();

      fetchRecentlyViewed();

    };



    document.addEventListener('visibilitychange', handleVisibilityChange);

    window.addEventListener('focus', handleFocus);

    return () => {

      document.removeEventListener('visibilitychange', handleVisibilityChange);

      window.removeEventListener('focus', handleFocus);

    };

  }, [user]);



  // ── toggle bookmark ─────────────────────────────────────────────────────

  const toggleBookmark = async (courseId, isCurrentlyBookmarked) => {

    const method = isCurrentlyBookmarked ? 'DELETE' : 'POST';

    try {

      const res = await fetch(`${API}/api/users/bookmarks/${courseId}`, {

        method,

        headers: { Authorization: `Bearer ${token}` }

      });

      if (res.ok) {

        if (isCurrentlyBookmarked) {

          setBookmarkedIds(prev => { const s = new Set(prev); s.delete(courseId); return s; });

          setBookmarkedCourses(prev => prev.filter(c => c._id !== courseId));

        } else {

          setBookmarkedIds(prev => new Set([...prev, courseId]));

          const course = dashboardData?.enrolledCourses?.find(c => c._id === courseId);

          if (course) setBookmarkedCourses(prev => [course, ...prev]);

        }

      }

    } catch (_) {}

  };



  // ── navigate to course + record view ───────────────────────────────────

  const navigateToCourse = (courseId) => {

    fetch(`${API}/api/users/recently-viewed/${courseId}`, {

      method: 'POST',

      headers: { Authorization: `Bearer ${token}` }

    })

      .then(res => { if (res.ok) fetchRecentlyViewed(); })

      .catch(() => {});

    navigate(`/courses/${courseId}`);

  };



  // ── assignment helpers ──────────────────────────────────────────────────

  const handleAssignmentDeleted = (assignmentId) => {

    setDashboardData(prev => ({

      ...prev,

      assignments: prev.assignments.map(a =>

        a._id === assignmentId

          ? { ...a, status: 'upcoming', submittedAt: null, files: [], content: null, grade: null, feedback: null }

          : a

      )

    }));

  };

  const handleAssignmentUpdated = () => { fetchDashboard(); };



  // ── loading / error ─────────────────────────────────────────────────────

  if (loading) return (

    <div className="flex items-center justify-center min-h-screen bg-gray-50">

      <div className="text-center">

        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4" />

        <p className="text-gray-500 font-medium">Loading your dashboard...</p>

      </div>

    </div>

  );



  if (error) return (

    <div className="flex items-center justify-center min-h-screen bg-gray-50">

      <div className="bg-white rounded-2xl shadow p-8 text-center max-w-md">

        <div className="text-5xl mb-4">⚠️</div>

        <h3 className="text-lg font-semibold text-gray-800 mb-2">Failed to load dashboard</h3>

        <p className="text-gray-500 mb-4">{error}</p>

        <button onClick={fetchDashboard} className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition">

          Retry

        </button>

      </div>

    </div>

  );



  const {

    enrolledCourses = [],

    assignments     = [],

    quizzes         = [],

    overallProgress = 0,

    nextDeadline    = null,

    stats           = {}

  } = dashboardData || {};



  const gradedAssignments  = assignments.filter(a => a.status === 'graded');

  const pendingAssignments = assignments.filter(a => a.status === 'pending' || a.status === 'late');

  const missingAssignments = assignments.filter(a => a.status === 'missing');

  const completedQuizzes   = quizzes.filter(q => q.completed);

  const passedQuizzes      = quizzes.filter(q => q.passed);



  return (

    <div className="min-h-screen bg-gray-50">



      {/* ── Top Nav ──────────────────────────────────────────────────────── */}

        {/* <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

            <div className="flex items-center gap-3">

              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center text-white font-bold text-sm">S</div>

              <span className="font-bold text-gray-800 text-lg">SkillBridge</span>

            </div>

            <button onClick={() => setShowSettings(true)}

              className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-gray-100 transition text-sm font-medium text-gray-700">

              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold overflow-hidden">

                {user?.avatar

                  ? <img src={getImageSrc(user.avatar)} alt="avatar" className="w-full h-full object-cover" />

                  : user?.name?.charAt(0)}

              </div>

              <span className="hidden sm:block">{user?.name?.split(' ')[0]}</span>

              <span className="text-gray-400">⚙</span>

            </button>

          </div>

        </div> */}



      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">



        {/* Header with Profile Picture Upload */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-5">
            <div 
              onClick={() => setShowSettings(true)}
              className="relative group cursor-pointer w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold overflow-hidden shadow-md border-2 border-white ring-2 ring-blue-500/20 transition-all hover:scale-105"
              title="Click to change profile picture"
            >
              {user?.avatar ? (
                <img src={getImageSrc(user.avatar)} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                user?.name?.charAt(0) || 'S'
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white text-xs font-semibold">📷 Edit</span>
              </div>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Welcome back, <span className="text-blue-600">{user?.name?.split(' ')[0] || 'Student'}</span> 👋
              </h1>
              <p className="text-gray-500 mt-0.5 text-sm">Here's what's happening with your learning.</p>
            </div>
          </div>
          
          <button 
            onClick={() => setShowSettings(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-sm rounded-xl transition"
          >
            <span>⚙️</span> Edit Profile & Avatar
          </button>
        </div>



        {/* Stats */}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">

          <StatCard icon="📚" value={stats.totalEnrolled || 0}                       label="Enrolled"       gradient="bg-gradient-to-br from-blue-500 to-blue-700" />

          <StatCard icon="✕"  value={missingAssignments.length}                      label="Missing"        gradient="bg-gradient-to-br from-red-500 to-red-700" />

          <StatCard icon="⏳" value={pendingAssignments.length}                      label="Pending Review" gradient="bg-gradient-to-br from-yellow-500 to-orange-500" />

          <StatCard icon="✓"  value={gradedAssignments.length}                       label="Graded"         gradient="bg-gradient-to-br from-green-500 to-green-700" />

          <StatCard icon="❓" value={`${completedQuizzes.length}/${quizzes.length}`} label="Quizzes Done"   gradient="bg-gradient-to-br from-purple-500 to-purple-700" />

          <StatCard icon="🏆" value={`${Math.round(overallProgress)}%`}             label="Progress"       gradient="bg-gradient-to-br from-indigo-500 to-indigo-700" />

        </div>



        {/* Next Deadline Banner */}

        {nextDeadline && (

          <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-2xl p-4 mb-8 flex items-center justify-between shadow-lg">

            <div className="flex items-center gap-3">

              <span className="text-3xl">⏰</span>

              <div>

                <p className="font-bold">{nextDeadline.title}</p>

                <p className="text-sm opacity-80">{nextDeadline.courseName}</p>

              </div>

            </div>

            <div className="text-right">

              <p className="font-bold text-lg">

                {getDaysUntil(nextDeadline.date) <= 0 ? 'Due Today!' :

                 getDaysUntil(nextDeadline.date) === 1 ? 'Due Tomorrow' :

                 `${getDaysUntil(nextDeadline.date)} days left`}

              </p>

              <p className="text-sm opacity-70">

                {new Date(nextDeadline.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}

              </p>

            </div>

          </div>

        )}



        {/* ── Certificates Banner (shown only when certs exist) ─────────── */}

        {certificates.length > 0 && (

          <div className="bg-gradient-to-r from-amber-400 to-yellow-500 text-white rounded-2xl p-4 mb-8 flex items-center justify-between shadow-lg">

            <div className="flex items-center gap-3">

              <span className="text-3xl">🏆</span>

              <div>

                <p className="font-bold">

                  You have {certificates.length} certificate{certificates.length > 1 ? 's' : ''}!

                </p>

                <p className="text-sm opacity-90">

                  {certificates.map(c => c.course?.title).join(', ')}

                </p>

              </div>

            </div>

            {/* <button

              onClick={() => setActiveTab('certificates')}

              className="bg-white text-amber-600 font-bold text-sm px-4 py-2 rounded-xl hover:bg-amber-50 transition flex-shrink-0"

            >

              View All →

            </button> */}

          </div>

        )}



        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">



          {/* ══ LEFT ════════════════════════════════════════════════════════ */}

          <div className="lg:col-span-2 space-y-6">



            {/* My Courses */}

            <div className="bg-white rounded-2xl shadow p-6">

              <div className="flex items-center justify-between mb-5">

                <h2 className="text-lg font-bold text-gray-900">My Courses</h2>

                <button onClick={() => navigate('/courses')} className="text-sm text-blue-600 hover:text-blue-800 font-medium">

                  Browse All →

                </button>

              </div>

              {enrolledCourses.length > 0 ? (

                <div className="space-y-3">

                  {enrolledCourses.slice(0, 4).map(course => (

                    <div key={course._id} onClick={() => navigateToCourse(course._id)}

                      className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition cursor-pointer group">

                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 overflow-hidden shadow">

                        {course.thumbnail ? (

                          <img src={getImageSrc(course.thumbnail)} alt={course.title} className="w-full h-full object-cover"

                            onError={(e) => { e.target.style.display = 'none'; }} />

                        ) : course.title?.charAt(0)}

                      </div>

                      <div className="flex-1 min-w-0">

                        <h3 className="font-semibold text-gray-900 text-sm truncate group-hover:text-blue-600 transition">{course.title}</h3>

                        <p className="text-xs text-gray-400">{course.instructor?.name}</p>

                        <div className="flex items-center gap-2 mt-1.5">

                          <div className="flex-1 bg-gray-100 rounded-full h-1.5">

                            <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${course.progress || 0}%` }} />

                          </div>

                          <span className="text-xs text-gray-400 font-medium">{course.progress || 0}%</span>

                        </div>

                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>

                        {course.completed && (

                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold whitespace-nowrap">🎓 Done</span>

                        )}

                        <button

                          onClick={async (e) => { e.stopPropagation(); await toggleBookmark(course._id, bookmarkedIds.has(course._id)); }}

                          title={bookmarkedIds.has(course._id) ? 'Remove bookmark' : 'Save for later'}

                          className={`w-8 h-8 flex items-center justify-center rounded-full transition-all text-base

                            ${bookmarkedIds.has(course._id)

                              ? 'bg-yellow-100 text-yellow-500 hover:bg-yellow-200'

                              : 'bg-gray-100 text-gray-400 hover:bg-yellow-50 hover:text-yellow-400'}`}>

                          {bookmarkedIds.has(course._id) ? '🔖' : '🏷'}

                        </button>

                      </div>

                    </div>

                  ))}

                </div>

              ) : (

                <div className="text-center py-10">

                  <div className="text-5xl mb-3">📚</div>

                  <p className="text-gray-400 mb-3 text-sm">No courses yet</p>

                  <button onClick={() => navigate('/courses')}

                    className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 transition font-semibold">

                    Explore Courses

                  </button>

                </div>

              )}

            </div>



            {/* Assignments, Quizzes & Certificates Tabs */}

            <div className="bg-white rounded-2xl shadow">

              <div className="flex border-b border-gray-100 overflow-x-auto">

                {[

                  { key: 'assignments',  label: `📄 Assignments (${assignments.length})` },

                  { key: 'quizzes',      label: `❓ Quizzes (${quizzes.length})` },

                  { key: 'certificates', label: `🏆 Certificates (${certificates.length})` },

                  { key: 'inbox',        label: `💬 Inbox (${inboxMessages.length})` },

                ].map(tab => (

                  <button key={tab.key} onClick={() => setActiveTab(tab.key)}

                    className={`flex-1 py-4 text-sm font-semibold transition whitespace-nowrap px-3 ${

                      activeTab === tab.key

                        ? tab.key === 'certificates'

                          ? 'text-amber-600 border-b-2 border-amber-500'

                          : 'text-blue-600 border-b-2 border-blue-600'

                        : 'text-gray-400 hover:text-gray-600'}`}>

                    {tab.label}

                  </button>

                ))}

              </div>



              <div className="p-5">

                {/* ── Assignments tab ── */}

                {activeTab === 'assignments' && (

                  assignments.length > 0 ? (

                    <div className="space-y-2">

                      {assignments.map(a => (

                        <div key={a._id} onClick={() => a.submissionId && setSelectedAssignment(a)}

                          className={`flex items-center justify-between p-4 rounded-xl border transition ${

                            a.submissionId

                              ? 'border-gray-100 hover:border-blue-200 hover:bg-blue-50 cursor-pointer'

                              : 'border-gray-100 bg-gray-50 cursor-default'}`}>

                          <div className="flex-1 min-w-0">

                            <h4 className="font-semibold text-gray-900 text-sm truncate">{a.title}</h4>

                            <p className="text-xs text-gray-400 mt-0.5">{a.courseName}</p>

                            {a.status === 'graded' && a.grade != null && (

                              <p className="text-xs text-green-600 font-bold mt-1">Grade: {a.grade} / {a.points}</p>

                            )}

                            {a.submittedAt && (

                              <p className="text-xs text-gray-400 mt-0.5">

                                Submitted {new Date(a.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}

                                {a.isLate && <span className="text-orange-500 font-semibold ml-1">(Late)</span>}

                              </p>

                            )}

                          </div>

                          <div className="flex flex-col items-end gap-1.5 ml-3">

                            <StatusBadge status={a.status} />

                            <p className="text-xs text-gray-400">

                              Due {new Date(a.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}

                            </p>

                            {a.submissionId && <span className="text-xs text-blue-500 font-medium">Click to view →</span>}

                          </div>

                        </div>

                      ))}

                    </div>

                  ) : (

                    <div className="text-center py-10 text-gray-400">

                      <div className="text-4xl mb-2">✅</div>

                      <p className="text-sm">No assignments yet</p>

                    </div>

                  )

                )}



                {/* ── Quizzes tab ── */}

                {activeTab === 'quizzes' && (

                  quizzes.length > 0 ? (

                    <div className="space-y-2">

                      {quizzes.map(q => (

                        <div key={q._id} onClick={() => navigateToCourse(q.courseId)}

                          className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50 transition cursor-pointer">

                          <div className="flex-1 min-w-0">

                            <h4 className="font-semibold text-gray-900 text-sm truncate">{q.title}</h4>

                            <p className="text-xs text-gray-400 mt-0.5">{q.courseName}</p>

                            {q.completed && q.score != null && (

                              <div className="flex items-center gap-2 mt-1">

                                <p className="text-xs font-bold" style={{ color: q.passed ? '#16a34a' : '#dc2626' }}>

                                  Score: {Math.round(q.score)}%

                                </p>

                                <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${q.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>

                                  {q.passed ? 'Passed' : 'Failed'}

                                </span>

                              </div>

                            )}

                          </div>

                          <div className="flex flex-col items-end gap-1.5 ml-3">

                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${

                              q.completed

                                ? q.passed ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'

                                : 'bg-purple-100 text-purple-700 border-purple-200'}`}>

                              {q.completed ? (q.passed ? '✓ Passed' : '✕ Failed') : '→ Take Quiz'}

                            </span>

                            <p className="text-xs text-gray-400">⏱ {q.duration} min</p>

                          </div>

                        </div>

                      ))}

                    </div>

                  ) : (

                    <div className="text-center py-10 text-gray-400">

                      <div className="text-4xl mb-2">✅</div>

                      <p className="text-sm">No quizzes yet</p>

                    </div>

                  )

                )}



                {/* ── Certificates tab ── */}

                {activeTab === 'certificates' && (

                  certificates.length > 0 ? (

                    <div className="space-y-2">

                      {certificates.map(cert => (

                        <CertificateCard

                          key={cert._id}

                          cert={cert}

                          onView={setSelectedCert}

                        />

                      ))}

                    </div>

                  ) : (

                    <div className="text-center py-12">

                      <div className="text-5xl mb-3">🎓</div>

                      <p className="text-gray-500 font-semibold mb-1">No certificates yet</p>

                      <p className="text-xs text-gray-400">Complete a course and the admin will issue your certificate.</p>

                    </div>

                  )

                )}

              </div>

            </div>

          </div>



          {/* ══ RIGHT ═══════════════════════════════════════════════════════ */}

          <div className="space-y-6">



            {/* Overall Progress */}

            <div className="bg-white rounded-2xl shadow p-6">

              <h3 className="font-bold text-gray-900 mb-4">Overall Progress</h3>

              <div className="flex justify-center mb-4">

                <div className="relative w-28 h-28">

                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">

                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f4f6" strokeWidth="3" />

                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#3b82f6" strokeWidth="3"

                      strokeDasharray={`${overallProgress} ${100 - overallProgress}`} strokeLinecap="round" />

                  </svg>

                  <div className="absolute inset-0 flex items-center justify-center">

                    <span className="text-2xl font-bold text-gray-800">{Math.round(overallProgress)}%</span>

                  </div>

                </div>

              </div>

              <div className="space-y-2 text-sm">

                {[

                  { label: 'Enrolled',    value: stats.totalEnrolled || 0,                                    color: 'text-blue-600' },

                  { label: 'Completed',   value: stats.totalCompleted || 0,                                   color: 'text-green-600' },

                  { label: 'In Progress', value: (stats.totalEnrolled || 0) - (stats.totalCompleted || 0),    color: 'text-indigo-600' },

                ].map(item => (

                  <div key={item.label} className="flex justify-between text-gray-600">

                    <span>{item.label}</span>

                    <span className={`font-bold ${item.color}`}>{item.value}</span>

                  </div>

                ))}

              </div>

            </div>



            {/* ── My Certificates sidebar widget ──────────────────────── */}

            <div className="bg-white rounded-2xl shadow p-6">

              <div className="flex items-center justify-between mb-4">

                <h3 className="font-bold text-gray-900 flex items-center gap-2">🏆 My Certificates</h3>

                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full font-medium">

                  {certificates.length}

                </span>

              </div>



              {certificates.length > 0 ? (

                <div className="space-y-2">

                  {certificates.slice(0, 3).map(cert => (

                    <div key={cert._id}

                      onClick={() => setSelectedCert(cert)}

                      className="flex items-center gap-3 p-2.5 rounded-xl border border-amber-100 hover:border-amber-300 hover:bg-amber-50 transition cursor-pointer group">

                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-white text-lg flex-shrink-0 shadow">

                        🏆

                      </div>

                      <div className="flex-1 min-w-0">

                        <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-amber-600 transition">

                          {cert.course?.title}

                        </p>

                        <p className="text-xs text-gray-400">

                          {new Date(cert.completionDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}

                        </p>

                      </div>

                      <span className="text-xs text-amber-500 font-bold flex-shrink-0">View →</span>

                    </div>

                  ))}

                  {certificates.length > 3 && (

                    <button onClick={() => setActiveTab('certificates')}

                      className="w-full text-center text-xs text-amber-600 font-semibold py-1 hover:underline">

                      +{certificates.length - 3} more →

                    </button>

                  )}

                </div>

              ) : (

                <div className="text-center py-5">

                  <div className="text-3xl mb-2">🎓</div>

                  <p className="text-sm text-gray-400">No certificates yet</p>

                  <p className="text-xs text-gray-300 mt-1">Complete courses to earn them</p>

                </div>

              )}

            </div>



            {/* Saved Courses */}

            <div className="bg-white rounded-2xl shadow p-6">

              <div className="flex items-center justify-between mb-4">

                <h3 className="font-bold text-gray-900">🔖 Saved Courses</h3>

                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full font-medium">{bookmarkedCourses.length}</span>

              </div>

              {bookmarkedCourses.length > 0 ? (

                <div className="space-y-2">

                  {bookmarkedCourses.slice(0, 5).map(course => (

                    <MiniCourseRow key={course._id} course={course} onNavigate={navigateToCourse}

                      rightSlot={

                        <button onClick={async (e) => { e.stopPropagation(); await toggleBookmark(course._id, true); }}

                          title="Remove bookmark"

                          className="w-7 h-7 flex items-center justify-center rounded-full bg-yellow-100 text-yellow-500 hover:bg-red-100 hover:text-red-400 transition text-sm flex-shrink-0">

                          ✕

                        </button>

                      }

                    />

                  ))}

                </div>

              ) : (

                <div className="text-center py-6">

                  <div className="text-3xl mb-2">🏷</div>

                  <p className="text-sm text-gray-400">No saved courses yet</p>

                  <p className="text-xs text-gray-300 mt-1">Tap 🏷 on any course to save it</p>

                </div>

              )}

            </div>



            {/* Recently Viewed */}

            <div className="bg-white rounded-2xl shadow p-6">

              <div className="flex items-center justify-between mb-4">

                <h3 className="font-bold text-gray-900">🕐 Recently Viewed</h3>

                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full font-medium">{recentlyViewed.length}</span>

              </div>

              {recentlyViewed.length > 0 ? (

                <div className="space-y-2">

                  {recentlyViewed.slice(0, 5).map(course => {

                    const diff  = Date.now() - new Date(course.viewedAt).getTime();

                    const mins  = Math.floor(diff / 60000);

                    const hours = Math.floor(diff / 3600000);

                    const days  = Math.floor(diff / 86400000);

                    const timeAgo = mins < 1 ? 'Just now' : mins < 60 ? `${mins}m ago` : hours < 24 ? `${hours}h ago` : `${days}d ago`;

                    return (

                      <MiniCourseRow key={course._id} course={course} onNavigate={navigateToCourse}

                        rightSlot={<span className="text-xs text-gray-400 flex-shrink-0 whitespace-nowrap">{timeAgo}</span>}

                      />

                    );

                  })}

                </div>

              ) : (

                <div className="text-center py-6">

                  <div className="text-3xl mb-2">🕐</div>

                  <p className="text-sm text-gray-400">No recent activity</p>

                </div>

              )}

            </div>



            {/* Assignment Status */}

            <div className="bg-white rounded-2xl shadow p-6">

              <h3 className="font-bold text-gray-900 mb-4">Assignment Status</h3>

              <div className="space-y-2">

                {[

                  { label: 'Missing',        count: missingAssignments.length,  bg: 'bg-red-50',    text: 'text-red-700',    dot: 'bg-red-500' },

                  { label: 'Pending Review', count: pendingAssignments.length,  bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500' },

                  { label: 'Graded',         count: gradedAssignments.length,   bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green-500' },

                ].map(item => (

                  <div key={item.label} className={`flex items-center justify-between p-3 rounded-xl ${item.bg} ${item.text}`}>

                    <div className="flex items-center gap-2">

                      <div className={`w-2 h-2 rounded-full ${item.dot}`} />

                      <span className="text-sm font-medium">{item.label}</span>

                    </div>

                    <span className="font-bold">{item.count}</span>

                  </div>

                ))}

              </div>

            </div>



            {/* Quiz Results */}

            <div className="bg-white rounded-2xl shadow p-6">

              <h3 className="font-bold text-gray-900 mb-4">Quiz Results</h3>

              {completedQuizzes.length > 0 ? (

                <div className="space-y-2">

                  {completedQuizzes.slice(0, 4).map(q => (

                    <div key={q._id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">

                      <div className="flex-1 min-w-0">

                        <p className="text-sm font-semibold text-gray-800 truncate">{q.title}</p>

                        <p className="text-xs text-gray-400">{q.courseName}</p>

                      </div>

                      <div className="flex flex-col items-end ml-2">

                        <span className={`text-sm font-bold ${q.passed ? 'text-green-600' : 'text-red-600'}`}>{Math.round(q.score)}%</span>

                        <span className={`text-xs font-semibold ${q.passed ? 'text-green-500' : 'text-red-500'}`}>{q.passed ? 'Passed' : 'Failed'}</span>

                      </div>

                    </div>

                  ))}

                  <div className="text-center pt-1">

                    <p className="text-xs text-gray-400">{passedQuizzes.length} of {completedQuizzes.length} passed</p>

                  </div>

                </div>

              ) : (

                <div className="text-center py-6 text-gray-400">

                  <div className="text-3xl mb-2">❓</div>

                  <p className="text-sm">No quiz results yet</p>

                </div>

              )}

                {/* Inbox tab */}
                {activeTab === 'inbox' && (
                  <div className='space-y-3'>
                    <div className='flex items-center justify-between mb-2'>
                      <p className='text-xs text-gray-400'>Messages you sent to the admin</p>
                      <button onClick={fetchInbox} className='text-xs text-blue-500 hover:text-blue-700 font-medium'>Refresh</button>
                    </div>
                    {inboxLoading ? (
                      <div className='text-center py-8'>
                        <div className='animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent mx-auto mb-2' />
                        <p className='text-xs text-gray-400'>Loading...</p>
                      </div>
                    ) : inboxMessages.length === 0 ? (
                      <div className='text-center py-10'>
                        <div className='text-4xl mb-3'>📭</div>
                        <p className='text-gray-400 text-sm font-medium'>No messages yet</p>
                        <p className='text-xs text-gray-300 mt-1'>Go to the <a href='/contact' className='text-blue-500 underline'>Contact page</a> to send one</p>
                      </div>
                    ) : (
                      inboxMessages.map(msg => (
                        <div key={msg._id} className='border border-gray-100 rounded-xl overflow-hidden'>
                          <button
                            onClick={() => setInboxExpanded(inboxExpanded === msg._id ? null : msg._id)}
                            className='w-full text-left px-4 py-3 flex items-center justify-between gap-3 hover:bg-gray-50 transition'
                          >
                            <div className='flex-1 min-w-0'>
                              <div className='flex items-center gap-2 flex-wrap'>
                                <span className='text-sm font-semibold text-gray-900 truncate'>{msg.subject || 'No Subject'}</span>
                                {msg.status === 'replied' && (
                                  <span className='text-xs bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full'>Replied</span>
                                )}
                                {!msg.adminReply && (
                                  <span className='text-xs bg-orange-100 text-orange-600 font-bold px-2 py-0.5 rounded-full'>Pending</span>
                                )}
                                {msg.studentReply && (
                                  <span className='text-xs bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full'>You replied</span>
                                )}
                              </div>
                              <p className='text-xs text-gray-400 mt-0.5'>
                                {new Date(msg.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </p>
                            </div>
                            <span className='text-gray-300 text-sm flex-shrink-0'>{inboxExpanded === msg._id ? '▲' : '▼'}</span>
                          </button>

                          {inboxExpanded === msg._id && (
                            <div className='border-t border-gray-100 px-4 py-4 space-y-3 bg-gray-50/50'>
                              <div className='bg-white rounded-xl px-4 py-3 border border-gray-100'>
                                <p className='text-xs font-bold text-gray-400 uppercase tracking-wide mb-1'>Your Message</p>
                                <p className='text-sm text-gray-700 leading-relaxed whitespace-pre-line'>{msg.message}</p>
                              </div>

                              {msg.adminReply ? (
                                <div className='bg-blue-50 border border-blue-100 rounded-xl px-4 py-3'>
                                  <div className='flex items-center gap-2 mb-2'>
                                    <span>🛡️</span>
                                    <p className='text-xs font-bold text-blue-700 uppercase tracking-wide'>Admin Reply</p>
                                    {msg.repliedAt && (
                                      <span className='text-xs text-blue-400 ml-auto'>
                                        {new Date(msg.repliedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                      </span>
                                    )}
                                  </div>
                                  <p className='text-sm text-blue-900 leading-relaxed whitespace-pre-line'>{msg.adminReply}</p>
                                </div>
                              ) : (
                                <div className='bg-orange-50 border border-orange-100 rounded-xl px-4 py-3 flex items-center gap-3'>
                                  <span className='text-xl'>⏳</span>
                                  <div>
                                    <p className='text-sm font-semibold text-orange-700'>Awaiting admin reply</p>
                                    <p className='text-xs text-orange-400'>The admin has not responded yet.</p>
                                  </div>
                                </div>
                              )}

                              {msg.adminReply && (
                                msg.studentReply ? (
                                  <div className='bg-green-50 border border-green-100 rounded-xl px-4 py-3'>
                                    <div className='flex items-center gap-2 mb-1'>
                                      <span>💬</span>
                                      <p className='text-xs font-bold text-green-700 uppercase tracking-wide'>Your Reply</p>
                                      {msg.studentRepliedAt && (
                                        <span className='text-xs text-green-400 ml-auto'>
                                          {new Date(msg.studentRepliedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </span>
                                      )}
                                    </div>
                                    <p className='text-sm text-green-900 leading-relaxed whitespace-pre-line'>{msg.studentReply}</p>
                                  </div>
                                ) : (
                                  <div className='space-y-2'>
                                    <textarea
                                      rows={2}
                                      value={inboxReplyText[msg._id] || ''}
                                      onChange={e => setInboxReplyText(prev => ({ ...prev, [msg._id]: e.target.value }))}
                                      placeholder='Write a reply to the admin...'
                                      className='w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none bg-white'
                                    />
                                    <button
                                      onClick={() => sendStudentReply(msg._id)}
                                      disabled={!inboxReplyText[msg._id]?.trim() || inboxReplySending[msg._id]}
                                      className='inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-50'
                                    >
                                      {inboxReplySending[msg._id] ? 'Sending...' : 'Send Reply'}
                                    </button>
                                  </div>
                                )
                              )}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

            </div>

            {/* Quick Actions */}

            <div className="bg-white rounded-2xl shadow p-6">

              <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>

              <div className="space-y-2">

                {[

                  { icon: '🔍', label: 'Browse Courses', action: () => navigate('/courses'),   color: 'hover:bg-blue-50 hover:text-blue-700' },

                  { icon: '⚙',  label: 'Settings',       action: () => setShowSettings(true), color: 'hover:bg-purple-50 hover:text-purple-700' },

                ].map(action => (

                  <button key={action.label} onClick={action.action}

                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 transition ${action.color}`}>

                    <span className="text-lg">{action.icon}</span>

                    {action.label}

                  </button>

                ))}

              </div>

            </div>



          </div>

        </div>

      </div>



      {/* ── Modals ───────────────────────────────────────────────────────── */}

      {selectedAssignment && (

        <AssignmentModal

          assignment={selectedAssignment}

          onClose={() => setSelectedAssignment(null)}

          onDeleted={handleAssignmentDeleted}

          onUpdated={handleAssignmentUpdated}

        />

      )}

      {showSettings && (

        <SettingsModal

          user={user}

          onClose={() => setShowSettings(false)}

          onUpdated={(updatedUser) => { if (setUser) setUser(updatedUser); }}

        />

      )}

      {selectedCert && (

        <CertificateModal

          cert={selectedCert}

          user={user}

          onClose={() => setSelectedCert(null)}

        />

      )}

    </div>

  );

};



export default Dashboard;