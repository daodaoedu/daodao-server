import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface IdeaAttributes {
  id: number;
  external_id: string;
  user_id: number;
  content: string;
  status: 'active' | 'draft' | 'archived';
  has_resources: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  version: number;
}

export interface IdeaCreationAttributes extends Optional<IdeaAttributes, 'id' | 'external_id' | 'has_resources' | 'created_at' | 'updated_at' | 'deleted_at' | 'version'> {}

export class IdeaModel extends Model<IdeaAttributes, IdeaCreationAttributes> implements IdeaAttributes {
  public id!: number;
  public external_id!: string;
  public user_id!: number;
  public content!: string;
  public status!: 'active' | 'draft' | 'archived';
  public has_resources!: boolean;
  public created_at!: Date;
  public updated_at!: Date;
  public deleted_at!: Date | null;
  public version!: number;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt!: Date | null;
}

export const createIdeaModel = (sequelize: Sequelize) => {
  const Idea = sequelize.define<IdeaModel>('Idea', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    external_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      unique: true,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Content cannot be empty',
        },
        len: {
          args: [1, 5000],
          msg: 'Content must be between 1 and 5000 characters',
        },
      },
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'active',
      allowNull: false,
      validate: {
        isIn: {
          args: [['active', 'draft', 'archived']],
          msg: 'Status must be one of: active, draft, archived',
        },
      },
    },
    has_resources: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    version: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      allowNull: false,
    },
  }, {
    tableName: 'ideas',
    timestamps: true,
    underscored: true,
    paranoid: true, // Enables soft delete
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    indexes: [
      {
        fields: ['user_id'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['created_at'],
      },
      {
        fields: ['deleted_at'],
        where: {
          deleted_at: null,
        },
      },
      {
        fields: ['external_id'],
        unique: true,
      },
    ],
  });

  return Idea;
};

export default createIdeaModel;