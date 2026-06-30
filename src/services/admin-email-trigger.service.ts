/**
 * Admin 觸發式信件服務
 * 提供觸發規則與信件模板的 CRUD、執行紀錄查詢
 */

import { prisma } from './database/prisma.service';
import type { JsonValue } from '../../generated/prisma/runtime/library';
import type {
  EmailTriggerRule,
  EmailTemplate,
  EmailExecutionLog,
  CreateTriggerRuleInput,
  CreateTemplateInput,
} from '../types/admin-email-trigger.types';

// ============================================================================
// Helpers
// ============================================================================

function mapTriggerRule(row: {
  id: number;
  name: string;
  description: string | null;
  trigger_type: string;
  trigger_config: JsonValue;
  template: string;
  subject: string;
  enabled: boolean;
  sent_count: number;
  open_rate: number;
  created_at: Date;
  updated_at: Date;
}): EmailTriggerRule {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    triggerType: row.trigger_type,
    triggerConfig: (row.trigger_config ?? {}) as Record<string, unknown>,
    template: row.template,
    subject: row.subject,
    enabled: row.enabled,
    sentCount: row.sent_count,
    openRate: row.open_rate,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

function mapTemplate(row: {
  id: number;
  name: string;
  slug: string | null;
  subject: string;
  preheader: string | null;
  body: string;
  variables: string[];
  data_source: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date | null;
}): EmailTemplate {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    subject: row.subject,
    preheader: row.preheader,
    body: row.body,
    variables: row.variables ?? [],
    dataSource: row.data_source as EmailTemplate['dataSource'],
    isActive: row.is_active,
    createdAt: row.created_at.toISOString(),
    updatedAt: (row.updated_at ?? row.created_at).toISOString(),
  };
}

// ============================================================================
// Trigger Rules
// ============================================================================

const listRules = async (): Promise<EmailTriggerRule[]> => {
  const rows = await prisma.email_trigger_rules.findMany({
    orderBy: { created_at: 'desc' },
  });
  return rows.map(mapTriggerRule);
};

const createRule = async (input: CreateTriggerRuleInput): Promise<EmailTriggerRule> => {
  const row = await prisma.email_trigger_rules.create({
    data: {
      name: input.name,
      description: input.description ?? null,
      trigger_type: input.triggerType,
      trigger_config: (input.triggerConfig ?? {}) as object,
      template: input.template,
      subject: input.subject ?? '',
      enabled: input.enabled ?? true,
    },
  });
  return mapTriggerRule(row);
};

const updateRule = async (
  id: number,
  input: Partial<CreateTriggerRuleInput>,
): Promise<EmailTriggerRule> => {
  const row = await prisma.email_trigger_rules.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.triggerType !== undefined && { trigger_type: input.triggerType }),
      ...(input.triggerConfig !== undefined && { trigger_config: input.triggerConfig as object }),
      ...(input.template !== undefined && { template: input.template }),
      ...(input.subject !== undefined && { subject: input.subject }),
      ...(input.enabled !== undefined && { enabled: input.enabled }),
    },
  });
  return mapTriggerRule(row);
};

const deleteRule = async (id: number): Promise<void> => {
  await prisma.email_trigger_rules.delete({ where: { id } });
};

// ============================================================================
// Email Templates
// ============================================================================

const listTemplates = async (): Promise<EmailTemplate[]> => {
  const rows = await prisma.email_templates.findMany({
    orderBy: { created_at: 'asc' },
  });
  return rows.map(mapTemplate);
};

const getTemplate = async (id: number): Promise<EmailTemplate | null> => {
  const row = await prisma.email_templates.findUnique({ where: { id } });
  if (!row) return null;
  return mapTemplate(row);
};

const createTemplate = async (input: CreateTemplateInput): Promise<EmailTemplate> => {
  const row = await prisma.email_templates.create({
    data: {
      name: input.name,
      subject: input.subject,
      preheader: input.preheader ?? null,
      body: input.body,
      variables: input.variables ?? [],
      data_source: input.dataSource ?? 'none',
      is_active: input.isActive ?? true,
      slug: input.slug ?? null,
    },
  });
  return mapTemplate(row);
};

const updateTemplate = async (
  id: number,
  input: Partial<CreateTemplateInput>,
): Promise<EmailTemplate> => {
  const row = await prisma.email_templates.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.subject !== undefined && { subject: input.subject }),
      ...(input.preheader !== undefined && { preheader: input.preheader }),
      ...(input.body !== undefined && { body: input.body }),
      ...(input.variables !== undefined && { variables: input.variables }),
      ...(input.dataSource !== undefined && { data_source: input.dataSource }),
      ...(input.isActive !== undefined && { is_active: input.isActive }),
      ...(input.slug !== undefined && { slug: input.slug }),
    },
  });
  return mapTemplate(row);
};

const deleteTemplate = async (id: number): Promise<void> => {
  await prisma.email_templates.delete({ where: { id } });
};

// ============================================================================
// Execution Logs & Stats
// ============================================================================

const getExecutionLog = async (ruleId: number): Promise<EmailExecutionLog[]> => {
  const rows = await prisma.email_trigger_logs.findMany({
    where: { rule_id: ruleId },
    orderBy: { sent_at: 'desc' },
    take: 100,
  });
  return rows.map((r) => ({
    id: r.id,
    ruleId: r.rule_id,
    ruleName: r.rule_name,
    recipient: r.recipient,
    sentAt: r.sent_at.toISOString(),
    status: r.status as 'success' | 'failed',
  }));
};

const getRuleStats = async (
  ruleId: number,
): Promise<{ totalSent: number; openRate: number; clickRate: number }> => {
  const rule = await prisma.email_trigger_rules.findUnique({ where: { id: ruleId } });
  return {
    totalSent: rule?.sent_count ?? 0,
    openRate: rule?.open_rate ?? 0,
    clickRate: 0,
  };
};

export default {
  listRules,
  createRule,
  updateRule,
  deleteRule,
  listTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getExecutionLog,
  getRuleStats,
};
