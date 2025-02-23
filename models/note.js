const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Note = sequelize.define('Note', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  post_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'post', key: 'id' }
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  image_urls: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
    defaultValue: []
  },
  video_urls: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
    defaultValue: []
  },
  visibility: {
    type: DataTypes.STRING,
    defaultValue: 'private',
    validate: { isIn: [['public', 'private']] }
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
  tableName: 'note',
  timestamps: true,
  underscored: true
});

module.exports = Note;
