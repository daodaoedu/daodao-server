/**
 * 活動追蹤中間件
 * 自動更新用戶的最後活動時間
 */

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../services/database/prisma.service';

// 用於節流的快取（避免每個請求都更新資料庫）
const lastUpdateCache = new Map<number, number>();
const UPDATE_INTERVAL_MS = 5 * 60 * 1000; // 5 分鐘內不重複更新
const MAX_CACHE_SIZE = 10000; // 快取上限，防止記憶體洩漏

/**
 * 清理過期的快取項目
 * 移除超過更新間隔時間的舊項目
 */
const cleanupExpiredCache = (): void => {
  const now = Date.now();
  for (const [userId, timestamp] of lastUpdateCache.entries()) {
    if (now - timestamp > UPDATE_INTERVAL_MS) {
      lastUpdateCache.delete(userId);
    }
  }
};

/**
 * 確保快取不會超過上限
 * 如果超過上限，清理一半最舊的項目
 */
const ensureCacheLimit = (): void => {
  if (lastUpdateCache.size > MAX_CACHE_SIZE) {
    // 先嘗試清理過期項目
    cleanupExpiredCache();

    // 如果仍然超過上限，移除最舊的一半
    if (lastUpdateCache.size > MAX_CACHE_SIZE) {
      const entries = [...lastUpdateCache.entries()]
        .sort((a, b) => a[1] - b[1]); // 按時間戳排序
      const toRemove = entries.slice(0, Math.floor(entries.length / 2));
      toRemove.forEach(([key]) => lastUpdateCache.delete(key));
    }
  }
};

/**
 * 活動追蹤中間件
 * 在用戶發起請求時更新 last_active_at
 * 使用節流機制避免過於頻繁的資料庫操作
 */
export const trackActivity = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;

    // 只追蹤已登入且非臨時用戶
    if (!user || !user.id || user.isTemp) {
      next();
      return;
    }

    const userId = user.id;
    const now = Date.now();
    const lastUpdate = lastUpdateCache.get(userId);

    // 節流：5 分鐘內不重複更新
    if (lastUpdate && now - lastUpdate < UPDATE_INTERVAL_MS) {
      next();
      return;
    }

    // 更新快取（確保不超過上限）
    ensureCacheLimit();
    lastUpdateCache.set(userId, now);

    // 非同步更新資料庫（不阻塞請求）
    // 透過 user_activity_stats 關聯更新
    (async () => {
      try {
        const user = await prisma.users.findUnique({
          where: { id: userId },
          select: { activity_stats_id: true }
        });

        if (user?.activity_stats_id) {
          // 更新現有的 activity_stats 記錄
          await prisma.user_activity_stats.update({
            where: { id: user.activity_stats_id },
            data: { last_active_at: new Date() }
          });
        } else {
          // 創建新的 activity_stats 記錄並關聯到用戶
          const activityStats = await prisma.user_activity_stats.create({
            data: { last_active_at: new Date() }
          });
          await prisma.users.update({
            where: { id: userId },
            data: { activity_stats_id: activityStats.id }
          });
        }
      } catch (error) {
        console.error('Failed to update last_active_at:', error);
      }
    })();

    next();
  } catch (error) {
    // 錯誤不應該影響正常請求流程
    console.error('Activity tracker error:', error);
    next();
  }
};

/**
 * 清理快取（可選，用於測試或定期清理）
 */
export const clearActivityCache = (): void => {
  lastUpdateCache.clear();
};

export default trackActivity;
