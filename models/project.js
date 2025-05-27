const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Project = sequelize.define('Project', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  external_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    // unique: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  img_url: DataTypes.STRING,
  title: DataTypes.STRING,
  description: DataTypes.TEXT,
  motivation: {
    type: DataTypes.ARRAY(DataTypes.ENUM(
      'driven_by_curiosity',
      'interest_and_passion',
      'self_challenge',
      'personal_growth',
      'career_development',
      'pursuing_education_or_qualifications',
      'social_recognition',
      'exploring_possibilities',
      'preparing_for_the_future',
      'innovation_and_development',
      'practical_needs',
      'inspired_by_events',
      'interpersonal_connections',
      'life_changes',
      'impact_on_society',
      'influenced_by_a_group',
      'others'
    ))
  },
  motivation_description: DataTypes.TEXT,
  goal: DataTypes.STRING,
  content: DataTypes.TEXT,
  strategy: {
    type: DataTypes.ARRAY(DataTypes.ENUM(
      'data_collection_research_analysis',
      'book_reading',
      'watching_videos',
      'listening_to_podcasts',
      'examinations',
      'participating_in_competitions',
      'finding_study_partners',
      'joining_communities',
      'consulting_experts_and_scholars',
      'doing_projects',
      'initiating_actions',
      'field_internship',
      'organizing_events_or_courses',
      'attending_events_or_courses',
      'field_research',
      'conducting_interviews',
      'conducting_surveys',
      'others'
    ))
  },
  strategy_description: DataTypes.TEXT,
  resource: {
    type: DataTypes.TEXT,
  },
  outcome: {
    type: DataTypes.ARRAY(DataTypes.ENUM(
      'building_websites',
      'managing_social_media',
      'writing_research_reports',
      'artistic_creation',
      'initiating_projects_or_organizations',
      'making_videos',
      'organizing_events',
      'teaching_courses',
      'participating_in_competitions',
      'others'
    ))
  },
  outcome_description: DataTypes.TEXT,
  is_public: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  status: {
    type: DataTypes.ENUM('Ongoing', 'Completed', 'Not Started', 'Canceled'),
    defaultValue: 'Not Started'
  },
  start_date: DataTypes.DATE,
  end_date: DataTypes.DATE,
  interval: {
    type: DataTypes.INTEGER,
    validate: {
      min: 1
    }
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  created_by: DataTypes.INTEGER,
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_by: DataTypes.INTEGER,
  version: DataTypes.INTEGER
}, {
  tableName: 'project',
  timestamps: true,
  underscored: true
});

module.exports = Project;