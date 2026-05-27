import { prisma } from './database/prisma.service'
import type { AuditLogEntry, AuditLogFilters, ComplianceHoldInput, DataRetentionPolicy } from '../types/admin-audit.types'

const listAuditLogs = async (filters: AuditLogFilters): Promise<{ items: AuditLogEntry[]; total: number }> => {
  const conditions: string[] = ['1=1']
  if (filters.adminId) conditions.push(`al.admin_id = ${filters.adminId}`)
  if (filters.actionType) conditions.push(`al.action_type = '${filters.actionType}'`)
  if (filters.targetResource) conditions.push(`al.target_resource = '${filters.targetResource}'`)
  if (filters.dateFrom) conditions.push(`al.created_at >= '${filters.dateFrom}'`)
  if (filters.dateTo) conditions.push(`al.created_at <= '${filters.dateTo}'`)
  if (filters.search) conditions.push(`(al.action_type ILIKE '%${filters.search}%' OR al.target_resource ILIKE '%${filters.search}%' OR al.target_id ILIKE '%${filters.search}%')`)

  const where = conditions.join(' AND ')

  const [countResult] = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
    `SELECT COUNT(*)::bigint as count FROM audit_logs al WHERE ${where}`
  )

  const rows = await prisma.$queryRawUnsafe<Array<{
    id: number; admin_id: number; admin_name: string | null;
    action_type: string; target_resource: string; target_id: string | null;
    old_value: any; new_value: any; ip_address: string | null;
    user_agent: string | null; created_at: Date;
  }>>(
    `SELECT al.*, u.name as admin_name
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
