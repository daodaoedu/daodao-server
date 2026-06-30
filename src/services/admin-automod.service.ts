/**
 * Admin 自動審核服務
 * 提供自動審核規則、詞彙清單、動作紀錄、標記佇列、垃圾訊息偵測功能
 */

import { Prisma } from '../../generated/prisma'
import { prisma } from './database/prisma.service'
import type {
  AutoModRule,
  WordList,
  AutoModActionLog,
  ContentFlag,
  CreateAutoModRuleInput,
  FlagQueueActionInput,
} from '../types/admin-automod.types'

/**
 * 列出所有自動審核規則
 */
const listRules = async (): Promise<AutoModRule[]> => {
  const rows = await prisma.$queryRaw<Array<{
    id: number; name: string; pattern: string; match_mode: string;
    action: string; timeout_minutes: number | null; is_enabled: boolean;
    created_at: Date;
  }>>`SELECT * FROM automod_rules ORDER BY created_at DESC`

  return rows.map(r => ({
    id: r.id,
    name: r.name,
    pattern: r.pattern,
    matchMode: r.match_mode as AutoModRule['matchMode'],
    action: r.action as AutoModRule['action'],
    timeoutMinutes: r.timeout_minutes ?? undefined,
    isEnabled: r.is_enabled,
    createdAt: r.created_at.toISOString(),
  }))
}

/**
 * 建立自動審核規則
 * @param input - 建立規則輸入
 */
const createRule = async (input: CreateAutoModRuleInput): Promise<AutoModRule> => {
  const matchMode = input.matchMode ?? 'contains'
  const isEnabled = input.isEnabled ?? true

  const [row] = await prisma.$queryRaw<Array<{
    id: number; name: string; pattern: string; match_mode: string;
    action: string; timeout_minutes: number | null; is_enabled: boolean;
    created_at: Date;
  }>>`
    INSERT INTO automod_rules (name, pattern, match_mode, action, timeout_minutes, is_enabled)
    VALUES (${input.name}, ${input.pattern}, ${matchMode}, ${input.action}, ${input.timeoutMinutes ?? null}, ${isEnabled})
    RETURNING *
  `

  return {
    id: row.id,
    name: row.name,
    pattern: row.pattern,
    matchMode: row.match_mode as AutoModRule['matchMode'],
    action: row.action as AutoModRule['action'],
    timeoutMinutes: row.timeout_minutes ?? undefined,
    isEnabled: row.is_enabled,
    createdAt: row.created_at.toISOString(),
  }
}

/**
 * 更新自動審核規則
 * @param id - 規則 ID
 * @param input - 更新規則輸入（部分欄位）
 */
const updateRule = async (id: number, input: Partial<CreateAutoModRuleInput>): Promise<AutoModRule> => {
  const setClauses: Prisma.Sql[] = []
  if (input.name !== undefined) setClauses.push(Prisma.sql`name = ${input.name}`)
  if (input.pattern !== undefined) setClauses.push(Prisma.sql`pattern = ${input.pattern}`)
  if (input.matchMode !== undefined) setClauses.push(Prisma.sql`match_mode = ${input.matchMode}`)
  if (input.action !== undefined) setClauses.push(Prisma.sql`action = ${input.action}`)
  if (input.timeoutMinutes !== undefined) setClauses.push(Prisma.sql`timeout_minutes = ${input.timeoutMinutes}`)
  if (input.isEnabled !== undefined) setClauses.push(Prisma.sql`is_enabled = ${input.isEnabled}`)

  if (setClauses.length > 0) {
    await prisma.$executeRaw(
      Prisma.sql`UPDATE automod_rules SET ${Prisma.join(setClauses)} WHERE id = ${id}`
    )
  }

  const [row] = await prisma.$queryRaw<Array<{
    id: number; name: string; pattern: string; match_mode: string;
    action: string; timeout_minutes: number | null; is_enabled: boolean;
    created_at: Date;
  }>>`SELECT * FROM automod_rules WHERE id = ${id}`

  if (!row) throw new Error('AutoMod rule not found')

  return {
    id: row.id,
    name: row.name,
    pattern: row.pattern,
    matchMode: row.match_mode as AutoModRule['matchMode'],
    action: row.action as AutoModRule['action'],
    timeoutMinutes: row.timeout_minutes ?? undefined,
    isEnabled: row.is_enabled,
    createdAt: row.created_at.toISOString(),
  }
}

/**
 * 刪除自動審核規則
 * @param id - 規則 ID
 */
const deleteRule = async (id: number): Promise<void> => {
  await prisma.$executeRaw`DELETE FROM automod_rules WHERE id = ${id}`
}

/**
 * 列出所有詞彙清單
 */
const listWordLists = async (): Promise<WordList[]> => {
  const rows = await prisma.$queryRaw<Array<{
    id: number; name: string; words: string[]; is_enabled: boolean;
  }>>`SELECT * FROM automod_word_lists`

  return rows.map(r => ({
    id: r.id,
    name: r.name,
    words: r.words ?? [],
    isEnabled: r.is_enabled,
  }))
}

/**
 * 切換詞彙清單啟用狀態
 * @param id - 詞彙清單 ID
 */
const toggleWordList = async (id: number): Promise<WordList> => {
  const [row] = await prisma.$queryRaw<Array<{
    id: number; name: string; words: string[]; is_enabled: boolean;
  }>>`
    UPDATE automod_word_lists SET is_enabled = NOT is_enabled WHERE id = ${id} RETURNING *
  `

  if (!row) throw new Error('Word list not found')

  return {
    id: row.id,
    name: row.name,
    words: row.words ?? [],
    isEnabled: row.is_enabled,
  }
}

/**
 * 取得自動審核動作紀錄
 * @param limit - 每頁筆數
 * @param offset - 偏移量
 */
const getActionLog = async (limit: number, offset: number): Promise<AutoModActionLog[]> => {
  const rows = await prisma.$queryRaw<Array<{
    id: number; content_id: number; content_preview: string;
    rule_name: string; action: string; user_id: number;
    user_name: string | null; created_at: Date;
  }>>`
    SELECT aal.*, u.name AS user_name
    FROM automod_action_log aal
    LEFT JOIN users u ON aal.user_id = u.id
    ORDER BY aal.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `

  return rows.map(r => ({
    id: r.id,
    contentId: r.content_id,
    contentPreview: r.content_preview,
    ruleName: r.rule_name,
    action: r.action,
    userId: r.user_id,
    userName: r.user_name ?? '',
    createdAt: r.created_at.toISOString(),
  }))
}

/**
 * 取得垃圾訊息偵測狀態
 */
const getSpamDetectionStatus = async (): Promise<{ isEnabled: boolean; sensitivity: string }> => {
  const [row] = await prisma.$queryRaw<Array<{ value: string }>>`
    SELECT value FROM community_mod_config WHERE key = 'spam_detection_enabled'
  `
  const [sensRow] = await prisma.$queryRaw<Array<{ value: string }>>`
    SELECT value FROM community_mod_config WHERE key = 'spam_detection_sensitivity'
  `

  return {
    isEnabled: row?.value === 'true',
    sensitivity: sensRow?.value ?? 'medium',
  }
}

/**
 * 切換垃圾訊息偵測
 */
const toggleSpamDetection = async (): Promise<{ isEnabled: boolean }> => {
  const [current] = await prisma.$queryRaw<Array<{ value: string }>>`
    SELECT value FROM community_mod_config WHERE key = 'spam_detection_enabled'
  `
  const newValue = current?.value === 'true' ? 'false' : 'true'

  await prisma.$executeRaw`
    UPDATE community_mod_config SET value = ${newValue} WHERE key = 'spam_detection_enabled'
  `

  return { isEnabled: newValue === 'true' }
}

/**
 * 列出封鎖使用者名稱清單
 */
const listUsernameBlocklist = async (): Promise<string[]> => {
  const rows = await prisma.$queryRaw<Array<{ word: string }>>`
    SELECT word FROM username_blocklist
  `
  return rows.map(r => r.word)
}

/**
 * 新增封鎖使用者名稱
 * @param username - 要封鎖的使用者名稱
 */
const addBlockedUsername = async (username: string): Promise<{ added: string }> => {
  await prisma.$executeRaw`INSERT INTO username_blocklist (word) VALUES (${username})`
  return { added: username }
}

/**
 * 移除封鎖使用者名稱
 * @param username - 要移除的使用者名稱
 */
const removeBlockedUsername = async (username: string): Promise<{ removed: string }> => {
  await prisma.$executeRaw`DELETE FROM username_blocklist WHERE word = ${username}`
  return { removed: username }
}

/**
 * 取得標記佇列
 * @param limit - 每頁筆數
 * @param offset - 偏移量
 */
const getFlagQueue = async (limit: number, offset: number): Promise<ContentFlag[]> => {
  const rows = await prisma.$queryRaw<Array<{
    id: number; content_id: number; content_preview: string;
    flag_count: number; priority: string; reasons: string[];
    status: string; created_at: Date;
  }>>`
    SELECT * FROM content_flags
    WHERE status = 'pending'
    ORDER BY
      CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END,
      flag_count DESC
    LIMIT ${limit} OFFSET ${offset}
  `

  return rows.map(r => ({
    id: r.id,
    contentId: r.content_id,
    contentPreview: r.content_preview,
    flagCount: r.flag_count,
    priority: r.priority as ContentFlag['priority'],
    reasons: r.reasons ?? [],
    status: r.status as ContentFlag['status'],
    createdAt: r.created_at.toISOString(),
  }))
}

/**
 * 處理標記佇列動作
 * @param flagId - 標記 ID
 * @param input - 處理動作輸入
 */
const processFlagAction = async (flagId: number, input: FlagQueueActionInput): Promise<{ flagId: number; action: string; processed: boolean }> => {
  const newStatus = input.action === 'defer' ? 'pending' : 'resolved'
  await prisma.$executeRaw`UPDATE content_flags SET status = ${newStatus} WHERE id = ${flagId}`
  return { flagId, action: input.action, processed: true }
}

/**
 * 取得社群審核設定
 */
const getCommunityModConfig = async (): Promise<{ flagThreshold: number }> => {
  const [row] = await prisma.$queryRaw<Array<{ value: string }>>`
    SELECT value FROM community_mod_config WHERE key = 'flag_threshold'
  `
  return { flagThreshold: Number(row?.value ?? 5) }
}

/**
 * 更新社群審核設定
 * @param config - 設定物件
 */
const updateCommunityModConfig = async (config: { flagThreshold: number }): Promise<{ flagThreshold: number }> => {
  await prisma.$executeRaw`
    UPDATE community_mod_config SET value = ${String(config.flagThreshold)} WHERE key = 'flag_threshold'
  `
  return { flagThreshold: config.flagThreshold }
}

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
}
