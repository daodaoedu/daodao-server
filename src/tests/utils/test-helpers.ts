/**
 * Enhanced Test Utilities and Helpers
 * Provides comprehensive testing utilities with type safety and parameter order validation
 */

import { Request, Response, NextFunction } from 'express';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';
import jwt from 'jsonwebtoken';
import { AuthRequest, UserJwtPayload } from '../../types/auth.types';
import { CreateIdeaRequest, UpdateIdeaRequest } from '../../validators/idea.validators';
import { ProjectCreateRequest, ProjectUpdateRequest } from '../../types/project.types';

// Mock JWT secret for testing
export const TEST_JWT_SECRET = 'test-jwt-secret';

/**
 * 建立模擬的 Request 物件
 */
export const createMockRequest = (options: {
  headers?: Record<string, string>;
  user?: Record<string, unknown>;
  isTemporary?: boolean;
  body?: Record<string, unknown>;
  params?: Record<string, unknown>;
  query?: Record<string, unknown>;
} = {}): Partial<AuthRequest> => {
  return {
    headers: options.headers || {},
    user: options.user as UserJwtPayload | undefined,
    isTemporary: options.isTemporary || false,
    body: options.body || {} as Record<string, unknown>,
    params: options.params as ParamsDictionary || {},
    query: (options.query || {}) as any,
    url: '/test',
    method: 'GET',
    originalUrl: '/test',
    ip: '127.0.0.1',
    connection: { remoteAddress: '127.0.0.1' } as any,
    isAuthenticated: jest.fn().mockReturnValue(true) as any,
  };
};

/**
 * 建立模擬的 Response 物件
 */
export const createMockResponse = (): Partial<Response> => {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    redirect: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
  };
};

/**
 * 建立模擬的 NextFunction
 */
export const createMockNext = (): jest.MockedFunction<NextFunction> => {
  return jest.fn();
};

/**
 * 生成測試用的 JWT Token
 */
export const generateTestToken = (payload: Record<string, unknown>, secret: string = TEST_JWT_SECRET, options?: jwt.SignOptions): string => {
  return jwt.sign(payload, secret, options);
};

/**
 * 建立有效的認證 Header
 */
export const createAuthHeader = (token: string): { authorization: string } => {
  return { authorization: `Bearer ${token}` };
};

/**
 * 建立測試用戶 Payload
 */
export const createTestUserPayload = (overrides: Record<string, unknown> = {}) => {
  return {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    isTemp: false,
    ...overrides
  };
};

/**
 * 建立測試用臨時用戶 Payload
 */
export const createTestTempUserPayload = (overrides: Record<string, unknown> = {}) => {
  return {
    id: 1,
    username: 'tempuser',
    email: 'temp@example.com',
    isTemp: true,
    ...overrides
  };
};

/**
 * 測試環境設定工具
 */
export const setupTestEnvironment = (envVars: Record<string, string>) => {
  const originalEnv = process.env;
  
  // 設定環境變數
  Object.keys(envVars).forEach(key => {
    process.env[key] = envVars[key];
  });
  
  // 返回清理函數
  return () => {
    process.env = originalEnv;
  };
};

/**
 * 驗證錯誤類型的工具函數
 */
export const expectErrorType = (error: unknown, expectedType: new (...args: unknown[]) => Error) => {
  expect(error).toBeInstanceOf(expectedType);
  return error;
};

/**
 * 驗證 HTTP 狀態碼
 */
export const expectStatusCode = (mockResponse: Partial<Response>, expectedStatus: number) => {
  expect(mockResponse.status).toHaveBeenCalledWith(expectedStatus);
};

/**
 * 驗證 JSON 回應
 */
export const expectJsonResponse = (mockResponse: Partial<Response>, expectedData: unknown) => {
  expect(mockResponse.json).toHaveBeenCalledWith(expectedData);
};

/**
 * 建立測試用的 Express App Mock
 */
export const createMockApp = () => {
  const app = {
    use: jest.fn(),
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
    listen: jest.fn(),
  };
  
  return app;
};

/**
 * 非同步測試工具
 */
export const asyncTestWrapper = (fn: () => Promise<void>) => {
  return async () => {
    await fn();
  };
};

/**
 * 測試計時工具
 */
export const timeTest = async (testFn: () => Promise<void> | void): Promise<number> => {
  const start = Date.now();
  await testFn();
  return Date.now() - start;
};

/**
 * 建立測試用的 Prisma Mock
 */
export const createPrismaMock = () => {
  return {
    users: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    contacts: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    temp_users: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    $disconnect: jest.fn(),
  };
};

/**
 * 建立測試用的 Email Service Mock
 */
export const createEmailServiceMock = () => {
  return {
    sendVerificationEmail: jest.fn().mockResolvedValue({ success: true }),
    sendPasswordResetEmail: jest.fn().mockResolvedValue({ success: true }),
    sendWelcomeEmail: jest.fn().mockResolvedValue({ success: true }),
    sendNotificationEmail: jest.fn().mockResolvedValue({ success: true }),
  };
};

/**
 * 建立測試用的 Permission Service Mock
 */
export const createPermissionServiceMock = () => {
  return {
    getUserRoles: jest.fn().mockResolvedValue([]),
    getUserPermissions: jest.fn().mockResolvedValue([]),
    hasPermission: jest.fn().mockResolvedValue(true),
    hasRole: jest.fn().mockResolvedValue(true),
  };
};

/**
 * 測試資料產生器
 */
export const TestDataGenerator = {
  /**
   * 生成隨機字串
   */
  randomString: (length: number = 10): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  /**
   * 生成隨機 Email
   */
  randomEmail: (): string => {
    return `${TestDataGenerator.randomString(8)}@example.com`;
  },

  /**
   * 生成隨機數字
   */
  randomNumber: (min: number = 1, max: number = 1000): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  /**
   * 生成隨機日期
   */
  randomDate: (start: Date = new Date('2020-01-01'), end: Date = new Date()): Date => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  },
};

/**
 * 常用的測試斷言工具
 */
export const TestAssertions = {
  /**
   * 驗證函數被調用
   */
  toHaveBeenCalled: (mockFn: jest.MockedFunction<(...args: unknown[]) => unknown>) => {
    expect(mockFn).toHaveBeenCalled();
  },

  /**
   * 驗證函數被調用特定次數
   */
  toHaveBeenCalledTimes: (mockFn: jest.MockedFunction<(...args: unknown[]) => unknown>, times: number) => {
    expect(mockFn).toHaveBeenCalledTimes(times);
  },

  /**
   * 驗證函數被調用時的參數
   */
  toHaveBeenCalledWith: (mockFn: jest.MockedFunction<(...args: unknown[]) => unknown>, ...args: unknown[]) => {
    expect(mockFn).toHaveBeenCalledWith(...args);
  },

  /**
   * 驗證物件包含特定屬性
   */
  toHaveProperty: (obj: Record<string, unknown>, property: string, value?: unknown) => {
    if (value !== undefined) {
      expect(obj).toHaveProperty(property, value);
    } else {
      expect(obj).toHaveProperty(property);
    }
  },

  /**
   * 驗證陣列包含特定元素
   */
  toContain: (array: unknown[], element: unknown) => {
    expect(array).toContain(element);
  },

  /**
   * 驗證值為真
   */
  toBeTruthy: (value: unknown) => {
    expect(value).toBeTruthy();
  },

  /**
   * 驗證值為假
   */
  toBeFalsy: (value: unknown) => {
    expect(value).toBeFalsy();
  },
};

/**
 * 建立完整的 Prisma 用戶模擬物件
 */
export const createMockPrismaUser = (overrides: Record<string, unknown> = {}) => {
  const now = new Date();
  return {
    id: 1,
    external_id: 'test-external-id',
    mongo_id: null,
    gender: null,
    language: null,
    education_stage: 'other' as const,
    tag_list: [],
    contact_id: 1,
    is_open_location: null,
    location_id: null,
    nickname: 'testuser',
    role_id: 1,
    is_open_profile: null,
    birth_date: null,
    basic_info_id: null,
    createdDate: now,
    updatedDate: now,
    created_by: null,
    created_at: now,
    updated_by: null,
    updated_at: now,
    email_verified: false,
    email_verified_at: null,
    is_active: true,
    // Relations
    contacts: {
      id: 1,
      google_id: null,
      photo_url: null,
      is_subscribe_email: null,
      email: 'test@example.com',
      ig: null,
      discord: null,
      line: null,
      fb: null
    },
    roles: {
      id: 1,
      name: 'user',
      description: null
    },
    user_positions: [],
    location: null,
    ...overrides
  };
};

/**
 * 建立完整的 Prisma 角色模擬物件
 */
export const createMockPrismaRole = (overrides: Record<string, unknown> = {}) => {
  return {
    id: 1,
    name: 'user',
    description: null,
    ...overrides
  };
};

/**
 * 建立完整的 Prisma 聯絡人模擬物件
 */
export const createMockPrismaContact = (overrides: Record<string, unknown> = {}) => {
  return {
    id: 1,
    google_id: null,
    photo_url: null,
    is_subscribe_email: null,
    email: 'test@example.com',
    ig: null,
    discord: null,
    line: null,
    fb: null,
    ...overrides
  };
};

/**
 * Database Integration Test Utilities
 */
export const DatabaseTestUtils = {
  /**
   * Setup database connection mocks for integration tests
   */
  setupConnectionMocks: (mockPrisma: any) => {
    mockPrisma.$connect.mockResolvedValue(undefined);
    mockPrisma.$disconnect.mockResolvedValue(undefined);
    mockPrisma.$queryRaw.mockResolvedValue([{ result: 1 }]);
    mockPrisma.$executeRaw.mockResolvedValue(1);
  },

  /**
   * Setup transaction mocks with proper error handling
   */
  setupTransactionMocks: (mockPrisma: any) => {
    mockPrisma.$transaction.mockImplementation(async (callback: any, options?: any) => {
      const transactionClient = {
        // Add all model mocks here
        users: { ...mockPrisma.users },
        contacts: { ...mockPrisma.contacts },
        roles: { ...mockPrisma.roles },
        temp_users: { ...mockPrisma.temp_users },
        projects: { ...mockPrisma.projects },
        ideas: { ...mockPrisma.ideas },
        resources: { ...mockPrisma.resources },
        comments: { ...mockPrisma.comments },
      };

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
  },

  /**
   * Setup referential integrity constraint mocks
   */
  setupConstraintMocks: (mockPrisma: any) => {
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
      const user = originalUserCreate({ data });
      createdEntities.users.set(user.id, user);
      return user;
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
  },

  /**
   * Setup connection pool exhaustion simulation
   */
  setupConnectionPoolMocks: (mockPrisma: any, maxConnections: number = 10) => {
    let activeConnections = 0;

    const wrapWithConnectionLimit = (originalMethod: any) => {
      return (...args: any[]) => {
        if (activeConnections >= maxConnections) {
          return Promise.reject(new Error('Connection pool exhausted'));
        }
        
        activeConnections++;
        const result = originalMethod(...args);
        
        // Handle both Promise and non-Promise returns
        if (result && typeof result.finally === 'function') {
          return result.finally(() => {
            activeConnections--;
          });
        } else {
          activeConnections--;
          return result;
        }
      };
    };

    // Wrap database operations with connection limits
    Object.keys(mockPrisma).forEach(modelName => {
      if (typeof mockPrisma[modelName] === 'object' && modelName !== '$transaction') {
        Object.keys(mockPrisma[modelName]).forEach(methodName => {
          if (typeof mockPrisma[modelName][methodName] === 'function') {
            mockPrisma[modelName][methodName] = wrapWithConnectionLimit(
              mockPrisma[modelName][methodName]
            );
          }
        });
      }
    });
  },

  /**
   * Setup database error simulation
   */
  setupErrorSimulation: (mockPrisma: any) => {
    const errorTypes = [
      'Connection timeout',
      'Database unavailable',
      'Network error: Connection reset',
      'Query timeout',
      'Lock wait timeout'
    ];

    // Randomly inject errors into database operations
    const injectRandomErrors = (originalMethod: any, errorRate: number = 0.1) => {
      return (...args: any[]) => {
        if (Math.random() < errorRate) {
          const randomError = errorTypes[Math.floor(Math.random() * errorTypes.length)];
          return Promise.reject(new Error(randomError));
        }
        return originalMethod(...args);
      };
    };

    // Apply error injection to all database methods
    Object.keys(mockPrisma).forEach(modelName => {
      if (typeof mockPrisma[modelName] === 'object' && modelName !== '$transaction') {
        Object.keys(mockPrisma[modelName]).forEach(methodName => {
          if (typeof mockPrisma[modelName][methodName] === 'function') {
            mockPrisma[modelName][methodName] = injectRandomErrors(
              mockPrisma[modelName][methodName]
            );
          }
        });
      }
    });
  },

  /**
   * Clean up test data between tests
   */
  cleanupTestData: async (mockPrisma: any) => {
    const cleanupOperations = [];

    // Only add cleanup operations for models that exist
    if (mockPrisma.comments?.deleteMany) {
      cleanupOperations.push(mockPrisma.comments.deleteMany({}).catch(() => ({ count: 0 })));
    }
    if (mockPrisma.resources?.deleteMany) {
      cleanupOperations.push(mockPrisma.resources.deleteMany({}).catch(() => ({ count: 0 })));
    }
    if (mockPrisma.ideas?.deleteMany) {
      cleanupOperations.push(mockPrisma.ideas.deleteMany({}).catch(() => ({ count: 0 })));
    }
    if (mockPrisma.projects?.deleteMany) {
      cleanupOperations.push(mockPrisma.projects.deleteMany({}).catch(() => ({ count: 0 })));
    }
    if (mockPrisma.user_permissions?.deleteMany) {
      cleanupOperations.push(mockPrisma.user_permissions.deleteMany({}).catch(() => ({ count: 0 })));
    }
    if (mockPrisma.users?.deleteMany) {
      cleanupOperations.push(mockPrisma.users.deleteMany({}).catch(() => ({ count: 0 })));
    }
    if (mockPrisma.temp_users?.deleteMany) {
      cleanupOperations.push(mockPrisma.temp_users.deleteMany({}).catch(() => ({ count: 0 })));
    }
    if (mockPrisma.contacts?.deleteMany) {
      cleanupOperations.push(mockPrisma.contacts.deleteMany({}).catch(() => ({ count: 0 })));
    }
    if (mockPrisma.roles?.deleteMany) {
      cleanupOperations.push(mockPrisma.roles.deleteMany({}).catch(() => ({ count: 0 })));
    }
    if (mockPrisma.permissions?.deleteMany) {
      cleanupOperations.push(mockPrisma.permissions.deleteMany({}).catch(() => ({ count: 0 })));
    }

    if (cleanupOperations.length > 0) {
      await Promise.allSettled(cleanupOperations);
    }
  },

  /**
   * Verify referential integrity after operations
   */
  verifyReferentialIntegrity: async (mockPrisma: any) => {
    // This would normally check database constraints
    // In tests, we simulate this by checking our mock data
    const users = await mockPrisma.users.findMany({});
    const contacts = await mockPrisma.contacts.findMany({});
    const roles = await mockPrisma.roles.findMany({});

    // Verify all users have valid contact_id and role_id references
    for (const user of users) {
      const contact = contacts.find((c: any) => c.id === user.contact_id);
      const role = roles.find((r: any) => r.id === user.role_id);
      
      if (!contact) {
        throw new Error(`Referential integrity violation: User ${user.id} references non-existent contact ${user.contact_id}`);
      }
      
      if (!role) {
        throw new Error(`Referential integrity violation: User ${user.id} references non-existent role ${user.role_id}`);
      }
    }
  }
};

/**
 * Integration Test Setup Helper
 */
export const IntegrationTestSetup = {
  /**
   * Setup complete integration test environment
   */
  setupIntegrationTest: (mockPrisma: any, options: {
    enableConstraints?: boolean;
    enableConnectionLimits?: boolean;
    enableErrorSimulation?: boolean;
    maxConnections?: number;
    errorRate?: number;
  } = {}) => {
    const {
      enableConstraints = true,
      enableConnectionLimits = false,
      enableErrorSimulation = false,
      maxConnections = 10,
      errorRate = 0.1
    } = options;

    // Setup basic database mocks
    DatabaseTestUtils.setupConnectionMocks(mockPrisma);
    DatabaseTestUtils.setupTransactionMocks(mockPrisma);

    // Setup optional features
    if (enableConstraints) {
      DatabaseTestUtils.setupConstraintMocks(mockPrisma);
    }

    if (enableConnectionLimits) {
      DatabaseTestUtils.setupConnectionPoolMocks(mockPrisma, maxConnections);
    }

    if (enableErrorSimulation) {
      DatabaseTestUtils.setupErrorSimulation(mockPrisma);
    }

    // Return cleanup function
    return async () => {
      await DatabaseTestUtils.cleanupTestData(mockPrisma);
    };
  },

  /**
   * Create test scenario with related data
   */
  createTestScenario: async (mockPrisma: any) => {
    // Create role first
    const role = await mockPrisma.roles.create({
      data: {
        name: 'test_role',
        description: 'Test role for integration tests'
      }
    });

    // Create contact
    const contact = await mockPrisma.contacts.create({
      data: {
        email: 'integration@test.com'
      }
    });

    // Create user with proper relationships
    const user = await mockPrisma.users.create({
      data: {
        external_id: 'integration-test-user',
        mongo_id: 'mongo-integration-test',
        nickname: 'integrationuser',
        contact_id: contact.id,
        role_id: role.id
      }
    });

    return { role, contact, user };
  }
};

/**
 * Type-Safe Service Method Helpers
 * Prevents parameter order issues by providing strongly typed wrappers
 */
export class TypeSafeServiceHelpers {
  /**
   * Type-safe wrapper for idea service methods
   */
  static ideaService = {
    /**
     * Create idea with correct parameter order: (data, userId)
     */
    createIdea: (mockService: any, data: CreateIdeaRequest, userId: number) => {
      return mockService.createIdea(data, userId);
    },

    /**
     * Update idea with correct parameter order: (ideaId, data, userId)
     */
    updateIdea: (mockService: any, ideaId: string, data: UpdateIdeaRequest, userId: number) => {
      return mockService.updateIdea(ideaId, data, userId);
    },

    /**
     * Get idea by ID with correct parameter order: (ideaId, userId?)
     */
    getIdeaById: (mockService: any, ideaId: string, userId?: number) => {
      return mockService.getIdeaById(ideaId, userId);
    },

    /**
     * Delete idea with correct parameter order: (ideaId, userId)
     */
    deleteIdea: (mockService: any, ideaId: string, userId: number) => {
      return mockService.deleteIdea(ideaId, userId);
    }
  };

  /**
   * Type-safe wrapper for project service methods
   */
  static projectService = {
    /**
     * Create project with correct parameter order: (userId, data)
     */
    createProject: (mockService: any, userId: number, data: ProjectCreateRequest) => {
      return mockService.createProject(userId, data);
    },

    /**
     * Update project with correct parameter order: (projectId, userId, data)
     */
    updateProject: (mockService: any, projectId: string, userId: number, data: ProjectUpdateRequest) => {
      return mockService.updateProject(projectId, userId, data);
    },

    /**
     * Get project by ID with correct parameter order: (projectId, userId?)
     */
    getProjectById: (mockService: any, projectId: string, userId?: number) => {
      return mockService.getProjectById(projectId, userId);
    },

    /**
     * Delete project with correct parameter order: (projectId, userId)
     */
    deleteProject: (mockService: any, projectId: string, userId: number) => {
      return mockService.deleteProject(projectId, userId);
    }
  };

  /**
   * Type-safe wrapper for comment service methods
   */
  static commentService = {
    /**
     * Create comment with correct parameter order
     */
    createComment: (mockService: any, data: any, userId: number) => {
      return mockService.createComment(data, userId);
    },

    /**
     * Update comment with correct parameter order
     */
    updateComment: (mockService: any, commentId: string, data: any, userId: number) => {
      return mockService.updateComment(commentId, data, userId);
    },

    /**
     * Get target entity with correct parameter order
     */
    getTargetEntity: (mockService: any, targetType: string, targetId: string) => {
      return mockService.getTargetEntity(targetType, targetId);
    }
  };

  /**
   * Validate service method call parameters
   */
  static validateServiceCall = {
    /**
     * Validate idea service method calls
     */
    ideaService: {
      createIdea: (data: any, userId: any) => {
        if (typeof userId !== 'number') {
          throw new Error('createIdea: userId must be a number (second parameter)');
        }
        if (!data || typeof data !== 'object') {
          throw new Error('createIdea: data must be an object (first parameter)');
        }
      },

      updateIdea: (ideaId: any, data: any, userId: any) => {
        if (typeof ideaId !== 'string') {
          throw new Error('updateIdea: ideaId must be a string (first parameter)');
        }
        if (!data || typeof data !== 'object') {
          throw new Error('updateIdea: data must be an object (second parameter)');
        }
        if (typeof userId !== 'number') {
          throw new Error('updateIdea: userId must be a number (third parameter)');
        }
      }
    },

    /**
     * Validate project service method calls
     */
    projectService: {
      createProject: (userId: any, data: any) => {
        if (typeof userId !== 'number') {
          throw new Error('createProject: userId must be a number (first parameter)');
        }
        if (!data || typeof data !== 'object') {
          throw new Error('createProject: data must be an object (second parameter)');
        }
      },

      updateProject: (projectId: any, userId: any, data: any) => {
        if (typeof projectId !== 'string') {
          throw new Error('updateProject: projectId must be a string (first parameter)');
        }
        if (typeof userId !== 'number') {
          throw new Error('updateProject: userId must be a number (second parameter)');
        }
        if (!data || typeof data !== 'object') {
          throw new Error('updateProject: data must be an object (third parameter)');
        }
      }
    }
  };
}

/**
 * Enhanced Test Cleanup Utilities
 */
export class TestCleanupUtils {
  private static cleanupTasks: Array<() => Promise<void> | void> = [];

  /**
   * Register a cleanup task to be executed after test
   */
  static registerCleanup(task: () => Promise<void> | void): void {
    this.cleanupTasks.push(task);
  }

  /**
   * Execute all registered cleanup tasks
   */
  static async executeCleanup(): Promise<void> {
    const errors: Error[] = [];

    for (const task of this.cleanupTasks) {
      try {
        await task();
      } catch (error) {
        errors.push(error instanceof Error ? error : new Error(String(error)));
      }
    }

    // Clear cleanup tasks
    this.cleanupTasks = [];

    // If there were errors, throw them
    if (errors.length > 0) {
      const errorMessage = errors.map(e => e.message).join('; ');
      throw new Error(`Cleanup failed: ${errorMessage}`);
    }
  }

  /**
   * Clear all registered cleanup tasks without executing them
   */
  static clearCleanup(): void {
    this.cleanupTasks = [];
  }

  /**
   * Setup automatic cleanup for Jest tests
   */
  static setupJestCleanup(): void {
    if (typeof afterEach !== 'undefined') {
      afterEach(async () => {
        await this.executeCleanup();
      });
    }
  }

  /**
   * Create a cleanup function for database mocks
   */
  static createDatabaseCleanup(mockPrisma: any): () => Promise<void> {
    return async () => {
      // Reset all mock functions
      Object.keys(mockPrisma).forEach(key => {
        if (mockPrisma[key] && typeof mockPrisma[key] === 'object') {
          Object.keys(mockPrisma[key]).forEach(method => {
            if (jest.isMockFunction(mockPrisma[key][method])) {
              mockPrisma[key][method].mockReset();
            }
          });
        }
      });

      // Clear any stored data
      if (mockPrisma.$reset) {
        await mockPrisma.$reset();
      }
    };
  }

  /**
   * Create a cleanup function for service mocks
   */
  static createServiceCleanup(...services: any[]): () => void {
    return () => {
      services.forEach(service => {
        Object.keys(service).forEach(method => {
          if (jest.isMockFunction(service[method])) {
            service[method].mockReset();
          }
        });
      });
    };
  }
}

/**
 * Enhanced Mock Assertion Helpers
 */
export class MockAssertionHelpers {
  /**
   * Assert that a service method was called with correct parameter order
   */
  static assertServiceCall = {
    /**
     * Assert idea service method calls
     */
    ideaService: {
      createIdea: (mockService: any, expectedData: any, expectedUserId: number) => {
        expect(mockService.createIdea).toHaveBeenCalledWith(expectedData, expectedUserId);
      },

      updateIdea: (mockService: any, expectedIdeaId: string, expectedData: any, expectedUserId: number) => {
        expect(mockService.updateIdea).toHaveBeenCalledWith(expectedIdeaId, expectedData, expectedUserId);
      }
    },

    /**
     * Assert project service method calls
     */
    projectService: {
      createProject: (mockService: any, expectedUserId: number, expectedData: any) => {
        expect(mockService.createProject).toHaveBeenCalledWith(expectedUserId, expectedData);
      },

      updateProject: (mockService: any, expectedProjectId: string, expectedUserId: number, expectedData: any) => {
        expect(mockService.updateProject).toHaveBeenCalledWith(expectedProjectId, expectedUserId, expectedData);
      }
    }
  };

  /**
   * Assert mock function call count and parameters
   */
  static assertMockCall(
    mockFn: jest.MockedFunction<any>,
    expectedCallCount: number,
    expectedCalls?: any[][]
  ): void {
    expect(mockFn).toHaveBeenCalledTimes(expectedCallCount);
    
    if (expectedCalls) {
      expectedCalls.forEach((expectedCall, index) => {
        expect(mockFn).toHaveBeenNthCalledWith(index + 1, ...expectedCall);
      });
    }
  }

  /**
   * Assert that mock was called with specific parameters in any order
   */
  static assertMockCalledWithAny(
    mockFn: jest.MockedFunction<any>,
    ...expectedArgs: any[]
  ): void {
    expect(mockFn).toHaveBeenCalledWith(...expectedArgs);
  }

  /**
   * Assert that mock was not called with specific parameters
   */
  static assertMockNotCalledWith(
    mockFn: jest.MockedFunction<any>,
    ...unexpectedArgs: any[]
  ): void {
    expect(mockFn).not.toHaveBeenCalledWith(...unexpectedArgs);
  }

  /**
   * Assert response structure for API tests
   */
  static assertApiResponse(
    response: any,
    expectedStatus: number,
    expectedStructure?: Record<string, any>
  ): void {
    expect(response.status).toBe(expectedStatus);
    
    if (expectedStructure) {
      Object.keys(expectedStructure).forEach(key => {
        expect(response.body).toHaveProperty(key);
        
        if (expectedStructure[key] !== undefined) {
          expect(response.body[key]).toEqual(expectedStructure[key]);
        }
      });
    }
  }
}

/**
 * Test Data Validation Helpers
 */
export class TestDataValidators {
  /**
   * Validate that test data matches expected schema
   */
  static validateTestData<T>(data: T, validator: (data: T) => boolean, errorMessage: string): void {
    if (!validator(data)) {
      throw new Error(`Test data validation failed: ${errorMessage}`);
    }
  }

  /**
   * Validate idea test data
   */
  static validateIdeaData(data: any): boolean {
    return (
      typeof data === 'object' &&
      typeof data.content === 'string' &&
      data.content.length > 0 &&
      (!data.tags || Array.isArray(data.tags)) &&
      (!data.resources || Array.isArray(data.resources))
    );
  }

  /**
   * Validate project test data
   */
  static validateProjectData(data: any): boolean {
    return (
      typeof data === 'object' &&
      typeof data.title === 'string' &&
      data.title.length > 0 &&
      (!data.description || typeof data.description === 'string') &&
      (!data.milestones || Array.isArray(data.milestones))
    );
  }

  /**
   * Validate user test data
   */
  static validateUserData(data: any): boolean {
    return (
      typeof data === 'object' &&
      typeof data.id === 'number' &&
      typeof data.external_id === 'string' &&
      typeof data.nickname === 'string' &&
      typeof data.contact_id === 'number' &&
      typeof data.role_id === 'number'
    );
  }
}

/**
 * Performance Testing Utilities
 */
export class PerformanceTestUtils {
  /**
   * Measure execution time of a function
   */
  static async measureExecutionTime<T>(
    fn: () => Promise<T> | T,
    label?: string
  ): Promise<{ result: T; duration: number }> {
    const start = process.hrtime.bigint();
    const result = await fn();
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000; // Convert to milliseconds

    if (label) {
      console.log(`${label}: ${duration.toFixed(2)}ms`);
    }

    return { result, duration };
  }

  /**
   * Assert that execution time is within acceptable limits
   */
  static assertExecutionTime(
    duration: number,
    maxDuration: number,
    operation: string
  ): void {
    if (duration > maxDuration) {
      throw new Error(`${operation} took ${duration.toFixed(2)}ms, expected less than ${maxDuration}ms`);
    }
  }

  /**
   * Run performance benchmark
   */
  static async runBenchmark<T>(
    fn: () => Promise<T> | T,
    iterations: number = 100,
    label?: string
  ): Promise<{
    averageDuration: number;
    minDuration: number;
    maxDuration: number;
    totalDuration: number;
  }> {
    const durations: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const { duration } = await this.measureExecutionTime(fn);
      durations.push(duration);
    }

    const averageDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const minDuration = Math.min(...durations);
    const maxDuration = Math.max(...durations);
    const totalDuration = durations.reduce((sum, d) => sum + d, 0);

    if (label) {
      console.log(`Benchmark ${label}:`);
      console.log(`  Average: ${averageDuration.toFixed(2)}ms`);
      console.log(`  Min: ${minDuration.toFixed(2)}ms`);
      console.log(`  Max: ${maxDuration.toFixed(2)}ms`);
      console.log(`  Total: ${totalDuration.toFixed(2)}ms`);
    }

    return {
      averageDuration,
      minDuration,
      maxDuration,
      totalDuration
    };
  }
}