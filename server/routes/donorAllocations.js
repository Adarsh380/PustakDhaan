const express = require('express');
const router = express.Router();
const DonationRecord = require('../models/Donation');
const BookAllocation = require('../models/BookAllocation');
const authenticateToken = require('../middleware/authenticateToken');

// Get schools where this donor's books were allocated
router.get('/my-allocations', authenticateToken, async (req, res) => {
  await require('mongoose').connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pustakdhaan');
  try {
    const donorId = req.user.userId;
    const donations = await DonationRecord.find({ donor: donorId });
    const donationIds = donations.map(d => d._id);
    const allocations = await BookAllocation.find({ donationsUsed: { $in: donationIds } })
      .populate('school', 'name address')
      .populate('donationDrive', 'name');
    res.json(allocations.map(a => ({
      school: a.school,
      donationDrive: a.donationDrive,
      booksAllocated: a.booksAllocated,
      allocationDate: a.allocationDate
    })));
  } catch (error) {
    res.status(500).json({ message: 'Error fetching allocations for donor' });
  }
});

module.exports = router;
