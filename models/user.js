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
    defaultValue: DataTypes.UUIDV4
  },
  nickname: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  birth_date: {
    type: DataTypes.DATE,
  },
  gender: {
    type: DataTypes.STRING,
  },
  location_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'location',
      key: 'id',
    },
  },
  role_id: { 
    type: DataTypes.INTEGER, 
    allowNull: false, 
    defaultValue: 2,
    references: { model: "roles", key: "id" } 
  },
  is_open_profile: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  is_open_location: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  mongo_id: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: DataTypes.UUIDV4
  },
  tag_list: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
    allowNull: true,
    defaultValue: []
  }
}, 
{
  tableName: "users",
  timestamps: true,
  underscored: true,
  paranoid: false
});

module.exports = User;
