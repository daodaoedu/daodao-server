// models/Activity.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Circle = sequelize.define('Circle', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  external_id: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    defaultValue: DataTypes.UUIDV4
  },
  title: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  photo_url: {
    type: DataTypes.STRING(255),
  },
  photo_alt: {
    type: DataTypes.STRING(255),
  },
  // PostgreSQL 陣列欄位，這裡以文字陣列表示
  category: {
    type: DataTypes.ARRAY(DataTypes.STRING)
  },
  group_type: {
    type: DataTypes.ARRAY(DataTypes.STRING)
  },
  partner_education_step: {
    type: DataTypes.ARRAY(DataTypes.STRING)
  },
  description: {
    type: DataTypes.STRING(255)
  },
  // 若一個活動可屬於多個 city，則以陣列方式存放 city_id
  city_id: {
    type: DataTypes.ARRAY(DataTypes.INTEGER)
  },
  is_grouping: {
    type: DataTypes.BOOLEAN
  },
  created_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_date: {
    type: DataTypes.DATE,
  },
  time: {
    type: DataTypes.TEXT
  },
  partner_style: {
    type: DataTypes.TEXT
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  // 外鍵：活動建立者對應 User 的 id
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    // 關聯在 models/index.js 中定義
  },
  updated_at: {
    type: DataTypes.DATE,
  },
  updated_by: {
    type: DataTypes.STRING(255)
  },
  motivation: {
    type: DataTypes.TEXT
  },
  contents: {
    type: DataTypes.TEXT
  },
  expectation_result: {
    type: DataTypes.TEXT
  },
  notice: {
    type: DataTypes.TEXT
  },
  tag_list: {
    type: DataTypes.TEXT
  },
  group_deadline: {
    type: DataTypes.DATE,
  },
  hold_time: {
    type: DataTypes.TIME,
  },
  is_online: {
    type: DataTypes.BOOLEAN,
  },
  TBD: {
    type: DataTypes.BOOLEAN,
    field: 'tbd'
  }
}, {
  tableName: 'groups', // 對應原本的 groups 表
  timestamps: false,
  underscored: true,
});

module.exports = Circle;
