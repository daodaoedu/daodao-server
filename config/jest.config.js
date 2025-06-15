// jest.config.js
module.exports = {
    testEnvironment: "node",
    collectCoverage: true,
    coverageDirectory: "coverage",
    globalTeardown: "./tests/teardown.js",
    setupFiles: ["<rootDir>/jest.setup.js"],
    moduleNameMapper: {
      "^@/(.*)$": "<rootDir>/src/$1",
      "^@types/(.*)$": "<rootDir>/src/types/$1",
      "^@services/(.*)$": "<rootDir>/src/services/$1"
    },
    moduleDirectories: ["node_modules", "src"],
    testPathIgnorePatterns: ["/node_modules/", "/dist/"],
    roots: ["<rootDir>"]
  };
  