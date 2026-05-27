/**
 * Admin 報表與告警相關型別定義
 */

/** 排程報表 */
export interface ScheduledReport {
  /** 報表 ID */
  id: number;
  /** 報表名稱 */
  name: string;
  /** 頻率 */
  frequency: 'daily' | 'weekly' | 'monthly';
  /** 收件人列表 */
  recipients: string[];
  /** 報表區塊 */
  sections: string[];
  /** 上次寄送時間 */
  lastSentAt: string | null;
  /** 狀態 */
  status: 'active' | 'inactive';
  /** 建立時間 */
  createdAt: string;
}

/** 自訂報表設定 */
export interface CustomReportConfig {
  /** 設定 ID */
  id: number;
  /** 報表名稱 */
  name: string;
  /** 欄位列表 */
  fields: string[];
  /** 建立時間 */
  createdAt: string;
}

/** 告警規則 */
export interface AlertRule {
  /** 規則 ID */
  id: number;
  /** 規則名稱 */
  name: string;
  /** 監控指標 */
  metric: string;
  /** 條件 */
  condition: 'above' | 'below' | 'change_percent';
  /** 閾值 */
  threshold: number;
  /** 通知管道 */
  notifyChannel: 'email' | 'in_app' | 'both';
  /** 是否啟用 */
  isEnabled: boolean;
  /** 建立時間 */
  createdAt: string;
}

/** 告警歷史 */
export interface AlertHistory {
  /** 紀錄 ID */
  id: number;
  /** 規則 ID */
  ruleId: number;
  /** 規則名稱 */
  ruleName: string;
  /** 觸發時間 */
  triggeredAt: string;
  /** 指標數值 */
  metricValue: number;
  /** 閾值 */
  threshold: number;
  /** 狀態 */
  status: 'pending' | 'resolved';
}

/** 建立排程報表輸入 */
export interface CreateScheduledReportInput {
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  recipients: string[];
  sections: string[];
}

/** 建立告警規則輸入 */
export interface CreateAlertRuleInput {
  name: string;
  metric: string;
  condition: 'above' | 'below' | 'change_percent';
  threshold: number;
  notifyChannel?: 'email' | 'in_app' | 'both';
  isEnabled?: boolean;
}
