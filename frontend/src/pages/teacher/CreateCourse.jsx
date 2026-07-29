import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, ImagePlus } from 'lucide-react';

const CreateCourse = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    price: 0
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) navigate('/login');
  }, []);

  const categories = [
    'Web Development', 'Mobile Development', 'Data Science',
    'Machine Learning', 'Design', 'Business', 'Marketing',
    'Photography', 'Music', 'Language', 'Other'
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file.');
      return;
    }
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be smaller than 5MB.');
      return;
    }

    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const removeThumbnail = () => {
    setThumbnailFile(null);
    if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    setThumbnailPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');

      // Use FormData to support file upload
      const payload = new FormData();
      payload.append('title', formData.title);
      payload.append('description', formData.description);
      payload.append('category', formData.category);
      payload.append('price', formData.price);
      if (thumbnailFile) payload.append('thumbnail', thumbnailFile);

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/teacher/courses`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        // Do NOT set Content-Type — browser sets it automatically with boundary for FormData
        body: payload
      });

      if (response.ok) {
        const data = await response.json();
        alert('Course created successfully!');
        navigate(`/teacher/courses/${data.course._id}/edit`);
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to create course');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      alert('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sectionCard = "bg-white rounded-2xl shadow-sm border border-slate-200 p-6";
  const inputClass  = "w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition bg-white";
  const labelClass  = "block text-sm font-medium text-slate-700 mb-1.5";

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/teacher/dashboard')}
                className="text-sm text-slate-500 hover:text-slate-900 font-medium px-3 py-1.5 rounded-lg hover:bg-slate-100 transition"
              >
                ← Back
              </button>
              <div className="h-5 w-px bg-slate-200" />
              <div>
                <h1 className="text-lg font-bold text-slate-900 leading-tight">Create New Course</h1>
                <p className="text-xs text-slate-500">Fill in the details below</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Basic Info */}
          <div className={sectionCard}>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-5">Course Info</h2>

            <div className="space-y-5">
              <div>
                <label className={labelClass}>Course Title <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="e.g. Complete Web Development Bootcamp"
                />
              </div>

              <div>
                <label className={labelClass}>Description <span className="text-rose-500">*</span></label>
                <textarea
                  name="description"
                  required
                  value={formData.description}
                  onChange={handleChange}
                  rows={5}
                  className={inputClass}
                  placeholder="Describe what students will learn in this course..."
                />
              </div>

              <div>
                <label className={labelClass}>Category <span className="text-rose-500">*</span></label>
                <select
                  name="category"
                  required
                  value={formData.category}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Thumbnail Upload */}
          <div className={sectionCard}>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-5">Course Thumbnail</h2>

            {thumbnailPreview ? (
              /* Preview */
              <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                <img
                  src={thumbnailPreview}
                  alt="Thumbnail preview"
                  className="w-full h-56 object-cover"
                />
                <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-all flex items-center justify-center group">
                  <button
                    type="button"
                    onClick={removeThumbnail}
                    className="opacity-0 group-hover:opacity-100 transition-opacity bg-white text-rose-600 border border-rose-200 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                  >
                    <X className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
                <div className="absolute bottom-3 right-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-white text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm hover:bg-slate-50 transition"
                  >
                    <Upload className="w-3.5 h-3.5" /> Change
                  </button>
                </div>
              </div>
            ) : (
              /* Drop zone */
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-slate-200 rounded-xl py-14 flex flex-col items-center gap-3 hover:border-slate-400 hover:bg-slate-50/50 transition-all group"
              >
                <div className="w-12 h-12 bg-slate-100 group-hover:bg-slate-200 rounded-xl flex items-center justify-center transition">
                  <ImagePlus className="w-6 h-6 text-slate-400 group-hover:text-slate-600 transition" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-700">Click to upload thumbnail</p>
                  <p className="text-xs text-slate-400 mt-1">PNG, JPG, WEBP up to 5MB</p>
                </div>
              </button>
            )}

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleThumbnailChange}
              className="hidden"
            />
          </div>

          {/* Price (unlocked) */}
          <div className={sectionCard}>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-5">Pricing</h2>
            <div>
              <label className={labelClass}>Price (USD) - Set to 0 for Free</label>
              <input
                type="number"
                name="price"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                className={inputClass}
                placeholder="e.g. 49.99"
              />
              <p className="text-xs text-slate-400 mt-1.5">Premium courses will require Stripe checkout from students. Free courses allow immediate enrollment.</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pb-8">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-slate-900 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-slate-800 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </span>
              ) : 'Create Course'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/teacher/dashboard')}
              className="flex-1 bg-white text-slate-700 border border-slate-200 px-6 py-3 rounded-xl text-sm font-semibold hover:bg-slate-50 transition"
            >
              Cancel
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default CreateCourse;