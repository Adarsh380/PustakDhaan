const express = require('express');
const School = require('../models/School');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Middleware to verify token
const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ message: 'Invalid token' });
  }
};

// Create new school (admin only)
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { 
      name, 
      address, 
      contactPerson, 
      schoolType, 
      studentsCount 
    } = req.body;

    const school = new School({
      name,
      address,
      contactPerson,
      schoolType,
      studentsCount
    });

    await school.save();

    res.status(201).json({
      message: 'School created successfully',
      school
    });
  } catch (error) {
    console.error('Error creating school:', error);
    res.status(500).json({ message: 'Server error during school creation' });
  }
});

// Get all schools
router.get('/all', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const schools = await School.find({ isActive: true })
      .sort({ name: 1 });

    res.json(schools);
  } catch (error) {
    console.error('Error fetching schools:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single school
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const school = await School.findById(req.params.id);
    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }

    res.json(school);
  } catch (error) {
    console.error('Error fetching school:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update school (admin only)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const school = await School.findById(req.params.id);
    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }

    const updates = req.body;
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        school[key] = updates[key];
      }
    });

    await school.save();

    res.json({
      message: 'School updated successfully',
      school
    });
  } catch (error) {
    console.error('Error updating school:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete school (admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const school = await School.findById(req.params.id);
    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }

    school.isActive = false;
    await school.save();

    res.json({ message: 'School deactivated successfully' });
  } catch (error) {
    console.error('Error deactivating school:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
