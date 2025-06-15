/**
 * 通用類型定義
 */

// 時間使用選項
export type TimeUsage = '1_2_hours_daily' | 'few_intensive_days_week' | 'spare_moments' | 'not_applicable_time';

// 使用者基本資訊
export interface UserBasicInfo {
  id: number;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  // 可根據需要擴展其他屬性
}

// Resource status enumeration
export type ResourceStatus = 'active' | 'inactive' | 'pending' | 'rejected';

// Review status enumeration
export type ReviewStatus = 'active' | 'inactive' | 'pending' | 'approved' | 'rejected';
