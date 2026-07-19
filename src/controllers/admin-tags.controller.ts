/**
 * Admin 用戶標籤控制器
 * 處理用戶標籤相關的 HTTP 請求
 */

import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { createSuccessResponse } from '../utils/response-helper';
import adminTagsService from '../services/admin-tags.service';
import {
  createTagSchema,
  updateTagSchema,
  tagIdParamSchema,
  createTagRuleSchema,
  updateTagRuleSchema,
  ruleIdParamSchema,
  bulkTagSchema,
} from '../validators/admin-tags.validator';

/**
 * 列出所有標籤
 * GET /admin/tags
 */
const listTags = asyncHandler(async (_req: Request, res: Response) => {
  const tags = await adminTagsService.listTags();
  res.json(createSuccessResponse(tags));
});

/**
 * 建立標籤
 * POST /admin/tags
 */
const createTag = asyncHandler(async (req: Request, res: Response) => {
  const input = createTagSchema.parse(req.body);
  const tag = await adminTagsService.createTag(input);
  res.status(201).json(createSuccessResponse(tag));
});

/**
 * 更新標籤
 * PUT /admin/tags/:id
 */
const updateTag = asyncHandler(async (req: Request, res: Response) => {
  const { id } = tagIdParamSchema.parse(req.params);
  const input = updateTagSchema.parse(req.body);
  const tag = await adminTagsService.updateTag(id, input);
  res.json(createSuccessResponse(tag));
});

/**
 * 刪除標籤
 * DELETE /admin/tags/:id
 */
const deleteTag = asyncHandler(async (req: Request, res: Response) => {
  const { id } = tagIdParamSchema.parse(req.params);
  await adminTagsService.deleteTag(id);
  res.json(createSuccessResponse({ deleted: true, id }));
});

/**
 * 列出所有標籤規則
 * GET /admin/tag-rules
 */
const listTagRules = asyncHandler(async (_req: Request, res: Response) => {
  const rules = await adminTagsService.listTagRules();
  res.json(createSuccessResponse(rules));
});

/**
 * 建立標籤規則
 * POST /admin/tag-rules
 */
const createTagRule = asyncHandler(async (req: Request, res: Response) => {
  const input = createTagRuleSchema.parse(req.body);
  const rule = await adminTagsService.createTagRule(input);
  res.status(201).json(createSuccessResponse(rule));
});

/**
 * 更新標籤規則
 * PATCH /admin/tag-rules/:id
 */
const updateTagRule = asyncHandler(async (req: Request, res: Response) => {
  const { id } = ruleIdParamSchema.parse(req.params);
  const input = updateTagRuleSchema.parse(req.body);
  const rule = await adminTagsService.updateTagRule(id, input);
  res.json(createSuccessResponse(rule));
});

/**
 * 刪除標籤規則
 * DELETE /admin/tag-rules/:id
 */
const deleteTagRule = asyncHandler(async (req: Request, res: Response) => {
  const { id } = ruleIdParamSchema.parse(req.params);
  await adminTagsService.deleteTagRule(id);
  res.json(createSuccessResponse({ deleted: true, id }));
});

/**
 * 批量指派或移除用戶標籤
 * POST /admin/users/bulk-tag
 */
const bulkAssignTag = asyncHandler(async (req: Request, res: Response) => {
  const input = bulkTagSchema.parse(req.body);
  const result = await adminTagsService.bulkAssignTag(input);
  res.json(createSuccessResponse(result));
});

export default {
  listTags,
  createTag,
  updateTag,
  deleteTag,
  listTagRules,
  createTagRule,
  updateTagRule,
  deleteTagRule,
  bulkAssignTag,
};
