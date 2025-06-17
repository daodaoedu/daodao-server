import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { TimeUsage } from '../types/resourceReview.types';
import { ReviewStatus } from '../types/common.types';

/**
 * 資源心得評價表欄位定義
 */
export interface ResourceReviewAttributes {
  id: number;
  user_id: number;
  resource_id: number;
  content: string;
  
  // 評分欄位 (1-5分，支援 0.5 分間距)
  score_impact: number;
  score_mindset: number;
  score_problems: number;
  score_perspectives: number;
  score_goals: number;
  
  // 內容特色（9個 Boolean 欄位）
  well_structured: boolean;
  practice_focused: boolean;
  well_rounded_concepts: boolean;
  thought_provoking: boolean;
  progressive_learning: boolean;
  problem_based: boolean;
  real_world_examples: boolean;
  interactive: boolean;
  visually_rich: boolean;
  
  // 時間運用（單選）
  time_usage: string;
  
  // 資源搭配使用（6個 Boolean 欄位）
  with_online_courses: boolean;
  with_books: boolean;
  with_other_tools: boolean;
  with_community: boolean;
  only_this_resource: boolean;
  not_applicable_resource: boolean;
  
  // 狀態管理
  status: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

/**
 * 建立心得評價時的可選屬性
 */
export interface ResourceReviewCreationAttributes extends Optional<ResourceReviewAttributes, 
  'id' | 'well_structured' | 'practice_focused' | 'well_rounded_concepts' | 'thought_provoking' | 
  'progressive_learning' | 'problem_based' | 'real_world_examples' | 'interactive' | 'visually_rich' | 
  'with_online_courses' | 'with_books' | 'with_other_tools' | 'with_community' | 'only_this_resource' | 
  'not_applicable_resource' | 'status' | 'created_at' | 'updated_at' | 'deleted_at'> {}

/**
 * ResourceReview 模型實例類型
 */
export interface ResourceReviewInstance extends Model<ResourceReviewAttributes, ResourceReviewCreationAttributes>, ResourceReviewAttributes {
  get<K extends keyof ResourceReviewAttributes>(key: K): ResourceReviewAttributes[K];
  get(key: string): unknown;
  toJSON(): ResourceReviewAttributes;
}

/**
 * ResourceReview 模型定義
 */
const ResourceReview = sequelize.define(
  'ResourceReview',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    resource_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'resources',
        key: 'id'
      }
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    
    // 評分欄位 (1-5分，支援 0.5 分間距)
    score_impact: {
      type: DataTypes.DECIMAL(2, 1),
      allowNull: false,
      validate: {
        min: 1.0,
        max: 5.0,
        isDecimal: true
      }
    },
    score_mindset: {
      type: DataTypes.DECIMAL(2, 1),
      allowNull: false,
      validate: {
        min: 1.0,
        max: 5.0,
        isDecimal: true
      }
    },
    score_problems: {
      type: DataTypes.DECIMAL(2, 1),
      allowNull: false,
      validate: {
        min: 1.0,
        max: 5.0,
        isDecimal: true
      }
    },
    score_perspectives: {
      type: DataTypes.DECIMAL(2, 1),
      allowNull: false,
      validate: {
        min: 1.0,
        max: 5.0,
        isDecimal: true
      }
    },
    score_goals: {
      type: DataTypes.DECIMAL(2, 1),
      allowNull: false,
      validate: {
        min: 1.0,
        max: 5.0,
        isDecimal: true
      }
    },
    
    // 內容特色（9個 Boolean 欄位）
    well_structured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    practice_focused: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    well_rounded_concepts: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    thought_provoking: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    progressive_learning: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    problem_based: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    real_world_examples: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    interactive: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    visually_rich: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    
    // 時間運用（單選）
    time_usage: {
      type: DataTypes.STRING(30),
      allowNull: false,
      validate: {
        isIn: {
          args: [['1_2_hours_daily', 'few_intensive_days_week', 'spare_moments', 'not_applicable_time']],
          msg: 'Invalid time usage type'
        }
      }
    },
    
    // 資源搭配使用（6個 Boolean 欄位）
    with_online_courses: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    with_books: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    with_other_tools: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    with_community: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    only_this_resource: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    not_applicable_resource: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    
    // 狀態管理
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'published',
      validate: {
        isIn: {
          args: [['draft', 'published', 'archived', 'reported']],
          msg: 'Invalid status'
        }
      }
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    }
  },
  {
    tableName: 'resource_review',
    timestamps: true,
    underscored: true,
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    indexes: [
      { fields: ['resource_id'] },
      { fields: ['user_id'] },
      { unique: true, fields: ['user_id', 'resource_id'] }
    ]
  }
);

/**
 * 關聯設定將在 models/index.ts 中進行
 */

export default ResourceReview;
