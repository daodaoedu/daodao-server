/**
 * Admin 社群服務
 * 提供 Onboarding、會員目錄、AI 助手管理功能
 */

import { prisma } from './database/prisma.service';
import type {
  OnboardingFlow,
  MemberProfileField,
  AIKnowledgeEntry,
  AIConversation,
  AIAssistantConfig,
} from '../types/admin-community.types';

// ============================================================================
// Onboarding
// ============================================================================

/**
 * 列出所有 Onboarding 流程
 */
const listFlows = async (): Promise<OnboardingFlow[]> => {
  const flows = await prisma.$queryRaw<Array<{
    id: number;
    name: string;
    is_enabled: boolean;
    created_at: Date;
    total_started: bigint;
    total_completed: bigint;
  }>>`
    SELECT
      f.id,
      f.name,
      f.is_enabled,
      f.created_at,
      COUNT(DISTINCT r.user_id)::bigint AS total_started,
      COUNT(DISTINCT CASE WHEN r.completed_at IS NOT NULL THEN r.user_id END)::bigint AS total_completed
    FROM onboarding_flows f
    LEFT JOIN onboarding_responses r ON r.flow_id = f.id
    GROUP BY f.id
    ORDER BY f.created_at DESC
  `;

  const result: OnboardingFlow[] = [];
  for (const f of flows) {
    const steps = await prisma.$queryRaw<Array<{
      id: number;
      question_text: string;
      question_type: string;
      options: unknown;
      total_responses: bigint;
      total_users: bigint;
    }>>`
      SELECT
        s.id,
        s.question_text,
        s.question_type,
        s.options,
        COUNT(r.id)::bigint AS total_responses,
        (SELECT COUNT(DISTINCT user_id) FROM onboarding_responses WHERE flow_id = ${f.id})::bigint AS total_users
      FROM onboarding_steps s
      LEFT JOIN onboarding_responses r ON r.step_id = s.id
      WHERE s.flow_id = ${f.id}
      GROUP BY s.id
      ORDER BY s.sort_order
    `;

    const totalStarted = Number(f.total_started);
    const totalCompleted = Number(f.total_completed);

    result.push({
      id: f.id,
      name: f.name,
      isEnabled: f.is_enabled,
      steps: steps.map((s) => ({
        id: s.id,
        questionText: s.question_text,
        questionType: s.question_type as 'single' | 'multi' | 'text',
        options: Array.isArray(s.options) ? (s.options as string[]) : undefined,
        completionRate: Number(s.total_users) > 0
          ? Math.round(Number(s.total_responses) / Number(s.total_users) * 100)
          : 0,
      })),
      completionRate: totalStarted > 0 ? Math.round(totalCompleted / totalStarted * 100) : 0,
      createdAt: f.created_at.toISOString(),
    });
  }

  return result;
};

/**
 * 建立 Onboarding 流程
 * @param input - 流程資料
 */
const createFlow = async (input: { name: string; isEnabled?: boolean; steps: Array<{ questionText: string; questionType: 'single' | 'multi' | 'text'; options?: string[] }> }): Promise<OnboardingFlow> => {
  const [flow] = await prisma.$queryRaw<Array<{
    id: number;
    name: string;
    is_enabled: boolean;
    created_at: Date;
  }>>`
    INSERT INTO onboarding_flows (name, is_enabled)
    VALUES (${input.name}, ${input.isEnabled ?? true})
    RETURNING *
  `;

  const insertedSteps = [];
  for (let i = 0; i < input.steps.length; i++) {
    const step = input.steps[i];
    const [row] = await prisma.$queryRaw<Array<{
      id: number;
      question_text: string;
      question_type: string;
      options: unknown;
    }>>`
      INSERT INTO onboarding_steps (flow_id, question_text, question_type, options, sort_order)
      VALUES (${flow.id}, ${step.questionText}, ${step.questionType}, ${JSON.stringify(step.options ?? [])}::jsonb, ${i + 1})
      RETURNING *
    `;
    insertedSteps.push(row);
  }

  return {
    id: flow.id,
    name: flow.name,
    isEnabled: flow.is_enabled,
    steps: insertedSteps.map((s) => ({
      id: s.id,
      questionText: s.question_text,
      questionType: s.question_type as 'single' | 'multi' | 'text',
      options: Array.isArray(s.options) ? (s.options as string[]) : undefined,
      completionRate: 0,
    })),
    completionRate: 0,
    createdAt: flow.created_at.toISOString(),
  };
};

/**
 * 更新 Onboarding 流程
 * @param flowId - 流程 ID
 * @param input - 更新資料
 */
const updateFlow = async (flowId: number, input: { name?: string; isEnabled?: boolean; steps?: Array<{ questionText: string; questionType: 'single' | 'multi' | 'text'; options?: string[] }> }): Promise<OnboardingFlow> => {
  // Update flow metadata
  if (input.name !== undefined || input.isEnabled !== undefined) {
    await prisma.$executeRaw`
      UPDATE onboarding_flows
      SET
        name = COALESCE(${input.name ?? null}, name),
        is_enabled = COALESCE(${input.isEnabled ?? null}, is_enabled),
        updated_at = NOW()
      WHERE id = ${flowId}
    `;
  }

  // Replace steps if provided
  if (input.steps !== undefined) {
    await prisma.$executeRaw`DELETE FROM onboarding_steps WHERE flow_id = ${flowId}`;
    for (let i = 0; i < input.steps.length; i++) {
      const step = input.steps[i];
      await prisma.$executeRaw`
        INSERT INTO onboarding_steps (flow_id, question_text, question_type, options, sort_order)
        VALUES (${flowId}, ${step.questionText}, ${step.questionType}, ${JSON.stringify(step.options ?? [])}::jsonb, ${i + 1})
      `;
    }
  }

  // Fetch updated flow
  const [flow] = await prisma.$queryRaw<Array<{
    id: number;
    name: string;
    is_enabled: boolean;
    created_at: Date;
  }>>`
    SELECT * FROM onboarding_flows WHERE id = ${flowId}
  `;

  const steps = await prisma.$queryRaw<Array<{
    id: number;
    question_text: string;
    question_type: string;
    options: unknown;
  }>>`
    SELECT * FROM onboarding_steps WHERE flow_id = ${flowId} ORDER BY sort_order
  `;

  return {
    id: flow.id,
    name: flow.name,
    isEnabled: flow.is_enabled,
    steps: steps.map((s) => ({
      id: s.id,
      questionText: s.question_text,
      questionType: s.question_type as 'single' | 'multi' | 'text',
      options: Array.isArray(s.options) ? (s.options as string[]) : undefined,
      completionRate: 0,
    })),
    completionRate: 0,
    createdAt: flow.created_at.toISOString(),
  };
};

/**
 * 刪除 Onboarding 流程
 * @param flowId - 流程 ID
 */
const deleteFlow = async (flowId: number): Promise<void> => {
  await prisma.$executeRaw`DELETE FROM onboarding_responses WHERE flow_id = ${flowId}`;
  await prisma.$executeRaw`DELETE FROM onboarding_steps WHERE flow_id = ${flowId}`;
  await prisma.$executeRaw`DELETE FROM onboarding_flows WHERE id = ${flowId}`;
};

/**
 * 取得 Onboarding 流程分析數據
 * @param flowId - 流程 ID
 */
const getFlowAnalytics = async (flowId: number): Promise<{ flowId: number; totalStarted: number; totalCompleted: number; averageTimeMinutes: number; dropOffSteps: Array<{ stepId: number; dropRate: number }> }> => {
  const [stats] = await prisma.$queryRaw<Array<{
    total_started: bigint;
    total_completed: bigint;
    avg_time_seconds: number | null;
  }>>`
    SELECT
      COUNT(DISTINCT user_id)::bigint AS total_started,
      COUNT(DISTINCT CASE WHEN completed_at IS NOT NULL THEN user_id END)::bigint AS total_completed,
      AVG(EXTRACT(EPOCH FROM (completed_at - created_at))) AS avg_time_seconds
    FROM onboarding_responses
    WHERE flow_id = ${flowId}
  `;

  const stepDropOff = await prisma.$queryRaw<Array<{
    step_id: number;
    response_count: bigint;
  }>>`
    SELECT
      s.id AS step_id,
      COUNT(r.id)::bigint AS response_count
    FROM onboarding_steps s
    LEFT JOIN onboarding_responses r ON r.step_id = s.id
    WHERE s.flow_id = ${flowId}
    GROUP BY s.id
    ORDER BY s.sort_order
  `;

  const totalStarted = Number(stats?.total_started ?? 0);

  return {
    flowId,
    totalStarted,
    totalCompleted: Number(stats?.total_completed ?? 0),
    averageTimeMinutes: stats?.avg_time_seconds ? Math.round(stats.avg_time_seconds / 60) : 0,
    dropOffSteps: stepDropOff.map((s) => ({
      stepId: s.step_id,
      dropRate: totalStarted > 0
        ? Math.round((1 - Number(s.response_count) / totalStarted) * 100)
        : 0,
    })),
  };
};

// ============================================================================
// Member Directory
// ============================================================================

/**
 * 列出所有會員資料欄位
 */
const listProfileFields = async (): Promise<MemberProfileField[]> => {
  const rows = await prisma.$queryRaw<Array<{
    id: number;
    name: string;
    field_type: string;
    is_required: boolean;
    visibility: string;
    sort_order: number;
    total_users: bigint;
    filled_count: bigint;
  }>>`
    SELECT
      f.id,
      f.name,
      f.field_type,
      f.is_required,
      f.visibility,
      f.sort_order,
      (SELECT COUNT(*) FROM users)::bigint AS total_users,
      COUNT(DISTINCT pv.user_id)::bigint AS filled_count
    FROM member_profile_fields f
    LEFT JOIN member_profile_values pv ON pv.field_id = f.id
    GROUP BY f.id
    ORDER BY f.sort_order
  `;

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    fieldType: r.field_type as MemberProfileField['fieldType'],
    isRequired: r.is_required,
    visibility: r.visibility as MemberProfileField['visibility'],
    fillRate: Number(r.total_users) > 0
      ? Math.round(Number(r.filled_count) / Number(r.total_users) * 100)
      : 0,
    sortOrder: r.sort_order,
  }));
};

/**
 * 建立會員資料欄位
 * @param input - 欄位資料
 */
const createField = async (input: { name: string; fieldType: 'text' | 'dropdown' | 'multi_select' | 'url'; isRequired?: boolean; visibility?: 'public' | 'members' | 'admin' }): Promise<MemberProfileField> => {
  // Get next sort order
  const [maxOrder] = await prisma.$queryRaw<Array<{ max_order: number | null }>>`
    SELECT MAX(sort_order) AS max_order FROM member_profile_fields
  `;

  const nextOrder = (maxOrder?.max_order ?? 0) + 1;

  const [row] = await prisma.$queryRaw<Array<{
    id: number;
    name: string;
    field_type: string;
    is_required: boolean;
    visibility: string;
    sort_order: number;
  }>>`
    INSERT INTO member_profile_fields (name, field_type, is_required, visibility, sort_order)
    VALUES (${input.name}, ${input.fieldType}, ${input.isRequired ?? false}, ${input.visibility ?? 'members'}, ${nextOrder})
    RETURNING *
  `;

  return {
    id: row.id,
    name: row.name,
    fieldType: row.field_type as MemberProfileField['fieldType'],
    isRequired: row.is_required,
    visibility: row.visibility as MemberProfileField['visibility'],
    fillRate: 0,
    sortOrder: row.sort_order,
  };
};

/**
 * 更新會員資料欄位
 * @param fieldId - 欄位 ID
 * @param input - 更新資料
 */
const updateField = async (fieldId: number, input: { name?: string; fieldType?: 'text' | 'dropdown' | 'multi_select' | 'url'; isRequired?: boolean; visibility?: 'public' | 'members' | 'admin' }): Promise<MemberProfileField> => {
  await prisma.$executeRaw`
    UPDATE member_profile_fields
    SET
      name = COALESCE(${input.name ?? null}, name),
      field_type = COALESCE(${input.fieldType ?? null}, field_type),
      is_required = COALESCE(${input.isRequired ?? null}, is_required),
      visibility = COALESCE(${input.visibility ?? null}, visibility),
      updated_at = NOW()
    WHERE id = ${fieldId}
  `;

  const [row] = await prisma.$queryRaw<Array<{
    id: number;
    name: string;
    field_type: string;
    is_required: boolean;
    visibility: string;
    sort_order: number;
    filled_count: bigint;
    total_users: bigint;
  }>>`
    SELECT
      f.*,
      COUNT(DISTINCT pv.user_id)::bigint AS filled_count,
      (SELECT COUNT(*) FROM users)::bigint AS total_users
    FROM member_profile_fields f
    LEFT JOIN member_profile_values pv ON pv.field_id = f.id
    WHERE f.id = ${fieldId}
    GROUP BY f.id
  `;

  return {
    id: row.id,
    name: row.name,
    fieldType: row.field_type as MemberProfileField['fieldType'],
    isRequired: row.is_required,
    visibility: row.visibility as MemberProfileField['visibility'],
    fillRate: Number(row.total_users) > 0
      ? Math.round(Number(row.filled_count) / Number(row.total_users) * 100)
      : 0,
    sortOrder: row.sort_order,
  };
};

/**
 * 刪除會員資料欄位
 * @param fieldId - 欄位 ID
 */
const deleteField = async (fieldId: number): Promise<void> => {
  await prisma.$executeRaw`DELETE FROM member_profile_values WHERE field_id = ${fieldId}`;
  await prisma.$executeRaw`DELETE FROM member_profile_fields WHERE id = ${fieldId}`;
};

/**
 * 重新排序會員資料欄位
 * @param fieldIds - 按新順序排列的欄位 ID 陣列
 */
const reorderFields = async (fieldIds: number[]): Promise<{ reordered: boolean }> => {
  for (let i = 0; i < fieldIds.length; i++) {
    await prisma.$executeRaw`
      UPDATE member_profile_fields
      SET sort_order = ${i + 1}
      WHERE id = ${fieldIds[i]}
    `;
  }
  return { reordered: true };
};

/**
 * 取得會員目錄統計
 */
const getDirectoryStats = async (): Promise<{ totalMembers: number; completedProfiles: number; averageFillRate: number }> => {
  const [stats] = await prisma.$queryRaw<Array<{
    total_members: bigint;
    total_fields: bigint;
  }>>`
    SELECT
      (SELECT COUNT(*) FROM users)::bigint AS total_members,
      (SELECT COUNT(*) FROM member_profile_fields)::bigint AS total_fields
  `;

  const totalMembers = Number(stats?.total_members ?? 0);
  const totalFields = Number(stats?.total_fields ?? 0);

  if (totalMembers === 0 || totalFields === 0) {
    return { totalMembers, completedProfiles: 0, averageFillRate: 0 };
  }

  const [fillStats] = await prisma.$queryRaw<Array<{
    completed_profiles: bigint;
    avg_fill_rate: number | null;
  }>>`
    SELECT
      COUNT(CASE WHEN filled = total THEN 1 END)::bigint AS completed_profiles,
      AVG(filled::float / total * 100) AS avg_fill_rate
    FROM (
      SELECT
        u.id AS user_id,
        COUNT(pv.id) AS filled,
        ${totalFields}::int AS total
      FROM users u
      LEFT JOIN member_profile_values pv ON pv.user_id = u.id
      GROUP BY u.id
    ) sub
  `;

  return {
    totalMembers,
    completedProfiles: Number(fillStats?.completed_profiles ?? 0),
    averageFillRate: Math.round(fillStats?.avg_fill_rate ?? 0),
  };
};

/**
 * 取得會員目錄分析數據
 */
const getDirectoryAnalytics = async (): Promise<{ fieldFillRates: Array<{ fieldId: number; fieldName: string; fillRate: number }>; signupTrend: Array<{ date: string; count: number }> }> => {
  const fillRates = await prisma.$queryRaw<Array<{
    field_id: number;
    field_name: string;
    filled_count: bigint;
    total_users: bigint;
  }>>`
    SELECT
      f.id AS field_id,
      f.name AS field_name,
      COUNT(DISTINCT pv.user_id)::bigint AS filled_count,
      (SELECT COUNT(*) FROM users)::bigint AS total_users
    FROM member_profile_fields f
    LEFT JOIN member_profile_values pv ON pv.field_id = f.id
    GROUP BY f.id
    ORDER BY f.sort_order
  `;

  const signupTrend = await prisma.$queryRaw<Array<{
    date: Date;
    count: bigint;
  }>>`
    SELECT
      DATE_TRUNC('day', created_at)::date AS date,
      COUNT(*)::bigint AS count
    FROM users
    WHERE created_at >= NOW() - INTERVAL '30 days'
    GROUP BY DATE_TRUNC('day', created_at)
    ORDER BY date
  `;

  return {
    fieldFillRates: fillRates.map((r) => ({
      fieldId: r.field_id,
      fieldName: r.field_name,
      fillRate: Number(r.total_users) > 0
        ? Math.round(Number(r.filled_count) / Number(r.total_users) * 100)
        : 0,
    })),
    signupTrend: signupTrend.map((r) => ({
      date: r.date.toISOString().split('T')[0],
      count: Number(r.count),
    })),
  };
};

// ============================================================================
// AI Assistant
// ============================================================================

/**
 * 列出 AI 知識庫條目
 */
const listKnowledge = async (): Promise<AIKnowledgeEntry[]> => {
  const rows = await prisma.$queryRaw<Array<{
    id: number;
    file_name: string;
    file_type: string;
    file_size: number;
    uploaded_at: Date;
  }>>`
    SELECT id, file_name, file_type, file_size, uploaded_at
    FROM ai_knowledge_entries
    ORDER BY uploaded_at DESC
  `;

  return rows.map((r) => ({
    id: r.id,
    fileName: r.file_name,
    fileType: r.file_type,
    fileSize: r.file_size,
    uploadedAt: r.uploaded_at.toISOString(),
  }));
};

/**
 * 上傳 AI 知識庫條目
 * @param input - 知識庫條目資料
 */
const uploadKnowledge = async (input: { fileName: string; fileType: string; fileSize: number }): Promise<AIKnowledgeEntry> => {
  const [row] = await prisma.$queryRaw<Array<{
    id: number;
    file_name: string;
    file_type: string;
    file_size: number;
    uploaded_at: Date;
  }>>`
    INSERT INTO ai_knowledge_entries (file_name, file_type, file_size, uploaded_at)
    VALUES (${input.fileName}, ${input.fileType}, ${input.fileSize}, NOW())
    RETURNING *
  `;

  return {
    id: row.id,
    fileName: row.file_name,
    fileType: row.file_type,
    fileSize: row.file_size,
    uploadedAt: row.uploaded_at.toISOString(),
  };
};

/**
 * 刪除 AI 知識庫條目
 * @param knowledgeId - 知識庫條目 ID
 */
const deleteKnowledge = async (knowledgeId: number): Promise<void> => {
  await prisma.$executeRaw`DELETE FROM ai_knowledge_entries WHERE id = ${knowledgeId}`;
};

/**
 * 取得 AI 對話列表
 * @param status - 篩選狀態（可選）
 */
const getConversations = async (status?: 'resolved' | 'escalated' | 'needs_human'): Promise<AIConversation[]> => {
  const rows = status
    ? await prisma.$queryRaw<Array<{
        id: number;
        user_id: number;
        user_name: string;
        last_message: string;
        status: string;
        updated_at: Date;
      }>>`
        SELECT
          c.id,
          c.user_id,
          u.name AS user_name,
          COALESCE(
            (SELECT content FROM ai_messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1),
            ''
          ) AS last_message,
          c.status,
          c.updated_at
        FROM ai_conversations c
        JOIN users u ON u.id = c.user_id
        WHERE c.status = ${status}
        ORDER BY c.updated_at DESC
      `
    : await prisma.$queryRaw<Array<{
        id: number;
        user_id: number;
        user_name: string;
        last_message: string;
        status: string;
        updated_at: Date;
      }>>`
        SELECT
          c.id,
          c.user_id,
          u.name AS user_name,
          COALESCE(
            (SELECT content FROM ai_messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1),
            ''
          ) AS last_message,
          c.status,
          c.updated_at
        FROM ai_conversations c
        JOIN users u ON u.id = c.user_id
        ORDER BY c.updated_at DESC
      `;

  return rows.map((r) => ({
    id: r.id,
    userId: r.user_id,
    userName: r.user_name,
    lastMessage: r.last_message,
    status: r.status as AIConversation['status'],
    updatedAt: r.updated_at.toISOString(),
  }));
};

/**
 * 取得單一 AI 對話詳情
 * @param conversationId - 對話 ID
 */
const getConversation = async (conversationId: number): Promise<AIConversation | null> => {
  const rows = await prisma.$queryRaw<Array<{
    id: number;
    user_id: number;
    user_name: string;
    last_message: string;
    status: string;
    updated_at: Date;
  }>>`
    SELECT
      c.id,
      c.user_id,
      u.name AS user_name,
      COALESCE(
        (SELECT content FROM ai_messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1),
        ''
      ) AS last_message,
      c.status,
      c.updated_at
    FROM ai_conversations c
    JOIN users u ON u.id = c.user_id
    WHERE c.id = ${conversationId}
  `;

  if (rows.length === 0) return null;

  const r = rows[0];
  return {
    id: r.id,
    userId: r.user_id,
    userName: r.user_name,
    lastMessage: r.last_message,
    status: r.status as AIConversation['status'],
    updatedAt: r.updated_at.toISOString(),
  };
};

/**
 * 接管 AI 對話（轉為人工服務）
 * @param conversationId - 對話 ID
 */
const takeoverConversation = async (conversationId: number): Promise<{ conversationId: number; takenOver: boolean }> => {
  await prisma.$executeRaw`
    UPDATE ai_conversations
    SET status = 'needs_human', updated_at = NOW()
    WHERE id = ${conversationId}
  `;

  return { conversationId, takenOver: true };
};

/**
 * 取得 AI 助手統計
 */
const getAssistantStats = async (): Promise<{ totalConversations: number; resolvedCount: number; escalatedCount: number; averageResponseTime: number; satisfactionRate: number }> => {
  const [stats] = await prisma.$queryRaw<Array<{
    total_conversations: bigint;
    resolved_count: bigint;
    escalated_count: bigint;
  }>>`
    SELECT
      COUNT(*)::bigint AS total_conversations,
      COUNT(CASE WHEN status = 'resolved' THEN 1 END)::bigint AS resolved_count,
      COUNT(CASE WHEN status = 'escalated' THEN 1 END)::bigint AS escalated_count
    FROM ai_conversations
  `;

  return {
    totalConversations: Number(stats?.total_conversations ?? 0),
    resolvedCount: Number(stats?.resolved_count ?? 0),
    escalatedCount: Number(stats?.escalated_count ?? 0),
    averageResponseTime: 0, // Requires response time tracking not yet in schema
    satisfactionRate: 0, // Requires satisfaction rating not yet in schema
  };
};

/**
 * 取得 AI 助手設定
 */
const getAssistantConfig = async (): Promise<AIAssistantConfig> => {
  const rows = await prisma.$queryRaw<Array<{
    personality: string;
    tone: string;
    fallback_message: string;
  }>>`
    SELECT personality, tone, fallback_message
    FROM ai_assistant_config
    LIMIT 1
  `;

  if (rows.length === 0) {
    return { personality: '', tone: '', fallbackMessage: '' };
  }

  const r = rows[0];
  return {
    personality: r.personality,
    tone: r.tone,
    fallbackMessage: r.fallback_message,
  };
};

/**
 * 更新 AI 助手設定
 * @param config - AI 助手設定
 */
const updateAssistantConfig = async (config: AIAssistantConfig): Promise<AIAssistantConfig> => {
  // Upsert: update if exists, insert if not
  const existing = await prisma.$queryRaw<Array<{ id: number }>>`
    SELECT id FROM ai_assistant_config LIMIT 1
  `;

  if (existing.length > 0) {
    await prisma.$executeRaw`
      UPDATE ai_assistant_config
      SET personality = ${config.personality},
          tone = ${config.tone},
          fallback_message = ${config.fallbackMessage},
          updated_at = NOW()
      WHERE id = ${existing[0].id}
    `;
  } else {
    await prisma.$executeRaw`
      INSERT INTO ai_assistant_config (personality, tone, fallback_message)
      VALUES (${config.personality}, ${config.tone}, ${config.fallbackMessage})
    `;
  }

  return config;
};

export default {
  listFlows,
  createFlow,
  updateFlow,
  deleteFlow,
  getFlowAnalytics,
  listProfileFields,
  createField,
  updateField,
  deleteField,
  reorderFields,
  getDirectoryStats,
  getDirectoryAnalytics,
  listKnowledge,
  uploadKnowledge,
  deleteKnowledge,
  getConversations,
  getConversation,
  takeoverConversation,
  getAssistantStats,
  getAssistantConfig,
  updateAssistantConfig,
};
