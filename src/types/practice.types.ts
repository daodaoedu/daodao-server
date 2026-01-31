/**
 * Practice system type definitions
 * 
 * This file contains comprehensive TypeScript interfaces and types for the practice system,
 * including core practice interfaces, request/response types, and service method parameters.
 * Based on practice-api-v1.md specification.
 */

import { Request, Response } from 'express';

// Core enums and basic types - 基於 Prisma schema
export type PracticeStatus = 'draft' | 'not_started' | 'active' | 'completed' | 'archived';
export type CheckInMood = 'give_up' | 'frustrated' | 'bored' | 'neutral' | 'good' | 'happy';
export type PracticeTimePeriod = 'morning' | 'afternoon' | 'evening' | 'night';
export type SortField = 'createdAt' | 'updatedAt' | 'likeCount';
export type SortOrder = 'asc' | 'desc';
export type EventType = 'practice';

// @deprecated - 以下類型保留向後兼容，但已不在 DB schema 中使用
export type ContentType = 'book' | 'video' | 'articles' | 'podcast' | 'course' | 'custom' | 'other';
export type DailyGoalType = 'time' | 'completion' | 'amount';

/** @deprecated - DailyGoal 已不在 DB schema 中使用 */
export interface DailyGoal {
  type: DailyGoalType;
  timeMinutes?: number;
  amount?: number;
  unit?: string;
}

// Practice resource interface
export interface PracticeResource {
  id: number;
  name: string;
  url?: string;
}

import { UserSimpleInfo } from './common.types';

// Practice progress configuration
export interface PracticeProgressConfig {
  frequencyMinDays: number;
  frequencyMaxDays: number;
  durationDays: number;
}

// Practice resource response interface
export interface PracticeResourceEntity {
  id: string;
  name: string;
  url?: string;
}

// Core practice entity interface - 基於 Prisma schema practices 表
export interface PracticeEntity {
  id: string;
  title: string;
  practiceAction?: string;
  startDate?: string;
  endDate?: string;
  durationDays?: number;
  frequencyMinDays?: number;
  frequencyMaxDays?: number;
  sessionDurationMinutes?: number;
  practiceTimePeriods: string[];
  otherContext?: string;
  status: PracticeStatus;
  hasResources: boolean;
  resources?: PracticeResourceEntity[];
  progressPercentage?: number;
  firstCheckinAt?: string;
  lastCheckinAt?: string;
  checkInCount: number;
  themeColor?: string;
  createdAt: string;
  updatedAt?: string;
  user: UserSimpleInfo;
  tags: string[];
  stats: {
    likeCount: number;
    viewCount: number;
    favoriteCount: number;
    shareCount: number;
    commentCount: number;
  };
  checkIns?: CheckInEntity[];
}

// Check-in entity interface - 基於 Prisma schema practice_checkins 表
export interface CheckInEntity {
  id: number;
  practiceId: number;
  userId: number;
  checkinDate: string;
  mood?: CheckInMood;
  note?: string;
  imageUrls: string[];
  ogImageUrl: string | null;
  tags: string[];
  createdAt: string;
  updatedAt?: string;
}

// Check-in response with encouragement message
export interface CheckInResponseWithEncouragement extends CheckInEntity {
  encouragement: string;
  practiceProgressPercentage: number;
  practiceStatus: PracticeStatus;
  isFirstCheckIn: boolean;
  hasReachedTarget: boolean;
}

// 從統一響應類型文件導入
import type {
  PaginationInfo
} from './api-response.types';

// Practice statistics interface
export interface PracticeStats {
  totalPractices: number;
  activePractices: number;
  completedPractices: number;
  totalCheckIns: number;
  averageStreak: number;
  maxStreak: number;
}

// Request interfaces - 基於 Prisma schema practices 表
export interface CreatePracticeRequest {
  title: string;
  practiceAction?: string;
  startDate?: string;
  durationDays?: number;
  frequencyMinDays?: number;
  frequencyMaxDays?: number;
  sessionDurationMinutes?: number;
  practiceTimePeriods?: PracticeTimePeriod[];
  otherContext?: string;
  tags?: string[];
  resources?: Array<{
    name: string;
    url?: string;
  }>;
}

export interface UpdatePracticeRequest {
  title?: string;
  practiceAction?: string;
  startDate?: string;
  durationDays?: number;
  frequencyMinDays?: number;
  frequencyMaxDays?: number;
  sessionDurationMinutes?: number;
  practiceTimePeriods?: PracticeTimePeriod[];
  otherContext?: string;
  tags?: string[];
  resources?: Array<{
    name: string;
    url?: string;
  }>;
  status?: PracticeStatus;
}

// Check-in request - 基於 Prisma schema practice_checkins 表
export interface CheckInRequest {
  mood?: CheckInMood;
  note?: string;
  imageUrls?: string[];
  ogImageUrl?: string;
  tags?: string[];
}

export interface CreateCheckInRequest {
  mood?: CheckInMood;
  note?: string;
  imageUrls?: string[];
  ogImageUrl?: string;
  tags?: string[];
}

// Event request interfaces
export interface ViewEventRequest {
  entityId: number;
  entityType: string;
  duration?: number;
  referrer?: string;
  metadata?: Record<string, unknown>;
}

export interface ClickEventRequest {
  entityId: number;
  entityType: string;
  clickType: string;
  clickTarget?: string;
  clickPosition?: string;
  metadata?: Record<string, unknown>;
}

export interface ShareEventRequest {
  entityId: number;
  entityType: string;
  platform?: string;
  shareUrl?: string;
  shareTitle?: string;
  shareContent?: string;
  metadata?: Record<string, unknown>;
}

export interface FavoriteEventRequest {
  entityId: number;
  entityType: string;
}

// Query parameter interfaces
export interface PracticeQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  contentType?: string;
  status?: string;
  userId?: number;
  sortBy?: SortField;
  sortOrder?: SortOrder;
}

export interface CheckInQueryParams {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  mood?: string;
}

export interface MyPracticesQueryParams extends PracticeQueryParams {
  status: string; // 'all' | 'draft' | 'not_started' | 'active' | 'completed' | 'archived'
}

// Event interfaces
export interface EventViewRequest {
  entityType: 'practice';
  entityId: number;
  duration?: number;
}

export interface EventClickRequest {
  entityType: 'practice';
  entityId: number;
  clickPosition?: string;
}

export interface EventShareRequest {
  entityType: 'practice';
  entityId: number;
  shareChannel: string;
}

export interface EventFavoriteRequest {
  entityType: 'practice';
  entityId: number;
}

export interface ReactionRequest {
  reactionType: string;
}

// Service parameter interfaces
export interface CreatePracticeParams extends CreatePracticeRequest {
  userId: number;
}

export interface UpdatePracticeParams {
  practiceId: number;
  userId: number;
  updates: UpdatePracticeRequest;
}

export interface DeletePracticeParams {
  practiceId: number;
  userId: number;
}

export interface GetPracticesParams {
  queryParams: PracticeQueryParams;
  currentUserId?: number;
}

export interface GetPracticeDetailParams {
  practiceId: number;
  include?: string;
  currentUserId?: number;
}

export interface CreateCheckInParams extends CheckInRequest {
  practiceId: number;
  userId: number;
}

export interface GetCheckInsParams {
  practiceId: number;
  queryParams: CheckInQueryParams;
  currentUserId?: number;
}

export interface ToggleLikeParams {
  practiceId: number;
  userId: number;
  reactionType: string;
}

export interface RecordEventParams {
  eventData: EventViewRequest | EventClickRequest | EventShareRequest | EventFavoriteRequest;
  userId?: number;
  sessionId?: string;
}

// Database interfaces (Prisma model types)
export interface DatabasePractice {
  id: number;
  external_id: string | null;
  user_id: number;
  title: string;
  content_type: string;
  custom_content_type: string | null;
  total_amount: number;
  current_progress: number;
  start_date: Date | null;
  daily_goal_type: string;
  daily_goal_time_minutes: number | null;
  daily_goal_amount: number | null;
  daily_goal_unit: string | null;
  practice_action: string | null;
  status: string;
  has_resources: boolean;
  streak: number;
  max_streak: number;
  last_checkin_date: Date | null;
  created_at: Date | null;
  updated_at: Date | null;
  deleted_at: Date | null;
  users: {
    id: number;
    nickname: string | null;
    external_id: string | null;
    contacts: {
      photo_url: string | null;
    } | null;
    user_positions?: Array<{
      position: {
        name: string;
      };
    }>;
  };
}

export interface DatabaseCheckIn {
  id: number;
  practice_id: number;
  user_id: number;
  checkin_date: Date;
  mood: string | null;
  note: string | null;
  image_urls: string[];
  og_image_url: string | null;
  created_at: Date | null;
  updated_at: Date | null;
}

// Service interface definitions
export interface PracticeServiceInterface {
  findAll(params: GetPracticesParams): Promise<{ practices: PracticeEntity[]; pagination: PaginationInfo }>;
  findById(params: GetPracticeDetailParams): Promise<PracticeEntity>;
  create(params: CreatePracticeParams): Promise<{ practice: PracticeEntity; resources: PracticeResource[] }>;
  update(params: UpdatePracticeParams): Promise<PracticeEntity>;
  delete(params: DeletePracticeParams): Promise<{ message: string }>;
  findUserPractices(userId: number, queryParams: MyPracticesQueryParams): Promise<{ practices: PracticeEntity[]; pagination: PaginationInfo }>;
  getUserStats(userId: number): Promise<PracticeStats>;
}

export interface CheckInServiceInterface {
  createCheckIn(params: CreateCheckInParams): Promise<CheckInEntity>;
  getCheckIns(params: GetCheckInsParams): Promise<{ checkIns: CheckInEntity[]; pagination: PaginationInfo }>;
  calculateStreak(practiceId: number, userId: number, date: Date): Promise<number>;
  updatePracticeProgress(practiceId: number, progress: number): Promise<void>;
}

export interface InteractionServiceInterface {
  toggleLike(params: ToggleLikeParams): Promise<{ isLiked: boolean; likeCount: number }>;
  recordShare(params: RecordEventParams): Promise<void>;
  toggleFavorite(params: EventFavoriteRequest & { userId: number }): Promise<{ isFavorited: boolean }>;
  recordView(params: RecordEventParams): Promise<void>;
  recordClick(params: RecordEventParams): Promise<void>;
}

// Controller interface definitions
export interface PracticeControllerInterface {
  list(req: Request, res: Response): Promise<void>;
  get(req: Request, res: Response): Promise<void>;
  create(req: Request, res: Response): Promise<void>;
  update(req: Request, res: Response): Promise<void>;
  delete(req: Request, res: Response): Promise<void>;
  checkIn(req: Request, res: Response): Promise<void>;
  getCheckIns(req: Request, res: Response): Promise<void>;
  like(req: Request, res: Response): Promise<void>;
  unlike(req: Request, res: Response): Promise<void>;
  getMyPractices(req: Request, res: Response): Promise<void>;
  getMyStats(req: Request, res: Response): Promise<void>;
}

export interface EventControllerInterface {
  recordView(req: Request, res: Response): Promise<void>;
  recordClick(req: Request, res: Response): Promise<void>;
  recordShare(req: Request, res: Response): Promise<void>;
  recordFavorite(req: Request, res: Response): Promise<void>;
  removeFavorite(req: Request, res: Response): Promise<void>;
}

// Error types
export type PracticeErrorType =
  | 'PRACTICE_NOT_FOUND'
  | 'CHECKIN_NOT_FOUND'
  | 'DUPLICATE_CHECKIN'
  | 'PERMISSION_DENIED'
  | 'INVALID_PRACTICE_STATUS'
  | 'INVALID_PROGRESS_AMOUNT'
  | 'VALIDATION_ERROR'
  | 'DATABASE_ERROR';

export interface PracticeError {
  type: PracticeErrorType;
  message: string;
  details?: Record<string, unknown>;
}

// Permission checking result interface
export interface PracticePermissionResult {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canCheckIn: boolean;
  reason?: string;
}

// Transform options
export interface PracticeTransformOptions {
  includeResources?: boolean;
  includeStats?: boolean;
  includeUserDetails?: boolean;
  currentUserId?: number;
}

// Bulk operations interfaces
export interface BulkPracticeOperationParams {
  practiceIds: number[];
  userId: number;
  operation: 'delete' | 'update_status' | 'archive';
  status?: PracticeStatus;
}

// Search and filter interfaces
export interface PracticeSearchOptions {
  query?: string;
  contentTypes?: ContentType[];
  tags?: string[];
  userId?: string;
  status?: PracticeStatus[];
  dateRange?: {
    start: string;
    end: string;
  };
}

// Analytics interfaces
export interface PracticeAnalytics {
  totalViews: number;
  totalLikes: number;
  totalShares: number;
  totalFavorites: number;
  engagementRate: number;
  averageCheckInFrequency: number;
  completionRate: number;
}

export interface CheckInAnalytics {
  totalCheckIns: number;
  averageProgress: number;
  moodDistribution: Record<CheckInMood, number>;
  streakAnalysis: {
    current: number;
    maximum: number;
    average: number;
  };
}

// Export all types - following codebase patterns