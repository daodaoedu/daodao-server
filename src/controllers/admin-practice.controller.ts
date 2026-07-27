/**
 * Admin 實踐管理控制器
 * 處理 Admin 實踐列表與狀態管理的 HTTP 請求
 *
 * 注意：本檔不 import practice.validators（避免改變 OpenAPI schema 註冊順序）；
 * 對應的 OpenAPI 路由定義集中在 practice.routes.ts。
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler, BadRequestError } from '../middleware/error.middleware';
import * as practiceService from '../services/practice.service';
import { externalToInternalId } from '../services/id-converter.service';
import type { PracticeStatus, SortField, SortOrder } from '../types/practice.types';

const uuidParamSchema = z.string().uuid('Practice ID 格式不正確，應為 UUID 格式');

const PRACTICE_STATUSES = ['draft', 'not_started', 'active', 'completed', 'archived'] as const;
const PRIVACY_STATUSES = ['private', 'public', 'delayed'] as const;
const SORT_FIELDS = ['createdAt', 'updatedAt', 'likeCount'] as const;

async function resolvePracticeId(externalId: string): Promise<number> {
  const validationResult = uuidParamSchema.safeParse(externalId);
  if (!validationResult.success) {
    throw new BadRequestError(validationResult.error.issues[0]?.message || 'Practice ID 格式不正確');
  }
  return externalToInternalId('practice', externalId);
}

function pickEnum<T extends string>(value: unknown, allowed: readonly T[]): T | undefined {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : undefined;
}

/**
 * 取得 Admin 實踐列表（含 private 與未完成的 delayed）
 * GET /admin/practices
 */
export const listPractices = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.max(1, Math.min(Number(req.query.limit) || 20, 100));

  const result = await practiceService.findAll({
    page,
    limit,
    search: typeof req.query.query === 'string' && req.query.query ? req.query.query : undefined,
    status: pickEnum(req.query.status, [...PRACTICE_STATUSES, 'all'] as const) ?? 'all',
    privacyStatus: pickEnum(req.query.privacyStatus, PRIVACY_STATUSES),
    sortBy: pickEnum<SortField>(req.query.sort, SORT_FIELDS) ?? 'createdAt',
    sortOrder: pickEnum<SortOrder>(req.query.order, ['asc', 'desc'] as const) ?? 'desc',
    includeArchived: true
  });

  res.json(result);
});

/**
 * 更新實踐狀態
 * PATCH /admin/practices/:id/status
 */
export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  const practiceId = await resolvePracticeId(req.params.id);

  const status = pickEnum<PracticeStatus>((req.body as { status?: unknown })?.status, PRACTICE_STATUSES);
  if (!status) {
    throw new BadRequestError(`狀態不正確，必須為：${PRACTICE_STATUSES.join(', ')}`);
  }

  const result = await practiceService.adminUpdateStatus(practiceId, status);

  res.json(result);
});

export default {
  listPractices,
  updateStatus
};
