/**
 * Admin 學習管理驗證器
 * 使用 Zod 定義查詢參數驗證 schema
 */

import { z } from 'zod';

// ============================================================================
// Param Schemas
// ============================================================================

/**
 * 課程 ID 參數 schema
 */
export const courseIdParamSchema = z.object({
  courseId: z.coerce.number().int().positive(),
});

/**
 * 排程 ID 參數 schema
 */
export const scheduleIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

/**
 * 測驗 ID 參數 schema
 */
export const quizIdParamSchema = z.object({
  quizId: z.coerce.number().int().positive(),
});

/**
 * 題目 ID 參數 schema
 */
export const questionIdParamSchema = z.object({
  questionId: z.coerce.number().int().positive(),
});

/**
 * 範本 ID 參數 schema
 */
export const templateIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

/**
 * 證書 ID 參數 schema
 */
export const certificateIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

/**
 * 學習路徑 ID 參數 schema
 */
export const pathIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// ============================================================================
// Query Schemas
// ============================================================================

/**
 * 停滯用戶查詢 schema
 */
export const stalledUsersQuerySchema = z.object({
  stalledDays: z.coerce.number().int().positive().optional().default(7),
});

// ============================================================================
// Drip Schedule Schemas
// ============================================================================

/**
 * 建立滴灌排程 schema
 */
export const createDripScheduleSchema = z.object({
  courseId: z.coerce.number().int().positive(),
  moduleName: z.string().min(1).max(200),
  unlockType: z.enum(['days_after_enrollment', 'specific_date']),
  unlockValue: z.string().min(1).max(100),
});

/**
 * 手動解鎖 schema
 */
export const manualUnlockSchema = z.object({
  scheduleId: z.coerce.number().int().positive(),
  userId: z.coerce.number().int().positive(),
});

// ============================================================================
// Quiz Schemas
// ============================================================================

/**
 * 建立測驗 schema
 */
export const createQuizSchema = z.object({
  name: z.string().min(1).max(200),
  courseId: z.coerce.number().int().positive(),
  passThreshold: z.coerce.number().int().min(0).max(100),
});

/**
 * 建立測驗題目 schema
 */
export const createQuizQuestionSchema = z.object({
  quizId: z.coerce.number().int().positive(),
  questionText: z.string().min(1).max(2000),
  questionType: z.enum(['multiple_choice', 'true_false', 'short_answer']),
  options: z.array(z.string().min(1)).optional(),
  correctAnswer: z.string().min(1).max(500),
});

// ============================================================================
// Certificate Schemas
// ============================================================================

/**
 * 建立證書範本 schema
 */
export const createCertificateTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  criteria: z.string().min(1).max(1000),
});

/**
 * 發行證書 schema
 */
export const issueCertificateSchema = z.object({
  userId: z.coerce.number().int().positive(),
  templateId: z.coerce.number().int().positive(),
});

/**
 * 批量發行證書 schema
 */
export const bulkIssueCertificateSchema = z.object({
  userIds: z.array(z.coerce.number().int().positive()).min(1),
  templateId: z.coerce.number().int().positive(),
});

// ============================================================================
// Learning Path Schemas
// ============================================================================

/**
 * 建立學習路徑 schema
 */
export const createLearningPathSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  courseIds: z.array(z.coerce.number().int().positive()).min(1),
});

/**
 * 更新學習路徑 schema
 */
export const updateLearningPathSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(2000).optional(),
  courseIds: z.array(z.coerce.number().int().positive()).min(1).optional(),
});
