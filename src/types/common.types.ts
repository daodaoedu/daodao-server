/**
 * 通用類型定義
 */

// 時間使用選項
export type TimeUsage = '1_2_hours_daily' | 'few_intensive_days_week' | 'spare_moments' | 'not_applicable_time';

// 使用者基本資訊
export interface UserBasicInfo {
  id: number;
  name: string;
  _id: string;
  roleList: string[];
  photoURL: string | null;
  educationStage: string | null;
  tagList: string[];
  selfIntroduction: string | null;
}

// Resource status enumeration
export type ResourceStatus = 'active' | 'inactive' | 'pending' | 'rejected';

// Review status enumeration
export type ReviewStatus = 'active' | 'inactive' | 'pending' | 'approved' | 'rejected';

// 錯誤響應類型定義
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    type: 'bad_request' | 'unauthorized' | 'forbidden' | 'not_found' | 'conflict' | 'internal_server_error' | 'error';
    details?: Record<string, string>;
  };
  timestamp: string;
  debug?: {
    stack?: string;
    name?: string;
  };
}

// 成功響應類型定義
export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  timestamp: string;
}

// 統一響應類型
export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;
