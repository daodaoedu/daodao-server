import { prisma } from './database/prisma.service';
import type { Prisma } from '../../generated/prisma';

export class EmailTriggerService {
  async listRules(params: {
    limit: number;
    offset: number;
    enabled?: boolean;
  }) {
    const where: Prisma.email_trigger_rulesWhereInput = {};
    if (params.enabled !== undefined) {
      where.enabled = params.enabled;
    }

    const [items, total] = await Promise.all([
      prisma.email_trigger_rules.findMany({
        where,
        orderBy: { created_at: 'desc' },
        take: params.limit,
        skip: params.offset,
      }),
      prisma.email_trigger_rules.count({ where }),
    ]);

    return { items, total };
  }

  async getRuleById(id: number) {
    return prisma.email_trigger_rules.findUnique({ where: { id } });
  }

  async createRule(data: {
    name: string;
    description?: string;
    trigger_type: string;
    trigger_config: object;
    template: string;
    subject: string;
    enabled: boolean;
    created_by?: number;
  }) {
    return prisma.email_trigger_rules.create({
      data: {
        name: data.name,
        description: data.description,
        trigger_type: data.trigger_type,
        trigger_config: data.trigger_config as Prisma.InputJsonValue,
        template: data.template,
        subject: data.subject,
        enabled: data.enabled,
        created_by: data.created_by,
      },
    });
  }

  async updateRule(id: number, data: Partial<{
    name: string;
    description: string | null;
    trigger_type: string;
    trigger_config: object;
    template: string;
    subject: string;
    enabled: boolean;
  }>) {
    const updateData: Prisma.email_trigger_rulesUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.trigger_type !== undefined) updateData.trigger_type = data.trigger_type;
    if (data.trigger_config !== undefined) updateData.trigger_config = data.trigger_config as Prisma.InputJsonValue;
    if (data.template !== undefined) updateData.template = data.template;
    if (data.subject !== undefined) updateData.subject = data.subject;
    if (data.enabled !== undefined) updateData.enabled = data.enabled;

    return prisma.email_trigger_rules.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteRule(id: number) {
    return prisma.email_trigger_rules.delete({ where: { id } });
  }

  async toggleRule(id: number, enabled: boolean) {
    return prisma.email_trigger_rules.update({
      where: { id },
      data: { enabled },
    });
  }

  async listLogs(params: {
    limit: number;
    offset: number;
    rule_id?: number;
    status?: string;
  }) {
    const where: Prisma.email_trigger_logsWhereInput = {};
    if (params.rule_id !== undefined) where.rule_id = params.rule_id;
    if (params.status !== undefined) where.status = params.status;

    const [items, total] = await Promise.all([
      prisma.email_trigger_logs.findMany({
        where,
        orderBy: { sent_at: 'desc' },
        take: params.limit,
        skip: params.offset,
      }),
      prisma.email_trigger_logs.count({ where }),
    ]);

    return { items, total };
  }

  async getStats() {
    const [totalRules, enabledRules, totalLogs, successLogs] = await Promise.all([
      prisma.email_trigger_rules.count(),
      prisma.email_trigger_rules.count({ where: { enabled: true } }),
      prisma.email_trigger_logs.count({
        where: {
          sent_at: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      prisma.email_trigger_logs.count({
        where: {
          status: 'success',
          sent_at: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
    ]);

    const avgOpenRate = await prisma.email_trigger_rules.aggregate({
      _avg: { open_rate: true },
      where: { enabled: true },
    });

    return {
      totalRules,
      enabledRules,
      monthlySent: totalLogs,
      monthlySuccess: successLogs,
      avgOpenRate: avgOpenRate._avg.open_rate ?? 0,
    };
  }
}

export const emailTriggerService = new EmailTriggerService();
export default emailTriggerService;
