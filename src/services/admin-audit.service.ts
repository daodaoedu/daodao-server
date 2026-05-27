import { Prisma } from '../../generated/prisma'
import { prisma } from './database/prisma.service'
import type { AuditLogEntry, AuditLogFilters, ComplianceHoldInput, DataRetentionPolicy } from '../types/admin-audit.types'

const listAuditLogs = async (filters: AuditLogFilters): Promise<{ items: AuditLogEntry[]; total: number }> => {
  const conditions: Prisma.Sql[] = [Prisma.sql`1=1`]
  if (filters.adminId) conditions.push(Prisma.sql`al.admin_id = ${filters.adminId}`)
  if (filters.actionType) conditions.push(Prisma.sql`al.action_type = ${filters.actionType}`)
  if (filters.targetResource) conditions.push(Prisma.sql`al.target_resource = ${filters.targetResource}`)
  if (filters.dateFrom) conditions.push(Prisma.sql`al.created_at >= ${filters.dateFrom}`)
  if (filters.dateTo) conditions.push(Prisma.sql`al.created_at <= ${filters.dateTo}`)
  if (filters.search) {
    const searchPattern = `%${filters.search}%`
    conditions.push(Prisma.sql`(al.action_type ILIKE ${searchPattern} OR al.target_resource ILIKE ${searchPattern} OR al.target_id ILIKE ${searchPattern})`)
  }

  const where = Prisma.join(conditions, ' AND ')

  const [countResult] = await prisma.$queryRaw<Array<{ count: bigint }>>(
    Prisma.sql`SELECT COUNT(*)::bigint as count FROM audit_logs al WHERE ${where}`
  )

  const rows = await prisma.$queryRaw<Array<{
    id: number; admin_id: number; admin_name: string | null;
    action_type: string; target_resource: string; target_id: string | null;
    old_value: Record<string, unknown> | null; new_value: Record<string, unknown> | null; ip_address: string | null;
    user_agent: string | null; created_at: Date;
  }>>(
    Prisma.sql`SELECT al.*, u.name as admin_name
     FROM audit_logs al
     LEFT JOIN users u ON al.admin_id = u.id
     WHERE ${where}
     ORDER BY al.created_at DESC
     LIMIT ${filters.limit} OFFSET ${filters.offset}`
  )

  return {
    total: Number(countResult?.count ?? 0),
    items: rows.map(r => ({
      id: r.id,
      adminId: r.admin_id,
      adminName: r.admin_name,
      actionType: r.action_type,
      targetResource: r.target_resource,
      targetId: r.target_id,
      oldValue: r.old_value,
      newValue: r.new_value,
      ipAddress: r.ip_address,
      userAgent: r.user_agent,
      createdAt: r.created_at.toISOString(),
    })),
  }
}

const createAuditLog = async (entry: {
  adminId: number; actionType: string; targetResource: string;
  targetId?: string; oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>; ipAddress?: string; userAgent?: string;
}): Promise<void> => {
  await prisma.$executeRaw`
    INSERT INTO audit_logs (admin_id, action_type, target_resource, target_id, old_value, new_value, ip_address, user_agent)
    VALUES (${entry.adminId}, ${entry.actionType}, ${entry.targetResource}, ${entry.targetId ?? null},
            ${entry.oldValue ? JSON.stringify(entry.oldValue) : null}::jsonb,
            ${entry.newValue ? JSON.stringify(entry.newValue) : null}::jsonb,
            ${entry.ipAddress ?? null}::inet, ${entry.userAgent ?? null})
  `
}

const setComplianceHold = async (input: ComplianceHoldInput): Promise<{ success: boolean }> => {
  await prisma.$executeRaw`
    INSERT INTO compliance_holds (date_from, date_to, reason)
    VALUES (${input.dateFrom}::date, ${input.dateTo}::date, ${input.reason})
  `
  return { success: true }
}

const getDataRetentionPolicy = async (): Promise<DataRetentionPolicy> => {
  // For now return defaults; can be stored in a settings table later
  return { auditLogRetentionDays: 365, userDataRetentionDays: 90, contentRetentionDays: 365 }
}

const updateDataRetentionPolicy = async (policy: DataRetentionPolicy): Promise<DataRetentionPolicy> => {
  return policy
}

export default { listAuditLogs, createAuditLog, setComplianceHold, getDataRetentionPolicy, updateDataRetentionPolicy }
