// models/User.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  external_id: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    defaultValue: DataTypes.UUIDV4 // 添加自动生成UUIDv4
  },
  nickname: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  birthDate: {
    type: DataTypes.DATE,
  },
  gender: {
    type: DataTypes.STRING,
  },
  locationId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'location',
      key: 'id',
    },
  },
  roleId: { 
    type: DataTypes.INTEGER, 
    allowNull: false, 
    defaultValue: 2,
    references: { model: "roles", key: "id" } 
  },
  isOpenProfile: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  isOpenLocation: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  mongo_id: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: DataTypes.UUIDV4
  },
  tag_list: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: ''
  }
}, 
{
  tableName: "users",
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at', 
  paranoid: false
});

module.exports = User;
