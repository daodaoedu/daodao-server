/**
 * 郵件歷史相關型別定義
 */

import type { EmailStatusValue } from './email';

/**
 * 郵件歷史記錄
 */
export interface EmailHistoryRecord {
  /** 記錄 ID */
  id: number;
  /** 用戶 ID */
  userId: number;
  /** 收件人 email（從用戶資料取得） */
  recipientEmail: string | null;
  /** 收件人名稱（用戶暱稱） */
  recipientName: string | null;
  /** 郵件類型 */
  emailType: string;
  /** 郵件主題 */
  subject: string | null;
  /** 發送狀態 */
  status: EmailStatusValue;
  /** 發送時間 */
  sentAt: string | null;
  /** 建立時間 */
  createdAt: string | null;
  /** 實體類型（關聯物件類型） */
  entityType: string | null;
  /** 實體 ID（關聯物件 ID） */
  entityId: number | null;
  /** 追蹤 Token */
  trackingToken: string | null;
  /** 首次開啟時間 */
  openedAt: string | null;
  /** 開啟次數 */
  openCount: number;
}

/**
 * 郵件歷史查詢參數
 */
export interface EmailHistoryFilters {
  /** 郵件類型 */
  emailType?: string;
  /** 發送狀態 */
  status?: EmailStatusValue;
  /** 收件人 email */
  recipient?: string;
  /** 用戶 ID */
  userId?: number;
  /** 開始日期 */
  startDate?: string;
  /** 結束日期 */
  endDate?: string;
  /** 頁數 */
  page?: number;
  /** 每頁數量 */
  limit?: number;
  /** 排序欄位 */
  sortBy?: 'sentAt' | 'createdAt';
  /** 排序方向 */
  sortOrder?: 'asc' | 'desc';
  /** 是否已開啟篩選 */
  opened?: 'true' | 'false';
}

/**
 * 郵件歷史統計
 */
export interface EmailHistoryStats {
  /** 總記錄數 */
  totalRecords: number;
  /** 已發送數量 */
  sentCount: number;
  /** 失敗數量 */
  failedCount: number;
  /** 待發送數量 */
  pendingCount: number;
  /** 成功率（百分比） */
  successRate: number;
  /** 已開啟數量 */
  openedCount: number;
  /** 開啟率（百分比） */
  openRate: number;
}

/**
 * 郵件歷史回應
 */
export interface EmailHistoryResponse {
  /** 郵件記錄列表 */
  records: EmailHistoryRecord[];
  /** 分頁資訊 */
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrev: boolean;
    limit: number;
  };
  /** 統計資訊 */
  stats: EmailHistoryStats;
}
