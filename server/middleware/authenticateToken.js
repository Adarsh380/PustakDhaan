const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify token and attach user info to req.user
module.exports = async function authenticateToken(req, res, next) {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    req.user = decoded;
    // Optionally, attach user object
    // req.userObj = await User.findById(decoded.userId);
    next();
  } catch (error) {
    res.status(403).json({ message: 'Invalid token' });
  }
};
