// components/AssignmentSubmission.jsx
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

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
      <div className="flex flex-col justify-center items-center h-64 bg-gray-50 rounded-xl border border-dashed border-gray-200">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
        <span className="text-gray-500 font-medium mt-2">Loading PDF inline...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-64 bg-red-50 rounded-xl border border-red-200 p-6 text-center">
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
      className="w-full h-[70vh] border-0"
      title={title}
    />
  );
};

const AssignmentSubmission = ({ assignment, onClose }) => {
  const { id: courseId } = useParams();
  const [submission, setSubmission] = useState(null);
  const [text, setText] = useState('');
  const [files, setFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem('token');
  const API_URL = import.meta.env.VITE_BACKEND_URL;

  const getFileSrc = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${API_URL}${path}`;
  };

  useEffect(() => {
    fetchSubmission();
  }, [assignment._id]);

  const fetchSubmission = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/courses/${courseId}/assignments/${assignment._id}/submission`,
        {
          headers: { 'x-auth-token': token }
        }
      );

      const data = await response.json();
      if (data.success && data.submission) {
        setSubmission(data.submission);
        setText(data.submission.content || '');
        setFiles(data.submission.files || []);
      }
    } catch (error) {
      console.error('Error fetching submission:', error);
    }
  };

  const handleFilesChange = (e) => {
    const newFiles = Array.from(e.target.files);
    setSelectedFiles([...selectedFiles, ...newFiles]);
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const saveDraft = async () => {
    try {
      setSaving(true);
      const formData = new FormData();
      formData.append('text', text);
      
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch(
        `${API_URL}/api/courses/${courseId}/assignments/${assignment._id}/draft`,
        {
          method: 'POST',
          headers: { 'x-auth-token': token },
          body: formData
        }
      );

      const data = await response.json();
      
      if (data.success) {
        alert('✅ Draft saved!');
        setSubmission(data.submission);
        setFiles(data.submission.files || []);
        setSelectedFiles([]);
        fetchSubmission();
      } else {
        alert('❌ ' + data.message);
      }
    } catch (error) {
      console.error('Save draft error:', error);
      alert('❌ Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!text && files.length === 0 && selectedFiles.length === 0) {
      alert('Please add your work before submitting');
      return;
    }

    if (selectedFiles.length > 0 || text !== (submission?.content || '')) {
      await saveDraft();
    }

    try {
      setLoading(true);
      const response = await fetch(
        `${API_URL}/api/courses/${courseId}/assignments/${assignment._id}/submit`,
        {
          method: 'POST',
          headers: {
            'x-auth-token': token,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();
      
      if (data.success) {
        alert('✅ Assignment handed in!');
        fetchSubmission();
      } else {
        alert('❌ ' + data.message);
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('❌ Failed to submit');
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubmit = async () => {
    if (!window.confirm('Are you sure you want to unsubmit?')) return;

    try {
      setLoading(true);
      const response = await fetch(
        `${API_URL}/api/courses/${courseId}/assignments/${assignment._id}/unsubmit`,
        {
          method: 'POST',
          headers: {
            'x-auth-token': token,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();
      
      if (data.success) {
        alert('✅ Assignment unsubmitted');
        fetchSubmission();
      } else {
        alert('❌ ' + data.message);
      }
    } catch (error) {
      console.error('Unsubmit error:', error);
      alert('❌ Failed to unsubmit');
    } finally {
      setLoading(false);
    }
  };

  const addComment = async () => {
    if (!comment.trim() || !submission) return;

    try {
      const response = await fetch(
        `${API_URL}/api/courses/submissions/${submission._id}/comments`,
        {
          method: 'POST',
          headers: {
            'x-auth-token': token,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ comment })
        }
      );

      const data = await response.json();
      
      if (data.success) {
        setSubmission(data.submission);
        setComment('');
      } else {
        alert('❌ ' + data.message);
      }
    } catch (error) {
      console.error('Add comment error:', error);
    }
  };

  const deleteFile = async (fileId) => {
    if (!window.confirm('Delete this file?')) return;

    try {
      const response = await fetch(
        `${API_URL}/api/courses/submissions/${submission._id}/files/${fileId}`,
        {
          method: 'DELETE',
          headers: { 'x-auth-token': token }
        }
      );

      const data = await response.json();
      
      if (data.success) {
        setSubmission(data.submission);
        setFiles(data.submission.files || []);
      }
    } catch (error) {
      console.error('Delete file error:', error);
    }
  };

  const openPreview = (file) => {
    console.log('📂 Opening preview for file:', file);
    console.log('📂 Full path:', `${API_URL}${file.path}`);
    console.log('📂 Mimetype:', file.mimetype);
    setPreviewFile(file);
  };

  const getFileIcon = (mimetype) => {
    if (mimetype.includes('pdf')) return '📄';
    if (mimetype.includes('image')) return '🖼️';
    if (mimetype.includes('video')) return '🎥';
    if (mimetype.includes('word') || mimetype.includes('document')) return '📝';
    if (mimetype.includes('sheet') || mimetype.includes('excel')) return '📊';
    if (mimetype.includes('presentation') || mimetype.includes('powerpoint')) return '📊';
    return '📎';
  };

  const isSubmitted = submission?.status === 'submitted';
  const isGraded = submission?.graded;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold">{assignment.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-3xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            {isGraded ? (
              <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full font-semibold inline-block">
                ✅ Graded - {submission.grade}/{assignment.maxPoints || 100}
              </span>
            ) : isSubmitted ? (
              <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full font-semibold inline-block">
                ✓ Handed in
              </span>
            ) : (
              <span className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full font-semibold inline-block">
                📝 Not handed in
              </span>
            )}
          </div>

          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Instructions:</h3>
            <p className="text-gray-700">{assignment.description}</p>
            {assignment.deadline && (
              <p className="text-sm text-gray-500 mt-2">
                Due: {new Date(assignment.deadline).toLocaleString()}
              </p>
            )}
          </div>

          <div className="bg-white rounded-lg border p-6 mb-6">
            <h3 className="text-xl font-bold mb-4">Your work</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Answer
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={isSubmitted || isGraded}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                rows="6"
                placeholder="Type your answer here..."
              />
            </div>

            {files.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Uploaded Files
                </label>
                <div className="space-y-2">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">
                          {getFileIcon(file.mimetype)}
                        </span>
                        <div>
                          <p className="font-medium">{file.originalName}</p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openPreview(file)}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
                        >
                          Preview
                        </button>
                        {!isSubmitted && !isGraded && (
                          <button
                            onClick={() => deleteFile(file._id)}
                            className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!isSubmitted && !isGraded && (
              <>
                {selectedFiles.length > 0 && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Files to Upload
                    </label>
                    <div className="space-y-2">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">📎</span>
                            <div>
                              <p className="font-medium">{file.name}</p>
                              <p className="text-xs text-gray-500">
                                {(file.size / 1024).toFixed(2)} KB
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => removeSelectedFile(index)}
                            className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mb-4">
                  <label className="cursor-pointer inline-block px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">
                    <input
                      type="file"
                      multiple
                      onChange={handleFilesChange}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt,.xls,.xlsx,.ppt,.pptx,.mp4,.avi,.mov"
                    />
                    📎 Add Files
                  </label>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={saveDraft}
                    disabled={saving || loading}
                    className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : '💾 Save Draft'}
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading || saving}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {loading ? 'Submitting...' : '✓ Hand in'}
                  </button>
                </div>
              </>
            )}

            {isSubmitted && !isGraded && (
              <button
                onClick={handleUnsubmit}
                disabled={loading}
                className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
              >
                Unsubmit
              </button>
            )}

            {isSubmitted && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  Handed in on {new Date(submission.submittedAt).toLocaleString()}
                </p>
              </div>
            )}

            {isGraded && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">Feedback</h4>
                <p className="text-sm text-green-700">{submission.feedback}</p>
              </div>
            )}
          </div>

          {submission && (
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-xl font-bold mb-4">💬 Private Comments</h3>
              
              <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
                {submission.privateComments?.map((c, index) => (
                  <div key={index} className="flex space-x-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {c.user?.name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-semibold">{c.user?.name || 'User'}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(c.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{c.comment}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex space-x-3">
                <input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addComment()}
                  placeholder="Add a private comment..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={addComment}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Send
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {previewFile && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-bold">{previewFile.originalName}</h3>
              <div className="flex space-x-2">
                <a
                  href={getFileSrc(previewFile.path)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
                >
                  Open in New Tab
                </a>
                <button
                  onClick={() => setPreviewFile(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
              {previewFile.mimetype.includes('image') ? (
                <img 
                  src={getFileSrc(previewFile.path)} 
                  alt={previewFile.originalName}
                  className="max-w-full h-auto mx-auto"
                  onError={(e) => {
                    console.error('❌ Image failed to load');
                    e.target.src = 'https://via.placeholder.com/400x300?text=Failed+to+Load+Image';
                  }}
                />
              ) : previewFile.mimetype.includes('pdf') ? (
                <div className="space-y-4">
                  <PdfInlineViewer
                    url={getFileSrc(previewFile.path)}
                    title="PDF Preview"
                  />
                  <div className="text-center">
                    <p className="text-gray-600 mb-2">Can't see the PDF?</p>
                    <a
                      href={getFileSrc(previewFile.path)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-block"
                    >
                      Open PDF in New Tab
                    </a>
                  </div>
                </div>
              ) : previewFile.mimetype.includes('video') ? (
                <video 
                  src={getFileSrc(previewFile.path)} 
                  controls
                  className="max-w-full mx-auto"
                >
                  Your browser does not support video playback.
                </video>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📄</div>
                  <p className="text-gray-500 mb-4">Preview not available for this file type</p>
                  <p className="text-sm text-gray-400 mb-4">{previewFile.mimetype}</p>
                  <a
                    href={getFileSrc(previewFile.path)}
                    download
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-block"
                  >
                    Download File
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentSubmission;