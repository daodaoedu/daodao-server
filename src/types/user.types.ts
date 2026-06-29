/**
 * 用戶管理相關型別定義
 */

import type { users } from '../../generated/prisma';
import type { ApiSuccessResponse, PaginatedApiResponse } from './api-response.types';

// 引入 multer 類型擴展
import 'multer';

/**
 * Multer 檔案類型別名
 * 使用顯式引用避免在獨立腳本執行時的類型解析問題
 */
type MulterFile = Express.Multer.File;

// 專業領域常數定義 (對應資料庫 professional_fields 表的 value 欄位)
export const PROFESSIONAL_FIELDS = [
  'technology_ict',                      // 資訊與資訊通信科技(ICT)
  'business_management',                 // 商業與管理
  'arts_creative_design',                // 藝術、創意與設計
  'science_research',                    // 科學與研究
  'engineering_manufacturing',           // 工程與製造
  'health_medicine',                     // 健康與醫學
  'education_learning',                  // 教育與學習
  'social_sciences',                     // 社會科學
  'languages',                           // 語言
  'law',                                 // 法律
  'customer_service_hospitality',        // 客戶服務與餐飲
  'agriculture_environmental_sciences',  // 農業與環境科學
  'others',                              // 其他
] as const;

export type ProfessionalField = typeof PROFESSIONAL_FIELDS[number];

// 資訊來源選項 (建議前端下拉選單)
export const REFERRAL_SOURCES = [
  'instagram',            // Instagram
  'facebook',             // Facebook
  'discord',              // Discord
  'linkedin',             // LinkedIn
  'friend_referral',      // 朋友介紹
  'others',               // 其他
] as const;

export type ReferralSource = typeof REFERRAL_SOURCES[number];

// 分頁查詢參數介面
export interface UserQueryParams {
  page?: string | number;
  pageSize?: string | number;
  educationStage?: string;
  positionList?: string;
  location?: string;
  search?: string;
}

// 用戶創建請求介面
export interface CreateUserRequest {
  gender?: string;
  birthDay?: Date | string;
  contactList?: {
    instagram?: string;
    discord?: string;
    line?: string;
    facebook?: string;
    threads?: string;
    linkedin?: string;
    website?: string;
    github?: string;
  };
  educationStage?: string;
  isOpenLocation?: boolean;
  isOpenProfile?: boolean;
  isSubscribeEmail?: boolean;
  location?: string; // area code
  positionList?: string[];
  selfIntroduction?: string;
  share?: string | string[];
  wantToDoList?: string[];
  tagList?: string[];
  interestList?: string[]; // category names 陣列 (例如: ["education_learning", "nature_environment"])
  preferences?: Record<string, string[]>; // e.g. { "learning_style": ["visual", "audio"] }
  isSendEmail?: boolean;

  // 新增欄位
  name?: string; // nickname（表單提交的用戶名稱）
  professionalField?: ProfessionalField[]; // 支援多選
  personalSlogan?: string;
  referralSource?: ReferralSource | string; // 允許自定義輸入
  registrationFlow?: 'quiz' | 'action_maker' | 'landing_page';
  customId: string; // 自訂 ID
}

// 用戶更新請求介面
export interface UpdateUserRequest {
  name?: string;
  photoURL?: string;
  gender?: string;
  birthDay?: Date | string;
  contactList?: {
    instagram?: string;
    discord?: string;
    line?: string;
    facebook?: string;
    threads?: string;
    linkedin?: string;
    website?: string;
    github?: string;
  };
  educationStage?: string;
  isOpenLocation?: boolean;
  isOpenProfile?: boolean;
  isSubscribeEmail?: boolean;
  location?: string; // area code
  selfIntroduction?: string;
  share?: string | string[];
  wantToDoList?: string[];
  tagList?: string[];
  positionList?: string[];
  interestList?: string[]; // category names 陣列 (例如: ["education_learning", "nature_environment"])
  preferences?: Record<string, string[]>; // e.g. { "learning_style": ["visual", "audio"] }
  customId?: string;

  // 新增欄位
  professionalField?: ProfessionalField[]; // 支援多選
  personalSlogan?: string;
  referralSource?: ReferralSource | string; // 允許自定義輸入
  hideConnectionsCount?: boolean;
}

// 用戶更新請求介面（含頭像檔案）
// 用於 FormData 統一提交方案
export interface UpdateUserWithAvatarRequest extends UpdateUserRequest {
  avatarFile?: MulterFile;
}

// 自訂 ID 相關請求介面
export interface SetCustomIdRequest {
  customId: string;
}

// 自訂 ID 可用性檢查回應介面
export interface CustomIdAvailabilityResponse {
  available: boolean;
}

// 自訂 ID 設置回應介面
export interface CustomIdSetResponse {
  customId: string;
}

// 格式化後的用戶回應介面
export interface FormattedUserResponse {
  id: string; // external_id (UUID)
  name: string | null; // nickname
  gender: 'male' | 'female' | 'other' | null;
  email: string | null;
  photoURL: string | null;
  birthDay: string | null;
  isOpenLocation: boolean;
  isOpenProfile: boolean;
  isSubscribeEmail: boolean;
  role: number | null;
  location: string | null;
  locationNameZh: string | null;  // 地區顯示名稱（繁體中文）
  locationNameEn: string | null;  // 地區顯示名稱（英文）
  tagList: string[] | null;
  wantToDoList: string[] | null;
  educationStage: 'elementary' | 'junior_high' | 'high' | 'associate' | 'university' | 'master' | 'doctorate' | 'other' | null;
  selfIntroduction: string | null;
  share: string | string[] | null;
  interestList: string[] | null; // 返回 category names 陣列 (例如: ["education_learning", "nature_environment"])
  preferences: Record<string, Array<{ name: string; value: string }>> | null;
  contactList: {
    email: string | null;
    photoURL: string | null;
    isSubscribeEmail: boolean | null;
    instagram: string | null;
    discord: string | null;
    line: string | null;
    facebook: string | null;
    threads: string | null;
    linkedin: string | null;
    website: string | null;
    github: string | null;
  } | null;
  basicInfo: {
    selfIntroduction: string | null;
    shareList: string | string[] | null;
    wantToDoList: string[] | null;
  } | null;
  positionList: string[] | null;
  customId: string | null;
  customIdVerified: boolean | null;
  customIdCreatedAt: string | null;

  // 新增欄位
  professionalField: ProfessionalField[] | null; // 支援多選
  personalSlogan: string | null;
  referralSource: ReferralSource | string | null;

  // 活躍狀態統計
  lastLoginAt: string | null;      // 最後登入時間
  lastActiveAt: string | null;     // 最後活動時間
  loginCount: number;              // 總登入次數
  profileViews: number;            // 個人檔案被查看次數

  // 最新測驗結果
  latestQuizResult: {
    id: number;
    resultType: string;
    scores: Record<string, number>;
    completedAt: string;
  } | null;

  createdDate: string;
  updatedDate: string;
}

// 用戶完整度計算配置介面
export interface CompletenessWeights {
  self_introduction: { base: number; levels: number[] };
  share_list: { base: number; levels: number[] };
  tag_list: { tagWeight: number; maxScore: number };
  contact: number;
  location: number;
  positions: number;
}

// 用戶完整度計算結果
export interface UserWithCompleteness {
  user: users;
  completenessScore: number;
}

// Legacy pagination response - deprecated, use PaginatedApiResponse instead
// @deprecated Use PaginatedApiResponse<FormattedUserResponse> instead
export interface PaginatedUsersResponse {
  data: FormattedUserResponse[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

// API 回應介面
export interface UserResponse {
  data: FormattedUserResponse | FormattedUserResponse[] | null;
  message?: string;
  error?: boolean;
  details?: string;
}

// 登入歷史記錄介面
export interface LoginHistoryRecord {
  id: number;
  deviceType: string | null;
  os: string | null;
  browser: string | null;
  userAgent: string | null;
  ipAddress: string | null;
  loginAt: string | null;
}

// 用戶活躍統計介面
export interface UserActivityStats {
  lastLoginAt: string | null;
  lastActiveAt: string | null;
  loginCount: number;
  profileViews: number;
  recentLoginCount: number;
  totalPractices: number;
  totalCheckins: number;
  totalPosts: number;
  totalReactions: number;
}

export interface ActivityTimelineEvent {
  id: string;
  type: 'login' | 'checkin' | 'post';
  description: string;
  timestamp: string;
}

// 裝置資訊介面
export interface DeviceInfo {
  deviceType?: string;
  os?: string;
  browser?: string;
  userAgent?: string;
  ipAddress?: string;
}

// 用戶服務介面
export interface UserService {
  getAllUsers(params: UserQueryParams): Promise<PaginatedApiResponse<FormattedUserResponse>>;
  getMe(userId: string): Promise<ApiSuccessResponse<FormattedUserResponse> | null>;
  getOneUser(externalId: string, viewerId?: number): Promise<ApiSuccessResponse<FormattedUserResponse> | null>;
  createUser(userData: CreateUserRequest, tempUserId: string): Promise<ApiSuccessResponse<{ user: FormattedUserResponse; token: string }>>;
  updateUser(externalId: string, userData: UpdateUserRequest): Promise<ApiSuccessResponse<FormattedUserResponse>>;
  deleteMe(externalId: string): Promise<ApiSuccessResponse<{ message: string }>>;
  deleteUser(userId: number): Promise<ApiSuccessResponse<{ message: string }>>;
  // 活躍狀態統計方法
  updateLastLogin(userId: number, deviceInfo?: DeviceInfo): Promise<void>;
  updateLastActive(userId: number): Promise<void>;
  incrementProfileViews(userId: number): Promise<void>;
  getLoginHistory(userId: number, limit?: number): Promise<ApiSuccessResponse<LoginHistoryRecord[]>>;
  getUserActivityStats(userId: number): Promise<ApiSuccessResponse<UserActivityStats>>;
}

// 關聯模型型別 (基於現有的 JavaScript 模型結構)
export interface UserWithAssociations extends users {
  Role?: {
    id: number;
    name: string;
  };
  Location?: {
    City?: {
      name: string;
    };
    Country?: {
      name: string;
    };
  };
  Contact?: {
    id: number;
    email?: string;
    photo_url?: string;
    is_subscribe_email?: boolean;
    ig?: string;
    discord?: string;
    line?: string;
    fb?: string;
    threads?: string;
    linkedin?: string;
    website?: string;
    github?: string;
  };
  BasicInfo?: {
    id: number;
    self_introduction?: string;
    share_list?: string | string[];
    want_to_do_list?: string[];
  };
  Positions?: Array<{
    id: number;
    name: string;
  }>;
}

// 錯誤型別
export interface UserError {
  error: boolean;
  message: string;
  details?: string;
}

// 型別匯出不需要 default export 物件
