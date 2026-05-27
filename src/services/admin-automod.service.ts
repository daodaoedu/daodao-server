/**
 * Admin 自動審核服務
 * 提供自動審核規則、詞彙清單、動作紀錄、標記佇列、垃圾訊息偵測功能
 * 目前回傳 mock 資料
 */

import type {
  AutoModRule,
  WordList,
  AutoModActionLog,
  ContentFlag,
  CreateAutoModRuleInput,
  FlagQueueActionInput,
} from '../types/admin-automod.types';

/**
 * 列出所有自動審核規則
 */
const listRules = async (): Promise<AutoModRule[]> => {
  return [
    {
      id: 1,
      name: '禁止廣告連結',
      pattern: '*.spam-domain.com*',
      matchMode: 'wildcard',
      action: 'delete',
      isEnabled: true,
      createdAt: '2026-03-01T00:00:00Z',
    },
    {
      id: 2,
      name: '髒話警告',
      pattern: '髒話範例',
      matchMode: 'contains',
      action: 'warn',
      isEnabled: true,
      createdAt: '2026-03-05T00:00:00Z',
    },
    {
      id: 3,
      name: '重複灌水禁言',
      pattern: '重複內容',
      matchMode: 'exact',
      action: 'timeout',
      timeoutMinutes: 30,
      isEnabled: false,
      createdAt: '2026-04-10T00:00:00Z',
    },
  ];
};

/**
 * 建立自動審核規則
 * @param input - 建立規則輸入
 */
const createRule = async (input: CreateAutoModRuleInput): Promise<AutoModRule> => {
  return {
    id: 99,
    name: input.name,
    pattern: input.pattern,
    matchMode: input.matchMode ?? 'contains',
    action: input.action,
    timeoutMinutes: input.timeoutMinutes,
    isEnabled: input.isEnabled ?? true,
    createdAt: new Date().toISOString(),
  };
};

/**
 * 更新自動審核規則
 * @param id - 規則 ID
 * @param input - 更新規則輸入（部分欄位）
 */
const updateRule = async (id: number, input: Partial<CreateAutoModRuleInput>): Promise<AutoModRule> => {
  return {
    id,
    name: input.name ?? '更新後規則',
    pattern: input.pattern ?? '*',
    matchMode: input.matchMode ?? 'contains',
    action: input.action ?? 'warn',
    timeoutMinutes: input.timeoutMinutes,
    isEnabled: input.isEnabled ?? true,
    createdAt: '2026-03-01T00:00:00Z',
  };
};

/**
 * 刪除自動審核規則
 * @param id - 規則 ID
 */
const deleteRule = async (id: number): Promise<void> => {
  void id;
};

/**
 * 列出所有詞彙清單
 */
const listWordLists = async (): Promise<WordList[]> => {
  return [
    { id: 1, name: '廣告關鍵字', words: ['免費', '優惠', '限時'], isEnabled: true },
    { id: 2, name: '不當用語', words: ['範例詞彙A', '範例詞彙B'], isEnabled: true },
  ];
};

/**
 * 切換詞彙清單啟用狀態
 * @param id - 詞彙清單 ID
 */
const toggleWordList = async (id: number): Promise<WordList> => {
  return { id, name: '切換後清單', words: ['範例'], isEnabled: false };
};

/**
 * 取得自動審核動作紀錄
 * @param limit - 每頁筆數
 * @param offset - 偏移量
 */
const getActionLog = async (limit: number, offset: number): Promise<AutoModActionLog[]> => {
  void offset;
  const mockLogs: AutoModActionLog[] = [
    { id: 1, contentId: 501, contentPreview: '這是一則廣告...', ruleName: '禁止廣告連結', action: 'delete', userId: 101, userName: 'spammer1', createdAt: '2026-05-20T10:00:00Z' },
    { id: 2, contentId: 502, contentPreview: '不當言論內容...', ruleName: '髒話警告', action: 'warn', userId: 205, userName: 'user205', createdAt: '2026-05-19T14:30:00Z' },
  ];
  return mockLogs.slice(0, limit);
};

/**
 * 取得垃圾訊息偵測狀態
 */
const getSpamDetectionStatus = async (): Promise<{ isEnabled: boolean; sensitivity: string }> => {
  return { isEnabled: true, sensitivity: 'medium' };
};

/**
 * 切換垃圾訊息偵測
 */
const toggleSpamDetection = async (): Promise<{ isEnabled: boolean }> => {
  return { isEnabled: false };
};

/**
 * 列出封鎖使用者名稱清單
 */
const listUsernameBlocklist = async (): Promise<string[]> => {
  return ['admin', 'moderator', 'system', 'support'];
};

/**
 * 新增封鎖使用者名稱
 * @param username - 要封鎖的使用者名稱
 */
const addBlockedUsername = async (username: string): Promise<{ added: string }> => {
  return { added: username };
};

/**
 * 移除封鎖使用者名稱
 * @param username - 要移除的使用者名稱
 */
const removeBlockedUsername = async (username: string): Promise<{ removed: string }> => {
  return { removed: username };
};

/**
 * 取得標記佇列
 * @param limit - 每頁筆數
 * @param offset - 偏移量
 */
const getFlagQueue = async (limit: number, offset: number): Promise<ContentFlag[]> => {
  void offset;
  const mockFlags: ContentFlag[] = [
    { id: 1, contentId: 601, contentPreview: '被檢舉的內容...', flagCount: 5, priority: 'high', reasons: ['spam', 'inappropriate'], status: 'pending', createdAt: '2026-05-21T08:00:00Z' },
    { id: 2, contentId: 602, contentPreview: '另一則被檢舉...', flagCount: 2, priority: 'low', reasons: ['off_topic'], status: 'pending', createdAt: '2026-05-20T16:00:00Z' },
  ];
  return mockFlags.slice(0, limit);
};

/**
 * 處理標記佇列動作
 * @param flagId - 標記 ID
 * @param input - 處理動作輸入
 */
const processFlagAction = async (flagId: number, input: FlagQueueActionInput): Promise<{ flagId: number; action: string; processed: boolean }> => {
  return { flagId, action: input.action, processed: true };
};

/**
 * 取得社群審核設定
 */
const getCommunityModConfig = async (): Promise<{ flagThreshold: number }> => {
  return { flagThreshold: 5 };
};

/**
 * 更新社群審核設定
 * @param config - 設定物件
 */
const updateCommunityModConfig = async (config: { flagThreshold: number }): Promise<{ flagThreshold: number }> => {
  return { flagThreshold: config.flagThreshold };
};

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
