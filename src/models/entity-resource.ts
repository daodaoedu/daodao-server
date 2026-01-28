import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface EntityResourceAttributes {
  id: number;
  external_id: string;
  resource_id: number;
  entity_type: 'practice' | 'project' | 'idea';
  entity_id: string; // 支援 UUID 和數字 ID
  created_by: number;
  note: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface EntityResourceCreationAttributes extends Optional<EntityResourceAttributes, 'id' | 'external_id' | 'note' | 'created_at' | 'updated_at' | 'deleted_at'> {}

export class EntityResourceModel extends Model<EntityResourceAttributes, EntityResourceCreationAttributes> implements EntityResourceAttributes {
  public id!: number;
  public external_id!: string;
  public resource_id!: number;
  public entity_type!: 'practice' | 'project' | 'idea';
  public entity_id!: string;
  public created_by!: number;
  public note!: string | null;
  public created_at!: Date;
  public updated_at!: Date;
  public deleted_at!: Date | null;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt!: Date | null;
}

export const createEntityResourceModel = (sequelize: Sequelize) => {
  const EntityResource = sequelize.define<EntityResourceModel>('EntityResource', {
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
    resource_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'resources',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    entity_type: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: {
          args: [['practice', 'project', 'idea']],
          msg: 'Entity type must be one of: practice, project, idea',
        },
      },
    },
    entity_id: {
      type: DataTypes.STRING(36),
      allowNull: false,
      comment: '支援 UUID 和 INT 類型的ID',
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '使用者對此資源的備註',
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
  }, {
    tableName: 'entity_resources',
    timestamps: true,
    underscored: true,
    paranoid: true, // Enables soft delete
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    indexes: [
      {
        fields: ['resource_id'],
      },
      {
        fields: ['entity_type', 'entity_id'],
      },
      {
        fields: ['created_by'],
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
        unique: true,
        fields: ['resource_id', 'entity_type', 'entity_id'],
        name: 'unique_entity_resource',
      },
    ],
  });

  return EntityResource;
};

export default createEntityResourceModel;