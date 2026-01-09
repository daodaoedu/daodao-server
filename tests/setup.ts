import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Set test-specific environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-testing';
process.env.SESSION_SECRET = 'test-session-secret';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/daodao_test';
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/daodao_test';
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379/1';

// Disable console logs during tests unless explicitly needed
if (process.env.DEBUG_TESTS !== 'true') {
  global.console.log = jest.fn();
  global.console.info = jest.fn();
  global.console.warn = jest.fn();
}

// Global test utilities
global.testUtils = {
  generateTestId: () => `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  delay: (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
};

// Setup global hooks
beforeAll(async () => {
  // Additional setup can be added here
});

beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
  jest.restoreAllMocks();
});

afterAll(async () => {
  // Clean up any lingering connections
  await new Promise(resolve => setTimeout(resolve, 500));
});

// Extend Jest matchers if needed
expect.extend({
  toBeValidDate(received: any) {
    const pass = received instanceof Date && !isNaN(received.getTime());
    return {
      pass,
      message: () => `expected ${received} to be a valid Date`
    };
  },
  toMatchResponseFormat(received: any) {
    const hasValidStructure = 
      typeof received === 'object' &&
      'success' in received &&
      typeof received.success === 'boolean';
    
    return {
      pass: hasValidStructure,
      message: () => `expected response to have valid format with success field`
    };
  }
});

// Declare global test utilities types
declare global {
  var testUtils: {
    generateTestId: () => string;
    delay: (ms: number) => Promise<void>;
  };
  
  namespace jest {
    interface Matchers<R> {
      toBeValidDate(): R;
      toMatchResponseFormat(): R;
    }
  }
}

export {};