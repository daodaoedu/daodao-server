// models/RolePermission.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Role = require('./role');
const Permission = require('./permission');

const RolePermission = sequelize.define('RolePermission', {
  roleId: {
    type: DataTypes.INTEGER,
    references: {
      model: Role,
      key: 'id',
    },
  },
  permissionId: {
    type: DataTypes.INTEGER,
    references: {
      model: Permission,
      key: 'id',
    },
  },
}, {
  timestamps: false,
});

module.exports = RolePermission;
