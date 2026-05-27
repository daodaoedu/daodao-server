/**
 * Admin 報表與告警服務
 * 提供排程報表、自訂報表、告警規則的 CRUD 與查詢
 *
 * TODO: DB 表尚未建立，目前回傳 mock 資料
 */

import type {
  ScheduledReport,
  CustomReportConfig,
  AlertRule,
  AlertHistory,
  CreateScheduledReportInput,
  CreateAlertRuleInput,
} from '../types/admin-reports.types';

// ============================================================================
// Scheduled Reports
// ============================================================================

/**
 * 列出所有排程報表
 */
const listScheduledReports = async (): Promise<ScheduledReport[]> => {
  // TODO: 實作 DB 查詢 — SELECT * FROM scheduled_reports ORDER BY created_at DESC
  return [];
};

/**
 * 建立排程報表
 * @param input - 建立排程報表輸入
 */
const createScheduledReport = async (input: CreateScheduledReportInput): Promise<ScheduledReport> => {
  // TODO: 實作 DB 寫入 — INSERT INTO scheduled_reports
  return {
    id: 1,
    name: input.name,
    frequency: input.frequency,
    recipients: input.recipients,
    sections: input.sections,
    lastSentAt: null,
    status: 'active',
    createdAt: new Date().toISOString(),
  };
};

/**
 * 更新排程報表
 * @param id - 報表 ID
 * @param input - 更新欄位
 */
const updateScheduledReport = async (
  id: number,
  input: Partial<CreateScheduledReportInput & { status: 'active' | 'inactive' }>,
): Promise<ScheduledReport> => {
  // TODO: 實作 DB 更新 — UPDATE scheduled_reports SET ... WHERE id = $1
  return {
    id,
    name: input.name ?? 'mock-report',
    frequency: input.frequency ?? 'weekly',
    recipients: input.recipients ?? [],
    sections: input.sections ?? [],
    lastSentAt: null,
    status: input.status ?? 'active',
    createdAt: new Date().toISOString(),
  };
};

/**
 * 刪除排程報表
 * @param id - 報表 ID
 */
const deleteScheduledReport = async (id: number): Promise<void> => {
  // TODO: 實作 DB 刪除 — DELETE FROM scheduled_reports WHERE id = $1
  void id;
};

/**
 * 取得報表寄送歷史
 * @param reportId - 報表 ID
 */
const getReportHistory = async (
  reportId: number,
): Promise<Array<{ id: number; reportId: number; sentAt: string; status: string }>> => {
  // TODO: 實作 DB 查詢 — SELECT * FROM report_history WHERE report_id = $1
  void reportId;
  return [];
};

// ============================================================================
// Custom Reports
// ============================================================================

/**
 * 取得可用的報表欄位
 */
const getAvailableFields = async (): Promise<string[]> => {
  // TODO: 從 DB schema 或設定檔動態取得可用欄位
  return [
    'user_count',
    'active_users',
    'new_registrations',
    'resource_count',
    'challenge_completion_rate',
    'average_session_duration',
    'revenue',
  ];
};

/**
 * 查詢自訂報表
 * @param fields - 要查詢的欄位列表
 */
const queryCustomReport = async (
  fields: string[],
): Promise<Record<string, unknown>> => {
  // TODO: 實作動態 SQL 查詢，根據 fields 組合 SELECT
  const result: Record<string, unknown> = {};
  for (const field of fields) {
    result[field] = 0;
  }
  return result;
};

/**
 * 列出已儲存的自訂報表
 */
const listSavedReports = async (): Promise<CustomReportConfig[]> => {
  // TODO: 實作 DB 查詢 — SELECT * FROM custom_report_configs ORDER BY created_at DESC
  return [];
};

/**
 * 儲存自訂報表設定
 * @param input - 報表名稱與欄位
 */
const saveReport = async (input: { name: string; fields: string[] }): Promise<CustomReportConfig> => {
  // TODO: 實作 DB 寫入 — INSERT INTO custom_report_configs
  return {
    id: 1,
    name: input.name,
    fields: input.fields,
    createdAt: new Date().toISOString(),
  };
};

/**
 * 刪除已儲存的自訂報表
 * @param id - 報表設定 ID
 */
const deleteSavedReport = async (id: number): Promise<void> => {
  // TODO: 實作 DB 刪除 — DELETE FROM custom_report_configs WHERE id = $1
  void id;
};

// ============================================================================
// Alert Rules
// ============================================================================

/**
 * 列出所有告警規則
 */
const listAlertRules = async (): Promise<AlertRule[]> => {
  // TODO: 實作 DB 查詢 — SELECT * FROM alert_rules ORDER BY created_at DESC
  return [];
};

/**
 * 建立告警規則
 * @param input - 建立告警規則輸入
 */
const createAlertRule = async (input: CreateAlertRuleInput): Promise<AlertRule> => {
  // TODO: 實作 DB 寫入 — INSERT INTO alert_rules
  return {
    id: 1,
    name: input.name,
    metric: input.metric,
    condition: input.condition,
    threshold: input.threshold,
    notifyChannel: input.notifyChannel ?? 'email',
    isEnabled: input.isEnabled ?? true,
    createdAt: new Date().toISOString(),
  };
};

/**
 * 更新告警規則
 * @param id - 規則 ID
 * @param input - 更新欄位
 */
const updateAlertRule = async (
  id: number,
  input: Partial<CreateAlertRuleInput>,
): Promise<AlertRule> => {
  // TODO: 實作 DB 更新 — UPDATE alert_rules SET ... WHERE id = $1
  return {
    id,
    name: input.name ?? 'mock-alert',
    metric: input.metric ?? 'user_count',
    condition: input.condition ?? 'above',
    threshold: input.threshold ?? 100,
    notifyChannel: input.notifyChannel ?? 'email',
    isEnabled: input.isEnabled ?? true,
    createdAt: new Date().toISOString(),
  };
};

/**
 * 刪除告警規則
 * @param id - 規則 ID
 */
const deleteAlertRule = async (id: number): Promise<void> => {
  // TODO: 實作 DB 刪除 — DELETE FROM alert_rules WHERE id = $1
  void id;
};

/**
 * 取得告警歷史
 * @param ruleId - 規則 ID（可選，不傳則回傳全部）
 */
const getAlertHistory = async (ruleId?: number): Promise<AlertHistory[]> => {
  // TODO: 實作 DB 查詢 — SELECT * FROM alert_history WHERE rule_id = $1
  void ruleId;
  return [];
};

export default {
  listScheduledReports,
  createScheduledReport,
  updateScheduledReport,
  deleteScheduledReport,
  getReportHistory,
  getAvailableFields,
  queryCustomReport,
  listSavedReports,
  saveReport,
  deleteSavedReport,
  listAlertRules,
  createAlertRule,
  updateAlertRule,
  deleteAlertRule,
  getAlertHistory,
};
