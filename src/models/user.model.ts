/**
 * 用戶模型
 * PostgreSQL 用戶表的 TypeScript 模型定義
 */

import { DataTypes, Model, Optional } from 'sequelize';
import { postgresClient } from '../services/database/postgres.service';

// 用戶屬性接口
interface UserAttributes {
  id: number;
  external_id: string;
  username?: string;
  password_hash?: string;
  nickname?: string;
  name?: string;
  email?: string;
  photo_url?: string;
  birth_date?: Date;
  gender?: string;
  location_id?: number;
  role_id: number;
  is_active: boolean;
  is_open_profile: boolean;
  is_open_location: boolean;
  email_verified: boolean;
  email_verified_at?: Date;
  password_reset_token?: string;
  password_reset_expires?: Date;
  last_login_at?: Date;
  mongo_id?: string;
  tag_list?: string[];
  language?: string;
  education_stage: string;
  contact_id?: number;
  basic_info_id?: number;
  created_by?: string;
  created_at: Date;
  updated_by?: string;
  updated_at: Date;
  deleted_at?: Date;
}

// 創建用戶時的可選屬性
interface UserCreationAttributes extends Optional<UserAttributes, 
  'id' | 'external_id' | 'role_id' | 'is_active' | 'is_open_profile' | 'is_open_location' | 
  'email_verified' | 'education_stage' | 'created_at' | 'updated_at'
> {}

// 用戶模型類
class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public external_id!: string;
  public username?: string;
  public password_hash?: string;
  public nickname?: string;
  public name?: string;
  public email?: string;
  public photo_url?: string;
  public birth_date?: Date;
  public gender?: string;
  public location_id?: number;
  public role_id!: number;
  public is_active!: boolean;
  public is_open_profile!: boolean;
  public is_open_location!: boolean;
  public email_verified!: boolean;
  public email_verified_at?: Date;
  public password_reset_token?: string;
  public password_reset_expires?: Date;
  public last_login_at?: Date;
  public mongo_id?: string;
  public tag_list?: string[];
  public language?: string;
  public education_stage!: string;
  public contact_id?: number;
  public basic_info_id?: number;
  public created_by?: string;
  public created_at!: Date;
  public updated_by?: string;
  public updated_at!: Date;
  public deleted_at?: Date;

  // 時間戳
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // 關聯屬性將由 Sequelize 在運行時添加
  // 這裡不預先定義類型，避免循環引用
}

// 初始化用戶模型
User.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  external_id: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    defaultValue: DataTypes.UUIDV4
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: true,
    unique: true
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  nickname: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING(254),
    allowNull: true,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  photo_url: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  birth_date: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  gender: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  location_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'location',
      key: 'id',
    },
  },
  role_id: { 
    type: DataTypes.INTEGER, 
    allowNull: false, 
    defaultValue: 2,
    references: { 
      model: "roles", 
      key: "id" 
    } 
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  is_open_profile: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  is_open_location: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  email_verified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  email_verified_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  password_reset_token: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  password_reset_expires: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  last_login_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  mongo_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true
  },
  tag_list: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
    allowNull: true,
    defaultValue: []
  },
  language: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  education_stage: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'other'
  },
  contact_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { 
      model: 'contacts', 
      key: 'id' 
    }
  },
  basic_info_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { 
      model: 'basic_info', 
      key: 'id' 
    }
  },
  created_by: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updated_by: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  deleted_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  sequelize: postgresClient,
  modelName: 'User',
  tableName: 'users',
  timestamps: true,
  underscored: true,
  paranoid: true,
  indexes: [
    {
      unique: true,
      fields: ['external_id']
    },
    {
      unique: true,
      fields: ['username']
    },
    {
      unique: true,
      fields: ['email']
    },
    {
      fields: ['role_id']
    },
    {
      fields: ['is_active']
    },
    {
      fields: ['email_verified']
    }
  ]
});

export { User, UserAttributes, UserCreationAttributes };
export default User;