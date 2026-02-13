/**
 * Admin 使用者管理相關型別定義
 */

import type { FormattedUserResponse, LoginHistoryRecord, UserActivityStats } from './user.types';

/**
 * Admin 使用者列表查詢參數
 */
export interface AdminUserFilters {
  /** 搜尋名稱或 email */
  search?: string;
  /** 篩選角色 ID */
  roleId?: number;
  /** 篩選啟用狀態 */
  isActive?: boolean;
  /** 篩選 email 驗證狀態 */
  isVerified?: boolean;
  /** 頁數 */
  page?: number;
  /** 每頁數量 */
  limit?: number;
  /** 排序欄位 */
  sortBy?: 'createdAt' | 'lastLoginAt' | 'name' | 'email';
  /** 排序方向 */
  sortOrder?: 'asc' | 'desc';
}

/**
 * 角色資訊
 */
export interface RoleInfo {
  id: number;
  name: string;
  description: string | null;
}

/**
 * Admin 使用者列表項目
 */
export interface AdminUserListItem {
  id: string;
  internalId: number;
  name: string | null;
  email: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  emailVerifiedAt: string | null;
  isActive: boolean;
  roles: RoleInfo[];
  permissions: string[];
  createdAt: string;
  lastLoginAt: string | null;
}

/**
 * Admin 使用者列表回應
 */
export interface AdminUserListResponse {
  users: AdminUserListItem[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrev: boolean;
    limit: number;
  };
}

/**
 * Admin 使用者詳情回應
 * 擴展公開的 FormattedUserResponse
 */
export interface AdminUserDetailResponse extends FormattedUserResponse {
  /** 內部 ID */
  internalId: number;
  /** 完整 email */
  email: string | null;
  /** Email 是否已驗證 */
  emailVerified: boolean;
  /** Email 驗證時間 */
  emailVerifiedAt: string | null;
  /** 帳號是否啟用 */
  isActive: boolean;
  /** 用戶角色列表 */
  roles: RoleInfo[];
  /** 用戶權限列表 */
  permissions: string[];
  /** 最近登入歷史（最近 10 筆） */
  recentLoginHistory: LoginHistoryRecord[];
  /** 活躍統計 */
  activityStats: UserActivityStats;
}

/**
 * 用戶狀態更新請求
 */
export interface UpdateUserStatusRequest {
  isActive: boolean;
}

/**
 * 用戶狀態更新回應
 */
export interface UpdateUserStatusResponse {
  id: string;
  isActive: boolean;
  updatedAt: string;
}

/**
 * Admin 登入歷史查詢參數
 */
export interface AdminLoginHistoryFilters {
  /** 開始日期 */
  startDate?: string;
  /** 結束日期 */
  endDate?: string;
  /** 頁數 */
  page?: number;
  /** 每頁數量 */
  limit?: number;
}

/**
 * Admin 登入歷史回應
 */
export interface AdminLoginHistoryResponse {
  records: LoginHistoryRecord[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrev: boolean;
    limit: number;
  };
}
