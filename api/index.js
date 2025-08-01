const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('../server/routes/auth'));
app.use('/api/donations', require('../server/routes/donationRecords'));
app.use('/api/drives', require('../server/routes/donationDrives'));
app.use('/api/schools', require('../server/routes/schools'));
app.use('/api/allocations', require('../server/routes/allocations'));
app.use('/api/donor', require('../server/routes/donorAllocations'));

// MongoDB Connection (ensure only one connection is made in serverless)
let isConnected = false;
async function connectDB() {
  if (!isConnected) {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pustakdhaan', {
    });
    isConnected = true;
    console.log('MongoDB connected successfully!!');
  }
}

// Vercel serverless handler
module.exports = async (req, res) => {
  await connectDB();
  app(req, res);
};
