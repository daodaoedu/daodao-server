/**
 * Outcome Model
 * 成果模型 - 管理專案的成果
 */

import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

// 可見性枚舉
export const OutcomeVisibility = [
  'public',
  'private'
] as const;

// 成果屬性介面
export interface OutcomeAttributes {
  id: number;
  post_id: number;
  content: string;
  image_urls: string[];
  video_urls: string[];
  visibility: (typeof OutcomeVisibility)[number];
  created_at: Date;
  updated_at: Date;
}

// 成果創建屬性
export interface OutcomeCreationAttributes extends Optional<OutcomeAttributes, 
  'id' | 'image_urls' | 'video_urls' | 'visibility' | 'created_at' | 'updated_at'> {}

// 成果模型類別
export class Outcome extends Model<OutcomeAttributes, OutcomeCreationAttributes> 
  implements OutcomeAttributes {
  public id!: number;
  public post_id!: number;
  public content!: string;
  public image_urls!: string[];
  public video_urls!: string[];
  public visibility!: (typeof OutcomeVisibility)[number];
  public created_at!: Date;
  public updated_at!: Date;

  // 時間戳記
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// 初始化成果模型
Outcome.init({
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
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  image_urls: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
    defaultValue: [],
    allowNull: false
  },
  video_urls: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
    defaultValue: [],
    allowNull: false
  },
  visibility: {
    type: DataTypes.ENUM(...OutcomeVisibility),
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
  tableName: 'outcome',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default Outcome;