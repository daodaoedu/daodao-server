/**
 * 角色權限關聯模型
 * 定義角色與權限的多對多關係
 */

import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

// 角色權限關聯介面
export interface RolePermissionAttributes {
  id: number;
  role_id: number;
  permission_id: number;
  granted_by?: number;
  granted_at: Date;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface RolePermissionCreationAttributes extends Optional<RolePermissionAttributes, 'id' | 'created_at' | 'updated_at'> {}

export class RolePermission extends Model<RolePermissionAttributes, RolePermissionCreationAttributes> implements RolePermissionAttributes {
  public id!: number;
  public role_id!: number;
  public permission_id!: number;
  public granted_by?: number;
  public granted_at!: Date;
  public is_active!: boolean;
  public created_at!: Date;
  public updated_at!: Date;

  // 時間戳
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// 初始化角色權限模型
RolePermission.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'roles',
        key: 'id',
      },
      comment: '角色ID',
    },
    permission_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'permissions',
        key: 'id',
      },
      comment: '權限ID',
    },
    granted_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      comment: '授權者ID',
    },
    granted_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: '授權時間',
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
    modelName: 'RolePermission',
    tableName: 'role_permissions',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['role_id', 'permission_id'],
      },
      {
        fields: ['role_id'],
      },
      {
        fields: ['permission_id'],
      },
    ],
  }
);

export default RolePermission;