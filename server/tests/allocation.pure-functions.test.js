// Pure business logic tests - no database required
describe('Book Allocation Business Logic Unit Tests (Pure Functions)', () => {
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

  describe('Input Sanitization', () => {
    test('should sanitize and validate input values', () => {
      expect(sanitizeBookCount('10')).toBe(10);
      expect(sanitizeBookCount('0')).toBe(0);
      expect(sanitizeBookCount('-5')).toBe(0);
      expect(sanitizeBookCount('abc')).toBe(0);
      expect(sanitizeBookCount('')).toBe(0);
      expect(sanitizeBookCount(null)).toBe(0);
      expect(sanitizeBookCount(undefined)).toBe(0);
      expect(sanitizeBookCount(10.5)).toBe(10);
    });

    test('should validate book category structure', () => {
      const validCategories = ['2-4', '4-6', '6-8', '8-10'];
      const testInput1 = { '2-4': 10, '4-6': 15, '6-8': 5, '8-10': 10 };
      const testInput2 = { '2-4': 10, '4-6': 15 }; // Missing categories
      const testInput3 = { '2-4': 10, '4-6': 15, '6-8': 5, '8-10': 10, 'extra': 5 }; // Extra category

      expect(validateCategoryStructure(testInput1, validCategories)).toBe(true);
      expect(validateCategoryStructure(testInput2, validCategories)).toBe(false);
      expect(validateCategoryStructure(testInput3, validCategories)).toBe(false);
    });
  });

  describe('Edge Case Calculations', () => {
    test('should handle floating point precision issues', () => {
      const booksReceived = { '2-4': 10.1, '4-6': 10.2, '6-8': 10.3, '8-10': 10.4 };
      const total = calculateTotalBooks(booksReceived);
      expect(total).toBeCloseTo(41.0, 1);
    });

    test('should handle very large numbers', () => {
      const booksReceived = { '2-4': 1000000, '4-6': 2000000, '6-8': 3000000, '8-10': 4000000 };
      const total = calculateTotalBooks(booksReceived);
      expect(total).toBe(10000000);
    });

    test('should handle zero and negative edge cases in allocation', () => {
      const available = { '2-4': 0, '4-6': 10, '6-8': 0, '8-10': 5 };
      const requested1 = { '2-4': 0, '4-6': 5, '6-8': 0, '8-10': 3 }; // Valid
      const requested2 = { '2-4': 1, '4-6': 5, '6-8': 0, '8-10': 3 }; // Invalid - requesting from empty category

      const result1 = validateAllocationRequest(available, requested1);
      const result2 = validateAllocationRequest(available, requested2);

      expect(result1.isValid).toBe(true);
      expect(result2.isValid).toBe(false);
      expect(result2.errors).toContain('Not enough books in category 2-4');
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

function checkDriveTotalConsistency(drive) {
  const calculatedTotal = Object.values(drive.booksReceived).reduce((sum, count) => sum + count, 0);
  return calculatedTotal === drive.totalBooksReceived;
}

function checkAllocationTotalConsistency(allocation) {
  const calculatedTotal = Object.values(allocation.booksAllocated).reduce((sum, count) => sum + count, 0);
  return calculatedTotal === allocation.totalBooksAllocated;
}

function sanitizeBookCount(value) {
  const num = parseInt(value);
  return isNaN(num) || num < 0 ? 0 : num;
}

function validateCategoryStructure(input, validCategories) {
  const inputKeys = Object.keys(input);
  
  // Check if all required categories are present
  const hasAllRequired = validCategories.every(category => inputKeys.includes(category));
  
  // Check if there are no extra categories
  const hasOnlyValid = inputKeys.every(key => validCategories.includes(key));
  
  return hasAllRequired && hasOnlyValid;
}
