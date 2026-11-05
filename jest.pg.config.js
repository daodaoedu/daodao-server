/** Real PostgreSQL integration suite; never connects to a shared database. */
module.exports = {
  ...require('./jest.config'),
  testMatch: ['<rootDir>/src/**/__tests__/*.pg.integration.ts'],
  maxWorkers: 1,
};
