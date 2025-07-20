# PustakDhaan Book Allocation Tests

This directory contains comprehensive unit and integration tests for the book allocation system in PustakDhaan.

## Test Structure

### Backend Tests (`server/tests/`)

1. **allocation.test.js** - Main API endpoint tests
   - Authentication and authorization
   - Input validation
   - Successful allocation scenarios
   - Error handling

2. **allocation.integration.test.js** - End-to-end integration tests
   - Complete workflow from donation to allocation
   - Multiple allocations to same drive
   - Data consistency across operations

3. **allocation.edge-cases.test.js** - Edge cases and validation
   - Negative values
   - Non-numeric inputs
   - Missing categories
   - Concurrent allocations
   - Data consistency checks

4. **allocation.model.test.js** - Model validation tests
   - Schema validation
   - Required fields
   - Virtual properties
   - Query operations

5. **allocation.business-logic.test.js** - Pure business logic tests
   - Book availability calculations
   - Validation logic
   - Drive total calculations
   - Data consistency functions

### Frontend Tests (`client/src/tests/`)

1. **AdminDashboard.allocation.test.js** - Original component tests
   - UI interaction tests
   - Form submission
   - Error handling

2. **AdminDashboard.validation.test.js** - Validation logic tests
   - Input validation functions
   - Available books calculation
   - Input sanitization

## Running Tests

### Backend Tests

```bash
# Navigate to server directory
cd server

# Install dependencies for main server
npm install

# Navigate to tests directory
cd tests

# Install test dependencies
npm install

# Run all tests
npm test

# Run specific test suites
npm run test:allocation        # Basic allocation tests
npm run test:integration      # Integration tests
npm run test:edge-cases       # Edge case tests
npm run test:model           # Model validation tests
npm run test:business-logic  # Business logic tests

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Frontend Tests

```bash
# Navigate to client directory
cd client

# Install dependencies (including test dependencies)
npm install

# Run all frontend tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Test Database Setup

The tests use a separate test database to avoid affecting development data.

### Environment Variables

Create a `.env` file in the `server` directory with:

```
NODE_ENV=test
JWT_SECRET=test_secret_key
MONGODB_TEST_URI=mongodb://localhost:27017/pustakdhaan_test
```

### MongoDB Setup

Ensure MongoDB is running locally on the default port (27017).

The tests will automatically:
- Connect to the test database
- Clean up data before and after tests
- Close connections when tests complete

## Test Coverage

The tests cover:

### Backend
- ✅ Authentication and authorization
- ✅ Input validation (all edge cases)
- ✅ Book availability checking
- ✅ Allocation creation and storage
- ✅ Drive total updates
- ✅ Data consistency
- ✅ Error handling
- ✅ Model validation
- ✅ Concurrent operations
- ✅ Business logic functions

### Frontend
- ✅ Component rendering
- ✅ Form interactions
- ✅ Validation logic
- ✅ Error display
- ✅ Available books calculation
- ✅ Input sanitization

## Key Test Scenarios

### Successful Allocations
- Valid allocation within available books
- Allocation with notes
- Allocation without notes
- Exact allocation (using all available books)

### Validation Failures
- Insufficient books in any category
- Negative book counts
- Non-numeric inputs
- Missing categories
- Zero total allocation
- Invalid ObjectIds

### Edge Cases
- Concurrent allocations
- Multiple allocations to same drive
- Very large note strings
- Exact availability usage
- Empty drives

### Data Consistency
- Drive totals match category sums
- Allocation totals match category sums
- Available books calculation accuracy
- Database state after operations

## Continuous Integration

These tests are designed to be run in CI/CD pipelines. They:
- Use isolated test databases
- Clean up after themselves
- Handle timeouts appropriately
- Provide detailed error reporting
- Generate coverage reports

## Contributing

When adding new features to the allocation system:

1. Add corresponding unit tests
2. Update integration tests if needed
3. Ensure all tests pass
4. Maintain test coverage above 90%
5. Update this README if adding new test files

## Troubleshooting

### Common Issues

1. **MongoDB Connection Errors**
   - Ensure MongoDB is running
   - Check connection string in environment variables
   - Verify database permissions

2. **Test Timeouts**
   - Tests have 30-second timeout for database operations
   - Check for hanging database connections
   - Ensure proper cleanup in test teardown

3. **Jest Configuration Issues**
   - Verify Jest is installed in test directory
   - Check package.json scripts
   - Ensure proper test file patterns

### Debug Mode

Run tests with additional logging:

```bash
# Backend
DEBUG=* npm test

# Frontend
npm test -- --verbose
```
