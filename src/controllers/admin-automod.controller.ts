/**
 * Admin 自動審核控制器
 * 處理自動審核規則、詞彙清單、標記佇列相關的 HTTP 請求
 */

import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { createSuccessResponse } from '../utils/response-helper';
import adminAutomodService from '../services/admin-automod.service';
import {
  createAutoModRuleSchema,
  updateAutoModRuleSchema,
  flagQueueActionSchema,
  addBlockedUsernameSchema,
  updateCommunityModConfigSchema,
  ruleIdParamSchema,
  wordListIdParamSchema,
  flagIdParamSchema,
  blockedUsernameParamSchema,
  paginationQuerySchema,
} from '../validators/admin-automod.validator';

/**
 * 列出所有自動審核規則
 * GET /admin/automod/rules
 */
const listRules = asyncHandler(async (_req: Request, res: Response) => {
  const rules = await adminAutomodService.listRules();
  res.json(createSuccessResponse(rules));
});

/**
 * 建立自動審核規則
 * POST /admin/automod/rules
 */
const createRule = asyncHandler(async (req: Request, res: Response) => {
  const input = createAutoModRuleSchema.parse(req.body);
  const rule = await adminAutomodService.createRule(input);
  res.status(201).json(createSuccessResponse(rule));
});

/**
 * 更新自動審核規則
 * PUT /admin/automod/rules/:id
 */
const updateRule = asyncHandler(async (req: Request, res: Response) => {
  const { id } = ruleIdParamSchema.parse(req.params);
  const input = updateAutoModRuleSchema.parse(req.body);
  const rule = await adminAutomodService.updateRule(id, input);
  res.json(createSuccessResponse(rule));
});

/**
 * 刪除自動審核規則
 * DELETE /admin/automod/rules/:id
 */
const deleteRule = asyncHandler(async (req: Request, res: Response) => {
  const { id } = ruleIdParamSchema.parse(req.params);
  await adminAutomodService.deleteRule(id);
  res.json(createSuccessResponse({ deleted: true, id }));
});

/**
 * 列出所有詞彙清單
 * GET /admin/automod/word-lists
 */
const listWordLists = asyncHandler(async (_req: Request, res: Response) => {
  const lists = await adminAutomodService.listWordLists();
  res.json(createSuccessResponse(lists));
});

/**
 * 切換詞彙清單啟用狀態
 * PUT /admin/automod/word-lists/:id/toggle
 */
const toggleWordList = asyncHandler(async (req: Request, res: Response) => {
  const { id } = wordListIdParamSchema.parse(req.params);
  const list = await adminAutomodService.toggleWordList(id);
  res.json(createSuccessResponse(list));
});

/**
 * 取得自動審核動作紀錄
 * GET /admin/automod/action-log
 */
const getActionLog = asyncHandler(async (req: Request, res: Response) => {
  const { limit, offset } = paginationQuerySchema.parse(req.query);
  const logs = await adminAutomodService.getActionLog(limit, offset);
  res.json(createSuccessResponse(logs));
});

/**
 * 取得垃圾訊息偵測狀態
 * GET /admin/automod/spam-detection
 */
const getSpamDetectionStatus = asyncHandler(async (_req: Request, res: Response) => {
  const status = await adminAutomodService.getSpamDetectionStatus();
  res.json(createSuccessResponse(status));
});

/**
 * 切換垃圾訊息偵測
 * POST /admin/automod/spam-detection/toggle
 */
const toggleSpamDetection = asyncHandler(async (_req: Request, res: Response) => {
  const result = await adminAutomodService.toggleSpamDetection();
  res.json(createSuccessResponse(result));
});

/**
 * 列出封鎖使用者名稱清單
 * GET /admin/automod/username-blocklist
 */
const listUsernameBlocklist = asyncHandler(async (_req: Request, res: Response) => {
  const blocklist = await adminAutomodService.listUsernameBlocklist();
  res.json(createSuccessResponse(blocklist));
});

/**
 * 新增封鎖使用者名稱
 * POST /admin/automod/username-blocklist
 */
const addBlockedUsername = asyncHandler(async (req: Request, res: Response) => {
  const { username } = addBlockedUsernameSchema.parse(req.body);
  const result = await adminAutomodService.addBlockedUsername(username);
  res.status(201).json(createSuccessResponse(result));
});

/**
 * 移除封鎖使用者名稱
 * DELETE /admin/automod/username-blocklist/:username
 */
const removeBlockedUsername = asyncHandler(async (req: Request, res: Response) => {
  const { username } = blockedUsernameParamSchema.parse(req.params);
  const result = await adminAutomodService.removeBlockedUsername(username);
  res.json(createSuccessResponse(result));
});

/**
 * 取得標記佇列
 * GET /admin/automod/flag-queue
 */
const getFlagQueue = asyncHandler(async (req: Request, res: Response) => {
  const { limit, offset } = paginationQuerySchema.parse(req.query);
  const flags = await adminAutomodService.getFlagQueue(limit, offset);
  res.json(createSuccessResponse(flags));
});

/**
 * 處理標記佇列動作
 * POST /admin/automod/flag-queue/:id/action
 */
const processFlagAction = asyncHandler(async (req: Request, res: Response) => {
  const { id } = flagIdParamSchema.parse(req.params);
  const input = flagQueueActionSchema.parse(req.body);
  const result = await adminAutomodService.processFlagAction(id, input);
  res.json(createSuccessResponse(result));
});

/**
 * 取得社群審核設定
 * GET /admin/automod/community-config
 */
const getCommunityModConfig = asyncHandler(async (_req: Request, res: Response) => {
  const config = await adminAutomodService.getCommunityModConfig();
  res.json(createSuccessResponse(config));
});

/**
 * 更新社群審核設定
 * PUT /admin/automod/community-config
 */
const updateCommunityModConfig = asyncHandler(async (req: Request, res: Response) => {
  const input = updateCommunityModConfigSchema.parse(req.body);
  const config = await adminAutomodService.updateCommunityModConfig(input);
  res.json(createSuccessResponse(config));
});

export default {
  listRules,
  createRule,
  updateRule,
  deleteRule,
  listWordLists,
  toggleWordList,
  getActionLog,
  getSpamDetectionStatus,
  toggleSpamDetection,
  listUsernameBlocklist,
  addBlockedUsername,
  removeBlockedUsername,
  getFlagQueue,
  processFlagAction,
  getCommunityModConfig,
  updateCommunityModConfig,
};
