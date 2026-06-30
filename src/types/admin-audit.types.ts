export interface AuditLogEntry {
  id: number
  adminId: number
  adminName: string | null
  actionType: string
  targetResource: string
  targetId: string | null
  oldValue: Record<string, unknown> | null
  newValue: Record<string, unknown> | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
}

export interface AuditLogFilters {
  adminId?: number
  actionType?: string
  targetResource?: string
  search?: string
  dateFrom?: string
  dateTo?: string
  limit: number
  offset: number
}

export interface ComplianceHoldInput {
  dateFrom: string
  dateTo: string
  reason: string
}

export interface DataRetentionPolicy {
  auditLogRetentionDays: number
  userDataRetentionDays: number
  contentRetentionDays: number
}
