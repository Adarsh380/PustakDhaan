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

    // Build summary totals and include per-allocation totals
    const summary = {
      totalAllocated: 0,
      byCategory: { '2-4': 0, '4-6': 0, '6-8': 0, '8-10': 0 }
    };

    const allocationsResponse = allocations.map(a => {
      // ensure numbers
      const books = {
        '2-4': Number(a.booksAllocated?.['2-4'] || 0),
        '4-6': Number(a.booksAllocated?.['4-6'] || 0),
        '6-8': Number(a.booksAllocated?.['6-8'] || 0),
        '8-10': Number(a.booksAllocated?.['8-10'] || 0)
      };
      const totalForAllocation = Number(a.totalBooksAllocated) || Object.values(books).reduce((s, n) => s + n, 0);

      // accumulate into summary
      summary.totalAllocated += totalForAllocation;
      for (const k of Object.keys(summary.byCategory)) {
        summary.byCategory[k] += books[k] || 0;
      }

      return {
        school: a.school,
        donationDrive: a.donationDrive,
        booksAllocated: books,
        totalBooksAllocated: totalForAllocation,
        allocationDate: a.allocationDate
      };
    });

    res.json({ summary, allocations: allocationsResponse });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching allocations for donor' });
  }
});

module.exports = router;
