module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.test.(ts|js)'],
  
  // ES modules support
  extensionsToTreatAsEsm: ['.ts'],
  
  // Transform configuration
  transform: {
    '^.+\\.(mt|t|cj|j)s$': [
      'ts-jest',
      {
        useESM: true
      }
    ]
  },
  
  // Allow transforming @faker-js/faker ES modules
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
  testTimeout: 10000
};
  