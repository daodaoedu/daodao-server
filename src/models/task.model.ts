/**
 * Task Model
 * 任務模型 - 管理里程碑的任務
 */

import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

// 星期枚舉
export const DaysOfWeek = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
] as const;

// 任務屬性介面
export interface TaskAttributes {
  id: number;
  milestone_id: number;
  position: number;
  name?: string;
  description?: string;
  days_of_week?: (typeof DaysOfWeek)[number][];
  is_completed: boolean;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
}

// 任務創建屬性
export interface TaskCreationAttributes extends Optional<TaskAttributes, 
  'id' | 'is_completed' | 'is_deleted' | 'created_at' | 'updated_at'> {}

// 任務模型類別
export class Task extends Model<TaskAttributes, TaskCreationAttributes> 
  implements TaskAttributes {
  public id!: number;
  public milestone_id!: number;
  public position!: number;
  public name?: string;
  public description?: string;
  public days_of_week?: (typeof DaysOfWeek)[number][];
  public is_completed!: boolean;
  public is_deleted!: boolean;
  public created_at!: Date;
  public updated_at!: Date;

  // 時間戳記
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// 初始化任務模型
Task.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  milestone_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'milestone',
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
  days_of_week: {
    type: DataTypes.ARRAY(DataTypes.ENUM(...DaysOfWeek)),
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
  tableName: 'task',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default Task;