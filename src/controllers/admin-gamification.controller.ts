/**
 * Admin 遊戲化控制器
 * 處理徽章、挑戰、排行榜、連續學習天數相關的 HTTP 請求
 */

import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { createSuccessResponse } from '../utils/response-helper';
import adminGamificationService from '../services/admin-gamification.service';
import {
  createBadgeSchema,
  createChallengeSchema,
  awardBadgeSchema,
  updateLeaderboardConfigSchema,
  badgeIdParamSchema,
  challengeIdParamSchema,
  challengeStatusQuerySchema,
  leaderboardPeriodQuerySchema,
} from '../validators/admin-gamification.validator';

// ============================================================================
// Badges
// ============================================================================

/**
 * 列出所有徽章
 * GET /admin/gamification/badges
 */
const listBadges = asyncHandler(async (_req: Request, res: Response) => {
  const badges = await adminGamificationService.listBadges();
  res.json(createSuccessResponse(badges));
});

/**
 * 建立徽章
 * POST /admin/gamification/badges
 */
const createBadge = asyncHandler(async (req: Request, res: Response) => {
  const input = createBadgeSchema.parse(req.body);
  const badge = await adminGamificationService.createBadge(input);
  res.status(201).json(createSuccessResponse(badge));
});

/**
 * 頒發徽章給用戶
 * POST /admin/gamification/badges/:badgeId/award
 */
const awardBadge = asyncHandler(async (req: Request, res: Response) => {
  const { badgeId } = badgeIdParamSchema.parse(req.params);
  const { userId } = awardBadgeSchema.parse(req.body);
  const result = await adminGamificationService.awardBadge(badgeId, userId);
  res.json(createSuccessResponse(result));
});

/**
 * 撤銷用戶徽章
 * POST /admin/gamification/badges/:badgeId/revoke
 */
const revokeBadge = asyncHandler(async (req: Request, res: Response) => {
  const { badgeId } = badgeIdParamSchema.parse(req.params);
  const { userId } = awardBadgeSchema.parse(req.body);
  const result = await adminGamificationService.revokeBadge(badgeId, userId);
  res.json(createSuccessResponse(result));
});

// ============================================================================
// Challenges
// ============================================================================

/**
 * 列出挑戰
 * GET /admin/gamification/challenges
 */
const listChallenges = asyncHandler(async (req: Request, res: Response) => {
  const { status } = challengeStatusQuerySchema.parse(req.query);
  const challenges = await adminGamificationService.listChallenges(status);
  res.json(createSuccessResponse(challenges));
});

/**
 * 建立挑戰
 * POST /admin/gamification/challenges
 */
const createChallenge = asyncHandler(async (req: Request, res: Response) => {
  const input = createChallengeSchema.parse(req.body);
  const challenge = await adminGamificationService.createChallenge(input);
  res.status(201).json(createSuccessResponse(challenge));
});

/**
 * 取得挑戰參與者列表
 * GET /admin/gamification/challenges/:challengeId/participants
 */
const getParticipants = asyncHandler(async (req: Request, res: Response) => {
  const { challengeId } = challengeIdParamSchema.parse(req.params);
  const participants = await adminGamificationService.getParticipants(challengeId);
  res.json(createSuccessResponse(participants));
});

// ============================================================================
// Streaks
// ============================================================================

/**
 * 取得連續學習天數分佈
 * GET /admin/gamification/streaks/distribution
 */
const getStreakDistribution = asyncHandler(async (_req: Request, res: Response) => {
  const distribution = await adminGamificationService.getStreakDistribution();
  res.json(createSuccessResponse(distribution));
});

// ============================================================================
// Leaderboard
// ============================================================================

/**
 * 取得排行榜設定
 * GET /admin/gamification/leaderboard/config
 */
const getLeaderboardConfig = asyncHandler(async (_req: Request, res: Response) => {
  const config = await adminGamificationService.getLeaderboardConfig();
  res.json(createSuccessResponse(config));
});

/**
 * 更新排行榜設定
 * PUT /admin/gamification/leaderboard/config
 */
const updateLeaderboardConfig = asyncHandler(async (req: Request, res: Response) => {
  const input = updateLeaderboardConfigSchema.parse(req.body);
  const config = await adminGamificationService.updateLeaderboardConfig(input);
  res.json(createSuccessResponse(config));
});

/**
 * 取得排行榜
 * GET /admin/gamification/leaderboard
 */
const getLeaderboard = asyncHandler(async (req: Request, res: Response) => {
  const { period } = leaderboardPeriodQuerySchema.parse(req.query);
  const leaderboard = await adminGamificationService.getLeaderboard(period);
  res.json(createSuccessResponse(leaderboard));
});

/**
 * 重置排行榜
 * POST /admin/gamification/leaderboard/reset
 */
const resetLeaderboard = asyncHandler(async (req: Request, res: Response) => {
  const { period } = leaderboardPeriodQuerySchema.parse(req.body);
  const result = await adminGamificationService.resetLeaderboard(period);
  res.json(createSuccessResponse(result));
});

export default {
  listBadges,
  createBadge,
  awardBadge,
  revokeBadge,
  listChallenges,
  createChallenge,
  getParticipants,
  getStreakDistribution,
  getLeaderboardConfig,
  updateLeaderboardConfig,
  getLeaderboard,
  resetLeaderboard,
};
