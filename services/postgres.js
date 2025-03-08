// services/postgres.js
const sequelize = require('../config/db');
const { QueryTypes } = require('sequelize');

module.exports = {
  postgresClient: sequelize,
  QueryTypes,
};
