import { prisma } from '../database/prisma.service';
import { BadRequestError, NotFoundError } from '../../middleware/error.middleware';

export interface QuestionTranslationInput {
  locale: string;
  prompt: string;
  options?: string[] | null;
}

export interface CreateQuestionInput {
  questionType: 'choice' | 'sentence_completion' | 'scenario';
  isNewUserPriority?: boolean;
  translations?: QuestionTranslationInput[];
}

export interface UpdateQuestionInput {
  questionType?: 'choice' | 'sentence_completion' | 'scenario';
  isNewUserPriority?: boolean;
}

async function listQuestions() {
  const rows = await prisma.$queryRaw<
    Array<{
      id: number;
      question_type: string;
      is_new_user_priority: boolean;
      created_at: Date;
      t_locale: string | null;
      t_prompt: string | null;
      t_options: unknown | null;
    }>
  >`
    SELECT
      pq.id,
      pq.question_type,
      pq.is_new_user_priority,
      pq.created_at,
      pqt.locale  AS t_locale,
      pqt.prompt  AS t_prompt,
      pqt.options AS t_options
    FROM persona_questions pq
    LEFT JOIN persona_question_translations pqt ON pqt.question_id = pq.id
    ORDER BY pq.id, pqt.locale
  `;

  const map = new Map<number, {
    id: number;
    questionType: string;
    isNewUserPriority: boolean;
    createdAt: Date;
    translations: Array<{ locale: string; prompt: string; options: string[] | null }>;
  }>();

  for (const row of rows) {
    if (!map.has(row.id)) {
      map.set(row.id, {
        id: row.id,
        questionType: row.question_type,
        isNewUserPriority: row.is_new_user_priority,
        createdAt: row.created_at,
        translations: [],
      });
    }
    if (row.t_locale) {
      map.get(row.id)!.translations.push({
        locale: row.t_locale,
        prompt: row.t_prompt ?? '',
        options: row.t_options as string[] | null,
      });
    }
  }

  return Array.from(map.values());
}

async function getQuestion(id: number) {
  const rows = await prisma.$queryRaw<
    Array<{
      id: number;
      question_type: string;
      is_new_user_priority: boolean;
      created_at: Date;
      t_locale: string | null;
      t_prompt: string | null;
      t_options: unknown | null;
    }>
  >`
    SELECT
      pq.id,
      pq.question_type,
      pq.is_new_user_priority,
      pq.created_at,
      pqt.locale  AS t_locale,
      pqt.prompt  AS t_prompt,
      pqt.options AS t_options
    FROM persona_questions pq
    LEFT JOIN persona_question_translations pqt ON pqt.question_id = pq.id
    WHERE pq.id = ${id}
    ORDER BY pqt.locale
  `;

  if (rows.length === 0) throw new NotFoundError('問題不存在');

  return {
    id: rows[0].id,
    questionType: rows[0].question_type,
    isNewUserPriority: rows[0].is_new_user_priority,
    createdAt: rows[0].created_at,
    translations: rows
      .filter(r => r.t_locale)
      .map(r => ({ locale: r.t_locale!, prompt: r.t_prompt ?? '', options: r.t_options as string[] | null })),
  };
}

async function createQuestion(input: CreateQuestionInput) {
  const result = await prisma.$queryRaw<Array<{ id: number }>>`
    INSERT INTO persona_questions (question_type, is_new_user_priority)
    VALUES (${input.questionType}::persona_question_type_t, ${input.isNewUserPriority ?? false})
    RETURNING id
  `;
  const questionId = result[0].id;

  if (input.translations?.length) {
    for (const t of input.translations) {
      const optionsJson = t.options ? JSON.stringify(t.options) : null;
      await prisma.$executeRaw`
        INSERT INTO persona_question_translations (question_id, locale, prompt, options)
        VALUES (${questionId}, ${t.locale}, ${t.prompt}, ${optionsJson}::JSONB)
        ON CONFLICT (question_id, locale) DO UPDATE
          SET prompt = EXCLUDED.prompt, options = EXCLUDED.options
      `;
    }
  }

  return getQuestion(questionId);
}

async function updateQuestion(id: number, input: UpdateQuestionInput) {
  const rows = await prisma.$queryRaw<Array<{ id: number }>>`
    SELECT id FROM persona_questions WHERE id = ${id}
  `;
  if (rows.length === 0) throw new NotFoundError('問題不存在');

  if (input.questionType !== undefined && input.isNewUserPriority !== undefined) {
    await prisma.$executeRaw`
      UPDATE persona_questions
      SET question_type = ${input.questionType}::persona_question_type_t,
          is_new_user_priority = ${input.isNewUserPriority}
      WHERE id = ${id}
    `;
  } else if (input.questionType !== undefined) {
    await prisma.$executeRaw`
      UPDATE persona_questions SET question_type = ${input.questionType}::persona_question_type_t WHERE id = ${id}
    `;
  } else if (input.isNewUserPriority !== undefined) {
    await prisma.$executeRaw`
      UPDATE persona_questions SET is_new_user_priority = ${input.isNewUserPriority} WHERE id = ${id}
    `;
  }

  return getQuestion(id);
}

async function deleteQuestion(id: number) {
  const rows = await prisma.$queryRaw<Array<{ id: number }>>`
    SELECT id FROM persona_questions WHERE id = ${id}
  `;
  if (rows.length === 0) throw new NotFoundError('問題不存在');

  await prisma.$executeRaw`DELETE FROM persona_questions WHERE id = ${id}`;
}

async function upsertTranslation(questionId: number, locale: string, input: { prompt: string; options?: string[] | null }) {
  const rows = await prisma.$queryRaw<Array<{ id: number }>>`
    SELECT id FROM persona_questions WHERE id = ${questionId}
  `;
  if (rows.length === 0) throw new NotFoundError('問題不存在');

  const optionsJson = input.options ? JSON.stringify(input.options) : null;
  await prisma.$executeRaw`
    INSERT INTO persona_question_translations (question_id, locale, prompt, options)
    VALUES (${questionId}, ${locale}, ${input.prompt}, ${optionsJson}::JSONB)
    ON CONFLICT (question_id, locale) DO UPDATE
      SET prompt = EXCLUDED.prompt, options = EXCLUDED.options
  `;

  return getQuestion(questionId);
}

async function deleteTranslation(questionId: number, locale: string) {
  const rows = await prisma.$queryRaw<Array<{ id: number }>>`
    SELECT id FROM persona_question_translations WHERE question_id = ${questionId} AND locale = ${locale}
  `;
  if (rows.length === 0) throw new NotFoundError('翻譯不存在');

  await prisma.$executeRaw`
    DELETE FROM persona_question_translations WHERE question_id = ${questionId} AND locale = ${locale}
  `;
}

export default { listQuestions, getQuestion, createQuestion, updateQuestion, deleteQuestion, upsertTranslation, deleteTranslation };
