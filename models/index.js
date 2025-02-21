const { Sequelize } = require('sequelize');
const sequelize = require('../config/db');

// 導入所有模型
const User = require('./user');
const Role = require('./role');
const Permission = require('./permission');
const Position = require('./position');
const Location = require('./location');
const City = require('./city');
const Country = require('./country');
const Contact = require('./contact');
const BasicInfo = require('./basicInfo');
const UserProject = require('./userProject');

const Project = require('./project');
const Post = require('./post');
const Milestone = require('./milestone');
const Task = require('./task');
const Review = require('./review');
const Note = require('./note');
const Outcome = require('./outcome');

const ProjectMarathon = require('./projectMarathon');
const Eligibility = require('./eligibility');
const Marathon = require('./marathon');
const FeePlan = require('./feePlan');
const Circle = require('./circle');

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
  Location.belongsTo(City, {
    foreignKey: 'city_id',
  });
  City.hasMany(Location, {
    foreignKey: 'city_id',
  });
  Location.belongsTo(Country, {
    foreignKey: 'country_id',
  });
  Country.hasMany(Location, {
    foreignKey: 'country_id',
  });

  // 3. 專案相關關聯
  User.hasMany(Project, {
    foreignKey: 'user_id',
  });

  User.belongsToMany(Project, {
    through: "user_projects",
    foreignKey: 'user_id',
    otherKey: 'project_id',
  });

  Project.belongsTo(User, {
    foreignKey: 'user_id'
  });

  UserProject.belongsTo(User, {
    foreignKey: 'user_external_id',
    targetKey: 'external_id',
  });

  UserProject.belongsTo(Project, {
    foreignKey: 'project_id',
    targetKey: 'id',
  });

  Project.hasMany(Milestone, { 
    foreignKey: 'project_id',
    onDelete: 'CASCADE'
  });
  Milestone.belongsTo(Project, { 
    foreignKey: 'project_id',
  });

  Post.hasMany(Review, { 
    foreignKey: 'post_id',
    onDelete: 'CASCADE'
  });
  Review.belongsTo(Post, { 
    foreignKey: 'post_id',
  });

  Post.hasMany(Note, { 
    foreignKey: 'post_id',
    onDelete: 'CASCADE'
  });
  Note.belongsTo(Post, { 
    foreignKey: 'post_id',
  });

  Post.hasMany(Outcome, { 
    foreignKey: 'post_id',
    onDelete: 'CASCADE'
  });
  Outcome.belongsTo(Post, { 
    foreignKey: 'post_id',
  });

  // 4. 里程碑和任務關聯
  Milestone.hasMany(Task, { 
    foreignKey: 'milestone_id',
    onDelete: 'CASCADE'
  });
  Task.belongsTo(Milestone, { 
    foreignKey: 'milestone_id',
  });

  // 5. 專案馬拉松關聯
  ProjectMarathon.belongsTo(Project, {
    foreignKey: 'project_id',
    as: 'project'
  });
  
  Project.hasMany(ProjectMarathon, {
    foreignKey: 'project_id',
  });

  ProjectMarathon.belongsTo(Marathon, {
    foreignKey: 'marathon_id',
  });

  ProjectMarathon.belongsTo(Eligibility, {
    foreignKey: 'eligibility_id',
  });

  // 马拉松关联
  Marathon.belongsTo(User, {
    foreignKey: 'created_by',
  });

  // 资格关联
  Eligibility.belongsTo(FeePlan, {
    foreignKey: 'fee_plans_id',
  });

  // 反向关联
  Project.hasMany(ProjectMarathon, {
    foreignKey: 'project_id',
  });

  Marathon.hasMany(ProjectMarathon, {
    foreignKey: 'marathon_id',
  });

  FeePlan.hasMany(Eligibility, {
    foreignKey: 'fee_plans_id',
  });
  
  User.hasMany(Circle, { foreignKey: 'created_by' });

  Circle.belongsTo(User, { foreignKey: 'created_by' });

  
  // 6. Post 與 Comment 的關聯
  Post.hasMany(Comment, { foreignKey: 'post_id', onDelete: 'CASCADE' });
  Comment.belongsTo(Post, { foreignKey: 'post_id' });
  User.hasMany(Comment, { foreignKey: 'user_id', onDelete: 'CASCADE' });
  Comment.belongsTo(User, { foreignKey: 'user_id' });

  // 7. 導師與參與者關聯（MentorParticipants）
  // 建立 User 與 User 之間的多對多關聯，分別以 'Participants' 與 'Mentors' 為別名
  User.belongsToMany(User, {
    as: 'Participants',
    through: MentorParticipants,
    foreignKey: 'mentor_id',
    otherKey: 'participant_id'
  });
  User.belongsToMany(User, {
    as: 'Mentors',
    through: MentorParticipants,
    foreignKey: 'participant_id',
    otherKey: 'mentor_id'
  });
};

// 執行關聯設置
setupAssociations();

// 導出所有模型和 sequelize 實例
module.exports = {
  sequelize,
  Sequelize,
  User,
  UserProject,
  Role,
  Permission,
  Position,
  Location,
  City,
  Country,
  Contact,
  BasicInfo,
  Project,
  Post,
  Milestone,
  Task,
  Review,
  Note,
  Outcome,
  ProjectMarathon,
  Eligibility,
  Marathon,
  FeePlan,
  Circle,
  Comment,
  MentorParticipants
};
