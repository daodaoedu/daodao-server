import type { AdminNotification, CreateNotificationInput } from '../types/admin-notification.types'

const listNotifications = async (): Promise<AdminNotification[]> => {
  // TODO: query from notifications table after migration
  return []
}

const createNotification = async (input: CreateNotificationInput): Promise<AdminNotification> => {
  // TODO: insert into notifications table after migration
  return {
    id: 1,
    title: input.title,
    content: input.content,
    type: input.type,
    targetType: input.targetType,
    targetValue: input.targetValue ?? null,
    scheduledAt: input.scheduledAt ?? null,
    sentAt: null,
    status: input.scheduledAt ? 'scheduled' : 'draft',
    readCount: 0,
    totalCount: 0,
    createdAt: new Date().toISOString(),
  }
}

const sendNotification = async (id: number): Promise<{ sent: boolean }> => {
  // TODO: implement actual sending
  return { sent: true }
}

const getNotificationStats = async (id: number): Promise<{ readCount: number; totalCount: number; readRate: number }> => {
  return { readCount: 0, totalCount: 0, readRate: 0 }
}

export default { listNotifications, createNotification, sendNotification, getNotificationStats }
