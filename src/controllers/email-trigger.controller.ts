import { Request, Response } from 'express';
import { asyncHandler, BadRequestError } from '../middleware/error.middleware';
import { createSuccessResponse } from '../utils/response-helper';
import { emailTriggerService } from '../services/email-trigger.service';
import {
  createEmailTriggerRuleSchema,
  updateEmailTriggerRuleSchema,
  toggleEmailTriggerRuleSchema,
  emailTriggerRuleIdParamSchema,
  emailTriggerRuleQuerySchema,
  emailTriggerLogQuerySchema,
} from '../validators/email-trigger.validator';

const listRules = asyncHandler(async (req: Request, res: Response) => {
  const query = emailTriggerRuleQuerySchema.parse(req.query);
  const result = await emailTriggerService.listRules(query);
  res.json(createSuccessResponse(result));
});

const getRuleById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = emailTriggerRuleIdParamSchema.parse(req.params);
  const rule = await emailTriggerService.getRuleById(id);
  if (!rule) {
    throw new BadRequestError('規則不存在');
  }
  res.json(createSuccessResponse(rule));
});

const createRule = asyncHandler(async (req: Request, res: Response) => {
  const data = createEmailTriggerRuleSchema.parse(req.body);
  const userId = (req as unknown as { user?: { id?: number } }).user?.id;
  const rule = await emailTriggerService.createRule({ ...data, created_by: userId });
  res.status(201).json(createSuccessResponse(rule, { message: '規則建立成功' }));
});

const updateRule = asyncHandler(async (req: Request, res: Response) => {
  const { id } = emailTriggerRuleIdParamSchema.parse(req.params);
  const data = updateEmailTriggerRuleSchema.parse(req.body);
  const rule = await emailTriggerService.updateRule(id, data);
  res.json(createSuccessResponse(rule, { message: '規則更新成功' }));
});

const deleteRule = asyncHandler(async (req: Request, res: Response) => {
  const { id } = emailTriggerRuleIdParamSchema.parse(req.params);
  await emailTriggerService.deleteRule(id);
  res.json(createSuccessResponse(null, { message: '規則已刪除' }));
});

const toggleRule = asyncHandler(async (req: Request, res: Response) => {
  const { id } = emailTriggerRuleIdParamSchema.parse(req.params);
  const { enabled } = toggleEmailTriggerRuleSchema.parse(req.body);
  const rule = await emailTriggerService.toggleRule(id, enabled);
  res.json(createSuccessResponse(rule, { message: enabled ? '規則已啟用' : '規則已停用' }));
});

const listLogs = asyncHandler(async (req: Request, res: Response) => {
  const query = emailTriggerLogQuerySchema.parse(req.query);
  const result = await emailTriggerService.listLogs(query);
  res.json(createSuccessResponse(result));
});

const getStats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await emailTriggerService.getStats();
  res.json(createSuccessResponse(stats));
});

export const emailTriggerController = {
  listRules,
  getRuleById,
  createRule,
  updateRule,
  deleteRule,
  toggleRule,
  listLogs,
  getStats,
};

export default emailTriggerController;
