/**
 * Roadmap Service
 *
 * 公開看板查詢、Hero 統計（Redis 快取）、投票／取消（transaction 維護 support_count）。
 */

import { prisma } from './database/prisma.service';
import { redis } from './database/redis.service';
import { loggerService } from './logging/logger.service';
import { NotFoundError } from '../middleware/error.middleware';
import { createSuccessResponse, createCursorPaginatedResponse } from '../utils/response-helper';
import { encodeOffsetCursor, decodeOffsetCursor } from '../utils/cursor';
import {
  ApiSuccessResponse,
  CursorPaginatedApiResponse,
} from '../types/api-response.types';
import {
  RoadmapItemPublic,
  RoadmapStats,
  ToggleSupportResult,
  BoardTab,
  WishCategory,
} from '../types/wishpool.types';

const STATS_CACHE_KEY = 'roadmap:stats';
const STATS_CACHE_TTL_SECONDS = 60 * 60; // 1 小時

/** 看板分頁 → status where 條件 */
function boardTabWhere(tab: BoardTab): { status?: string | { in: string[] } } {
  switch (tab) {
    case 'scheduled':
      return { status: { in: ['planned', 'in_progress'] } };
    case 'discussing':
      return { status: 'discussing' };
    case 'done':
      return { status: 'done' };
    default:
      return {};
  }
}

// ─── 公開看板查詢 ────────────────────────────────────────────────────────────────

export interface ListPublicItemsParams {
  tab: BoardTab;
  category?: WishCategory;
  cursor?: string;
  limit: number;
  currentUserId: number | null;
}

export async function listPublicItems(
  params: ListPublicItemsParams,
): Promise<CursorPaginatedApiResponse<RoadmapItemPublic>> {
  const { tab, category, cursor, limit, currentUserId } = params;
  const offset = decodeOffsetCursor(cursor);

  const where = {
    is_public: true,
    ...boardTabWhere(tab),
    ...(category ? { category } : {}),
  };

  // 多取一筆判斷是否還有下一頁
  const rows = await prisma.roadmap_items.findMany({
    where,
    orderBy: [{ pinned: 'desc' }, { support_count: 'desc' }, { updated_at: 'desc' }],
    skip: offset,
    take: limit + 1,
    select: {
      id: true,
      external_id: true,
      title: true,
      description: true,
      category: true,
      status: true,
      support_count: true,
    },
  });

  const hasMore = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;

  // 登入者：標示已投票項目
  let votedSet = new Set<number>();
  if (currentUserId && pageRows.length > 0) {
    const supports = await prisma.roadmap_item_supports.findMany({
      where: { user_id: currentUserId, roadmap_item_id: { in: pageRows.map((r) => r.id) } },
      select: { roadmap_item_id: true },
    });
    votedSet = new Set(supports.map((s) => s.roadmap_item_id));
  }

  const items: RoadmapItemPublic[] = pageRows.map((r) => ({
    external_id: r.external_id,
    title: r.title,
    description: r.description,
    category: r.category as WishCategory,
    status: r.status as RoadmapItemPublic['status'],
    support_count: r.support_count,
    voted: votedSet.has(r.id),
  }));

  const nextCursor = hasMore ? encodeOffsetCursor(offset + limit) : null;

  return createCursorPaginatedResponse(items, {
    cursors: { start: cursor ?? null, end: nextCursor },
    hasMore,
    count: items.length,
    limit,
    hasNext: hasMore,
    hasPrev: offset > 0,
    nextCursor,
    prevCursor: null,
    totalEstimate: null,
    parentTotalEstimate: null,
  });
}

// ─── Hero 統計（Redis 1h 快取）──────────────────────────────────────────────────

export async function getStats(): Promise<ApiSuccessResponse<RoadmapStats>> {
  try {
    const cached = await redis.get(STATS_CACHE_KEY);
    if (cached) {
      return createSuccessResponse(JSON.parse(cached) as RoadmapStats, { cacheHit: true });
    }
  } catch (error) {
    loggerService.warn('roadmap.getStats: redis read failed', {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  const [partnersResult, feedback] = await Promise.all([
    prisma.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(DISTINCT user_id)::int as count
      FROM (
        SELECT submitter_user_id AS user_id FROM wishes
        UNION
        SELECT user_id FROM roadmap_item_supports
      ) as temp
    `,
    prisma.wishes.count(),
  ]);

  const partners = partnersResult[0]?.count ?? 0;
  const stats: RoadmapStats = { partners, feedback };

  try {
    await redis.set(STATS_CACHE_KEY, JSON.stringify(stats), 'EX', STATS_CACHE_TTL_SECONDS);
  } catch (error) {
    loggerService.warn('roadmap.getStats: redis write failed', {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return createSuccessResponse(stats, { cacheHit: false });
}

// ─── 投票 / 取消（transaction 維護 support_count）───────────────────────────────

async function resolveItemId(externalId: string): Promise<number> {
  const item = await prisma.roadmap_items.findUnique({
    where: { external_id: externalId },
    select: { id: true },
  });
  if (!item) throw new NotFoundError('找不到指定的路線圖項目');
  return item.id;
}

export async function addSupport(
  externalId: string,
  userId: number,
): Promise<ApiSuccessResponse<ToggleSupportResult>> {
  const itemId = await resolveItemId(externalId);

  const result = await prisma.$transaction(async (tx) => {
    // 冪等 upsert：已投票則無動作，避免 UNIQUE 衝突（P2002）變成 500
    await tx.roadmap_item_supports.upsert({
      where: { roadmap_item_id_user_id: { roadmap_item_id: itemId, user_id: userId } },
      create: { roadmap_item_id: itemId, user_id: userId, origin: 'vote' },
      update: {},
    });
    // 以實際筆數為權威值寫回，避免 ±1 漂移／負數
    const support_count = await tx.roadmap_item_supports.count({
      where: { roadmap_item_id: itemId },
    });
    await tx.roadmap_items.update({ where: { id: itemId }, data: { support_count } });
    return { support_count, voted: true };
  });

  return createSuccessResponse(result);
}

export async function removeSupport(
  externalId: string,
  userId: number,
): Promise<ApiSuccessResponse<ToggleSupportResult>> {
  const itemId = await resolveItemId(externalId);

  const result = await prisma.$transaction(async (tx) => {
    // 冪等刪除（未投票則刪 0 筆）
    await tx.roadmap_item_supports.deleteMany({
      where: { roadmap_item_id: itemId, user_id: userId },
    });
    const support_count = await tx.roadmap_item_supports.count({
      where: { roadmap_item_id: itemId },
    });
    await tx.roadmap_items.update({ where: { id: itemId }, data: { support_count } });
    return { support_count, voted: false };
  });

  return createSuccessResponse(result);
}

export const roadmapService = {
  listPublicItems,
  getStats,
  addSupport,
  removeSupport,
};
