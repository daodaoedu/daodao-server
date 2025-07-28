/**
 * Test Utilities Example
 * Demonstrates how to use the enhanced test utilities
 */

import {
  TestSuiteSetup,
  TestScenarioBuilder,
  TestAssertions,
  TypeSafeServiceHelpers,
  TestDataFactory,
  TestCleanupUtils
} from './enhanced-test-utilities';
import ComprehensiveTestCleanup from './test-cleanup';

describe('Enhanced Test Utilities Example', () => {
  let mockPrisma: any;
  let mockIdeaService: any;
  let mockProjectService: any;
  let testScenario: any;

  beforeEach(() => {
    // Reset test data factory counters
    TestDataFactory.resetCounters();

    // Setup integration test environment without automatic cleanup
    const setup = TestSuiteSetup.setupIntegrationTest({
      enableConstraints: true,
      enableTransactions: true,
      enableCleanup: false // Disable automatic cleanup to avoid hook issues
    });

    mockPrisma = setup.mockPrisma;
    testScenario = setup.testData;

    // Setup unit test environment for services without automatic cleanup
    const unitSetup = TestSuiteSetup.setupUnitTest({
      enableCleanup: false, // Disable automatic cleanup
      mockServices: ['ideaService', 'projectService'],
      resetCounters: false // Already reset above
    });

    mockIdeaService = unitSetup.serviceMocks.ideaService;
    mockProjectService = unitSetup.serviceMocks.projectService;
  });

  afterEach(async () => {
    // Manual cleanup
    await TestCleanupUtils.executeCleanup();
  });

  describe('Type-Safe Service Helpers', () => {
    it('should call idea service methods with correct parameter order', async () => {
      // Arrange
      const ideaData = {
        content: 'Test idea content',
        tags: ['test', 'example'],
        resources: []
      };
      const userId = 1;
      const expectedIdea = TestDataFactory.createMockIdea({ user_id: userId });

      mockIdeaService.createIdea.mockResolvedValue({ idea: expectedIdea });

      // Act - Using type-safe helper prevents parameter order issues
      const result = await TypeSafeServiceHelpers.ideaService.createIdea(
        mockIdeaService,
        ideaData,
        userId
      );

      // Assert - Using enhanced assertion helpers
      TestAssertions.assertServiceMethodCall(
        'ideaService',
        'createIdea',
        mockIdeaService,
        ideaData,
        userId
      );

      expect(result.idea).toEqual(expectedIdea);
    });

    it('should call project service methods with correct parameter order', async () => {
      // Arrange
      const projectData = {
        title: 'Test Project',
        description: 'Test project description',
        status: 'active'
      };
      const userId = 1;
      const expectedProject = TestDataFactory.createMockProject({ user_id: userId });

      mockProjectService.createProject.mockResolvedValue({
        success: true,
        data: expectedProject
      });

      // Act - Using type-safe helper
      const result = await TypeSafeServiceHelpers.projectService.createProject(
        mockProjectService,
        userId,
        projectData
      );

      // Assert
      TestAssertions.assertServiceMethodCall(
        'projectService',
        'createProject',
        mockProjectService,
        userId,
        projectData
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(expectedProject);
    });
  });

  describe('Test Scenario Builder', () => {
    it('should build complex test scenarios with related data', () => {
      // Arrange & Act
      const scenario = new TestScenarioBuilder()
        .withUser({ nickname: 'testuser' })
        .withProject({ title: 'Test Project' })
        .withIdea({ title: 'Test Idea' })
        .withComment({ content: 'Test comment' })
        .build();

      // Assert
      expect(scenario.user).toBeDefined();
      expect(scenario.project).toBeDefined();
      expect(scenario.idea).toBeDefined();
      expect(scenario.comment).toBeDefined();

      // Verify relationships
      expect(scenario.project.user_id).toBe(scenario.user.id);
      expect(scenario.idea.user_id).toBe(scenario.user.id);
      expect(scenario.comment.user_id).toBe(scenario.user.id);
      expect(scenario.comment.target_id).toBe(scenario.project.id);
    });

    it('should build and setup scenario in mock database', () => {
      // Arrange & Act
      const scenario = new TestScenarioBuilder()
        .withUser()
        .withProject()
        .buildAndSetup(mockPrisma);

      // Assert - Database should be setup with test data
      TestAssertions.assertDatabaseOperation(
        mockPrisma,
        'users',
        'findUnique',
        0 // Not called yet, but should be available
      );

      // Verify scenario structure
      expect(scenario.user).toBeDefined();
      expect(scenario.project).toBeDefined();
    });
  });

  describe('Database Integration Testing', () => {
    it('should handle database constraints properly', async () => {
      // Arrange
      const userData = {
        external_id: 'duplicate-id',
        nickname: 'testuser',
        contact_id: 1,
        role_id: 1
      };

      // First creation should succeed
      mockPrisma.users.create.mockResolvedValueOnce(
        TestDataFactory.createMockUser(userData)
      );

      // Second creation with same external_id should fail
      mockPrisma.users.create.mockRejectedValueOnce(
        new Error('Unique constraint violation: external_id must be unique')
      );

      // Act & Assert
      const firstUser = await mockPrisma.users.create({ data: userData });
      expect(firstUser).toBeDefined();

      await expect(mockPrisma.users.create({ data: userData }))
        .rejects
        .toThrow('Unique constraint violation: external_id must be unique');
    });

    it('should handle transaction rollbacks', async () => {
      // Arrange
      const transactionCallback = jest.fn().mockRejectedValue(new Error('Transaction failed'));

      // Act & Assert
      await expect(mockPrisma.$transaction(transactionCallback))
        .rejects
        .toThrow('Transaction failed');

      expect(transactionCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          users: expect.any(Object),
          projects: expect.any(Object)
        })
      );
    });
  });

  describe('Test Data Validation', () => {
    it('should validate test data structure', () => {
      // Arrange
      const validUser = TestDataFactory.createMockUser();
      const invalidUser = { id: 'invalid', nickname: 123 };

      // Act & Assert
      expect(() => {
        TestAssertions.assertTestDataValidity(
          validUser,
          (data) => typeof data.id === 'number' && typeof data.nickname === 'string',
          'User data must have numeric id and string nickname'
        );
      }).not.toThrow();

      expect(() => {
        TestAssertions.assertTestDataValidity(
          invalidUser,
          (data) => typeof data.id === 'number' && typeof data.nickname === 'string',
          'User data must have numeric id and string nickname'
        );
      }).toThrow('Test data validation failed: User data must have numeric id and string nickname');
    });
  });

  describe('API Response Testing', () => {
    it('should assert API response structure', () => {
      // Arrange
      const mockResponse = {
        status: 200,
        body: {
          success: true,
          data: { id: 1, title: 'Test' },
          message: 'Success'
        }
      };

      // Act & Assert
      TestAssertions.assertApiResponse(
        mockResponse,
        200,
        ['success', 'data', 'message'],
        { success: true, message: 'Success' }
      );
    });
  });

  describe('Cleanup Testing', () => {
    it('should register and execute cleanup tasks', async () => {
      // Arrange
      const cleanupTask = jest.fn();
      TestCleanupUtils.registerCleanup(cleanupTask);

      // Act
      await TestCleanupUtils.executeCleanup();

      // Assert
      expect(cleanupTask).toHaveBeenCalled();
    });

    it('should handle cleanup errors gracefully', async () => {
      // Arrange
      const failingCleanupTask = jest.fn().mockRejectedValue(new Error('Cleanup failed'));
      TestCleanupUtils.registerCleanup(failingCleanupTask);

      // Act & Assert
      await expect(TestCleanupUtils.executeCleanup()).rejects.toThrow('Cleanup failed');
      expect(failingCleanupTask).toHaveBeenCalled();
    });
  });

  describe('Parameter Order Validation', () => {
    it('should validate service method parameters', () => {
      // Arrange
      const validData = { content: 'test' };
      const validUserId = 1;
      const invalidUserId = 'invalid';

      // Act & Assert - Valid parameters should not throw
      expect(() => {
        TypeSafeServiceHelpers.validateServiceCall.ideaService.createIdea(validData, validUserId);
      }).not.toThrow();

      // Invalid parameters should throw
      expect(() => {
        TypeSafeServiceHelpers.validateServiceCall.ideaService.createIdea(validData, invalidUserId);
      }).toThrow('createIdea: userId must be a number (second parameter)');
    });
  });
});

/**
 * Example of how to use utilities in a real test file
 */
describe('Real-world Usage Example', () => {
  let testSetup: any;

  beforeEach(() => {
    // One-line setup for comprehensive testing environment
    testSetup = TestSuiteSetup.setupIntegrationTest({
      enableConstraints: true,
      enableTransactions: true,
      enableCleanup: false // Disable automatic cleanup
    });
  });

  afterEach(async () => {
    // Manual cleanup
    if (testSetup?.cleanup) {
      await testSetup.cleanup();
    }
  });

  it('should demonstrate complete test workflow', async () => {
    // 1. Create test scenario with related data
    const scenario = new TestScenarioBuilder()
      .withUser({ nickname: 'realuser' })
      .withProject({ title: 'Real Project' })
      .buildAndSetup(testSetup.mockPrisma);

    // 2. Setup service mocks with realistic responses
    const mockService = TestSuiteSetup['createServiceMock']('projectService');
    mockService.getProjectById.mockResolvedValue({
      success: true,
      data: scenario.project
    });

    // 3. Execute the operation being tested
    const result = await TypeSafeServiceHelpers.projectService.getProjectById(
      mockService,
      scenario.project.external_id || 'project-1',
      scenario.user.id
    );

    // 4. Assert results with enhanced helpers
    TestAssertions.assertServiceMethodCall(
      'projectService',
      'getProjectById',
      mockService,
      scenario.project.external_id || 'project-1',
      scenario.user.id
    );

    expect(result.success).toBe(true);
    expect(result.data).toEqual(scenario.project);

    // 5. Cleanup is handled automatically by the test utilities
  });
});