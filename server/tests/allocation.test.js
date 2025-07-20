const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../index'); // Assuming your main app file exports the Express app
const User = require('../models/User');
const School = require('../models/School');
const BookDonationDrive = require('../models/BookDonationDrive');
const BookAllocation = require('../models/BookAllocation');

describe('Book Allocation Logic', () => {
  let adminToken;
  let nonAdminToken;
  let testSchool;
  let testDrive;
  let adminUser;
  let regularUser;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/pustakdhaan_test');
    
    // Clean up test data
    await User.deleteMany({});
    await School.deleteMany({});
    await BookDonationDrive.deleteMany({});
    await BookAllocation.deleteMany({});
  });

  beforeEach(async () => {
    // Create test users
    adminUser = new User({
      name: 'Test Admin',
      email: 'admin@test.com',
      password: 'hashedpassword',
      role: 'admin'
    });
    await adminUser.save();

    regularUser = new User({
      name: 'Test User',
      email: 'user@test.com',
      password: 'hashedpassword',
      role: 'donor'
    });
    await regularUser.save();

    // Generate tokens
    adminToken = jwt.sign(
      { userId: adminUser._id, email: adminUser.email },
      process.env.JWT_SECRET || 'fallback_secret'
    );

    nonAdminToken = jwt.sign(
      { userId: regularUser._id, email: regularUser.email },
      process.env.JWT_SECRET || 'fallback_secret'
    );

    // Create test school
    testSchool = new School({
      name: 'Test Government School',
      address: {
        street: '123 Test St',
        city: 'Test City',
        state: 'Test State',
        zipCode: '12345'
      },
      contactPerson: {
        name: 'Test Contact',
        phone: '1234567890',
        email: 'contact@school.test'
      },
      studentsCount: 500
    });
    await testSchool.save();

    // Create test donation drive with books
    testDrive = new BookDonationDrive({
      name: 'Test Drive',
      description: 'Test Description',
      location: 'Test Location',
      gatedCommunity: 'Test Community',
      coordinator: regularUser._id,
      administrator: adminUser._id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      totalBooksReceived: 100,
      booksReceived: {
        '2-4': 25,
        '4-6': 30,
        '6-8': 25,
        '8-10': 20
      }
    });
    await testDrive.save();
  });

  afterEach(async () => {
    // Clean up test data after each test
    await User.deleteMany({});
    await School.deleteMany({});
    await BookDonationDrive.deleteMany({});
    await BookAllocation.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('POST /api/allocations/allocate', () => {
    describe('Authentication and Authorization', () => {
      test('should deny access without token', async () => {
        const response = await request(app)
          .post('/api/allocations/allocate')
          .send({
            donationDriveId: testDrive._id,
            schoolId: testSchool._id,
            booksAllocated: { '2-4': 5, '4-6': 0, '6-8': 0, '8-10': 0 }
          });

        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Access denied. No token provided.');
      });

      test('should deny access to non-admin users', async () => {
        const response = await request(app)
          .post('/api/allocations/allocate')
          .set('Authorization', `Bearer ${nonAdminToken}`)
          .send({
            donationDriveId: testDrive._id,
            schoolId: testSchool._id,
            booksAllocated: { '2-4': 5, '4-6': 0, '6-8': 0, '8-10': 0 }
          });

        expect(response.status).toBe(403);
        expect(response.body.message).toBe('Access denied. Admin only.');
      });
    });

    describe('Input Validation', () => {
      test('should reject invalid donation drive ID', async () => {
        const response = await request(app)
          .post('/api/allocations/allocate')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            donationDriveId: new mongoose.Types.ObjectId(),
            schoolId: testSchool._id,
            booksAllocated: { '2-4': 5, '4-6': 0, '6-8': 0, '8-10': 0 }
          });

        expect(response.status).toBe(404);
        expect(response.body.message).toBe('Donation drive not found');
      });

      test('should reject invalid school ID', async () => {
        const response = await request(app)
          .post('/api/allocations/allocate')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            donationDriveId: testDrive._id,
            schoolId: new mongoose.Types.ObjectId(),
            booksAllocated: { '2-4': 5, '4-6': 0, '6-8': 0, '8-10': 0 }
          });

        expect(response.status).toBe(404);
        expect(response.body.message).toBe('School not found');
      });

      test('should reject allocation with zero books', async () => {
        const response = await request(app)
          .post('/api/allocations/allocate')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            donationDriveId: testDrive._id,
            schoolId: testSchool._id,
            booksAllocated: { '2-4': 0, '4-6': 0, '6-8': 0, '8-10': 0 }
          });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('At least one book must be allocated');
      });
    });

    describe('Availability Validation', () => {
      test('should reject allocation exceeding available books in a category', async () => {
        const response = await request(app)
          .post('/api/allocations/allocate')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            donationDriveId: testDrive._id,
            schoolId: testSchool._id,
            booksAllocated: { '2-4': 30, '4-6': 0, '6-8': 0, '8-10': 0 } // Exceeds available 25
          });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('Not enough books in category 2-4');
        expect(response.body.message).toContain('Available: 25, Requested: 30');
      });

      test('should reject allocation when multiple categories exceed availability', async () => {
        const response = await request(app)
          .post('/api/allocations/allocate')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            donationDriveId: testDrive._id,
            schoolId: testSchool._id,
            booksAllocated: { '2-4': 30, '4-6': 35, '6-8': 0, '8-10': 0 }
          });

        expect(response.status).toBe(400);
        // Should fail on the first category that exceeds
        expect(response.body.message).toContain('Not enough books in category');
      });
    });

    describe('Successful Allocation', () => {
      test('should successfully allocate books within available limits', async () => {
        const allocationData = {
          donationDriveId: testDrive._id,
          schoolId: testSchool._id,
          booksAllocated: { '2-4': 10, '4-6': 15, '6-8': 5, '8-10': 10 },
          notes: 'Test allocation'
        };

        const response = await request(app)
          .post('/api/allocations/allocate')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(allocationData);

        expect(response.status).toBe(201);
        expect(response.body.message).toBe('Books allocated successfully');
        expect(response.body.allocation).toBeDefined();
        expect(response.body.allocation.totalBooksAllocated).toBe(40);
        expect(response.body.allocation.notes).toBe('Test allocation');
      });

      test('should update donation drive available books after allocation', async () => {
        const allocationData = {
          donationDriveId: testDrive._id,
          schoolId: testSchool._id,
          booksAllocated: { '2-4': 10, '4-6': 15, '6-8': 5, '8-10': 10 }
        };

        await request(app)
          .post('/api/allocations/allocate')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(allocationData);

        // Check updated drive
        const updatedDrive = await BookDonationDrive.findById(testDrive._id);
        expect(updatedDrive.booksReceived['2-4']).toBe(15); // 25 - 10
        expect(updatedDrive.booksReceived['4-6']).toBe(15); // 30 - 15
        expect(updatedDrive.booksReceived['6-8']).toBe(20); // 25 - 5
        expect(updatedDrive.booksReceived['8-10']).toBe(10); // 20 - 10
        expect(updatedDrive.totalBooksReceived).toBe(60); // 100 - 40
      });

      test('should update school total books received after allocation', async () => {
        const allocationData = {
          donationDriveId: testDrive._id,
          schoolId: testSchool._id,
          booksAllocated: { '2-4': 10, '4-6': 15, '6-8': 5, '8-10': 10 }
        };

        await request(app)
          .post('/api/allocations/allocate')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(allocationData);

        // Check updated school
        const updatedSchool = await School.findById(testSchool._id);
        expect(updatedSchool.totalBooksReceived).toBe(40);
      });

      test('should handle allocation of books in single category', async () => {
        const allocationData = {
          donationDriveId: testDrive._id,
          schoolId: testSchool._id,
          booksAllocated: { '2-4': 20, '4-6': 0, '6-8': 0, '8-10': 0 }
        };

        const response = await request(app)
          .post('/api/allocations/allocate')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(allocationData);

        expect(response.status).toBe(201);
        expect(response.body.allocation.totalBooksAllocated).toBe(20);

        const updatedDrive = await BookDonationDrive.findById(testDrive._id);
        expect(updatedDrive.booksReceived['2-4']).toBe(5); // 25 - 20
        expect(updatedDrive.booksReceived['4-6']).toBe(30); // unchanged
      });

      test('should handle maximum allocation (all available books)', async () => {
        const allocationData = {
          donationDriveId: testDrive._id,
          schoolId: testSchool._id,
          booksAllocated: { '2-4': 25, '4-6': 30, '6-8': 25, '8-10': 20 }
        };

        const response = await request(app)
          .post('/api/allocations/allocate')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(allocationData);

        expect(response.status).toBe(201);
        expect(response.body.allocation.totalBooksAllocated).toBe(100);

        const updatedDrive = await BookDonationDrive.findById(testDrive._id);
        expect(updatedDrive.booksReceived['2-4']).toBe(0);
        expect(updatedDrive.booksReceived['4-6']).toBe(0);
        expect(updatedDrive.booksReceived['6-8']).toBe(0);
        expect(updatedDrive.booksReceived['8-10']).toBe(0);
        expect(updatedDrive.totalBooksReceived).toBe(0);
      });
    });

    describe('Sequential Allocations', () => {
      test('should handle multiple allocations reducing available books', async () => {
        // First allocation
        const firstAllocation = {
          donationDriveId: testDrive._id,
          schoolId: testSchool._id,
          booksAllocated: { '2-4': 10, '4-6': 10, '6-8': 10, '8-10': 10 }
        };

        const response1 = await request(app)
          .post('/api/allocations/allocate')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(firstAllocation);

        expect(response1.status).toBe(201);

        // Second allocation should work with remaining books
        const secondAllocation = {
          donationDriveId: testDrive._id,
          schoolId: testSchool._id,
          booksAllocated: { '2-4': 15, '4-6': 20, '6-8': 15, '8-10': 10 }
        };

        const response2 = await request(app)
          .post('/api/allocations/allocate')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(secondAllocation);

        expect(response2.status).toBe(201);

        // Third allocation should fail due to insufficient books
        const thirdAllocation = {
          donationDriveId: testDrive._id,
          schoolId: testSchool._id,
          booksAllocated: { '2-4': 5, '4-6': 0, '6-8': 0, '8-10': 0 }
        };

        const response3 = await request(app)
          .post('/api/allocations/allocate')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(thirdAllocation);

        expect(response3.status).toBe(400);
        expect(response3.body.message).toContain('Not enough books in category 2-4');
      });
    });

    describe('Edge Cases', () => {
      test('should handle drive with zero books in a category', async () => {
        // Update drive to have zero books in one category
        testDrive.booksReceived['2-4'] = 0;
        await testDrive.save();

        const response = await request(app)
          .post('/api/allocations/allocate')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            donationDriveId: testDrive._id,
            schoolId: testSchool._id,
            booksAllocated: { '2-4': 1, '4-6': 0, '6-8': 0, '8-10': 0 }
          });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('Not enough books in category 2-4');
        expect(response.body.message).toContain('Available: 0, Requested: 1');
      });

      test('should handle allocation with notes', async () => {
        const allocationData = {
          donationDriveId: testDrive._id,
          schoolId: testSchool._id,
          booksAllocated: { '2-4': 5, '4-6': 0, '6-8': 0, '8-10': 0 },
          notes: 'Special allocation for reading program'
        };

        const response = await request(app)
          .post('/api/allocations/allocate')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(allocationData);

        expect(response.status).toBe(201);
        expect(response.body.allocation.notes).toBe('Special allocation for reading program');
      });

      test('should handle allocation without notes', async () => {
        const allocationData = {
          donationDriveId: testDrive._id,
          schoolId: testSchool._id,
          booksAllocated: { '2-4': 5, '4-6': 0, '6-8': 0, '8-10': 0 }
        };

        const response = await request(app)
          .post('/api/allocations/allocate')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(allocationData);

        expect(response.status).toBe(201);
        expect(response.body.allocation.notes).toBeUndefined();
      });
    });
  });
});

module.exports = {
  // Export test utilities for other test files if needed
  createTestUser: async (role = 'donor') => {
    const user = new User({
      name: `Test ${role}`,
      email: `${role}@test.com`,
      password: 'hashedpassword',
      role
    });
    await user.save();
    return user;
  },

  createTestSchool: async () => {
    const school = new School({
      name: 'Test School',
      address: {
        street: '123 Test St',
        city: 'Test City',
        state: 'Test State',
        zipCode: '12345'
      },
      contactPerson: {
        name: 'Test Contact',
        phone: '1234567890',
        email: 'contact@test.com'
      },
      studentsCount: 100
    });
    await school.save();
    return school;
  },

  createTestDrive: async (coordinator, administrator, books = null) => {
    const drive = new BookDonationDrive({
      name: 'Test Drive',
      description: 'Test Description',
      location: 'Test Location',
      gatedCommunity: 'Test Community',
      coordinator,
      administrator,
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      totalBooksReceived: books ? Object.values(books).reduce((sum, count) => sum + count, 0) : 0,
      booksReceived: books || { '2-4': 0, '4-6': 0, '6-8': 0, '8-10': 0 }
    });
    await drive.save();
    return drive;
  }
};
