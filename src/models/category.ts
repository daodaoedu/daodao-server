import { DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

/**
 * 分類表欄位定義
 */
export interface CategoryAttributes {
  id: number;
  name: string;  // 分類唯一 key 值 (如: 'nature_environment', 'earth_science')
  parent_id?: number;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * 建立分類時的可選屬性
 */
export interface CategoryCreationAttributes extends Optional<CategoryAttributes, 'id' | 'parent_id' | 'description' | 'created_at' | 'updated_at'> {}

/**
 * Category 模型定義
 */
const Category = sequelize.define(
  'Category',
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
    parent_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'categories',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
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
    tableName: 'categories',
    timestamps: true,
    underscored: true,
    paranoid: false,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['name'], unique: true },
      { fields: ['parent_id'] }
    ]
  }
);

/**
 * 關聯設定將在 models/index.ts 中進行
 */

export default Category;