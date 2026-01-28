// tests/teardown.js
const sequelize = require('../config/db');

module.exports = async function globalTeardown() {
  await sequelize.close();
};
