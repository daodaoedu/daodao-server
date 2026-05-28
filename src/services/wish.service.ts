/**
 * Wish Service
 *
 * 使用者許願提交，以及後台收件匣查詢、歸併、促成、封存。
 * 「歸併即投票」：link/promote 時以 origin='wish_link' upsert 一筆 support（UNIQUE 去重，已投票者略過）。
 */

import { Prisma } from '../../generated/prisma';
import { prisma } from './database/prisma.service';
import { NotFoundError, BadRequestError } from '../middleware/error.middleware';
import { createSuccessResponse, createCursorPaginatedResponse } from '../utils/response-helper';
import { encodeOffsetCursor, decodeOffsetCursor } from '../utils/cursor';
import { notifyWishLinked } from './wishpool-notification.service';
import { roadmapService } from './roadmap.service';
import {
  ApiSuccessResponse,
  CursorPaginatedApiResponse,
} from '../types/api-response.types';
import {
  AdminWishItem,
  RoadmapItemPublic,
  ToggleSupportResult,
  WishCategory,
  WishStatus,
  WishSource,
} from '../types/wishpool.types';
import {
  CreateWishInput,
  PublicWishListQuery,
  AdminWishListQuery,
  LinkWishInput,
  PromoteWishInput,
} from '../validators/wish.validators';

const WISH_EXTERNAL_ID_PATTERN = /^wish-(\d+)$/u;

const parseWishExternalId = (externalId: string): number => {
  const match = externalId.match(WISH_EXTERNAL_ID_PATTERN);
  if (!match) {
    throw new BadRequestError('externalId 格式錯誤，預期 wish-<id>');
  }
  const wishId = Number.parseInt(match[1], 10);
  if (!Number.isInteger(wishId) || wishId <= 0) {
    throw new BadRequestError('externalId 解析失敗');
  }
  return wishId;
};

const ensureWishSupportItem = async (wishId: number): Promise<number> => {
  const result = await prisma.$transaction(async (tx) => {
    const wish = await tx.wishes.findUnique({
      where: { id: wishId },
      select: {
        id: true,
        category: true,
        situation: true,
        desire: true,
        linked_roadmap_item_id: true,
      },
    });
    if (!wish) {
      throw new NotFoundError('找不到指定的許願');
    }

    if (wish.linked_roadmap_item_id) {
      return wish.linked_roadmap_item_id;
    }

    const item = await tx.roadmap_items.create({
      data: {
        title: wish.desire,
        description: `情境：${wish.situation}\n期待：${wish.desire}`,
        category: wish.category,
        status: 'discussing',
        is_public: false,
        support_count: 0,
      },
      select: { id: true },
    });

    await tx.wishes.update({
      where: { id: wishId },
      data: {
        linked_roadmap_item_id: item.id,
        updated_at: new Date(),
      },
    });

    return item.id;
  });
  return result;
};

// ─── 使用者許願提交 ──────────────────────────────────────────────────────────────

export async function createWish(
  input: CreateWishInput,
  userId: number,
  source: WishSource = 'web',
): Promise<ApiSuccessResponse<{ id: number }>> {
  // contact_email 預設取帳號 email
  let contactEmail = input.contact_email ?? null;
  if (!contactEmail) {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { contacts: { select: { email: true } } },
    });
    contactEmail = user?.contacts?.email ?? null;
  }

  const wish = await prisma.wishes.create({
    data: {
      category: input.category,
      situation: input.situation,
      desire: input.desire,
      submitter_user_id: userId,
      contact_email: contactEmail,
      source,
    },
    select: { id: true },
  });

  return createSuccessResponse({ id: wish.id });
}

// ─── 後台收件匣查詢 ──────────────────────────────────────────────────────────────

export async function listWishes(
  query: AdminWishListQuery,
): Promise<CursorPaginatedApiResponse<AdminWishItem>> {
  const offset = decodeOffsetCursor(query.cursor);
  const limit = query.limit;

  const where: Prisma.wishesWhereInput = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.category ? { category: query.category } : {}),
    ...(query.q
      ? {
          OR: [
            { situation: { contains: query.q, mode: 'insensitive' } },
            { desire: { contains: query.q, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const rows = await prisma.wishes.findMany({
    where,
    orderBy: { created_at: 'desc' },
    skip: offset,
    take: limit + 1,
    select: {
      id: true,
      category: true,
      situation: true,
      desire: true,
      status: true,
      contact_email: true,
      internal_module_tag: true,
      source: true,
      linked_roadmap_item_id: true,
      created_at: true,
      submitter: {
        select: {
          external_id: true,
          nickname: true,
          contacts: { select: { email: true } },
        },
      },
    },
  });

  const hasMore = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;

  const items: AdminWishItem[] = pageRows.map((w) => ({
    id: w.id,
    category: w.category as WishCategory,
    situation: w.situation,
    desire: w.desire,
    status: w.status as WishStatus,
    contact_email: w.contact_email,
    internal_module_tag: w.internal_module_tag,
    source: w.source as WishSource,
    linked_roadmap_item_id: w.linked_roadmap_item_id,
    created_at: w.created_at.toISOString(),
    submitter: {
      external_id: w.submitter.external_id,
      nickname: w.submitter.nickname,
      email: w.submitter.contacts?.email ?? null,
    },
  }));

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

// ─── 前台許願池查詢 ──────────────────────────────────────────────────────────────

export async function listPublicWishes(
  query: PublicWishListQuery,
  currentUserId: number | null = null,
): Promise<CursorPaginatedApiResponse<RoadmapItemPublic>> {
  const offset = decodeOffsetCursor(query.cursor);
  const limit = query.limit;

  const where: Prisma.wishesWhereInput = {
    status: query.status,
    ...(query.category ? { category: query.category } : {}),
  };

  const rows = await prisma.wishes.findMany({
    where,
    orderBy: { created_at: 'desc' },
    skip: offset,
    take: limit + 1,
    select: {
      id: true,
      situation: true,
      desire: true,
      category: true,
      linked_roadmap_item_id: true,
    },
  });

  const hasMore = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;
  const linkedItemIds = pageRows
    .map((row) => row.linked_roadmap_item_id)
    .filter((id): id is number => typeof id === 'number' && id > 0);

  const linkedItemSupportCounts =
    linkedItemIds.length > 0
      ? Object.fromEntries(
          (
            await prisma.roadmap_item_supports.groupBy({
              by: ['roadmap_item_id'],
              where: { roadmap_item_id: { in: linkedItemIds } },
              _count: { _all: true },
            })
          ).map((item) => [item.roadmap_item_id, item._count._all]),
        )
      : {};
  const votedSet = new Set<number>();
  if (currentUserId && linkedItemIds.length > 0) {
    const supports = await prisma.roadmap_item_supports.findMany({
      where: { user_id: currentUserId, roadmap_item_id: { in: linkedItemIds } },
      select: { roadmap_item_id: true },
    });
    supports.forEach((support) => votedSet.add(support.roadmap_item_id));
  }

  const items: RoadmapItemPublic[] = pageRows.map((row) => ({
    external_id: `wish-${row.id}`,
    title: row.desire,
    description: `情境：${row.situation}\n期待：${row.desire}`,
    category: row.category as WishCategory,
    status: 'discussing',
    support_count: row.linked_roadmap_item_id
      ? linkedItemSupportCounts[row.linked_roadmap_item_id] ?? 0
      : 0,
    voted: row.linked_roadmap_item_id ? votedSet.has(row.linked_roadmap_item_id) : false,
  }));

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

export async function addSupport(
  externalId: string,
  userId: number,
): Promise<ApiSuccessResponse<ToggleSupportResult>> {
  const wishId = parseWishExternalId(externalId);
  const roadmapItemId = await ensureWishSupportItem(wishId);
  const supportItem = await prisma.roadmap_items.findUnique({
    where: { id: roadmapItemId },
    select: { external_id: true },
  });
  if (!supportItem?.external_id) throw new NotFoundError('找不到可支援的支援項目');

  return roadmapService.addSupport(supportItem.external_id, userId);
}

export async function removeSupport(
  externalId: string,
  userId: number,
): Promise<ApiSuccessResponse<ToggleSupportResult>> {
  const wishId = parseWishExternalId(externalId);
  const roadmapItemId = await ensureWishSupportItem(wishId);
  const supportItem = await prisma.roadmap_items.findUnique({
    where: { id: roadmapItemId },
    select: { external_id: true },
  });
  if (!supportItem?.external_id) {
    return createSuccessResponse({ support_count: 0, voted: false });
  }

  return roadmapService.removeSupport(supportItem.external_id, userId);
}

// ─── 歸併共用：建立 wish_link support（去重）+ 更新 wish ──────────────────────────

async function linkWishWithinTx(
  tx: Prisma.TransactionClient,
  args: { wishId: number; itemId: number; wisherUserId: number; internalModuleTag?: string },
): Promise<void> {
  const { wishId, itemId, wisherUserId, internalModuleTag } = args;

  // 冪等 upsert：已投票者保留原 origin（不覆寫為 wish_link）、不重複計數
  await tx.roadmap_item_supports.upsert({
    where: { roadmap_item_id_user_id: { roadmap_item_id: itemId, user_id: wisherUserId } },
    create: { roadmap_item_id: itemId, user_id: wisherUserId, origin: 'wish_link' },
    update: {},
  });
  // 以實際筆數為權威值寫回，避免漂移
  const support_count = await tx.roadmap_item_supports.count({
    where: { roadmap_item_id: itemId },
  });
  await tx.roadmap_items.update({ where: { id: itemId }, data: { support_count } });

  await tx.wishes.update({
    where: { id: wishId },
    data: {
      status: 'linked',
      linked_roadmap_item_id: itemId,
      ...(internalModuleTag ? { internal_module_tag: internalModuleTag } : {}),
      updated_at: new Date(),
    },
  });
}

// ─── 歸併到既有項目 ──────────────────────────────────────────────────────────────

export async function linkToItem(
  wishId: number,
  input: LinkWishInput,
  actorUserId: number,
): Promise<ApiSuccessResponse<{ id: number; linked_roadmap_item_id: number }>> {
  const wish = await prisma.wishes.findUnique({ where: { id: wishId } });
  if (!wish) throw new NotFoundError('找不到指定的許願');

  if (wish.category === 'other' && !input.internal_module_tag) {
    throw new BadRequestError('category=other 的許願歸併時需填寫 internal_module_tag');
  }

  const item = await prisma.roadmap_items.findUnique({
    where: { id: input.roadmap_item_id },
    select: { id: true, title: true },
  });
  if (!item) throw new NotFoundError('找不到指定的路線圖項目');

  await prisma.$transaction((tx) =>
    linkWishWithinTx(tx, {
      wishId,
      itemId: item.id,
      wisherUserId: wish.submitter_user_id,
      internalModuleTag: input.internal_module_tag,
    }),
  );

  await notifyWishLinked({
    wisherUserId: wish.submitter_user_id,
    actorUserId,
    itemId: item.id,
    itemTitle: item.title,
    contactEmail: wish.contact_email,
  });

  return createSuccessResponse({ id: wishId, linked_roadmap_item_id: item.id });
}

// ─── 促成新項目 ──────────────────────────────────────────────────────────────────

export async function promoteToItem(
  wishId: number,
  input: PromoteWishInput,
  actorUserId: number,
): Promise<ApiSuccessResponse<{ id: number; linked_roadmap_item_id: number; external_id: string }>> {
  const wish = await prisma.wishes.findUnique({ where: { id: wishId } });
  if (!wish) throw new NotFoundError('找不到指定的許願');

  if (wish.category === 'other' && !input.internal_module_tag) {
    throw new BadRequestError('category=other 的許願促成時需填寫 internal_module_tag');
  }

  const item = await prisma.$transaction(async (tx) => {
    const created = await tx.roadmap_items.create({
      data: {
        title: input.title,
        description: input.description,
        category: input.category,
        status: input.status ?? 'collected',
      },
      select: { id: true, external_id: true, title: true },
    });
    await linkWishWithinTx(tx, {
      wishId,
      itemId: created.id,
      wisherUserId: wish.submitter_user_id,
      internalModuleTag: input.internal_module_tag,
    });
    return created;
  });

  await notifyWishLinked({
    wisherUserId: wish.submitter_user_id,
    actorUserId,
    itemId: item.id,
    itemTitle: item.title,
    contactEmail: wish.contact_email,
  });

  return createSuccessResponse({
    id: wishId,
    linked_roadmap_item_id: item.id,
    external_id: item.external_id,
  });
}

// ─── 封存 ────────────────────────────────────────────────────────────────────────

export async function archiveWish(wishId: number): Promise<ApiSuccessResponse<{ id: number }>> {
  const wish = await prisma.wishes.findUnique({ where: { id: wishId }, select: { id: true } });
  if (!wish) throw new NotFoundError('找不到指定的許願');

  await prisma.wishes.update({
    where: { id: wishId },
    data: { status: 'archived', updated_at: new Date() },
  });

  return createSuccessResponse({ id: wishId });
}

export const wishService = {
  createWish,
  listWishes,
  listPublicWishes,
  addSupport,
  removeSupport,
  linkToItem,
  promoteToItem,
  archiveWish,
};
