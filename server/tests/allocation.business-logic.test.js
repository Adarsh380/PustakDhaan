const mongoose = require('mongoose');
const BookDonationDrive = require('../models/BookDonationDrive');
const BookAllocation = require('../models/BookAllocation');
const User = require('../models/User');
const School = require('../models/School');

describe('Book Allocation Business Logic Unit Tests', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/pustakdhaan_test');
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await School.deleteMany({});
    await BookDonationDrive.deleteMany({});
    await BookAllocation.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Book Availability Calculation', () => {
    test('should calculate available books correctly with no allocations', () => {
      const drive = {
        booksReceived: { '2-4': 25, '4-6': 30, '6-8': 25, '8-10': 20 }
      };
      const allocations = [];

      const available = calculateAvailableBooks(drive, allocations);
      expect(available).toEqual({ '2-4': 25, '4-6': 30, '6-8': 25, '8-10': 20 });
    });

    test('should calculate available books correctly with allocations', () => {
      const drive = {
        booksReceived: { '2-4': 25, '4-6': 30, '6-8': 25, '8-10': 20 }
      };
      const allocations = [
        { booksAllocated: { '2-4': 10, '4-6': 5, '6-8': 0, '8-10': 15 } },
        { booksAllocated: { '2-4': 5, '4-6': 10, '6-8': 20, '8-10': 0 } }
      ];

      const available = calculateAvailableBooks(drive, allocations);
      expect(available).toEqual({ '2-4': 10, '4-6': 15, '6-8': 5, '8-10': 5 });
    });

    test('should handle case where all books are allocated', () => {
      const drive = {
        booksReceived: { '2-4': 25, '4-6': 30, '6-8': 25, '8-10': 20 }
      };
      const allocations = [
        { booksAllocated: { '2-4': 25, '4-6': 30, '6-8': 25, '8-10': 20 } }
      ];

      const available = calculateAvailableBooks(drive, allocations);
      expect(available).toEqual({ '2-4': 0, '4-6': 0, '6-8': 0, '8-10': 0 });
    });
  });

  describe('Allocation Validation Logic', () => {
    test('should validate sufficient books are available', () => {
      const available = { '2-4': 25, '4-6': 30, '6-8': 25, '8-10': 20 };
      const requested = { '2-4': 10, '4-6': 15, '6-8': 5, '8-10': 10 };

      const result = validateAllocationRequest(available, requested);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should detect insufficient books', () => {
      const available = { '2-4': 25, '4-6': 30, '6-8': 25, '8-10': 20 };
      const requested = { '2-4': 30, '4-6': 15, '6-8': 5, '8-10': 25 };

      const result = validateAllocationRequest(available, requested);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Not enough books in category 2-4');
      expect(result.errors).toContain('Not enough books in category 8-10');
    });

    test('should detect negative values', () => {
      const available = { '2-4': 25, '4-6': 30, '6-8': 25, '8-10': 20 };
      const requested = { '2-4': -5, '4-6': 15, '6-8': 5, '8-10': 10 };

      const result = validateAllocationRequest(available, requested);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Negative values not allowed for category 2-4');
    });

    test('should detect zero total allocation', () => {
      const available = { '2-4': 25, '4-6': 30, '6-8': 25, '8-10': 20 };
      const requested = { '2-4': 0, '4-6': 0, '6-8': 0, '8-10': 0 };

      const result = validateAllocationRequest(available, requested);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('At least one book must be allocated');
    });

    test('should detect missing categories', () => {
      const available = { '2-4': 25, '4-6': 30, '6-8': 25, '8-10': 20 };
      const requested = { '2-4': 10, '4-6': 15 }; // Missing '6-8' and '8-10'

      const result = validateAllocationRequest(available, requested);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing category 6-8');
      expect(result.errors).toContain('Missing category 8-10');
    });

    test('should handle edge case with exact availability', () => {
      const available = { '2-4': 25, '4-6': 30, '6-8': 25, '8-10': 20 };
      const requested = { '2-4': 25, '4-6': 30, '6-8': 25, '8-10': 20 };

      const result = validateAllocationRequest(available, requested);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Drive Total Calculation', () => {
    test('should calculate total books received correctly', () => {
      const booksReceived = { '2-4': 25, '4-6': 30, '6-8': 25, '8-10': 20 };
      const total = calculateTotalBooks(booksReceived);
      expect(total).toBe(100);
    });

    test('should handle empty books received', () => {
      const booksReceived = { '2-4': 0, '4-6': 0, '6-8': 0, '8-10': 0 };
      const total = calculateTotalBooks(booksReceived);
      expect(total).toBe(0);
    });

    test('should calculate total allocated books', () => {
      const allocations = [
        { totalBooksAllocated: 40 },
        { totalBooksAllocated: 25 },
        { totalBooksAllocated: 15 }
      ];
      const total = calculateTotalAllocated(allocations);
      expect(total).toBe(80);
    });

    test('should calculate remaining books', () => {
      const totalReceived = 100;
      const totalAllocated = 70;
      const remaining = calculateRemainingBooks(totalReceived, totalAllocated);
      expect(remaining).toBe(30);
    });
  });

  describe('Allocation Update Logic', () => {
    test('should update drive books after allocation', async () => {
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedpassword',
        role: 'admin'
      });
      await user.save();

      const drive = new BookDonationDrive({
        name: 'Test Drive',
        description: 'Test Description',
        location: 'Test Location',
        gatedCommunity: 'Test Community',
        coordinator: user._id,
        administrator: user._id,
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        totalBooksReceived: 100,
        booksReceived: { '2-4': 25, '4-6': 30, '6-8': 25, '8-10': 20 }
      });
      await drive.save();

      const allocation = { '2-4': 10, '4-6': 15, '6-8': 5, '8-10': 10 };
      const updatedDrive = await updateDriveAfterAllocation(drive, allocation);

      expect(updatedDrive.booksReceived['2-4']).toBe(15); // 25 - 10
      expect(updatedDrive.booksReceived['4-6']).toBe(15); // 30 - 15
      expect(updatedDrive.booksReceived['6-8']).toBe(20); // 25 - 5
      expect(updatedDrive.booksReceived['8-10']).toBe(10); // 20 - 10
      expect(updatedDrive.totalBooksReceived).toBe(60); // 100 - 40
    });

    test('should handle multiple consecutive allocations', async () => {
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedpassword',
        role: 'admin'
      });
      await user.save();

      let drive = new BookDonationDrive({
        name: 'Test Drive',
        description: 'Test Description',
        location: 'Test Location',
        gatedCommunity: 'Test Community',
        coordinator: user._id,
        administrator: user._id,
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        totalBooksReceived: 100,
        booksReceived: { '2-4': 25, '4-6': 30, '6-8': 25, '8-10': 20 }
      });
      await drive.save();

      // First allocation
      const allocation1 = { '2-4': 10, '4-6': 15, '6-8': 5, '8-10': 10 };
      drive = await updateDriveAfterAllocation(drive, allocation1);

      // Second allocation
      const allocation2 = { '2-4': 5, '4-6': 5, '6-8': 10, '8-10': 5 };
      drive = await updateDriveAfterAllocation(drive, allocation2);

      expect(drive.booksReceived['2-4']).toBe(10); // 25 - 10 - 5
      expect(drive.booksReceived['4-6']).toBe(10); // 30 - 15 - 5
      expect(drive.booksReceived['6-8']).toBe(10); // 25 - 5 - 10
      expect(drive.booksReceived['8-10']).toBe(5); // 20 - 10 - 5
      expect(drive.totalBooksReceived).toBe(35); // 100 - 40 - 25
    });
  });

  describe('Data Consistency Checks', () => {
    test('should detect inconsistent drive totals', () => {
      const drive = {
        totalBooksReceived: 100,
        booksReceived: { '2-4': 25, '4-6': 30, '6-8': 25, '8-10': 15 } // Sum = 95, not 100
      };

      const isConsistent = checkDriveTotalConsistency(drive);
      expect(isConsistent).toBe(false);
    });

    test('should validate consistent drive totals', () => {
      const drive = {
        totalBooksReceived: 100,
        booksReceived: { '2-4': 25, '4-6': 30, '6-8': 25, '8-10': 20 } // Sum = 100
      };

      const isConsistent = checkDriveTotalConsistency(drive);
      expect(isConsistent).toBe(true);
    });

    test('should detect allocation total mismatch', () => {
      const allocation = {
        totalBooksAllocated: 50,
        booksAllocated: { '2-4': 10, '4-6': 15, '6-8': 5, '8-10': 10 } // Sum = 40, not 50
      };

      const isConsistent = checkAllocationTotalConsistency(allocation);
      expect(isConsistent).toBe(false);
    });

    test('should validate consistent allocation totals', () => {
      const allocation = {
        totalBooksAllocated: 40,
        booksAllocated: { '2-4': 10, '4-6': 15, '6-8': 5, '8-10': 10 } // Sum = 40
      };

      const isConsistent = checkAllocationTotalConsistency(allocation);
      expect(isConsistent).toBe(true);
    });
  });
});

// Helper functions that would typically be in a separate utilities file
function calculateAvailableBooks(drive, allocations) {
  const available = { ...drive.booksReceived };
  
  allocations.forEach(allocation => {
    Object.keys(allocation.booksAllocated).forEach(category => {
      available[category] -= allocation.booksAllocated[category];
    });
  });
  
  return available;
}

function validateAllocationRequest(available, requested) {
  const errors = [];
  const categories = ['2-4', '4-6', '6-8', '8-10'];
  
  // Check if all categories are provided
  categories.forEach(category => {
    if (requested[category] === undefined || requested[category] === null) {
      errors.push(`Missing category ${category}`);
    }
  });
  
  // Check for negative values
  categories.forEach(category => {
    if (requested[category] < 0) {
      errors.push(`Negative values not allowed for category ${category}`);
    }
  });
  
  // Check for insufficient books
  categories.forEach(category => {
    if (requested[category] > available[category]) {
      errors.push(`Not enough books in category ${category}`);
    }
  });
  
  // Check for at least one book allocated
  const total = Object.values(requested).reduce((sum, count) => sum + (count || 0), 0);
  if (total === 0) {
    errors.push('At least one book must be allocated');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

function calculateTotalBooks(booksReceived) {
  return Object.values(booksReceived).reduce((sum, count) => sum + count, 0);
}

function calculateTotalAllocated(allocations) {
  return allocations.reduce((sum, allocation) => sum + allocation.totalBooksAllocated, 0);
}

function calculateRemainingBooks(totalReceived, totalAllocated) {
  return totalReceived - totalAllocated;
}

async function updateDriveAfterAllocation(drive, allocation) {
  // Update category counts
  Object.keys(allocation).forEach(category => {
    drive.booksReceived[category] -= allocation[category];
  });
  
  // Update total
  const allocatedTotal = Object.values(allocation).reduce((sum, count) => sum + count, 0);
  drive.totalBooksReceived -= allocatedTotal;
  
  await drive.save();
  return drive;
}

function checkDriveTotalConsistency(drive) {
  const calculatedTotal = Object.values(drive.booksReceived).reduce((sum, count) => sum + count, 0);
  return calculatedTotal === drive.totalBooksReceived;
}

function checkAllocationTotalConsistency(allocation) {
  const calculatedTotal = Object.values(allocation.booksAllocated).reduce((sum, count) => sum + count, 0);
  return calculatedTotal === allocation.totalBooksAllocated;
}
