const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  },
  contactPerson: {
    name: String,
    phone: String,
    email: String
  },
  schoolType: {
    type: String,
    enum: ['government', 'semi-government'],
    default: 'government'
  },
  studentsCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  totalBooksReceived: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('School', schoolSchema);
