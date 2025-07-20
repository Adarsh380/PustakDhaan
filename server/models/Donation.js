const mongoose = require('mongoose');

const donationRecordSchema = new mongoose.Schema({
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  donationDrive: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BookDonationDrive',
    required: true
  },
  donationDate: {
    type: Date,
    required: true
  },
  booksCount: {
    '2-4': { type: Number, default: 0 },
    '4-6': { type: Number, default: 0 },
    '6-8': { type: Number, default: 0 },
    '8-10': { type: Number, default: 0 }
  },
  // Track how many books from this donation have been allocated (per category)
  allocatedCount: {
    '2-4': { type: Number, default: 0 },
    '4-6': { type: Number, default: 0 },
    '6-8': { type: Number, default: 0 },
    '8-10': { type: Number, default: 0 }
  },
  totalBooks: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['submitted', 'collected', 'allocated'],
    default: 'submitted'
  },
  collectedAt: Date,
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Calculate total books before saving
donationRecordSchema.pre('save', function(next) {
  this.totalBooks = this.booksCount['2-4'] + this.booksCount['4-6'] + 
                   this.booksCount['6-8'] + this.booksCount['8-10'];
  next();
});

module.exports = mongoose.model('DonationRecord', donationRecordSchema);
