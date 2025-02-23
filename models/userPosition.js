// models/UserPosition.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const UserPosition = sequelize.define('UserPosition', {
  user_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  position_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: 'positions',
      key: 'id'
    }
  }
}, {
  tableName: 'user_positions',
  timestamps: false,
  underscored: true
});

module.exports = UserPosition;
