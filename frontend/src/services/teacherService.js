// services/teacherService.js
import api from './api';

// ========================================
// DASHBOARD
// ========================================
export const getTeacherDashboard = async () => {
  try {
    const response = await api.get('/teacher/dashboard');
    return response;
  } catch (error) {
    console.error('Error fetching teacher dashboard:', error);
    throw error;
  }
};

// ========================================
// COURSES
// ========================================
export const getTeacherCourses = async () => {
  try {
    const response = await api.get('/teacher/courses');
    return response;
  } catch (error) {
    console.error('Error fetching courses:', error);
    throw error;
  }
};

export const createCourse = async (courseData) => {
  try {
    const response = await api.post('/teacher/courses', courseData);
    return response;
  } catch (error) {
    console.error('Error creating course:', error);
    throw error;
  }
};

export const getCourse = async (courseId) => {
  try {
    const response = await api.get(`/teacher/courses/${courseId}`);
    return response;
  } catch (error) {
    console.error('Error fetching course:', error);
    throw error;
  }
};

export const updateCourse = async (courseId, courseData) => {
  try {
    const response = await api.put(`/teacher/courses/${courseId}`, courseData);
    return response;
  } catch (error) {
    console.error('Error updating course:', error);
    throw error;
  }
};

export const deleteCourse = async (courseId) => {
  try {
    const response = await api.delete(`/teacher/courses/${courseId}`);
    return response;
  } catch (error) {
    console.error('Error deleting course:', error);
    throw error;
  }
};

export const toggleCoursePublish = async (courseId, published) => {
  try {
    const response = await api.patch(`/teacher/courses/${courseId}/publish`, { published });
    return response;
  } catch (error) {
    console.error('Error toggling course publish:', error);
    throw error;
  }
};

// Course Analytics
export const getCourseAnalytics = async (courseId) => {
  try {
    const response = await api.get(`/teacher/courses/${courseId}/analytics`);
    return response;
  } catch (error) {
    console.error('Error fetching course analytics:', error);
    throw error;
  }
};

// ========================================
// ASSIGNMENTS
// ========================================
export const getTeacherAssignments = async () => {
  try {
    const response = await api.get('/teacher/assignments');
    return response;
  } catch (error) {
    console.error('Error fetching assignments:', error);
    throw error;
  }
};

export const createAssignment = async (assignmentData) => {
  try {
    const response = await api.post('/teacher/assignments', assignmentData);
    return response;
  } catch (error) {
    console.error('Error creating assignment:', error);
    throw error;
  }
};

export const updateAssignment = async (assignmentId, assignmentData) => {
  try {
    const response = await api.put(`/teacher/assignments/${assignmentId}`, assignmentData);
    return response;
  } catch (error) {
    console.error('Error updating assignment:', error);
    throw error;
  }
};

export const deleteAssignment = async (assignmentId) => {
  try {
    const response = await api.delete(`/teacher/assignments/${assignmentId}`);
    return response;
  } catch (error) {
    console.error('Error deleting assignment:', error);
    throw error;
  }
};

// ========================================
// SUBMISSIONS
// ========================================
export const getSubmissions = async () => {
  try {
    const response = await api.get('/teacher/submissions');
    return response;
  } catch (error) {
    console.error('Error fetching submissions:', error);
    throw error;
  }
};

export const gradeSubmission = async (submissionId, gradeData) => {
  try {
    const response = await api.patch(`/teacher/submissions/${submissionId}/grade`, gradeData);
    return response;
  } catch (error) {
    console.error('Error grading submission:', error);
    throw error;
  }
};

// ========================================
// QUIZZES
// ========================================
export const getTeacherQuizzes = async () => {
  try {
    const response = await api.get('/teacher/quizzes');
    return response;
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    throw error;
  }
};

export const createQuiz = async (quizData) => {
  try {
    const response = await api.post('/teacher/quizzes', quizData);
    return response;
  } catch (error) {
    console.error('Error creating quiz:', error);
    throw error;
  }
};

export const getQuiz = async (quizId) => {
  try {
    const response = await api.get(`/teacher/quizzes/${quizId}`);
    return response;
  } catch (error) {
    console.error('Error fetching quiz:', error);
    throw error;
  }
};

export const updateQuiz = async (quizId, quizData) => {
  try {
    const response = await api.put(`/teacher/quizzes/${quizId}`, quizData);
    return response;
  } catch (error) {
    console.error('Error updating quiz:', error);
    throw error;
  }
};

export const deleteQuiz = async (quizId) => {
  try {
    const response = await api.delete(`/teacher/quizzes/${quizId}`);
    return response;
  } catch (error) {
    console.error('Error deleting quiz:', error);
    throw error;
  }
};

export const getQuizResults = async (quizId) => {
  try {
    const response = await api.get(`/teacher/quizzes/${quizId}/results`);
    return response;
  } catch (error) {
    console.error('Error fetching quiz results:', error);
    throw error;
  }
};

// ========================================
// STUDENTS
// ========================================
export const getEnrolledStudents = async () => {
  try {
    const response = await api.get('/teacher/students');
    return response;
  } catch (error) {
    console.error('Error fetching enrolled students:', error);
    throw error;
  }
};

export const getStudentProgress = async (studentId) => {
  try {
    const response = await api.get(`/teacher/students/${studentId}/progress`);
    return response;
  } catch (error) {
    console.error('Error fetching student progress:', error);
    throw error;
  }
};



// ========================================
// MESSAGES
// ========================================
export const getMessages = async (filters = {}) => {
  try {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/teacher/messages${params ? `?${params}` : ''}`);
    return response;
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
};

export const replyToMessage = async (messageId, content) => {
  try {
    const response = await api.post(`/teacher/messages/${messageId}/reply`, { content });
    return response;
  } catch (error) {
    console.error('Error replying to message:', error);
    throw error;
  }
};

export const markMessageAsRead = async (messageId) => {
  try {
    const response = await api.patch(`/teacher/messages/${messageId}/read`);
    return response;
  } catch (error) {
    console.error('Error marking message as read:', error);
    throw error;
  }
};

// ========================================
// CERTIFICATES
// ========================================
export const getCertificates = async () => {
  try {
    const response = await api.get('/teacher/certificates');
    return response;
  } catch (error) {
    console.error('Error fetching certificates:', error);
    throw error;
  }
};

export const generateCertificate = async (studentId, courseId) => {
  try {
    const response = await api.post('/teacher/certificates/generate', {
      studentId,
      courseId
    });
    return response;
  } catch (error) {
    console.error('Error generating certificate:', error);
    throw error;
  }
};

export const approveCertificate = async (certificateId) => {
  try {
    const response = await api.patch(`/teacher/certificates/${certificateId}/approve`);
    return response;
  } catch (error) {
    console.error('Error approving certificate:', error);
    throw error;
  }
};