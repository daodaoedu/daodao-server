/**
 * Admin 信任等級服務
 * 提供信任等級設定、分布統計、歷史紀錄、用戶群組管理功能
 */

import { prisma } from './database/prisma.service'
import type {
  TrustLevelConfig,
  TrustLevelDistribution,
  TrustLevelChange,
  UserGroup,
  UpdateTrustConfigInput,
  CreateUserGroupInput,
  UpdateUserGroupInput,
} from '../types/admin-trust.types'

/**
 * 取得所有信任等級設定
 */
const getTrustConfig = async (): Promise<TrustLevelConfig[]> => {
  const rows = await prisma.$queryRaw<Array<{
    level: number; name: string;
    promotion_criteria: Record<string, number>;
    unlocked_abilities: string[];
  }>>`SELECT * FROM trust_level_configs ORDER BY level`

  return rows.map(r => ({
    level: r.level,
    name: r.name,
    promotionCriteria: {
      readCount: r.promotion_criteria.readCount ?? r.promotion_criteria.read_count ?? 0,
      postCount: r.promotion_criteria.postCount ?? r.promotion_criteria.post_count ?? 0,
      daysVisited: r.promotion_criteria.daysVisited ?? r.promotion_criteria.days_visited ?? 0,
      likesGiven: r.promotion_criteria.likesGiven ?? r.promotion_criteria.likes_given ?? 0,
      likesReceived: r.promotion_criteria.likesReceived ?? r.promotion_criteria.likes_received ?? 0,
    },
    unlockedAbilities: r.unlocked_abilities ?? [],
  }))
}

/**
 * 更新指定信任等級設定
 * @param level - 信任等級 (0-3)
 * @param input - 更新輸入
 */
const updateTrustConfig = async (level: number, input: UpdateTrustConfigInput): Promise<TrustLevelConfig> => {
  const setClauses: string[] = []
  if (input.name !== undefined) setClauses.push(`name = '${input.name}'`)
  if (input.promotionCriteria !== undefined) {
    // Merge with existing criteria via jsonb concatenation
    setClauses.push(`promotion_criteria = promotion_criteria || '${JSON.stringify(input.promotionCriteria)}'::jsonb`)
  }
  if (input.unlockedAbilities !== undefined) {
    setClauses.push(`unlocked_abilities = ARRAY[${input.unlockedAbilities.map(a => `'${a}'`).join(',')}]::text[]`)
  }

  if (setClauses.length > 0) {
    await prisma.$executeRawUnsafe(
      `UPDATE trust_level_configs SET ${setClauses.join(', ')} WHERE level = ${level}`
    )
  }

  const [row] = await prisma.$queryRaw<Array<{
    level: number; name: string;
    promotion_criteria: Record<string, number>;
    unlocked_abilities: string[];
  }>>`SELECT * FROM trust_level_configs WHERE level = ${level}`

  if (!row) throw new Error('Trust level not found')

  return {
    level: row.level,
    name: row.name,
    promotionCriteria: {
      readCount: row.promotion_criteria.readCount ?? row.promotion_criteria.read_count ?? 0,
      postCount: row.promotion_criteria.postCount ?? row.promotion_criteria.post_count ?? 0,
      daysVisited: row.promotion_criteria.daysVisited ?? row.promotion_criteria.days_visited ?? 0,
      likesGiven: row.promotion_criteria.likesGiven ?? row.promotion_criteria.likes_given ?? 0,
      likesReceived: row.promotion_criteria.likesReceived ?? row.promotion_criteria.likes_received ?? 0,
    },
    unlockedAbilities: row.unlocked_abilities ?? [],
  }
}

/**
 * 取得信任等級用戶分布
 */
const getTrustDistribution = async (): Promise<TrustLevelDistribution[]> => {
  const rows = await prisma.$queryRaw<Array<{
    level: number; name: string; user_count: bigint;
  }>>`
    SELECT tlc.level, tlc.name, COUNT(utl.user_id)::bigint AS user_count
    FROM trust_level_configs tlc
    LEFT JOIN user_trust_levels utl ON tlc.level = utl.level
    GROUP BY tlc.level, tlc.name
    ORDER BY tlc.level
  `

  return rows.map(r => ({
    level: r.level,
    name: r.name,
    userCount: Number(r.user_count),
  }))
}

/**
 * 取得信任等級變更歷史
 * @param limit - 每頁筆數
 * @param offset - 偏移量
 */
const getTrustHistory = async (limit: number, offset: number): Promise<TrustLevelChange[]> => {
  const rows = await prisma.$queryRaw<Array<{
    id: number; user_id: number; user_name: string | null;
    from_level: number; to_level: number; reason: string;
    created_at: Date;
  }>>`
    SELECT tlh.*, u.name AS user_name
    FROM trust_level_history tlh
    JOIN users u ON tlh.user_id = u.id
    ORDER BY tlh.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `

  return rows.map(r => ({
    id: r.id,
    userId: r.user_id,
    userName: r.user_name ?? '',
    fromLevel: r.from_level,
    toLevel: r.to_level,
    reason: r.reason as 'auto' | 'manual',
    createdAt: r.created_at.toISOString(),
  }))
}

/**
 * 覆寫用戶信任等級
 * @param userId - 用戶 ID
 * @param level - 目標等級
 */
const overrideUserTrustLevel = async (userId: number, level: number): Promise<TrustLevelChange> => {
  // Get current level (default 0 if not set)
  const [current] = await prisma.$queryRaw<Array<{ level: number }>>`
    SELECT level FROM user_trust_levels WHERE user_id = ${userId}
  `
  const fromLevel = current?.level ?? 0

  // Upsert user trust level
  await prisma.$executeRaw`
    INSERT INTO user_trust_levels (user_id, level)
    VALUES (${userId}, ${level})
    ON CONFLICT (user_id) DO UPDATE SET level = ${level}
  `

  // Insert history record
  const [history] = await prisma.$queryRaw<Array<{
    id: number; user_id: number; from_level: number; to_level: number;
    reason: string; created_at: Date;
  }>>`
    INSERT INTO trust_level_history (user_id, from_level, to_level, reason)
    VALUES (${userId}, ${fromLevel}, ${level}, 'manual')
    RETURNING *
  `

  // Get user name
  const [user] = await prisma.$queryRaw<Array<{ name: string | null }>>`
    SELECT name FROM users WHERE id = ${userId}
  `

  return {
    id: history.id,
    userId: history.user_id,
    userName: user?.name ?? '',
    fromLevel: history.from_level,
    toLevel: history.to_level,
    reason: history.reason as 'auto' | 'manual',
    createdAt: history.created_at.toISOString(),
  }
}

/**
 * 列出所有用戶群組
 */
const listUserGroups = async (): Promise<UserGroup[]> => {
  const rows = await prisma.$queryRaw<Array<{
    id: number; name: string; member_count: bigint;
    permissions: string[] | null; created_at: Date;
  }>>`
    SELECT
      ug.id, ug.name, ug.created_at,
      COUNT(ugm.user_id)::bigint AS member_count,
      ARRAY_AGG(DISTINCT gp.permission) FILTER (WHERE gp.permission IS NOT NULL) AS permissions
    FROM user_groups ug
    LEFT JOIN user_group_members ugm ON ug.id = ugm.group_id
    LEFT JOIN group_permissions gp ON ug.id = gp.group_id
    GROUP BY ug.id
  `

  return rows.map(r => ({
    id: r.id,
    name: r.name,
    memberCount: Number(r.member_count),
    permissions: r.permissions ?? [],
    createdAt: r.created_at.toISOString(),
  }))
}

/**
 * 建立用戶群組
 * @param input - 建立群組輸入
 */
const createUserGroup = async (input: CreateUserGroupInput): Promise<UserGroup> => {
  const [group] = await prisma.$queryRaw<Array<{
    id: number; name: string; created_at: Date;
  }>>`
    INSERT INTO user_groups (name) VALUES (${input.name}) RETURNING *
  `

  // Insert permissions if provided
  if (input.permissions && input.permissions.length > 0) {
    for (const perm of input.permissions) {
      await prisma.$executeRaw`
        INSERT INTO group_permissions (group_id, permission) VALUES (${group.id}, ${perm})
      `
    }
  }

  return {
    id: group.id,
    name: group.name,
    memberCount: 0,
    permissions: input.permissions ?? [],
    createdAt: group.created_at.toISOString(),
  }
}

/**
 * 更新用戶群組
 * @param id - 群組 ID
 * @param input - 更新群組輸入
 */
const updateUserGroup = async (id: number, input: UpdateUserGroupInput): Promise<UserGroup> => {
  if (input.name !== undefined) {
    await prisma.$executeRaw`UPDATE user_groups SET name = ${input.name} WHERE id = ${id}`
  }

  if (input.permissions !== undefined) {
    // Replace all permissions: delete existing, insert new
    await prisma.$executeRaw`DELETE FROM group_permissions WHERE group_id = ${id}`
    for (const perm of input.permissions) {
      await prisma.$executeRaw`
        INSERT INTO group_permissions (group_id, permission) VALUES (${id}, ${perm})
      `
    }
  }

  // Return updated group
  const [row] = await prisma.$queryRaw<Array<{
    id: number; name: string; member_count: bigint;
    permissions: string[] | null; created_at: Date;
  }>>`
    SELECT
      ug.id, ug.name, ug.created_at,
      COUNT(ugm.user_id)::bigint AS member_count,
      ARRAY_AGG(DISTINCT gp.permission) FILTER (WHERE gp.permission IS NOT NULL) AS permissions
    FROM user_groups ug
    LEFT JOIN user_group_members ugm ON ug.id = ugm.group_id
    LEFT JOIN group_permissions gp ON ug.id = gp.group_id
    WHERE ug.id = ${id}
    GROUP BY ug.id
  `

  if (!row) throw new Error('User group not found')

  return {
    id: row.id,
    name: row.name,
    memberCount: Number(row.member_count),
    permissions: row.permissions ?? [],
    createdAt: row.created_at.toISOString(),
  }
}

/**
 * 刪除用戶群組
 * @param id - 群組 ID
 */
const deleteUserGroup = async (id: number): Promise<void> => {
  await prisma.$executeRaw`DELETE FROM group_permissions WHERE group_id = ${id}`
  await prisma.$executeRaw`DELETE FROM user_group_members WHERE group_id = ${id}`
  await prisma.$executeRaw`DELETE FROM user_groups WHERE id = ${id}`
}

/**
 * 取得群組權限列表
 * @param groupId - 群組 ID
 */
const getGroupPermissions = async (groupId: number): Promise<string[]> => {
  const rows = await prisma.$queryRaw<Array<{ permission: string }>>`
    SELECT permission FROM group_permissions WHERE group_id = ${groupId}
  `
  return rows.map(r => r.permission)
}

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
}
