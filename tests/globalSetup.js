// Global setup for Jest tests
const path = require('path');
const dotenv = require('dotenv');

module.exports = async function globalSetup() {
  // Load test environment variables
  dotenv.config({ path: path.resolve(__dirname, '../.env.test') });
  
  // Set NODE_ENV to test
  process.env.NODE_ENV = 'test';
  
  // Set JWT secret for testing
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
  
  // Override database connections for testing
  process.env.MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/daodao_test';
  process.env.POSTGRES_DB = process.env.POSTGRES_DB || 'daodao_test';
  process.env.REDIS_DB = process.env.REDIS_DB || '1';
  
  console.log('Global test setup completed');
};