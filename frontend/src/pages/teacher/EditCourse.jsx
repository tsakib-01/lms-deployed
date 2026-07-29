import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Upload, X, ImagePlus } from 'lucide-react';

const API = import.meta.env.VITE_BACKEND_URL;

// ── Drag handle icon ──────────────────────────────────────────────────────────
const DragHandle = () => (
  <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
    <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z"/>
  </svg>
);

const typeConfig = {
  video:      { icon: '▶', color: 'bg-blue-100 text-blue-700',    label: 'Video' },
  text:       { icon: '📄', color: 'bg-gray-100 text-gray-700',   label: 'Article' },
  pdf:        { icon: '📑', color: 'bg-red-100 text-red-700',     label: 'PDF' },
  quiz:       { icon: '❓', color: 'bg-purple-100 text-purple-700', label: 'Quiz' },
  assignment: { icon: '📝', color: 'bg-orange-100 text-orange-700', label: 'Assignment' },
};

// ── Lesson Modal ──────────────────────────────────────────────────────────────
const LessonModal = ({ lesson, courseId, onClose, onSaved }) => {
  const isEditing = !!lesson;
  const [form, setForm] = useState({
    title: lesson?.title || '',
    description: lesson?.description || '',
    type: lesson?.type || 'video',
    videoUrl: lesson?.videoUrl || '',
    content: lesson?.content || '',
    duration: lesson?.duration || '',
    isPreview: lesson?.isPreview || false,
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!form.title || !form.description) return alert('Title and description are required');
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const url = isEditing
        ? `${API}/api/teacher/courses/${courseId}/lessons/${lesson._id}`
        : `${API}/api/teacher/courses/${courseId}/lessons`;
      const res = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) { onSaved(); onClose(); }
      else { const e = await res.json(); alert(e.message); }
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl">
          <h2 className="text-xl font-bold">{isEditing ? 'Edit Lesson' : 'Add New Lesson'}</h2>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Title *</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g., Introduction to React Hooks" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Description *</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              rows={3} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              placeholder="What will students learn?" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Type *</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="video">▶ Video</option>
                <option value="text">📄 Article</option>
                <option value="pdf">📑 PDF</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Duration</label>
              <input value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g., 15 min" />
            </div>
          </div>
          {form.type === 'video' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">YouTube URL</label>
              <input value={form.videoUrl} onChange={e => setForm({ ...form, videoUrl: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="https://www.youtube.com/watch?v=..." />
            </div>
          )}
          {form.type === 'text' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Content</label>
              <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
                rows={8} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                placeholder="Write lesson content..." />
            </div>
          )}
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isPreview} onChange={e => setForm({ ...form, isPreview: e.target.checked })}
              className="w-4 h-4 accent-blue-600" />
            <span className="text-sm text-gray-700">Allow free preview (visible without enrollment)</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button onClick={handleSave} disabled={loading}
              className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50">
              {loading ? 'Saving...' : isEditing ? 'Update Lesson' : 'Add Lesson'}
            </button>
            <button onClick={onClose}
              className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Assignment Modal ──────────────────────────────────────────────────────────
const AssignmentModal = ({ assignment, courseId, onClose, onSaved }) => {
  const isEditing = !!assignment;
  const [form, setForm] = useState({
    title: assignment?.title || '',
    description: assignment?.description || '',
    deadline: assignment?.deadline ? new Date(assignment.deadline).toISOString().substring(0, 16) : '',
    maxGrade: assignment?.maxGrade || 100
  });
  const [files, setFiles] = useState([]);
  const [existingAttachments, setExistingAttachments] = useState(assignment?.attachments || []);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!form.title || !form.deadline) return alert('Title and deadline required');
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('description', form.description);
      fd.append('course', courseId);
      fd.append('deadline', form.deadline);
      fd.append('maxGrade', form.maxGrade);
      
      if (isEditing) {
        fd.append('existingAttachments', JSON.stringify(existingAttachments));
      }
      files.forEach(f => fd.append('attachments', f));

      const url = isEditing
        ? `${API}/api/teacher/assignments/${assignment._id}`
        : `${API}/api/teacher/assignments`;
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (res.ok) { onSaved(); onClose(); }
      else { const e = await res.json(); alert(e.message); }
    } finally { setLoading(false); }
  };

  const removeExistingAttachment = (index) => {
    setExistingAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-6 rounded-t-2xl">
          <h2 className="text-xl font-bold">{isEditing ? 'Edit Assignment' : 'Add Assignment'}</h2>
          <p className="text-orange-100 text-sm mt-1">This assignment will appear in the curriculum</p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Title *</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-400 outline-none"
              placeholder="e.g., Build a Todo App" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Instructions</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              rows={4} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-400 outline-none resize-none"
              placeholder="Describe what students need to do..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Deadline *</label>
              <input type="datetime-local" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-400 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Max Grade</label>
              <input type="number" value={form.maxGrade} onChange={e => setForm({ ...form, maxGrade: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-400 outline-none" />
            </div>
          </div>
          
          {/* File Attachments */}
          <div>
            {isEditing && existingAttachments.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-gray-600 mb-1">Current attachments:</p>
                <div className="space-y-1.5">
                  {existingAttachments.map((attachment, index) => {
                    const filename = attachment.split('/').pop();
                    return (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-xl border border-gray-200">
                        <span className="text-xs text-gray-700 truncate flex-1">📎 {filename}</span>
                        <button type="button" onClick={() => removeExistingAttachment(index)}
                          className="text-red-500 hover:text-red-750 text-xs font-bold px-1.5 py-0.5 rounded hover:bg-red-50 transition">
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            <label className="block text-sm font-semibold text-gray-700 mb-1">Upload Attachments</label>
            <input type="file" multiple accept=".pdf,.doc,.docx,.jpg,.png"
              onChange={e => setFiles(Array.from(e.target.files))}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm" />
            {files.length > 0 && <p className="text-xs text-gray-400 mt-1">{files.length} new file(s) selected</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={handleSave} disabled={loading}
              className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition disabled:opacity-50">
              {loading ? 'Saving...' : isEditing ? 'Update Assignment' : 'Add Assignment'}
            </button>
            <button onClick={onClose}
              className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Quiz Modal ────────────────────────────────────────────────────────────────
const QuizModal = ({ quiz, courseId, onClose, onSaved }) => {
  const isEditing = !!quiz;
  const [form, setForm] = useState({
    title: quiz?.title || '',
    description: quiz?.description || '',
    duration: quiz?.duration || 30,
    passingScore: quiz?.passingScore || 70,
  });
  const [questions, setQuestions] = useState(
    quiz?.questions || [{ question: '', options: ['', '', '', ''], correctAnswer: 0 }]
  );
  const [loading, setLoading] = useState(false);

  const addQuestion = () => setQuestions([...questions, { question: '', options: ['', '', '', ''], correctAnswer: 0 }]);
  const removeQuestion = (i) => setQuestions(questions.filter((_, idx) => idx !== i));

  const updateQuestion = (i, field, value) => {
    const q = [...questions];
    q[i] = { ...q[i], [field]: value };
    setQuestions(q);
  };

  const updateOption = (qi, oi, value) => {
    const q = [...questions];
    q[qi].options[oi] = value;
    setQuestions(q);
  };

  const handleSave = async () => {
    if (!form.title) return alert('Title required');
    if (questions.some(q => !q.question || q.options.some(o => !o)))
      return alert('Please fill all questions and options');
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const url = isEditing
        ? `${API}/api/teacher/quizzes/${quiz._id}`
        : `${API}/api/teacher/quizzes`;
      const method = isEditing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, course: courseId, questions }),
      });
      if (res.ok) { onSaved(); onClose(); }
      else { const e = await res.json(); alert(e.message); }
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-t-2xl">
          <h2 className="text-xl font-bold">{isEditing ? 'Edit Quiz' : 'Add Quiz'}</h2>
          <p className="text-purple-200 text-sm mt-1">Students must complete this before continuing</p>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Quiz Title *</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-400 outline-none"
                placeholder="e.g., Week 1 Assessment" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
              <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-400 outline-none"
                placeholder="Optional description" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Duration (minutes)</label>
              <input type="number" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-400 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Passing Score (%)</label>
              <input type="number" value={form.passingScore} onChange={e => setForm({ ...form, passingScore: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-400 outline-none" />
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-800">Questions ({questions.length})</h3>
              <button onClick={addQuestion}
                className="px-4 py-2 bg-purple-100 text-purple-700 rounded-xl text-sm font-semibold hover:bg-purple-200 transition">
                + Add Question
              </button>
            </div>

            {questions.map((q, qi) => (
              <div key={qi} className="border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Question {qi + 1}</label>
                    <input value={q.question} onChange={e => updateQuestion(qi, 'question', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-400 outline-none"
                      placeholder="Enter your question..." />
                  </div>
                  {questions.length > 1 && (
                    <button onClick={() => removeQuestion(qi)}
                      className="mt-5 text-red-500 hover:text-red-700 text-sm font-semibold px-2 py-1 rounded-lg hover:bg-red-50 transition">
                      ✕
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {q.options.map((opt, oi) => (
                    <div key={oi} className={`flex items-center gap-2 p-2 rounded-lg border ${q.correctAnswer === oi ? 'border-green-400 bg-green-50' : 'border-gray-100'}`}>
                      <input type="radio" name={`correct-${qi}`} checked={q.correctAnswer === oi}
                        onChange={() => updateQuestion(qi, 'correctAnswer', oi)}
                        className="accent-green-500 flex-shrink-0" />
                      <input value={opt} onChange={e => updateOption(qi, oi, e.target.value)}
                        className="flex-1 text-sm outline-none bg-transparent"
                        placeholder={`Option ${oi + 1}`} />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400">🟢 Select the correct answer (green = correct)</p>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={handleSave} disabled={loading}
              className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition disabled:opacity-50">
              {loading ? 'Saving...' : isEditing ? 'Update Quiz' : 'Add Quiz'}
            </button>
            <button onClick={onClose}
              className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Preview Modal ─────────────────────────────────────────────────────────────
const PreviewModal = ({ type, data, onClose }) => {
  if (!data) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-slate-700 to-slate-900 text-white p-6 rounded-t-2xl flex justify-between items-center">
          <div>
            <span className="text-xs uppercase tracking-wider font-bold bg-white/20 px-2.5 py-1 rounded-full mr-2">
              Preview Mode
            </span>
            <h2 className="text-xl font-bold inline-block">{data.title || 'Untitled'}</h2>
          </div>
          <button onClick={onClose} className="text-white hover:text-gray-200 text-lg font-bold">
            ✕
          </button>
        </div>
        <div className="p-6 space-y-6">
          {type === 'lesson' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Lesson Description</h3>
                <p className="text-slate-700 mt-1 text-sm whitespace-pre-wrap">{data.description || 'No description provided.'}</p>
              </div>
              
              {data.type === 'video' && data.videoUrl && (
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Video</h3>
                  <div className="aspect-video bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center relative">
                    {data.videoUrl.includes('youtube.com') || data.videoUrl.includes('youtu.be') ? (
                      <iframe
                        className="w-full h-full"
                        src={data.videoUrl.replace('watch?v=', 'embed/').split('&')[0]}
                        title={data.title}
                        allowFullScreen
                      />
                    ) : (
                      <div className="text-center p-4">
                        <span className="text-4xl">📺</span>
                        <p className="text-slate-400 text-xs mt-2">External Video Link:</p>
                        <a href={data.videoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-sm break-all font-medium">
                          {data.videoUrl}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {data.type === 'text' && data.content && (
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Article Content</h3>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-slate-800 text-sm whitespace-pre-wrap font-sans">
                    {data.content}
                  </div>
                </div>
              )}

              {data.type === 'pdf' && (
                <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 flex items-center gap-3">
                  <span className="text-2xl">📑</span>
                  <div>
                    <h4 className="font-semibold text-slate-800 text-sm">PDF Document</h4>
                    <p className="text-xs text-slate-500">This lesson contains a PDF attachment for reading.</p>
                  </div>
                </div>
              )}
              
              <div className="flex gap-4 text-xs text-slate-500 pt-2 border-t">
                {data.duration && <span>⏱ Duration: {data.duration}</span>}
                <span>👁 {data.isPreview ? 'Public Preview Available' : 'Enrolled Students Only'}</span>
              </div>
            </div>
          )}

          {type === 'assignment' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Instructions</h3>
                <p className="text-slate-700 mt-1 text-sm whitespace-pre-wrap">{data.description || 'No description provided.'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm">
                <div>
                  <span className="text-slate-500 text-xs block">Max Grade</span>
                  <span className="font-bold text-slate-800">{data.maxGrade || 100} points</span>
                </div>
                <div>
                  <span className="text-slate-500 text-xs block">Due Date</span>
                  <span className="font-bold text-slate-800">
                    {data.deadline ? new Date(data.deadline).toLocaleString() : 'N/A'}
                  </span>
                </div>
              </div>

              {data.attachments && data.attachments.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Attachments</h3>
                  <div className="space-y-2">
                    {data.attachments.map((url, i) => {
                      const filename = url.split('/').pop() || `Attachment ${i + 1}`;
                      return (
                        <a key={i} href={url.startsWith('http') ? url : `${API}${url}`} target="_blank" rel="noopener noreferrer" 
                          className="flex items-center gap-2 p-2.5 bg-orange-50/50 hover:bg-orange-50 border border-orange-100 rounded-lg text-xs font-medium text-orange-700 transition">
                          📎 <span className="truncate flex-1">{filename}</span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {type === 'quiz' && (
            <div className="space-y-5">
              {data.description && (
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Quiz Description</h3>
                  <p className="text-slate-700 mt-1 text-sm">{data.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm">
                <div>
                  <span className="text-slate-500 text-xs block">Duration</span>
                  <span className="font-bold text-slate-800">{data.duration || 0} minutes</span>
                </div>
                <div>
                  <span className="text-slate-500 text-xs block">Passing Score</span>
                  <span className="font-bold text-slate-800">{data.passingScore || 70}%</span>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide border-b pb-1">
                  Questions ({data.questions?.length || 0})
                </h3>
                
                {data.questions?.map((q, qi) => (
                  <div key={qi} className="p-4 border border-slate-100 rounded-xl bg-slate-50/30 space-y-2.5">
                    <p className="text-sm font-semibold text-slate-800">
                      {qi + 1}. {q.question}
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {q.options?.map((opt, oi) => (
                        <div key={oi} className={`p-2.5 rounded-lg border ${
                          q.correctAnswer === oi 
                            ? 'border-green-300 bg-green-50 text-green-800 font-medium' 
                            : 'border-slate-100 bg-white text-slate-600'
                        }`}>
                          {opt} {q.correctAnswer === oi && '✓'}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="p-4 border-t bg-slate-50 rounded-b-2xl flex justify-end">
          <button onClick={onClose} className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold transition">
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main EditCourse ───────────────────────────────────────────────────────────
const EditCourse = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [course, setCourse] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [curriculum, setCurriculum] = useState([]);
  const [activeTab, setActiveTab] = useState('curriculum');
  const [modal, setModal] = useState(null);
  const [editingLesson, setEditingLesson] = useState(null);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [previewItem, setPreviewItem] = useState(null);
  const [dragIndex, setDragIndex] = useState(null);
  const [courseDetails, setCourseDetails] = useState({
    title: '', description: '', category: '', level: 'Beginner', price: 0
  });
  const [publishing, setPublishing] = useState(false);

  // ── Thumbnail state ──────────────────────────────────────────────
 // NEW — replace with these

const [thumbnailFile, setThumbnailFile] = useState(null);       // new File object
const [thumbnailPreview, setThumbnailPreview] = useState(null); // local blob URL for preview
const [existingThumbnail, setExistingThumbnail] = useState(null); // Cloudinary URL from DB

  const categories = ['Web Development', 'Mobile Development', 'Data Science', 'Machine Learning', 'Design', 'Business', 'Marketing', 'Photography', 'Music', 'Language', 'Other'];

  useEffect(() => { fetchAll(); }, [id]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const [courseRes, assignRes, quizRes] = await Promise.all([
        fetch(`${API}/api/teacher/courses/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/api/teacher/assignments`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/api/teacher/quizzes`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const courseData = await courseRes.json();
      const assignData = await assignRes.json();
      const quizData = await quizRes.json();

      const c = courseData.course;
      setCourse(c);
      setCourseDetails({
        title: c.title, description: c.description,
        category: c.category, level: c.level || 'Beginner', price: c.price || 0
      });

      // Set existing thumbnail from DB
setExistingThumbnail(c.thumbnail || null);
setThumbnailFile(null);
if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
setThumbnailPreview(null);


      const courseAssignments = (assignData.assignments || []).filter(a => {
        const cId = a.course?._id || a.course;
        return cId?.toString() === id;
      });
      const courseQuizzes = (quizData.quizzes || []).filter(q => {
        const cId = q.course?._id || q.course;
        return cId?.toString() === id;
      });

      setAssignments(courseAssignments);
      setQuizzes(courseQuizzes);
      buildCurriculum(c, courseAssignments, courseQuizzes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const buildCurriculum = (c, courseAssignments, courseQuizzes) => {
    if (c.curriculumOrder?.length > 0) {
      const items = c.curriculumOrder
        .sort((a, b) => a.order - b.order)
        .map(item => {
          if (item.itemType === 'lesson') {
            const lesson = c.lessons?.find(l => l._id?.toString() === item.itemId?.toString());
            return lesson ? { itemType: 'lesson', itemId: item.itemId, data: lesson } : null;
          }
          if (item.itemType === 'assignment') {
            const a = courseAssignments.find(a => a._id?.toString() === item.itemId?.toString());
            return a ? { itemType: 'assignment', itemId: item.itemId, data: a } : null;
          }
          if (item.itemType === 'quiz') {
            const q = courseQuizzes.find(q => q._id?.toString() === item.itemId?.toString());
            return q ? { itemType: 'quiz', itemId: item.itemId, data: q } : null;
          }
          return null;
        })
        .filter(Boolean);
      setCurriculum(items);
    } else {
      const lessonItems = [...(c.lessons || [])]
        .sort((a, b) => a.order - b.order)
        .map(l => ({ itemType: 'lesson', itemId: l._id, data: l }));
      setCurriculum(lessonItems);
    }
  };

  // ── Thumbnail handlers ───────────────────────────────────────────
  // NEW — canvas compression → base64, no disk file ever created
const handleThumbnailChange = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) return alert('Please select a valid image file.');
  if (file.size > 5 * 1024 * 1024) return alert('Image must be smaller than 5MB.');

  setThumbnailFile(file);
  setThumbnailPreview(URL.createObjectURL(file)); // show local preview instantly
  if (fileInputRef.current) fileInputRef.current.value = '';
};

const removeThumbnail = () => {
  setThumbnailFile(null);
  if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
  setThumbnailPreview(null);
  setExistingThumbnail(null);
  if (fileInputRef.current) fileInputRef.current.value = '';
};

  // The image to display: new local preview > existing saved URL > nothing
 // NEW
// thumbnailBase64 is already a data: URI — show it directly
// existingThumbnail may be a base64 data URI (new) or a legacy /uploads path
// NEW
// Replace all the displayThumbnail logic with:
const displayThumbnail =
  thumbnailPreview ||                                              // new local pick
  (existingThumbnail?.startsWith('http') ? existingThumbnail : null); // Cloudinary URL only

  // ── Drag and drop ────────────────────────────────────────────────
  const handleDragStart = (index) => setDragIndex(index);

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    const newCurriculum = [...curriculum];
    const dragged = newCurriculum.splice(dragIndex, 1)[0];
    newCurriculum.splice(index, 0, dragged);
    setCurriculum(newCurriculum);
    setDragIndex(index);
  };

  const handleDrop = () => setDragIndex(null);

  // ── Save curriculum order ────────────────────────────────────────
  const saveCurriculumOrder = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const curriculumOrder = curriculum.map((item, index) => ({
        itemType: item.itemType,
        itemId: item.itemId,
        order: index + 1,
      }));
      const res = await fetch(`${API}/api/teacher/courses/${id}/curriculum-order`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ curriculumOrder }),
      });
      if (res.ok) alert('Curriculum saved! ✅');
      else { const e = await res.json(); alert(e.message); }
    } finally { setSaving(false); }
  };

  // ── Save course details (with optional thumbnail) ────────────────
// NEW — single JSON path, base64 included when a new image was selected
const saveCourseDetails = async () => {
  setSaving(true);
  try {
    const token = localStorage.getItem('token');

    const fd = new FormData();
    fd.append('title', courseDetails.title);
    fd.append('description', courseDetails.description);
    fd.append('category', courseDetails.category);
    fd.append('level', courseDetails.level);
    fd.append('price', courseDetails.price);

    // Only append file if user picked a NEW image
    if (thumbnailFile) {
      fd.append('thumbnail', thumbnailFile);
    } else if (existingThumbnail === null) {
      // User explicitly removed thumbnail
      fd.append('removeThumbnail', 'true');
    }

    const res = await fetch(`${API}/api/teacher/courses/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      // ⚠️ NO Content-Type — browser sets multipart boundary automatically
      body: fd,
    });

    if (res.ok) {
      setThumbnailFile(null);
      alert('Course updated! ✅');
      fetchAll();
    } else {
      const e = await res.json();
      alert(e.message);
    }
  } finally {
    setSaving(false);
  }
};
  // ── Toggle publish ───────────────────────────────────────────────
  const togglePublish = async () => {
    setPublishing(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/teacher/courses/${id}/publish`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !course.isPublished }),
      });
      if (res.ok) fetchAll();
    } finally { setPublishing(false); }
  };

  const addToCurriculum    = (itemType, data) => setCurriculum(prev => [...prev, { itemType, itemId: data._id, data }]);
  const removeFromCurriculum = (index) => setCurriculum(prev => prev.filter((_, i) => i !== index));

  const deleteLesson = async (lessonId) => {
    if (!window.confirm('Delete this lesson?')) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`${API}/api/teacher/courses/${id}/lessons/${lessonId}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      setCurriculum(prev => prev.filter(item => !(item.itemType === 'lesson' && item.itemId?.toString() === lessonId?.toString())));
      fetchAll();
    }
  };

  const deleteAssignment = async (assignmentId) => {
    if (!window.confirm('Delete this assignment permanently?')) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`${API}/api/teacher/assignments/${assignmentId}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      setCurriculum(prev => prev.filter(item => !(item.itemType === 'assignment' && item.itemId?.toString() === assignmentId?.toString())));
      fetchAll();
    } else {
      const e = await res.json();
      alert(e.message || 'Failed to delete assignment');
    }
  };

  const deleteQuiz = async (quizId) => {
    if (!window.confirm('Delete this quiz permanently?')) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`${API}/api/teacher/quizzes/${quizId}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      setCurriculum(prev => prev.filter(item => !(item.itemType === 'quiz' && item.itemId?.toString() === quizId?.toString())));
      fetchAll();
    } else {
      const e = await res.json();
      alert(e.message || 'Failed to delete quiz');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
    </div>
  );

  if (!course) return <div className="text-center py-12 text-gray-500">Course not found</div>;

  const unaddedLessons      = (course.lessons || []).filter(l => !curriculum.some(c => c.itemType === 'lesson'     && c.itemId?.toString() === l._id?.toString()));
  const unaddedAssignments  = assignments.filter(a => !curriculum.some(c => c.itemType === 'assignment' && c.itemId?.toString() === a._id?.toString()));
  const unaddedQuizzes      = quizzes.filter(q => !curriculum.some(c => c.itemType === 'quiz'       && c.itemId?.toString() === q._id?.toString()));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/teacher/dashboard')}
              className="text-gray-500 hover:text-gray-800 transition text-sm flex items-center gap-1">
              ← Back
            </button>
            <div className="h-4 w-px bg-gray-200" />
            <div>
              <h1 className="font-bold text-gray-900 text-sm">{course.title}</h1>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${course.isPublished ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {course.isPublished ? '✓ Published' : '⚪ Draft'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={togglePublish} disabled={publishing}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                course.isPublished
                  ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                  : 'bg-green-600 text-white hover:bg-green-700'}`}>
              {course.isPublished ? 'Unpublish' : 'Publish Course'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white rounded-2xl shadow p-1.5 w-fit">
          {[
            { key: 'curriculum', label: '📚 Curriculum' },
            { key: 'details',    label: '⚙ Course Details' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition ${
                activeTab === tab.key ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:text-gray-900'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Details Tab ── */}
        {activeTab === 'details' ? (
          <div className="bg-white rounded-2xl shadow p-8 max-w-2xl">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Course Details</h2>
            <div className="space-y-5">

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
                <input value={courseDetails.title}
                  onChange={e => setCourseDetails({ ...courseDetails, title: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                <textarea value={courseDetails.description}
                  onChange={e => setCourseDetails({ ...courseDetails, description: e.target.value })}
                  rows={5} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                  <select value={courseDetails.category}
                    onChange={e => setCourseDetails({ ...courseDetails, category: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Level</label>
                  <select value={courseDetails.level}
                    onChange={e => setCourseDetails({ ...courseDetails, level: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Price (USD) - Set to 0 for Free</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={courseDetails.price}
                  onChange={e => setCourseDetails({ ...courseDetails, price: parseFloat(e.target.value) || 0 })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. 49.99"
                />
                <p className="text-xs text-gray-400 mt-1.5">Premium courses will require Stripe checkout from students. Set price to 0 to keep the course free.</p>
              </div>

              {/* ── Thumbnail Upload ── */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Course Thumbnail</label>

                {displayThumbnail ? (
                  <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
                    <img
                      src={displayThumbnail}
                      alt="Course thumbnail"
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-all flex items-center justify-center group">
                      <button type="button" onClick={removeThumbnail}
                        className="opacity-0 group-hover:opacity-100 transition-opacity bg-white text-red-600 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm">
                        <X className="w-3.5 h-3.5" /> Remove
                      </button>
                    </div>
                    <div className="absolute bottom-3 right-3">
                      <button type="button" onClick={() => fileInputRef.current?.click()}
                        className="bg-white text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm hover:bg-gray-50 transition">
                        <Upload className="w-3.5 h-3.5" /> Change
                      </button>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-gray-200 rounded-xl py-10 flex flex-col items-center gap-3 hover:border-blue-400 hover:bg-blue-50/30 transition-all group">
                    <div className="w-11 h-11 bg-gray-100 group-hover:bg-blue-100 rounded-xl flex items-center justify-center transition">
                      <ImagePlus className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-gray-700">Click to upload thumbnail</p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP up to 5MB</p>
                    </div>
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  className="hidden"
                />

            {/* NEW */}
            
{thumbnailFile && (
  <p className="text-xs text-blue-600 mt-1.5 font-medium">
    ✓ New image ready — will be uploaded when you click Save Changes
  </p>
)}

              </div>

              <button onClick={saveCourseDetails} disabled={saving}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>

        ) : (
          // ── Curriculum Tab (unchanged) ──
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow">
                <div className="flex items-center justify-between p-5 border-b">
                  <div>
                    <h2 className="font-bold text-gray-900">Curriculum Builder</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Drag to reorder • Students must complete each item before the next unlocks</p>
                  </div>
                  <button onClick={saveCurriculumOrder} disabled={saving}
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50">
                    {saving ? 'Saving...' : '💾 Save Order'}
                  </button>
                </div>

                <div className="p-5">
                  {curriculum.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="text-5xl mb-4">📋</div>
                      <p className="text-gray-500 font-medium">No curriculum yet</p>
                      <p className="text-gray-400 text-sm mt-1">Add lessons, assignments, and quizzes from the right panel</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {curriculum.map((item, index) => {
                        const cfg = typeConfig[item.itemType] || typeConfig.video;
                        const data = item.data;
                        return (
                          <div key={`${item.itemType}-${item.itemId}-${index}`}
                            draggable
                            onDragStart={() => handleDragStart(index)}
                            onDragOver={e => handleDragOver(e, index)}
                            onDrop={handleDrop}
                            className={`flex items-center gap-3 p-3.5 rounded-xl border-2 transition cursor-grab active:cursor-grabbing ${
                              dragIndex === index
                                ? 'border-blue-400 bg-blue-50 scale-[1.01] shadow-lg'
                                : 'border-gray-100 hover:border-gray-200 bg-white hover:shadow-sm'}`}>
                            <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">
                              {index + 1}
                            </div>
                            <div className="flex-shrink-0 cursor-grab"><DragHandle /></div>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${cfg.color}`}>
                              {cfg.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
                                {item.itemType === 'lesson' && data?.isPreview && (
                                  <span className="text-xs text-blue-500 font-semibold">Preview</span>
                                )}
                              </div>
                              <p className="text-sm font-semibold text-gray-800 truncate mt-0.5">{data?.title || 'Untitled'}</p>
                              {data?.duration && <p className="text-xs text-gray-400">⏱ {data.duration}</p>}
                              {item.itemType === 'assignment' && data?.deadline && (
                                <p className="text-xs text-gray-400">📅 Due {new Date(data.deadline).toLocaleDateString()}</p>
                              )}
                              {item.itemType === 'quiz' && (
                                <p className="text-xs text-gray-400">{data?.questions?.length} questions • {data?.duration} min</p>
                              )}
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button onClick={() => setPreviewItem({ type: item.itemType, data })}
                                className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition text-xs font-semibold">
                                Preview
                              </button>
                              {item.itemType === 'lesson' && (
                                <button onClick={() => { setEditingLesson(data); setModal('editLesson'); }}
                                  className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition text-xs font-semibold">
                                  Edit
                                </button>
                              )}
                              {item.itemType === 'assignment' && (
                                <button onClick={() => { setEditingAssignment(data); setModal('editAssignment'); }}
                                  className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition text-xs font-semibold">
                                  Edit
                                </button>
                              )}
                              {item.itemType === 'quiz' && (
                                <button onClick={() => { setEditingQuiz(data); setModal('editQuiz'); }}
                                  className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition text-xs font-semibold">
                                  Edit
                                </button>
                              )}
                              <button onClick={() => removeFromCurriculum(index)}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      <div className="flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 text-sm">
                        <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-xs">🎓</div>
                        <span className="font-medium">Course Complete</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Panel */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl shadow p-5">
                <h3 className="font-bold text-gray-900 mb-3">Add to Curriculum</h3>
                <div className="space-y-2">
                  <button onClick={() => setModal('lesson')}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition font-semibold text-sm">
                    <span className="text-lg">▶</span> New Lesson
                  </button>
                  <button onClick={() => setModal('assignment')}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-orange-50 text-orange-700 rounded-xl hover:bg-orange-100 transition font-semibold text-sm">
                    <span className="text-lg">📝</span> New Assignment
                  </button>
                  <button onClick={() => setModal('quiz')}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-purple-50 text-purple-700 rounded-xl hover:bg-purple-100 transition font-semibold text-sm">
                    <span className="text-lg">❓</span> New Quiz
                  </button>
                </div>
              </div>

              {unaddedLessons.length > 0 && (
                <div className="bg-white rounded-2xl shadow p-5">
                  <h3 className="font-bold text-gray-900 mb-3 text-sm">Lessons not in curriculum</h3>
                  <div className="space-y-2">
                    {unaddedLessons.map(l => (
                      <div key={l._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-sm">{typeConfig[l.type]?.icon || '📄'}</span>
                          <span className="text-sm font-medium text-gray-700 truncate">{l.title}</span>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <button onClick={() => addToCurriculum('lesson', l)}
                            className="text-xs bg-blue-600 text-white px-2.5 py-1 rounded-lg hover:bg-blue-700 transition">
                            + Add
                          </button>
                          <button onClick={() => deleteLesson(l._id)}
                            className="text-xs bg-red-50 text-red-500 px-2.5 py-1 rounded-lg hover:bg-red-100 transition">
                            Del
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {unaddedAssignments.length > 0 && (
                <div className="bg-white rounded-2xl shadow p-5">
                  <h3 className="font-bold text-gray-900 mb-3 text-sm">Assignments not in curriculum</h3>
                  <div className="space-y-2">
                    {unaddedAssignments.map(a => (
                      <div key={a._id} className="flex items-center justify-between p-3 bg-orange-50 rounded-xl">
                        <span className="text-sm font-medium text-gray-700 truncate flex-1">{a.title}</span>
                        <div className="flex gap-1 flex-shrink-0 ml-2">
                          <button onClick={() => addToCurriculum('assignment', a)}
                            className="text-xs bg-orange-500 text-white px-2.5 py-1 rounded-lg hover:bg-orange-600 transition">
                            + Add
                          </button>
                          <button onClick={() => deleteAssignment(a._id)}
                            className="text-xs bg-red-50 text-red-500 px-2.5 py-1 rounded-lg hover:bg-red-100 transition">
                            Del
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {unaddedQuizzes.length > 0 && (
                <div className="bg-white rounded-2xl shadow p-5">
                  <h3 className="font-bold text-gray-900 mb-3 text-sm">Quizzes not in curriculum</h3>
                  <div className="space-y-2">
                    {unaddedQuizzes.map(q => (
                      <div key={q._id} className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
                        <span className="text-sm font-medium text-gray-700 truncate flex-1">{q.title}</span>
                        <div className="flex gap-1 flex-shrink-0 ml-2">
                          <button onClick={() => addToCurriculum('quiz', q)}
                            className="text-xs bg-purple-600 text-white px-2.5 py-1 rounded-lg hover:bg-purple-700 transition">
                            + Add
                          </button>
                          <button onClick={() => deleteQuiz(q._id)}
                            className="text-xs bg-red-50 text-red-500 px-2.5 py-1 rounded-lg hover:bg-red-100 transition">
                            Del
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white rounded-2xl shadow p-5">
                <h3 className="font-bold text-gray-900 mb-3 text-sm">Curriculum Stats</h3>
                <div className="space-y-2">
                  {[
                    { label: 'Lessons',     count: curriculum.filter(i => i.itemType === 'lesson').length,     color: 'text-blue-600' },
                    { label: 'Assignments', count: curriculum.filter(i => i.itemType === 'assignment').length, color: 'text-orange-600' },
                    { label: 'Quizzes',     count: curriculum.filter(i => i.itemType === 'quiz').length,       color: 'text-purple-600' },
                  ].map(s => (
                    <div key={s.label} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{s.label}</span>
                      <span className={`font-bold ${s.color}`}>{s.count}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 flex items-center justify-between text-sm">
                    <span className="text-gray-600 font-semibold">Total Items</span>
                    <span className="font-bold text-gray-900">{curriculum.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {modal === 'lesson' && (
        <LessonModal courseId={id} onClose={() => setModal(null)}
          onSaved={() => { fetchAll(); setModal(null); }} />
      )}
      {modal === 'editLesson' && editingLesson && (
        <LessonModal lesson={editingLesson} courseId={id}
          onClose={() => { setModal(null); setEditingLesson(null); }}
          onSaved={() => { fetchAll(); setModal(null); setEditingLesson(null); }} />
      )}
      {modal === 'assignment' && (
        <AssignmentModal courseId={id} onClose={() => setModal(null)}
          onSaved={() => { fetchAll(); setModal(null); }} />
      )}
      {modal === 'editAssignment' && editingAssignment && (
        <AssignmentModal assignment={editingAssignment} courseId={id}
          onClose={() => { setModal(null); setEditingAssignment(null); }}
          onSaved={() => { fetchAll(); setModal(null); setEditingAssignment(null); }} />
      )}
      {modal === 'quiz' && (
        <QuizModal courseId={id} onClose={() => setModal(null)}
          onSaved={() => { fetchAll(); setModal(null); }} />
      )}
      {modal === 'editQuiz' && editingQuiz && (
        <QuizModal quiz={editingQuiz} courseId={id}
          onClose={() => { setModal(null); setEditingQuiz(null); }}
          onSaved={() => { fetchAll(); setModal(null); setEditingQuiz(null); }} />
      )}
      {previewItem && (
        <PreviewModal type={previewItem.type} data={previewItem.data}
          onClose={() => setPreviewItem(null)} />
      )}
    </div>
  );
};

export default EditCourse;