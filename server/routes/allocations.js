const express = require('express');
const BookAllocation = require('../models/BookAllocation');
const BookDonationDrive = require('../models/BookDonationDrive');
const School = require('../models/School');
const User = require('../models/User');
const DonationRecord = require('../models/Donation');
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

// Get all donors and their donations for a given drive (admin only)
router.get('/donors/by-drive/:driveId', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    const donations = await DonationRecord.find({
      donationDrive: req.params.driveId,
      status: { $in: ['submitted', 'collected'] }
    })
      .populate('donor', 'name email phone address role')
      .sort({ donationDate: 1 });
    const donorsMap = {};
    donations.forEach(donation => {
      const donorId = donation.donor._id;
      if (!donorsMap[donorId]) {
        donorsMap[donorId] = {
          donor: donation.donor,
          donations: []
        };
      }
      donorsMap[donorId].donations.push(donation);
    });
    const donors = Object.values(donorsMap);
    res.json(donors);
  } catch (error) {
    console.error('Error fetching donors for drive:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Allocate books to school (admin only)
router.post('/allocate', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { 
      donationDriveId, 
      schoolId, 
      booksAllocated, 
      notes 
    } = req.body;

    // Validate donation drive
    const donationDrive = await BookDonationDrive.findById(donationDriveId);
    if (!donationDrive) {
      return res.status(404).json({ message: 'Donation drive not found' });
    }

    // Validate school
    const school = await School.findById(schoolId);
    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }

    // Check if enough books are available
    const totalAllocated = Object.values(booksAllocated).reduce((sum, count) => sum + count, 0);
    if (totalAllocated === 0) {
      return res.status(400).json({ message: 'At least one book must be allocated' });
    }

    // Calculate total allocated so far for this drive
    const allocations = await BookAllocation.find({ donationDrive: donationDriveId });
    const allocatedSoFar = { '2-4': 0, '4-6': 0, '6-8': 0, '8-10': 0 };
    allocations.forEach(a => {
      for (const cat of Object.keys(allocatedSoFar)) {
        allocatedSoFar[cat] += a.booksAllocated[cat] || 0;
      }
    });

    // Check availability for each category
    for (const category in booksAllocated) {
      const available = (donationDrive.booksReceived[category] || 0) - (allocatedSoFar[category] || 0);
      if (booksAllocated[category] > available) {
        return res.status(400).json({
          message: `Not enough books in category ${category}. Available: ${available}, Requested: ${booksAllocated[category]}`
        });
      }
    }

    // Find donation records for this drive, sorted by donor and oldest first
    const donationRecords = await DonationRecord.find({
      donationDrive: donationDriveId,
      status: { $in: ['submitted', 'collected'] }
    }).sort({ donationDate: 1 });

    // Track which donations are used for this allocation
    const donationsUsed = [];
    const booksToAllocate = { ...booksAllocated };
    const booksAllocatedFromDonations = { '2-4': 0, '4-6': 0, '6-8': 0, '8-10': 0 };

    // For each category, allocate from donations in FIFO order
    for (const category of Object.keys(booksToAllocate)) {
      let needed = booksToAllocate[category];
      for (const donation of donationRecords) {
        if (needed <= 0) break;
        const available = donation.booksCount[category] - (donation.allocatedCount?.[category] || 0);
        if (available > 0) {
          const take = Math.min(needed, available);
          // Track allocation per donation
          donation.allocatedCount = donation.allocatedCount || { '2-4': 0, '4-6': 0, '6-8': 0, '8-10': 0 };
          donation.allocatedCount[category] += take;
          needed -= take;
          booksAllocatedFromDonations[category] += take;
          if (!donationsUsed.includes(donation._id)) {
            donationsUsed.push(donation._id);
          }
        }
      }
      if (needed > 0) {
        return res.status(400).json({ message: `Not enough donated books in category ${category} to allocate.` });
      }
    }

    // Save updated allocatedCount for each used donation
    for (const donationId of donationsUsed) {
      const donation = donationRecords.find(d => d._id.equals(donationId));
      await donation.save();
    }

    const allocation = new BookAllocation({
      donationDrive: donationDriveId,
      school: schoolId,
      allocatedBy: req.user.userId,
      booksAllocated,
      totalBooksAllocated: totalAllocated,
      notes,
      donationsUsed
    });

    await allocation.save();


    // Do NOT decrement booksReceived or totalBooksReceived; they represent total donations.
    // Available books = booksReceived - sum(allocated)

    // Update school total books received
    school.totalBooksReceived += totalAllocated;
    await school.save();

    res.status(201).json({
      message: 'Books allocated successfully',
      allocation: await BookAllocation.findById(allocation._id)
        .populate('donationDrive', 'name location')
        .populate('school', 'name address')
        .populate('allocatedBy', 'name email')
        .populate({
          path: 'donationsUsed',
          populate: { path: 'donor', select: 'name email phone address role' }
        })
    });
  } catch (error) {
    console.error('Error allocating books:', error);
    res.status(500).json({ message: 'Server error during book allocation' });
  }
});

// Get all allocations
router.get('/all', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const allocations = await BookAllocation.find()
      .populate('donationDrive', 'name location gatedCommunity')
      .populate('school', 'name address')
      .populate('allocatedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(allocations);
  } catch (error) {
    console.error('Error fetching allocations:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get allocations by donation drive
router.get('/by-drive/:driveId', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const allocations = await BookAllocation.find({ donationDrive: req.params.driveId })
      .populate('school', 'name address')
      .populate('allocatedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(allocations);
  } catch (error) {
    console.error('Error fetching allocations by drive:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get allocations by school
router.get('/by-school/:schoolId', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const allocations = await BookAllocation.find({ school: req.params.schoolId })
      .populate('donationDrive', 'name location gatedCommunity')
      .populate('allocatedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(allocations);
  } catch (error) {
    console.error('Error fetching allocations by school:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update allocation status
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { status, deliveryDate } = req.body;
    const allocation = await BookAllocation.findById(req.params.id);

    if (!allocation) {
      return res.status(404).json({ message: 'Allocation not found' });
    }

    allocation.status = status;
    if (status === 'delivered' && deliveryDate) {
      allocation.deliveryDate = new Date(deliveryDate);
    }

    await allocation.save();

    res.json({
      message: 'Allocation status updated successfully',
      allocation: await BookAllocation.findById(allocation._id)
        .populate('donationDrive', 'name location')
        .populate('school', 'name address')
        .populate('allocatedBy', 'name email')
    });
  } catch (error) {
    console.error('Error updating allocation status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
