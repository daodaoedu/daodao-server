export interface AdminNotification {
  id: number
  title: string
  content: string
  type: 'announcement' | 'reminder' | 'system'
  targetType: 'all' | 'tag' | 'user'
  targetValue: string | null
  scheduledAt: string | null
  sentAt: string | null
  status: 'draft' | 'scheduled' | 'sent'
  readCount: number
  totalCount: number
  createdAt: string
}

export interface CreateNotificationInput {
  title: string
  content: string
  type: 'announcement' | 'reminder' | 'system'
  targetType: 'all' | 'tag' | 'user'
  targetValue?: string
  scheduledAt?: string
}
