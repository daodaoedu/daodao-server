/**
 * Post Model
 * 發文模型 - 管理專案的發文（筆記、成果、評審）
 */

import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

// 發文類型枚舉
export const PostType = [
  'outcome',
  'note',
  'review'
] as const;

// 可見性枚舉
export const Visibility = [
  'public',
  'private'
] as const;

// 發文狀態枚舉
export const PostStatus = [
  'draft',
  'published'
] as const;

// 發文屬性介面
export interface PostAttributes {
  id: number;
  project_id: number;
  user_id: number;
  type: (typeof PostType)[number];
  week: number;
  title: string;
  date: Date;
  visibility: (typeof Visibility)[number];
  status: (typeof PostStatus)[number];
  created_at: Date;
  updated_at: Date;
}

// 發文創建屬性
export interface PostCreationAttributes extends Optional<PostAttributes, 
  'id' | 'visibility' | 'status' | 'created_at' | 'updated_at'> {}

// 發文模型類別
export class Post extends Model<PostAttributes, PostCreationAttributes> 
  implements PostAttributes {
  public id!: number;
  public project_id!: number;
  public user_id!: number;
  public type!: (typeof PostType)[number];
  public week!: number;
  public title!: string;
  public date!: Date;
  public visibility!: (typeof Visibility)[number];
  public status!: (typeof PostStatus)[number];
  public created_at!: Date;
  public updated_at!: Date;

  // 時間戳記
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// 初始化發文模型
Post.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  project_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'project',
      key: 'id'
    }
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM(...PostType),
    allowNull: false
  },
  week: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  visibility: {
    type: DataTypes.ENUM(...Visibility),
    defaultValue: 'private',
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM(...PostStatus),
    defaultValue: 'draft',
    allowNull: false
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false
  }
}, {
  sequelize,
  tableName: 'post',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default Post;