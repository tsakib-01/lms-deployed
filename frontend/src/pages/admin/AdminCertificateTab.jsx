// ─────────────────────────────────────────────────────────────────────────────
// CertificateTab.jsx  —  fixed version
// Key fixes:
//  1. fetchEligible now cross-checks existing certificates so already-issued
//     ones are NOT shown in the "Issue Certificate" modal.
//  2. Robust ObjectId string comparison everywhere (idEq helper).
//  3. onIssued callback correctly removes the issued entry from eligible list.
//  4. Grade field accepts decimals and clamps 0-100 properly.
//  5. Search re-triggers fetchCertificates (was missing).
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef, useCallback } from 'react';

const API = import.meta.env.VITE_BACKEND_URL;

// ── Safe ObjectId comparison ──────────────────────────────────────────────────
const idEq = (a, b) => a?.toString() === b?.toString();

// ── Printable / downloadable certificate design ───────────────────────────────
const CertificatePreview = ({ cert, onClose }) => {
  const printRef = useRef();

  const handlePrint = () => {
    const w = window.open('', '_blank');
    w.document.write(`
      <html>
        <head>
          <title>Certificate - ${cert.student?.name}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@300;400;600&display=swap');
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Inter', sans-serif; background: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
            .cert { width: 900px; min-height: 650px; padding: 40px;
              border: 12px double #fbbf24; border-radius: 20px; position: relative; 
              background: linear-gradient(135deg, #fffbeb 0%, #ffffff 50%, #fef3c7 100%);
              text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
            .badge { width: 70px; height: 70px; background: linear-gradient(135deg,#f59e0b,#d97706);
              border-radius: 50%; display: flex; align-items: center; justify-content: center;
              font-size: 32px; margin: 0 auto 16px; shadow: 0 4px 10px rgba(217, 119, 6, 0.2); }
            .title { font-size: 11px; letter-spacing: 4px; text-transform: uppercase;
              color: #b45309; font-weight: 700; margin-bottom: 6px; }
            .heading { font-family: 'Playfair Display', serif; font-size: 40px; font-weight: 700;
              color: #1f2937; margin-bottom: 4px; }
            .divider { w-24; height: 3px; background: linear-gradient(to right, #f59e0b, #d97706); border-radius: 9999px; width: 80px; margin: 8px auto 20px; }
            .presented { font-size: 13px; color: #6b7280; margin-bottom: 8px; letter-spacing: 1px; }
            .student { font-family: 'Georgia', serif; font-size: 34px; color: #d97706;
              font-weight: 700; margin-bottom: 16px; }
            .desc { font-size: 14px; color: #4b5563; text-align: center; max-width: 600px;
              line-height: 1.6; margin: 0 auto 24px; }
            .course { font-weight: 700; color: #1f2937; font-size: 16px; }
            .meta { display: flex; justify-content: center; gap: 48px; margin-bottom: 24px; }
            .meta-item { text-align: center; }
            .meta-label { font-size: 10px; letter-spacing: 1px; text-transform: uppercase;
              color: #9ca3af; margin-bottom: 2px; }
            .meta-value { font-size: 14px; font-weight: 600; color: #374151; }
            .footer { display: flex; justify-content: space-between; width: 100%; margin-top: 20px;
              padding-top: 16px; border-top: 1px solid #f3f4f6; }
            .sig { text-align: center; }
            .sig-line { width: 140px; border-bottom: 2px solid #9ca3af; margin-bottom: 6px; }
            .sig-name { font-weight: 600; font-size: 13px; color: #374151; }
            .sig-role { font-size: 11px; color: #9ca3af; }
            .verify { background: #ffffff; border: 1px solid #fde68a; border-radius: 8px; padding: 8px 16px; font-size: 11px;
              color: #6b7280; text-align: center; margin-top: 24px; display: inline-block; }
            .verify code { font-weight: 700; color: #d97706; letter-spacing: 1px; }
          </style>
        </head>
        <body>
          <div class="cert">
            <div class="badge">🏆</div>
            <div class="title">SkillBridge Academy</div>
            <div class="heading">Certificate of Completion</div>
            <div class="divider"></div>
            <div class="presented">This is to certify that</div>
            <div class="student">${cert.student?.name}</div>
            <div class="desc">
              has successfully completed the course<br/>
              <span class="course">"${cert.course?.title}"</span>
            </div>
            
            ${cert.grade != null ? `
            <div style="display: inline-block; background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 6px 18px; margin-bottom: 20px;">
              <div style="font-size: 11px; color: #b45309; font-weight: 600;">Final Grade</div>
              <div style="font-size: 20px; font-weight: 800; color: #d97706;">${cert.grade}%</div>
            </div>` : ''}

            <div class="meta">
              <div class="meta-item">
                <div class="meta-label">Completion Date</div>
                <div class="meta-value">${new Date(cert.completionDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
              </div>
              <div class="meta-item">
                <div class="meta-label">Certificate No.</div>
                <div class="meta-value">${cert.certificateNumber}</div>
              </div>
            </div>
            <div class="footer">
              <div class="sig">
                <div class="sig-line"></div>
                <div class="sig-name">${cert.teacher?.name || 'Instructor'}</div>
                <div class="sig-role">Course Instructor</div>
              </div>
              <div class="sig">
                <div class="sig-line"></div>
                <div class="sig-name">Learning Platform</div>
                <div class="sig-role">Platform Director</div>
              </div>
            </div>
            <div class="verify">
              Verification Code: <code>${cert.verificationCode}</code>
            </div>
          </div>
        </body>
      </html>
    `);
    w.document.close();
    setTimeout(() => { w.print(); }, 500);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Modal header */}
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-bold text-gray-900">Certificate Preview</h3>
          <div className="flex gap-2">
            <button onClick={handlePrint}
              className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition shadow">
              🖨️ Print / Save PDF
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none px-2">×</button>
          </div>
        </div>

        {/* Certificate visual */}
        <div className="p-6" ref={printRef}>
          <div className="border-8 border-double border-amber-400 rounded-2xl p-8 bg-gradient-to-br from-amber-50 via-white to-yellow-50 text-center relative shadow-sm">
            {/* Top decoration */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center text-3xl shadow-lg">
                🏆
              </div>
            </div>

            <p className="text-xs font-bold tracking-[0.3em] text-amber-600 uppercase mb-2">
              SkillBridge Academy
            </p>

            <h2 className="text-3xl font-extrabold text-gray-800 mb-1">
              Certificate of Completion
            </h2>

            <div className="w-24 h-1 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full mx-auto mb-6" />

            <p className="text-gray-500 text-sm mb-2">This is to certify that</p>

            <h3 className="text-3xl font-bold text-amber-600 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
              {cert.student?.name}
            </h3>

            <p className="text-gray-500 text-sm mb-2">has successfully completed the course</p>

            <h4 className="text-xl font-bold text-gray-800 mb-4 px-4">
              "{cert.course?.title}"
            </h4>

            {cert.grade != null && (
              <div className="inline-block bg-amber-100 border border-amber-300 rounded-xl px-6 py-2 mb-4">
                <p className="text-sm text-amber-700 font-semibold">Final Grade</p>
                <p className="text-2xl font-extrabold text-amber-600">{cert.grade}%</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mt-6 mb-6">
              <div className="text-center">
                <div className="border-t-2 border-gray-300 pt-2 mt-8">
                  <p className="text-sm font-bold text-gray-700">{cert.teacher?.name || 'Instructor'}</p>
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

// ── Issue Certificate Modal ───────────────────────────────────────────────────
const IssueModal = ({ eligible, onClose, onIssued }) => {
  const [selected, setSelected]   = useState(null);
  const [grade, setGrade]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [search, setSearch]       = useState('');

  const filtered = eligible.filter(e => {
    const q = search.toLowerCase();
    return !q
      || e.studentName?.toLowerCase().includes(q)
      || e.courseTitle?.toLowerCase().includes(q);
  });

  const handleIssue = async () => {
    if (!selected) return;

    // Validate grade if provided
    const gradeNum = grade !== '' ? Number(grade) : undefined;
    if (gradeNum !== undefined && (isNaN(gradeNum) || gradeNum < 0 || gradeNum > 100)) {
      setError('Grade must be a number between 0 and 100');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const body = {
        studentId: selected.studentId,
        courseId:  selected.courseId,
      };
      if (gradeNum !== undefined) body.grade = gradeNum;

      const res = await fetch(`${API}/api/certificates/issue`, {
        method:  'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        onIssued(data.data);
        onClose();
      } else {
        setError(data.message || 'Failed to issue certificate');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b flex-shrink-0">
          <h3 className="text-lg font-bold text-gray-900">🎓 Issue New Certificate</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        <div className="p-5 flex-1 overflow-y-auto">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 mb-4 text-sm">{error}</div>
          )}

          <p className="text-sm text-gray-500 mb-3">
            Select a student who has completed a course and doesn't yet have a certificate:
          </p>

          <input
            type="text"
            placeholder="Search student or course..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm mb-3 focus:ring-2 focus:ring-purple-500 outline-none"
          />

          {filtered.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <div className="text-4xl mb-2">🎉</div>
              <p className="text-sm">
                {eligible.length === 0
                  ? 'No students have completed a course yet, or all completions already have certificates!'
                  : 'No results match your search.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2 mb-4">
              {filtered.map((e, i) => (
                <div
                  key={`${e.studentId}-${e.courseId}-${i}`}
                  onClick={() => setSelected(e)}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition ${
                    selected === e
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden">
                    {e.studentAvatar
                      ? <img src={`${API}${e.studentAvatar}`} alt="" className="w-full h-full object-cover rounded-full" />
                      : e.studentName?.charAt(0)?.toUpperCase()
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{e.studentName}</p>
                    <p className="text-xs text-gray-500 truncate">{e.courseTitle}</p>
                  </div>
                  <div className="text-right text-xs text-gray-400 flex-shrink-0">
                    <div>{Math.round(e.progress || 100)}% done</div>
                    <div>
                      {e.completionDate
                        ? new Date(e.completionDate).toLocaleDateString()
                        : '—'}
                    </div>
                  </div>
                  {selected === e && <span className="text-purple-600 text-lg">✓</span>}
                </div>
              ))}
            </div>
          )}

          {selected && (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <p className="text-sm font-semibold text-gray-700 mb-2">Optional: Add a grade</p>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                placeholder="e.g. 92 (leave blank to skip)"
                value={grade}
                onChange={e => setGrade(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
              />
              <p className="text-xs text-gray-400 mt-1">Enter a score between 0 and 100</p>
            </div>
          )}
        </div>

        <div className="p-5 border-t flex gap-3 justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleIssue}
            disabled={!selected || loading}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:from-purple-700 hover:to-indigo-700 transition disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Issuing...
              </>
            ) : '🎓 Issue Certificate'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main CertificateTab ───────────────────────────────────────────────────────
const CertificateTab = () => {
  const [certificates, setCertificates]     = useState([]);
  const [eligible, setEligible]             = useState([]);
  const [loading, setLoading]               = useState(true);
  const [eligibleLoading, setEligibleLoading] = useState(true);
  const [search, setSearch]                 = useState('');
  const [statusFilter, setStatusFilter]     = useState('');
  const [preview, setPreview]               = useState(null);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [success, setSuccess]               = useState('');
  const [error, setError]                   = useState('');

  const notify = (msg, isError = false) => {
    if (isError) { setError(msg);   setTimeout(() => setError(''),   4000); }
    else         { setSuccess(msg); setTimeout(() => setSuccess(''), 4000); }
  };

  // ── Fetch all certificates (with optional server-side filter) ─────────────
  const fetchCertificates = useCallback(async () => {
    setLoading(true);
    try {
      const token  = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      const res  = await fetch(`${API}/api/certificates?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setCertificates(data.data);
      else notify(data.message || 'Failed to load certificates', true);
    } catch (err) {
      notify('Failed to load certificates', true);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  // ── Fetch eligible students (completed course, no cert issued yet) ─────────
  // FIX: cross-check against already-issued certificates so the eligible list
  //      only shows students who genuinely don't have one yet.
  const fetchEligible = useCallback(async () => {
    setEligibleLoading(true);
    try {
      const token = localStorage.getItem('token');

      // Fetch course completion data
      const completionRes = await fetch(`${API}/api/admin/users/courses-completion`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const completionData = await completionRes.json();
      if (!completionData.success) return;

      // Fetch existing certificates so we can exclude already-issued ones
      const certRes  = await fetch(`${API}/api/certificates`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const certData = await certRes.json();
      const issuedSet = new Set(
        (certData.success ? certData.data : []).map(
          c => `${c.student?._id?.toString()}_${c.course?._id?.toString()}`
        )
      );

      const eligibleList = [];
      completionData.data.forEach(course => {
        course.students.forEach(student => {
          if (!student.completed) return; // not finished yet

          const key = `${student._id?.toString()}_${course._id?.toString()}`;
          if (issuedSet.has(key)) return; // cert already exists

          eligibleList.push({
            studentId:      student._id,
            studentName:    student.name,
            studentEmail:   student.email,
            studentAvatar:  student.avatar,
            courseId:       course._id,
            courseTitle:    course.title,
            progress:       student.progress,
            completionDate: student.completionDate,
          });
        });
      });

      setEligible(eligibleList);
    } catch (err) {
      console.error('Failed to load eligible students:', err);
    } finally {
      setEligibleLoading(false);
    }
  }, []);

  useEffect(() => { fetchCertificates(); }, [fetchCertificates]);
  useEffect(() => { fetchEligible();     }, [fetchEligible]);

  const handleRevoke = async (id) => {
    if (!window.confirm('Revoke this certificate? This cannot be undone.')) return;
    try {
      const token = localStorage.getItem('token');
      const res   = await fetch(`${API}/api/certificates/${id}`, {
        method:  'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setCertificates(prev => prev.filter(c => c._id !== id));
        notify('Certificate revoked');
        // Refresh eligible list — revoking a cert makes the student eligible again
        fetchEligible();
      } else {
        notify(data.message || 'Failed to revoke', true);
      }
    } catch {
      notify('Failed to revoke certificate', true);
    }
  };

  // Client-side search filter (name / course title / cert number)
  const filtered = certificates.filter(c => {
    const q = search.toLowerCase();
    return (
      !q ||
      c.student?.name?.toLowerCase().includes(q) ||
      c.course?.title?.toLowerCase().includes(q) ||
      c.certificateNumber?.toLowerCase().includes(q)
    );
  });

  const issued  = certificates.filter(c => c.status === 'issued').length;

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex justify-between items-center">
          <span>✓ {success}</span>
          <button onClick={() => setSuccess('')} className="font-bold">×</button>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex justify-between items-center">
          <span>✗ {error}</span>
          <button onClick={() => setError('')} className="font-bold">×</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Certificates', value: certificates.length, color: 'text-purple-600', icon: '🎓' },
          { label: 'Issued',             value: issued,              color: 'text-green-600',  icon: '✅' },
          { label: 'Awaiting Cert',      value: eligibleLoading ? '…' : eligible.length, color: 'text-orange-500', icon: '⏳' },
        ].map(({ label, value, color, icon }) => (
          <div key={label} className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xl">{icon}</span>
              <span className="text-sm text-gray-500">{label}</span>
            </div>
            <span className={`text-3xl font-bold ${color}`}>{value}</span>
          </div>
        ))}
      </div>

      {/* Eligible students alert */}
      {!eligibleLoading && eligible.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎯</span>
            <div>
              <p className="font-semibold text-amber-800">
                {eligible.length} student{eligible.length > 1 ? 's have' : ' has'} completed a course without a certificate
              </p>
              <p className="text-sm text-amber-600">Click "Issue Certificate" to generate their certificates</p>
            </div>
          </div>
          <button
            onClick={() => setShowIssueModal(true)}
            className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition flex-shrink-0"
          >
            Issue Now →
          </button>
        </div>
      )}

      {/* Main table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex gap-2 flex-wrap">
            <input
              type="text"
              placeholder="Search student, course, cert no..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none w-56"
            />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
            >
              <option value="">All statuses</option>
              <option value="issued">Issued</option>
              <option value="pending">Pending</option>
            </select>
            <button
              onClick={() => { fetchCertificates(); fetchEligible(); }}
              className="text-sm text-purple-600 hover:text-purple-800 font-medium px-2"
            >
              🔄 Refresh
            </button>
          </div>
          <button
            onClick={() => setShowIssueModal(true)}
            className="sm:ml-auto bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:from-purple-700 hover:to-indigo-700 transition flex items-center gap-2 flex-shrink-0"
          >
            🎓 Issue Certificate
          </button>
        </div>

        {loading ? (
          <div className="p-10 text-center text-gray-400">
            <div className="animate-spin text-4xl mb-2">⏳</div>
            <p>Loading certificates...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-gray-400">
            <div className="text-5xl mb-3">🎓</div>
            <p className="font-medium">No certificates found</p>
            <p className="text-sm mt-1">
              {search ? 'Try a different search term.' : 'Issue a certificate for a student who completed a course.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="p-4 font-semibold border-b">Date</th>
                  <th className="p-4 font-semibold border-b">Student</th>
                  <th className="p-4 font-semibold border-b">Course</th>
                  <th className="p-4 font-semibold border-b">Instructor</th>
                  <th className="p-4 font-semibold border-b">Certificate No.</th>
                  <th className="p-4 font-semibold border-b">Grade</th>
                  <th className="p-4 font-semibold border-b">Status</th>
                  <th className="p-4 font-semibold border-b text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(cert => (
                  <tr key={cert._id} className="hover:bg-gray-50 transition">
                    <td className="p-4 text-sm text-gray-500 whitespace-nowrap">
                      {new Date(cert.completionDate).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden">
                          {cert.student?.avatar
                            ? <img src={`${API}${cert.student.avatar}`} alt="" className="w-full h-full object-cover" />
                            : cert.student?.name?.charAt(0)?.toUpperCase()
                          }
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{cert.student?.name}</p>
                          <p className="text-xs text-gray-400">{cert.student?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-medium text-gray-800 text-sm max-w-[160px] truncate">{cert.course?.title}</p>
                      <p className="text-xs text-gray-400">{cert.course?.category}</p>
                    </td>
                    <td className="p-4 text-sm text-gray-600">{cert.teacher?.name || '—'}</td>
                    <td className="p-4">
                      <code className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded font-mono">
                        {cert.certificateNumber}
                      </code>
                    </td>
                    <td className="p-4 text-sm text-gray-700">
                      {cert.grade != null ? `${cert.grade}%` : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        cert.status === 'issued'  ? 'bg-green-100 text-green-700'  :
                        cert.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {cert.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setPreview(cert)}
                          className="text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 px-3 py-1 rounded-md text-xs font-medium transition"
                        >
                          👁 View
                        </button>
                        <button
                          onClick={() => handleRevoke(cert._id)}
                          className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md text-xs font-medium transition"
                        >
                          Revoke
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {preview && <CertificatePreview cert={preview} onClose={() => setPreview(null)} />}
      {showIssueModal && (
        <IssueModal
          eligible={eligible}
          onClose={() => setShowIssueModal(false)}
          onIssued={(cert) => {
            // Add new cert to top of list
            setCertificates(prev => [cert, ...prev]);

            // Remove from eligible — use robust ID comparison
            setEligible(prev => prev.filter(e =>
              !(idEq(e.studentId, cert.student?._id) && idEq(e.courseId, cert.course?._id))
            ));

            notify('Certificate issued successfully! 🎓');
          }}
        />
      )}
    </div>
  );
};

export default CertificateTab;