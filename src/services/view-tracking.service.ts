/**
 * 通用瀏覽追蹤服務
 *
 * 處理所有 entity 類型的瀏覽事件記錄，包含：
 * - Redis 去重（24h TTL）
 * - entity_stats.view_count upsert（顯示用）
 * - interaction_events insert（推薦系統原始資料）
 */

import { prisma } from './database/prisma.service';
import redis from './database/redis.service';
import { loggerService } from './logging/logger.service';

const DEDUP_TTL_SECONDS = 86400; // 24h

/**
 * 記錄一次瀏覽事件。
 * 同一使用者對同一 entity 在 24h 內重複呼叫時不計數，直接回傳現有 viewCount。
 *
 * @returns 目前的 view_count
 */
export async function recordView(
  entityType: string,
  entityId: number,
  userId: number,
): Promise<number> {
  const dedupKey = `dedup:view:${entityType}:${entityId}:${userId}`;

  // Redis SETNX：key 不存在時設置並回傳 "OK"，已存在回傳 null
  // 若 Redis 不可用則 fallback 至直接寫 DB（可能短暫重複計數，可接受）
  let isNew: boolean;
  try {
    const result = await redis.set(dedupKey, '1', 'EX', DEDUP_TTL_SECONDS, 'NX');
    isNew = result === 'OK';
  } catch (redisError) {
    loggerService.warn('view-tracking: Redis unavailable, skipping dedup', { entityType, entityId, userId, redisError });
    isNew = true; // fallback：當作新瀏覽，允許短暫重複計數
  }

  if (!isNew) {
    // 24h 內重複瀏覽，回傳現有計數
    const existing = await prisma.entity_stats.findUnique({
      where: { entity_type_entity_id: { entity_type: entityType, entity_id: entityId } },
      select: { view_count: true },
    });
    return existing?.view_count ?? 0;
  }

  // 並行寫入 entity_stats 與 interaction_events（非阻塞，錯誤不往上拋）
  try {
    const [stats] = await Promise.all([
      prisma.entity_stats.upsert({
        where: { entity_type_entity_id: { entity_type: entityType, entity_id: entityId } },
        create: { entity_type: entityType, entity_id: entityId, view_count: 1 },
        update: { view_count: { increment: 1 }, updated_at: new Date() },
        select: { view_count: true },
      }),
      prisma.interaction_events.create({
        data: { entity_type: entityType, entity_id: entityId, user_id: userId, event_type: 'view' },
      }),
    ]);
    return stats.view_count;
  } catch (error) {
    loggerService.error('view-tracking: failed to write DB', { entityType, entityId, userId, error });
    // 不影響主流程，回傳 0 而非拋出
    return 0;
  }
}

/**
 * 取得 entity 目前的 view_count（無記錄或 DB 錯誤時回傳 0）。
 */
export async function getViewCount(entityType: string, entityId: number): Promise<number> {
  try {
    const stats = await prisma.entity_stats.findUnique({
      where: { entity_type_entity_id: { entity_type: entityType, entity_id: entityId } },
      select: { view_count: true },
    });
    return stats?.view_count ?? 0;
  } catch (error) {
    loggerService.error('view-tracking: failed to get view count', { entityType, entityId, error });
    return 0;
  }
}
