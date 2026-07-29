// middlewares/upload.js
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

// ── Configure Cloudinary if credentials exist ────────────────────────
const hasCloudinary = process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET;

if (hasCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Memory storage for fallback (converts upload to Base64 Data URI on Vercel without Cloudinary)
const memoryStorage = multer.memoryStorage();

// ── Storage: Thumbnails ───────────────────────
const thumbnailStorage = hasCloudinary ? new CloudinaryStorage({
  cloudinary,
  params: {
    folder:           'lms/thumbnails',
    allowed_formats:  ['jpg', 'jpeg', 'png', 'webp'],
    transformation:   [{ width: 800, height: 450, crop: 'fill' }],
  },
}) : memoryStorage;

// ── Storage: Avatars ────────────────────────
const avatarStorage = hasCloudinary ? new CloudinaryStorage({
  cloudinary,
  params: {
    folder:          'lms/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation:  [{ width: 200, height: 200, crop: 'fill' }],
  },
}) : memoryStorage;

// ── Storage: Assignments (PDFs, docs, etc.) ─────────────────────────
const assignmentStorage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => {
    const isPdf = file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf');
    return {
      folder:        'lms/assignments',
      resource_type: isPdf ? 'image' : 'raw',   // PDF as 'image' type allows inline browser viewing
      allowed_formats: ['pdf', 'doc', 'docx', 'txt', 'zip', 'xls', 'xlsx', 'ppt', 'pptx', 'jpg', 'jpeg', 'png', 'webp'],
    };
  },
});

// ── File filters ────────────────────────────────────────────────────
const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (jpg, jpeg, png, webp, gif) are allowed'), false);
  }
};

const documentFilter = (req, file, cb) => {
  const allowed = /pdf|msword|vnd.openxmlformats|plain|zip|vnd.ms-excel|vnd.ms-powerpoint/;
  if (allowed.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only documents (pdf, doc, docx, txt, zip, xls, xlsx, ppt, pptx) are allowed'), false);
  }
};

// ── Multer instances ────────────────────────────────────────────────
const thumbnailUpload  = multer({ storage: thumbnailStorage,  limits: { fileSize: 5  * 1024 * 1024 }, fileFilter: imageFilter });
const avatarUpload     = multer({ storage: avatarStorage,     limits: { fileSize: 2  * 1024 * 1024 }, fileFilter: imageFilter });
const assignmentUpload = multer({ storage: assignmentStorage, limits: { fileSize: 50 * 1024 * 1024 }, fileFilter: documentFilter });

// ── Default export = thumbnailUpload (keeps old import working) ─────
// routes/teacher.js does:  const upload = require('../middlewares/upload')
// So upload.single('thumbnail') still works without changing any routes.
const upload = thumbnailUpload;

module.exports           = upload;                        // default — backward compat
module.exports.upload    = upload;
module.exports.thumbnailUpload  = thumbnailUpload;
module.exports.avatarUpload     = avatarUpload;
module.exports.assignmentUpload = assignmentUpload;
module.exports.cloudinary       = cloudinary;             // export for destroy() calls