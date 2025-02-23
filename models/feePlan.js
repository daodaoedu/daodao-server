const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const FeePlan = sequelize.define('FeePlan', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  fee_plan_type: {
    type: DataTypes.ENUM('individual', 'enterprise', 'student', 'early_bird'),
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  discount: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: false
  }
}, {
  tableName: 'fee_plans',
  timestamps: true,
  underscored: true
});

module.exports = FeePlan; 