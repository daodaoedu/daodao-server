// Practice (實踐) 相關類型定義

export interface PracticeEntity {
  id: string;
  title: string;
  contentType: ContentType;
  customContentType?: string;
  totalAmount: number;
  startDate?: string;
  dailyGoal: DailyGoal;
  practiceAction?: string;
  tags: string[];
  user: UserBasicInfo;
  likeCount: number;
  commentCount: number;
  viewCount: number;
  shareCount: number;
  hasResources: boolean;
  resourceCount: number;
  isLiked?: boolean;
  isFavorited?: boolean;
  status: PracticeStatus;
  currentProgress: number;
  streak: number;
  lastCheckinDate?: string;
  maxStreak?: number;
  totalCheckins?: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface UserBasicInfo {
  id: string;
  name: string;
  photoUrl?: string;
  role?: string;
}

export type ContentType = 'book' | 'video' | 'articles' | 'podcast' | 'course' | 'custom';
export type PracticeStatus = 'active' | 'paused' | 'completed' | 'archived';
export type DailyGoalType = 'time' | 'completion';
export type CheckInMood = 'awesome' | 'happy' | 'neutral' | 'tired' | 'frustrated';

export interface DailyGoal {
  type: DailyGoalType;
  timeMinutes?: number;
  amount?: number;
  unit?: string;
}

export interface PracticeResource {
  id: string;
  name: string;
  url?: string;
}

// CheckIn (打卡/簽到) 實體
export interface CheckInEntity {
  id: string;
  practiceId: string;
  date: string;
  progress: number;
  note?: string;
  mood?: CheckInMood;
  reflectionText?: string;
  relatedResourceId?: string;
  relatedResource?: {
    id: string;
    name: string;
  };
  streakDay: number;
  cumulativeProgress: number;
  isPublic: boolean;
  tags: string[];
  ogImage?: string; // Open Graph 圖片 URL，用於社交分享
  likeCount: number;
  commentCount: number;
  isLiked?: boolean;
  createdAt: string;
  updatedAt?: string;
}

// 創建打卡請求
export interface CreateCheckInRequest {
  progress: number;
  note?: string;
  mood?: CheckInMood;
  reflectionText?: string;
  relatedResourceId?: string;
  isPublic?: boolean;
  tags?: string[];
  ogImage?: string; // Open Graph 圖片 URL，用於社交分享
}

// 更新打卡請求
export interface UpdateCheckInRequest {
  note?: string;
  mood?: CheckInMood;
  reflectionText?: string;
  isPublic?: boolean;
  tags?: string[];
  ogImage?: string; // Open Graph 圖片 URL，用於社交分享
}

// 打卡查詢參數
export interface CheckInQueryParams {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  mood?: CheckInMood;
  include?: string;
}

// API 回應型別
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

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

// 統計相關型別
export interface PracticeStats {
  total: number;
  active: number;
  completed: number;
  paused: number;
  archived: number;
  totalCheckIns: number;
  longestStreak: number;
  currentStreak: number;
  totalProgress: number;
  contentTypeStats: Array<{
    type: ContentType;
    count: number;
  }>;
  monthlyCheckins: Array<{
    month: string;
    count: number;
  }>;
}

// 打卡統計
export interface CheckInStats {
  totalCheckIns: number;
  currentStreak: number;
  maxStreak: number;
  averageProgress: number;
  lastCheckInDate?: string;
  moodDistribution: Record<CheckInMood, number>;
}

// 月度打卡日曆
export interface MonthlyCheckInCalendar {
  year: number;
  month: number;
  checkInDates: string[];
  totalCheckIns: number;
}

// 創建實踐請求
export interface CreatePracticeRequest {
  title: string;
  contentType: ContentType;
  customContentType?: string;
  totalAmount: number;
  startDate?: string;
  dailyGoal: DailyGoal;
  practiceAction?: string;
  tags?: string[];
  resources?: Array<{
    name: string;
    url?: string;
  }>;
}

// 更新實踐請求
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

// 創建實踐回應
export interface CreatePracticeResponse {
  practice: PracticeEntity;
  resources?: PracticeResource[];
}

// 查詢過濾器型別
export interface PracticeFilters {
  query?: string;
  contentType?: ContentType[];
  tags?: string[];
  userId?: string;
  status?: PracticeStatus | 'all';
  sort: 'createdAt' | 'updatedAt' | 'likeCount';
  order: 'asc' | 'desc';
}

// 實踐查詢結果
export interface PracticeQueryResult {
  practices: PracticeEntity[];
  pagination: PaginationInfo;
}

// 打卡查詢結果
export interface CheckInQueryResult {
  checkIns: CheckInEntity[];
  pagination: PaginationInfo;
}

// 互動回應型別
export interface LikeResponse {
  isLiked: boolean;
  likeCount: number;
}

export interface FavoriteResponse {
  isFavorited: boolean;
}
