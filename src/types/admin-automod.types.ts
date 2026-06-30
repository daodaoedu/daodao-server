/**
 * Admin 自動審核相關型別定義
 */

/** 自動審核規則 */
export interface AutoModRule {
  /** 規則 ID */
  id: number;
  /** 規則名稱 */
  name: string;
  /** 匹配模式字串 */
  pattern: string;
  /** 匹配方式 */
  matchMode: 'exact' | 'wildcard' | 'contains';
  /** 執行動作 */
  action: 'delete' | 'warn' | 'timeout';
  /** 禁言時間（分鐘），僅 action 為 timeout 時有效 */
  timeoutMinutes?: number;
  /** 是否啟用 */
  isEnabled: boolean;
  /** 建立時間 */
  createdAt: string;
}

/** 詞彙清單 */
export interface WordList {
  /** 清單 ID */
  id: number;
  /** 清單名稱 */
  name: string;
  /** 詞彙列表 */
  words: string[];
  /** 是否啟用 */
  isEnabled: boolean;
}

/** 自動審核動作紀錄 */
export interface AutoModActionLog {
  /** 紀錄 ID */
  id: number;
  /** 內容 ID */
  contentId: number;
  /** 內容預覽 */
  contentPreview: string;
  /** 觸發的規則名稱 */
  ruleName: string;
  /** 執行動作 */
  action: string;
  /** 用戶 ID */
  userId: number;
  /** 用戶名稱 */
  userName: string;
  /** 建立時間 */
  createdAt: string;
}

/** 內容標記 */
export interface ContentFlag {
  /** 標記 ID */
  id: number;
  /** 內容 ID */
  contentId: number;
  /** 內容預覽 */
  contentPreview: string;
  /** 被標記次數 */
  flagCount: number;
  /** 優先級 */
  priority: 'high' | 'medium' | 'low';
  /** 標記原因列表 */
  reasons: string[];
  /** 處理狀態 */
  status: 'pending' | 'resolved';
  /** 建立時間 */
  createdAt: string;
}

/** 建立自動審核規則輸入 */
export interface CreateAutoModRuleInput {
  /** 規則名稱 */
  name: string;
  /** 匹配模式字串 */
  pattern: string;
  /** 匹配方式 */
  matchMode?: 'exact' | 'wildcard' | 'contains';
  /** 執行動作 */
  action: 'delete' | 'warn' | 'timeout';
  /** 禁言時間（分鐘） */
  timeoutMinutes?: number;
  /** 是否啟用 */
  isEnabled?: boolean;
}

/** 標記佇列處理動作輸入 */
export interface FlagQueueActionInput {
  /** 處理動作 */
  action: 'agree' | 'dismiss' | 'defer' | 'delete' | 'silence';
}
