const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Extract token
      token = req.headers.authorization.split(' ')[1];
      console.log('🔑 Token received:', token.substring(0, 20) + '...');
      
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('✅ Decoded token:', decoded);
      
      // Handle both userId and id (for flexibility)
      const userId = decoded.userId || decoded.id;
      console.log('👤 Looking for user ID:', userId);
      
      // Find user
      req.user = await User.findById(userId).select('-password');
      console.log('📦 User found:', req.user ? `Yes (${req.user.email})` : 'No');
      
      if (!req.user) {
        console.log('❌ User not found in database');
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }
      
      next();
    } catch (error) {
      console.error('❌ JWT Error:', error.message);
      console.error('Error name:', error.name);
      
      // More specific error messages
      let message = 'Not authorized, token failed';
      if (error.name === 'TokenExpiredError') {
        message = 'Token has expired, please login again';
      } else if (error.name === 'JsonWebTokenError') {
        message = 'Invalid token';
      }
      
      return res.status(401).json({ 
        message,
        error: error.message 
      });
    }
  } else {
    console.log('❌ No authorization header or invalid format');
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized, no user found' });
    }

    const userRole = req.user.role ? req.user.role.toLowerCase() : '';
    const allowed = roles.some(r => r.toLowerCase() === userRole);

    if (!allowed) {
      return res.status(403).json({
        message: `User role '${req.user.role}' is not authorized to access this route`
      });
    }

    next();
  };
};

module.exports = {
  protect,
  authorize
};