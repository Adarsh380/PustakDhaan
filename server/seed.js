const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const BookDonationDrive = require('./models/BookDonationDrive');
const School = require('./models/School');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pustakdhaan';

async function seedData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await BookDonationDrive.deleteMany({});
    await School.deleteMany({});

    // Create admin user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    const admin = new User({
      name: 'Admin User',
      email: 'admin@pustakdhaan.com',
      password: hashedPassword,
      phone: '+91-9876543210',
      role: 'admin',
      address: {
        street: '123 Admin Street',
        city: 'Bangalore',
        state: 'Karnataka',
        zipCode: '560001'
      }
    });
    await admin.save();

    // Create coordinator user
    const coordinatorPassword = await bcrypt.hash('coord123', salt);
    const coordinator = new User({
      name: 'Rajesh Kumar',
      email: 'rajesh@pustakdhaan.com',
      password: coordinatorPassword,
      phone: '+91-9876543211',
      role: 'coordinator',
      address: {
        street: '456 Coordinator Lane',
        city: 'Bangalore',
        state: 'Karnataka',
        zipCode: '560002'
      }
    });
    await coordinator.save();

    // Create sample donor
    const donorPassword = await bcrypt.hash('donor123', salt);
    const donor = new User({
      name: 'Priya Sharma',
      email: 'priya@example.com',
      password: donorPassword,
      phone: '+91-9876543212',
      role: 'donor',
      address: {
        street: '789 Donor Road',
        city: 'Bangalore',
        state: 'Karnataka',
        zipCode: '560003'
      }
    });
    await donor.save();

    // Create sample schools
    const school1 = new School({
      name: 'Government Primary School Whitefield',
      address: {
        street: 'Whitefield Main Road',
        city: 'Bangalore',
        state: 'Karnataka',
        zipCode: '560066'
      },
      contactPerson: {
        name: 'Mrs. Lakshmi',
        phone: '+91-9876540001',
        email: 'principal.whitefield@gov.in'
      },
      studentsCount: 150
    });
    await school1.save();

    const school2 = new School({
      name: 'Government High School Marathahalli',
      address: {
        street: 'Marathahalli Bridge',
        city: 'Bangalore',
        state: 'Karnataka',
        zipCode: '560037'
      },
      contactPerson: {
        name: 'Mr. Ravi Kumar',
        phone: '+91-9876540002',
        email: 'principal.marathahalli@gov.in'
      },
      studentsCount: 200
    });
    await school2.save();

    // Create sample donation drives
    const drive1 = new BookDonationDrive({
      name: 'Brigade Millennium Book Drive',
      description: 'Annual book donation drive for the Brigade Millennium community',
      location: 'Brigade Millennium Community Hall',
      gatedCommunity: 'Brigade Millennium',
      coordinator: coordinator._id,
      administrator: admin._id,
      startDate: new Date('2024-01-01'),
      status: 'active'
    });
    await drive1.save();

    const drive2 = new BookDonationDrive({
      name: 'Prestige Lakeside Habitat Book Drive',
      description: 'Community book donation initiative',
      location: 'Prestige Lakeside Habitat Clubhouse',
      gatedCommunity: 'Prestige Lakeside Habitat',
      coordinator: coordinator._id,
      administrator: admin._id,
      startDate: new Date('2024-02-01'),
      status: 'active'
    });
    await drive2.save();

    console.log('Seed data created successfully!');
    console.log('Admin login: admin@pustakdhaan.com / admin123');
    console.log('Coordinator login: rajesh@pustakdhaan.com / coord123');
    console.log('Donor login: priya@example.com / donor123');

  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await mongoose.disconnect();
  }
}

seedData();
