const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Idea = sequelize.define('Idea', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    external_id: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        defaultValue: DataTypes.UUIDV4
      },
    title: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    image_urls: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        allowNull: true
    },
    video_urls: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        allowNull: true
    },
    visibility: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: 'private',
        validate: {
            isIn: [['public', 'private']]
        }
    }
}, {
    tableName: 'idea',
    underscored: true,
    timestamps: true
});

module.exports = Idea;
