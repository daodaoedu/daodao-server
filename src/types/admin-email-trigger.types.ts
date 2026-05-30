/**
 * Admin 觸發式信件相關型別定義
 */

/** 觸發規則 */
export interface EmailTriggerRule {
  /** 規則 ID */
  id: number;
  /** 規則名稱 */
  name: string;
  /** 規則描述 */
  description: string | null;
  /** 觸發類型 */
  triggerType: string;
  /** 觸發條件設定（JSON） */
  triggerConfig: Record<string, unknown>;
  /** 對應信件模板（slug） */
  template: string;
  /** 信件主旨 */
  subject: string;
  /** 是否啟用 */
  enabled: boolean;
  /** 已寄送總數 */
  sentCount: number;
  /** 開信率 */
  openRate: number;
  /** 建立時間 */
  createdAt: string;
  /** 更新時間 */
  updatedAt: string;
}

/** 信件模板 */
export interface EmailTemplate {
  /** 模板 ID */
  id: number;
  /** 模板名稱 */
  name: string;
  /** 模板 slug（唯一識別碼） */
  slug: string | null;
  /** 信件主旨 */
  subject: string;
  /** 預覽文字 */
  preheader: string | null;
  /** 信件內容 */
  body: string;
  /** 可用變數 */
  variables: string[];
  /** 資料來源 */
  dataSource: 'user' | 'practice' | 'event' | 'none';
  /** 是否啟用 */
  isActive: boolean;
  /** 建立時間 */
  createdAt: string;
  /** 更新時間 */
  updatedAt: string;
}

/** 信件執行紀錄 */
export interface EmailExecutionLog {
  /** 紀錄 ID */
  id: number;
  /** 規則 ID */
  ruleId: number;
  /** 規則名稱 */
  ruleName: string;
  /** 收件人 */
  recipient: string;
  /** 寄送時間 */
  sentAt: string;
  /** 寄送狀態 */
  status: 'success' | 'failed';
}

/** 建立觸發規則輸入 */
export interface CreateTriggerRuleInput {
  name: string;
  description?: string;
  triggerType: string;
  triggerConfig?: Record<string, unknown>;
  template: string;
  subject?: string;
  enabled?: boolean;
}

/** 建立信件模板輸入 */
export interface CreateTemplateInput {
  name: string;
  subject: string;
  preheader?: string;
  body: string;
  variables?: string[];
  dataSource?: 'user' | 'practice' | 'event' | 'none';
  isActive?: boolean;
  slug?: string;
}
