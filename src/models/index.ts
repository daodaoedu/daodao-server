/**
 * 模型索引和關聯設定
 * 本文件將所有 TypeScript 模型集中匯出，並設定模型之間的關聯關係
 */

import Resource from './resource';
import ResourceReview from './resource-review';
import Tag from './tag';
import EntityTag from './entity-tag';
import Category from './category';
import { createIdeaModel } from './idea';
import { createEntityResourceModel } from './entity-resource';
import User from './user.model';
import Contact from './contact.model';
import TempUser from './temp-user.model';
import Role from './role.model';
import Permission from './permission.model';
import UserRole from './user-role.model';
import RolePermission from './role-permission.model';
import Project from './project.model';
import Milestone from './milestone.model';
import Task from './task.model';
import Post from './post.model';
import Note from './note.model';
import Outcome from './outcome.model';
import Review from './review.model';
import sequelize from '@/config/database';

// 創建 Idea 模型實例
const Idea = createIdeaModel(sequelize);
// 創建 EntityResource 模型實例
const EntityResource = createEntityResourceModel(sequelize);

// 設定 TypeScript 模型之間的關聯關係
const setupTsModelAssociations = () => {
  // 此處設置所有 TypeScript 模型之間的關聯

  // User 與 Contact 的關聯
  User.hasOne(Contact, {
    foreignKey: 'user_id',
    as: 'contact'
  });
  
  Contact.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
  });

  // Resource 與 User 的關聯
  Resource.belongsTo(User, {
    foreignKey: 'created_by',
    as: 'author'
  });
  
  User.hasMany(Resource, {
    foreignKey: 'created_by',
    as: 'createdResources'
  });

  // ResourceReview 與 User 的關聯
  ResourceReview.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'author'
  });
  
  User.hasMany(ResourceReview, {
    foreignKey: 'user_id',
    as: 'reviews'
  });

  // Idea 與 User 的關聯
  Idea.belongsTo(User, {
    foreignKey: 'created_by',
    as: 'author'
  });
  
  User.hasMany(Idea, {
    foreignKey: 'created_by',
    as: 'ideas'
  });

  // Project 與 User 的關聯
  Project.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
  });
  
  User.hasMany(Project, {
    foreignKey: 'user_id',
    as: 'projects'
  });

  // Project 與 Milestone 的關聯
  Project.hasMany(Milestone, {
    foreignKey: 'project_id',
    as: 'milestones'
  });
  
  Milestone.belongsTo(Project, {
    foreignKey: 'project_id',
    as: 'project'
  });

  // Milestone 與 Task 的關聯
  Milestone.hasMany(Task, {
    foreignKey: 'milestone_id',
    as: 'tasks'
  });
  
  Task.belongsTo(Milestone, {
    foreignKey: 'milestone_id',
    as: 'milestone'
  });

  // Project 與 Post 的關聯
  Project.hasMany(Post, {
    foreignKey: 'project_id',
    as: 'posts'
  });
  
  Post.belongsTo(Project, {
    foreignKey: 'project_id',
    as: 'project'
  });

  // User 與 Post 的關聯
  Post.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
  });
  
  User.hasMany(Post, {
    foreignKey: 'user_id',
    as: 'posts'
  });

  // Post 與 Note 的關聯
  Post.hasOne(Note, {
    foreignKey: 'post_id',
    as: 'note'
  });
  
  Note.belongsTo(Post, {
    foreignKey: 'post_id',
    as: 'post'
  });

  // Post 與 Outcome 的關聯
  Post.hasOne(Outcome, {
    foreignKey: 'post_id',
    as: 'outcome'
  });
  
  Outcome.belongsTo(Post, {
    foreignKey: 'post_id',
    as: 'post'
  });

  // Post 與 Review 的關聯
  Post.hasOne(Review, {
    foreignKey: 'post_id',
    as: 'review'
  });
  
  Review.belongsTo(Post, {
    foreignKey: 'post_id',
    as: 'post'
  });

  // User 與 Role 的多對多關聯（透過 UserRole）
  User.belongsToMany(Role, {
    through: UserRole,
    foreignKey: 'user_id',
    otherKey: 'role_id',
    as: 'roles'
  });

  Role.belongsToMany(User, {
    through: UserRole,
    foreignKey: 'role_id',
    otherKey: 'user_id',
    as: 'users'
  });

  // Role 與 Permission 的多對多關聯（透過 RolePermission）
  Role.belongsToMany(Permission, {
    through: RolePermission,
    foreignKey: 'role_id',
    otherKey: 'permission_id',
    as: 'permissions'
  });

  Permission.belongsToMany(Role, {
    through: RolePermission,
    foreignKey: 'permission_id',
    otherKey: 'role_id',
    as: 'roles'
  });

  // UserRole 與 User, Role 的關聯
  UserRole.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
  });

  UserRole.belongsTo(Role, {
    foreignKey: 'role_id',
    as: 'role'
  });

  // RolePermission 與 Role, Permission 的關聯
  RolePermission.belongsTo(Role, {
    foreignKey: 'role_id',
    as: 'role'
  });

  RolePermission.belongsTo(Permission, {
    foreignKey: 'permission_id',
    as: 'permission'
  });

  // Resource 與 Category 的關聯
  Resource.belongsTo(Category, {
    foreignKey: 'major_category_id',
    as: 'majorCategory'
  });
  
  Resource.belongsTo(Category, {
    foreignKey: 'sub_category_id',
    as: 'subCategory'
  });
  
  Category.hasMany(Resource, {
    foreignKey: 'major_category_id',
    as: 'resourcesAsMajor'
  });
  
  Category.hasMany(Resource, {
    foreignKey: 'sub_category_id',
    as: 'resourcesAsSub'
  });

  // Category 自關聯（父子分類）
  Category.belongsTo(Category, {
    foreignKey: 'parent_id',
    as: 'parent'
  });
  
  Category.hasMany(Category, {
    foreignKey: 'parent_id',
    as: 'children'
  });

  // Tag 與 EntityTag 關聯
  Tag.hasMany(EntityTag, {
    foreignKey: 'tag_id',
    as: 'entityTags'
  });
  
  EntityTag.belongsTo(Tag, {
    foreignKey: 'tag_id',
    as: 'tag'
  });

  // Resource 與 Tag 的多對多關聯（透過 EntityTag）
  Resource.belongsToMany(Tag, {
    through: {
      model: EntityTag,
      unique: false
    },
    foreignKey: 'entity_id',
    otherKey: 'tag_id',
    as: 'tags',
    constraints: false
  });
  
  Tag.belongsToMany(Resource, {
    through: {
      model: EntityTag,
      unique: false
    },
    foreignKey: 'tag_id',
    otherKey: 'entity_id',
    as: 'resources',
    constraints: false
  });

  // ResourceReview 與 Tag 的多對多關聯（透過 EntityTag）
  ResourceReview.belongsToMany(Tag, {
    through: {
      model: EntityTag,
      unique: false
    },
    foreignKey: 'entity_id',
    otherKey: 'tag_id',
    as: 'tags',
    constraints: false
  });
  
  Tag.belongsToMany(ResourceReview, {
    through: {
      model: EntityTag,
      unique: false
    },
    foreignKey: 'tag_id',
    otherKey: 'entity_id',
    as: 'resourceReviews',
    constraints: false
  });

  // ResourceReview 與 Resource 的關聯
  Resource.hasMany(ResourceReview, {
    foreignKey: 'resource_id',
    as: 'reviews'
  });
  
  ResourceReview.belongsTo(Resource, {
    foreignKey: 'resource_id',
    as: 'resource'
  });

  // Idea 與 Tag 的多對多關聯（透過 EntityTag）
  Idea.belongsToMany(Tag, {
    through: {
      model: EntityTag,
      unique: false
    },
    foreignKey: 'entity_id',
    otherKey: 'tag_id',
    as: 'tags',
    constraints: false
  });
  
  Tag.belongsToMany(Idea, {
    through: {
      model: EntityTag,
      unique: false
    },
    foreignKey: 'tag_id',
    otherKey: 'entity_id',
    as: 'ideas',
    constraints: false
  });

  // EntityResource 與 Resource 的關聯
  EntityResource.belongsTo(Resource, {
    foreignKey: 'resource_id',
    as: 'resource'
  });
  
  Resource.hasMany(EntityResource, {
    foreignKey: 'resource_id',
    as: 'entityResources'
  });

  // Idea 與 Resource 的多對多關聯（透過 EntityResource）
  Idea.belongsToMany(Resource, {
    through: {
      model: EntityResource,
      unique: false
    },
    foreignKey: 'entity_id',
    otherKey: 'resource_id',
    as: 'resources',
    constraints: false
  });
  
  Resource.belongsToMany(Idea, {
    through: {
      model: EntityResource,
      unique: false
    },
    foreignKey: 'resource_id',
    otherKey: 'entity_id',
    as: 'ideas',
    constraints: false
  });
};

// 執行關聯設置（跳過測試環境）
if (process.env.NODE_ENV !== 'test') {
  setupTsModelAssociations();
}

// 為 TypeScript 使用提供類型安全的匯出
export {
  Resource,
  ResourceReview,
  Tag,
  EntityTag,
  Category,
  Idea,
  EntityResource,
  User,
  Contact,
  TempUser,
  Role,
  Permission,
  UserRole,
  RolePermission,
  Project,
  Milestone,
  Task,
  Post,
  Note,
  Outcome,
  Review
};

// 重新匯出類型定義
export type { TagAttributes } from './tag';

// 重新匯出類型定義
export type { UserAttributes } from './user.model';
export type { ContactAttributes } from './contact.model';
export type { TempUserAttributes } from './temp-user.model';
export type { RoleAttributes } from './role.model';
export type { PermissionAttributes } from './permission.model';
export type { UserRoleAttributes } from './user-role.model';
export type { RolePermissionAttributes } from './role-permission.model';
export type { ProjectAttributes } from './project.model';
export type { MilestoneAttributes } from './milestone.model';
export type { TaskAttributes } from './task.model';
export type { PostAttributes } from './post.model';
export type { NoteAttributes } from './note.model';
export type { OutcomeAttributes } from './outcome.model';
export type { ReviewAttributes } from './review.model';

// 提供預設匯出
const models = {
  Resource,
  ResourceReview,
  Tag,
  EntityTag,
  Category,
  Idea,
  EntityResource,
  User,
  Contact,
  TempUser,
  Role,
  Permission,
  UserRole,
  RolePermission,
  Project,
  Milestone,
  Task,
  Post,
  Note,
  Outcome,
  Review
};

export default models;
