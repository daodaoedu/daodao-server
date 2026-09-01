/**
 * Admin 用戶標籤服務
 * 提供標籤 CRUD、規則管理、批量指派功能
 */

import { Prisma } from '../../generated/prisma';
import { prisma } from './database/prisma.service';
import type { CreateTagInput, UpdateTagInput, CreateTagRuleInput, UpdateTagRuleInput, BulkTagInput, UserTag, TagRule } from '../types/admin-tags.types';

/**
 * 列出所有標籤（含已指派用戶數）
 */
const listTags = async (): Promise<UserTag[]> => {
  const tags = await prisma.$queryRaw<Array<{
    id: number;
    name: string;
    color: string;
    description: string | null;
    type: string;
    category: string | null;
    tracking_slug: string | null;
    created_at: Date;
    updated_at: Date | null;
    user_count: bigint;
  }>>`
    SELECT t.*, COUNT(uta.user_id)::bigint as user_count
    FROM user_tags t
    LEFT JOIN user_tag_assignments uta ON t.id = uta.tag_id
    GROUP BY t.id
    ORDER BY t.created_at DESC
  `;

  return tags.map((t) => ({
    id: t.id,
    name: t.name,
    color: t.color,
    description: t.description,
    type: t.type as 'manual' | 'auto',
    category: t.category as 'source' | 'characteristic' | 'event' | null,
    trackingSlug: t.tracking_slug,
    userCount: Number(t.user_count),
    createdAt: t.created_at.toISOString(),
    updatedAt: t.updated_at?.toISOString() ?? null,
  }));
};

/**
 * 建立標籤
 * @param input - 建立標籤輸入
 */
const createTag = async (input: CreateTagInput): Promise<UserTag> => {
  const [tag] = await prisma.$queryRaw<Array<{
    id: number;
    name: string;
    color: string;
    description: string | null;
    type: string;
    category: string | null;
    tracking_slug: string | null;
    created_at: Date;
    updated_at: Date | null;
  }>>`
    INSERT INTO user_tags (name, color, description, type, category, tracking_slug)
    VALUES (${input.name}, ${input.color ?? '#6366f1'}, ${input.description ?? null}, ${input.type ?? 'manual'}, ${input.category ?? null}, ${input.trackingSlug ?? null})
    RETURNING *
  `;

  const [counts] = await prisma.$queryRaw<Array<{ user_count: bigint }>>`
    SELECT COUNT(uta.user_id)::bigint as user_count
    FROM user_tags t
    LEFT JOIN user_tag_assignments uta ON t.id = uta.tag_id
    WHERE t.id = ${tag.id}
    GROUP BY t.id
  `;

  return {
    id: tag.id,
    name: tag.name,
    color: tag.color,
    description: tag.description,
    type: tag.type as 'manual' | 'auto',
    category: tag.category as 'source' | 'characteristic' | 'event' | null,
    trackingSlug: tag.tracking_slug,
    userCount: Number(counts?.user_count ?? 0),
    createdAt: tag.created_at.toISOString(),
    updatedAt: tag.updated_at?.toISOString() ?? null,
  };
};

/**
 * 更新標籤
 * @param id - 標籤 ID
 * @param input - 更新標籤輸入
 */
const updateTag = async (id: number, input: UpdateTagInput): Promise<UserTag> => {
  // Build update dynamically but safely
  if (input.name !== undefined) {
    await prisma.$executeRaw`UPDATE user_tags SET name = ${input.name}, updated_at = NOW() WHERE id = ${id}`;
  }
  if (input.color !== undefined) {
    await prisma.$executeRaw`UPDATE user_tags SET color = ${input.color}, updated_at = NOW() WHERE id = ${id}`;
  }
  if (input.description !== undefined) {
    await prisma.$executeRaw`UPDATE user_tags SET description = ${input.description}, updated_at = NOW() WHERE id = ${id}`;
  }
  if (input.category !== undefined) {
    await prisma.$executeRaw`UPDATE user_tags SET category = ${input.category}, updated_at = NOW() WHERE id = ${id}`;
  }
  if (input.trackingSlug !== undefined) {
    await prisma.$executeRaw`UPDATE user_tags SET tracking_slug = ${input.trackingSlug}, updated_at = NOW() WHERE id = ${id}`;
  }

  const [tag] = await prisma.$queryRaw<Array<{
    id: number; name: string; color: string; description: string | null;
    type: string; category: string | null; tracking_slug: string | null;
    created_at: Date; updated_at: Date | null; user_count: bigint;
  }>>`
    SELECT t.*, COUNT(uta.user_id)::bigint as user_count
    FROM user_tags t
    LEFT JOIN user_tag_assignments uta ON t.id = uta.tag_id
    WHERE t.id = ${id}
    GROUP BY t.id
  `;

  if (!tag) throw new Error('Tag not found');

  return {
    id: tag.id, name: tag.name, color: tag.color, description: tag.description,
    type: tag.type as 'manual' | 'auto',
    category: tag.category as 'source' | 'characteristic' | 'event' | null,
    trackingSlug: tag.tracking_slug,
    userCount: Number(tag.user_count),
    createdAt: tag.created_at.toISOString(), updatedAt: tag.updated_at?.toISOString() ?? null,
  };
};

/**
 * 刪除標籤
 * @param id - 標籤 ID
 */
const deleteTag = async (id: number): Promise<void> => {
  await prisma.$executeRaw`DELETE FROM user_tags WHERE id = ${id}`;
};

/**
 * 列出所有標籤規則
 */
const listTagRules = async (): Promise<TagRule[]> => {
  const rules = await prisma.$queryRaw<Array<{
    id: number;
    tag_id: number;
    condition_type: string;
    condition_operator: string;
    condition_value: string;
    logic_operator: string;
    is_enabled: boolean;
    created_at: Date;
    updated_at: Date | null;
  }>>`SELECT * FROM tag_rules ORDER BY created_at DESC`;

  return rules.map((r) => ({
    id: r.id,
    tagId: r.tag_id,
    conditionType: r.condition_type,
    conditionOperator: r.condition_operator,
    conditionValue: r.condition_value,
    logicOperator: r.logic_operator as 'AND' | 'OR',
    isEnabled: r.is_enabled,
    createdAt: r.created_at.toISOString(),
    updatedAt: r.updated_at?.toISOString() ?? null,
  }));
};

/**
 * 建立標籤規則
 * @param input - 建立標籤規則輸入
 */
const createTagRule = async (input: CreateTagRuleInput): Promise<TagRule> => {
  const [rule] = await prisma.$queryRaw<Array<{
    id: number;
    tag_id: number;
    condition_type: string;
    condition_operator: string;
    condition_value: string;
    logic_operator: string;
    is_enabled: boolean;
    created_at: Date;
    updated_at: Date | null;
  }>>`
    INSERT INTO tag_rules (tag_id, condition_type, condition_operator, condition_value, logic_operator, is_enabled)
    VALUES (${input.tagId}, ${input.conditionType}, ${input.conditionOperator ?? 'gt'}, ${input.conditionValue}, ${input.logicOperator ?? 'AND'}, ${input.isEnabled ?? true})
    RETURNING *
  `;

  return {
    id: rule.id,
    tagId: rule.tag_id,
    conditionType: rule.condition_type,
    conditionOperator: rule.condition_operator,
    conditionValue: rule.condition_value,
    logicOperator: rule.logic_operator as 'AND' | 'OR',
    isEnabled: rule.is_enabled,
    createdAt: rule.created_at.toISOString(),
    updatedAt: rule.updated_at?.toISOString() ?? null,
  };
};

/**
 * 更新標籤規則
 * @param id - 規則 ID
 * @param input - 更新標籤規則輸入
 */
const updateTagRule = async (id: number, input: UpdateTagRuleInput): Promise<TagRule> => {
  const setClauses: Prisma.Sql[] = [];
  if (input.conditionType !== undefined) {
    setClauses.push(Prisma.sql`condition_type = ${input.conditionType}`);
  }
  if (input.conditionOperator !== undefined) {
    setClauses.push(Prisma.sql`condition_operator = ${input.conditionOperator}`);
  }
  if (input.conditionValue !== undefined) {
    setClauses.push(Prisma.sql`condition_value = ${input.conditionValue}`);
  }
  if (input.logicOperator !== undefined) {
    setClauses.push(Prisma.sql`logic_operator = ${input.logicOperator}`);
  }
  if (input.isEnabled !== undefined) {
    setClauses.push(Prisma.sql`is_enabled = ${input.isEnabled}`);
  }
  if (setClauses.length > 0) {
    setClauses.push(Prisma.sql`updated_at = NOW()`);
    await prisma.$executeRaw`UPDATE tag_rules SET ${Prisma.join(setClauses, ', ')} WHERE id = ${id}`;
  }

  const [rule] = await prisma.$queryRaw<Array<{
    id: number; tag_id: number; condition_type: string; condition_operator: string;
    condition_value: string; logic_operator: string; is_enabled: boolean;
    created_at: Date; updated_at: Date | null;
  }>>`SELECT * FROM tag_rules WHERE id = ${id}`;

  if (!rule) throw new Error('Tag rule not found');

  return {
    id: rule.id,
    tagId: rule.tag_id,
    conditionType: rule.condition_type,
    conditionOperator: rule.condition_operator,
    conditionValue: rule.condition_value,
    logicOperator: rule.logic_operator as 'AND' | 'OR',
    isEnabled: rule.is_enabled,
    createdAt: rule.created_at.toISOString(),
    updatedAt: rule.updated_at?.toISOString() ?? null,
  };
};

/**
 * 刪除標籤規則
 * @param id - 規則 ID
 */
const deleteTagRule = async (id: number): Promise<void> => {
  await prisma.$executeRaw`DELETE FROM tag_rules WHERE id = ${id}`;
};

/**
 * 批量指派或移除用戶標籤
 * @param input - 批量標籤操作輸入
 */
const bulkAssignTag = async (input: BulkTagInput): Promise<{ affected: number }> => {
  if (input.action === 'add') {
    await prisma.$executeRawUnsafe(
      `INSERT INTO user_tag_assignments (user_id, tag_id, assigned_by, assigned_at)
       SELECT unnest($1::int[]), $2, 'manual', NOW()
       ON CONFLICT (user_id, tag_id) DO NOTHING`,
      input.userIds,
      input.tagId,
    );
  } else {
    await prisma.$executeRaw`
      DELETE FROM user_tag_assignments WHERE tag_id = ${input.tagId} AND user_id = ANY(${input.userIds}::int[])
    `;
  }
  return { affected: input.userIds.length };
};

/**
 * 根據追蹤短網址識別碼查找標籤
 * @param slug - 追蹤短網址識別碼（對應 ?ref= URL 參數）
 * @returns 標籤 ID 與名稱，若不存在則回傳 null
 */
const findByTrackingSlug = async (slug: string): Promise<{ id: number; name: string } | null> => {
  const results = await prisma.$queryRaw<Array<{ id: number; name: string }>>`
    SELECT id, name FROM user_tags WHERE tracking_slug = ${slug} LIMIT 1
  `;
  return results[0] ?? null;
};

export default {
  listTags,
  createTag,
  updateTag,
  deleteTag,
  listTagRules,
  createTagRule,
  updateTagRule,
  deleteTagRule,
  bulkAssignTag,
  findByTrackingSlug,
};
