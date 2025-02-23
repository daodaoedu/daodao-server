const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Review = sequelize.define('Review', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  post_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'post',
      key: 'id'
    }
  },
  mood: {
    type: DataTypes.ENUM('happy', 'calm', 'anxious', 'tired', 'frustrated'),
    allowNull: false
  },
  mood_description: DataTypes.TEXT,
  stress_level: {
    type: DataTypes.INTEGER,
    validate: {
      min: 1,
      max: 10
    }
  },
  learning_review: {
    type: DataTypes.INTEGER,
    validate: {
      min: 1,
      max: 10
    }
  },
  learning_feedback: DataTypes.TEXT,
  adjustment_plan: DataTypes.TEXT,
  visibility: {
    type: DataTypes.STRING,
    defaultValue: 'private',
    validate: {
      isIn: [['public', 'private']]
    }
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
  tableName: 'review',
  timestamps: true,
  underscored: true
});

module.exports = Review;
