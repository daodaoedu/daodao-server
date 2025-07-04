import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

/**
 * 資源表欄位定義
 */
export interface ResourceAttributes {
  id: number;
  external_id: string;
  name: string;
  url: string;
  image_url?: string;
  description: string;
  video_url?: string;
  type: string;
  cost: string;
  level: string;
  major_category_id?: number;
  sub_category_id?: number;
  created_by: number;
  status: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

/**
 * 建立資源時的可選屬性
 */
export interface ResourceCreationAttributes extends Optional<ResourceAttributes, 'id' | 'external_id' | 'image_url' | 'video_url' | 'major_category_id' | 'sub_category_id' | 'status' | 'created_at' | 'updated_at' | 'deleted_at'> {}

/**
 * Resource 模型實例類型
 */
export interface ResourceInstance extends Model<ResourceAttributes, ResourceCreationAttributes>, ResourceAttributes {
  get<K extends keyof ResourceAttributes>(key: K): ResourceAttributes[K];
  toJSON(): ResourceAttributes;
}

/**
 * Resource 模型定義
 */
const Resource = sequelize.define(
  'Resource',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    external_id: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      defaultValue: DataTypes.UUIDV4,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    url: {
      type: DataTypes.STRING(1000),
      allowNull: false,
    },
    image_url: {
      type: DataTypes.STRING(1000),
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    video_url: {
      type: DataTypes.STRING(1000),
      allowNull: true,
    },
    type: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        isIn: {
          args: [['learning_platform_app', 'learning_tools', 'books_articles', 'video_content', 
                  'podcast_content', 'workshops_courses', 'professional_certificates', 
                  'community_organization', 'other']],
          msg: 'Invalid resource type'
        }
      }
    },
    cost: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        isIn: {
          args: [['free', 'paid', 'partial_free']],
          msg: 'Invalid cost type'
        }
      }
    },
    level: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'all_levels',
      validate: {
        isIn: {
          args: [['beginner', 'intermediate', 'expert', 'all_levels']],
          msg: 'Invalid level type'
        }
      }
    },
    major_category_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'categories',
        key: 'id'
      }
    },
    sub_category_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'categories',
        key: 'id'
      }
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'active',
      validate: {
        isIn: {
          args: [['draft', 'active', 'archived', 'reported']],
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
    tableName: 'resources',
    timestamps: true,
    underscored: true,
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    indexes: [
      { fields: ['external_id'], unique: true },
      { fields: ['type'] },
      { fields: ['cost'] },
      { fields: ['created_by'] },
      { fields: ['created_at'] },
      { fields: ['level'] },
      { fields: ['type', 'cost', 'level'] }
    ]
  }
);

/**
 * 關聯設定將在 models/index.ts 中進行
 */

export default Resource;
