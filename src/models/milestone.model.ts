/**
 * Milestone Model
 * 里程碑模型 - 管理專案的里程碑
 */

import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

// 里程碑屬性介面
export interface MilestoneAttributes {
  id: number;
  project_id: string;
  position: number;
  name?: string;
  description?: string;
  start_date?: Date;
  end_date?: Date;
  is_completed: boolean;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
}

// 里程碑創建屬性
export interface MilestoneCreationAttributes extends Optional<MilestoneAttributes, 
  'id' | 'is_completed' | 'is_deleted' | 'created_at' | 'updated_at'> {}

// 里程碑模型類別
export class Milestone extends Model<MilestoneAttributes, MilestoneCreationAttributes> 
  implements MilestoneAttributes {
  public id!: number;
  public project_id!: string;
  public position!: number;
  public name?: string;
  public description?: string;
  public start_date?: Date;
  public end_date?: Date;
  public is_completed!: boolean;
  public is_deleted!: boolean;
  public created_at!: Date;
  public updated_at!: Date;

  // 時間戳記
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// 初始化里程碑模型
Milestone.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  project_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'project',
      key: 'id'
    }
  },
  position: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  start_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  end_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  is_completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  is_deleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
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
  tableName: 'milestone',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default Milestone;