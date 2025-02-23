// models/Role.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Permission = require('./permission');

const Role = sequelize.define('Role', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
    tableName: "roles",
  timestamps: false,
});


module.exports = Role;
