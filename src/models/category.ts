import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

/**
 * 分類表欄位定義
 */
export interface CategoryAttributes {
  id: number;
  name: string;
  name_en?: string;
  parent_id?: number;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * 建立分類時的可選屬性
 */
export interface CategoryCreationAttributes extends Optional<CategoryAttributes, 'id' | 'name_en' | 'parent_id' | 'description' | 'created_at' | 'updated_at'> {}

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
      type: DataTypes.TEXT,
      allowNull: false,
    },
    name_en: {
      type: DataTypes.STRING(255),
      allowNull: true,
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
      { fields: ['name'] },
      { fields: ['name_en'] },
      { fields: ['parent_id'] }
    ]
  }
);

/**
 * 關聯設定將在 models/index.ts 中進行
 */

export default Category;