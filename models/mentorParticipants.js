const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const MentorParticipants = sequelize.define('MentorParticipants', {
  mentor_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
    references: { model: 'users', key: 'id' },
    onDelete: 'CASCADE'
  },
  participant_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
    references: { model: 'users', key: 'id' },
    onDelete: 'CASCADE'
  }
}, {
  tableName: 'mentor_participants',
  timestamps: false,
  underscored: true

});

module.exports = MentorParticipants;
