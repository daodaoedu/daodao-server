import { DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

/**
 * 實體標籤表欄位定義
 */
export interface EntityTagAttributes {
  id: number;
  entity_type: string;
  entity_id: number;
  tag_id: number;
  created_at: Date;
  created_by?: number;
}

/**
 * 建立實體標籤時的可選屬性
 */
export interface EntityTagCreationAttributes extends Optional<EntityTagAttributes, 'id' | 'created_at' | 'created_by'> {}

/**
 * 實體類型列舉
 */
export enum EntityType {
  RESOURCE = 'resource',
  IDEA = 'idea',
  PROJECT = 'project',
  PRACTICE = 'practice',
  CIRCLE = 'circle',
  USER = 'user'
}

/**
 * EntityTag 模型定義
 */
const EntityTag = sequelize.define(
  'EntityTag',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    entity_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        isIn: {
          args: [['resource', 'idea', 'project', 'practice', 'circle', 'user']],
          msg: 'Invalid entity type'
        }
      }
    },
    entity_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    tag_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tags',
        key: 'id'
      }
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  },
  {
    tableName: 'entity_tags',
    timestamps: true,
    underscored: true,
    paranoid: false,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      { fields: ['tag_id'] },
      { fields: ['created_at'] },
      { fields: ['entity_type', 'entity_id'] },
      { fields: ['entity_type', 'entity_id'], where: { entity_type: 'user' } },
      { unique: true, fields: ['entity_type', 'entity_id', 'tag_id'] }
    ]
  }
);

/**
 * 關聯設定將在 models/index.ts 中進行
 */

export default EntityTag;
