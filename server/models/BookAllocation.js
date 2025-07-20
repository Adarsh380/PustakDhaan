const mongoose = require('mongoose');

const bookAllocationSchema = new mongoose.Schema({
  donationDrive: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BookDonationDrive',
    required: true
  },
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  allocatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  booksAllocated: {
    '2-4': { type: Number, default: 0 },
    '4-6': { type: Number, default: 0 },
    '6-8': { type: Number, default: 0 },
    '8-10': { type: Number, default: 0 }
  },
  totalBooksAllocated: {
    type: Number,
    required: true
  },
  donationsUsed: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DonationRecord'
  }],
  allocationDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['allocated', 'delivered', 'confirmed'],
    default: 'allocated'
  },
  deliveryDate: Date,
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Calculate total books before saving
bookAllocationSchema.pre('save', function(next) {
  this.totalBooksAllocated = this.booksAllocated['2-4'] + this.booksAllocated['4-6'] + 
                           this.booksAllocated['6-8'] + this.booksAllocated['8-10'];
  next();
});

module.exports = mongoose.model('BookAllocation', bookAllocationSchema);
