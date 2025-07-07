// Global teardown for Jest tests
module.exports = async function globalTeardown() {
  try {
    // Close database connections if they exist
    const sequelize = require('../../config/db');
    if (sequelize) {
      await sequelize.close();
    }
    
    // Close mongoose connections
    const mongoose = require('mongoose');
    if (mongoose.connection && mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    console.log('Global test teardown completed');
  } catch (error) {
    console.error('Error during global teardown:', error);
  }
};