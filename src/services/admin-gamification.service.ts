/**
 * Admin 遊戲化服務
 * 提供徽章、挑戰、排行榜、連續學習天數管理功能
 */

import type {
  Badge,
  Challenge,
  LeaderboardConfig,
  LeaderboardEntry,
  StreakDistribution,
  CreateBadgeInput,
  CreateChallengeInput,
} from '../types/admin-gamification.types';

/**
 * 列出所有徽章
 */
const listBadges = async (): Promise<Badge[]> => {
  // TODO: 從資料庫查詢徽章列表
  return [];
};

/**
 * 建立徽章
 * @param input - 建立徽章輸入
 */
const createBadge = async (input: CreateBadgeInput): Promise<Badge> => {
  // TODO: 寫入資料庫
  return {
    id: 0,
    name: input.name,
    description: input.description,
    iconUrl: input.iconUrl,
    triggerCondition: input.triggerCondition,
    awardedCount: 0,
    createdAt: new Date().toISOString(),
  };
};

/**
 * 頒發徽章給用戶
 * @param badgeId - 徽章 ID
 * @param userId - 用戶 ID
 */
const awardBadge = async (badgeId: number, userId: number): Promise<{ badgeId: number; userId: number; awarded: boolean }> => {
  // TODO: 建立用戶徽章關聯
  return { badgeId, userId, awarded: true };
};

/**
 * 撤銷用戶徽章
 * @param badgeId - 徽章 ID
 * @param userId - 用戶 ID
 */
const revokeBadge = async (badgeId: number, userId: number): Promise<{ badgeId: number; userId: number; revoked: boolean }> => {
  // TODO: 移除用戶徽章關聯
  return { badgeId, userId, revoked: true };
};

/**
 * 列出挑戰
 * @param status - 篩選狀態（可選）
 */
const listChallenges = async (status?: 'active' | 'upcoming' | 'completed'): Promise<Challenge[]> => {
  // TODO: 從資料庫查詢挑戰列表，可依狀態篩選
  void status;
  return [];
};

/**
 * 建立挑戰
 * @param input - 建立挑戰輸入
 */
const createChallenge = async (input: CreateChallengeInput): Promise<Challenge> => {
  // TODO: 寫入資料庫
  return {
    id: 0,
    name: input.name,
    description: input.description,
    startDate: input.startDate,
    endDate: input.endDate,
    requiredAction: input.requiredAction,
    reward: input.reward,
    participantCount: 0,
    completionRate: 0,
    status: 'upcoming',
  };
};

/**
 * 取得挑戰參與者列表
 * @param challengeId - 挑戰 ID
 */
const getParticipants = async (challengeId: number): Promise<Array<{ userId: number; userName: string; progress: number; completedAt: string | null }>> => {
  // TODO: 查詢挑戰參與者
  void challengeId;
  return [];
};

/**
 * 取得連續學習天數分佈
 */
const getStreakDistribution = async (): Promise<StreakDistribution[]> => {
  // TODO: 統計連續學習天數分佈
  return [];
};

/**
 * 取得排行榜設定
 */
const getLeaderboardConfig = async (): Promise<LeaderboardConfig> => {
  // TODO: 從資料庫讀取設定
  return {
    activityWeights: {
      post: 10,
      comment: 5,
      likeReceived: 2,
      courseCompleted: 50,
    },
    period: 'weekly',
  };
};

/**
 * 更新排行榜設定
 * @param config - 排行榜設定
 */
const updateLeaderboardConfig = async (config: LeaderboardConfig): Promise<LeaderboardConfig> => {
  // TODO: 更新資料庫設定
  return config;
};

/**
 * 取得排行榜
 * @param period - 計算週期
 */
const getLeaderboard = async (period: 'weekly' | 'monthly' | 'alltime'): Promise<LeaderboardEntry[]> => {
  // TODO: 計算並回傳排行榜
  void period;
  return [];
};

/**
 * 重置排行榜
 * @param period - 計算週期
 */
const resetLeaderboard = async (period: 'weekly' | 'monthly' | 'alltime'): Promise<{ reset: boolean; period: string }> => {
  // TODO: 重置指定週期的排行榜
  return { reset: true, period };
};

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
