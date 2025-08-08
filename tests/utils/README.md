# Enhanced Test Utilities Documentation

This directory contains comprehensive test utilities designed to improve test reliability, prevent common issues like parameter order problems, and provide standardized test data creation.

## Overview

The enhanced test utilities address the following requirements:
- **Standardized test data factories** for consistent mock data
- **Proper test cleanup utilities** to prevent test interference
- **Type-safe test helpers** to prevent parameter order issues
- **Comprehensive database integration testing** support

## Core Components

### 1. Test Data Factory (`test-data-factory.ts`)

Provides standardized mock data creation with consistent interfaces and relationships.

#### Basic Usage

```typescript
import { TestDataFactory } from './test-data-factory';

// Create individual mock entities
const user = TestDataFactory.createMockUser();
const project = TestDataFactory.createMockProject({ user_id: user.id });
const idea = TestDataFactory.createMockIdea({ user_id: user.id });

// Create complete test scenarios
const scenario = TestDataFactory.createTestScenario();
// Returns: { role, contact, user, project, idea, resource, comment }

// Create multiple related users
const users = TestDataFactory.createMultipleUsers(5);

// Reset counters for test isolation
TestDataFactory.resetCounters();
```

#### Type-Safe Builders

```typescript
import { TypeSafeTestDataBuilder } from './test-data-factory';

// Fluent API for building test data
const user = TypeSafeTestDataBuilder.user()
  .withNickname('testuser')
  .withExternalId('test-123')
  .withRelations()
  .build();

const project = TypeSafeTestDataBuilder.project()
  .withTitle('Test Project')
  .withUserId(user.id)
  .withStatus('active')
  .build();
```

### 2. Enhanced Test Utilities (`enhanced-test-utilities.ts`)

Provides comprehensive test setup and management utilities.

#### Test Suite Setup

```typescript
import { TestSuiteSetup } from './enhanced-test-utilities';

// Setup integration test environment
const setup = TestSuiteSetup.setupIntegrationTest({
  enableConstraints: true,
  enableTransactions: true,
  enableCleanup: false
});

const { mockPrisma, testData, cleanup } = setup;

// Setup unit test environment
const unitSetup = TestSuiteSetup.setupUnitTest({
  enableCleanup: false,
  mockServices: ['ideaService', 'projectService'],
  resetCounters: true
});

const { serviceMocks } = unitSetup;
```

#### Test Scenario Builder

```typescript
import { TestScenarioBuilder } from './enhanced-test-utilities';

// Build complex scenarios with related data
const scenario = new TestScenarioBuilder()
  .withUser({ nickname: 'testuser' })
  .withProject({ title: 'Test Project' })
  .withIdea({ title: 'Test Idea' })
  .withComment({ content: 'Test comment' })
  .build();

// Build and setup in mock database
const scenarioWithDb = new TestScenarioBuilder()
  .withUser()
  .withProject()
  .buildAndSetup(mockPrisma);
```

### 3. Type-Safe Service Helpers (`test-helpers.ts`)

Prevents parameter order issues by providing strongly typed wrappers for service methods.

#### Idea Service Helpers

```typescript
import { TypeSafeServiceHelpers } from './test-helpers';

// Correct parameter order: (data, userId)
const result = await TypeSafeServiceHelpers.ideaService.createIdea(
  mockIdeaService,
  ideaData,
  userId
);

// Correct parameter order: (ideaId, data, userId)
const updated = await TypeSafeServiceHelpers.ideaService.updateIdea(
  mockIdeaService,
  ideaId,
  updateData,
  userId
);
```

#### Project Service Helpers

```typescript
// Correct parameter order: (userId, data)
const result = await TypeSafeServiceHelpers.projectService.createProject(
  mockProjectService,
  userId,
  projectData
);

// Correct parameter order: (projectId, userId, data)
const updated = await TypeSafeServiceHelpers.projectService.updateProject(
  mockProjectService,
  projectId,
  userId,
  updateData
);
```

#### Parameter Validation

```typescript
// Validate parameters before calling service methods
TypeSafeServiceHelpers.validateServiceCall.ideaService.createIdea(data, userId);
TypeSafeServiceHelpers.validateServiceCall.projectService.createProject(userId, data);
```

### 4. Test Cleanup Utilities (`test-cleanup.ts`)

Provides comprehensive cleanup functionality to prevent test interference.

#### Basic Cleanup

```typescript
import { TestCleanupUtils } from './test-helpers';

// Register cleanup tasks
TestCleanupUtils.registerCleanup(async () => {
  // Your cleanup code here
});

// Execute all cleanup tasks
await TestCleanupUtils.executeCleanup();

// Create database cleanup
const dbCleanup = TestCleanupUtils.createDatabaseCleanup(mockPrisma);
TestCleanupUtils.registerCleanup(dbCleanup);
```

#### Comprehensive Cleanup

```typescript
import ComprehensiveTestCleanup from './test-cleanup';

// Setup all cleanup utilities for a test suite
ComprehensiveTestCleanup.setupTestSuite({
  mockPrisma,
  services: [mockIdeaService, mockProjectService],
  environment: { NODE_ENV: 'test' },
  enableMemoryCleanup: true
});
```

### 5. Test Assertions (`enhanced-test-utilities.ts`)

Enhanced assertion helpers for common test patterns.

#### Service Method Assertions

```typescript
import { TestAssertions } from './enhanced-test-utilities';

// Assert service method was called with correct parameters
TestAssertions.assertServiceMethodCall(
  'ideaService',
  'createIdea',
  mockIdeaService,
  expectedData,
  expectedUserId
);

// Assert API response structure
TestAssertions.assertApiResponse(
  response,
  200,
  ['success', 'data', 'message'],
  { success: true }
);

// Assert database operations
TestAssertions.assertDatabaseOperation(
  mockPrisma,
  'users',
  'create',
  1,
  [expectedCreateArgs]
);
```

## Usage Patterns

### 1. Unit Test Setup

```typescript
describe('Service Unit Tests', () => {
  let mockPrisma: any;
  let mockService: any;
  let testData: any;

  beforeEach(() => {
    // Reset counters for test isolation
    TestDataFactory.resetCounters();

    // Setup test environment
    const setup = TestSuiteSetup.setupIntegrationTest({
      enableConstraints: true,
      enableCleanup: false
    });

    mockPrisma = setup.mockPrisma;
    testData = setup.testData;

    // Create service mock
    mockService = TestSuiteSetup['createServiceMock']('ideaService');
  });

  afterEach(async () => {
    await TestCleanupUtils.executeCleanup();
  });

  it('should create idea with correct parameters', async () => {
    // Arrange
    const ideaData = { content: 'Test idea' };
    const userId = testData.user.id;

    mockService.createIdea.mockResolvedValue({ idea: testData.idea });

    // Act
    const result = await TypeSafeServiceHelpers.ideaService.createIdea(
      mockService,
      ideaData,
      userId
    );

    // Assert
    TestAssertions.assertServiceMethodCall(
      'ideaService',
      'createIdea',
      mockService,
      ideaData,
      userId
    );

    expect(result.idea).toEqual(testData.idea);
  });
});
```

### 2. Integration Test Setup

```typescript
describe('Database Integration Tests', () => {
  let mockPrisma: any;
  let testScenario: any;

  beforeEach(() => {
    const setup = TestSuiteSetup.setupIntegrationTest({
      enableConstraints: true,
      enableTransactions: true,
      enableCleanup: false
    });

    mockPrisma = setup.mockPrisma;
    testScenario = setup.testData;
  });

  afterEach(async () => {
    await TestCleanupUtils.executeCleanup();
  });

  it('should handle database constraints', async () => {
    // Test constraint violations
    await expect(mockPrisma.users.create({
      data: { external_id: null }
    })).rejects.toThrow('NOT NULL constraint violation');
  });
});
```

### 3. Complex Scenario Testing

```typescript
describe('Complex Workflow Tests', () => {
  it('should handle complete user workflow', async () => {
    // Build complex test scenario
    const scenario = new TestScenarioBuilder()
      .withUser({ nickname: 'workflowuser' })
      .withProject({ title: 'Workflow Project' })
      .withIdea({ title: 'Workflow Idea' })
      .withComment({ content: 'Workflow comment' })
      .build();

    // Verify relationships
    expect(scenario.project.user_id).toBe(scenario.user.id);
    expect(scenario.idea.user_id).toBe(scenario.user.id);
    expect(scenario.comment.user_id).toBe(scenario.user.id);

    // Test workflow logic here...
  });
});
```

## Best Practices

### 1. Test Isolation

- Always reset test data factory counters in `beforeEach`
- Use proper cleanup in `afterEach`
- Don't rely on test execution order

### 2. Parameter Order Safety

- Always use `TypeSafeServiceHelpers` for service method calls
- Validate parameters when in doubt
- Use type-safe builders for complex data creation

### 3. Database Testing

- Enable constraints for realistic testing
- Use transactions for complex operations
- Test both success and failure scenarios

### 4. Cleanup Management

- Register cleanup tasks for resources that need cleanup
- Handle cleanup errors gracefully
- Use comprehensive cleanup for complex test suites

### 5. Assertion Patterns

- Use enhanced assertion helpers for common patterns
- Validate both structure and content
- Test error conditions explicitly

## Common Issues and Solutions

### Issue: Parameter Order Confusion

**Problem**: Service methods called with wrong parameter order
**Solution**: Use `TypeSafeServiceHelpers` wrappers

```typescript
// Wrong (prone to errors)
await mockService.createIdea(userId, ideaData);

// Right (type-safe)
await TypeSafeServiceHelpers.ideaService.createIdea(mockService, ideaData, userId);
```

### Issue: Test Data Inconsistency

**Problem**: Different tests create incompatible mock data
**Solution**: Use `TestDataFactory` for standardized data

```typescript
// Wrong (inconsistent)
const user = { id: 1, name: 'test' };

// Right (standardized)
const user = TestDataFactory.createMockUser();
```

### Issue: Test Interference

**Problem**: Tests affect each other due to shared state
**Solution**: Proper cleanup and counter resets

```typescript
beforeEach(() => {
  TestDataFactory.resetCounters();
});

afterEach(async () => {
  await TestCleanupUtils.executeCleanup();
});
```

### Issue: Complex Test Setup

**Problem**: Repetitive test setup code
**Solution**: Use `TestScenarioBuilder` for complex scenarios

```typescript
// Wrong (repetitive)
const role = TestDataFactory.createMockRole();
const contact = TestDataFactory.createMockContact();
const user = TestDataFactory.createMockUser({ role_id: role.id, contact_id: contact.id });
const project = TestDataFactory.createMockProject({ user_id: user.id });

// Right (declarative)
const scenario = new TestScenarioBuilder()
  .withUser()
  .withProject()
  .build();
```

## Migration Guide

To migrate existing tests to use these utilities:

1. **Replace manual mock creation** with `TestDataFactory`
2. **Add proper cleanup** using `TestCleanupUtils`
3. **Use type-safe service helpers** for service method calls
4. **Standardize test setup** with `TestSuiteSetup`
5. **Use enhanced assertions** for common patterns

## Performance Considerations

- Test data factory uses incremental counters for performance
- Cleanup utilities are optimized to handle errors gracefully
- Database mocks are designed to simulate real constraints efficiently
- Scenario builders use lazy evaluation where possible

## Contributing

When adding new utilities:

1. Follow the existing patterns and naming conventions
2. Add comprehensive JSDoc documentation
3. Include usage examples in tests
4. Ensure type safety throughout
5. Add proper error handling and validation