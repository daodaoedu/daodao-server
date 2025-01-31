const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const UserProject = sequelize.define('UserProject', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_external_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'external_id'
    },
    onDelete: 'CASCADE'
  },
  project_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'projects',
      key: 'id'
    },
    onDelete: 'CASCADE'
  }
}, {
  tableName: 'user_project', // 明确指定表名
  timestamps: false,         // 根据 SQL 表结构没有时间戳字段
  underscored: true          // 使用下划线命名风格
});

// 定义模型关联
UserProject.associate = function(models) {
  UserProject.belongsTo(models.User, {
    foreignKey: 'user_external_id',
    targetKey: 'external_id',
    as: 'user'
  });
  
  UserProject.belongsTo(models.Project, {
    foreignKey: 'project_id',
    targetKey: 'id',
    as: 'project'
  });
};

module.exports = UserProject;