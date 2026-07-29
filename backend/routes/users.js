const express = require('express');
const router = express.Router();
const userController = require('../controllers/users');
const { protect, authorize } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const avatarUpload = upload.avatarUpload || upload;

// Middleware that handles both FormData (Multer file upload) AND raw JSON (Base64 avatar upload)
const handleAvatarUpload = (req, res, next) => {
  if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
    return next(); // JSON payload containing Base64 avatar — skip multer!
  }
  avatarUpload.single('avatar')(req, res, next);
};

// ── User routes ──────────────────────────────────────────────────────────────
router.get('/me', protect, userController.getMe);
router.put('/me', protect, handleAvatarUpload, userController.updateProfile);

router.get('/dashboard', protect, userController.getDashboard);
router.get('/admin/users', protect, authorize('Admin'), userController.getAdminUsers);
router.put('/admin/users/:id/role', protect, authorize('Admin'), userController.updateUserRole);

// ── Bookmark routes ──────────────────────────────────────────────────────────
router.get('/bookmarks',              protect, userController.getBookmarks);
router.post('/bookmarks/:courseId',   protect, userController.toggleBookmark);
router.delete('/bookmarks/:courseId', protect, userController.toggleBookmark);

// ── Recently viewed routes ───────────────────────────────────────────────────
router.get('/recently-viewed',             protect, userController.getRecentlyViewed);
router.post('/recently-viewed/:courseId',  protect, userController.trackRecentlyViewed);

module.exports = router;