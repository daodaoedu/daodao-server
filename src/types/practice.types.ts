/**
 * Practice system type definitions
 * 
 * This file contains comprehensive TypeScript interfaces and types for the practice system,
 * including core practice interfaces, request/response types, and service method parameters.
 * Based on practice-api-v1.md specification.
 */

import { Request, Response } from 'express';

// Core enums and basic types
export type ContentType = 'book' | 'video' | 'articles' | 'podcast' | 'course' | 'custom';
export type PracticeStatus = 'active' | 'paused' | 'completed' | 'archived';
export type DailyGoalType = 'time' | 'completion';
export type CheckInMood = 'awesome' | 'happy' | 'neutral' | 'tired' | 'frustrated';
export type SortField = 'createdAt' | 'updatedAt' | 'likeCount';
export type SortOrder = 'asc' | 'desc';
export type EventType = 'practice';

// Daily goal interface
export interface DailyGoal {
  type: DailyGoalType;
  timeMinutes?: number;
  amount?: number;
  unit?: string;
}

// Practice resource interface
export interface PracticeResource {
  id: string;
  name: string;
  url?: string;
}

// User basic info for practice responses
export interface UserBasicInfo {
  id: string;
  name: string;
  photoUrl?: string;
  role?: string;
}

// Core practice entity interface
export interface PracticeEntity {
  id: string;
  title: string;
  contentType: ContentType;
  customContentType?: string;
  totalAmount: number;
  currentProgress: number;
  startDate?: string;
  dailyGoal: DailyGoal;
  practiceAction?: string;
  status: PracticeStatus;
  hasResources: boolean;
  streak: number;
  maxStreak: number;
  lastCheckInDate?: string;
  createdAt: string;
  updatedAt?: string;
  user: UserBasicInfo;
  tags: string[];
  stats: {
    likeCount: number;
    viewCount: number;
    favoriteCount: number;
    shareCount: number;
    commentCount: number;
  };
}

// Check-in entity interface
export interface CheckInEntity {
  id: string;
  practiceId: string;
  userId: string;
  checkInDate: string;
  progressAmount: number;
  note?: string;
  mood?: CheckInMood;
  reflectionText?: string;
  relatedResourceId?: string;
  streakDay: number;
  cumulativeProgress: number;
  createdAt: string;
  updatedAt?: string;
}

// Pagination interface
export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// API response interfaces
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
  pagination?: PaginationInfo;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// Practice statistics interface
export interface PracticeStats {
  totalPractices: number;
  activePractices: number;
  completedPractices: number;
  pausedPractices: number;
  totalCheckIns: number;
  averageStreak: number;
  maxStreak: number;
}

// Request interfaces
export interface CreatePracticeRequest {
  title: string;
  contentType: ContentType;
  customContentType?: string;
  totalAmount: number;
  startDate?: string;
  dailyGoal: DailyGoal;
  practiceAction?: string;
  tags: string[];
  resources?: Array<{
    name: string;
    url?: string;
  }>;
}

export interface UpdatePracticeRequest {
  title?: string;
  totalAmount?: number;
  startDate?: string;
  dailyGoal?: DailyGoal;
  practiceAction?: string;
  tags?: string[];
  resources?: Array<{
    name: string;
    url?: string;
  }>;
  status?: PracticeStatus;
}

export interface CheckInRequest {
  progress: number;
  note?: string;
  mood?: CheckInMood;
  reflectionText?: string;
  relatedResourceId?: string;
  isPublic: boolean;
  tags: string[];
}

export interface CreateCheckInRequest {
  progressAmount: number;
  note?: string;
  mood?: CheckInMood;
  reflectionText?: string;
  relatedResourceId?: string;
}

// Event request interfaces
export interface ViewEventRequest {
  entityId: string;
  entityType: string;
  duration?: number;
  referrer?: string;
  metadata?: Record<string, unknown>;
}

export interface ClickEventRequest {
  entityId: string;
  entityType: string;
  clickType: string;
  clickTarget?: string;
  clickPosition?: string;
  metadata?: Record<string, unknown>;
}

export interface ShareEventRequest {
  entityId: string;
  entityType: string;
  platform?: string;
  shareUrl?: string;
  shareTitle?: string;
  shareContent?: string;
  metadata?: Record<string, unknown>;
}

export interface FavoriteEventRequest {
  entityId: string;
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
  status: string; // 'all' | 'active' | 'paused' | 'completed' | 'archived'
}

// Event interfaces
export interface EventViewRequest {
  entityType: 'practice';
  entityId: string;
  duration?: number;
}

export interface EventClickRequest {
  entityType: 'practice';
  entityId: string;
  clickPosition?: string;
}

export interface EventShareRequest {
  entityType: 'practice';
  entityId: string;
  shareChannel: string;
}

export interface EventFavoriteRequest {
  entityType: 'practice';
  entityId: string;
}

export interface ReactionRequest {
  reactionType: string;
}

// Service parameter interfaces
export interface CreatePracticeParams extends CreatePracticeRequest {
  userId: number;
}

export interface UpdatePracticeParams {
  practiceId: string;
  userId: number;
  updates: UpdatePracticeRequest;
}

export interface DeletePracticeParams {
  practiceId: string;
  userId: number;
}

export interface GetPracticesParams {
  queryParams: PracticeQueryParams;
  currentUserId?: number;
}

export interface GetPracticeDetailParams {
  practiceId: string;
  include?: string;
  currentUserId?: number;
}

export interface CreateCheckInParams extends CheckInRequest {
  practiceId: string;
  userId: number;
}

export interface GetCheckInsParams {
  practiceId: string;
  queryParams: CheckInQueryParams;
  currentUserId?: number;
}

export interface ToggleLikeParams {
  practiceId: string;
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
  id: string;
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
  id: string;
  practice_id: string;
  user_id: number;
  checkin_date: Date;
  progress_amount: number;
  note: string | null;
  mood: string | null;
  reflection_text: string | null;
  related_resource_id: string | null;
  streak_day: number;
  cumulative_progress: number;
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
  calculateStreak(practiceId: string, userId: number, date: Date): Promise<number>;
  updatePracticeProgress(practiceId: string, progress: number): Promise<void>;
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
  practiceIds: string[];
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