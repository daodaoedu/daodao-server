// Test setup file for Jest
// This file runs after the test environment is set up but before tests run

// Set NODE_ENV to test to suppress console output in tests
process.env.NODE_ENV = 'test';

// Global afterEach hook to clean up any pending operations
afterEach(async () => {
  // Clean up any pending timers
  jest.clearAllTimers();
  
  // Wait for any pending promises to resolve
  await new Promise(resolve => setImmediate(resolve));
});

// Global afterAll hook to ensure cleanup
afterAll(async () => {
  // Give time for cleanup
  await new Promise(resolve => setTimeout(resolve, 100));
});