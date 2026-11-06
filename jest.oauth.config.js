/** Actual application OAuth integration; external provider HTTP is the only stub. */
module.exports = {
  ...require('./jest.config'),
  rootDir: __dirname,
  testMatch: ['<rootDir>/tests/integration/auth/__tests__/*.oauth.integration.ts'],
  setupFiles: ['<rootDir>/tests/integration/auth/__tests__/oauth-environment.cjs'],
  setupFilesAfterEnv: ['<rootDir>/tests/integration/auth/__tests__/oauth-setup.ts'],
  globalSetup: '<rootDir>/tests/integration/auth/__tests__/oauth-cwd-setup.cjs',
  globalTeardown: '<rootDir>/tests/integration/auth/__tests__/oauth-cwd-teardown.cjs',
  forceExit: false,
  detectOpenHandles: true,
  maxWorkers: 1,
  testTimeout: 30000,
};
