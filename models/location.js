// models/Location.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Location = sequelize.define('Location', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

}, {
    tableName: "location",
  timestamps: false,
});

module.exports = Location;
