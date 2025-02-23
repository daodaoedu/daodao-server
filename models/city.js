const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const City = sequelize.define('City', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'city',
  timestamps: false
});

module.exports = City;