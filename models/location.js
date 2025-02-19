// models/Location.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const City = require('./city');
const Country = require('./country');

const Location = sequelize.define('Location', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  isTaiwan: {
    type: DataTypes.BOOLEAN
  }
}, {
    tableName: "location",
  timestamps: false,
});

module.exports = Location;
