/**
 * 用戶角色關聯模型
 * 定義用戶與角色的多對多關係
 */

import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

// 用戶角色關聯介面
export interface UserRoleAttributes {
  id: number;
  user_id: number;
  role_id: number;
  granted_by?: number;
  granted_at: Date;
  expires_at?: Date;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UserRoleCreationAttributes extends Optional<UserRoleAttributes, 'id' | 'created_at' | 'updated_at'> {}

export class UserRole extends Model<UserRoleAttributes, UserRoleCreationAttributes> implements UserRoleAttributes {
  public id!: number;
  public user_id!: number;
  public role_id!: number;
  public granted_by?: number;
  public granted_at!: Date;
  public expires_at?: Date;
  public is_active!: boolean;
  public created_at!: Date;
  public updated_at!: Date;

  // 時間戳
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // 關聯屬性
  public readonly role?: unknown; // Role model will be added by Sequelize associations
  public readonly user?: unknown; // User model will be added by Sequelize associations
}

// 初始化用戶角色模型
UserRole.init(
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
        key: 'id',
      },
      comment: '用戶ID',
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
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '過期時間',
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
    modelName: 'UserRole',
    tableName: 'user_roles',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'role_id'],
      },
      {
        fields: ['user_id'],
      },
      {
        fields: ['role_id'],
      },
    ],
  }
);

export default UserRole;