const User = require('../models/User');
const Course = require('../models/Course');

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .populate('createdCourses', 'title thumbnail')
      .populate('enrolledCourses.course', 'title thumbnail');
    
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, bio } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;

    if (req.file) {
      console.log('📸 Uploading file:', req.file.originalname, req.file.mimetype, req.file.size);
      if (req.file.path || req.file.secure_url) {
        updateData.avatar = req.file.path || req.file.secure_url;
      } else if (req.file.buffer) {
        const mime = req.file.mimetype || 'image/png';
        const b64 = req.file.buffer.toString('base64');
        updateData.avatar = `data:${mime};base64,${b64}`;
      } else if (req.file.filename) {
        updateData.avatar = `/uploads/avatars/${req.file.filename}`;
      }
      console.log('✅ Prepared avatar string length:', updateData.avatar ? updateData.avatar.length : 0);
    } else if (req.body.avatar) {
      updateData.avatar = req.body.avatar;
    }

    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true, runValidators: false }
    ).select('-password');

    if (!updated) return res.status(404).json({ message: 'User not found' });

    console.log('🎉 MongoDB Profile Updated:', updated._id, 'Avatar exists:', !!updated.avatar);

    res.json({
      success: true,
      user: {
        id:     updated._id,
        _id:    updated._id,
        name:   updated.name,
        email:  updated.email,
        role:   updated.role,
        avatar: updated.avatar || null,
        bio:    updated.bio    || null,
      }
    });
  } catch (error) {
    console.error('❌ updateProfile Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getDashboard = async (req, res) => {
  try {
    const user = req.user;
    
    const enrolledCourses = await Course.find({
      _id: { $in: user.enrolledCourses.map(e => e.course) }
    }).select('title thumbnail lessons');
    
    const coursesWithProgress = enrolledCourses.map(course => {
      const enrolled = user.enrolledCourses.find(e => e.course.toString() === course._id.toString());
      return {
        ...course.toObject(),
        progress: enrolled ? enrolled.progress : 0,
        completed: enrolled ? enrolled.completed : false
      };
    });
    
    const createdCourses = await Course.find({
      instructor: user._id
    }).select('title thumbnail enrolledStudents');
    
    res.json({
      success: true,
      enrolledCourses: coursesWithProgress,
      createdCourses
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ── Bookmarks ─────────────────────────────────────────────────────────────────

exports.toggleBookmark = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const courseId = req.params.courseId;

    const idx = user.bookmarks.findIndex(id => id.toString() === courseId);

    if (req.method === 'DELETE' || idx !== -1) {
      user.bookmarks = user.bookmarks.filter(id => id.toString() !== courseId);
      await user.save();
      return res.json({ bookmarked: false, bookmarks: user.bookmarks });
    } else {
      user.bookmarks.push(courseId);
      await user.save();
      return res.json({ bookmarked: true, bookmarks: user.bookmarks });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getBookmarks = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('bookmarks', 'title thumbnail instructor');
    res.json({ bookmarks: user.bookmarks });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Recently Viewed ───────────────────────────────────────────────────────────

exports.trackRecentlyViewed = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const courseId = req.params.courseId;

    user.recentlyViewed = user.recentlyViewed.filter(
      v => v.course.toString() !== courseId
    );

    user.recentlyViewed.unshift({ course: courseId, viewedAt: new Date() });

    if (user.recentlyViewed.length > 10) {
      user.recentlyViewed = user.recentlyViewed.slice(0, 10);
    }

    await user.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Only one getRecentlyViewed — flattens data correctly for the frontend
exports.getRecentlyViewed = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('recentlyViewed.course', 'title thumbnail instructor');
    
    const viewed = user.recentlyViewed
      .filter(v => v.course) // guard against deleted courses
      .map(v => ({
        ...v.course.toObject(),
        viewedAt: v.viewedAt
      }));

    res.json({ recentlyViewed: viewed });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Admin ─────────────────────────────────────────────────────────────────────

exports.getAdminUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .sort('-createdAt');
    
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.role = role;
    await user.save();
    
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};