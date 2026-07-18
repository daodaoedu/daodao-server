/**
 * Admin 用戶標籤相關型別定義
 */

/** 用戶標籤 */
export interface UserTag {
  /** 標籤 ID */
  id: number;
  /** 標籤名稱 */
  name: string;
  /** 標籤顏色 */
  color: string;
  /** 標籤描述 */
  description: string | null;
  /** 標籤類型：手動 / 自動 */
  type: 'manual' | 'auto';
  /** 標籤分類：來源 / 特徵 / 事件 */
  category: 'source' | 'characteristic' | 'event' | null;
  /** 追蹤短網址識別碼（對應 ?ref= URL 參數） */
  trackingSlug: string | null;
  /** 已指派用戶數 */
  userCount: number;
  /** 建立時間 */
  createdAt: string;
  /** 更新時間 */
  updatedAt: string | null;
}

/** 標籤規則 */
export interface TagRule {
  /** 規則 ID */
  id: number;
  /** 關聯標籤 ID */
  tagId: number;
  /** 條件類型 */
  conditionType: string;
  /** 條件運算子 */
  conditionOperator: string;
  /** 條件值 */
  conditionValue: string;
  /** 邏輯運算子 */
  logicOperator: 'AND' | 'OR';
  /** 是否啟用 */
  isEnabled: boolean;
  /** 建立時間 */
  createdAt: string;
  /** 更新時間 */
  updatedAt: string | null;
}

/** 建立標籤輸入 */
export interface CreateTagInput {
  name: string;
  color?: string;
  description?: string;
  type?: 'manual' | 'auto';
  /** 標籤分類 */
  category?: 'source' | 'characteristic' | 'event';
  /** 追蹤短網址識別碼 */
  trackingSlug?: string;
}

/** 更新標籤輸入 */
export interface UpdateTagInput {
  name?: string;
  color?: string;
  description?: string;
  /** 標籤分類 */
  category?: 'source' | 'characteristic' | 'event';
  /** 追蹤短網址識別碼 */
  trackingSlug?: string;
}

/** 建立標籤規則輸入 */
export interface CreateTagRuleInput {
  tagId: number;
  conditionType: string;
  conditionOperator?: string;
  conditionValue: string;
  logicOperator?: 'AND' | 'OR';
  isEnabled?: boolean;
}

/** 更新標籤規則輸入 */
export interface UpdateTagRuleInput {
  conditionType?: string;
  conditionOperator?: string;
  conditionValue?: string;
  logicOperator?: 'AND' | 'OR';
  isEnabled?: boolean;
}

/** 批量標籤操作輸入 */
export interface BulkTagInput {
  userIds: number[];
  tagId: number;
  action: 'add' | 'remove';
}
