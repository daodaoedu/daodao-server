# Test Fixes Requirements Document

## Introduction

This document outlines the requirements for fixing all failing tests in the daodao-server project. The tests are currently failing due to various issues including mock setup problems, parameter order mismatches, type coercion issues, and database connection problems.

## Requirements

### Requirement 1: Fix Prisma Mock Setup Issues

**User Story:** As a developer, I want all Prisma mocks to be properly configured so that unit tests can run without database dependencies.

#### Acceptance Criteria

1. WHEN a test uses Prisma models THEN all required methods SHALL be properly mocked
2. WHEN a test accesses nested Prisma model methods THEN they SHALL be available and mockable
3. WHEN tests run THEN Prisma mocks SHALL not throw "Cannot read properties of undefined" errors

### Requirement 2: Fix Service Method Parameter Order

**User Story:** As a developer, I want service method calls in tests to match the actual service implementations so that tests accurately reflect real usage.

#### Acceptance Criteria

1. WHEN tests call createIdea THEN parameters SHALL be in order (data, userId)
2. WHEN tests call updateIdea THEN parameters SHALL be in order (id, data, userId)
3. WHEN tests call other service methods THEN parameter order SHALL match implementation

### Requirement 3: Fix Validator Type Coercion Issues

**User Story:** As a developer, I want validator tests to properly handle string-to-number coercion so that validation logic works correctly.

#### Acceptance Criteria

1. WHEN validators receive string numbers THEN they SHALL coerce to integers where expected
2. WHEN validators validate IDs THEN they SHALL accept both string and number formats
3. WHEN validation fails THEN error messages SHALL be accurate and helpful

### Requirement 4: Fix Database Integration Test Issues

**User Story:** As a developer, I want integration tests to properly handle database connections and transactions so that they can test real database scenarios.

#### Acceptance Criteria

1. WHEN integration tests run THEN database connections SHALL be properly managed
2. WHEN tests use transactions THEN they SHALL handle rollbacks correctly
3. WHEN tests create test data THEN they SHALL clean up properly after completion

### Requirement 5: Fix Mock Implementation Completeness

**User Story:** As a developer, I want all service dependencies to be properly mocked so that unit tests are isolated and reliable.

#### Acceptance Criteria

1. WHEN services have dependencies THEN all dependencies SHALL be mocked
2. WHEN mocks are used THEN they SHALL provide realistic return values
3. WHEN tests run THEN no real external services SHALL be called