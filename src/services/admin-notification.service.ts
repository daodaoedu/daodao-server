/**
 * Admin 通知服務
 * 提供通知 CRUD、發送、統計功能
 */

import { prisma } from './database/prisma.service'
import type { AdminNotification, CreateNotificationInput } from '../types/admin-notification.types'

/**
 * 列出所有通知（含已讀統計）
 */
const listNotifications = async (): Promise<AdminNotification[]> => {
  const rows = await prisma.$queryRaw<Array<{
    id: number; title: string; content: string; type: string; target_type: string;
    target_value: string | null; scheduled_at: Date | null; sent_at: Date | null;
    status: string; created_at: Date; read_count: bigint; total_count: bigint;
  }>>`
    SELECT n.*,
      (SELECT COUNT(*) FROM notification_reads nr WHERE nr.notification_id = n.id)::bigint as read_count,
      CASE
        WHEN n.target_type = 'all' THEN (SELECT COUNT(*) FROM users)::bigint
        ELSE 0::bigint
      END as total_count
    FROM admin_notifications n
    ORDER BY n.created_at DESC
  `

  return rows.map(r => ({
    id: r.id,
    title: r.title,
    content: r.content,
    type: r.type as AdminNotification['type'],
    targetType: r.target_type as AdminNotification['targetType'],
    targetValue: r.target_value,
    scheduledAt: r.scheduled_at?.toISOString() ?? null,
    sentAt: r.sent_at?.toISOString() ?? null,
    status: r.status as AdminNotification['status'],
    readCount: Number(r.read_count),
    totalCount: Number(r.total_count),
    createdAt: r.created_at.toISOString(),
  }))
}

/**
 * 建立通知
 * @param input - 建立通知輸入
 */
const createNotification = async (input: CreateNotificationInput): Promise<AdminNotification> => {
  const [row] = await prisma.$queryRaw<Array<{
    id: number; title: string; content: string; type: string;
    target_type: string; target_value: string | null;
    scheduled_at: Date | null; sent_at: Date | null;
    status: string; created_at: Date;
  }>>`
    INSERT INTO admin_notifications (title, content, type, target_type, target_value, scheduled_at, status)
    VALUES (${input.title}, ${input.content}, ${input.type}, ${input.targetType}, ${input.targetValue ?? null}, ${input.scheduledAt ? new Date(input.scheduledAt) : null}, ${input.scheduledAt ? 'scheduled' : 'draft'})
    RETURNING *
  `

  return {
    id: row.id,
    title: row.title,
    content: row.content,
    type: row.type as AdminNotification['type'],
    targetType: row.target_type as AdminNotification['targetType'],
    targetValue: row.target_value,
    scheduledAt: row.scheduled_at?.toISOString() ?? null,
    sentAt: row.sent_at?.toISOString() ?? null,
    status: row.status as AdminNotification['status'],
    readCount: 0,
    totalCount: 0,
    createdAt: row.created_at.toISOString(),
  }
}

/**
 * 發送通知
 * @param id - 通知 ID
 */
const sendNotification = async (id: number): Promise<{ sent: boolean }> => {
  await prisma.$executeRaw`UPDATE admin_notifications SET status = 'sent', sent_at = NOW() WHERE id = ${id}`
  return { sent: true }
}

/**
 * 取得通知統計
 * @param id - 通知 ID
 */
const getNotificationStats = async (id: number): Promise<{ readCount: number; totalCount: number; readRate: number }> => {
  const [stats] = await prisma.$queryRaw<Array<{ read_count: bigint; total_count: bigint }>>`
    SELECT
      (SELECT COUNT(*) FROM notification_reads WHERE notification_id = ${id})::bigint as read_count,
      (SELECT COUNT(*) FROM users)::bigint as total_count
  `
  const readCount = Number(stats?.read_count ?? 0)
  const totalCount = Number(stats?.total_count ?? 0)
  return { readCount, totalCount, readRate: totalCount > 0 ? Math.round((readCount / totalCount) * 1000) / 10 : 0 }
}

export default { listNotifications, createNotification, sendNotification, getNotificationStats }
