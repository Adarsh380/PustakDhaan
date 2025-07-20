const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../index');
const User = require('../models/User');
const School = require('../models/School');
const BookDonationDrive = require('../models/BookDonationDrive');
const BookAllocation = require('../models/BookAllocation');
const DonationRecord = require('../models/Donation');

describe('Book Allocation Integration Tests', () => {
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
    await DonationRecord.deleteMany({});

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

    // Create test donation drive
    testDrive = new BookDonationDrive({
      name: 'Integration Test Drive',
      description: 'Test Description',
      location: 'Test Location',
      gatedCommunity: 'Test Community',
      coordinator: adminUser._id,
      administrator: adminUser._id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      totalBooksReceived: 0,
      booksReceived: {
        '2-4': 0,
        '4-6': 0,
        '6-8': 0,
        '8-10': 0
      }
    });
    await testDrive.save();
  });

  afterEach(async () => {
    await User.deleteMany({});
    await School.deleteMany({});
    await BookDonationDrive.deleteMany({});
    await BookAllocation.deleteMany({});
    await DonationRecord.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Complete Allocation Workflow', () => {
    test('should handle complete donation to allocation workflow', async () => {
      // Step 1: Simulate book donations to increase drive totals
      const donationData = {
        donor: adminUser._id,
        donationDrive: testDrive._id,
        donationDate: new Date(),
        booksCount: {
          '2-4': 20,
          '4-6': 25,
          '6-8': 20,
          '8-10': 15
        },
        totalBooks: 80
      };

      const donation = new DonationRecord(donationData);
      await donation.save();

      // Update drive totals (simulating the donation submission process)
      testDrive.booksReceived['2-4'] = 20;
      testDrive.booksReceived['4-6'] = 25;
      testDrive.booksReceived['6-8'] = 20;
      testDrive.booksReceived['8-10'] = 15;
      testDrive.totalBooksReceived = 80;
      await testDrive.save();

      // Step 2: Allocate some books to school
      const allocationData = {
        donationDriveId: testDrive._id,
        schoolId: testSchool._id,
        booksAllocated: {
          '2-4': 10,
          '4-6': 15,
          '6-8': 8,
          '8-10': 7
        },
        notes: 'First allocation'
      };

      const response1 = await request(app)
        .post('/api/allocations/allocate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(allocationData);

      expect(response1.status).toBe(201);
      expect(response1.body.allocation.totalBooksAllocated).toBe(40);

      // Step 3: Verify drive totals were updated
      const updatedDrive = await BookDonationDrive.findById(testDrive._id);
      expect(updatedDrive.booksReceived['2-4']).toBe(10); // 20 - 10
      expect(updatedDrive.booksReceived['4-6']).toBe(10); // 25 - 15
      expect(updatedDrive.booksReceived['6-8']).toBe(12); // 20 - 8
      expect(updatedDrive.booksReceived['8-10']).toBe(8); // 15 - 7
      expect(updatedDrive.totalBooksReceived).toBe(40); // 80 - 40

      // Step 4: Verify school totals were updated
      const updatedSchool = await School.findById(testSchool._id);
      expect(updatedSchool.totalBooksReceived).toBe(40);

      // Step 5: Make second allocation with remaining books
      const secondAllocationData = {
        donationDriveId: testDrive._id,
        schoolId: testSchool._id,
        booksAllocated: {
          '2-4': 10,
          '4-6': 10,
          '6-8': 12,
          '8-10': 8
        },
        notes: 'Final allocation'
      };

      const response2 = await request(app)
        .post('/api/allocations/allocate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(secondAllocationData);

      expect(response2.status).toBe(201);
      expect(response2.body.allocation.totalBooksAllocated).toBe(40);

      // Step 6: Verify all books are allocated
      const finalDrive = await BookDonationDrive.findById(testDrive._id);
      expect(finalDrive.totalBooksReceived).toBe(0);
      expect(finalDrive.booksReceived['2-4']).toBe(0);
      expect(finalDrive.booksReceived['4-6']).toBe(0);
      expect(finalDrive.booksReceived['6-8']).toBe(0);
      expect(finalDrive.booksReceived['8-10']).toBe(0);

      const finalSchool = await School.findById(testSchool._id);
      expect(finalSchool.totalBooksReceived).toBe(80);

      // Step 7: Verify trying to allocate more books fails
      const excessAllocationData = {
        donationDriveId: testDrive._id,
        schoolId: testSchool._id,
        booksAllocated: {
          '2-4': 1,
          '4-6': 0,
          '6-8': 0,
          '8-10': 0
        }
      };

      const response3 = await request(app)
        .post('/api/allocations/allocate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(excessAllocationData);

      expect(response3.status).toBe(400);
      expect(response3.body.message).toContain('Not enough books in category 2-4');
    });

    test('should handle multiple schools allocation from same drive', async () => {
      // Create second school
      const secondSchool = new School({
        name: 'Second Test School',
        address: {
          street: '456 Test Ave',
          city: 'Test City 2',
          state: 'Test State',
          zipCode: '54321'
        },
        contactPerson: {
          name: 'Second Contact',
          phone: '0987654321',
          email: 'contact2@school.test'
        },
        studentsCount: 300
      });
      await secondSchool.save();

      // Add books to drive
      testDrive.booksReceived = { '2-4': 50, '4-6': 50, '6-8': 50, '8-10': 50 };
      testDrive.totalBooksReceived = 200;
      await testDrive.save();

      // Allocate to first school
      const allocation1 = await request(app)
        .post('/api/allocations/allocate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          donationDriveId: testDrive._id,
          schoolId: testSchool._id,
          booksAllocated: { '2-4': 20, '4-6': 20, '6-8': 20, '8-10': 20 }
        });

      expect(allocation1.status).toBe(201);

      // Allocate to second school
      const allocation2 = await request(app)
        .post('/api/allocations/allocate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          donationDriveId: testDrive._id,
          schoolId: secondSchool._id,
          booksAllocated: { '2-4': 30, '4-6': 30, '6-8': 30, '8-10': 30 }
        });

      expect(allocation2.status).toBe(201);

      // Verify both schools received books
      const school1Updated = await School.findById(testSchool._id);
      const school2Updated = await School.findById(secondSchool._id);
      
      expect(school1Updated.totalBooksReceived).toBe(80);
      expect(school2Updated.totalBooksReceived).toBe(120);

      // Verify drive has no books left
      const driveUpdated = await BookDonationDrive.findById(testDrive._id);
      expect(driveUpdated.totalBooksReceived).toBe(0);
    });

    test('should maintain data integrity under concurrent allocations', async () => {
      // Set up drive with limited books
      testDrive.booksReceived = { '2-4': 20, '4-6': 0, '6-8': 0, '8-10': 0 };
      testDrive.totalBooksReceived = 20;
      await testDrive.save();

      // Create second school for concurrent allocation
      const secondSchool = new School({
        name: 'Concurrent Test School',
        address: {
          street: '789 Concurrent St',
          city: 'Test City',
          state: 'Test State',
          zipCode: '98765'
        },
        contactPerson: {
          name: 'Concurrent Contact',
          phone: '5555555555',
          email: 'concurrent@school.test'
        },
        studentsCount: 200
      });
      await secondSchool.save();

      // Attempt two allocations that together would exceed available books
      const allocation1Promise = request(app)
        .post('/api/allocations/allocate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          donationDriveId: testDrive._id,
          schoolId: testSchool._id,
          booksAllocated: { '2-4': 15, '4-6': 0, '6-8': 0, '8-10': 0 }
        });

      const allocation2Promise = request(app)
        .post('/api/allocations/allocate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          donationDriveId: testDrive._id,
          schoolId: secondSchool._id,
          booksAllocated: { '2-4': 15, '4-6': 0, '6-8': 0, '8-10': 0 }
        });

      const [response1, response2] = await Promise.all([allocation1Promise, allocation2Promise]);

      // One should succeed, one should fail
      const responses = [response1, response2];
      const successResponses = responses.filter(r => r.status === 201);
      const failureResponses = responses.filter(r => r.status === 400);

      expect(successResponses).toHaveLength(1);
      expect(failureResponses).toHaveLength(1);
      expect(failureResponses[0].body.message).toContain('Not enough books');

      // Verify final state is consistent
      const finalDrive = await BookDonationDrive.findById(testDrive._id);
      expect(finalDrive.booksReceived['2-4']).toBe(5); // 20 - 15
      expect(finalDrive.totalBooksReceived).toBe(5);
    });
  });
});

module.exports = {};
