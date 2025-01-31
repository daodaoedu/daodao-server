const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Outcome = sequelize.define('Outcome', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  project_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'project',
      key: 'id'
    }
  },
  week: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  img_url: {
    type: DataTypes.STRING
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'outcome',
  timestamps: true,
  underscored: true
});

module.exports = Outcome;