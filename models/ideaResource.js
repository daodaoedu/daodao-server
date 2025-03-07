const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const IdeaResource = sequelize.define('IdeaResource', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    idea_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'idea',
            key: 'id'
        }
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    url: {
        type: DataTypes.TEXT,
        allowNull: false
    },
}, {
    tableName: 'idea_resource',
    underscored: true,
    timestamps: true
});


module.exports = IdeaResource;
