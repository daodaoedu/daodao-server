# Design Document

## Overview

This design outlines the migration strategy for removing all remaining Sequelize dependencies from the codebase and replacing them with Prisma-compatible implementations. The migration focuses on maintaining existing functionality while adopting Prisma's plain object approach and error handling patterns.

The system already has a well-established Prisma infrastructure with `PrismaService` and proper client management. The migration will leverage this existing foundation to replace Sequelize-specific patterns.

## Architecture

### Current State Analysis

The codebase has already migrated most database operations to Prisma, but several areas still contain Sequelize-specific code:

1. **Transform Utilities**: Uses Sequelize Model.get() method
2. **Authentication Middleware**: Relies on `dataValues` property for user type detection
3. **Error Handling**: Processes Sequelize-specific error types
4. **OAuth Service**: Uses `dataValues` for user serialization
5. **Type Definitions**: References Sequelize models in comments

### Target Architecture

The migration will result in a fully Prisma-based system with:

- **Unified Data Access**: All database operations use Prisma client
- **Plain Object Handling**: No dependency on ORM-specific model methods
- **Prisma Error Handling**: Consistent error processing using Prisma error types
- **Type Safety**: Full TypeScript integration with Prisma-generated types

## Components and Interfaces

### 1. Transform Utilities Refactoring

**Current Implementation:**
```typescript
import { Model } from 'sequelize';
type DatabaseRecord = Model | Record<string, unknown>;

function getFieldValue(record: DatabaseRecord, fieldName: string): unknown {
  if (record && typeof record === 'object' && 'get' in record && typeof record.get === 'function') {
    // Sequelize Model
    return record.get(fieldName);
  }
  // Prisma plain object
  return record[fieldName];
}
```

**Target Implementation:**
```typescript
type DatabaseRecord = Record<string, unknown>;

function getFieldValue(record: DatabaseRecord, fieldName: string): unknown {
  return record?.[fieldName];
}
```

### 2. Authentication Middleware Redesign

**Current Pattern:**
```typescript
const user = req.user as { dataValues?: unknown };
authReq.isTemporary = !user.dataValues;
```

**Target Pattern:**
```typescript
// Use a more explicit property or method to determine user type
const user = req.user as AuthUser | TempUser;
authReq.isTemporary = !('email' in user) || user.email === null;
```

### 3. Error Handling Migration

**Current Sequelize Error Types:**
- `SequelizeValidationError`
- `SequelizeUniqueConstraintError`
- `SequelizeForeignKeyConstraintError`

**Target Prisma Error Types:**
- `PrismaClientValidationError`
- `PrismaClientKnownRequestError` (with error codes)
- `PrismaClientUnknownRequestError`

### 4. OAuth Service Refactoring

**Current Implementation:**
```typescript
const userType = user.dataValues ? 'user' : 'temp';
```

**Target Implementation:**
```typescript
const userType = isTemporaryUser(user) ? 'temp' : 'user';
```

## Data Models

### User Type Detection Strategy

Since Prisma returns plain objects, we need alternative methods to distinguish user types:

1. **Property-based Detection**: Check for specific properties that exist only in formal users
2. **Type Guards**: Implement TypeScript type guards for user type detection
3. **Explicit Flags**: Add explicit type indicators where needed

### Error Mapping Strategy

Create a mapping system for Prisma errors:

```typescript
interface ErrorMapping {
  prismaErrorCode: string;
  httpStatusCode: number;
  errorType: string;
  message: string;
}
```

## Error Handling

### Prisma Error Processing

Implement comprehensive error handling for Prisma-specific errors:

1. **Validation Errors**: Handle `PrismaClientValidationError`
2. **Database Constraint Errors**: Process `PrismaClientKnownRequestError` with specific error codes
3. **Connection Errors**: Handle `PrismaClientInitializationError`
4. **Runtime Errors**: Process `PrismaClientRustPanicError`

### Error Code Mapping

Map Prisma error codes to application-specific error types:

- `P2002`: Unique constraint violation → `DUPLICATE_RESOURCE`
- `P2003`: Foreign key constraint violation → `INVALID_REFERENCE`
- `P2025`: Record not found → `RESOURCE_NOT_FOUND`

## Testing Strategy

### Unit Test Updates

1. **Mock Object Restructuring**: Remove `dataValues` from all mock objects
2. **Error Simulation**: Update error simulation to use Prisma error types
3. **Type Assertion Updates**: Modify type assertions to work with plain objects

### Integration Test Considerations

1. **Database Interaction**: Ensure all database interactions work with Prisma
2. **Error Handling**: Verify error handling works with new Prisma error types
3. **Authentication Flow**: Test authentication flows without Sequelize dependencies

### Test Data Management

1. **Fixture Updates**: Update test fixtures to use plain objects
2. **Factory Functions**: Modify factory functions to generate Prisma-compatible objects
3. **Assertion Updates**: Update assertions to work with new data structures

## Implementation Phases

### Phase 1: Core Utilities Migration
- Update `transform-utils.ts` to remove Sequelize dependencies
- Implement plain object handling

### Phase 2: Authentication System Migration
- Refactor authentication middleware
- Update OAuth service
- Implement new user type detection logic

### Phase 3: Error Handling Migration
- Replace Sequelize error handling with Prisma error handling
- Implement error code mapping
- Update error categorization

### Phase 4: Test Suite Migration
- Update all test files to remove Sequelize patterns
- Implement new mock strategies
- Verify all tests pass with new implementation

### Phase 5: Type Definition Updates
- Update TypeScript definitions
- Remove Sequelize references from comments
- Ensure type safety throughout

## Migration Considerations

### Backward Compatibility

The migration maintains API compatibility by:
- Preserving existing function signatures
- Maintaining the same return value structures
- Keeping error response formats consistent

### Performance Impact

The migration should have minimal performance impact:
- Prisma plain objects are lighter than Sequelize models
- Reduced overhead from ORM abstraction layers
- More efficient error handling

### Risk Mitigation

1. **Incremental Migration**: Migrate components one at a time
2. **Comprehensive Testing**: Ensure all functionality works after each change
3. **Rollback Strategy**: Maintain ability to revert changes if issues arise
4. **Monitoring**: Monitor application behavior during and after migration