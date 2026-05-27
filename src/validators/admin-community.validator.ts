/**
 * Admin 社群驗證器
 * 使用 Zod 定義查詢參數驗證 schema
 */

import { z } from 'zod';

// ============================================================================
// Onboarding Schemas
// ============================================================================

/**
 * Onboarding 步驟 schema
 */
const onboardingStepSchema = z.object({
  questionText: z.string().min(1).max(500),
  questionType: z.enum(['single', 'multi', 'text']),
  options: z.array(z.string().min(1)).optional(),
});

/**
 * 建立 Onboarding 流程 schema
 */
export const createFlowSchema = z.object({
  name: z.string().min(1).max(100),
  isEnabled: z.boolean().optional().default(true),
  steps: z.array(onboardingStepSchema).min(1),
});

/**
 * 更新 Onboarding 流程 schema
 */
export const updateFlowSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  isEnabled: z.boolean().optional(),
  steps: z.array(onboardingStepSchema).min(1).optional(),
});

// ============================================================================
// Member Profile Field Schemas
// ============================================================================

/**
 * 建立會員資料欄位 schema
 */
export const createFieldSchema = z.object({
  name: z.string().min(1).max(100),
  fieldType: z.enum(['text', 'dropdown', 'multi_select', 'url']),
  isRequired: z.boolean().optional().default(false),
  visibility: z.enum(['public', 'members', 'admin']).optional().default('members'),
});

/**
 * 更新會員資料欄位 schema
 */
export const updateFieldSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  fieldType: z.enum(['text', 'dropdown', 'multi_select', 'url']).optional(),
  isRequired: z.boolean().optional(),
  visibility: z.enum(['public', 'members', 'admin']).optional(),
});

/**
 * 重新排序欄位 schema
 */
export const reorderFieldsSchema = z.object({
  fieldIds: z.array(z.coerce.number().int().positive()).min(1),
});

// ============================================================================
// AI Assistant Schemas
// ============================================================================

/**
 * 上傳 AI 知識庫條目 schema
 */
export const uploadKnowledgeSchema = z.object({
  fileName: z.string().min(1).max(500),
  fileType: z.string().min(1).max(100),
  fileSize: z.number().int().positive(),
});

/**
 * 更新 AI 助手設定 schema
 */
export const updateAssistantConfigSchema = z.object({
  personality: z.string().min(1).max(1000),
  tone: z.string().min(1).max(200),
  fallbackMessage: z.string().min(1).max(500),
});

// ============================================================================
// Param Schemas
// ============================================================================

/**
 * 流程 ID 參數 schema
 */
export const flowIdParamSchema = z.object({
  flowId: z.coerce.number().int().positive(),
});

/**
 * 欄位 ID 參數 schema
 */
export const fieldIdParamSchema = z.object({
  fieldId: z.coerce.number().int().positive(),
});

/**
 * 知識庫條目 ID 參數 schema
 */
export const knowledgeIdParamSchema = z.object({
  knowledgeId: z.coerce.number().int().positive(),
});

/**
 * 對話 ID 參數 schema
 */
export const conversationIdParamSchema = z.object({
  conversationId: z.coerce.number().int().positive(),
});

// ============================================================================
// Query Schemas
// ============================================================================

/**
 * 對話狀態篩選 schema
 */
export const conversationStatusQuerySchema = z.object({
  status: z.enum(['resolved', 'escalated', 'needs_human']).optional(),
});
