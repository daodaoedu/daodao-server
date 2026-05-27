/**
 * Admin 社群控制器
 * 處理 Onboarding、會員目錄、AI 助手相關的 HTTP 請求
 */

import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { createSuccessResponse } from '../utils/response-helper';
import adminCommunityService from '../services/admin-community.service';
import {
  createFlowSchema,
  updateFlowSchema,
  flowIdParamSchema,
  createFieldSchema,
  updateFieldSchema,
  fieldIdParamSchema,
  reorderFieldsSchema,
  uploadKnowledgeSchema,
  knowledgeIdParamSchema,
  conversationIdParamSchema,
  conversationStatusQuerySchema,
  updateAssistantConfigSchema,
} from '../validators/admin-community.validator';

// ============================================================================
// Onboarding
// ============================================================================

/**
 * 列出所有 Onboarding 流程
 * GET /admin/community/onboarding/flows
 */
const listFlows = asyncHandler(async (_req: Request, res: Response) => {
  const flows = await adminCommunityService.listFlows();
  res.json(createSuccessResponse(flows));
});

/**
 * 建立 Onboarding 流程
 * POST /admin/community/onboarding/flows
 */
const createFlow = asyncHandler(async (req: Request, res: Response) => {
  const input = createFlowSchema.parse(req.body);
  const flow = await adminCommunityService.createFlow(input);
  res.status(201).json(createSuccessResponse(flow));
});

/**
 * 更新 Onboarding 流程
 * PUT /admin/community/onboarding/flows/:flowId
 */
const updateFlow = asyncHandler(async (req: Request, res: Response) => {
  const { flowId } = flowIdParamSchema.parse(req.params);
  const input = updateFlowSchema.parse(req.body);
  const flow = await adminCommunityService.updateFlow(flowId, input);
  res.json(createSuccessResponse(flow));
});

/**
 * 刪除 Onboarding 流程
 * DELETE /admin/community/onboarding/flows/:flowId
 */
const deleteFlow = asyncHandler(async (req: Request, res: Response) => {
  const { flowId } = flowIdParamSchema.parse(req.params);
  await adminCommunityService.deleteFlow(flowId);
  res.json(createSuccessResponse({ deleted: true, flowId }));
});

/**
 * 取得 Onboarding 流程分析數據
 * GET /admin/community/onboarding/flows/:flowId/analytics
 */
const getFlowAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const { flowId } = flowIdParamSchema.parse(req.params);
  const analytics = await adminCommunityService.getFlowAnalytics(flowId);
  res.json(createSuccessResponse(analytics));
});

// ============================================================================
// Member Directory
// ============================================================================

/**
 * 列出所有會員資料欄位
 * GET /admin/community/member/fields
 */
const listProfileFields = asyncHandler(async (_req: Request, res: Response) => {
  const fields = await adminCommunityService.listProfileFields();
  res.json(createSuccessResponse(fields));
});

/**
 * 建立會員資料欄位
 * POST /admin/community/member/fields
 */
const createField = asyncHandler(async (req: Request, res: Response) => {
  const input = createFieldSchema.parse(req.body);
  const field = await adminCommunityService.createField(input);
  res.status(201).json(createSuccessResponse(field));
});

/**
 * 更新會員資料欄位
 * PUT /admin/community/member/fields/:fieldId
 */
const updateField = asyncHandler(async (req: Request, res: Response) => {
  const { fieldId } = fieldIdParamSchema.parse(req.params);
  const input = updateFieldSchema.parse(req.body);
  const field = await adminCommunityService.updateField(fieldId, input);
  res.json(createSuccessResponse(field));
});

/**
 * 刪除會員資料欄位
 * DELETE /admin/community/member/fields/:fieldId
 */
const deleteField = asyncHandler(async (req: Request, res: Response) => {
  const { fieldId } = fieldIdParamSchema.parse(req.params);
  await adminCommunityService.deleteField(fieldId);
  res.json(createSuccessResponse({ deleted: true, fieldId }));
});

/**
 * 重新排序會員資料欄位
 * PUT /admin/community/member/fields/reorder
 */
const reorderFields = asyncHandler(async (req: Request, res: Response) => {
  const input = reorderFieldsSchema.parse(req.body);
  const result = await adminCommunityService.reorderFields(input.fieldIds);
  res.json(createSuccessResponse(result));
});

/**
 * 取得會員目錄統計
 * GET /admin/community/member/stats
 */
const getDirectoryStats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await adminCommunityService.getDirectoryStats();
  res.json(createSuccessResponse(stats));
});

/**
 * 取得會員目錄分析數據
 * GET /admin/community/member/analytics
 */
const getDirectoryAnalytics = asyncHandler(async (_req: Request, res: Response) => {
  const analytics = await adminCommunityService.getDirectoryAnalytics();
  res.json(createSuccessResponse(analytics));
});

// ============================================================================
// AI Assistant
// ============================================================================

/**
 * 列出 AI 知識庫條目
 * GET /admin/community/ai/knowledge
 */
const listKnowledge = asyncHandler(async (_req: Request, res: Response) => {
  const entries = await adminCommunityService.listKnowledge();
  res.json(createSuccessResponse(entries));
});

/**
 * 上傳 AI 知識庫條目
 * POST /admin/community/ai/knowledge
 */
const uploadKnowledge = asyncHandler(async (req: Request, res: Response) => {
  const input = uploadKnowledgeSchema.parse(req.body);
  const entry = await adminCommunityService.uploadKnowledge(input);
  res.status(201).json(createSuccessResponse(entry));
});

/**
 * 刪除 AI 知識庫條目
 * DELETE /admin/community/ai/knowledge/:knowledgeId
 */
const deleteKnowledge = asyncHandler(async (req: Request, res: Response) => {
  const { knowledgeId } = knowledgeIdParamSchema.parse(req.params);
  await adminCommunityService.deleteKnowledge(knowledgeId);
  res.json(createSuccessResponse({ deleted: true, knowledgeId }));
});

/**
 * 取得 AI 對話列表
 * GET /admin/community/ai/conversations
 */
const getConversations = asyncHandler(async (req: Request, res: Response) => {
  const { status } = conversationStatusQuerySchema.parse(req.query);
  const conversations = await adminCommunityService.getConversations(status);
  res.json(createSuccessResponse(conversations));
});

/**
 * 取得單一 AI 對話詳情
 * GET /admin/community/ai/conversations/:conversationId
 */
const getConversation = asyncHandler(async (req: Request, res: Response) => {
  const { conversationId } = conversationIdParamSchema.parse(req.params);
  const conversation = await adminCommunityService.getConversation(conversationId);
  res.json(createSuccessResponse(conversation));
});

/**
 * 接管 AI 對話
 * POST /admin/community/ai/conversations/:conversationId/takeover
 */
const takeoverConversation = asyncHandler(async (req: Request, res: Response) => {
  const { conversationId } = conversationIdParamSchema.parse(req.params);
  const result = await adminCommunityService.takeoverConversation(conversationId);
  res.json(createSuccessResponse(result));
});

/**
 * 取得 AI 助手統計
 * GET /admin/community/ai/stats
 */
const getAssistantStats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await adminCommunityService.getAssistantStats();
  res.json(createSuccessResponse(stats));
});

/**
 * 取得 AI 助手設定
 * GET /admin/community/ai/config
 */
const getAssistantConfig = asyncHandler(async (_req: Request, res: Response) => {
  const config = await adminCommunityService.getAssistantConfig();
  res.json(createSuccessResponse(config));
});

/**
 * 更新 AI 助手設定
 * PUT /admin/community/ai/config
 */
const updateAssistantConfig = asyncHandler(async (req: Request, res: Response) => {
  const input = updateAssistantConfigSchema.parse(req.body);
  const config = await adminCommunityService.updateAssistantConfig(input);
  res.json(createSuccessResponse(config));
});

export default {
  listFlows,
  createFlow,
  updateFlow,
  deleteFlow,
  getFlowAnalytics,
  listProfileFields,
  createField,
  updateField,
  deleteField,
  reorderFields,
  getDirectoryStats,
  getDirectoryAnalytics,
  listKnowledge,
  uploadKnowledge,
  deleteKnowledge,
  getConversations,
  getConversation,
  takeoverConversation,
  getAssistantStats,
  getAssistantConfig,
  updateAssistantConfig,
};
