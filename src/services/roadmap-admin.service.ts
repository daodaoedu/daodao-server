/**
 * Roadmap Admin Service
 *
 * 後台路線圖項目 CRUD 與狀態機；status→done 寫 shipped_at 並通知所有支持者一次。
 * parked 預設 is_public=false。
 */

import { prisma } from './database/prisma.service';
import { NotFoundError } from '../middleware/error.middleware';
import { createSuccessResponse, createCursorPaginatedResponse } from '../utils/response-helper';
import { encodeOffsetCursor, decodeOffsetCursor } from '../utils/cursor';
import { ApiSuccessResponse, CursorPaginatedApiResponse } from '../types/api-response.types';
import { notifyRoadmapShipped } from './wishpool-notification.service';
import {
  AdminRoadmapItem,
  WishCategory,
  RoadmapStatus,
} from '../types/wishpool.types';
import {
  CreateRoadmapItemInput,
  UpdateRoadmapItemInput,
  AdminRoadmapItemListQuery,
} from '../validators/roadmap.validators';

type RoadmapItemRow = {
  id: number;
  external_id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  support_count: number;
  is_public: boolean;
  pinned: boolean;
  sort_order: number;
  shipped_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

function toAdminItem(row: RoadmapItemRow): AdminRoadmapItem {
  return {
    id: row.id,
    external_id: row.external_id,
    title: row.title,
    description: row.description,
    category: row.category as WishCategory,
    status: row.status as RoadmapStatus,
    support_count: row.support_count,
    is_public: row.is_public,
    pinned: row.pinned,
    sort_order: row.sort_order,
    shipped_at: row.shipped_at ? row.shipped_at.toISOString() : null,
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
  };
}

export async function listItems(
  query: AdminRoadmapItemListQuery,
): Promise<CursorPaginatedApiResponse<AdminRoadmapItem>> {
  const offset = decodeOffsetCursor(query.cursor);
  const limit = query.limit;

  const where = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.category ? { category: query.category } : {}),
  };

  const rows = await prisma.roadmap_items.findMany({
    where,
    orderBy: [{ pinned: 'desc' }, { sort_order: 'asc' }, { updated_at: 'desc' }],
    skip: offset,
    take: limit + 1,
  });

  const hasMore = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;
  const items = pageRows.map(toAdminItem);
  const nextCursor = hasMore ? encodeOffsetCursor(offset + limit) : null;

  return createCursorPaginatedResponse(items, {
    cursors: { start: query.cursor ?? null, end: nextCursor },
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

export async function createItem(
  input: CreateRoadmapItemInput,
): Promise<ApiSuccessResponse<AdminRoadmapItem>> {
  // parked 預設不公開（除非明確指定 is_public）
  const isPublic = input.is_public ?? (input.status === 'parked' ? false : true);

  const created = await prisma.roadmap_items.create({
    data: {
      title: input.title,
      description: input.description,
      category: input.category,
      status: input.status ?? 'collected',
      is_public: isPublic,
      pinned: input.pinned ?? false,
      sort_order: input.sort_order ?? 0,
    },
  });

  return createSuccessResponse(toAdminItem(created));
}

export async function updateItem(
  id: number,
  input: UpdateRoadmapItemInput,
  actorUserId: number,
): Promise<ApiSuccessResponse<AdminRoadmapItem>> {
  const existing = await prisma.roadmap_items.findUnique({
    where: { id },
    select: { id: true, status: true, title: true, shipped_at: true },
  });
  if (!existing) throw new NotFoundError('找不到指定的路線圖項目');

  // shipped_at 只在「首次」進入 done 時寫入；通知亦只發一次
  // （允許 done→其他→done 回退，但不重複設 shipped_at / 不重複通知）
  const firstTimeDone = input.status === 'done' && !existing.shipped_at;
  const leavingDone = input.status !== undefined && input.status !== 'done' && existing.status === 'done';
  // parked 預設不公開（未明確指定 is_public 時）
  const parkedDefaultPrivate =
    input.status === 'parked' && input.is_public === undefined ? { is_public: false } : {};

  const updated = await prisma.roadmap_items.update({
    where: { id },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.category !== undefined ? { category: input.category } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.is_public !== undefined ? { is_public: input.is_public } : {}),
      ...(input.pinned !== undefined ? { pinned: input.pinned } : {}),
      ...(input.sort_order !== undefined ? { sort_order: input.sort_order } : {}),
      ...parkedDefaultPrivate,
      ...(firstTimeDone ? { shipped_at: new Date() } : {}),
      ...(leavingDone ? { shipped_at: null } : {}),
      updated_at: new Date(),
    },
  });

  // status→done 首次觸發 roadmap.shipped（聚合於 digest 內，避免轟炸）
  if (firstTimeDone) {
    await notifyRoadmapShipped({ itemId: id, itemTitle: updated.title, actorUserId });
  }

  return createSuccessResponse(toAdminItem(updated));
}

export const roadmapAdminService = {
  listItems,
  createItem,
  updateItem,
};
