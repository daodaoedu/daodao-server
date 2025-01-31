const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Area = sequelize.define('Area', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  city: DataTypes.STRING
}, {
  tableName: 'area',
  timestamps: false
});

module.exports = Area;