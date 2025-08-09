// jest.config.js
module.exports = {
    preset: 'ts-jest',
    testEnvironment: "node",
    collectCoverage: true,
    coverageProvider: 'babel',
    coverageDirectory: "coverage",
    coverageReporters: ['text', 'lcov', 'html', 'text-summary'],
    collectCoverageFrom: [
      'src/**/*.{ts,js}',
      '!src/**/*.d.ts',
      '!src/types/**/*',
      '!src/swagger/**/*',
      '!src/server.ts',
      '!src/**/*.test.{ts,js}'
    ],
    coveragePathIgnorePatterns: [
      '/node_modules/',
      '/dist/',
      '/coverage/',
      '/generated/',
      '/tests/'
    ],
    globalSetup: "<rootDir>/tests/globalSetup.js",
    globalTeardown: "<rootDir>/tests/globalTeardown.js",
    setupFiles: ["<rootDir>/jest.setup.js"],
    setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
    testEnvironment: "node",
    testEnvironmentOptions: {
      NODE_ENV: "test"
    },
    transform: {
      '^.+\\.ts$': ['ts-jest', {
        tsconfig: 'tsconfig.json',
        isolatedModules: false,
        diagnostics: {
          warnOnly: true
        }
      }]
    },
    moduleFileExtensions: ['ts', 'js'],
    moduleNameMapper: {
      "^@/(.*)$": "<rootDir>/src/$1",
      "^@types/(.*)$": "<rootDir>/src/types/$1",
      "^@services/(.*)$": "<rootDir>/src/services/$1",
      "^@middleware/(.*)$": "<rootDir>/src/middleware/$1",
      "^@utils/(.*)$": "<rootDir>/src/utils/$1",
      "^@models/(.*)$": "<rootDir>/src/models/$1",
      "^@controllers/(.*)$": "<rootDir>/src/controllers/$1",
      "^@generated/(.*)$": "<rootDir>/generated/$1",
      "^@tests/(.*)$": "<rootDir>/tests/$1"
    },
    moduleDirectories: ["node_modules", "src"],
    testPathIgnorePatterns: ["/node_modules/", "/dist/"],
    testMatch: ['**/*.test.ts', '**/*.test.js'],
    roots: ["tests", "src"],
    testTimeout: 30000,
    forceExit: true,
    detectOpenHandles: true,
    verbose: true
  };
  