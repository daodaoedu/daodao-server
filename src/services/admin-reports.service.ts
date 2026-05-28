/**
 * Admin 報表與告警服務
 * 提供排程報表、自訂報表、告警規則的 CRUD 與查詢
 */

import { prisma } from './database/prisma.service';
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
  const rows = await prisma.$queryRaw<Array<{
    id: number;
    name: string;
    frequency: string;
    recipients: string[];
    sections: string[];
    last_sent_at: Date | null;
    is_active: boolean;
    created_at: Date;
  }>>`
    SELECT id, name, frequency, recipients, sections, last_sent_at, is_active, created_at
    FROM scheduled_reports
    ORDER BY created_at DESC
  `;

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    frequency: r.frequency as ScheduledReport['frequency'],
    recipients: r.recipients,
    sections: r.sections,
    lastSentAt: r.last_sent_at?.toISOString() ?? null,
    status: r.is_active ? 'active' : 'inactive' as ScheduledReport['status'],
    createdAt: r.created_at.toISOString(),
  }));
};

/**
 * 建立排程報表
 * @param input - 建立排程報表輸入
 */
const createScheduledReport = async (input: CreateScheduledReportInput): Promise<ScheduledReport> => {
  const [row] = await prisma.$queryRaw<Array<{
    id: number;
    name: string;
    frequency: string;
    recipients: string[];
    sections: string[];
    last_sent_at: Date | null;
    is_active: boolean;
    created_at: Date;
  }>>`
    INSERT INTO scheduled_reports (name, frequency, recipients, sections)
    VALUES (${input.name}, ${input.frequency}, ${input.recipients}::text[], ${input.sections}::text[])
    RETURNING *
  `;

  return {
    id: row.id,
    name: row.name,
    frequency: row.frequency as ScheduledReport['frequency'],
    recipients: row.recipients,
    sections: row.sections,
    lastSentAt: row.last_sent_at?.toISOString() ?? null,
    status: row.is_active ? 'active' : 'inactive' as ScheduledReport['status'],
    createdAt: row.created_at.toISOString(),
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
  const isActive = input.status === undefined ? null : input.status === 'active';
  await prisma.$executeRaw`
    UPDATE scheduled_reports
    SET
      name       = COALESCE(${input.name ?? null}, name),
      frequency  = COALESCE(${input.frequency ?? null}, frequency),
      recipients = COALESCE(${input.recipients ? input.recipients : null}::text[], recipients),
      sections   = COALESCE(${input.sections ? input.sections : null}::text[], sections),
      is_active  = COALESCE(${isActive}, is_active),
      updated_at = NOW()
    WHERE id = ${id}
  `;

  const [row] = await prisma.$queryRaw<Array<{
    id: number;
    name: string;
    frequency: string;
    recipients: string[];
    sections: string[];
    last_sent_at: Date | null;
    is_active: boolean;
    created_at: Date;
  }>>`
    SELECT id, name, frequency, recipients, sections, last_sent_at, is_active, created_at
    FROM scheduled_reports WHERE id = ${id}
  `;

  return {
    id: row.id,
    name: row.name,
    frequency: row.frequency as ScheduledReport['frequency'],
    recipients: row.recipients,
    sections: row.sections,
    lastSentAt: row.last_sent_at?.toISOString() ?? null,
    status: row.is_active ? 'active' : 'inactive' as ScheduledReport['status'],
    createdAt: row.created_at.toISOString(),
  };
};

/**
 * 刪除排程報表
 * @param id - 報表 ID
 */
const deleteScheduledReport = async (id: number): Promise<void> => {
  await prisma.$executeRaw`DELETE FROM report_executions WHERE report_id = ${id}`;
  await prisma.$executeRaw`DELETE FROM scheduled_reports WHERE id = ${id}`;
};

/**
 * 取得報表寄送歷史
 * @param reportId - 報表 ID
 */
const getReportHistory = async (
  reportId: number,
): Promise<Array<{ id: number; reportId: number; sentAt: string; status: string }>> => {
  const rows = await prisma.$queryRaw<Array<{
    id: number;
    report_id: number;
    sent_at: Date;
    status: string;
  }>>`
    SELECT id, report_id, sent_at, status
    FROM report_executions
    WHERE report_id = ${reportId}
    ORDER BY sent_at DESC
    LIMIT 50
  `;

  return rows.map((r) => ({
    id: r.id,
    reportId: r.report_id,
    sentAt: r.sent_at.toISOString(),
    status: r.status,
  }));
};

// ============================================================================
// Custom Reports
// ============================================================================

/**
 * 取得可用的報表欄位
 */
const getAvailableFields = async (): Promise<string[]> => {
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
  const result: Record<string, unknown> = {};

  const [userStats] = await prisma.$queryRaw<Array<{
    user_count: bigint;
    new_registrations: bigint;
    active_users: bigint;
  }>>`
    SELECT
      COUNT(*)::bigint AS user_count,
      COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END)::bigint AS new_registrations,
      COUNT(CASE WHEN last_active_at >= NOW() - INTERVAL '7 days' THEN 1 END)::bigint AS active_users
    FROM users
  `;

  const fieldMap: Record<string, unknown> = {
    user_count: Number(userStats?.user_count ?? 0),
    new_registrations: Number(userStats?.new_registrations ?? 0),
    active_users: Number(userStats?.active_users ?? 0),
    resource_count: 0,
    challenge_completion_rate: 0,
    average_session_duration: 0,
    revenue: 0,
  };

  for (const field of fields) {
    if (field in fieldMap) {
      result[field] = fieldMap[field];
    }
  }

  return result;
};

/**
 * 列出已儲存的自訂報表
 */
const listSavedReports = async (): Promise<CustomReportConfig[]> => {
  const rows = await prisma.$queryRaw<Array<{
    id: number;
    name: string;
    fields: string[];
    created_at: Date;
  }>>`
    SELECT id, name, fields, created_at FROM custom_report_configs ORDER BY created_at DESC
  `;

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    fields: r.fields,
    createdAt: r.created_at.toISOString(),
  }));
};

/**
 * 儲存自訂報表設定
 * @param input - 報表名稱與欄位
 */
const saveReport = async (input: { name: string; fields: string[] }): Promise<CustomReportConfig> => {
  const [row] = await prisma.$queryRaw<Array<{
    id: number;
    name: string;
    fields: string[];
    created_at: Date;
  }>>`
    INSERT INTO custom_report_configs (name, fields)
    VALUES (${input.name}, ${input.fields}::text[])
    RETURNING *
  `;

  return {
    id: row.id,
    name: row.name,
    fields: row.fields,
    createdAt: row.created_at.toISOString(),
  };
};

/**
 * 刪除已儲存的自訂報表
 * @param id - 報表設定 ID
 */
const deleteSavedReport = async (id: number): Promise<void> => {
  await prisma.$executeRaw`DELETE FROM custom_report_configs WHERE id = ${id}`;
};

// ============================================================================
// Alert Rules
// ============================================================================

/**
 * 列出所有告警規則
 */
const listAlertRules = async (): Promise<AlertRule[]> => {
  const rows = await prisma.$queryRaw<Array<{
    id: number;
    name: string;
    metric: string;
    condition: string;
    threshold: number;
    notify_channel: string;
    is_enabled: boolean;
    created_at: Date;
  }>>`
    SELECT id, name, metric, condition, threshold, notify_channel, is_enabled, created_at
    FROM alert_rules
    ORDER BY created_at DESC
  `;

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    metric: r.metric,
    condition: r.condition as AlertRule['condition'],
    threshold: r.threshold,
    notifyChannel: r.notify_channel as AlertRule['notifyChannel'],
    isEnabled: r.is_enabled,
    createdAt: r.created_at.toISOString(),
  }));
};

/**
 * 建立告警規則
 * @param input - 建立告警規則輸入
 */
const createAlertRule = async (input: CreateAlertRuleInput): Promise<AlertRule> => {
  const [row] = await prisma.$queryRaw<Array<{
    id: number;
    name: string;
    metric: string;
    condition: string;
    threshold: number;
    notify_channel: string;
    is_enabled: boolean;
    created_at: Date;
  }>>`
    INSERT INTO alert_rules (name, metric, condition, threshold, notify_channel, is_enabled)
    VALUES (${input.name}, ${input.metric}, ${input.condition}, ${input.threshold}, ${input.notifyChannel ?? 'email'}, ${input.isEnabled ?? true})
    RETURNING *
  `;

  return {
    id: row.id,
    name: row.name,
    metric: row.metric,
    condition: row.condition as AlertRule['condition'],
    threshold: row.threshold,
    notifyChannel: row.notify_channel as AlertRule['notifyChannel'],
    isEnabled: row.is_enabled,
    createdAt: row.created_at.toISOString(),
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
  await prisma.$executeRaw`
    UPDATE alert_rules
    SET
      name           = COALESCE(${input.name ?? null}, name),
      metric         = COALESCE(${input.metric ?? null}, metric),
      condition      = COALESCE(${input.condition ?? null}, condition),
      threshold      = COALESCE(${input.threshold ?? null}, threshold),
      notify_channel = COALESCE(${input.notifyChannel ?? null}, notify_channel),
      is_enabled     = COALESCE(${input.isEnabled ?? null}, is_enabled),
      updated_at     = NOW()
    WHERE id = ${id}
  `;

  const [row] = await prisma.$queryRaw<Array<{
    id: number;
    name: string;
    metric: string;
    condition: string;
    threshold: number;
    notify_channel: string;
    is_enabled: boolean;
    created_at: Date;
  }>>`
    SELECT id, name, metric, condition, threshold, notify_channel, is_enabled, created_at
    FROM alert_rules WHERE id = ${id}
  `;

  return {
    id: row.id,
    name: row.name,
    metric: row.metric,
    condition: row.condition as AlertRule['condition'],
    threshold: row.threshold,
    notifyChannel: row.notify_channel as AlertRule['notifyChannel'],
    isEnabled: row.is_enabled,
    createdAt: row.created_at.toISOString(),
  };
};

/**
 * 刪除告警規則
 * @param id - 規則 ID
 */
const deleteAlertRule = async (id: number): Promise<void> => {
  await prisma.$executeRaw`DELETE FROM alert_history WHERE rule_id = ${id}`;
  await prisma.$executeRaw`DELETE FROM alert_rules WHERE id = ${id}`;
};

/**
 * 取得告警歷史
 * @param ruleId - 規則 ID（可選，不傳則回傳全部）
 */
const getAlertHistory = async (ruleId?: number): Promise<AlertHistory[]> => {
  const rows = ruleId
    ? await prisma.$queryRaw<Array<{
        id: number;
        rule_id: number;
        rule_name: string;
        metric_value: number;
        threshold: number;
        status: string;
        triggered_at: Date;
      }>>`
        SELECT h.id, h.rule_id, r.name AS rule_name, h.metric_value, h.threshold, h.status, h.triggered_at
        FROM alert_history h
        JOIN alert_rules r ON r.id = h.rule_id
        WHERE h.rule_id = ${ruleId}
        ORDER BY h.triggered_at DESC
        LIMIT 100
      `
    : await prisma.$queryRaw<Array<{
        id: number;
        rule_id: number;
        rule_name: string;
        metric_value: number;
        threshold: number;
        status: string;
        triggered_at: Date;
      }>>`
        SELECT h.id, h.rule_id, r.name AS rule_name, h.metric_value, h.threshold, h.status, h.triggered_at
        FROM alert_history h
        JOIN alert_rules r ON r.id = h.rule_id
        ORDER BY h.triggered_at DESC
        LIMIT 100
      `;

  return rows.map((r) => ({
    id: r.id,
    ruleId: r.rule_id,
    ruleName: r.rule_name,
    triggeredAt: r.triggered_at.toISOString(),
    metricValue: r.metric_value,
    threshold: r.threshold,
    status: r.status as AlertHistory['status'],
  }));
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
