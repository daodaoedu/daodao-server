/**
 * Enhanced Test Utilities
 * Comprehensive testing utilities for consistent and reliable test execution
 */

import { TestDataFactory } from './test-data-factory';
import {
  TypeSafeServiceHelpers,
  TestCleanupUtils,
  MockAssertionHelpers,
  TestDataValidators,
  PerformanceTestUtils
} from './test-helpers';

/**
 * Centralized Test Suite Setup
 * Provides standardized setup for different types of tests
 */
export class TestSuiteSetup {
  /**
   * Setup unit test environment with mocks and cleanup
   */
  static setupUnitTest(options: {
    enableCleanup?: boolean;
    mockServices?: string[];
    resetCounters?: boolean;
  } = {}) {
    const { enableCleanup = true, mockServices = [], resetCounters = true } = options;

    // Reset test data factory counters
    if (resetCounters) {
      TestDataFactory.resetCounters();
    }

    // Register cleanup tasks but don't setup Jest hooks automatically
    if (enableCleanup) {
      // Just register cleanup tasks, don't setup hooks
    }

    // Create service mocks
    const serviceMocks: Record<string, any> = {};
    mockServices.forEach(serviceName => {
      serviceMocks[serviceName] = this.createServiceMock(serviceName);
    });

    return {
      serviceMocks,
      cleanup: () => TestCleanupUtils.executeCleanup()
    };
  }

  /**
   * Setup integration test environment with database mocks
   */
  static setupIntegrationTest(options: {
    enableConstraints?: boolean;
    enableTransactions?: boolean;
    enableCleanup?: boolean;
    testData?: any;
  } = {}) {
    const {
      enableConstraints = true,
      enableTransactions = true,
      enableCleanup = true,
      testData
    } = options;

    // Create enhanced Prisma mock
    const mockPrisma = this.createEnhancedPrismaMock({
      enableConstraints,
      enableTransactions
    });

    // Setup test data if provided
    if (testData) {
      this.setupTestData(mockPrisma, testData);
    }

    // Setup cleanup
    if (enableCleanup) {
      TestCleanupUtils.registerCleanup(
        TestCleanupUtils.createDatabaseCleanup(mockPrisma)
      );
      // Don't setup Jest hooks automatically
    }

    return {
      mockPrisma,
      testData: testData || TestDataFactory.createTestScenario(),
      cleanup: () => TestCleanupUtils.executeCleanup()
    };
  }

  /**
   * Create enhanced Prisma mock with all required methods
   */
  private static createEnhancedPrismaMock(options: {
    enableConstraints?: boolean;
    enableTransactions?: boolean;
  } = {}) {
    const { enableConstraints = true, enableTransactions = true } = options;

    // Create base model mock with all required methods
    const createModelMock = () => ({
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
      $queryRaw: jest.fn(),
      $executeRaw: jest.fn()
    });

    const modelMocks = {
      users: createModelMock(),
      contacts: createModelMock(),
      temp_users: createModelMock(),
      roles: createModelMock(),
      user_roles: createModelMock(),
      permissions: createModelMock(),
      user_permissions: createModelMock(),
      resources: createModelMock(),
      resource_review: createModelMock(),
      categories: createModelMock(),
      entity_tags: createModelMock(),
      entity_resources: createModelMock(),
      tags: createModelMock(),
      ideas: createModelMock(),
      projects: createModelMock(),
      project: createModelMock(),
      marathon: createModelMock(),
      task: createModelMock(),
      user_positions: createModelMock(),
      positions: createModelMock(),
      comments: createModelMock(),
      comment_replies: createModelMock(),
      mentor_participants: createModelMock(),
      post: createModelMock(),
      groups: createModelMock(),
      note: createModelMock(),
      outcome: createModelMock(),
      review: createModelMock(),
      role_permissions: createModelMock(),
      milestone: createModelMock()
    };

    const mockPrisma = {
      $connect: jest.fn().mockResolvedValue(undefined),
      $disconnect: jest.fn().mockResolvedValue(undefined),
      $transaction: jest.fn(),
      $use: jest.fn(),
      $extends: jest.fn(),
      $on: jest.fn(),
      $queryRaw: jest.fn().mockResolvedValue([{ result: 1 }]),
      $executeRaw: jest.fn().mockResolvedValue(1),
      $reset: jest.fn().mockResolvedValue(undefined),

      // All model mocks
      ...modelMocks
    };

    // Setup transaction handling
    if (enableTransactions) {
      mockPrisma.$transaction.mockImplementation(async (callback: any, options?: any) => {
        const transactionClient = { ...modelMocks };

        // Handle timeout option
        if (options?.timeout) {
          return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
              reject(new Error('Transaction timeout'));
            }, options.timeout);

            callback(transactionClient).then((result: any) => {
              clearTimeout(timeoutId);
              resolve(result);
            }).catch((error: any) => {
              clearTimeout(timeoutId);
              reject(error);
            });
          });
        }

        return callback(transactionClient);
      });
    }

    // Setup constraint handling
    if (enableConstraints) {
      this.setupConstraintMocks(mockPrisma);
    }

    return mockPrisma;
  }

  /**
   * Setup constraint mocks for referential integrity testing
   */
  private static setupConstraintMocks(mockPrisma: any) {
    // Track created entities to simulate constraints
    const createdEntities = {
      users: new Map(),
      contacts: new Map(),
      roles: new Map(),
      projects: new Map(),
    };

    // Mock foreign key constraints
    const originalRoleDelete = mockPrisma.roles.delete;
    mockPrisma.roles.delete.mockImplementation(({ where }: any) => {
      // Check if role is referenced by users
      const referencedByUsers = Array.from(createdEntities.users.values())
        .some((user: any) => user.role_id === where.id);

      if (referencedByUsers) {
        throw new Error('Foreign key constraint violation: Cannot delete role that is referenced by users');
      }

      return originalRoleDelete({ where });
    });

    // Mock unique constraints
    const existingExternalIds = new Set<string>();
    const originalUserCreate = mockPrisma.users.create;
    mockPrisma.users.create.mockImplementation(({ data }: any) => {
      if (existingExternalIds.has(data.external_id)) {
        throw new Error('Unique constraint violation: external_id must be unique');
      }

      existingExternalIds.add(data.external_id);
      const user = TestDataFactory.createMockUser(data);
      createdEntities.users.set(user.id, user);
      return Promise.resolve(user);
    });

    // Mock NOT NULL constraints
    const originalUserCreateWithNull = mockPrisma.users.create;
    mockPrisma.users.create.mockImplementation(({ data }: any) => {
      if (data.external_id === null) {
        throw new Error('NOT NULL constraint violation: external_id cannot be null');
      }
      if (data.nickname === null) {
        throw new Error('NOT NULL constraint violation: nickname cannot be null');
      }

      return originalUserCreateWithNull({ data });
    });
  }

  /**
   * Setup test data in mock database
   */
  private static setupTestData(mockPrisma: any, testData: any) {
    // Setup basic CRUD operations with test data
    Object.keys(testData).forEach(entityType => {
      const entity = testData[entityType];
      const modelName = this.getModelName(entityType);

      if (mockPrisma[modelName]) {
        mockPrisma[modelName].findUnique.mockImplementation(({ where }: any) => {
          if (where.id === entity.id || where.external_id === entity.external_id) {
            return Promise.resolve(entity);
          }
          return Promise.resolve(null);
        });

        mockPrisma[modelName].create.mockImplementation(({ data }: any) => {
          return Promise.resolve({ ...entity, ...data });
        });
      }
    });
  }

  /**
   * Get model name from entity type
   */
  private static getModelName(entityType: string): string {
    const modelMap: Record<string, string> = {
      user: 'users',
      contact: 'contacts',
      role: 'roles',
      project: 'projects',
      idea: 'ideas',
      resource: 'resources',
      comment: 'comments'
    };

    return modelMap[entityType] || `${entityType}s`;
  }

  /**
   * Create service mock with common methods
   */
  private static createServiceMock(serviceName: string): any {
    const commonMethods = {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findById: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn()
    };

    // Service-specific methods
    const serviceSpecificMethods: Record<string, Record<string, jest.MockedFunction<any>>> = {
      ideaService: {
        createIdea: jest.fn(),
        updateIdea: jest.fn(),
        deleteIdea: jest.fn(),
        getIdeaById: jest.fn(),
        getIdeas: jest.fn(),
        getIdeaStats: jest.fn()
      },
      projectService: {
        createProject: jest.fn(),
        updateProject: jest.fn(),
        deleteProject: jest.fn(),
        getProjectById: jest.fn(),
        getProjects: jest.fn(),
        getProjectStats: jest.fn()
      },
      commentService: {
        createComment: jest.fn(),
        updateComment: jest.fn(),
        deleteComment: jest.fn(),
        getCommentById: jest.fn(),
        getComments: jest.fn(),
        getTargetEntity: jest.fn()
      },
      userService: {
        createUser: jest.fn(),
        updateUser: jest.fn(),
        deleteUser: jest.fn(),
        getUserById: jest.fn(),
        getUsers: jest.fn(),
        getUserStats: jest.fn()
      }
    };

    return {
      ...commonMethods,
      ...(serviceSpecificMethods[serviceName] || {})
    };
  }
}

/**
 * Test Scenario Builder
 * Builds complex test scenarios with related data
 */
export class TestScenarioBuilder {
  private scenario: any = {};

  /**
   * Add user to scenario
   */
  withUser(overrides: any = {}): this {
    const role = TestDataFactory.createMockRole();
    const contact = TestDataFactory.createMockContact();
    const user = TestDataFactory.createMockUser({
      contact_id: contact.id,
      role_id: role.id,
      ...overrides
    });

    this.scenario.role = role;
    this.scenario.contact = contact;
    this.scenario.user = user;

    return this;
  }

  /**
   * Add project to scenario
   */
  withProject(overrides: any = {}): this {
    if (!this.scenario.user) {
      this.withUser();
    }

    const project = TestDataFactory.createMockProject({
      user_id: this.scenario.user.id,
      ...overrides
    });

    this.scenario.project = project;
    return this;
  }

  /**
   * Add idea to scenario
   */
  withIdea(overrides: any = {}): this {
    if (!this.scenario.user) {
      this.withUser();
    }

    const idea = TestDataFactory.createMockIdea({
      user_id: this.scenario.user.id,
      ...overrides
    });

    this.scenario.idea = idea;
    return this;
  }

  /**
   * Add comment to scenario
   */
  withComment(overrides: any = {}): this {
    if (!this.scenario.user) {
      this.withUser();
    }

    if (!this.scenario.project && !overrides.target_id) {
      this.withProject();
    }

    const comment = TestDataFactory.createMockComment({
      user_id: this.scenario.user.id,
      target_type: 'project',
      target_id: this.scenario.project?.id || overrides.target_id,
      ...overrides
    });

    this.scenario.comment = comment;
    return this;
  }

  /**
   * Add multiple users to scenario
   */
  withMultipleUsers(count: number): this {
    this.scenario.users = TestDataFactory.createMultipleUsers(count);
    return this;
  }

  /**
   * Build the scenario
   */
  build(): any {
    return this.scenario;
  }

  /**
   * Build and setup in mock database
   */
  buildAndSetup(mockPrisma: any): any {
    const scenario = this.build();
    TestSuiteSetup['setupTestData'](mockPrisma, scenario);
    return scenario;
  }
}

/**
 * Test Assertion Helpers
 * Enhanced assertion helpers for common test patterns
 */
export class TestAssertions {
  /**
   * Assert service method was called with correct parameters
   */
  static assertServiceMethodCall(
    serviceName: 'ideaService' | 'projectService' | 'commentService',
    methodName: string,
    mockService: any,
    ...expectedArgs: any[]
  ): void {
    const helper = TypeSafeServiceHelpers[serviceName];
    if (helper && helper[methodName as keyof typeof helper]) {
      MockAssertionHelpers.assertMockCalledWithAny(
        mockService[methodName],
        ...expectedArgs
      );
    } else {
      throw new Error(`Unknown service method: ${serviceName}.${methodName}`);
    }
  }

  /**
   * Assert API response structure
   */
  static assertApiResponse(
    response: any,
    expectedStatus: number,
    expectedKeys: string[] = [],
    expectedValues: Record<string, any> = {}
  ): void {
    expect(response.status).toBe(expectedStatus);

    expectedKeys.forEach(key => {
      expect(response.body).toHaveProperty(key);
    });

    Object.keys(expectedValues).forEach(key => {
      expect(response.body[key]).toEqual(expectedValues[key]);
    });
  }

  /**
   * Assert database operation results
   */
  static assertDatabaseOperation(
    mockPrisma: any,
    modelName: string,
    operation: string,
    expectedCallCount: number = 1,
    expectedArgs?: any[]
  ): void {
    const model = mockPrisma[modelName];
    if (!model || !model[operation]) {
      throw new Error(`Unknown database operation: ${modelName}.${operation}`);
    }

    expect(model[operation]).toHaveBeenCalledTimes(expectedCallCount);

    if (expectedArgs) {
      expect(model[operation]).toHaveBeenCalledWith(...expectedArgs);
    }
  }

  /**
   * Assert error handling
   */
  static assertErrorHandling(
    fn: () => Promise<any> | any,
    expectedErrorType: new (...args: any[]) => Error,
    expectedErrorMessage?: string
  ): void {
    expect(fn).toThrow(expectedErrorType);

    if (expectedErrorMessage) {
      expect(fn).toThrow(expectedErrorMessage);
    }
  }

  /**
   * Assert test data validity
   */
  static assertTestDataValidity<T>(
    data: T,
    validator: (data: T) => boolean,
    errorMessage: string
  ): void {
    TestDataValidators.validateTestData(data, validator, errorMessage);
  }
}

/**
 * Export all utilities for easy access
 */
export {
  TestDataFactory,
  TypeSafeServiceHelpers,
  TestCleanupUtils,
  MockAssertionHelpers,
  TestDataValidators,
  PerformanceTestUtils
};

/**
 * Default export with all utilities
 */
export default {
  TestSuiteSetup,
  TestScenarioBuilder,
  TestAssertions,
  TestDataFactory,
  TypeSafeServiceHelpers,
  TestCleanupUtils,
  MockAssertionHelpers,
  TestDataValidators,
  PerformanceTestUtils
};