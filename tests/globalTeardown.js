// Global teardown for Jest tests
module.exports = async function globalTeardown() {
  try {
    // Mock cleanup - no real database connections in tests
    console.log('Global test teardown completed');
  } catch (error) {
    console.error('Error during global teardown:', error);
  }
};