const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const BasicInfo = sequelize.define('BasicInfo', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  self_introduction: {
    type: DataTypes.TEXT,
  },
  share_list: {
    type: DataTypes.TEXT,
  },
  want_to_do_list: {
    type: DataTypes.ARRAY(DataTypes.STRING),
  }
}, {
  tableName: 'basic_info',
  timestamps: false
});

module.exports = BasicInfo;