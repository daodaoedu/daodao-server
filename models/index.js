const { Sequelize } = require('sequelize');
const sequelize = require('../config/db');

// 導入所有模型
const User = require('./user');
const Role = require('./role');
const Permission = require('./permission');
const Position = require('./position');
const Location = require('./location');
const Area = require('./area');
const Contact = require('./contact');
const BasicInfo = require('./basicInfo');

const Project = require('./project');
const Milestone = require('./milestone');
const Task = require('./task');
const Review = require('./review');
const Note = require('./note');
const Outcome = require('./outcome');

const setupAssociations = () => {
  // 1. 用戶身份相關關聯
  User.belongsTo(Role, { 
    foreignKey: 'role_id', 
  });
  Role.hasMany(User, { 
    foreignKey: 'role_id',
  });

  User.belongsToMany(Permission, { 
    through: 'user_permissions',
    foreignKey: 'user_id',
    otherKey: 'permission_id',
  });
  Permission.belongsToMany(User, { 
    through: 'user_permissions',
    foreignKey: 'permission_id',
    otherKey: 'user_id',
  });

  User.belongsToMany(Position, {
    through: 'user_positions',
    foreignKey: 'user_id',
    otherKey: 'position_id',
  });
  Position.belongsToMany(User, {
    through: 'user_positions',
    foreignKey: 'position_id',
    otherKey: 'user_id',
  });

  // 2. 用戶資料相關關聯
  User.belongsTo(Location, { 
    foreignKey: 'location_id', 
  });
  Location.hasMany(User, { 
    foreignKey: 'location_id',
  });

  User.belongsTo(Area, { 
    foreignKey: 'location_id', 
  });
  Area.hasMany(User, { 
    foreignKey: 'location_id',
  });

  User.belongsTo(Contact, { 
    foreignKey: 'contact_id',
  });
  Contact.hasOne(User, { 
    foreignKey: 'contact_id',
  });

  User.belongsTo(BasicInfo, { 
    foreignKey: 'basic_info_id',
  });
  BasicInfo.hasOne(User, { 
    foreignKey: 'basic_info_id',
  });

  Location.belongsTo(Area, {
    foreignKey: 'area_id',
  });

  Area.hasMany(Location, {
    foreignKey: 'area_id',
  });

  // 3. 專案相關關聯
  User.hasMany(Project, { 
    foreignKey: 'user_id',
  });
  Project.belongsTo(User, { 
    foreignKey: 'user_id',
  });

  Project.hasMany(Milestone, { 
    foreignKey: 'project_id',
    onDelete: 'CASCADE'
  });
  Milestone.belongsTo(Project, { 
    foreignKey: 'project_id',
  });

  Project.hasMany(Review, { 
    foreignKey: 'project_id',
    onDelete: 'CASCADE'
  });
  Review.belongsTo(Project, { 
    foreignKey: 'project_id',
  });

  Project.hasMany(Note, { 
    foreignKey: 'project_id',
    onDelete: 'CASCADE'
  });
  Note.belongsTo(Project, { 
    foreignKey: 'project_id',
  });

  Project.hasMany(Outcome, { 
    foreignKey: 'project_id',
    onDelete: 'CASCADE'
  });
  Outcome.belongsTo(Project, { 
    foreignKey: 'project_id',
  });

  // 4. 里程碑和任務關聯
  Milestone.hasMany(Task, { 
    foreignKey: 'milestone_id',
    onDelete: 'CASCADE'
  });
  Task.belongsTo(Milestone, { 
    foreignKey: 'milestone_id',
  });
};

// 執行關聯設置
setupAssociations();

// 導出所有模型和 sequelize 實例
module.exports = {
  sequelize,
  Sequelize,
  User,
  Role,
  Permission,
  Position,
  Location,
  Area,
  Contact,
  BasicInfo,
  Project,
  Milestone,
  Task,
  Review,
  Note,
  Outcome
};