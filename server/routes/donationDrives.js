const express = require('express');
const BookDonationDrive = require('../models/BookDonationDrive');
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

// Create new donation drive (admin only)
router.post('/create', authenticateToken, async (req, res) => {
  await require('mongoose').connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pustakdhaan');
  try {
    const user = await User.findById(req.user.userId);
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { name, description, location, gatedCommunity, coordinator, startDate, endDate } = req.body;
    // Ensure coordinator is always stored as an embedded object
    const coordinatorObj = coordinator && typeof coordinator === 'object'
      ? {
          name: coordinator.name || '',
          phone: coordinator.phone || '',
          email: coordinator.email || ''
        }
      : { name: '', phone: '', email: '' };

    const donationDrive = new BookDonationDrive({
      name,
      description,
      location,
      gatedCommunity,
      coordinator: coordinatorObj,
      administrator: req.user.userId,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null
    });

    await donationDrive.save();

    res.status(201).json({
      message: 'Donation drive created successfully',
      donationDrive: await BookDonationDrive.findById(donationDrive._id)
        .populate('administrator', 'name email')
    });
  } catch (error) {
    console.error('Error creating donation drive:', error);
    res.status(500).json({ message: 'Server error during donation drive creation' });
  }
});

// Get all active donation drives
router.get('/active', async (req, res) => {
  await require('mongoose').connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pustakdhaan');
  try {
    const drives = await BookDonationDrive.find({ status: 'active' })
      .populate('administrator', 'name email')
      .sort({ createdAt: -1 });
    // Always return coordinator as an object
    res.json(drives.map(d => ({
      ...d.toObject(),
      coordinator: d.coordinator || { name: '', phone: '', email: '' }
    })));
  } catch (error) {
    console.error('Error fetching active drives:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all donation drives (admin only)
router.get('/all', authenticateToken, async (req, res) => {
  await require('mongoose').connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pustakdhaan');
  try {
    const user = await User.findById(req.user.userId);
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const drives = await BookDonationDrive.find()
      .populate('administrator', 'name email')
      .sort({ createdAt: -1 });
    res.json(drives.map(d => ({
      ...d.toObject(),
      coordinator: d.coordinator || { name: '', phone: '', email: '' }
    })));
  } catch (error) {
    console.error('Error fetching all drives:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Public: Get all donation drives (any status)
router.get('/', async (req, res) => {
  await require('mongoose').connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pustakdhaan');
  try {
    const drives = await BookDonationDrive.find()
      .populate('administrator', 'name email')
      .sort({ createdAt: -1 });
    res.json(drives.map(d => ({
      ...d.toObject(),
      coordinator: d.coordinator || { name: '', phone: '', email: '' }
    })));
  } catch (error) {
    res.status(500).json({ message: 'Error fetching donation drives' });
  }
});

// Get single donation drive
router.get('/:id', async (req, res) => {
  await require('mongoose').connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pustakdhaan');
  try {
    const drive = await BookDonationDrive.findById(req.params.id)
      .populate('administrator', 'name email');
    if (!drive) {
      return res.status(404).json({ message: 'Donation drive not found' });
    }
    res.json({
      ...drive.toObject(),
      coordinator: drive.coordinator || { name: '', phone: '', email: '' }
    });
  } catch (error) {
    console.error('Error fetching donation drive:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update donation drive (admin only)
router.put('/:id', authenticateToken, async (req, res) => {
  await require('mongoose').connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pustakdhaan');
  try {
    const user = await User.findById(req.user.userId);
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const drive = await BookDonationDrive.findById(req.params.id);
    if (!drive) {
      return res.status(404).json({ message: 'Donation drive not found' });
    }

    const updates = req.body;
    // Always update coordinator as an object
    if (updates.coordinator && typeof updates.coordinator === 'object') {
      drive.coordinator = {
        name: updates.coordinator.name || '',
        phone: updates.coordinator.phone || '',
        email: updates.coordinator.email || ''
      };
    }
    Object.keys(updates).forEach(key => {
      if (key !== 'coordinator' && updates[key] !== undefined) {
        drive[key] = updates[key];
      }
    });
    await drive.save();
    // Always return a single-line message for update
    res.json({
      message: 'Donation drive updated successfully',
      donationDrive: {
        ...drive.toObject(),
        coordinator: drive.coordinator || { name: '', phone: '', email: '' }
      }
    });
  } catch (error) {
    console.error('Error updating donation drive:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete donation drive (admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  await require('mongoose').connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pustakdhaan');
  try {
    const user = await User.findById(req.user.userId);
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const drive = await BookDonationDrive.findById(req.params.id);
    if (!drive) {
      return res.status(404).json({ message: 'Donation drive not found' });
    }

    // Check if any donations exist for this drive
    const DonationRecord = require('../models/Donation');
    const donationCount = await DonationRecord.countDocuments({ donationDrive: req.params.id });
    if (donationCount > 0) {
      return res.status(400).json({ message: 'Cannot delete drive: donations have already been made for this drive.' });
    }

    await BookDonationDrive.findByIdAndDelete(req.params.id);
    // Always return a single-line message for delete
    res.json({ message: 'Donation drive deleted successfully' });
  } catch (error) {
    console.error('Error deleting donation drive:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
