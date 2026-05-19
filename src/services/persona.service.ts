import { Prisma } from '../../generated/prisma';
import { prisma } from './database/prisma.service';
import { createSuccessResponse } from '../utils/response-helper';
import { BadRequestError, ConflictError, NotFoundError } from '../middleware/error.middleware';
import type { ApiSuccessResponse } from '../types/api-response.types';
import type {
  PersonaQuestionItem,
  PersonaAnswerItem,
  PersonaResonanceData,
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

async function getQuestions(userId: number): Promise<ApiSuccessResponse<{ questions: PersonaQuestionItem[] }>> {
  const rows = await prisma.$queryRaw<QuestionRow[]>(Prisma.sql`
    SELECT
      q.id,
      q.prompt,
      q.question_type,
      q.options,
      q.is_new_user_priority,
      CASE WHEN a.id IS NOT NULL THEN TRUE ELSE FALSE END AS answered,
      COALESCE(s.skip_count, 0)                           AS skip_count,
      COALESCE(s.suppressed, FALSE)                       AS suppressed
    FROM persona_questions q
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
    SELECT a.*, COALESCE(r.resonance_count, 0) AS resonance_count
    FROM persona_answers a
    LEFT JOIN (
      SELECT answer_id, COUNT(*) AS resonance_count
      FROM persona_resonances
      GROUP BY answer_id
    ) r ON r.answer_id = a.id
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
        SELECT COUNT(*) FROM persona_resonances WHERE answer_id = persona_answers.id
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

async function addResonance(
  userId: number,
  answerId: number
): Promise<ApiSuccessResponse<PersonaResonanceData>> {
  const answerExists = await prisma.$queryRaw<{ id: number }[]>(
    Prisma.sql`SELECT id FROM persona_answers WHERE id = ${answerId} LIMIT 1`
  );
  if (answerExists.length === 0) throw new NotFoundError('答案不存在');

  // Single INSERT with ON CONFLICT DO NOTHING eliminates check-then-insert race condition
  const inserted = await prisma.$queryRaw<{ id: number }[]>(Prisma.sql`
    INSERT INTO persona_resonances (user_id, answer_id, created_at)
    VALUES (${userId}, ${answerId}, NOW())
    ON CONFLICT (user_id, answer_id) DO NOTHING
    RETURNING id
  `);
  if (inserted.length === 0) throw new ConflictError('已對此答案表達過共鳴');

  const [countRow] = await prisma.$queryRaw<{ count: number }[]>(
    Prisma.sql`SELECT COUNT(*) AS count FROM persona_resonances WHERE answer_id = ${answerId}`
  );

  return createSuccessResponse({ answerId, resonanceCount: Number(countRow.count) });
}

async function removeResonance(
  userId: number,
  answerId: number
): Promise<ApiSuccessResponse<PersonaResonanceData>> {
  const deleted = await prisma.$executeRaw(
    Prisma.sql`DELETE FROM persona_resonances WHERE user_id = ${userId} AND answer_id = ${answerId}`
  );
  if (deleted === 0) throw new NotFoundError('共鳴記錄不存在');

  const [countRow] = await prisma.$queryRaw<{ count: number }[]>(
    Prisma.sql`SELECT COUNT(*) AS count FROM persona_resonances WHERE answer_id = ${answerId}`
  );

  return createSuccessResponse({ answerId, resonanceCount: Number(countRow.count) });
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

interface CarouselInitRow {
  is_new_user: boolean;
  session_count: number;
  dismissed_today: boolean;
  unanswered: number;
}

async function getCarouselState(userId: number, replace?: number): Promise<ApiSuccessResponse<{
  shouldShow: boolean;
  allAnswered: boolean;
  questions: PersonaQuestionItem[];
}>> {
  // Combine user check, state, dismissed-today flag, and unanswered count into one round-trip
  const [init] = await prisma.$queryRaw<CarouselInitRow[]>(Prisma.sql`
    WITH user_data AS (
      SELECT (created_at + interval '5 days' > NOW()) AS is_new_user
      FROM users WHERE id = ${userId} LIMIT 1
    ),
    state_data AS (
      SELECT
        session_count_since_last_prompt,
        (last_dismissed_at IS NOT NULL AND last_dismissed_at::date = CURRENT_DATE) AS dismissed_today
      FROM persona_user_state WHERE user_id = ${userId} LIMIT 1
    ),
    unanswered_data AS (
      SELECT COUNT(*) AS unanswered
      FROM persona_questions q
      LEFT JOIN persona_answers a ON a.question_id = q.id AND a.user_id = ${userId}
      LEFT JOIN persona_skips s ON s.question_id = q.id AND s.user_id = ${userId}
      WHERE a.id IS NULL AND COALESCE(s.suppressed, FALSE) = FALSE
    )
    SELECT
      COALESCE((SELECT is_new_user FROM user_data), FALSE)                          AS is_new_user,
      COALESCE((SELECT session_count_since_last_prompt FROM state_data), 0)         AS session_count,
      COALESCE((SELECT dismissed_today FROM state_data), FALSE)                     AS dismissed_today,
      (SELECT unanswered FROM unanswered_data)                                      AS unanswered
  `);

  const allAnswered = Number(init.unanswered) === 0;

  if (allAnswered) {
    return createSuccessResponse({ shouldShow: false, allAnswered: true, questions: [] });
  }

  const shouldShow = init.dismissed_today ? false : init.is_new_user || Number(init.session_count) >= 2;

  if (!shouldShow) {
    return createSuccessResponse({ shouldShow: false, allAnswered: false, questions: [] });
  }

  const baseCondition = replace != null
    ? Prisma.sql`a.id IS NULL AND COALESCE(s.suppressed, FALSE) = FALSE AND q.id != ${replace}`
    : Prisma.sql`a.id IS NULL AND COALESCE(s.suppressed, FALSE) = FALSE`;

  const questions = await prisma.$queryRaw<QuestionRow[]>(Prisma.sql`
    SELECT q.id, q.prompt, q.question_type, q.options, q.is_new_user_priority,
           FALSE AS answered,
           COALESCE(s.skip_count, 0) AS skip_count,
           FALSE AS suppressed
    FROM persona_questions q
    LEFT JOIN persona_answers a ON a.question_id = q.id AND a.user_id = ${userId}
    LEFT JOIN persona_skips s ON s.question_id = q.id AND s.user_id = ${userId}
    WHERE ${baseCondition}
    ORDER BY RANDOM()
    LIMIT 5
  `);

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

async function getProfileMe(userId: number): Promise<ApiSuccessResponse<{ questions: ProfileQuestionItem[] }>> {
  const rows = await prisma.$queryRaw<ProfileQuestionRow[]>(Prisma.sql`
    SELECT
      q.id,
      q.prompt,
      q.question_type,
      q.options,
      q.is_new_user_priority,
      a.id               AS answer_id,
      a.selected_value,
      a.text_answer,
      COALESCE(r.resonance_count, 0) AS resonance_count,
      a.created_at       AS answer_created_at,
      a.updated_at       AS answer_updated_at
    FROM persona_questions q
    LEFT JOIN persona_answers a
      ON a.question_id = q.id AND a.user_id = ${userId}
    LEFT JOIN (
      SELECT answer_id, COUNT(*) AS resonance_count
      FROM persona_resonances
      GROUP BY answer_id
    ) r ON r.answer_id = a.id
    ORDER BY q.id ASC
  `);

  return createSuccessResponse({ questions: rows.map(formatProfileQuestion) });
}

async function getProfileUser(
  targetUserId: number,
  requesterId?: number,
  exclude?: number
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
      q.prompt,
      q.question_type,
      q.options,
      q.is_new_user_priority,
      a.id               AS answer_id,
      a.selected_value,
      a.text_answer,
      COALESCE(r.resonance_count, 0) AS resonance_count,
      a.created_at       AS answer_created_at,
      a.updated_at       AS answer_updated_at
    FROM persona_answers a
    INNER JOIN persona_questions q ON q.id = a.question_id
    LEFT JOIN (
      SELECT answer_id, COUNT(*) AS resonance_count
      FROM persona_resonances
      GROUP BY answer_id
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

// ─── Export ───────────────────────────────────────────────────────────────────

export const personaService = {
  getQuestions,
  submitAnswer,
  submitSkip,
  addResonance,
  removeResonance,
  getPassportState,
  getCarouselState,
  dismissCarousel,
  incrementSession,
  getProfileMe,
  getProfileUser,
};
