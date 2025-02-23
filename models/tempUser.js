// models/TempUser.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const TempUser = sequelize.define('TempUser', {
  google_id: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  photo_url: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  created_date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    // 注意：Sequelize 不內建 TTL 機制，
    // 如需實現 1 小時後自動刪除，需額外建立排程任務
  },
  updated_date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  }
}, {
  tableName: 'temp_users',
  timestamps: true,
  underscored: true
});

module.exports = TempUser;