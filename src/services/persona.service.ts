import { Prisma } from '../../generated/prisma';
import { prisma } from './database/prisma.service';
import { createSuccessResponse } from '../utils/response-helper';
import { BadRequestError } from '../middleware/error.middleware';
import type { ApiSuccessResponse } from '../types/api-response.types';
import type {
  PersonaQuestionItem,
  PersonaAnswerItem,
  SubmitAnswerBody,
} from '../validators/persona.validators';

// ─── DB Row Types ─────────────────────────────────────────────────────────────

interface QuestionRow {
  id: number;
  prompt: string;
  question_type: 'choice' | 'sentence_completion' | 'scenario';
  options: string[] | null;
  is_new_user_priority: boolean;
  answered: boolean;
  skip_count: number;
  suppressed: boolean;
}

interface AnswerRow {
  id: number;
  user_id: number;
  question_id: number;
  selected_value: string | null;
  text_answer: string | null;
  resonance_count: number;
  created_at: Date;
  updated_at: Date | null;
}

// ─── Formatters ───────────────────────────────────────────────────────────────

function formatQuestion(row: QuestionRow): PersonaQuestionItem {
  return {
    id: row.id,
    prompt: row.prompt,
    questionType: row.question_type,
    options: row.options,
    isNewUserPriority: row.is_new_user_priority,
    answered: row.answered,
    skipCount: Number(row.skip_count),
    suppressed: row.suppressed,
  };
}

function formatPersonaAnswer(row: AnswerRow): PersonaAnswerItem {
  return {
    id: row.id,
    userId: row.user_id,
    questionId: row.question_id,
    selectedValue: row.selected_value,
    textAnswer: row.text_answer,
    resonanceCount: Number(row.resonance_count),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at?.toISOString() ?? null,
  };
}

// ─── Service Functions ────────────────────────────────────────────────────────

async function getQuestions(userId: number | null, locale = 'zh-TW'): Promise<ApiSuccessResponse<{ questions: PersonaQuestionItem[] }>> {
  const rows = await prisma.$queryRaw<QuestionRow[]>(Prisma.sql`
    SELECT
      q.id,
      q.question_type,
      q.is_new_user_priority,
      t.prompt,
      t.options,
      CASE WHEN a.id IS NOT NULL THEN TRUE ELSE FALSE END AS answered,
      COALESCE(s.skip_count, 0)                           AS skip_count,
      COALESCE(s.suppressed, FALSE)                       AS suppressed
    FROM persona_questions q
    JOIN persona_question_translations t
      ON t.question_id = q.id AND t.locale = ${locale}
    LEFT JOIN persona_answers a
      ON a.question_id = q.id AND a.user_id = ${userId}
    LEFT JOIN persona_skips s
      ON s.question_id = q.id AND s.user_id = ${userId}
    ORDER BY q.id ASC
  `);

  return createSuccessResponse({ questions: rows.map(formatQuestion) });
}

async function submitAnswer(
  userId: number,
  body: SubmitAnswerBody
): Promise<{ answer: PersonaAnswerItem; isNew: boolean }> {
  const { questionId, selectedValue, textAnswer } = body;

  if (!selectedValue && !textAnswer) {
    throw new BadRequestError('selectedValue 或 textAnswer 至少須填一項');
  }

  const existing = await prisma.$queryRaw<AnswerRow[]>(Prisma.sql`
    SELECT a.*,
      (SELECT COUNT(*) FROM reactions WHERE target_type = 'persona_answer' AND target_id = a.id) AS resonance_count
    FROM persona_answers a
    WHERE a.user_id = ${userId} AND a.question_id = ${questionId}
    LIMIT 1
  `);

  const isNew = existing.length === 0;

  const [row] = await prisma.$queryRaw<AnswerRow[]>(Prisma.sql`
    INSERT INTO persona_answers (user_id, question_id, selected_value, text_answer, created_at, updated_at)
    VALUES (
      ${userId},
      ${questionId},
      ${selectedValue ?? null},
      ${textAnswer ?? null},
      NOW(),
      NULL
    )
    ON CONFLICT (user_id, question_id) DO UPDATE SET
      selected_value = EXCLUDED.selected_value,
      text_answer    = EXCLUDED.text_answer,
      updated_at     = NOW()
    RETURNING
      id, user_id, question_id, selected_value, text_answer, created_at, updated_at,
      (
        SELECT COUNT(*) FROM reactions WHERE target_type = 'persona_answer' AND target_id = persona_answers.id
      ) AS resonance_count
  `);

  return { answer: formatPersonaAnswer(row), isNew };
}

async function submitSkip(
  userId: number,
  questionId: number
): Promise<ApiSuccessResponse<{ suppressed: boolean; skipCount: number }>> {
  const [row] = await prisma.$queryRaw<{ skip_count: number; suppressed: boolean }[]>(Prisma.sql`
    INSERT INTO persona_skips (user_id, question_id, skip_count, suppressed, updated_at)
    VALUES (${userId}, ${questionId}, 1, FALSE, NOW())
    ON CONFLICT (user_id, question_id) DO UPDATE SET
      skip_count  = persona_skips.skip_count + 1,
      suppressed  = CASE WHEN persona_skips.skip_count + 1 >= 3 THEN TRUE ELSE FALSE END,
      updated_at  = NOW()
    RETURNING skip_count, suppressed
  `);

  return createSuccessResponse({
    skipCount: Number(row.skip_count),
    suppressed: row.suppressed,
  });
}

// ─── Task 3: Passport Gate, Carousel, Session ────────────────────────────────

const UNLOCK_THRESHOLD = 5;

async function getPassportState(userId: number): Promise<{ isLocked: boolean; answeredCount: number; answersNeeded: number }> {
  const [row] = await prisma.$queryRaw<{ count: number }[]>(
    Prisma.sql`SELECT COUNT(*) AS count FROM persona_answers WHERE user_id = ${userId}`
  );
  const answeredCount = Number(row.count);
  return {
    isLocked: answeredCount < UNLOCK_THRESHOLD,
    answeredCount,
    answersNeeded: Math.max(0, UNLOCK_THRESHOLD - answeredCount),
  };
}

async function getCarouselState(userId: number, replace?: number, locale = 'zh-TW'): Promise<ApiSuccessResponse<{
  shouldShow: boolean;
  allAnswered: boolean;
  questions: PersonaQuestionItem[];
}>> {
  // Fetch all unanswered, non-suppressed questions in a single query.
  // 移除 LIMIT 後第二段查詢本來就會抓回全部可顯示題目，因此不再需要額外的 count 查詢，
  // allAnswered 直接由結果推得，省去一次 DB round-trip。
  const allQuestions = await prisma.$queryRaw<QuestionRow[]>(Prisma.sql`
    SELECT q.id, q.question_type, q.is_new_user_priority,
           t.prompt, t.options,
           FALSE AS answered,
           COALESCE(s.skip_count, 0) AS skip_count,
           FALSE AS suppressed
    FROM persona_questions q
    JOIN persona_question_translations t
      ON t.question_id = q.id AND t.locale = ${locale}
    LEFT JOIN persona_answers a ON a.question_id = q.id AND a.user_id = ${userId}
    LEFT JOIN persona_skips s ON s.question_id = q.id AND s.user_id = ${userId}
    WHERE a.id IS NULL AND COALESCE(s.suppressed, FALSE) = FALSE
    ORDER BY RANDOM()
  `);

  const allAnswered = allQuestions.length === 0;

  if (allAnswered) {
    return createSuccessResponse({ shouldShow: false, allAnswered: true, questions: [] });
  }

  // replace 僅影響本次回傳清單，不影響 allAnswered 判定，故於記憶體中過濾
  const questions = replace != null
    ? allQuestions.filter((q) => q.id !== replace)
    : allQuestions;

  await prisma.$executeRaw(Prisma.sql`
    INSERT INTO persona_user_state (user_id, session_count_since_last_prompt, last_prompt_timestamp, created_at)
    VALUES (${userId}, 0, NOW(), NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      session_count_since_last_prompt = 0,
      last_prompt_timestamp           = NOW()
  `);

  return createSuccessResponse({ shouldShow: true, allAnswered: false, questions: questions.map(formatQuestion) });
}

async function dismissCarousel(userId: number): Promise<ApiSuccessResponse<{ dismissed: boolean }>> {
  await prisma.$executeRaw(Prisma.sql`
    INSERT INTO persona_user_state (user_id, session_count_since_last_prompt, last_dismissed_at, created_at)
    VALUES (${userId}, 0, NOW(), NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      last_dismissed_at               = NOW(),
      session_count_since_last_prompt = 0
  `);
  return createSuccessResponse({ dismissed: true });
}

async function incrementSession(userId: number): Promise<void> {
  await prisma.$executeRaw(Prisma.sql`
    INSERT INTO persona_user_state (user_id, session_count_since_last_prompt, created_at)
    VALUES (${userId}, 1, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      session_count_since_last_prompt = persona_user_state.session_count_since_last_prompt + 1
  `);
}

// ─── Task 4: Profile ─────────────────────────────────────────────────────────

interface ProfileQuestionRow {
  id: number;
  prompt: string;
  question_type: 'choice' | 'sentence_completion' | 'scenario';
  options: string[] | null;
  is_new_user_priority: boolean;
  answer_id: number | null;
  selected_value: string | null;
  text_answer: string | null;
  resonance_count: number;
  answer_created_at: Date | null;
  answer_updated_at: Date | null;
}

interface ProfileQuestionItem {
  id: number;
  prompt: string;
  questionType: 'choice' | 'sentence_completion' | 'scenario';
  options: string[] | null;
  isNewUserPriority: boolean;
  isPlaceholder: boolean;
  answer: {
    id: number;
    selectedValue: string | null;
    textAnswer: string | null;
    resonanceCount: number;
    createdAt: string;
    updatedAt: string | null;
  } | null;
}

function formatProfileQuestion(row: ProfileQuestionRow): ProfileQuestionItem {
  const hasAnswer = row.answer_id != null;
  return {
    id: row.id,
    prompt: row.prompt,
    questionType: row.question_type,
    options: row.options,
    isNewUserPriority: row.is_new_user_priority,
    isPlaceholder: !hasAnswer,
    answer: hasAnswer
      ? {
          id: row.answer_id as number,
          selectedValue: row.selected_value,
          textAnswer: row.text_answer,
          resonanceCount: Number(row.resonance_count),
          createdAt: (row.answer_created_at as Date).toISOString(),
          updatedAt: row.answer_updated_at?.toISOString() ?? null,
        }
      : null,
  };
}

async function getProfileMe(userId: number, locale = 'zh-TW'): Promise<ApiSuccessResponse<{ questions: ProfileQuestionItem[] }>> {
  const rows = await prisma.$queryRaw<ProfileQuestionRow[]>(Prisma.sql`
    SELECT
      q.id,
      t.prompt,
      q.question_type,
      t.options,
      q.is_new_user_priority,
      a.id               AS answer_id,
      a.selected_value,
      a.text_answer,
      COALESCE(r.resonance_count, 0) AS resonance_count,
      a.created_at       AS answer_created_at,
      a.updated_at       AS answer_updated_at
    FROM persona_questions q
    JOIN persona_question_translations t
      ON t.question_id = q.id AND t.locale = ${locale}
    LEFT JOIN persona_answers a
      ON a.question_id = q.id AND a.user_id = ${userId}
    LEFT JOIN (
      SELECT target_id AS answer_id, COUNT(*) AS resonance_count
      FROM reactions
      WHERE target_type = 'persona_answer'
      GROUP BY target_id
    ) r ON r.answer_id = a.id
    ORDER BY q.id ASC
  `);

  return createSuccessResponse({ questions: rows.map(formatProfileQuestion) });
}

async function getProfileUser(
  targetUserId: number,
  requesterId?: number,
  exclude?: number,
  locale = 'zh-TW'
): Promise<ApiSuccessResponse<{
  questions: ProfileQuestionItem[];
  viewerIsLocked?: boolean;
  answersNeeded?: number;
}>> {
  const baseWhere = exclude != null
    ? Prisma.sql`a.user_id = ${targetUserId} AND q.id != ${exclude}`
    : Prisma.sql`a.user_id = ${targetUserId}`;

  const rows = await prisma.$queryRaw<ProfileQuestionRow[]>(Prisma.sql`
    SELECT
      q.id,
      t.prompt,
      q.question_type,
      t.options,
      q.is_new_user_priority,
      a.id               AS answer_id,
      a.selected_value,
      a.text_answer,
      COALESCE(r.resonance_count, 0) AS resonance_count,
      a.created_at       AS answer_created_at,
      a.updated_at       AS answer_updated_at
    FROM persona_answers a
    INNER JOIN persona_questions q ON q.id = a.question_id
    JOIN persona_question_translations t
      ON t.question_id = q.id AND t.locale = ${locale}
    LEFT JOIN (
      SELECT target_id AS answer_id, COUNT(*) AS resonance_count
      FROM reactions
      WHERE target_type = 'persona_answer'
      GROUP BY target_id
    ) r ON r.answer_id = a.id
    WHERE ${baseWhere}
    ORDER BY q.id ASC
  `);

  const questions = rows.map(formatProfileQuestion);

  if (requesterId == null) {
    return createSuccessResponse({ questions });
  }

  const passport = await getPassportState(requesterId);
  return createSuccessResponse({
    questions,
    viewerIsLocked: passport.isLocked,
    answersNeeded: passport.answersNeeded,
  });
}

// ─── Task 5: Question Community Answers ──────────────────────────────────────

interface QuestionSummaryRow {
  id: number;
  prompt: string;
  question_type: 'choice' | 'sentence_completion' | 'scenario';
  options: string[] | null;
  total_answer_count: number;
  option_counts: Record<string, number>;
}

interface AnswerWithUserRow {
  answer_id: number;
  user_internal_id: number;
  user_external_id: string | null;
  custom_id: string | null;
  nickname: string | null;
  photo_url: string | null;
  is_open_profile: boolean | null;
  selected_value: string | null;
  text_answer: string | null;
  resonance_count: number;
  answered_at: Date;
}

interface ViewerReactionRow {
  target_id: number;
  reaction_type: string;
}

export interface QuestionAnswerItem {
  answerId: number;
  userId: string | null;
  name: string | null;
  photoURL: string | null;
  customId: string | null;
  selectedValue: string | null;
  textAnswer: string | null;
  resonanceCount: number;
  currentUserReaction: string | null;
  isPublic: boolean;
  isConnection: boolean;
  answeredAt: string;
  isSelf: boolean;
}

async function getQuestionAnswers(
  questionId: number,
  viewerId: number | undefined,
  params: { locale?: string; limit?: number; cursor?: number }
): Promise<ApiSuccessResponse<{
  question: {
    id: number;
    prompt: string;
    questionType: string;
    options: string[] | null;
    totalAnswerCount: number;
    optionCounts: Record<string, number>;
  };
  answers: QuestionAnswerItem[];
  hasMore: boolean;
  nextCursor: number | null;
  viewerIsLocked?: boolean;
  answersNeeded?: number;
}>> {
  const { locale = 'zh-TW', limit = 20, cursor } = params;

  // 1. Question info + total count
  const [questionRow] = await prisma.$queryRaw<QuestionSummaryRow[]>(Prisma.sql`
    SELECT
      q.id,
      t.prompt,
      q.question_type,
      t.options,
      stats.total_answer_count,
      stats.option_counts
    FROM persona_questions q
    JOIN persona_question_translations t
      ON t.question_id = q.id AND t.locale = ${locale}
    LEFT JOIN LATERAL (
      SELECT
        COALESCE(SUM(grouped.answer_count), 0)::int AS total_answer_count,
        COALESCE(
          jsonb_object_agg(grouped.selected_value, grouped.answer_count)
            FILTER (WHERE grouped.selected_value IS NOT NULL),
          '{}'::jsonb
        ) AS option_counts
      FROM (
        SELECT a.selected_value, COUNT(*)::int AS answer_count
        FROM persona_answers a
        WHERE a.question_id = q.id
        GROUP BY a.selected_value
      ) grouped
    ) stats ON TRUE
    WHERE q.id = ${questionId}
  `);

  if (!questionRow) throw new BadRequestError('找不到此題目');

  // 2. Passport gate
  let viewerIsLocked: boolean | undefined;
  let answersNeeded: number | undefined;
  if (viewerId != null) {
    const passport = await getPassportState(viewerId);
    viewerIsLocked = passport.isLocked;
    answersNeeded = passport.answersNeeded;
  }

  // 3. Fetch answers with cursor (fetch limit+1 to detect hasMore)
  const fetchLimit = limit + 1;
  const cursorCondition = cursor != null
    ? Prisma.sql`AND a.id < ${cursor}`
    : Prisma.sql``;

  const rows = await prisma.$queryRaw<AnswerWithUserRow[]>(Prisma.sql`
    SELECT
      a.id              AS answer_id,
      u.id              AS user_internal_id,
      u.external_id     AS user_external_id,
      u.custom_id,
      u.nickname,
      c.photo_url,
      u.is_open_profile,
      a.selected_value,
      a.text_answer,
      COALESCE(r.resonance_count, 0)::int AS resonance_count,
      a.created_at      AS answered_at
    FROM persona_answers a
    JOIN users u ON u.id = a.user_id
    LEFT JOIN contacts c ON c.id = u.contact_id
    LEFT JOIN (
      SELECT target_id, COUNT(*)::int AS resonance_count
      FROM reactions
      WHERE target_type = 'persona_answer'
      GROUP BY target_id
    ) r ON r.target_id = a.id
    WHERE a.question_id = ${questionId}
    ${cursorCondition}
    ORDER BY a.id DESC
    LIMIT ${fetchLimit}
  `);

  const hasMore = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? pageRows[pageRows.length - 1].answer_id : null;

  if (pageRows.length === 0) {
    return createSuccessResponse({
      question: {
        id: questionRow.id,
        prompt: questionRow.prompt,
        questionType: questionRow.question_type,
        options: questionRow.options,
        totalAnswerCount: Number(questionRow.total_answer_count),
        optionCounts: questionRow.option_counts ?? {},
      },
      answers: [],
      hasMore: false,
      nextCursor: null,
      ...(viewerId != null && { viewerIsLocked, answersNeeded }),
    });
  }

  // 4. Viewer's reactions on this page's answers
  const answerIds = pageRows.map((r) => r.answer_id);
  const viewerReactionMap = new Map<number, string>();
  if (viewerId != null) {
    const viewerReactions = await prisma.$queryRaw<ViewerReactionRow[]>(Prisma.sql`
      SELECT target_id, reaction_type
      FROM reactions
      WHERE target_type = 'persona_answer'
        AND user_id = ${viewerId}
        AND target_id = ANY(${answerIds}::int[])
    `);
    for (const vr of viewerReactions) {
      viewerReactionMap.set(vr.target_id, vr.reaction_type);
    }
  }

  // 5. Connection check
  const connectedUserIds = new Set<number>();
  if (viewerId != null) {
    const userInternalIds = pageRows.map((r) => r.user_internal_id);
    const connections = await prisma.$queryRaw<{ other_id: number }[]>(Prisma.sql`
      SELECT CASE WHEN user_a_id = ${viewerId} THEN user_b_id ELSE user_a_id END AS other_id
      FROM connections
      WHERE (user_a_id = ${viewerId} AND user_b_id = ANY(${userInternalIds}::int[]))
         OR (user_b_id = ${viewerId} AND user_a_id = ANY(${userInternalIds}::int[]))
    `);
    for (const c of connections) connectedUserIds.add(c.other_id);
  }

  // 6. Format
  const answers: QuestionAnswerItem[] = pageRows.map((row) => {
    const isPublic = row.is_open_profile ?? false;
    const isSelf = viewerId != null && row.user_internal_id === viewerId;
    const reveal = isPublic || isSelf;
    return {
      answerId: row.answer_id,
      userId: reveal ? (row.user_external_id ?? null) : null,
      name: reveal ? (row.nickname ?? null) : null,
      photoURL: reveal ? (row.photo_url ?? null) : null,
      customId: reveal ? (row.custom_id ?? null) : null,
      selectedValue: row.selected_value,
      textAnswer: row.text_answer,
      resonanceCount: Number(row.resonance_count),
      currentUserReaction: viewerReactionMap.get(row.answer_id) ?? null,
      isPublic,
      isConnection: connectedUserIds.has(row.user_internal_id),
      answeredAt: row.answered_at.toISOString(),
      isSelf,
    };
  });

  return createSuccessResponse({
    question: {
      id: questionRow.id,
      prompt: questionRow.prompt,
      questionType: questionRow.question_type,
      options: questionRow.options,
      totalAnswerCount: Number(questionRow.total_answer_count),
      optionCounts: questionRow.option_counts ?? {},
    },
    answers,
    hasMore,
    nextCursor,
    ...(viewerId != null && { viewerIsLocked, answersNeeded }),
  });
}

// ─── Export ───────────────────────────────────────────────────────────────────

export const personaService = {
  getQuestions,
  submitAnswer,
  submitSkip,
  getPassportState,
  getCarouselState,
  dismissCarousel,
  incrementSession,
  getProfileMe,
  getProfileUser,
  getQuestionAnswers,
};
