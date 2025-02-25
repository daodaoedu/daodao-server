// jest.config.js
module.exports = {
    testEnvironment: "node",
    collectCoverage: true,
    coverageDirectory: "coverage",
    globalTeardown: "./tests/teardown.js"
  };
  