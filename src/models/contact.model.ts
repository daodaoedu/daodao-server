/**
 * 聯絡資訊模型
 * PostgreSQL 聯絡資訊表的 TypeScript 模型定義
 */

import { DataTypes, Model, Optional } from 'sequelize';
import { postgresClient } from '../services/database/postgres.service';

// 聯絡資訊屬性接口
interface ContactAttributes {
  id: number;
  user_id?: number;
  email: string;
  phone?: string;
  google_id?: string;
  photo_url?: string;
  is_subscribe_email: boolean;
  ig?: string;
  discord?: string;
  line?: string;
  fb?: string;
  created_at: Date;
  updated_at: Date;
}

// 創建聯絡資訊時的可選屬性
interface ContactCreationAttributes extends Optional<ContactAttributes, 
  'id' | 'is_subscribe_email' | 'created_at' | 'updated_at'
> {}

// 聯絡資訊模型類
class Contact extends Model<ContactAttributes, ContactCreationAttributes> implements ContactAttributes {
  public id!: number;
  public user_id?: number;
  public email!: string;
  public phone?: string;
  public google_id?: string;
  public photo_url?: string;
  public is_subscribe_email!: boolean;
  public ig?: string;
  public discord?: string;
  public line?: string;
  public fb?: string;
  public created_at!: Date;
  public updated_at!: Date;

  // 時間戳
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // 關聯屬性
  public readonly user?: unknown; // User model will be added by Sequelize associations
}

// 初始化聯絡資訊模型
Contact.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL'
  },
  email: {
    type: DataTypes.STRING(254),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      is: /^[+]?[1-9][\d]{0,15}$/i
    }
  },
  google_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true
  },
  photo_url: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  is_subscribe_email: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  ig: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  discord: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  line: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  fb: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize: postgresClient,
  modelName: 'Contact',
  tableName: 'contacts',
  timestamps: true,
  underscored: true,
  paranoid: false,
  indexes: [
    {
      unique: true,
      fields: ['email']
    },
    {
      unique: true,
      fields: ['google_id']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['phone']
    }
  ]
});

export { Contact, ContactAttributes, ContactCreationAttributes };
export default Contact;