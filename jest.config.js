module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Recycle suite workers instead of retaining every Prisma mock/module graph
  // in one process throughout the full suite (also bounded on CI runners).
  maxWorkers: 2,
  workerIdleMemoryLimit: '512MB',
  testMatch: [
    '<rootDir>/tests/**/*.test.(ts|js)',
    '<rootDir>/src/**/*.test.(ts|js)'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/'
  ],

  // ES modules support
  extensionsToTreatAsEsm: [],

  // Transform configuration
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      useESM: false,
      // Keep full program type checking in `pnpm run typecheck`. Building a
      // TypeScript language service per suite retains the large Prisma types.
      tsconfig: { isolatedModules: true }
    }]
  },

  // Allow transforming ES modules in faker
  transformIgnorePatterns: [
    'node_modules/(?!@faker-js/faker)'
  ],
  
  // Coverage
  collectCoverageFrom: [
    'src/**/*.{ts,js}',
    '!src/**/*.d.ts',
    '!src/types/**/*',
    '!src/swagger/**/*'
  ],
  
  // Module resolution
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1',
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  
  // Setup
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 10000,
  forceExit: true
};
