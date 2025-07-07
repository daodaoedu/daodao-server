/**
 * Project Model
 * 專案模型 - 管理使用者的學習專案
 */

import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

// 專案動機枚舉
export const ProjectMotivation = [
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
] as const;

// 專案策略枚舉
export const ProjectStrategy = [
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
] as const;

// 專案成果枚舉
export const ProjectOutcome = [
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
] as const;

// 專案狀態枚舉
export const ProjectStatus = [
  'Ongoing',
  'Completed',
  'Not Started',
  'Canceled'
] as const;

// 專案屬性介面
export interface ProjectAttributes {
  id: number;
  external_id: string;
  user_id: number;
  img_url?: string;
  title?: string;
  description?: string;
  motivation?: (typeof ProjectMotivation)[number][];
  motivation_description?: string;
  goal?: string;
  content?: string;
  strategy?: (typeof ProjectStrategy)[number][];
  strategy_description?: string;
  resource?: string;
  outcome?: (typeof ProjectOutcome)[number][];
  outcome_description?: string;
  is_public: boolean;
  status: (typeof ProjectStatus)[number];
  start_date?: Date;
  end_date?: Date;
  interval?: number;
  created_at: Date;
  created_by?: number;
  updated_at: Date;
  updated_by?: number;
  version?: number;
}

// 專案創建屬性
export interface ProjectCreationAttributes extends Optional<ProjectAttributes, 
  'id' | 'external_id' | 'is_public' | 'status' | 'created_at' | 'updated_at'> {}

// 專案模型類別
export class Project extends Model<ProjectAttributes, ProjectCreationAttributes> 
  implements ProjectAttributes {
  public id!: number;
  public external_id!: string;
  public user_id!: number;
  public img_url?: string;
  public title?: string;
  public description?: string;
  public motivation?: (typeof ProjectMotivation)[number][];
  public motivation_description?: string;
  public goal?: string;
  public content?: string;
  public strategy?: (typeof ProjectStrategy)[number][];
  public strategy_description?: string;
  public resource?: string;
  public outcome?: (typeof ProjectOutcome)[number][];
  public outcome_description?: string;
  public is_public!: boolean;
  public status!: (typeof ProjectStatus)[number];
  public start_date?: Date;
  public end_date?: Date;
  public interval?: number;
  public created_at!: Date;
  public created_by?: number;
  public updated_at!: Date;
  public updated_by?: number;
  public version?: number;

  // 時間戳記
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// 初始化專案模型
Project.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  external_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  img_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  motivation: {
    type: DataTypes.ARRAY(DataTypes.ENUM(...ProjectMotivation)),
    allowNull: true
  },
  motivation_description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  goal: {
    type: DataTypes.STRING,
    allowNull: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  strategy: {
    type: DataTypes.ARRAY(DataTypes.ENUM(...ProjectStrategy)),
    allowNull: true
  },
  strategy_description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  resource: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  outcome: {
    type: DataTypes.ARRAY(DataTypes.ENUM(...ProjectOutcome)),
    allowNull: true
  },
  outcome_description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  is_public: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM(...ProjectStatus),
    defaultValue: 'Not Started',
    allowNull: false
  },
  start_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  end_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  interval: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1
    }
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false
  },
  updated_by: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  version: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  sequelize,
  tableName: 'project',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default Project;