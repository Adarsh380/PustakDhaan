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

describe('AdminDashboard Book Allocation Validation', () => {
  const mockDrives = [
    {
      _id: 'drive1',
      name: 'Test Drive 1',
      location: 'Test Location',
      totalBooksReceived: 100,
      booksReceived: {
        '2-4': 25,
        '4-6': 30,
        '6-8': 25,
        '8-10': 20
      }
    },
    {
      _id: 'drive2',
      name: 'Test Drive 2',
      location: 'Test Location 2',
      totalBooksReceived: 50,
      booksReceived: {
        '2-4': 10,
        '4-6': 15,
        '6-8': 15,
        '8-10': 10
      }
    }
  ];

  const mockSchools = [
    {
      _id: 'school1',
      name: 'Test School 1',
      address: { city: 'Test City' }
    }
  ];

  const mockAllocations = [
    {
      _id: 'allocation1',
      donationDrive: { _id: 'drive1' },
      totalBooksAllocated: 20,
      booksAllocated: {
        '2-4': 5,
        '4-6': 10,
        '6-8': 5,
        '8-10': 0
      }
    }
  ];

  beforeEach(() => {
    mockLocalStorage.getItem.mockReturnValue('mock-token');
    
    // Mock successful API responses
    fetch.mockImplementation((url) => {
      if (url.includes('/api/drives/all')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockDrives)
        });
      }
      if (url.includes('/api/schools/all')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSchools)
        });
      }
      if (url.includes('/api/allocations/all')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockAllocations)
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

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Allocation Form Validation', () => {
    test('should prevent allocation exceeding total available books', async () => {
      render(<AdminDashboard />);
      
      // Wait for data to load and switch to allocations tab
      await waitFor(() => {
        expect(screen.getByText('Book Allocations')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Book Allocations'));
      
      // Select drive
      const driveSelect = screen.getByDisplayValue('Select Donation Drive');
      fireEvent.change(driveSelect, { target: { value: 'drive1' } });
      
      // Select school
      const schoolSelect = screen.getByDisplayValue('Select School');
      fireEvent.change(schoolSelect, { target: { value: 'school1' } });
      
      // Try to allocate more books than available (remaining = 100 - 20 = 80)
      const ageInput2_4 = screen.getByLabelText('Age 2-4 years');
      const ageInput4_6 = screen.getByLabelText('Age 4-6 years');
      const ageInput6_8 = screen.getByLabelText('Age 6-8 years');
      const ageInput8_10 = screen.getByLabelText('Age 8-10 years');
      
      fireEvent.change(ageInput2_4, { target: { value: '30' } });
      fireEvent.change(ageInput4_6, { target: { value: '30' } });
      fireEvent.change(ageInput6_8, { target: { value: '30' } });
      fireEvent.change(ageInput8_10, { target: { value: '30' } }); // Total = 120, exceeds 80 available
      
      // Mock failed allocation response
      fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({
            message: 'Cannot allocate 120 books. Only 80 books available from this drive.'
          })
        })
      );
      
      const submitButton = screen.getByText('Allocate Books');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Cannot allocate 120 books/)).toBeInTheDocument();
      });
    });

    test('should prevent allocation exceeding category-specific availability', async () => {
      render(<AdminDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Book Allocations')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Book Allocations'));
      
      // Select drive and school
      const driveSelect = screen.getByDisplayValue('Select Donation Drive');
      fireEvent.change(driveSelect, { target: { value: 'drive1' } });
      
      const schoolSelect = screen.getByDisplayValue('Select School');
      fireEvent.change(schoolSelect, { target: { value: 'school1' } });
      
      // Try to allocate more books in 2-4 category than available
      // Available in 2-4: 25 received - 5 allocated = 20 available
      const ageInput2_4 = screen.getByLabelText('Age 2-4 years');
      fireEvent.change(ageInput2_4, { target: { value: '25' } }); // Exceeds 20 available
      
      // Mock failed allocation response
      fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({
            message: 'Cannot allocate 25 books for age 2-4. Only 20 books available in this category.'
          })
        })
      );
      
      const submitButton = screen.getByText('Allocate Books');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Cannot allocate 25 books for age 2-4/)).toBeInTheDocument();
      });
    });

    test('should show available books for each category correctly', async () => {
      render(<AdminDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Book Allocations')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Book Allocations'));
      
      // Select drive
      const driveSelect = screen.getByDisplayValue('Select Donation Drive');
      fireEvent.change(driveSelect, { target: { value: 'drive1' } });
      
      await waitFor(() => {
        // Check if drive details are shown
        expect(screen.getByText('Selected Drive Details')).toBeInTheDocument();
        expect(screen.getByText('Test Drive 1')).toBeInTheDocument();
        
        // Check category availability calculations
        // Age 2-4: 25 received - 5 allocated = 20 available
        // Age 4-6: 30 received - 10 allocated = 20 available
        // Age 6-8: 25 received - 5 allocated = 20 available
        // Age 8-10: 20 received - 0 allocated = 20 available
        expect(screen.getByText('Available: 20', { exact: false })).toBeInTheDocument();
      });
    });

    test('should calculate total books to allocate correctly', async () => {
      render(<AdminDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Book Allocations')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Book Allocations'));
      
      // Select drive and school
      const driveSelect = screen.getByDisplayValue('Select Donation Drive');
      fireEvent.change(driveSelect, { target: { value: 'drive1' } });
      
      const schoolSelect = screen.getByDisplayValue('Select School');
      fireEvent.change(schoolSelect, { target: { value: 'school1' } });
      
      // Enter allocation numbers
      const ageInput2_4 = screen.getByLabelText('Age 2-4 years');
      const ageInput4_6 = screen.getByLabelText('Age 4-6 years');
      const ageInput6_8 = screen.getByLabelText('Age 6-8 years');
      const ageInput8_10 = screen.getByLabelText('Age 8-10 years');
      
      fireEvent.change(ageInput2_4, { target: { value: '10' } });
      fireEvent.change(ageInput4_6, { target: { value: '15' } });
      fireEvent.change(ageInput6_8, { target: { value: '5' } });
      fireEvent.change(ageInput8_10, { target: { value: '8' } });
      
      await waitFor(() => {
        expect(screen.getByText('Total Books to Allocate: 38')).toBeInTheDocument();
      });
    });

    test('should handle successful allocation', async () => {
      render(<AdminDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Book Allocations')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Book Allocations'));
      
      // Select drive and school
      const driveSelect = screen.getByDisplayValue('Select Donation Drive');
      fireEvent.change(driveSelect, { target: { value: 'drive1' } });
      
      const schoolSelect = screen.getByDisplayValue('Select School');
      fireEvent.change(schoolSelect, { target: { value: 'school1' } });
      
      // Enter valid allocation numbers
      const ageInput2_4 = screen.getByLabelText('Age 2-4 years');
      fireEvent.change(ageInput2_4, { target: { value: '10' } });
      
      // Mock successful allocation response
      fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            message: 'Books allocated successfully',
            allocation: { _id: 'new-allocation' }
          })
        })
      );
      
      const submitButton = screen.getByText('Allocate Books');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Books allocated successfully!')).toBeInTheDocument();
      });
    });

    test('should handle edge case with zero available books in category', async () => {
      // Create a drive with zero books in one category
      const driveWithZeroCategory = {
        ...mockDrives[0],
        booksReceived: {
          '2-4': 5, // 5 received - 5 allocated = 0 available
          '4-6': 30,
          '6-8': 25,
          '8-10': 20
        }
      };
      
      fetch.mockImplementation((url) => {
        if (url.includes('/api/drives/all')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([driveWithZeroCategory])
          });
        }
        // ... other mock responses
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(url.includes('schools') ? mockSchools : [])
        });
      });
      
      render(<AdminDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Book Allocations')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Book Allocations'));
      
      const driveSelect = screen.getByDisplayValue('Select Donation Drive');
      fireEvent.change(driveSelect, { target: { value: 'drive1' } });
      
      await waitFor(() => {
        // Should show 0 available for age 2-4 category
        expect(screen.getByText('Available: 0', { exact: false })).toBeInTheDocument();
      });
    });
  });

  describe('Client-side Validation Logic', () => {
    test('should validate total allocation before API call', async () => {
      render(<AdminDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Book Allocations')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Book Allocations'));
      
      const driveSelect = screen.getByDisplayValue('Select Donation Drive');
      fireEvent.change(driveSelect, { target: { value: 'drive1' } });
      
      const schoolSelect = screen.getByDisplayValue('Select School');
      fireEvent.change(schoolSelect, { target: { value: 'school1' } });
      
      // Enter values that exceed total available (80 remaining)
      const ageInput2_4 = screen.getByLabelText('Age 2-4 years');
      const ageInput4_6 = screen.getByLabelText('Age 4-6 years');
      
      fireEvent.change(ageInput2_4, { target: { value: '50' } });
      fireEvent.change(ageInput4_6, { target: { value: '50' } }); // Total = 100, exceeds 80 available
      
      const submitButton = screen.getByText('Allocate Books');
      fireEvent.click(submitButton);
      
      // Should show client-side validation error without making API call
      await waitFor(() => {
        expect(screen.getByText(/Cannot allocate 100 books. Only 80 books available/)).toBeInTheDocument();
      });
      
      // Verify no API call was made for allocation
      expect(fetch).not.toHaveBeenCalledWith(
        '/api/allocations/allocate',
        expect.any(Object)
      );
    });

    test('should validate category-specific allocation before API call', async () => {
      render(<AdminDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Book Allocations')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Book Allocations'));
      
      const driveSelect = screen.getByDisplayValue('Select Donation Drive');
      fireEvent.change(driveSelect, { target: { value: 'drive1' } });
      
      const schoolSelect = screen.getByDisplayValue('Select School');
      fireEvent.change(schoolSelect, { target: { value: 'school1' } });
      
      // Enter value that exceeds category availability
      const ageInput2_4 = screen.getByLabelText('Age 2-4 years');
      fireEvent.change(ageInput2_4, { target: { value: '25' } }); // Exceeds 20 available in 2-4 category
      
      const submitButton = screen.getByText('Allocate Books');
      fireEvent.click(submitButton);
      
      // Should show client-side validation error
      await waitFor(() => {
        expect(screen.getByText(/Cannot allocate 25 books for age 2-4. Only 20 books available/)).toBeInTheDocument();
      });
    });
  });
});

// Utility functions for testing allocation logic
export const allocationTestUtils = {
  calculateAvailableBooks: (drive, allocations) => {
    const allocatedFromDrive = allocations
      .filter(allocation => allocation.donationDrive._id === drive._id)
      .reduce((sum, allocation) => sum + allocation.totalBooksAllocated, 0);
    return Math.max(0, drive.totalBooksReceived - allocatedFromDrive);
  },

  calculateAvailableByCategory: (drive, allocations, category) => {
    const allocatedInCategory = allocations
      .filter(allocation => allocation.donationDrive._id === drive._id)
      .reduce((sum, allocation) => sum + (allocation.booksAllocated[category] || 0), 0);
    return Math.max(0, (drive.booksReceived?.[category] || 0) - allocatedInCategory);
  },

  validateAllocation: (drive, allocations, requestedAllocation) => {
    const totalRequested = Object.values(requestedAllocation).reduce((sum, count) => sum + count, 0);
    const totalAvailable = allocationTestUtils.calculateAvailableBooks(drive, allocations);
    
    if (totalRequested > totalAvailable) {
      return {
        valid: false,
        error: `Cannot allocate ${totalRequested} books. Only ${totalAvailable} books available from this drive.`
      };
    }

    // Check each category
    for (const [category, requestedCount] of Object.entries(requestedAllocation)) {
      const availableInCategory = allocationTestUtils.calculateAvailableByCategory(drive, allocations, category);
      if (requestedCount > availableInCategory) {
        return {
          valid: false,
          error: `Cannot allocate ${requestedCount} books for age ${category}. Only ${availableInCategory} books available in this category.`
        };
      }
    }

    return { valid: true };
  }
};

// Test the utility functions themselves
describe('Allocation Utility Functions', () => {
  const testDrive = {
    _id: 'drive1',
    totalBooksReceived: 100,
    booksReceived: { '2-4': 25, '4-6': 30, '6-8': 25, '8-10': 20 }
  };

  const testAllocations = [
    {
      donationDrive: { _id: 'drive1' },
      totalBooksAllocated: 40,
      booksAllocated: { '2-4': 10, '4-6': 15, '6-8': 10, '8-10': 5 }
    }
  ];

  test('calculateAvailableBooks should return correct total', () => {
    const available = allocationTestUtils.calculateAvailableBooks(testDrive, testAllocations);
    expect(available).toBe(60); // 100 - 40
  });

  test('calculateAvailableByCategory should return correct amounts', () => {
    expect(allocationTestUtils.calculateAvailableByCategory(testDrive, testAllocations, '2-4')).toBe(15); // 25 - 10
    expect(allocationTestUtils.calculateAvailableByCategory(testDrive, testAllocations, '4-6')).toBe(15); // 30 - 15
    expect(allocationTestUtils.calculateAvailableByCategory(testDrive, testAllocations, '6-8')).toBe(15); // 25 - 10
    expect(allocationTestUtils.calculateAvailableByCategory(testDrive, testAllocations, '8-10')).toBe(15); // 20 - 5
  });

  test('validateAllocation should accept valid allocations', () => {
    const validAllocation = { '2-4': 10, '4-6': 10, '6-8': 10, '8-10': 10 };
    const result = allocationTestUtils.validateAllocation(testDrive, testAllocations, validAllocation);
    expect(result.valid).toBe(true);
  });

  test('validateAllocation should reject allocations exceeding total', () => {
    const invalidAllocation = { '2-4': 20, '4-6': 20, '6-8': 20, '8-10': 20 }; // Total = 80, exceeds 60 available
    const result = allocationTestUtils.validateAllocation(testDrive, testAllocations, invalidAllocation);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Cannot allocate 80 books. Only 60 books available');
  });

  test('validateAllocation should reject allocations exceeding category limits', () => {
    const invalidAllocation = { '2-4': 20, '4-6': 0, '6-8': 0, '8-10': 0 }; // Exceeds 15 available in 2-4
    const result = allocationTestUtils.validateAllocation(testDrive, testAllocations, invalidAllocation);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Cannot allocate 20 books for age 2-4. Only 15 books available');
  });
});
