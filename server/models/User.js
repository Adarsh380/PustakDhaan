const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  phone: {
    type: String,
    required: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  },
  role: {
    type: String,
    enum: ['donor', 'admin', 'coordinator'],
    default: 'donor'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  totalBooksDonatted: {
    type: Number,
    default: 0
  },
  badge: {
    type: String,
    enum: ['none', 'bronze', 'silver', 'gold'],
    default: 'none'
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Calculate and update badge based on total books donated
userSchema.methods.updateBadge = function() {
  if (this.totalBooksDonatted >= 100) {
    this.badge = 'gold';
  } else if (this.totalBooksDonatted >= 50) {
    this.badge = 'silver';
  } else if (this.totalBooksDonatted >= 10) {
    this.badge = 'bronze';
  } else {
    this.badge = 'none';
  }
};

module.exports = mongoose.model('User', userSchema);
