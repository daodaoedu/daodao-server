/**
 * 用戶管理相關型別定義
 */

import type { users } from '../../generated/prisma';
import type { ApiSuccessResponse, PaginatedApiResponse } from './api-response.types';

// ESCO 專業領域常數定義 (使用 snake_case 格式,對應 categories 命名規則)
export const PROFESSIONAL_FIELDS = [
  'information_and_communication_technologies_icts',  // 資訊與通訊技術
  'business_administration_and_law',                  // 商業、行政與法律
  'arts_and_humanities',                              // 藝術與人文
  'natural_sciences_mathematics_and_statistics',      // 自然科學、數學與統計
  'engineering_manufacturing_and_construction',       // 工程、製造與營造
  'health_and_welfare',                               // 健康與福祉
  'education',                                        // 教育
  'social_sciences_journalism_and_information',       // 社會科學、新聞與資訊
  'language_skills_and_knowledge',                    // 語言技能與知識
  'services',                                         // 服務
  'agriculture_forestry_fisheries_and_veterinary',    // 農業、林業、漁業與獸醫
  'others',                                           // 其他
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
  roleList?: string;
  location?: string;
  search?: string;
}

// 用戶創建請求介面
export interface CreateUserRequest {
  gender?: string;
  birthDate?: Date | string;
  contactList?: {
    instagram?: string;
    discord?: string;
    line?: string;
    facebook?: string;
    threads?: string;
    linkedin?: string;
  };
  educationStage?: string;
  isOpenLocation?: boolean;
  isOpenProfile?: boolean;
  isSubscribeEmail?: boolean;
  location?: string; // area code
  roleList?: string[];
  selfIntroduction?: string;
  share?: string | string[];
  wantToDoList?: string[];
  tagList?: string[];
  interestList?: string[]; // category names 陣列 (例如: ["education_learning", "nature_environment"])
  preferences?: Record<string, string[]>; // e.g. { "learning_style": ["visual", "audio"] }
  isSendEmail?: boolean;

  // 新增欄位
  professionalField?: ProfessionalField[]; // 支援多選
  personalSlogan?: string;
  referralSource?: ReferralSource | string; // 允許自定義輸入
  customId?: string; // 自訂 ID (可在創建時設置)
}

// 用戶更新請求介面
export interface UpdateUserRequest {
  name?: string;
  photoURL?: string;
  gender?: string;
  birthDate?: Date | string;
  contactList?: {
    instagram?: string;
    discord?: string;
    line?: string;
    facebook?: string;
    threads?: string;
    linkedin?: string;
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
  roleList?: string[];
  interestList?: string[]; // category names 陣列 (例如: ["education_learning", "nature_environment"])
  preferences?: Record<string, string[]>; // e.g. { "learning_style": ["visual", "audio"] }
  customId?: string;

  // 新增欄位
  professionalField?: ProfessionalField[]; // 支援多選
  personalSlogan?: string;
  referralSource?: ReferralSource | string; // 允許自定義輸入
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
  tagList: string[] | null;
  wantToDoList: string[] | null;
  educationStage: 'university' | 'high' | 'other' | null;
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
  } | null;
  basicInfo: {
    selfIntroduction: string | null;
    shareList: string | string[] | null;
    wantToDoList: string[] | null;
  } | null;
  roleList: string[] | null;
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