/**
 * Resource 相關類型定義
 */

import { UserBasicInfo } from './common.types';

/**
 * 資料庫中的 Resource 模型
 */
export interface ResourceDbModel {
  id: number;
  external_id: string;
  name: string;
  url: string;
  image_url: string | null;
  description: string;
  video_url: string | null;
  type: string;
  level: string;
  cost: string;
  status: string;
  created_by: number;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date | null;
}

/**
 * API 回應的 Resource 格式
 * 注意：使用 external_id 作為前端識別符，不暴露內部 id
 */
export interface ResourceResponse {
  id: string; // 使用 external_id，對前端來說就是 id
  name: string;
  url: string;
  imageUrl: string | null;
  description: string;
  videoUrl: string | null;
  type: string;
  level: string;
  cost: string;
  status: string;
  avgRating: number | null;
  majorCategory: string | null;
  subCategory: string | null;
  user: UserBasicInfo;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  favoriteCount: number;
  shareCount: number;
  reviewCount: number;
  likeCount: number;
}

/**
 * 創建 Resource 的 DTO
 */
export interface CreateResourceDto {
  name: string;
  url: string;
  imageUrl?: string | null;
  description: string;
  videoUrl?: string | null;
  type: string;
  level: string;
  cost: string;
  categoryId?: number;
  tags?: string[];
}

/**
 * 更新 Resource 的 DTO
 */
export interface UpdateResourceDto {
  name?: string;
  url?: string;
  imageUrl?: string | null;
  description?: string;
  videoUrl?: string | null;
  type?: string;
  level?: string;
  cost?: string;
  categoryId?: number;
  tags?: string[];
}

// Resource type enumeration
export type ResourceType = 'course' | 'book' | 'video' | 'article' | 'tool' | 'other';

// Cost type enumeration  
export type CostType = 'free' | 'paid' | 'freemium';

// Level type enumeration
export type LevelType = 'beginner' | 'intermediate' | 'advanced';

// Resource status enumeration
export type ResourceStatus = 'draft' | 'active' | 'archived';
