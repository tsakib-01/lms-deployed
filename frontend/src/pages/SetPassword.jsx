// pages/SetPassword.jsx
// Teacher lands here after clicking the invite link in their email
// Route: /set-password/:token

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const SetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Password strength helper
  const getStrength = (pw) => {
    if (!pw) return { label: '', color: '' };
    if (pw.length < 6) return { label: 'Too short', color: 'text-red-500' };
    if (pw.length < 8) return { label: 'Weak', color: 'text-orange-500' };
    if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) return { label: 'Strong', color: 'text-green-600' };
    return { label: 'Fair', color: 'text-yellow-600' };
  };

  const strength = getStrength(form.password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.password || !form.confirmPassword) {
      setError('Please fill in both fields');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/set-password/${token}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            password: form.password,
            confirmPassword: form.confirmPassword
          })
        }
      );

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setError(data.message || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      setError('Unable to connect to the server. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // ── Success screen ────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Set!</h2>
          <p className="text-gray-600 mb-6">
            Your account is now active. Redirecting you to the login page...
          </p>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div className="bg-purple-500 h-1.5 rounded-full animate-[grow_3s_linear]" style={{ width: '100%', animation: 'width 3s linear' }} />
          </div>
          <button
            onClick={() => navigate('/login')}
            className="mt-4 text-sm text-purple-600 hover:text-purple-800 font-medium"
          >
            Go to Login now →
          </button>
        </div>
      </div>
    );
  }

  // ── Set password form ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">

        {/* Logo / branding */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🎓</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome to SkillBridge</h1>
          <p className="text-gray-500 text-sm mt-1">Create a password to activate your teacher account</p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-5 flex gap-2 items-start text-sm">
            <span className="mt-0.5">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <input
              type="password"
              placeholder="At least 6 characters"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm transition"
              autoComplete="new-password"
            />
            {/* Strength indicator */}
            {form.password && (
              <p className={`text-xs mt-1 font-medium ${strength.color}`}>
                Password strength: {strength.label}
              </p>
            )}
          </div>

          {/* Confirm password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              placeholder="Repeat your password"
              value={form.confirmPassword}
              onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm transition ${
                form.confirmPassword && form.password !== form.confirmPassword
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300'
              }`}
              autoComplete="new-password"
            />
            {form.confirmPassword && form.password !== form.confirmPassword && (
              <p className="text-xs text-red-500 mt-1">Passwords don't match</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-indigo-600 transition shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Activating account...
              </>
            ) : (
              'Activate My Account'
            )}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          This invite link expires 48 hours after it was sent.
          <br />If it has expired, contact your admin.
        </p>
      </div>
    </div>
  );
};

export default SetPassword;