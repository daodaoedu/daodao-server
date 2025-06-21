// jest.config.js
module.exports = {
    preset: 'ts-jest',
    testEnvironment: "node",
    collectCoverage: true,
    coverageDirectory: "coverage",
    globalTeardown: "<rootDir>/../tests/teardown.js",
    setupFiles: ["<rootDir>/../jest.setup.js"],
    setupFilesAfterEnv: ["<rootDir>/../tests/setup.js"],
    transform: {
      '^.+\\.ts$': 'ts-jest'
    },
    moduleFileExtensions: ['ts', 'js'],
    moduleNameMapper: {
      "^@/(.*)$": "<rootDir>/../src/$1",
      "^@types/(.*)$": "<rootDir>/../src/types/$1",
      "^@services/(.*)$": "<rootDir>/../src/services/$1"
    },
    moduleDirectories: ["node_modules", "src"],
    testPathIgnorePatterns: ["/node_modules/", "/dist/"],
    testMatch: ['**/*.test.ts', '**/*.test.js'],
    roots: ["<rootDir>/../tests", "<rootDir>/../src"],
    forceExit: true,
    detectOpenHandles: true
  };
  