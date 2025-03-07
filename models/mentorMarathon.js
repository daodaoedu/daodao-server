// models/mentorMarathon.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const MentorMarathon = sequelize.define('MentorMarathon', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  mentor_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users', // 假設資料庫中的使用者資料表名稱為 "users"
      key: 'id'
    }
  },
  marathon_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'marathon', // 對應 marathon 資料表
      key: 'id'
    }
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  }
}, {
  tableName: 'mentor_marathon',
  timestamps: false, // 如需要自動管理 createdAt/updatedAt，可調整為 true 並移除手動定義的欄位
  underscored: true
});

module.exports = MentorMarathon;
