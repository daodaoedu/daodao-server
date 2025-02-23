const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Task = sequelize.define('Task', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  milestone_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'milestone',
      key: 'id'
    }
  },
  name: DataTypes.STRING,
  description: DataTypes.TEXT,
  days_of_week: {
    type: DataTypes.ARRAY(DataTypes.ENUM(
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday'
    ))
  },
  is_completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  is_deleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
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
  tableName: 'task',
  timestamps: true,
  underscored: true
});

module.exports = Task;