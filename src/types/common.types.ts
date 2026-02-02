/**
 * 通用類型定義
 */

// 時間使用選項
export type TimeUsage = '1_2_hours_daily' | 'few_intensive_days_week' | 'spare_moments' | 'not_applicable_time';

// 使用者基本資訊（完整版本）
export interface UserBasicInfo {
  id: string;
  name: string;
  _id: string;
  roleList: string[];
  photoURL: string | null;
  educationStage: string | null;
  tagList: string[];
  selfIntroduction: string | null;
}

// 使用者簡化資訊（用於 idea, practice, project 等服務）
export interface UserSimpleInfo {
  id: string;
  name: string;
  roleList: string[];
  photoURL: string | null;
}

// Resource status enumeration
export type ResourceStatus = 'active' | 'inactive' | 'pending' | 'rejected';

// Review status enumeration
export type ReviewStatus = 'active' | 'inactive' | 'pending' | 'approved' | 'rejected';

// 從統一響應類型文件導入
export type { 
  ApiSuccessResponse, 
  ApiErrorResponse, 
  ApiResponse,
  PaginationInfo,
  CursorPaginationInfo,
  PaginatedApiResponse,
  CursorPaginatedApiResponse,
  ResponseMeta
} from './api-response.types';

// 分頁查詢參數通用介面
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  limit?: number;
  offset?: number;
}

// 分頁回應通用介面
export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

// 排序參數通用介面
export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 查詢參數通用介面
export interface QueryParams extends PaginationParams, SortParams {
  search?: string;
  status?: string;
  visibility?: 'private' | 'public';
}

// 日期範圍查詢參數
export interface DateRangeParams {
  startDate?: string;
  endDate?: string;
  dateFrom?: string;
  dateTo?: string;
}

// 服務層結果通用介面
export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  statusCode?: number;
}

// 驗證錯誤通用介面
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

// 批量操作結果介面
export interface BulkOperationResult {
  success: number;
  failed: number;
  errors: ValidationError[];
}

// 媒體檔案類型
export interface MediaFile {
  url: string;
  type: 'image' | 'video';
  size?: number;
  filename?: string;
}

// 可見性類型
export type Visibility = 'private' | 'public';

// 狀態類型
export type Status = 'active' | 'inactive' | 'draft' | 'published' | 'archived' | 'deleted';

// 專案相關通用類型
export interface ProjectReference {
  id: string;
  title: string;
  userId: number;
}

// 用戶關聯資訊
export interface UserAssociation {
  userId: number;
  projectId: string;
  role?: string;
  permissions?: string[];
}
