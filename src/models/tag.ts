import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

/**
 * 標籤表欄位定義
 */
export interface TagAttributes {
  id: number;
  name: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * 建立標籤時的可選屬性
 */
export interface TagCreationAttributes extends Optional<TagAttributes, 'id' | 'created_at' | 'updated_at'> {}

/**
 * Tag 模型定義
 */
const Tag = sequelize.define(
  'Tag',
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
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    }
  },
  {
    tableName: 'tags',
    timestamps: true,
    underscored: true,
    paranoid: false,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { unique: true, fields: ['name'] }
    ]
  }
);

/**
 * 關聯設定將在 models/index.ts 中進行
 */

export default Tag;
