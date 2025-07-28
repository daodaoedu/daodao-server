// Global teardown for Jest tests
module.exports = async function globalTeardown() {
  try {
    // Close Prisma database connections if they exist
    const { prismaService } = require('../services/database/prisma.service');
    if (prismaService) {
      await prismaService.disconnect();
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