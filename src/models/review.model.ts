/**
 * Review Model
 * 評審模型 - 管理專案的評審
 */

import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

// 心情枚舉
export const Mood = [
  'happy',
  'calm',
  'anxious',
  'tired',
  'frustrated'
] as const;

// 可見性枚舉
export const ReviewVisibility = [
  'public',
  'private'
] as const;

// 評審屬性介面
export interface ReviewAttributes {
  id: number;
  post_id: number;
  mood: (typeof Mood)[number];
  mood_description?: string;
  stress_level?: number;
  learning_review?: number;
  learning_feedback?: string;
  adjustment_plan?: string;
  visibility: (typeof ReviewVisibility)[number];
  created_at: Date;
  updated_at: Date;
}

// 評審創建屬性
export interface ReviewCreationAttributes extends Optional<ReviewAttributes, 
  'id' | 'visibility' | 'created_at' | 'updated_at'> {}

// 評審模型類別
export class Review extends Model<ReviewAttributes, ReviewCreationAttributes> 
  implements ReviewAttributes {
  public id!: number;
  public post_id!: number;
  public mood!: (typeof Mood)[number];
  public mood_description?: string;
  public stress_level?: number;
  public learning_review?: number;
  public learning_feedback?: string;
  public adjustment_plan?: string;
  public visibility!: (typeof ReviewVisibility)[number];
  public created_at!: Date;
  public updated_at!: Date;

  // 時間戳記
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// 初始化評審模型
Review.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  post_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'post',
      key: 'id'
    }
  },
  mood: {
    type: DataTypes.ENUM(...Mood),
    allowNull: false
  },
  mood_description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  stress_level: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 10
    }
  },
  learning_review: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 10
    }
  },
  learning_feedback: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  adjustment_plan: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  visibility: {
    type: DataTypes.ENUM(...ReviewVisibility),
    defaultValue: 'private',
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
  tableName: 'review',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default Review;