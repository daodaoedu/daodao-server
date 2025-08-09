// Test setup file for Jest
// This file runs after the test environment is set up but before tests run

// Ensure NODE_ENV is set to test
process.env.NODE_ENV = 'test';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Global beforeAll hook
beforeAll(async () => {
  // Setup test database connections if needed
  // This ensures databases are available for tests
});

// Global afterEach hook to clean up any pending operations
afterEach(async () => {
  // Clean up any pending timers
  jest.clearAllTimers();
  
  // Wait for any pending promises to resolve
  await new Promise(resolve => setImmediate(resolve));
  
  // Reset all mocks
  jest.clearAllMocks();
});

// Global afterAll hook to ensure cleanup
afterAll(async () => {
  // Give time for cleanup
  await new Promise(resolve => setTimeout(resolve, 100));
});