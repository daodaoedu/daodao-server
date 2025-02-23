const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Eligibility = sequelize.define('Eligibility', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  reference_file_path: DataTypes.TEXT,
  partner_emails: DataTypes.ARRAY(DataTypes.TEXT),
  fee_plans_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'fee_plans',
      key: 'id'
    }
  }
}, {
  tableName: 'eligibility',
  timestamps: true,
  underscored: true
});

module.exports = Eligibility; 