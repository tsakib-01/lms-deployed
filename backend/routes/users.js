const express = require('express');
const router = express.Router();
const userController = require('../controllers/users');
const { protect, authorize } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const avatarUpload = upload.avatarUpload || upload;

// ── User routes ──────────────────────────────────────────────────────────────
router.get('/me', protect, userController.getMe);
router.put('/me', protect, avatarUpload.single('avatar'), userController.updateProfile); // ✅ use avatarUpload

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