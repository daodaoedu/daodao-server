/**
 * 權限模型
 * 定義系統權限的資料結構
 */

import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

// 權限介面
export interface PermissionAttributes {
  id: number;
  name: string;
  resource: string;
  action: string;
  description?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface PermissionCreationAttributes extends Optional<PermissionAttributes, 'id' | 'created_at' | 'updated_at'> {}

export class Permission extends Model<PermissionAttributes, PermissionCreationAttributes> implements PermissionAttributes {
  public id!: number;
  public name!: string;
  public resource!: string;
  public action!: string;
  public description?: string;
  public is_active!: boolean;
  public created_at!: Date;
  public updated_at!: Date;

  // 時間戳
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// 初始化權限模型
Permission.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: '權限名稱',
    },
    resource: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '資源類型 (如: users, resources, tags)',
    },
    action: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '操作類型 (如: create, read, update, delete)',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '權限描述',
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: '是否啟用',
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'Permission',
    tableName: 'permissions',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['name'],
      },
      {
        fields: ['resource'],
      },
      {
        fields: ['action'],
      },
      {
        unique: true,
        fields: ['resource', 'action'],
      },
    ],
  }
);

export default Permission;