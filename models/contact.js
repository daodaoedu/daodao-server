const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Contact = sequelize.define('Contact', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  google_id: DataTypes.STRING,
  photo_url: DataTypes.TEXT,
  is_subscribe_email: DataTypes.BOOLEAN,
  email: DataTypes.STRING,
  ig: DataTypes.STRING,
  discord: DataTypes.STRING,
  line: DataTypes.STRING,
  fb: DataTypes.STRING
}, {
  tableName: 'contacts',
  timestamps: false
});

module.exports = Contact;