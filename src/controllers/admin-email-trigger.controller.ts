/**
 * Admin 觸發式信件控制器
 * 處理觸發規則與信件模板相關的 HTTP 請求
 */

import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { createSuccessResponse } from '../utils/response-helper';
import adminEmailTriggerService from '../services/admin-email-trigger.service';
import {
  createTriggerRuleSchema,
  updateTriggerRuleSchema,
  createTemplateSchema,
  updateTemplateSchema,
  ruleIdParamSchema,
  templateIdParamSchema,
} from '../validators/admin-email-trigger.validator';

// ============================================================================
// Trigger Rules
// ============================================================================

/**
 * 列出所有觸發規則
 * GET /admin/email-triggers
 */
const listRules = asyncHandler(async (_req: Request, res: Response) => {
  const rules = await adminEmailTriggerService.listRules();
  res.json(createSuccessResponse(rules));
});

/**
 * 建立觸發規則
 * POST /admin/email-triggers
 */
const createRule = asyncHandler(async (req: Request, res: Response) => {
  const input = createTriggerRuleSchema.parse(req.body);
  const rule = await adminEmailTriggerService.createRule(input);
  res.status(201).json(createSuccessResponse(rule));
});

/**
 * 更新觸發規則
 * PUT /admin/email-triggers/:id
 */
const updateRule = asyncHandler(async (req: Request, res: Response) => {
  const { id } = ruleIdParamSchema.parse(req.params);
  const input = updateTriggerRuleSchema.parse(req.body);
  const rule = await adminEmailTriggerService.updateRule(id, input);
  res.json(createSuccessResponse(rule));
});

/**
 * 刪除觸發規則
 * DELETE /admin/email-triggers/:id
 */
const deleteRule = asyncHandler(async (req: Request, res: Response) => {
  const { id } = ruleIdParamSchema.parse(req.params);
  await adminEmailTriggerService.deleteRule(id);
  res.json(createSuccessResponse({ deleted: true, id }));
});

// ============================================================================
// Email Templates
// ============================================================================

/**
 * 列出所有信件模板
 * GET /admin/email-templates
 */
const listTemplates = asyncHandler(async (_req: Request, res: Response) => {
  const templates = await adminEmailTriggerService.listTemplates();
  res.json(createSuccessResponse(templates));
});

/**
 * 建立信件模板
 * POST /admin/email-templates
 */
const createTemplate = asyncHandler(async (req: Request, res: Response) => {
  const input = createTemplateSchema.parse(req.body);
  const template = await adminEmailTriggerService.createTemplate(input);
  res.status(201).json(createSuccessResponse(template));
});

/**
 * 更新信件模板
 * PUT /admin/email-templates/:id
 */
const updateTemplate = asyncHandler(async (req: Request, res: Response) => {
  const { id } = templateIdParamSchema.parse(req.params);
  const input = updateTemplateSchema.parse(req.body);
  const template = await adminEmailTriggerService.updateTemplate(id, input);
  res.json(createSuccessResponse(template));
});

/**
 * 刪除信件模板
 * DELETE /admin/email-templates/:id
 */
const deleteTemplate = asyncHandler(async (req: Request, res: Response) => {
  const { id } = templateIdParamSchema.parse(req.params);
  await adminEmailTriggerService.deleteTemplate(id);
  res.json(createSuccessResponse({ deleted: true, id }));
});

// ============================================================================
// Execution Logs & Stats
// ============================================================================

/**
 * 取得觸發規則的執行紀錄
 * GET /admin/email-triggers/:id/logs
 */
const getExecutionLog = asyncHandler(async (req: Request, res: Response) => {
  const { id } = ruleIdParamSchema.parse(req.params);
  const logs = await adminEmailTriggerService.getExecutionLog(id);
  res.json(createSuccessResponse(logs));
});

/**
 * 取得觸發規則的統計資料
 * GET /admin/email-triggers/:id/stats
 */
const getRuleStats = asyncHandler(async (req: Request, res: Response) => {
  const { id } = ruleIdParamSchema.parse(req.params);
  const stats = await adminEmailTriggerService.getRuleStats(id);
  res.json(createSuccessResponse(stats));
});

export default {
  listRules,
  createRule,
  updateRule,
  deleteRule,
  listTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getExecutionLog,
  getRuleStats,
};
