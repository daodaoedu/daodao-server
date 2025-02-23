// models/UserProfile.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./user');

const UserProfile = sequelize.define('UserProfile', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: 'id',
    },
  },
  bio: {
    type: DataTypes.TEXT,
  },
  avatarUrl: {
    type: DataTypes.STRING,
  },
}, {
  timestamps: true,
});

module.exports = UserProfile;
