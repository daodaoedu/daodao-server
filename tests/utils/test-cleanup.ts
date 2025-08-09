/**
 * Test Cleanup Utilities
 * Provides comprehensive cleanup functionality for tests
 */

/**
 * Global Test Cleanup Manager
 * Manages cleanup tasks across all test files
 */
export class GlobalTestCleanup {
  private static instance: GlobalTestCleanup;
  private cleanupTasks: Map<string, Array<() => Promise<void> | void>> = new Map();
  private isSetup = false;

  private constructor() {}

  static getInstance(): GlobalTestCleanup {
    if (!GlobalTestCleanup.instance) {
      GlobalTestCleanup.instance = new GlobalTestCleanup();
    }
    return GlobalTestCleanup.instance;
  }

  /**
   * Setup global cleanup hooks for Jest
   */
  setupGlobalHooks(): void {
    if (this.isSetup) return;

    // Setup afterEach hook
    if (typeof afterEach !== 'undefined') {
      afterEach(async () => {
        await this.executeTestCleanup();
      });
    }

    // Setup afterAll hook
    if (typeof afterAll !== 'undefined') {
      afterAll(async () => {
        await this.executeAllCleanup();
      });
    }

    this.isSetup = true;
  }

  /**
   * Register cleanup task for current test
   */
  registerTestCleanup(testName: string, task: () => Promise<void> | void): void {
    if (!this.cleanupTasks.has(testName)) {
      this.cleanupTasks.set(testName, []);
    }
    this.cleanupTasks.get(testName)!.push(task);
  }

  /**
   * Execute cleanup for current test
   */
  private async executeTestCleanup(): Promise<void> {
    const currentTest = expect.getState().currentTestName || 'unknown';
    const tasks = this.cleanupTasks.get(currentTest) || [];

    const errors: Error[] = [];
    for (const task of tasks) {
      try {
        await task();
      } catch (error) {
        errors.push(error instanceof Error ? error : new Error(String(error)));
      }
    }

    // Clear tasks for this test
    this.cleanupTasks.delete(currentTest);

    if (errors.length > 0) {
      const errorMessage = errors.map(e => e.message).join('; ');
      console.warn(`Test cleanup warnings for ${currentTest}: ${errorMessage}`);
    }
  }

  /**
   * Execute all remaining cleanup tasks
   */
  private async executeAllCleanup(): Promise<void> {
    const allTasks = Array.from(this.cleanupTasks.values()).flat();
    const errors: Error[] = [];

    for (const task of allTasks) {
      try {
        await task();
      } catch (error) {
        errors.push(error instanceof Error ? error : new Error(String(error)));
      }
    }

    this.cleanupTasks.clear();

    if (errors.length > 0) {
      const errorMessage = errors.map(e => e.message).join('; ');
      console.warn(`Global cleanup warnings: ${errorMessage}`);
    }
  }

  /**
   * Clear all cleanup tasks without executing
   */
  clearAllTasks(): void {
    this.cleanupTasks.clear();
  }
}

/**
 * Database Cleanup Utilities
 */
export class DatabaseCleanup {
  /**
   * Create comprehensive database cleanup function
   */
  static createCleanupFunction(mockPrisma: any): () => Promise<void> {
    return async () => {
      try {
        // Reset all mock functions
        await this.resetAllMocks(mockPrisma);
        
        // Clear mock data
        await this.clearMockData(mockPrisma);
        
        // Reset counters and state
        await this.resetState(mockPrisma);
      } catch (error) {
        console.warn('Database cleanup warning:', error);
      }
    };
  }

  /**
   * Reset all mock functions in Prisma mock
   */
  private static async resetAllMocks(mockPrisma: any): Promise<void> {
    const resetMock = (obj: any) => {
      Object.keys(obj).forEach(key => {
        if (jest.isMockFunction(obj[key])) {
          obj[key].mockReset();
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          resetMock(obj[key]);
        }
      });
    };

    resetMock(mockPrisma);
  }

  /**
   * Clear mock data from database mock
   */
  private static async clearMockData(mockPrisma: any): Promise<void> {
    // Clear stored data if available
    if (mockPrisma.$clearData) {
      await mockPrisma.$clearData();
    }

    // Reset deleteMany mocks to return success
    const models = [
      'users', 'contacts', 'roles', 'projects', 'ideas', 
      'resources', 'comments', 'temp_users', 'permissions',
      'user_permissions', 'entity_tags', 'entity_resources'
    ];

    models.forEach(modelName => {
      if (mockPrisma[modelName]?.deleteMany) {
        mockPrisma[modelName].deleteMany.mockResolvedValue({ count: 0 });
      }
    });
  }

  /**
   * Reset state and counters
   */
  private static async resetState(mockPrisma: any): Promise<void> {
    if (mockPrisma.$reset) {
      await mockPrisma.$reset();
    }
  }

  /**
   * Setup database cleanup for specific test
   */
  static setupForTest(mockPrisma: any, testName?: string): void {
    const cleanup = this.createCleanupFunction(mockPrisma);
    const currentTest = testName || expect.getState().currentTestName || 'unknown';
    
    GlobalTestCleanup.getInstance().registerTestCleanup(currentTest, cleanup);
  }
}

/**
 * Service Mock Cleanup Utilities
 */
export class ServiceMockCleanup {
  /**
   * Create service cleanup function
   */
  static createCleanupFunction(...services: any[]): () => void {
    return () => {
      services.forEach(service => {
        this.resetServiceMock(service);
      });
    };
  }

  /**
   * Reset individual service mock
   */
  private static resetServiceMock(service: any): void {
    Object.keys(service).forEach(method => {
      if (jest.isMockFunction(service[method])) {
        service[method].mockReset();
      }
    });
  }

  /**
   * Setup service cleanup for specific test
   */
  static setupForTest(services: any[], testName?: string): void {
    const cleanup = this.createCleanupFunction(...services);
    const currentTest = testName || expect.getState().currentTestName || 'unknown';
    
    GlobalTestCleanup.getInstance().registerTestCleanup(currentTest, cleanup);
  }
}

/**
 * Environment Cleanup Utilities
 */
export class EnvironmentCleanup {
  private static originalEnv: NodeJS.ProcessEnv = {};

  /**
   * Setup environment variables for test
   */
  static setupEnvironment(envVars: Record<string, string>): () => void {
    // Store original environment
    this.originalEnv = { ...process.env };

    // Set test environment variables
    Object.keys(envVars).forEach(key => {
      process.env[key] = envVars[key];
    });

    // Return cleanup function
    return () => {
      this.restoreEnvironment();
    };
  }

  /**
   * Restore original environment
   */
  private static restoreEnvironment(): void {
    // Clear current environment
    Object.keys(process.env).forEach(key => {
      if (!(key in this.originalEnv)) {
        delete process.env[key];
      }
    });

    // Restore original values
    Object.keys(this.originalEnv).forEach(key => {
      process.env[key] = this.originalEnv[key];
    });
  }

  /**
   * Setup environment cleanup for specific test
   */
  static setupForTest(envVars: Record<string, string>, testName?: string): void {
    const cleanup = this.setupEnvironment(envVars);
    const currentTest = testName || expect.getState().currentTestName || 'unknown';
    
    GlobalTestCleanup.getInstance().registerTestCleanup(currentTest, cleanup);
  }
}

/**
 * Memory Cleanup Utilities
 */
export class MemoryCleanup {
  private static timers: Set<NodeJS.Timeout> = new Set();
  private static intervals: Set<NodeJS.Timeout> = new Set();

  /**
   * Track timer for cleanup
   */
  static trackTimer(timer: NodeJS.Timeout): NodeJS.Timeout {
    this.timers.add(timer);
    return timer;
  }

  /**
   * Track interval for cleanup
   */
  static trackInterval(interval: NodeJS.Timeout): NodeJS.Timeout {
    this.intervals.add(interval);
    return interval;
  }

  /**
   * Clear all tracked timers and intervals
   */
  static clearAll(): void {
    this.timers.forEach(timer => clearTimeout(timer));
    this.intervals.forEach(interval => clearInterval(interval));
    
    this.timers.clear();
    this.intervals.clear();
  }

  /**
   * Setup memory cleanup for specific test
   */
  static setupForTest(testName?: string): void {
    const currentTest = testName || expect.getState().currentTestName || 'unknown';
    
    GlobalTestCleanup.getInstance().registerTestCleanup(currentTest, () => {
      this.clearAll();
    });
  }
}

/**
 * Comprehensive Test Cleanup Setup
 */
export class ComprehensiveTestCleanup {
  /**
   * Setup all cleanup utilities for a test suite
   */
  static setupTestSuite(options: {
    mockPrisma?: any;
    services?: any[];
    environment?: Record<string, string>;
    enableMemoryCleanup?: boolean;
  } = {}): void {
    const { mockPrisma, services = [], environment, enableMemoryCleanup = true } = options;

    // Setup global cleanup hooks
    GlobalTestCleanup.getInstance().setupGlobalHooks();

    // Setup database cleanup
    if (mockPrisma) {
      DatabaseCleanup.setupForTest(mockPrisma);
    }

    // Setup service cleanup
    if (services.length > 0) {
      ServiceMockCleanup.setupForTest(services);
    }

    // Setup environment cleanup
    if (environment) {
      EnvironmentCleanup.setupForTest(environment);
    }

    // Setup memory cleanup
    if (enableMemoryCleanup) {
      MemoryCleanup.setupForTest();
    }
  }

  /**
   * Manual cleanup execution
   */
  static async executeCleanup(): Promise<void> {
    await GlobalTestCleanup.getInstance()['executeTestCleanup']();
  }

  /**
   * Clear all cleanup tasks
   */
  static clearAllTasks(): void {
    GlobalTestCleanup.getInstance().clearAllTasks();
  }
}

// Export singleton instance for easy access
export const globalTestCleanup = GlobalTestCleanup.getInstance();

// Export default comprehensive setup
export default ComprehensiveTestCleanup;