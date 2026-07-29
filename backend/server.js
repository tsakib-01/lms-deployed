const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");
const certificateRoutes = require('./routes/certificates');

// Load environment variables
dotenv.config();

// Initialize app FIRST
const app = express();

/* ======================
   Middleware
====================== */
app.use(
  cors({
    origin: "*",
    credentials: true
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ======================
   Static File Serving
   (log → headers → serve — in this exact order)
====================== */

// Auto-create upload directories if they don't exist (bypass on Vercel read-only FS)
if (!process.env.VERCEL) {
  ['uploads/thumbnails', 'uploads/attachments'].forEach(dir => {
    const full = path.join(__dirname, dir);
    if (!fs.existsSync(full)) {
      try {
        fs.mkdirSync(full, { recursive: true });
        console.log(`📁 Created directory: ${full}`);
      } catch (err) {
        console.error(`❌ Failed to create directory ${full}:`, err.message);
      }
    }
  });
}

// 1. Log first
app.use("/uploads", (req, res, next) => {
  console.log(`📂 File request: ${req.path}`);
  next();
});

// 2. Set proper headers for different file types
app.use("/uploads", (req, res, next) => {
  const ext = path.extname(req.path).toLowerCase();
  if (ext === '.pdf') {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('X-Content-Type-Options', 'nosniff');
  } else if (ext === '.jpg' || ext === '.jpeg') {
    res.setHeader('Content-Type', 'image/jpeg');
  } else if (ext === '.png') {
    res.setHeader('Content-Type', 'image/png');
  } else if (ext === '.gif') {
    res.setHeader('Content-Type', 'image/gif');
  } else if (ext === '.mp4') {
    res.setHeader('Content-Type', 'video/mp4');
  } else if (ext === '.doc') {
    res.setHeader('Content-Type', 'application/msword');
  } else if (ext === '.docx') {
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  }
  next();
});

// 3. Serve the files (only ONE declaration)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ======================
   MongoDB Connection (Serverless Friendly)
====================== */
let cachedDb = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  if (!process.env.MONGODB_URI) {
    console.error("❌ MONGODB_URI is not defined in environment variables!");
    throw new Error("MONGODB_URI is missing");
  }
  try {
    const db = await mongoose.connect(process.env.MONGODB_URI, {
      bufferCommands: false,
    });
    console.log("✅ MongoDB connected");

    // Automatically seed default admin if not exists
    const User = require('./models/User');
    const adminEmail = 'admin@email.com';
    const adminExists = await User.findOne({ email: adminEmail });
    if (!adminExists) {
      await User.create({
        name: 'Admin',
        email: adminEmail,
        password: '777777', // Will be hashed automatically by userSchema.pre('save') hook
        role: 'admin',
        isActive: true
      });
      console.log(`✅ Default admin account created successfully (${adminEmail} / 777777)`);
    }
    return db;
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    throw error;
  }
};

// Middleware to ensure DB is connected for every request on Vercel
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api')) {
    try {
      await connectDB();
    } catch (err) {
      console.error("DB Middleware Error:", err.message);
    }
  }
  next();
});

/* ======================
   Import Routes (after app is initialized)
====================== */
const authRoutes = require("./routes/auth");
const courseRoutes = require("./routes/courses");
const userRoutes = require("./routes/users");
const paymentRoutes = require("./routes/payments");
const contactRoutes = require('./routes/contact');
const contentRoutes = require('./routes/content');
const adminUserRoutes = require('./routes/adminUsers');
const teacherRoutes = require('./routes/teacher');
const dashboardRoutes = require('./routes/dashboardRoutes');
const studentRoutes = require('./routes/student');

/* ======================
   API Routes
====================== */
app.get("/", (req, res) => {
  res.send("LMS API is running");
});

// Diagnostic route to check DB connection & Seeding on Vercel
app.get("/api/db-debug", async (req, res) => {
  try {
    await connectDB();
    const dbStatus = mongoose.connection.readyState;
    const states = ["disconnected", "connected", "connecting", "disconnecting"];
    
    let adminFound = false;
    let totalUsers = 0;
    
    if (dbStatus === 1) {
      const User = require('./models/User');
      totalUsers = await User.countDocuments();
      const admin = await User.findOne({ email: 'admin@email.com' });
      adminFound = !!admin;
    }
    
    res.json({
      success: true,
      mongodb_uri_exists: !!process.env.MONGODB_URI,
      connection_state: states[dbStatus],
      total_users: totalUsers,
      admin_user_exists: adminFound
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
      stack: err.stack
    });
  }
});

// Debug route to test file serving
app.get("/test-upload/:folder/:filename", (req, res) => {
  const { folder, filename } = req.params;
  const filePath = path.join(__dirname, "uploads", folder, filename);
  console.log("🔍 Testing file path:", filePath);
  if (fs.existsSync(filePath)) {
    console.log("✅ File exists!");
    res.sendFile(filePath);
  } else {
    console.log("❌ File not found");
    res.status(404).json({ error: 'File not found', path: filePath, exists: false });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/users", userRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/content", contentRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/dashboard', dashboardRoutes);
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
/* ======================
   Error Handling
====================== */

// 404 handler (MUST BE AFTER ALL ROUTES)
app.use((req, res) => {
  console.log("❌ 404 - Route not found:", req.method, req.path);
  res.status(404).json({ message: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("💥 Server error:", err.stack);
  res.status(500).json({
    message: "Server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined
  });
});

/* ======================
   Start Server
====================== */
const PORT = process.env.PORT || 5000;

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📁 Static files directory: ${path.join(__dirname, "uploads")}`);
    console.log(`🌐 CORS enabled for all origins`);
  });
}

module.exports = app;