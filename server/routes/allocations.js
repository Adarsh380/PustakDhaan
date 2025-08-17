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
  await require('mongoose').connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pustakdhaan');
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
  await require('mongoose').connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pustakdhaan');
  try {
    const user = await User.findById(req.user.userId);
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { 
      donationDriveId, 
      donorId,
      schoolId, 
      booksAllocated, 
      notes 
    } = req.body;

    // Validate donation drive
    const donationDrive = await BookDonationDrive.findById(donationDriveId);
    if (!donationDrive) {
      return res.status(404).json({ message: 'Donation drive not found' });
    }

    // Validate donor
    if (!donorId) {
      return res.status(400).json({ message: 'Donor must be selected for allocation' });
    }
    const donorUser = await User.findById(donorId);
    if (!donorUser) {
      return res.status(404).json({ message: 'Donor not found' });
    }

    // Validate school
    const school = await School.findById(schoolId);
    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }

    // Coerce booksAllocated values to numbers
    const booksAllocatedNum = {};
    for (const cat of ['2-4','4-6','6-8','8-10']) {
      booksAllocatedNum[cat] = Number(booksAllocated?.[cat]) || 0;
    }

    // Check at least one book requested
    const totalAllocated = Object.values(booksAllocatedNum).reduce((sum, n) => sum + n, 0);
    if (totalAllocated === 0) {
      return res.status(400).json({ message: 'At least one book must be allocated' });
    }

    // Fetch this donor's donation records for the drive (oldest first)
    const donorDonationRecords = await DonationRecord.find({
      donationDrive: donationDriveId,
      donor: donorId,
      status: { $in: ['submitted', 'collected'] }
    }).sort({ donationDate: 1 });

    // Compute donor availability per category
    const donorAvailable = { '2-4': 0, '4-6': 0, '6-8': 0, '8-10': 0 };
    donorDonationRecords.forEach(donation => {
      for (const cat of Object.keys(donorAvailable)) {
        const total = Number(donation.booksCount?.[cat] || 0);
        const allocated = Number(donation.allocatedCount?.[cat] || 0);
        donorAvailable[cat] += total - allocated;
      }
    });

    // Validate requested against donor availability
    for (const category in booksAllocatedNum) {
      const requested = booksAllocatedNum[category] || 0;
      const available = donorAvailable[category] || 0;
      if (requested > available) {
        return res.status(400).json({ message: `Not enough books from this donor in category ${category}. Available: ${available}, Requested: ${requested}` });
      }
    }

    // Allocate from this donor's donations (FIFO)
    const donationsUsed = [];
    const booksAllocatedFromDonations = { '2-4': 0, '4-6': 0, '6-8': 0, '8-10': 0 };

    for (const category of Object.keys(booksAllocatedNum)) {
      let needed = booksAllocatedNum[category];
      for (const donation of donorDonationRecords) {
        if (needed <= 0) break;
        const available = Number(donation.booksCount?.[category] || 0) - Number(donation.allocatedCount?.[category] || 0);
        if (available > 0) {
          const take = Math.min(needed, available);
          donation.allocatedCount = donation.allocatedCount || { '2-4': 0, '4-6': 0, '6-8': 0, '8-10': 0 };
          // coerce existing allocated value to number before adding to avoid string concatenation
          donation.allocatedCount[category] = Number(donation.allocatedCount[category] || 0) + take;
           needed -= take;
           booksAllocatedFromDonations[category] += take;
           if (!donationsUsed.includes(donation._id)) donationsUsed.push(donation._id);
         }
       }
       if (needed > 0) {
         return res.status(400).json({ message: `Not enough donated books in category ${category} to allocate from this donor.` });
       }
     }

     // Save updated allocatedCount for each used donation and gather donor IDs
     const donorIdsSet = new Set();
     for (const donationId of donationsUsed) {
       const donation = donorDonationRecords.find(d => d._id.equals(donationId));
       if (donation) {
        donation.allocatedCount = donation.allocatedCount || { '2-4': 0, '4-6': 0, '6-8': 0, '8-10': 0 };
        // ensure all allocatedCount entries are numbers
        for (const k of Object.keys(donation.allocatedCount)) {
          donation.allocatedCount[k] = Number(donation.allocatedCount[k] || 0);
        }
        await donation.save();
         if (donation.donor) donorIdsSet.add(donation.donor.toString());
       }
     }

     // Update donor summary fields
     for (const donorIdToUpdate of donorIdsSet) {
       const donorDonations = await DonationRecord.find({ donor: donorIdToUpdate });
       let totalAllocatedForDonor = 0;
       for (const d of donorDonations) {
        if (d.allocatedCount) totalAllocatedForDonor += Object.values(d.allocatedCount).reduce((s, n) => s + Number(n || 0), 0);
       }
       const donor = await User.findById(donorIdToUpdate);
       if (donor) {
         donor.totalBooksDonatted = totalAllocatedForDonor;
         donor.updateBadge();
         await donor.save();
       }
     }

    const allocation = new BookAllocation({
      donationDrive: donationDriveId,
      school: schoolId,
      allocatedBy: req.user.userId,
      booksAllocated: booksAllocatedNum,
      totalBooksAllocated: totalAllocated,
      notes,
      donationsUsed
    });

    await allocation.save();

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
  await require('mongoose').connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pustakdhaan');
  try {
    const user = await User.findById(req.user.userId);
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const allocations = await BookAllocation.find()
      .populate('donationDrive', 'name location gatedCommunity')
      .populate('school', 'name address')
      .populate('allocatedBy', 'name email')
      .populate({ path: 'donationsUsed', populate: { path: 'donor', select: 'name email phone' } })
      .sort({ createdAt: -1 });

    res.json(allocations);
  } catch (error) {
    console.error('Error fetching allocations:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get allocations by donation drive
router.get('/by-drive/:driveId', authenticateToken, async (req, res) => {
  await require('mongoose').connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pustakdhaan');
  try {
    const user = await User.findById(req.user.userId);
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const allocations = await BookAllocation.find({ donationDrive: req.params.driveId })
      .populate('school', 'name address')
      .populate('allocatedBy', 'name email')
      .populate({ path: 'donationsUsed', populate: { path: 'donor', select: 'name email phone' } })
      .sort({ createdAt: -1 });

    res.json(allocations);
  } catch (error) {
    console.error('Error fetching allocations by drive:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get allocations by school
router.get('/by-school/:schoolId', authenticateToken, async (req, res) => {
  await require('mongoose').connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pustakdhaan');
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
  await require('mongoose').connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pustakdhaan');
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
