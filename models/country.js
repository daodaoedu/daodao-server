const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Country = sequelize.define('Country', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  alpha2: {
    type: DataTypes.CHAR(2),
    allowNull: false,
    unique: true
  },
  alpha3: {
    type: DataTypes.CHAR(3),
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  }
}, {
  tableName: 'country',
  timestamps: false
});

module.exports = Country;