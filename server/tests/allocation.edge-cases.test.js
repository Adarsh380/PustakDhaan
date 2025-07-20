const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../index');
const User = require('../models/User');
const School = require('../models/School');
const BookDonationDrive = require('../models/BookDonationDrive');
const BookAllocation = require('../models/BookAllocation');

describe('Book Allocation Edge Cases and Validation', () => {
  let adminToken;
  let adminUser;
  let testSchool;
  let testDrive;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/pustakdhaan_test');
  });

  beforeEach(async () => {
    // Clean up
    await User.deleteMany({});
    await School.deleteMany({});
    await BookDonationDrive.deleteMany({});
    await BookAllocation.deleteMany({});

    // Create admin user
    adminUser = new User({
      name: 'Test Admin',
      email: 'admin@test.com',
      password: 'hashedpassword',
      role: 'admin'
    });
    await adminUser.save();

    adminToken = jwt.sign(
      { userId: adminUser._id, email: adminUser.email },
      process.env.JWT_SECRET || 'fallback_secret'
    );

    // Create test school
    testSchool = new School({
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
    await testSchool.save();

    // Create test drive
    testDrive = new BookDonationDrive({
      name: 'Test Drive',
      description: 'Test Description',
      location: 'Test Location',
      gatedCommunity: 'Test Community',
      coordinator: adminUser._id,
      administrator: adminUser._id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
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
    await User.deleteMany({});
    await School.deleteMany({});
    await BookDonationDrive.deleteMany({});
    await BookAllocation.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Input Validation Edge Cases', () => {
    test('should reject negative book counts', async () => {
      const response = await request(app)
        .post('/api/allocations/allocate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          donationDriveId: testDrive._id,
          schoolId: testSchool._id,
          booksAllocated: { '2-4': -5, '4-6': 10, '6-8': 0, '8-10': 0 }
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid book count');
    });

    test('should reject non-numeric book counts', async () => {
      const response = await request(app)
        .post('/api/allocations/allocate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          donationDriveId: testDrive._id,
          schoolId: testSchool._id,
          booksAllocated: { '2-4': 'invalid', '4-6': 10, '6-8': 0, '8-10': 0 }
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid book count');
    });

    test('should reject missing book categories', async () => {
      const response = await request(app)
        .post('/api/allocations/allocate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          donationDriveId: testDrive._id,
          schoolId: testSchool._id,
          booksAllocated: { '2-4': 5, '4-6': 10 } // Missing '6-8' and '8-10'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('All book categories must be provided');
    });

    test('should reject allocation with all zeros', async () => {
      const response = await request(app)
        .post('/api/allocations/allocate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          donationDriveId: testDrive._id,
          schoolId: testSchool._id,
          booksAllocated: { '2-4': 0, '4-6': 0, '6-8': 0, '8-10': 0 }
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('At least one book must be allocated');
    });

    test('should reject invalid ObjectId for donation drive', async () => {
      const response = await request(app)
        .post('/api/allocations/allocate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          donationDriveId: 'invalid-id',
          schoolId: testSchool._id,
          booksAllocated: { '2-4': 5, '4-6': 0, '6-8': 0, '8-10': 0 }
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid donation drive ID');
    });

    test('should reject invalid ObjectId for school', async () => {
      const response = await request(app)
        .post('/api/allocations/allocate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          donationDriveId: testDrive._id,
          schoolId: 'invalid-id',
          booksAllocated: { '2-4': 5, '4-6': 0, '6-8': 0, '8-10': 0 }
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid school ID');
    });
  });

  describe('Business Logic Edge Cases', () => {
    test('should handle allocation when drive has exactly enough books', async () => {
      const response = await request(app)
        .post('/api/allocations/allocate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          donationDriveId: testDrive._id,
          schoolId: testSchool._id,
          booksAllocated: { '2-4': 25, '4-6': 30, '6-8': 25, '8-10': 20 } // Exactly what's available
        });

      expect(response.status).toBe(201);
      expect(response.body.allocation.totalBooksAllocated).toBe(100);

      // Verify drive is completely empty
      const updatedDrive = await BookDonationDrive.findById(testDrive._id);
      expect(updatedDrive.totalBooksReceived).toBe(0);
      expect(Object.values(updatedDrive.booksReceived).every(count => count === 0)).toBe(true);
    });

    test('should prevent double allocation to same school from same drive', async () => {
      // First allocation
      await request(app)
        .post('/api/allocations/allocate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          donationDriveId: testDrive._id,
          schoolId: testSchool._id,
          booksAllocated: { '2-4': 10, '4-6': 10, '6-8': 10, '8-10': 10 }
        });

      // Second allocation to same school/drive should fail
      const response = await request(app)
        .post('/api/allocations/allocate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          donationDriveId: testDrive._id,
          schoolId: testSchool._id,
          booksAllocated: { '2-4': 5, '4-6': 5, '6-8': 5, '8-10': 5 }
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('already been allocated');
    });

    test('should handle allocation with very long notes', async () => {
      const longNotes = 'A'.repeat(1000); // 1000 character string

      const response = await request(app)
        .post('/api/allocations/allocate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          donationDriveId: testDrive._id,
          schoolId: testSchool._id,
          booksAllocated: { '2-4': 5, '4-6': 0, '6-8': 0, '8-10': 0 },
          notes: longNotes
        });

      expect(response.status).toBe(201);
      expect(response.body.allocation.notes).toBe(longNotes);
    });

    test('should handle concurrent allocations gracefully', async () => {
      // Create multiple allocation requests simultaneously
      const promises = [];
      for (let i = 0; i < 3; i++) {
        const school = new School({
          name: `Concurrent School ${i}`,
          address: {
            street: `${i} Concurrent St`,
            city: 'Test City',
            state: 'Test State',
            zipCode: '12345'
          },
          contactPerson: {
            name: `Contact ${i}`,
            phone: '1234567890',
            email: `contact${i}@test.com`
          },
          studentsCount: 100
        });
        await school.save();

        promises.push(
          request(app)
            .post('/api/allocations/allocate')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
              donationDriveId: testDrive._id,
              schoolId: school._id,
              booksAllocated: { '2-4': 5, '4-6': 5, '6-8': 5, '8-10': 5 }
            })
        );
      }

      const results = await Promise.all(promises);
      
      // All should succeed since there are enough books
      results.forEach(result => {
        expect(result.status).toBe(201);
      });

      // Verify final drive state
      const updatedDrive = await BookDonationDrive.findById(testDrive._id);
      expect(updatedDrive.totalBooksReceived).toBe(40); // 100 - (3 * 20)
    });
  });

  describe('Data Consistency', () => {
    test('should maintain data consistency after multiple allocations', async () => {
      const schools = [];
      for (let i = 0; i < 3; i++) {
        const school = new School({
          name: `Test School ${i}`,
          address: {
            street: `${i} Test St`,
            city: 'Test City',
            state: 'Test State',
            zipCode: '12345'
          },
          contactPerson: {
            name: `Contact ${i}`,
            phone: '1234567890',
            email: `contact${i}@test.com`
          },
          studentsCount: 100
        });
        await school.save();
        schools.push(school);
      }

      // Make sequential allocations
      const allocations = [
        { '2-4': 5, '4-6': 10, '6-8': 5, '8-10': 5 },
        { '2-4': 10, '4-6': 5, '6-8': 10, '8-10': 5 },
        { '2-4': 5, '4-6': 5, '6-8': 5, '8-10': 5 }
      ];

      for (let i = 0; i < 3; i++) {
        const response = await request(app)
          .post('/api/allocations/allocate')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            donationDriveId: testDrive._id,
            schoolId: schools[i]._id,
            booksAllocated: allocations[i]
          });

        expect(response.status).toBe(201);
      }

      // Verify final consistency
      const updatedDrive = await BookDonationDrive.findById(testDrive._id);
      const allAllocations = await BookAllocation.find({ donationDrive: testDrive._id });

      // Calculate total allocated books
      let totalAllocated = 0;
      const categoryTotals = { '2-4': 0, '4-6': 0, '6-8': 0, '8-10': 0 };

      allAllocations.forEach(allocation => {
        totalAllocated += allocation.totalBooksAllocated;
        Object.keys(categoryTotals).forEach(category => {
          categoryTotals[category] += allocation.booksAllocated[category];
        });
      });

      // Verify consistency
      expect(updatedDrive.totalBooksReceived + totalAllocated).toBe(100); // Original total
      Object.keys(categoryTotals).forEach(category => {
        const originalCount = { '2-4': 25, '4-6': 30, '6-8': 25, '8-10': 20 }[category];
        expect(updatedDrive.booksReceived[category] + categoryTotals[category]).toBe(originalCount);
      });
    });
  });
});

module.exports = {
  // Export test utilities
  createTestAllocation: async (drive, school, admin, books) => {
    const allocation = new BookAllocation({
      donationDrive: drive._id,
      school: school._id,
      allocatedBy: admin._id,
      booksAllocated: books,
      totalBooksAllocated: Object.values(books).reduce((sum, count) => sum + count, 0)
    });
    await allocation.save();
    return allocation;
  }
};
