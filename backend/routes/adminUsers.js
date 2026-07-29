// routes/adminUsers.js
const express = require('express');
const crypto = require('crypto');
const User = require('../models/User');
const sendEmail = require('../utils/sendemail_temp');
const router = express.Router();

// ── GET courses-completion ───────────────────────────────────────────────────
// ✅ MUST be before /:id routes or Express will treat "courses-completion" as an id
router.get('/courses-completion', async (req, res) => {
  try {
    const Course = require('../models/Course');

    const courses = await Course.find()
      .populate('instructor', 'name email')
      .select('title thumbnail instructor enrolledStudents');

    const result = await Promise.all(courses.map(async (course) => {
      const enrolledUsers = await User.find({
        'enrolledCourses.course': course._id
      }).select('name email avatar enrolledCourses');

      const students = enrolledUsers.map(user => {
        const enrollment = user.enrolledCourses.find(
          e => e.course.toString() === course._id.toString()
        );
        return {
          _id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          progress: enrollment?.progress || 0,
          completed: enrollment?.completed || false,
          completionDate: enrollment?.completionDate || null,
          enrolledAt: enrollment?.enrolledAt || null,
        };
      });

      return {
        _id: course._id,
        title: course.title,
        thumbnail: course.thumbnail,
        instructor: course.instructor,
        totalEnrolled: students.length,
        totalCompleted: students.filter(s => s.completed).length,
        students,
      };
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('❌ Error fetching course completion:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── GET all users ────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── POST create teacher via invite ───────────────────────────────────────────
router.post('/create-teacher', async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    const inviteToken   = crypto.randomBytes(32).toString('hex');
    const inviteExpires = new Date(Date.now() + 48 * 60 * 60 * 1000);

    await User.create({
      name,
      email,
      role: 'teacher',
      isActive: false,
      inviteToken,
      inviteExpires
    });

    const frontendOrigin = process.env.FRONTEND_URL || req.headers.origin || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    const inviteLink = `${frontendOrigin}/#/set-password/${inviteToken}`;

    let emailSent = false;
    try {
      await sendEmail({
        email,
        template: 'teacherInvite',
        templateData: [name, inviteLink]
      });
      emailSent = true;
      console.log(`✅ Invite email sent to ${email}`);
    } catch (emailError) {
      console.warn(`⚠️ Failed to send invite email to ${email}:`, emailError.message);
    }

    res.status(201).json({
      success: true,
      message: emailSent
        ? `Invite email sent to ${email}. The teacher will set their own password.`
        : `Teacher account created but email failed to send. Please resend the invite.`,
      emailSent
    });
  } catch (error) {
    console.error('❌ Error creating teacher invite:', error);
    res.status(500).json({ success: false, message: 'Server error', details: error.message });
  }
});

// ── PUT approve teacher ──────────────────────────────────────────────────────
router.put('/:id/approve', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    );

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    let emailSent = false;
    if (user.email) {
      try {
        await sendEmail({
          email: user.email,
          template: 'teacherApproval',
          templateData: [user.name]
        });
        emailSent = true;
        console.log(`✅ Approval email sent to ${user.email}`);
      } catch (emailError) {
        console.warn(`⚠️ Failed to send email to ${user.email}:`, emailError.message);
      }
    }

    res.json({
      success: true,
      message: 'Teacher approved successfully',
      emailSent,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (error) {
    console.error('❌ Error approving teacher:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── PUT reject teacher ───────────────────────────────────────────────────────
router.put('/:id/reject', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    let emailSent = false;
    if (user.email) {
      try {
        await sendEmail({
          email: user.email,
          template: 'teacherRejection',
          templateData: [user.name]
        });
        emailSent = true;
        console.log(`✅ Rejection email sent to ${user.email}`);
      } catch (emailError) {
        console.warn(`⚠️ Failed to send email to ${user.email}:`, emailError.message);
      }
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Teacher rejected successfully', emailSent });
  } catch (error) {
    console.error('❌ Error rejecting teacher:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── PATCH toggle user active status ─────────────────────────────────────────
router.patch('/:id/toggle-status', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'}`,
      isActive: user.isActive
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', details: error.message });
  }
});

module.exports = router;