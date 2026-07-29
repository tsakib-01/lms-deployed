import api from './api';

export const register = (userData) => api.post('/auth/register', userData);
export const login = (userData) => api.post('/auth/login', userData);
export const googleLogin = () => window.location.href = `${import.meta.env.VITE_BACKEND_URL}/api/auth/google`;
export const forgotPassword = (email) => api.post('/auth/forgot-password', { email });
export const resetPassword = (token, password) => api.post(`/auth/reset-password/${token}`, { password });