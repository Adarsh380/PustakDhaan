const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const nodemailer = require('nodemailer');
const router = express.Router();
const mongoose = require('mongoose');

// Register
router.post('/register', async (req, res) => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pustakdhaan');
    const { name, email, password, phone, address, role } = req.body;

    if (!['admin', 'donor'].includes(role)) {
      return res.status(400).json({ message: 'Role must be either admin or donor' });
    }

    // If attempting to register as an admin, only allow when there is no admin in the system yet
    if (role === 'admin') {
      const adminExists = await User.exists({ role: 'admin' });
      if (adminExists) {
        return res.status(403).json({ message: 'An admin already exists. Only an existing admin can promote another user to admin.' });
      }
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      phone,
      address,
      role
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pustakdhaan');
    const { email, password } = req.body;
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pustakdhaan');
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
});

// Get all users (admin only)
router.get('/users', async (req, res) => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pustakdhaan');
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    const currentUser = await User.findById(decoded.userId);
    if (!currentUser || currentUser.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Forgot Password - send reset link
router.post('/forgot-password', async (req, res) => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pustakdhaan');
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'No user found with this email' });

  // Generate a reset token (valid for 1 hour)
  const resetToken = jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: '1h' }
  );

  const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

  // Send email with resetLink using nodemailer
  try {
    // Configure transporter (use environment variables for real credentials)
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER || 'your_email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your_email_password',
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER || 'your_email@gmail.com',
      to: user.email,
      subject: 'PustakDhaan Password Reset',
      html: `<p>Hello ${user.name},</p>
        <p>You requested a password reset for your PustakDhaan account.</p>
        <p>Click the link below to reset your password. This link is valid for 1 hour:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>If you did not request this, please ignore this email.</p>`
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: 'Password reset link sent to your email.' });
  } catch (err) {
    console.error('Error sending email:', err);
    res.status(500).json({ message: 'Error sending reset email. Please try again later.' });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pustakdhaan');
  const { token, newPassword } = req.body;
  if (!token || !newPassword) return res.status(400).json({ message: 'Token and new password are required' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    res.status(400).json({ message: 'Invalid or expired token' });
  }
});

// Promote a user to admin (admin only)
router.post('/promote', async (req, res) => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pustakdhaan');
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'No token provided' });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    } catch (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const currentUser = await User.findById(decoded.userId);
    if (!currentUser || currentUser.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: 'userId is required' });

    const userToPromote = await User.findById(userId);
    if (!userToPromote) return res.status(404).json({ message: 'User to promote not found' });
    if (userToPromote.role === 'admin') return res.status(400).json({ message: 'User is already an admin' });

    userToPromote.role = 'admin';
    await userToPromote.save();

    res.json({ message: 'User promoted to admin successfully' });
  } catch (error) {
    console.error('Promote error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
