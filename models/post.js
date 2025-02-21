const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Post = sequelize.define('Post', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  study_plan_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'project', key: 'id' }
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { isIn: [['outcome', 'note', 'review']] }
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  visibility: {
    type: DataTypes.STRING,
    defaultValue: 'private',
    validate: { isIn: [['public', 'private']] }
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'draft',
    validate: { isIn: [['draft', 'published']] }
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
  tableName: 'post',
  timestamps: false,
  underscored: true
});

module.exports = Post;