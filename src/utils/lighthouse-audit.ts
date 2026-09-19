import type { Prisma, PrismaClient } from '../../generated/prisma';
import type { LighthouseAuditAction } from '../constants/audit-action';

type Db = PrismaClient | Prisma.TransactionClient;

/**
 * 燈塔操作稽核：沿用既有 program/cohort service 直接寫 audit_logs 的作法（admin_id 放操作者 user id）。
 */
export const writeLighthouseAudit = async (
  db: Db,
  actorId: number,
  action: LighthouseAuditAction,
  targetResource: string,
  targetId: number | string,
  oldValue: Record<string, unknown>,
  newValue: Record<string, unknown>
): Promise<void> => {
  await db.$executeRaw`
    INSERT INTO audit_logs (admin_id, action_type, target_resource, target_id, old_value, new_value)
    VALUES (${actorId}, ${action}, ${targetResource}, ${String(targetId)},
            ${JSON.stringify(oldValue)}::jsonb, ${JSON.stringify(newValue)}::jsonb)
  `;
};
