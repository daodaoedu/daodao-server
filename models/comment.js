const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Comment = sequelize.define('Comment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  target_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  target_type: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      isIn: [['post', 'resource', 'note', 'outcome', 'review', 'circle', 'idea', 'portfolio']]
    }
  },
  target_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' },
    onDelete: 'CASCADE'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  visibility: {
    type: DataTypes.ENUM('public', 'private'),
    defaultValue: 'private'
  },
  parent_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'comments', key: 'id' },
    onDelete: 'CASCADE'
  },
  created_at: {
    type: DataTypes.DATE
  },
  updated_at: {
    type: DataTypes.DATE
  }
}, {
  tableName: 'comments',
  timestamps: true,
  underscored: true
});

module.exports = Comment;