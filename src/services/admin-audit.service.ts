import type { AuditLogEntry, AuditLogFilters, ComplianceHoldInput, DataRetentionPolicy } from '../types/admin-audit.types'

const listAuditLogs = async (filters: AuditLogFilters): Promise<{ items: AuditLogEntry[]; total: number }> => {
  // TODO: query from audit_logs table after migration
  return { items: [], total: 0 }
}

const createAuditLog = async (entry: {
  adminId: number
  actionType: string
  targetResource: string
  targetId?: string
  oldValue?: Record<string, unknown>
  newValue?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}): Promise<void> => {
  // TODO: insert into audit_logs table after migration
}

const setComplianceHold = async (input: ComplianceHoldInput): Promise<{ success: boolean }> => {
  return { success: true }
}

const getDataRetentionPolicy = async (): Promise<DataRetentionPolicy> => {
  return {
    auditLogRetentionDays: 365,
    userDataRetentionDays: 90,
    contentRetentionDays: 365,
  }
}

const updateDataRetentionPolicy = async (policy: DataRetentionPolicy): Promise<DataRetentionPolicy> => {
  return policy
}

export default {
  listAuditLogs,
  createAuditLog,
  setComplianceHold,
  getDataRetentionPolicy,
  updateDataRetentionPolicy,
}
