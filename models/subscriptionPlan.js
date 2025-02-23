// models/SubscriptionPlan.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const SubscriptionPlan = sequelize.define('SubscriptionPlan', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
  },
  features: {
    type: DataTypes.JSONB,
  },
}, {
  timestamps: false,
});

module.exports = SubscriptionPlan;
