// routes/teacher.js - FIXED VERSION
const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacher');
const { protect, authorize } = require('../middlewares/auth');
const { assignmentUpload } = require('../middlewares/upload'); // ← Use document upload here
const { thumbnailUpload } = require('../utils/upload');

// const { thumbnailUpload } = require('../utils/upload');
// Apply authentication and teacher authorization to all routes
router.use(protect);
router.use(authorize('teacher'));

// ========================================
// DASHBOARD
// ========================================
router.get('/dashboard', teacherController.getDashboard);

// ========================================
// COURSES
// ========================================
router.get('/courses', teacherController.getCourses);
// router.post('/courses', upload.single('thumbnail'), teacherController.createCourse);
router.get('/courses/:id', teacherController.getCourse);

// router.put('/courses/:id', upload.single('thumbnail'), teacherController.updateCourse);
router.put('/courses/:id', thumbnailUpload.single('thumbnail'), teacherController.updateCourse)
router.post('/courses', thumbnailUpload.single('thumbnail'), teacherController.createCourse);


router.put('/courses/:id', thumbnailUpload.single('thumbnail'), teacherController.updateCourse);
router.delete('/courses/:id', teacherController.deleteCourse);
router.patch('/courses/:id/publish', teacherController.togglePublish);


// Lesson management
router.post('/courses/:courseId/lessons', teacherController.addLesson);
router.put('/courses/:courseId/lessons/:lessonId', teacherController.updateLesson);
router.delete('/courses/:courseId/lessons/:lessonId', teacherController.deleteLesson);
router.patch('/courses/:courseId/lessons/reorder', teacherController.reorderLessons);

// Course analytics
router.get('/courses/:courseId/analytics', teacherController.getCourseAnalytics);

// ========================================
// ASSIGNMENTS - WITH FILE UPLOAD SUPPORT
// ========================================
router.get('/assignments', teacherController.getAssignments);
router.post('/assignments', assignmentUpload.array('attachments', 5), teacherController.createAssignment);
router.get('/assignments/:id', teacherController.getAssignment);
router.put('/assignments/:id', assignmentUpload.array('attachments', 5), teacherController.updateAssignment);
router.delete('/assignments/:id', teacherController.deleteAssignment);
router.patch('/courses/:courseId/curriculum-order', teacherController.saveCurriculumOrder);

// ========================================
// SUBMISSIONS
// ========================================
router.get('/submissions', teacherController.getSubmissions);
router.patch('/submissions/:id/grade', teacherController.gradeSubmission);

// ========================================
// QUIZZES
// ========================================
router.get('/quizzes', teacherController.getQuizzes);
router.post('/quizzes', teacherController.createQuiz);
router.get('/quizzes/:id', teacherController.getQuiz);
router.put('/quizzes/:id', teacherController.updateQuiz);
router.delete('/quizzes/:id', teacherController.deleteQuiz);
router.get('/quizzes/:id/results', teacherController.getQuizResults);

// ========================================
// STUDENTS
// ========================================
router.get('/students', teacherController.getEnrolledStudents);
router.get('/students/:id/progress', teacherController.getStudentProgress);



// ========================================
// MESSAGES / Q&A
// ========================================
router.get('/messages', teacherController.getMessages);
router.post('/messages/:id/reply', teacherController.replyToMessage);
router.patch('/messages/:id/read', teacherController.markMessageAsRead);

// ========================================
// CERTIFICATES
// ========================================
router.get('/certificates', teacherController.getCertificates);
router.post('/certificates/generate', teacherController.generateCertificate);
router.patch('/certificates/:id/approve', teacherController.approveCertificate);

module.exports = router;