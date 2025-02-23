const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Marathon = sequelize.define('Marathon', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  external_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    unique: true
  },
  event_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: DataTypes.TEXT,
  start_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  end_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  registration_status: {
    type: DataTypes.ENUM('Open', 'Closed', 'Pending', 'Full'),
    defaultValue: 'Pending'
  },
  people_number: DataTypes.INTEGER,
  registration_start_date: DataTypes.DATEONLY,
  registration_end_date: DataTypes.DATEONLY,
  is_public: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  created_by: DataTypes.INTEGER
}, {
  tableName: 'marathon',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['start_date']
    }
  ]
});

module.exports = Marathon; 