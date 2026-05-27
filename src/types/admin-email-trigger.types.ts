/**
 * Admin 觸發式信件相關型別定義
 */

/** 觸發規則 */
export interface EmailTriggerRule {
  /** 規則 ID */
  id: number;
  /** 規則名稱 */
  name: string;
  /** 條件類型 */
  conditionType: 'dormant_days' | 'no_action_days' | 'tag_change';
  /** 條件值 */
  conditionValue: string;
  /** 關聯信件模板 ID */
  templateId: number;
  /** 是否啟用 */
  isEnabled: boolean;
  /** 已寄送總數 */
  totalSent: number;
  /** 開信率 */
  openRate: number;
  /** 點擊率 */
  clickRate: number;
  /** 建立時間 */
  createdAt: string;
}

/** 信件模板 */
export interface EmailTemplate {
  /** 模板 ID */
  id: number;
  /** 模板名稱 */
  name: string;
  /** 信件主旨 */
  subject: string;
  /** 信件內容 */
  body: string;
  /** 可用變數 */
  variables: string[];
  /** 建立時間 */
  createdAt: string;
}

/** 信件執行紀錄 */
export interface EmailExecutionLog {
  /** 紀錄 ID */
  id: number;
  /** 規則 ID */
  ruleId: number;
  /** 規則名稱 */
  ruleName: string;
  /** 收件人 Email */
  recipientEmail: string;
  /** 寄送時間 */
  sentAt: string;
  /** 寄送狀態 */
  status: 'sent' | 'failed';
  /** 開信時間 */
  openedAt: string | null;
  /** 點擊時間 */
  clickedAt: string | null;
}

/** 建立觸發規則輸入 */
export interface CreateTriggerRuleInput {
  name: string;
  conditionType: 'dormant_days' | 'no_action_days' | 'tag_change';
  conditionValue: string;
  templateId: number;
  isEnabled?: boolean;
}

/** 建立信件模板輸入 */
export interface CreateTemplateInput {
  name: string;
  subject: string;
  body: string;
  variables?: string[];
}
