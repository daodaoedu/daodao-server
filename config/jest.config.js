// jest.config.js
const path = require('path');

module.exports = {
    preset: 'ts-jest',
    testEnvironment: "node",
    collectCoverage: true,
    coverageProvider: 'babel',
    coverageDirectory: "coverage",
    coverageReporters: ['text', 'lcov', 'html'],
    collectCoverageFrom: [
      'src/**/*.{ts,js}',
      '!src/**/*.d.ts',
      '!src/types/**/*',
      '!src/swagger/**/*',
      '!src/tests/**/*',
      '!src/server.ts'
    ],
    globalSetup: "<rootDir>/../src/tests/globalSetup.js",
    globalTeardown: "<rootDir>/../src/tests/globalTeardown.js",
    setupFiles: ["<rootDir>/../jest.setup.js"],
    setupFilesAfterEnv: ["<rootDir>/../src/tests/setup.js"],
    testEnvironment: "node",
    testEnvironmentOptions: {
      NODE_ENV: "test"
    },
    transform: {
      '^.+\\.ts$': 'ts-jest'
    },
    moduleFileExtensions: ['ts', 'js'],
    moduleNameMapper: {
      "^@/(.*)$": "<rootDir>/../src/$1",
      "^@types/(.*)$": "<rootDir>/../src/types/$1",
      "^@services/(.*)$": "<rootDir>/../src/services/$1",
      "^@middleware/(.*)$": "<rootDir>/../src/middleware/$1",
      "^@utils/(.*)$": "<rootDir>/../src/utils/$1",
      "^@models/(.*)$": "<rootDir>/../src/models/$1",
      "^@controllers/(.*)$": "<rootDir>/../src/controllers/$1"
    },
    moduleDirectories: ["node_modules", "src"],
    testPathIgnorePatterns: ["/node_modules/", "/dist/"],
    testMatch: ['**/*.test.ts', '**/*.test.js'],
    roots: ["<rootDir>/../src/tests", "<rootDir>/../src"],
    testTimeout: 30000,
    forceExit: true,
    detectOpenHandles: true,
    verbose: true
  };
  