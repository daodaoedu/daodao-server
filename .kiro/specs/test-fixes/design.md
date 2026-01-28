# Test Fixes Design Document

## Overview

This design document outlines the comprehensive approach to fixing all failing tests in the daodao-server project. The solution involves systematic fixes across multiple categories: Prisma mock improvements, parameter order corrections, validator fixes, database integration improvements, and mock completeness enhancements.

## Architecture

### Test Structure Analysis
The project uses Jest with TypeScript, organized into:
- Unit tests (`src/tests/unit/`)
- Integration tests (`src/tests/integration/`)
- Test utilities (`src/tests/utils/`)

### Mock Architecture
- Centralized Prisma mock in `src/tests/utils/prisma-mock.ts`
- Service mocks created per test file
- Database connection mocks for integration tests

## Components and Interfaces

### 1. Enhanced Prisma Mock System

**Current Issue:** Incomplete mock setup causing "Cannot read properties of undefined" errors

**Solution Design:**
```typescript
// Enhanced createModelMock with all required methods
const createModelMock = () => ({
  // Basic CRUD operations
  findUnique: jest.fn(),
  findFirst: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
  createMany: jest.fn(),
  update: jest.fn(),
  updateMany: jest.fn(),
  upsert: jest.fn(),
  delete: jest.fn(),
  deleteMany: jest.fn(),
  count: jest.fn(),
  aggregate: jest.fn(),
  groupBy: jest.fn(),
  
  // Additional methods that might be missing
  $queryRaw: jest.fn(),
  $executeRaw: jest.fn()
});
```

### 2. Service Parameter Order Corrections

**Current Issue:** Tests calling service methods with incorrect parameter order

**Solution Design:**
- Audit all service method signatures
- Update test calls to match actual implementations
- Create type-safe test helpers to prevent future mismatches

**Key Methods to Fix:**
- `createIdea(data, userId)` - currently called as `createIdea(userId, data)`
- `updateIdea(id, data, userId)` - currently called as `updateIdea(id, userId, data)`

### 3. Validator Type Coercion Fixes

**Current Issue:** Validators not properly handling string-to-number coercion

**Solution Design:**
```typescript
// Update validator schemas to use proper coercion
const idSchema = z.string().transform((val) => {
  const num = parseInt(val, 10);
  if (isNaN(num)) throw new Error('Invalid ID format');
  return num;
});
```

### 4. Database Integration Test Improvements

**Current Issue:** Integration tests failing due to improper database setup and cleanup

**Solution Design:**
- Implement proper test database setup/teardown
- Fix transaction handling in tests
- Ensure proper data cleanup between tests
- Handle connection pooling issues

### 5. Mock Implementation Completeness

**Current Issue:** Incomplete mocks causing tests to fail or call real services

**Solution Design:**
- Audit all service dependencies
- Ensure all external calls are mocked
- Provide realistic mock return values
- Implement proper mock reset between tests

## Data Models

### Test Data Factories
Create standardized test data factories for consistent mock data:

```typescript
export const createMockUser = (overrides = {}) => ({
  id: 1,
  external_id: 'user-uuid-1',
  nickname: 'testuser',
  mongo_id: 'mongo-id-1',
  contact_id: 1,
  role_id: 1,
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides
});
```

## Error Handling

### Test Error Categories
1. **Mock Setup Errors**: Handle undefined mock methods
2. **Parameter Mismatch Errors**: Provide clear error messages for wrong parameter order
3. **Type Coercion Errors**: Handle string/number conversion issues
4. **Database Connection Errors**: Graceful handling of connection issues

### Error Recovery Strategies
- Implement proper test cleanup in `afterEach` hooks
- Use try-catch blocks for database operations
- Provide fallback mock implementations

## Testing Strategy

### Fix Implementation Phases

**Phase 1: Critical Mock Fixes**
- Fix Prisma mock setup issues
- Ensure all required methods are available
- Fix immediate "Cannot read properties" errors

**Phase 2: Parameter Order Corrections**
- Audit and fix all service method calls
- Update test expectations to match actual behavior
- Implement type-safe test helpers

**Phase 3: Validator Improvements**
- Fix type coercion issues
- Update validation schemas
- Ensure proper error message handling

**Phase 4: Integration Test Stabilization**
- Fix database connection issues
- Implement proper transaction handling
- Ensure test isolation and cleanup

**Phase 5: Mock Completeness**
- Audit all service dependencies
- Implement missing mocks
- Ensure no external service calls in tests

### Test Execution Strategy
- Run tests in isolation to identify specific issues
- Use `--verbose` flag for detailed error reporting
- Implement proper test timeouts and cleanup
- Use database transactions for test isolation

### Validation Approach
- Run full test suite after each phase
- Verify no regressions introduced
- Ensure test coverage remains high
- Validate performance improvements