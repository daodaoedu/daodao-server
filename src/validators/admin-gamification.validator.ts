/**
 * Admin 遊戲化驗證器
 * 使用 Zod 定義查詢參數驗證 schema
 */

import { z } from 'zod';

// ============================================================================
// Input Schemas
// ============================================================================

/**
 * 建立徽章 schema
 */
export const createBadgeSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  iconUrl: z.string().url(),
  triggerCondition: z.string().min(1).max(500),
});

/**
 * 建立挑戰 schema
 */
export const createChallengeSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(1000),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  requiredAction: z.string().min(1).max(500),
  reward: z.string().min(1).max(200),
});

/**
 * 頒發/撤銷徽章 schema
 */
export const awardBadgeSchema = z.object({
  userId: z.coerce.number().int().positive(),
});

/**
 * 更新排行榜設定 schema
 */
export const updateLeaderboardConfigSchema = z.object({
  activityWeights: z.object({
    post: z.number().min(0),
    comment: z.number().min(0),
    likeReceived: z.number().min(0),
    courseCompleted: z.number().min(0),
  }),
  period: z.enum(['weekly', 'monthly', 'alltime']),
});

// ============================================================================
// Param Schemas
// ============================================================================

/**
 * 徽章 ID 參數 schema
 */
export const badgeIdParamSchema = z.object({
  badgeId: z.coerce.number().int().positive(),
});

/**
 * 挑戰 ID 參數 schema
 */
export const challengeIdParamSchema = z.object({
  challengeId: z.coerce.number().int().positive(),
});

// ============================================================================
// Query Schemas
// ============================================================================

/**
 * 挑戰狀態篩選 schema
 */
export const challengeStatusQuerySchema = z.object({
  status: z.enum(['active', 'upcoming', 'completed']).optional(),
});

/**
 * 排行榜週期查詢 schema
 */
export const leaderboardPeriodQuerySchema = z.object({
  period: z.enum(['weekly', 'monthly', 'alltime']),
});
