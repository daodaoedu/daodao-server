/**
 * Admin 觸發式信件服務
 * 提供觸發規則與信件模板的 CRUD、執行紀錄查詢
 *
 * TODO: DB 表尚未建立，目前回傳 mock 資料
 */

import type {
  EmailTriggerRule,
  EmailTemplate,
  EmailExecutionLog,
  CreateTriggerRuleInput,
  CreateTemplateInput,
} from '../types/admin-email-trigger.types';

// ============================================================================
// Trigger Rules
// ============================================================================

/**
 * 列出所有觸發規則
 */
const listRules = async (): Promise<EmailTriggerRule[]> => {
  // TODO: 實作 DB 查詢 — SELECT * FROM email_trigger_rules ORDER BY created_at DESC
  return [];
};

/**
 * 建立觸發規則
 * @param input - 建立觸發規則輸入
 */
const createRule = async (input: CreateTriggerRuleInput): Promise<EmailTriggerRule> => {
  // TODO: 實作 DB 寫入 — INSERT INTO email_trigger_rules
  return {
    id: 1,
    name: input.name,
    conditionType: input.conditionType,
    conditionValue: input.conditionValue,
    templateId: input.templateId,
    isEnabled: input.isEnabled ?? true,
    totalSent: 0,
    openRate: 0,
    clickRate: 0,
    createdAt: new Date().toISOString(),
  };
};

/**
 * 更新觸發規則
 * @param id - 規則 ID
 * @param input - 更新欄位（含 isEnabled 開關）
 */
const updateRule = async (
  id: number,
  input: Partial<CreateTriggerRuleInput>,
): Promise<EmailTriggerRule> => {
  // TODO: 實作 DB 更新 — UPDATE email_trigger_rules SET ... WHERE id = $1
  return {
    id,
    name: input.name ?? 'mock-rule',
    conditionType: input.conditionType ?? 'dormant_days',
    conditionValue: input.conditionValue ?? '7',
    templateId: input.templateId ?? 1,
    isEnabled: input.isEnabled ?? true,
    totalSent: 0,
    openRate: 0,
    clickRate: 0,
    createdAt: new Date().toISOString(),
  };
};

/**
 * 刪除觸發規則
 * @param id - 規則 ID
 */
const deleteRule = async (id: number): Promise<void> => {
  // TODO: 實作 DB 刪除 — DELETE FROM email_trigger_rules WHERE id = $1
  void id;
};

// ============================================================================
// Email Templates
// ============================================================================

/**
 * 列出所有信件模板
 */
const listTemplates = async (): Promise<EmailTemplate[]> => {
  // TODO: 實作 DB 查詢 — SELECT * FROM email_templates ORDER BY created_at DESC
  return [];
};

/**
 * 建立信件模板
 * @param input - 建立模板輸入
 */
const createTemplate = async (input: CreateTemplateInput): Promise<EmailTemplate> => {
  // TODO: 實作 DB 寫入 — INSERT INTO email_templates
  return {
    id: 1,
    name: input.name,
    subject: input.subject,
    body: input.body,
    variables: input.variables ?? [],
    createdAt: new Date().toISOString(),
  };
};

/**
 * 更新信件模板
 * @param id - 模板 ID
 * @param input - 更新欄位
 */
const updateTemplate = async (
  id: number,
  input: Partial<CreateTemplateInput>,
): Promise<EmailTemplate> => {
  // TODO: 實作 DB 更新 — UPDATE email_templates SET ... WHERE id = $1
  return {
    id,
    name: input.name ?? 'mock-template',
    subject: input.subject ?? 'Mock Subject',
    body: input.body ?? '<p>Mock body</p>',
    variables: input.variables ?? [],
    createdAt: new Date().toISOString(),
  };
};

/**
 * 刪除信件模板
 * @param id - 模板 ID
 */
const deleteTemplate = async (id: number): Promise<void> => {
  // TODO: 實作 DB 刪除 — DELETE FROM email_templates WHERE id = $1
  void id;
};

// ============================================================================
// Execution Logs & Stats
// ============================================================================

/**
 * 取得觸發規則的執行紀錄
 * @param ruleId - 規則 ID
 */
const getExecutionLog = async (ruleId: number): Promise<EmailExecutionLog[]> => {
  // TODO: 實作 DB 查詢 — SELECT * FROM email_execution_logs WHERE rule_id = $1
  void ruleId;
  return [];
};

/**
 * 取得觸發規則的統計資料
 * @param ruleId - 規則 ID
 */
const getRuleStats = async (
  ruleId: number,
): Promise<{ totalSent: number; openRate: number; clickRate: number }> => {
  // TODO: 實作 DB 聚合查詢
  void ruleId;
  return { totalSent: 0, openRate: 0, clickRate: 0 };
};

export default {
  listRules,
  createRule,
  updateRule,
  deleteRule,
  listTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getExecutionLog,
  getRuleStats,
};
