/**
 * Admin 觸發式信件服務
 * 提供觸發規則與信件模板的 CRUD、執行紀錄查詢
 */

import { prisma } from './database/prisma.service';
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
  const rows = await prisma.$queryRaw<Array<{
    id: number;
    name: string;
    condition_type: string;
    condition_value: string;
    template_id: number | null;
    is_enabled: boolean;
    created_at: Date;
    total_sent: bigint;
    open_count: bigint;
    click_count: bigint;
  }>>`
    SELECT r.id, r.name, r.condition_type, r.condition_value, r.template_id, r.is_enabled, r.created_at,
           COUNT(l.id)::bigint AS total_sent,
           COUNT(l.opened_at)::bigint AS open_count,
           COUNT(l.clicked_at)::bigint AS click_count
    FROM email_trigger_rules r
    LEFT JOIN email_execution_log l ON l.rule_id = r.id AND l.status = 'sent'
    GROUP BY r.id
    ORDER BY r.created_at DESC
  `;

  return rows.map((r) => {
    const totalSent = Number(r.total_sent);
    const openCount = Number(r.open_count);
    const clickCount = Number(r.click_count);
    return {
      id: r.id,
      name: r.name,
      conditionType: r.condition_type as EmailTriggerRule['conditionType'],
      conditionValue: r.condition_value,
      templateId: r.template_id ?? 0,
      isEnabled: r.is_enabled,
      totalSent,
      openRate: totalSent > 0 ? Math.round((openCount / totalSent) * 1000) / 10 : 0,
      clickRate: totalSent > 0 ? Math.round((clickCount / totalSent) * 1000) / 10 : 0,
      createdAt: r.created_at.toISOString(),
    };
  });
};

/**
 * 建立觸發規則
 * @param input - 建立觸發規則輸入
 */
const createRule = async (input: CreateTriggerRuleInput): Promise<EmailTriggerRule> => {
  const [row] = await prisma.$queryRaw<Array<{
    id: number;
    name: string;
    condition_type: string;
    condition_value: string;
    template_id: number | null;
    is_enabled: boolean;
    created_at: Date;
  }>>`
    INSERT INTO email_trigger_rules (name, condition_type, condition_value, template_id, is_enabled)
    VALUES (${input.name}, ${input.conditionType}, ${input.conditionValue}, ${input.templateId}, ${input.isEnabled ?? true})
    RETURNING *
  `;

  return {
    id: row.id,
    name: row.name,
    conditionType: row.condition_type as EmailTriggerRule['conditionType'],
    conditionValue: row.condition_value,
    templateId: row.template_id ?? 0,
    isEnabled: row.is_enabled,
    totalSent: 0,
    openRate: 0,
    clickRate: 0,
    createdAt: row.created_at.toISOString(),
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
  await prisma.$executeRaw`
    UPDATE email_trigger_rules
    SET
      name           = COALESCE(${input.name ?? null}, name),
      condition_type = COALESCE(${input.conditionType ?? null}, condition_type),
      condition_value= COALESCE(${input.conditionValue ?? null}, condition_value),
      template_id    = COALESCE(${input.templateId ?? null}, template_id),
      is_enabled     = COALESCE(${input.isEnabled ?? null}, is_enabled),
      updated_at     = NOW()
    WHERE id = ${id}
  `;

  const [row] = await prisma.$queryRaw<Array<{
    id: number;
    name: string;
    condition_type: string;
    condition_value: string;
    template_id: number | null;
    is_enabled: boolean;
    created_at: Date;
  }>>`
    SELECT id, name, condition_type, condition_value, template_id, is_enabled, created_at
    FROM email_trigger_rules WHERE id = ${id}
  `;

  return {
    id: row.id,
    name: row.name,
    conditionType: row.condition_type as EmailTriggerRule['conditionType'],
    conditionValue: row.condition_value,
    templateId: row.template_id ?? 0,
    isEnabled: row.is_enabled,
    totalSent: 0,
    openRate: 0,
    clickRate: 0,
    createdAt: row.created_at.toISOString(),
  };
};

/**
 * 刪除觸發規則
 * @param id - 規則 ID
 */
const deleteRule = async (id: number): Promise<void> => {
  await prisma.$executeRaw`UPDATE email_execution_log SET rule_id = NULL WHERE rule_id = ${id}`;
  await prisma.$executeRaw`DELETE FROM email_trigger_rules WHERE id = ${id}`;
};

// ============================================================================
// Email Templates
// ============================================================================

/**
 * 列出所有信件模板
 */
const listTemplates = async (): Promise<EmailTemplate[]> => {
  const rows = await prisma.$queryRaw<Array<{
    id: number;
    name: string;
    subject: string;
    body: string;
    variables: string[];
    created_at: Date;
  }>>`
    SELECT id, name, subject, body, variables, created_at
    FROM email_templates
    ORDER BY created_at DESC
  `;

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    subject: r.subject,
    body: r.body,
    variables: r.variables,
    createdAt: r.created_at.toISOString(),
  }));
};

/**
 * 建立信件模板
 * @param input - 建立模板輸入
 */
const createTemplate = async (input: CreateTemplateInput): Promise<EmailTemplate> => {
  const variables = input.variables ?? [];
  const [row] = await prisma.$queryRaw<Array<{
    id: number;
    name: string;
    subject: string;
    body: string;
    variables: string[];
    created_at: Date;
  }>>`
    INSERT INTO email_templates (name, subject, body, variables)
    VALUES (${input.name}, ${input.subject}, ${input.body}, ${variables}::text[])
    RETURNING *
  `;

  return {
    id: row.id,
    name: row.name,
    subject: row.subject,
    body: row.body,
    variables: row.variables,
    createdAt: row.created_at.toISOString(),
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
  await prisma.$executeRaw`
    UPDATE email_templates
    SET
      name       = COALESCE(${input.name ?? null}, name),
      subject    = COALESCE(${input.subject ?? null}, subject),
      body       = COALESCE(${input.body ?? null}, body),
      variables  = COALESCE(${input.variables ? input.variables : null}::text[], variables),
      updated_at = NOW()
    WHERE id = ${id}
  `;

  const [row] = await prisma.$queryRaw<Array<{
    id: number;
    name: string;
    subject: string;
    body: string;
    variables: string[];
    created_at: Date;
  }>>`
    SELECT id, name, subject, body, variables, created_at FROM email_templates WHERE id = ${id}
  `;

  return {
    id: row.id,
    name: row.name,
    subject: row.subject,
    body: row.body,
    variables: row.variables,
    createdAt: row.created_at.toISOString(),
  };
};

/**
 * 刪除信件模板
 * @param id - 模板 ID
 */
const deleteTemplate = async (id: number): Promise<void> => {
  await prisma.$executeRaw`DELETE FROM email_templates WHERE id = ${id}`;
};

// ============================================================================
// Execution Logs & Stats
// ============================================================================

/**
 * 取得觸發規則的執行紀錄
 * @param ruleId - 規則 ID
 */
const getExecutionLog = async (ruleId: number): Promise<EmailExecutionLog[]> => {
  const rows = await prisma.$queryRaw<Array<{
    id: number;
    rule_id: number | null;
    rule_name: string;
    recipient_email: string;
    status: string;
    sent_at: Date;
    opened_at: Date | null;
    clicked_at: Date | null;
  }>>`
    SELECT l.id, l.rule_id, r.name AS rule_name, l.recipient_email,
           l.status, l.sent_at, l.opened_at, l.clicked_at
    FROM email_execution_log l
    LEFT JOIN email_trigger_rules r ON r.id = l.rule_id
    WHERE l.rule_id = ${ruleId}
    ORDER BY l.sent_at DESC
    LIMIT 100
  `;

  return rows.map((r) => ({
    id: r.id,
    ruleId: r.rule_id ?? ruleId,
    ruleName: r.rule_name,
    recipientEmail: r.recipient_email,
    sentAt: r.sent_at.toISOString(),
    status: r.status as EmailExecutionLog['status'],
    openedAt: r.opened_at?.toISOString() ?? null,
    clickedAt: r.clicked_at?.toISOString() ?? null,
  }));
};

/**
 * 取得觸發規則的統計資料
 * @param ruleId - 規則 ID
 */
const getRuleStats = async (
  ruleId: number,
): Promise<{ totalSent: number; openRate: number; clickRate: number }> => {
  const [stats] = await prisma.$queryRaw<Array<{
    total_sent: bigint;
    opened: bigint;
    clicked: bigint;
  }>>`
    SELECT
      COUNT(*)::bigint AS total_sent,
      COUNT(opened_at)::bigint AS opened,
      COUNT(clicked_at)::bigint AS clicked
    FROM email_execution_log
    WHERE rule_id = ${ruleId} AND status = 'sent'
  `;

  const totalSent = Number(stats?.total_sent ?? 0);
  const opened = Number(stats?.opened ?? 0);
  const clicked = Number(stats?.clicked ?? 0);

  return {
    totalSent,
    openRate: totalSent > 0 ? Math.round((opened / totalSent) * 1000) / 10 : 0,
    clickRate: totalSent > 0 ? Math.round((clicked / totalSent) * 1000) / 10 : 0,
  };
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
