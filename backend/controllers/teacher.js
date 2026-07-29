// controllers/teacher.js
const Course = require('../models/Course');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Quiz = require('../models/Quiz');
const User = require('../models/User');
const Message = require('../models/Message');

const Certificate = require('../models/Certificate');
const Transaction = require('../models/Transaction');

// Save curriculum order
exports.saveCurriculumOrder = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { curriculumOrder } = req.body;

    const course = await Course.findOne({
      _id: courseId,
      instructor: req.user._id
    });

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    course.curriculumOrder = curriculumOrder;
    await course.save();

    res.json({ success: true, curriculumOrder: course.curriculumOrder });
  } catch (error) {
    console.error('💥 Error saving curriculum order:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


exports.getDashboard = async (req, res) => {
  try {
    const teacherId = req.user._id;

    // Get all teacher's courses
    const courses = await Course.find({ instructor: teacherId });
    const courseIds = courses.map(c => c._id);

    // Count total students (unique across all courses)
    const uniqueStudents = new Set();
    courses.forEach(course => {
      course.enrolledStudents.forEach(studentId => {
        uniqueStudents.add(studentId.toString());
      });
    });

    // Get pending submissions
    const assignments = await Assignment.find({ course: { $in: courseIds } });
    const assignmentIds = assignments.map(a => a._id);
    const pendingSubmissions = await Submission.countDocuments({
      assignment: { $in: assignmentIds },
      graded: false
    });

    // Get recent courses (last 3)
    const recentCourses = await Course.find({ instructor: teacherId })
      .sort('-createdAt')
      .limit(3)
      .populate('enrolledStudents', 'name');

    // Calculate instructor earnings (80% of sale) and gross sales
    const transactions = await Transaction.find({ teacher: teacherId, status: 'completed' });
    const totalEarnings = transactions.reduce((sum, tx) => sum + tx.teacherEarnings, 0);
    const totalSales = transactions.reduce((sum, tx) => sum + tx.amount, 0);

    res.json({
      success: true,
      stats: {
        totalCourses: courses.length,
        totalStudents: uniqueStudents.size,
        pendingSubmissions,
        activeCourses: courses.filter(c => c.isPublished).length,
        totalEarnings: parseFloat(totalEarnings.toFixed(2)),
        totalSales: parseFloat(totalSales.toFixed(2))
      },
      recentCourses
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all courses
exports.getCourses = async (req, res) => {
  try {
    const courses = await Course.find({ instructor: req.user._id })
      .populate('enrolledStudents', 'name email')
      .sort('-createdAt');

    // Map to use 'published' instead of 'isPublished' for frontend
    const mappedCourses = courses.map(course => ({
      ...course.toObject(),
      published: course.isPublished
    }));

    res.json({ success: true, courses: mappedCourses });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add lesson to course
exports.addLesson = async (req, res) => {
  try {
    console.log('📝 Adding lesson to course...');
    const { title, description, type, videoUrl, content, duration, isPreview } = req.body;
    
    const course = await Course.findOne({
      _id: req.params.courseId,
      instructor: req.user._id
    });

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const newLesson = {
      title,
      description,
      type,
      videoUrl,
      content,
      duration,
      isPreview: isPreview || false,
      order: course.lessons.length + 1
    };

    course.lessons.push(newLesson);
    await course.save();

    console.log('✅ Lesson added successfully');
    res.status(201).json({ success: true, lesson: course.lessons[course.lessons.length - 1] });
  } catch (error) {
    console.error('💥 Error adding lesson:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update lesson
exports.updateLesson = async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;
    
    const course = await Course.findOne({
      _id: courseId,
      instructor: req.user._id
    });

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const lesson = course.lessons.id(lessonId);
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    Object.assign(lesson, req.body);
    await course.save();

    res.json({ success: true, lesson });
  } catch (error) {
    console.error('💥 Error updating lesson:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete lesson
exports.deleteLesson = async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;
    
    const course = await Course.findOne({
      _id: courseId,
      instructor: req.user._id
    });

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    course.lessons.pull(lessonId);
    
    // Reorder remaining lessons
    course.lessons.forEach((lesson, index) => {
      lesson.order = index + 1;
    });
    
    await course.save();

    res.json({ success: true, message: 'Lesson deleted successfully' });
  } catch (error) {
    console.error('💥 Error deleting lesson:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Reorder lessons
exports.reorderLessons = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { lessons } = req.body;
    
    const course = await Course.findOne({
      _id: courseId,
      instructor: req.user._id
    });

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    lessons.forEach(({ lessonId, order }) => {
      const lesson = course.lessons.id(lessonId);
      if (lesson) {
        lesson.order = order;
      }
    });

    course.lessons.sort((a, b) => a.order - b.order);
    await course.save();

    res.json({ success: true, lessons: course.lessons });
  } catch (error) {
    console.error('💥 Error reordering lessons:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
// Create course
exports.createCourse = async (req, res) => {
  try {
    const { title, description, category, price } = req.body;

    const parsedPrice = parseFloat(price) || 0;
    const course = await Course.create({
      title,
      description,
      category,
      thumbnail: req.file ? req.file.path : null, // ✅ Cloudinary URL from Multer
      price: parsedPrice,
      isPaid: parsedPrice > 0,
      instructor: req.user._id,
      isPublished: false
    });

    res.status(201).json({ success: true, course });
  } catch (error) {
    console.error('💥 Error creating course:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
// Get single course
exports.getCourse = async (req, res) => {
  try {
    const course = await Course.findOne({
      _id: req.params.id,
      instructor: req.user._id
    }).populate('enrolledStudents', 'name email');

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.json({ success: true, course });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update course
// Update course
const fs = require('fs');
const path = require('path');

const { cloudinary } = require('../utils/upload');

exports.updateCourse = async (req, res) => {
  try {
    const update = { ...req.body };

    // Remove base64 fields — we never store base64
    delete update.thumbnailBase64;

    if (update.price !== undefined) {
      const parsedPrice = parseFloat(update.price) || 0;
      update.price = parsedPrice;
      update.isPaid = parsedPrice > 0;
    }

    // ✅ If a new image was uploaded via Multer → Cloudinary
    if (req.file) {
      // Delete old Cloudinary image to save storage
      const existing = await Course.findById(req.params.id).select('thumbnail');
      if (existing?.thumbnail?.startsWith('https://res.cloudinary.com')) {
        try {
          // Extract public_id from URL
          const parts = existing.thumbnail.split('/');
          const publicId = 'lms/thumbnails/' + parts[parts.length - 1].split('.')[0];
          await cloudinary.uploader.destroy(publicId);
        } catch (e) {
          console.warn('Could not delete old Cloudinary image:', e.message);
        }
      }
      update.thumbnail = req.file.path; // ✅ Cloudinary URL
    }

    const course = await Course.findOneAndUpdate(
      { _id: req.params.id, instructor: req.user._id },
      update,
      { new: true, runValidators: true }
    );

    if (!course) return res.status(404).json({ message: 'Course not found' });

    res.json({ success: true, course });
  } catch (error) {
    console.error('💥 Error updating course:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete course
exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findOneAndDelete({
      _id: req.params.id,
      instructor: req.user._id
    });

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.json({ success: true, message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Toggle publish status
exports.togglePublish = async (req, res) => {
  try {
    const { published } = req.body;

    const course = await Course.findOneAndUpdate(
      { _id: req.params.id, instructor: req.user._id },
      { isPublished: published },
      { new: true }
    );

    if (!course) {
      return 
      res.status(404).json({ message: 'Course not found' });
    }

    res.json({ success: true, course });
  } catch (error) {
    console.error('💥 Error toggling publish:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all assignments
exports.getAssignments = async (req, res) => {
  try {
    const courses = await Course.find({ instructor: req.user._id }).select('_id');
    const courseIds = courses.map(c => c._id);

    const assignments = await Assignment.find({ course: { $in: courseIds } })
      .populate('course', 'title')
      .sort('-createdAt');

    res.json({ success: true, assignments });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create assignment
exports.createAssignment = async (req, res) => {
  try {
    console.log('📝 Creating assignment...');
    console.log('Request body:', req.body);
    console.log('Files:', req.files);
    console.log('User:', req.user);

    const { title, description, course, deadline, maxGrade } = req.body;
    
    // Validate required fields
    if (!title || !description || !course || !deadline) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: title, description, course, deadline'
      });
    }

    // Handle file attachments if any
    const attachments = req.files ? req.files.map(file => file.path || `/uploads/assignments/${file.filename}`) : [];
    console.log('Attachments:', attachments);
    
    // Verify the course exists and teacher owns it
    const courseDoc = await Course.findOne({
      _id: course,
      instructor: req.user._id
    });
    console.log('Course found:', courseDoc);
    
    if (!courseDoc) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or you are not authorized'
      });
    }

    // Create the assignment
    const assignment = await Assignment.create({
      title,
      description,
      course,
      teacher: req.user._id,  // Add the teacher field
      deadline,
      maxGrade: maxGrade || 100,
      attachments
    });

    await assignment.populate('course', 'title');

    console.log('✅ Assignment created:', assignment._id);
    res.status(201).json({ success: true, assignment });
  } catch (error) {
    console.error('💥 Error creating assignment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get single assignment
exports.getAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('course', 'title');

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    const course = await Course.findOne({
      _id: assignment.course._id,
      instructor: req.user._id
    });

    if (!course) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json({ success: true, assignment });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update assignment
exports.updateAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    const course = await Course.findOne({
      _id: assignment.course,
      instructor: req.user._id
    });

    if (!course) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    Object.assign(assignment, req.body);

    // Handle file attachments if new ones are uploaded
    if (req.files && req.files.length > 0) {
      const newAttachments = req.files.map(file => file.path || `/uploads/assignments/${file.filename}`);
      let keepAttachments = [];
      if (req.body.existingAttachments) {
        try {
          keepAttachments = JSON.parse(req.body.existingAttachments);
        } catch (e) {
          keepAttachments = [];
        }
      } else {
        keepAttachments = assignment.attachments || [];
      }
      assignment.attachments = [...keepAttachments, ...newAttachments];
    } else if (req.body.existingAttachments) {
      try {
        assignment.attachments = JSON.parse(req.body.existingAttachments);
      } catch (e) {}
    }

    await assignment.save();

    res.json({ success: true, assignment });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete assignment
exports.deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    const course = await Course.findOne({
      _id: assignment.course,
      instructor: req.user._id
    });

    if (!course) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await assignment.deleteOne();

    res.json({ success: true, message: 'Assignment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all submissions
exports.getSubmissions = async (req, res) => {
  try {
    const courses = await Course.find({ instructor: req.user._id }).select('_id');
    const courseIds = courses.map(c => c._id);

    const assignments = await Assignment.find({ course: { $in: courseIds } }).select('_id');
    const assignmentIds = assignments.map(a => a._id);

    const submissions = await Submission.find({ assignment: { $in: assignmentIds } })
      .populate('student', 'name email')
      .populate('assignment', 'title maxGrade')
      .sort('-submittedAt');

    res.json({ success: true, submissions });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Grade submission
exports.gradeSubmission = async (req, res) => {
  try {
    const { grade, feedback } = req.body;

    const submission = await Submission.findById(req.params.id);

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    const assignment = await Assignment.findById(submission.assignment);
    const course = await Course.findOne({
      _id: assignment.course,
      instructor: req.user._id
    });

    if (!course) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    submission.grade = grade;
    submission.feedback = feedback;
    submission.graded = true;
    submission.gradedAt = Date.now();

    await submission.save();

    res.json({ success: true, submission });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all quizzes
exports.getQuizzes = async (req, res) => {
  try {
    const courses = await Course.find({ instructor: req.user._id }).select('_id');
    const courseIds = courses.map(c => c._id);

    const quizzes = await Quiz.find({ course: { $in: courseIds } })
      .populate('course', 'title')
      .sort('-createdAt');

    res.json({ success: true, quizzes });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create quiz
exports.createQuiz = async (req, res) => {
  try {
    const { title, description, course, duration, passingScore, questions } = req.body;

    const courseDoc = await Course.findOne({
      _id: course,
      instructor: req.user._id
    });

    if (!courseDoc) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const quiz = await Quiz.create({
      title,
      description,
      course,
      duration,
      passingScore: passingScore || 70,
      questions
    });

    res.status(201).json({ success: true, quiz });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get single quiz
exports.getQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('course', 'title');

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    const course = await Course.findOne({
      _id: quiz.course._id,
      instructor: req.user._id
    });

    if (!course) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json({ success: true, quiz });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update quiz
exports.updateQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    const course = await Course.findOne({
      _id: quiz.course,
      instructor: req.user._id
    });

    if (!course) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    Object.assign(quiz, req.body);
    await quiz.save();

    res.json({ success: true, quiz });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete quiz
exports.deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    const course = await Course.findOne({
      _id: quiz.course,
      instructor: req.user._id
    });

    if (!course) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await quiz.deleteOne();

    res.json({ success: true, message: 'Quiz deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get quiz results
exports.getQuizResults = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('attempts.student', 'name email');

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    const course = await Course.findOne({
      _id: quiz.course,
      instructor: req.user._id
    });

    if (!course) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json({ success: true, attempts: quiz.attempts });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get enrolled students
exports.getEnrolledStudents = async (req, res) => {
  try {
    const courses = await Course.find({ instructor: req.user._id })
      .populate('enrolledStudents', 'name email createdAt');

    const studentMap = new Map();
    courses.forEach(course => {
      course.enrolledStudents.forEach(student => {
        if (!studentMap.has(student._id.toString())) {
          studentMap.set(student._id.toString(), {
            ...student.toObject(),
            courses: [{ id: course._id, title: course.title }]
          });
        } else {
          studentMap.get(student._id.toString()).courses.push({
            id: course._id,
            title: course.title
          });
        }
      });
    });

    const students = Array.from(studentMap.values());

    res.json({ success: true, students });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get student progress
exports.getStudentProgress = async (req, res) => {
  try {
    const studentId = req.params.id;

    const courses = await Course.find({
      instructor: req.user._id,
      enrolledStudents: studentId
    }).select('title modules');

    const submissions = await Submission.find({ student: studentId })
      .populate('assignment', 'title course');

    const quizzes = await Quiz.find({
      'attempts.student': studentId
    }).select('title attempts');

    res.json({
      success: true,
      courses,
      submissions,
      quizzes: quizzes.map(q => ({
        title: q.title,
        attempts: q.attempts.filter(a => a.student.toString() === studentId)
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};



// ========================================
// MESSAGES / Q&A
// ========================================

exports.getMessages = async (req, res) => {
  try {
    const { status, course } = req.query;
    
    const query = {
      recipient: req.user._id
    };

    if (status) query.status = status;
    if (course) query.course = course;

    const messages = await Message.find(query)
      .populate('sender', 'name email avatar')
      .populate('course', 'title')
      .sort('-createdAt');

    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.replyToMessage = async (req, res) => {
  try {
    const { content } = req.body;
    
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    message.replies.push({
      sender: req.user._id,
      content,
      createdAt: new Date()
    });

    message.status = 'replied';
    await message.save();
    await message.populate('sender', 'name email');
    await message.populate('course', 'title');

    res.json({ success: true, message });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.markMessageAsRead = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    message.status = 'read';
    await message.save();

    res.json({ success: true, message });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ========================================
// COURSE ANALYTICS
// ========================================

exports.getCourseAnalytics = async (req, res) => {
  try {
    const courseId = req.params.courseId;

    const course = await Course.findOne({
      _id: courseId,
      instructor: req.user._id
    }).populate('enrolledStudents', 'name email');

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const totalStudents = course.enrolledStudents.length;

    const quizzes = await Quiz.find({ course: courseId });
    
    let totalQuizAttempts = 0;
    let totalQuizScore = 0;
    
    quizzes.forEach(quiz => {
      quiz.attempts.forEach(attempt => {
        totalQuizAttempts++;
        totalQuizScore += attempt.score;
      });
    });

    const averageQuizScore = totalQuizAttempts > 0 
      ? (totalQuizScore / totalQuizAttempts).toFixed(2)
      : 0;

    const assignments = await Assignment.find({ course: courseId });
    const assignmentIds = assignments.map(a => a._id);
    
    const submissions = await Submission.find({
      assignment: { $in: assignmentIds }
    });

    const gradedSubmissions = submissions.filter(s => s.graded);
    const averageAssignmentGrade = gradedSubmissions.length > 0
      ? (gradedSubmissions.reduce((sum, s) => sum + s.grade, 0) / gradedSubmissions.length).toFixed(2)
      : 0;

    const studentsWithAllSubmissions = {};
    submissions.forEach(sub => {
      const studentId = sub.student.toString();
      if (!studentsWithAllSubmissions[studentId]) {
        studentsWithAllSubmissions[studentId] = 0;
      }
      studentsWithAllSubmissions[studentId]++;
    });

    const completedStudents = Object.values(studentsWithAllSubmissions)
      .filter(count => count >= assignments.length).length;

    const completionRate = totalStudents > 0
      ? ((completedStudents / totalStudents) * 100).toFixed(2)
      : 0;

    const studentPerformance = await Promise.all(
      course.enrolledStudents.map(async (student) => {
        const studentSubmissions = await Submission.find({
          assignment: { $in: assignmentIds },
          student: student._id
        });

        const studentQuizAttempts = quizzes.reduce((acc, quiz) => {
          const attempts = quiz.attempts.filter(
            a => a.student.toString() === student._id.toString()
          );
          return acc.concat(attempts);
        }, []);

        const avgGrade = studentSubmissions.filter(s => s.graded).length > 0
          ? (studentSubmissions.filter(s => s.graded)
              .reduce((sum, s) => sum + s.grade, 0) / 
             studentSubmissions.filter(s => s.graded).length).toFixed(2)
          : 0;

        const avgQuizScore = studentQuizAttempts.length > 0
          ? (studentQuizAttempts.reduce((sum, a) => sum + a.score, 0) / 
             studentQuizAttempts.length).toFixed(2)
          : 0;

        return {
          student: {
            _id: student._id,
            name: student.name,
            email: student.email
          },
          assignmentsCompleted: studentSubmissions.length,
          totalAssignments: assignments.length,
          averageGrade: avgGrade,
          quizzesCompleted: studentQuizAttempts.length,
          totalQuizzes: quizzes.length,
          averageQuizScore: avgQuizScore,
          progress: assignments.length > 0
            ? ((studentSubmissions.length / assignments.length) * 100).toFixed(2)
            : 0
        };
      })
    );

    res.json({
      success: true,
      analytics: {
        course: {
          _id: course._id,
          title: course.title
        },
        overview: {
          totalStudents,
          totalAssignments: assignments.length,
          totalQuizzes: quizzes.length,
          completionRate: parseFloat(completionRate),
          averageQuizScore: parseFloat(averageQuizScore),
          averageAssignmentGrade: parseFloat(averageAssignmentGrade)
        },
        studentPerformance
      }
    });
  } catch (error) {
    console.error('Error in getCourseAnalytics:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ========================================
// CERTIFICATE MANAGEMENT
// ========================================

exports.getCertificates = async (req, res) => {
  try {
    const courses = await Course.find({ instructor: req.user._id }).select('_id');
    const courseIds = courses.map(c => c._id);

    const certificates = await Certificate.find({
      course: { $in: courseIds }
    })
      .populate('student', 'name email')
      .populate('course', 'title')
      .sort('-createdAt');

    res.json({ success: true, certificates });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.approveCertificate = async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id);

    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    const course = await Course.findOne({
      _id: certificate.course,
      instructor: req.user._id
    });

    if (!course) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    certificate.status = 'approved';
    certificate.approvedBy = req.user._id;
    certificate.approvedAt = new Date();
    await certificate.save();

    await certificate.populate('student', 'name email');
    await certificate.populate('course', 'title');

    res.json({ success: true, certificate });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.generateCertificate = async (req, res) => {
  try {
    const { studentId, courseId } = req.body;

    const course = await Course.findOne({
      _id: courseId,
      instructor: req.user._id
    });

    if (!course) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const existingCert = await Certificate.findOne({
      student: studentId,
      course: courseId
    });

    if (existingCert) {
      return res.status(400).json({ message: 'Certificate already exists for this student' });
    }

    const assignments = await Assignment.find({ course: courseId });
    const assignmentIds = assignments.map(a => a._id);
    
    const submissions = await Submission.find({
      assignment: { $in: assignmentIds },
      student: studentId,
      graded: true
    });

    const quizzes = await Quiz.find({ course: courseId });
    const quizAttempts = quizzes.reduce((acc, quiz) => {
      const attempts = quiz.attempts.filter(
        a => a.student.toString() === studentId.toString()
      );
      return acc.concat(attempts);
    }, []);

    const avgAssignmentGrade = submissions.length > 0
      ? submissions.reduce((sum, s) => sum + s.grade, 0) / submissions.length
      : 0;

    const avgQuizScore = quizAttempts.length > 0
      ? quizAttempts.reduce((sum, a) => sum + a.score, 0) / quizAttempts.length
      : 0;

    const finalGrade = ((avgAssignmentGrade + avgQuizScore) / 2).toFixed(2);

    const certificate = await Certificate.create({
      student: studentId,
      course: courseId,
      teacher: req.user._id,
      completionDate: new Date(),
      grade: finalGrade,
      status: 'pending'
    });

    await certificate.populate('student', 'name email');
    await certificate.populate('course', 'title');

    res.status(201).json({ success: true, certificate });
  } catch (error) {
    console.error('Error generating certificate:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};