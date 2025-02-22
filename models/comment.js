const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Comment = sequelize.define('Comment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  post_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'post', key: 'id' },
    onDelete: 'CASCADE'
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
}, {
  tableName: 'comments',
  timestamps: true,
  underscored: true
});

module.exports = Comment;
