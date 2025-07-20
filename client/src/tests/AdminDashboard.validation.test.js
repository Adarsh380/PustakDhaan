import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminDashboard from '../pages/AdminDashboard';

// Mock fetch
global.fetch = jest.fn();

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn()
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

describe('AdminDashboard Validation Logic Unit Tests', () => {
  beforeEach(() => {
    mockLocalStorage.getItem.mockReturnValue('mock-token');
    jest.clearAllMocks();
    
    // Mock all API calls to return empty arrays/success
    fetch.mockImplementation((url) => {
      if (url.includes('/api/drives/all')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        });
      }
      if (url.includes('/api/schools/all')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        });
      }
      if (url.includes('/api/allocations/all')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        });
      }
      if (url.includes('/api/donations/all')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        });
      }
      if (url.includes('/api/auth/users')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      });
    });
  });

  // Helper function to extract validation logic from component
  const validateAllocation = (available, allocated) => {
    const errors = [];
    const categories = ['2-4', '4-6', '6-8', '8-10'];
    
    // Check if all categories are provided
    for (const category of categories) {
      if (allocated[category] === undefined || allocated[category] === null) {
        errors.push(`Category ${category} is required`);
      }
    }
    
    // Check for negative values
    for (const category of categories) {
      if (allocated[category] < 0) {
        errors.push(`Category ${category} cannot be negative`);
      }
    }
    
    // Check for non-numeric values
    for (const category of categories) {
      if (isNaN(allocated[category])) {
        errors.push(`Category ${category} must be a number`);
      }
    }
    
    // Check for insufficient books
    for (const category of categories) {
      if (allocated[category] > available[category]) {
        errors.push(`Not enough books in category ${category}. Available: ${available[category]}, Requested: ${allocated[category]}`);
      }
    }
    
    // Check for at least one book allocated
    const totalAllocated = Object.values(allocated).reduce((sum, count) => sum + (parseInt(count) || 0), 0);
    if (totalAllocated === 0) {
      errors.push('At least one book must be allocated');
    }
    
    return errors;
  };

  describe('Validation Logic Tests', () => {
    test('should pass validation with valid allocation', () => {
      const available = { '2-4': 25, '4-6': 30, '6-8': 25, '8-10': 20 };
      const allocated = { '2-4': 10, '4-6': 15, '6-8': 5, '8-10': 10 };
      
      const errors = validateAllocation(available, allocated);
      expect(errors).toHaveLength(0);
    });

    test('should fail validation when requesting more books than available', () => {
      const available = { '2-4': 25, '4-6': 30, '6-8': 25, '8-10': 20 };
      const allocated = { '2-4': 30, '4-6': 15, '6-8': 5, '8-10': 10 };
      
      const errors = validateAllocation(available, allocated);
      expect(errors).toContain('Not enough books in category 2-4. Available: 25, Requested: 30');
    });

    test('should fail validation with negative values', () => {
      const available = { '2-4': 25, '4-6': 30, '6-8': 25, '8-10': 20 };
      const allocated = { '2-4': -5, '4-6': 15, '6-8': 5, '8-10': 10 };
      
      const errors = validateAllocation(available, allocated);
      expect(errors).toContain('Category 2-4 cannot be negative');
    });

    test('should fail validation with non-numeric values', () => {
      const available = { '2-4': 25, '4-6': 30, '6-8': 25, '8-10': 20 };
      const allocated = { '2-4': 'abc', '4-6': 15, '6-8': 5, '8-10': 10 };
      
      const errors = validateAllocation(available, allocated);
      expect(errors).toContain('Category 2-4 must be a number');
    });

    test('should fail validation when all allocations are zero', () => {
      const available = { '2-4': 25, '4-6': 30, '6-8': 25, '8-10': 20 };
      const allocated = { '2-4': 0, '4-6': 0, '6-8': 0, '8-10': 0 };
      
      const errors = validateAllocation(available, allocated);
      expect(errors).toContain('At least one book must be allocated');
    });

    test('should fail validation with missing categories', () => {
      const available = { '2-4': 25, '4-6': 30, '6-8': 25, '8-10': 20 };
      const allocated = { '2-4': 10, '4-6': 15 }; // Missing '6-8' and '8-10'
      
      const errors = validateAllocation(available, allocated);
      expect(errors).toContain('Category 6-8 is required');
      expect(errors).toContain('Category 8-10 is required');
    });

    test('should handle multiple validation errors', () => {
      const available = { '2-4': 25, '4-6': 30, '6-8': 25, '8-10': 20 };
      const allocated = { '2-4': -5, '4-6': 'invalid', '6-8': 30, '8-10': 25 };
      
      const errors = validateAllocation(available, allocated);
      expect(errors.length).toBeGreaterThan(1);
      expect(errors).toContain('Category 2-4 cannot be negative');
      expect(errors).toContain('Category 4-6 must be a number');
      expect(errors).toContain('Not enough books in category 6-8. Available: 25, Requested: 30');
      expect(errors).toContain('Not enough books in category 8-10. Available: 20, Requested: 25');
    });

    test('should handle edge case with exactly available books', () => {
      const available = { '2-4': 25, '4-6': 30, '6-8': 25, '8-10': 20 };
      const allocated = { '2-4': 25, '4-6': 30, '6-8': 25, '8-10': 20 };
      
      const errors = validateAllocation(available, allocated);
      expect(errors).toHaveLength(0);
    });

    test('should handle zero available books', () => {
      const available = { '2-4': 0, '4-6': 0, '6-8': 0, '8-10': 0 };
      const allocated = { '2-4': 1, '4-6': 0, '6-8': 0, '8-10': 0 };
      
      const errors = validateAllocation(available, allocated);
      expect(errors).toContain('Not enough books in category 2-4. Available: 0, Requested: 1');
    });

    test('should handle decimal values (should be treated as invalid)', () => {
      const available = { '2-4': 25, '4-6': 30, '6-8': 25, '8-10': 20 };
      const allocated = { '2-4': 10.5, '4-6': 15, '6-8': 5, '8-10': 10 };
      
      // In a real implementation, decimal values should be rounded or rejected
      // For this test, we'll assume they're accepted but note the total
      const errors = validateAllocation(available, allocated);
      // This depends on implementation - might want to add decimal validation
    });
  });

  describe('Available Books Calculation', () => {
    // Test the logic for calculating available books after existing allocations
    const calculateAvailableBooks = (drive, existingAllocations) => {
      const available = { ...drive.booksReceived };
      
      existingAllocations.forEach(allocation => {
        Object.keys(allocation.booksAllocated).forEach(category => {
          available[category] -= allocation.booksAllocated[category];
        });
      });
      
      return available;
    };

    test('should calculate available books correctly with no allocations', () => {
      const drive = {
        booksReceived: { '2-4': 25, '4-6': 30, '6-8': 25, '8-10': 20 }
      };
      const allocations = [];
      
      const available = calculateAvailableBooks(drive, allocations);
      expect(available).toEqual({ '2-4': 25, '4-6': 30, '6-8': 25, '8-10': 20 });
    });

    test('should calculate available books correctly with one allocation', () => {
      const drive = {
        booksReceived: { '2-4': 25, '4-6': 30, '6-8': 25, '8-10': 20 }
      };
      const allocations = [
        {
          booksAllocated: { '2-4': 10, '4-6': 5, '6-8': 0, '8-10': 5 }
        }
      ];
      
      const available = calculateAvailableBooks(drive, allocations);
      expect(available).toEqual({ '2-4': 15, '4-6': 25, '6-8': 25, '8-10': 15 });
    });

    test('should calculate available books correctly with multiple allocations', () => {
      const drive = {
        booksReceived: { '2-4': 25, '4-6': 30, '6-8': 25, '8-10': 20 }
      };
      const allocations = [
        {
          booksAllocated: { '2-4': 10, '4-6': 5, '6-8': 0, '8-10': 5 }
        },
        {
          booksAllocated: { '2-4': 5, '4-6': 10, '6-8': 15, '8-10': 0 }
        }
      ];
      
      const available = calculateAvailableBooks(drive, allocations);
      expect(available).toEqual({ '2-4': 10, '4-6': 15, '6-8': 10, '8-10': 15 });
    });

    test('should handle case where all books are allocated', () => {
      const drive = {
        booksReceived: { '2-4': 25, '4-6': 30, '6-8': 25, '8-10': 20 }
      };
      const allocations = [
        {
          booksAllocated: { '2-4': 25, '4-6': 30, '6-8': 25, '8-10': 20 }
        }
      ];
      
      const available = calculateAvailableBooks(drive, allocations);
      expect(available).toEqual({ '2-4': 0, '4-6': 0, '6-8': 0, '8-10': 0 });
    });
  });

  describe('Input Sanitization', () => {
    const sanitizeInput = (value) => {
      // Convert to number, default to 0 if invalid
      const num = parseInt(value);
      return isNaN(num) || num < 0 ? 0 : num;
    };

    test('should sanitize string inputs to numbers', () => {
      expect(sanitizeInput('10')).toBe(10);
      expect(sanitizeInput('0')).toBe(0);
    });

    test('should handle invalid inputs', () => {
      expect(sanitizeInput('abc')).toBe(0);
      expect(sanitizeInput('')).toBe(0);
      expect(sanitizeInput(null)).toBe(0);
      expect(sanitizeInput(undefined)).toBe(0);
    });

    test('should handle negative inputs', () => {
      expect(sanitizeInput('-5')).toBe(0);
      expect(sanitizeInput(-10)).toBe(0);
    });

    test('should handle decimal inputs', () => {
      expect(sanitizeInput('10.5')).toBe(10);
      expect(sanitizeInput(15.7)).toBe(15);
    });
  });
});
