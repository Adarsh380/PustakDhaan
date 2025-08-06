const mongoose = require('mongoose');

const bookDonationDriveSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  gatedCommunity: {
    type: String,
    required: true,
    trim: true
  },
  coordinator: {
    name: String,
    phone: String,
    email: String
  },
  administrator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'completed'],
    default: 'active'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date
  },
  instructions: {
    type: String,
    default: 'Only non-academic books can be donated. Drop time for books is between 9 AM & 7 PM.'
  },
  totalBooksReceived: {
    type: Number,
    default: 0
  },
  booksReceived: {
    '2-4': { type: Number, default: 0 },
    '4-6': { type: Number, default: 0 },
    '6-8': { type: Number, default: 0 },
    '8-10': { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('BookDonationDrive', bookDonationDriveSchema);
