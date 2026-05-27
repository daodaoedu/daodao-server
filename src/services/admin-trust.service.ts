/**
 * Admin 信任等級服務
 * 提供信任等級設定、分布統計、歷史紀錄、用戶群組管理功能
 * 目前回傳 mock 資料
 */

import type {
  TrustLevelConfig,
  TrustLevelDistribution,
  TrustLevelChange,
  UserGroup,
  UpdateTrustConfigInput,
  CreateUserGroupInput,
  UpdateUserGroupInput,
} from '../types/admin-trust.types';

/**
 * 取得所有信任等級設定
 */
const getTrustConfig = async (): Promise<TrustLevelConfig[]> => {
  return [
    {
      level: 0,
      name: '新手',
      promotionCriteria: { readCount: 0, postCount: 0, daysVisited: 0, likesGiven: 0, likesReceived: 0 },
      unlockedAbilities: ['read'],
    },
    {
      level: 1,
      name: '基本',
      promotionCriteria: { readCount: 5, postCount: 1, daysVisited: 3, likesGiven: 1, likesReceived: 0 },
      unlockedAbilities: ['read', 'post', 'like'],
    },
    {
      level: 2,
      name: '成員',
      promotionCriteria: { readCount: 20, postCount: 5, daysVisited: 15, likesGiven: 10, likesReceived: 5 },
      unlockedAbilities: ['read', 'post', 'like', 'flag', 'upload'],
    },
    {
      level: 3,
      name: '資深',
      promotionCriteria: { readCount: 100, postCount: 20, daysVisited: 50, likesGiven: 50, likesReceived: 20 },
      unlockedAbilities: ['read', 'post', 'like', 'flag', 'upload', 'edit_wiki', 'recategorize'],
    },
  ];
};

/**
 * 更新指定信任等級設定
 * @param level - 信任等級 (0-3)
 * @param input - 更新輸入
 */
const updateTrustConfig = async (level: number, input: UpdateTrustConfigInput): Promise<TrustLevelConfig> => {
  const configs = await getTrustConfig();
  const config = configs.find((c) => c.level === level);
  if (!config) throw new Error('Trust level not found');

  return {
    ...config,
    name: input.name ?? config.name,
    promotionCriteria: { ...config.promotionCriteria, ...input.promotionCriteria },
    unlockedAbilities: input.unlockedAbilities ?? config.unlockedAbilities,
  };
};

/**
 * 取得信任等級用戶分布
 */
const getTrustDistribution = async (): Promise<TrustLevelDistribution[]> => {
  return [
    { level: 0, name: '新手', userCount: 1250 },
    { level: 1, name: '基本', userCount: 830 },
    { level: 2, name: '成員', userCount: 420 },
    { level: 3, name: '資深', userCount: 95 },
  ];
};

/**
 * 取得信任等級變更歷史
 * @param limit - 每頁筆數
 * @param offset - 偏移量
 */
const getTrustHistory = async (limit: number, offset: number): Promise<TrustLevelChange[]> => {
  void offset;
  const mockHistory: TrustLevelChange[] = [
    { id: 1, userId: 101, userName: 'alice', fromLevel: 1, toLevel: 2, reason: 'auto', createdAt: '2026-05-20T10:00:00Z' },
    { id: 2, userId: 205, userName: 'bob', fromLevel: 0, toLevel: 1, reason: 'auto', createdAt: '2026-05-19T14:30:00Z' },
    { id: 3, userId: 312, userName: 'charlie', fromLevel: 2, toLevel: 3, reason: 'manual', createdAt: '2026-05-18T09:15:00Z' },
  ];
  return mockHistory.slice(0, limit);
};

/**
 * 覆寫用戶信任等級
 * @param userId - 用戶 ID
 * @param level - 目標等級
 */
const overrideUserTrustLevel = async (userId: number, level: number): Promise<TrustLevelChange> => {
  return {
    id: 99,
    userId,
    userName: `user_${userId}`,
    fromLevel: 0,
    toLevel: level,
    reason: 'manual',
    createdAt: new Date().toISOString(),
  };
};

/**
 * 列出所有用戶群組
 */
const listUserGroups = async (): Promise<UserGroup[]> => {
  return [
    { id: 1, name: '管理員', memberCount: 5, permissions: ['manage_users', 'manage_content', 'manage_settings'], createdAt: '2026-01-01T00:00:00Z' },
    { id: 2, name: '版主', memberCount: 12, permissions: ['manage_content', 'flag_review'], createdAt: '2026-01-15T00:00:00Z' },
  ];
};

/**
 * 建立用戶群組
 * @param input - 建立群組輸入
 */
const createUserGroup = async (input: CreateUserGroupInput): Promise<UserGroup> => {
  return {
    id: 99,
    name: input.name,
    memberCount: 0,
    permissions: input.permissions ?? [],
    createdAt: new Date().toISOString(),
  };
};

/**
 * 更新用戶群組
 * @param id - 群組 ID
 * @param input - 更新群組輸入
 */
const updateUserGroup = async (id: number, input: UpdateUserGroupInput): Promise<UserGroup> => {
  return {
    id,
    name: input.name ?? '更新後群組',
    memberCount: 5,
    permissions: input.permissions ?? ['manage_content'],
    createdAt: '2026-01-01T00:00:00Z',
  };
};

/**
 * 刪除用戶群組
 * @param id - 群組 ID
 */
const deleteUserGroup = async (id: number): Promise<void> => {
  void id;
};

/**
 * 取得群組權限列表
 * @param groupId - 群組 ID
 */
const getGroupPermissions = async (groupId: number): Promise<string[]> => {
  void groupId;
  return ['manage_users', 'manage_content', 'manage_settings'];
};

export default {
  getTrustConfig,
  updateTrustConfig,
  getTrustDistribution,
  getTrustHistory,
  overrideUserTrustLevel,
  listUserGroups,
  createUserGroup,
  updateUserGroup,
  deleteUserGroup,
  getGroupPermissions,
};
