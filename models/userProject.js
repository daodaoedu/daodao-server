const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const UserProject = sequelize.define('UserProject', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_external_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'external_id'
    },
    onDelete: 'CASCADE'
  },
  project_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'projects',
      key: 'id'
    },
    onDelete: 'CASCADE'
  }
}, {
  tableName: 'user_project', 
  timestamps: false,         
  underscored: true          
});

module.exports = UserProject;