const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ProjectMarathon = sequelize.define('ProjectMarathon', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  project_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'project',
      key: 'id'
    }
  },
  marathon_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'marathon',
      key: 'id'
    }
  },
  eligibility_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'eligibility',
      key: 'id'
    }
  },
  project_registration_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
    defaultValue: 'Pending'
  },
  feedback: DataTypes.TEXT,
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'project_marathon',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['project_id', 'marathon_id']
    }
  ]
});

module.exports = ProjectMarathon; 