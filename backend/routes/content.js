const express        = require('express');
const router         = express.Router();
const multer         = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { cloudinary } = require('../middlewares/upload');
const SiteSettings   = require('../models/SiteSettings');
// const ContactMessage = require('../models/ContactMessage');

// ── Cloudinary logo storage ───────────────────────────────────────────────────
const logoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:          'lms/logo',
    allowed_formats: ['jpg', 'jpeg', 'png', 'svg', 'webp'],
    transformation:  [{ width: 400, crop: 'limit' }],
    public_id:       () => 'site-logo',
    overwrite:       true,
    invalidate:      true,
  }
});

const uploadLogo = multer({
  storage: logoStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /jpeg|jpg|png|svg|webp/.test(file.mimetype.split('/')[1]);
    cb(ok ? null : new Error('Only image files are allowed'), ok);
  }
});

// ── Helper: always returns the single settings document ───────────────────────
const getSettings = async () => {
  let settings = await SiteSettings.findOne();
  if (!settings) {
    settings = await SiteSettings.create({});
  }
  return settings;
};

// ── Default page content (used as fallback when DB has none) ──────────────────
const defaultPageContent = {
  home: {
    hero: {
      badgeLabel:   'New',
      badgeText:    'Advanced JavaScript Courses',
      titleLine1:   'Track Your',
      titleLine2:   'Learning Progress',
      description:  'Stay on top of your courses, quizzes, and rankings with real-time insights and interactive learning tools.',
      primaryBtn:   'Get Started',
      secondaryBtn: 'Learn More',
      rating:       '4.9',
      reviewCount:  '10k+ reviews',
    },
    trustedBy: {
      title:     'We are trusted by',
      companies: ['Google', 'Udemy', 'Khan Academy', 'Codecademy', 'Cloud Academy']
    },
    features: {
      title:       'Experience Learning Like Never Before',
      description: 'Stay motivated, track your progress, and connect with a community—all in one seamless platform.',
      cards: [
        { icon: '📈', title: 'Track Progress',      description: 'Monitor your learning journey with detailed analytics and insights.' },
        { icon: '💡', title: 'Interactive Quizzes', description: 'Test your knowledge with engaging quizzes and instant feedback.' },
        { icon: '👥', title: 'Community Learning',  description: 'Connect with peers and mentors in a collaborative environment.' }
      ]
    },
    cta: {
      title:       'Ready to Start Your Learning Journey?',
      description: 'Join thousands of learners already growing their skills',
      buttonText:  'Get Started Today'
    }
  },
  about: {
    heroTitle:       'About Learning Platform',
    heroDescription: 'Empowering learners worldwide with high-quality, accessible education. We\'re on a mission to make learning engaging, effective, and available to everyone.',
    storyTitle:      'Our Story',
    storyParagraphs: [
      'Founded in 2020, Learning Platform was born from a simple idea: education should be accessible, engaging, and effective for everyone, regardless of their background or location.',
      'What started as a small team of passionate educators and developers has grown into a thriving community of learners and instructors from around the world.',
      'Today, we\'re proud to offer hundreds of courses across diverse subjects, helping thousands of students achieve their learning goals and advance their careers.',
      'Our commitment remains the same: to provide the highest quality educational content and the best learning experience possible.'
    ],
    missionTitle:       'Our Mission',
    missionDescription: 'To democratize education by providing world-class learning experiences that are accessible, affordable, and adaptable to every learner\'s needs.',
    stats: [
      { number: '10K+', label: 'Active Students' },
      { number: '500+', label: 'Courses Available' },
      { number: '50+',  label: 'Expert Instructors' },
      { number: '95%',  label: 'Satisfaction Rate' }
    ],
    values: [
      { icon: '🎯', title: 'Excellence',    description: 'We strive for excellence in everything we do, from course content to student support.' },
      { icon: '🤝', title: 'Community',     description: 'Building a supportive learning community where everyone can thrive together.' },
      { icon: '💡', title: 'Innovation',    description: 'Constantly evolving our platform with the latest educational technologies.' },
      { icon: '🌍', title: 'Accessibility', description: 'Making quality education accessible to learners worldwide.' }
    ]
  },
  contact: {
    heroTitle:       'Get in Touch',
    heroDescription: 'Have questions? We\'d love to hear from you. Send us a message and we\'ll respond as soon as possible.',
    contactInfo: {
      email1:               'support@learning.com',
      email2:               'info@learning.com',
      phone:                '+1 (555) 123-4567',
      phoneHours:           'Mon-Fri, 9AM-6PM EST',
      address1:             '123 Learning Street',
      address2:             'Education City, EC 12345',
      liveChatAvailability: 'Available 24/7'
    },
    faqs: [
      { question: 'How do I enroll in a course?', answer: 'Simply browse our courses, select one you like, and click "Enroll Now".' },
      { question: 'Can I get a refund?',           answer: 'Yes! We offer a 30-day money-back guarantee for all our courses.' },
      { question: 'Do you offer certificates?',    answer: 'Yes, you\'ll receive a certificate of completion for each course you finish.' },
      { question: 'How long do I have access?',    answer: 'Once enrolled, you have lifetime access to the course materials.' }
    ]
  }
};

// ════════════════════════════════════════════════════════════════════════════════
// LOGO ROUTES
// ════════════════════════════════════════════════════════════════════════════════

// GET /api/content/logo
router.get('/logo', async (_req, res) => {
  try {
    const settings = await getSettings();
    res.json({ success: true, logoUrl: settings.logoUrl });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/content/logo
router.post('/logo', uploadLogo.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    const logoUrl  = req.file.path;
    const publicId = req.file.filename;

    await SiteSettings.findOneAndUpdate(
      {},
      { logoUrl, publicId },
      { upsert: true, new: true }
    );

    console.log('✅ Logo saved to MongoDB + Cloudinary:', logoUrl);
    res.json({ success: true, logoUrl, message: 'Logo updated successfully' });
  } catch (err) {
    console.error('Logo upload error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/content/logo
router.delete('/logo', async (_req, res) => {
  try {
    const settings = await getSettings();
    if (settings.publicId) {
      await cloudinary.uploader.destroy(settings.publicId);
      console.log('🗑️  Logo deleted from Cloudinary:', settings.publicId);
    }
    await SiteSettings.findOneAndUpdate({}, { logoUrl: null, publicId: null });
    res.json({ success: true, message: 'Logo removed' });
  } catch (err) {
    console.error('Logo delete error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ════════════════════════════════════════════════════════════════════════════════
// CONTACT MESSAGE ROUTES
// ════════════════════════════════════════════════════════════════════════════════

// POST /api/content/messages
router.post('/messages', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and message' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
    }
    const contactMessage = await ContactMessage.create({
      name:    name.trim(),
      email:   email.trim(),
      subject: subject ? subject.trim() : 'No subject',
      message: message.trim(),
    });
    console.log('✅ New contact message from:', name);
    res.status(201).json({ success: true, message: 'Message sent successfully!', data: contactMessage });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
  }
});

// GET /api/content/messages
router.get('/messages', async (_req, res) => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 });
    res.json({ success: true, count: messages.length, data: messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/content/messages/:id
router.delete('/messages/:id', async (req, res) => {
  try {
    const deleted = await ContactMessage.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }
    res.json({ success: true, message: 'Message deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Helper: deep merge defaults with stored content ────────────────────────
const mergeDeep = (target, source) => {
  if (!source) return target;
  const output = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      output[key] = mergeDeep(target[key] || {}, source[key]);
    } else {
      output[key] = source[key];
    }
  }
  return output;
};

// ════════════════════════════════════════════════════════════════════════════════
// PAGE CONTENT ROUTES
// ════════════════════════════════════════════════════════════════════════════════

// GET /api/content/pages — all pages
router.get('/pages', async (_req, res) => {
  try {
    const settings = await getSettings();
    // Merge DB content over defaults so missing fields always have a value
    const data = {
      home:    mergeDeep(defaultPageContent.home,    settings.pageContent?.home),
      about:   mergeDeep(defaultPageContent.about,   settings.pageContent?.about),
      contact: mergeDeep(defaultPageContent.contact, settings.pageContent?.contact),
    };
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/content/pages/:page
router.get('/pages/:page', async (req, res) => {
  try {
    const { page } = req.params;
    if (!defaultPageContent[page]) {
      return res.status(404).json({ success: false, message: 'Page not found' });
    }
    const settings = await getSettings();
    const data = mergeDeep(defaultPageContent[page], settings.pageContent?.[page]);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/content/pages/:page
router.put('/pages/:page', async (req, res) => {
  try {
    const { page } = req.params;
    if (!defaultPageContent[page]) {
      return res.status(404).json({ success: false, message: 'Page not found' });
    }
    const updated = await SiteSettings.findOneAndUpdate(
      {},
      { $set: { [`pageContent.${page}`]: req.body } },
      { upsert: true, new: true, setDefaultsOnInsert: true, strict: false }
    );
    console.log(`✅ ${page} page content saved to MongoDB`);
    res.json({
      success: true,
      message: `${page.charAt(0).toUpperCase() + page.slice(1)} page updated successfully`,
      data:    updated.pageContent?.[page] || req.body
    });
  } catch (err) {
    console.error(`Error saving ${req.params.page} page content:`, err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;