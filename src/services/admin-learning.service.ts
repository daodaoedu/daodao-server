/**
 * Admin 學習管理服務
 * 提供課程進度、滴灌內容、測驗、證書、學習路徑管理功能
 */

import { prisma } from './database/prisma.service';
import type {
  CourseProgress,
  StalledUser,
  DripSchedule,
  CreateDripScheduleInput,
  Quiz,
  QuizQuestion,
  CreateQuizInput,
  CreateQuizQuestionInput,
  Certificate,
  CertificateTemplate,
  CreateCertificateTemplateInput,
  LearningPath,
  CreateLearningPathInput,
} from '../types/admin-learning.types';

// ============================================================================
// Course Progress
// ============================================================================

/**
 * 列出所有課程進度摘要
 */
const listCourses = async (): Promise<CourseProgress[]> => {
  const rows = await prisma.$queryRaw<Array<{
    id: number;
    title: string;
    enrollment_count: bigint;
    avg_progress: number | null;
    completion_rate: number | null;
    avg_completion_time: unknown | null;
    drop_off_lesson: string | null;
  }>>`
    SELECT
      p.id,
      p.title,
      COUNT(DISTINCT lp.user_id)::bigint AS enrollment_count,
      AVG(lp.progress_percent) AS avg_progress,
      CASE
        WHEN COUNT(lp.user_id) = 0 THEN 0
        ELSE (COUNT(CASE WHEN lp.completed_at IS NOT NULL THEN 1 END)::float / COUNT(lp.user_id) * 100)
      END AS completion_rate,
      AVG(
        CASE WHEN lp.completed_at IS NOT NULL
          THEN EXTRACT(EPOCH FROM (lp.completed_at - lp.started_at))
        END
      ) AS avg_completion_time,
      NULL::text AS drop_off_lesson
    FROM practices p
    LEFT JOIN learning_progress lp ON lp.practice_id = p.id
    GROUP BY p.id
    ORDER BY p.id
  `;

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    enrollmentCount: Number(r.enrollment_count),
    avgProgress: Math.round(r.avg_progress ?? 0),
    completionRate: Math.round(r.completion_rate ?? 0),
    avgCompletionTime: r.avg_completion_time
      ? `${Math.round(Number(r.avg_completion_time) / 3600)}h`
      : '0h',
    dropOffLesson: r.drop_off_lesson,
  }));
};

/**
 * 取得課程流失分析（哪個課堂最多人放棄）
 * @param courseId - 課程 ID
 */
const getCourseDropOff = async (courseId: number): Promise<{ courseId: number; lessons: Array<{ lesson: string; dropOffCount: number }> }> => {
  // Drop-off analysis requires lesson-level tracking which is not yet in the schema
  // Return empty for now
  return { courseId, lessons: [] };
};

/**
 * 取得停滯用戶列表
 * @param stalledDays - 停滯天數門檻
 */
const getStalledUsers = async (stalledDays: number): Promise<StalledUser[]> => {
  const rows = await prisma.$queryRaw<Array<{
    user_id: number;
    user_name: string;
    course_name: string;
    progress: number;
    stalled_days: number;
  }>>`
    SELECT
      lp.user_id,
      u.nickname AS user_name,
      p.title AS course_name,
      lp.progress_percent AS progress,
      EXTRACT(DAY FROM NOW() - lp.last_activity_at)::int AS stalled_days
    FROM learning_progress lp
    JOIN users u ON u.id = lp.user_id
    JOIN practices p ON p.id = lp.practice_id
    WHERE lp.completed_at IS NULL
      AND lp.last_activity_at < NOW() - make_interval(days => ${stalledDays})
    ORDER BY lp.last_activity_at ASC
  `;

  return rows.map((r) => ({
    userId: r.user_id,
    userName: r.user_name,
    courseName: r.course_name,
    progress: r.progress,
    stalledDays: r.stalled_days,
  }));
};

/**
 * 取得不同梯次的完成率比較
 */
const getCohortComparison = async (): Promise<Array<{ cohort: string; enrollmentCount: number; completionRate: number }>> => {
  // Cohort comparison requires cohort metadata not yet tracked
  return [];
};

// ============================================================================
// Drip Content
// ============================================================================

/**
 * 列出所有滴灌排程
 */
const listDripSchedules = async (): Promise<DripSchedule[]> => {
  const rows = await prisma.$queryRaw<Array<{
    id: number;
    practice_id: number;
    course_name: string;
    module_name: string;
    unlock_type: string;
    unlock_value: string;
    unlocked_users: bigint;
    waiting_users: bigint;
  }>>`
    SELECT
      ds.id,
      ds.practice_id,
      p.title AS course_name,
      ds.module_name,
      ds.unlock_type,
      ds.unlock_value,
      COUNT(DISTINCT du.user_id)::bigint AS unlocked_users,
      (
        (SELECT COUNT(*) FROM learning_progress WHERE practice_id = ds.practice_id)
        - COUNT(DISTINCT du.user_id)
      )::bigint AS waiting_users
    FROM drip_schedules ds
    JOIN practices p ON p.id = ds.practice_id
    LEFT JOIN drip_unlocks du ON du.schedule_id = ds.id
    GROUP BY ds.id, p.title
    ORDER BY ds.id
  `;

  return rows.map((r) => ({
    id: r.id,
    courseId: r.practice_id,
    courseName: r.course_name,
    moduleName: r.module_name,
    unlockType: r.unlock_type as DripSchedule['unlockType'],
    unlockValue: r.unlock_value,
    unlockedUsers: Number(r.unlocked_users),
    waitingUsers: Math.max(0, Number(r.waiting_users)),
  }));
};

/**
 * 建立滴灌排程
 * @param input - 建立滴灌排程輸入
 */
const createDripSchedule = async (input: CreateDripScheduleInput): Promise<DripSchedule> => {
  const [row] = await prisma.$queryRaw<Array<{
    id: number;
    practice_id: number;
    module_name: string;
    unlock_type: string;
    unlock_value: string;
  }>>`
    INSERT INTO drip_schedules (practice_id, module_name, unlock_type, unlock_value)
    VALUES (${input.courseId}, ${input.moduleName}, ${input.unlockType}, ${input.unlockValue})
    RETURNING *
  `;

  // Fetch course name
  const [course] = await prisma.$queryRaw<Array<{ title: string }>>`
    SELECT title FROM practices WHERE id = ${input.courseId}
  `;

  return {
    id: row.id,
    courseId: row.practice_id,
    courseName: course?.title ?? '',
    moduleName: row.module_name,
    unlockType: row.unlock_type as DripSchedule['unlockType'],
    unlockValue: row.unlock_value,
    unlockedUsers: 0,
    waitingUsers: 0,
  };
};

/**
 * 刪除滴灌排程
 * @param id - 排程 ID
 */
const deleteDripSchedule = async (id: number): Promise<void> => {
  await prisma.$executeRaw`DELETE FROM drip_schedules WHERE id = ${id}`;
};

/**
 * 手動解鎖某用戶的滴灌內容
 * @param scheduleId - 排程 ID
 * @param userId - 用戶 ID
 */
const manualUnlock = async (scheduleId: number, userId: number): Promise<{ unlocked: boolean }> => {
  await prisma.$executeRaw`
    INSERT INTO drip_unlocks (schedule_id, user_id, unlocked_at)
    VALUES (${scheduleId}, ${userId}, NOW())
    ON CONFLICT (schedule_id, user_id) DO NOTHING
  `;
  return { unlocked: true };
};

// ============================================================================
// Quiz
// ============================================================================

/**
 * 列出所有測驗
 */
const listQuizzes = async (): Promise<Quiz[]> => {
  const rows = await prisma.$queryRaw<Array<{
    id: number;
    name: string;
    course_name: string;
    question_count: bigint;
    pass_threshold: number;
    avg_score: number | null;
    pass_rate: number | null;
  }>>`
    SELECT
      q.id,
      q.name,
      COALESCE(p.title, '') AS course_name,
      COUNT(DISTINCT qq.id)::bigint AS question_count,
      q.pass_threshold,
      AVG(qa.score) AS avg_score,
      CASE
        WHEN COUNT(qa.id) = 0 THEN 0
        ELSE (COUNT(CASE WHEN qa.score >= q.pass_threshold THEN 1 END)::float / COUNT(qa.id) * 100)
      END AS pass_rate
    FROM quizzes q
    LEFT JOIN practices p ON p.id = q.practice_id
    LEFT JOIN quiz_questions qq ON qq.quiz_id = q.id
    LEFT JOIN quiz_attempts qa ON qa.quiz_id = q.id
    GROUP BY q.id, p.title
    ORDER BY q.id
  `;

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    courseName: r.course_name,
    questionCount: Number(r.question_count),
    passThreshold: r.pass_threshold,
    avgScore: Math.round(r.avg_score ?? 0),
    passRate: Math.round(r.pass_rate ?? 0),
  }));
};

/**
 * 建立測驗
 * @param input - 建立測驗輸入
 */
const createQuiz = async (input: CreateQuizInput): Promise<Quiz> => {
  const [row] = await prisma.$queryRaw<Array<{
    id: number;
    name: string;
    practice_id: number | null;
    pass_threshold: number;
  }>>`
    INSERT INTO quizzes (name, practice_id, pass_threshold)
    VALUES (${input.name}, ${input.courseId}, ${input.passThreshold})
    RETURNING *
  `;

  const [course] = await prisma.$queryRaw<Array<{ title: string }>>`
    SELECT title FROM practices WHERE id = ${input.courseId}
  `;

  const [stats] = await prisma.$queryRaw<Array<{
    question_count: bigint;
    avg_score: number | null;
    pass_rate: number | null;
  }>>`
    SELECT
      COUNT(DISTINCT qq.id)::bigint AS question_count,
      AVG(qa.score) AS avg_score,
      CASE
        WHEN COUNT(qa.id) = 0 THEN 0
        ELSE (COUNT(CASE WHEN qa.score >= q.pass_threshold THEN 1 END)::float / COUNT(qa.id) * 100)
      END AS pass_rate
    FROM quizzes q
    LEFT JOIN quiz_questions qq ON qq.quiz_id = q.id
    LEFT JOIN quiz_attempts qa ON qa.quiz_id = q.id
    WHERE q.id = ${row.id}
    GROUP BY q.id
  `;

  return {
    id: row.id,
    name: row.name,
    courseName: course?.title ?? '',
    questionCount: Number(stats?.question_count ?? 0),
    passThreshold: row.pass_threshold,
    avgScore: Math.round(stats?.avg_score ?? 0),
    passRate: Math.round(stats?.pass_rate ?? 0),
  };
};

/**
 * 刪除測驗
 * @param quizId - 測驗 ID
 */
const deleteQuiz = async (quizId: number): Promise<void> => {
  await prisma.$executeRaw`DELETE FROM quizzes WHERE id = ${quizId}`;
};

/**
 * 列出測驗的所有題目
 * @param quizId - 測驗 ID
 */
const listQuestions = async (quizId: number): Promise<QuizQuestion[]> => {
  const rows = await prisma.$queryRaw<Array<{
    id: number;
    quiz_id: number;
    question_text: string;
    question_type: string;
    correct_rate: number | null;
  }>>`
    SELECT
      qq.id,
      qq.quiz_id,
      qq.question_text,
      qq.question_type,
      CASE
        WHEN COUNT(qa.id) = 0 THEN 0
        ELSE (COUNT(CASE WHEN qa.is_correct THEN 1 END)::float / COUNT(qa.id) * 100)
      END AS correct_rate
    FROM quiz_questions qq
    LEFT JOIN quiz_attempts qa ON qa.quiz_id = qq.quiz_id
    WHERE qq.quiz_id = ${quizId}
    GROUP BY qq.id
    ORDER BY qq.id
  `;

  return rows.map((r) => ({
    id: r.id,
    quizId: r.quiz_id,
    questionText: r.question_text,
    questionType: r.question_type as QuizQuestion['questionType'],
    correctRate: Math.round(r.correct_rate ?? 0),
  }));
};

/**
 * 建立測驗題目
 * @param input - 建立測驗題目輸入
 */
const createQuestion = async (input: CreateQuizQuestionInput): Promise<QuizQuestion> => {
  const [row] = await prisma.$queryRaw<Array<{
    id: number;
    quiz_id: number;
    question_text: string;
    question_type: string;
  }>>`
    INSERT INTO quiz_questions (quiz_id, question_text, question_type, options, correct_answer)
    VALUES (${input.quizId}, ${input.questionText}, ${input.questionType}, ${JSON.stringify(input.options ?? [])}, ${input.correctAnswer})
    RETURNING *
  `;

  return {
    id: row.id,
    quizId: row.quiz_id,
    questionText: row.question_text,
    questionType: row.question_type as QuizQuestion['questionType'],
    correctRate: 0,
  };
};

/**
 * 刪除測驗題目
 * @param questionId - 題目 ID
 */
const deleteQuestion = async (questionId: number): Promise<void> => {
  await prisma.$executeRaw`DELETE FROM quiz_questions WHERE id = ${questionId}`;
};

/**
 * 取得測驗統計（答題率、平均分數等）
 * @param quizId - 測驗 ID
 */
const getQuizStats = async (quizId: number): Promise<{ quizId: number; totalAttempts: number; avgScore: number; passRate: number; questionStats: Array<{ questionId: number; correctRate: number }> }> => {
  const [stats] = await prisma.$queryRaw<Array<{
    total_attempts: bigint;
    avg_score: number | null;
    pass_rate: number | null;
  }>>`
    SELECT
      COUNT(qa.id)::bigint AS total_attempts,
      AVG(qa.score) AS avg_score,
      CASE
        WHEN COUNT(qa.id) = 0 THEN 0
        ELSE (COUNT(CASE WHEN qa.score >= q.pass_threshold THEN 1 END)::float / COUNT(qa.id) * 100)
      END AS pass_rate
    FROM quiz_attempts qa
    JOIN quizzes q ON q.id = qa.quiz_id
    WHERE qa.quiz_id = ${quizId}
    GROUP BY q.id
  `;

  return {
    quizId,
    totalAttempts: Number(stats?.total_attempts ?? 0),
    avgScore: Math.round(stats?.avg_score ?? 0),
    passRate: Math.round(stats?.pass_rate ?? 0),
    questionStats: [],
  };
};

// ============================================================================
// Certificate
// ============================================================================

/**
 * 列出所有證書範本
 */
const listTemplates = async (): Promise<CertificateTemplate[]> => {
  const rows = await prisma.$queryRaw<Array<{
    id: number;
    name: string;
    criteria: string;
    issued_count: bigint;
    created_at: Date;
  }>>`
    SELECT
      ct.id,
      ct.name,
      ct.criteria,
      COUNT(c.id)::bigint AS issued_count,
      ct.created_at
    FROM certificate_templates ct
    LEFT JOIN certificates c ON c.template_id = ct.id
    GROUP BY ct.id
    ORDER BY ct.created_at DESC
  `;

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    criteria: r.criteria,
    issuedCount: Number(r.issued_count),
    createdAt: r.created_at.toISOString(),
  }));
};

/**
 * 建立證書範本
 * @param input - 建立證書範本輸入
 */
const createTemplate = async (input: CreateCertificateTemplateInput): Promise<CertificateTemplate> => {
  const [row] = await prisma.$queryRaw<Array<{
    id: number;
    name: string;
    criteria: string;
    created_at: Date;
  }>>`
    INSERT INTO certificate_templates (name, criteria)
    VALUES (${input.name}, ${input.criteria})
    RETURNING *
  `;

  const [counts] = await prisma.$queryRaw<Array<{ issued_count: bigint }>>`
    SELECT COUNT(c.id)::bigint AS issued_count
    FROM certificate_templates ct
    LEFT JOIN certificates c ON c.template_id = ct.id
    WHERE ct.id = ${row.id}
    GROUP BY ct.id
  `;

  return {
    id: row.id,
    name: row.name,
    criteria: row.criteria,
    issuedCount: Number(counts?.issued_count ?? 0),
    createdAt: row.created_at.toISOString(),
  };
};

/**
 * 刪除證書範本
 * @param id - 範本 ID
 */
const deleteTemplate = async (id: number): Promise<void> => {
  await prisma.$executeRaw`DELETE FROM certificate_templates WHERE id = ${id}`;
};

/**
 * 發行證書給單一用戶
 * @param userId - 用戶 ID
 * @param templateId - 範本 ID
 */
const issueCertificate = async (userId: number, templateId: number): Promise<Certificate> => {
  const [row] = await prisma.$queryRaw<Array<{
    id: number;
    template_name: string;
    user_name: string;
    issued_at: Date;
    status: string;
  }>>`
    WITH inserted AS (
      INSERT INTO certificates (user_id, template_id, issued_at, status)
      VALUES (${userId}, ${templateId}, NOW(), 'valid')
      RETURNING *
    )
    SELECT
      i.id,
      ct.name AS template_name,
      u.nickname AS user_name,
      i.issued_at,
      i.status
    FROM inserted i
    JOIN certificate_templates ct ON ct.id = i.template_id
    JOIN users u ON u.id = i.user_id
  `;

  return {
    id: row.id,
    templateName: row.template_name,
    userName: row.user_name,
    issuedAt: row.issued_at.toISOString(),
    verifyUrl: `https://daodao.co/certificates/verify/${row.id}`,
    status: row.status as Certificate['status'],
  };
};

/**
 * 批量發行證書
 * @param userIds - 用戶 ID 列表
 * @param templateId - 範本 ID
 */
const bulkIssueCertificate = async (userIds: number[], templateId: number): Promise<{ issued: number }> => {
  if (userIds.length === 0) return { issued: 0 };

  // Build a VALUES list for batch insert
  const values = userIds.map((uid) => `(${uid}, ${templateId}, NOW(), 'valid')`).join(', ');
  const issued = await prisma.$executeRawUnsafe(
    `INSERT INTO certificates (user_id, template_id, issued_at, status)
     VALUES ${values}
     ON CONFLICT (user_id, template_id) DO NOTHING`
  );

  return { issued };
};

/**
 * 列出已發行的證書
 */
const listIssuedCertificates = async (): Promise<Certificate[]> => {
  const rows = await prisma.$queryRaw<Array<{
    id: number;
    template_name: string;
    user_name: string;
    issued_at: Date;
    status: string;
  }>>`
    SELECT
      c.id,
      ct.name AS template_name,
      u.nickname AS user_name,
      c.issued_at,
      c.status
    FROM certificates c
    JOIN certificate_templates ct ON ct.id = c.template_id
    JOIN users u ON u.id = c.user_id
    ORDER BY c.issued_at DESC
  `;

  return rows.map((r) => ({
    id: r.id,
    templateName: r.template_name,
    userName: r.user_name,
    issuedAt: r.issued_at.toISOString(),
    verifyUrl: `https://daodao.co/certificates/verify/${r.id}`,
    status: r.status as Certificate['status'],
  }));
};

/**
 * 驗證證書有效性
 * @param id - 證書 ID
 */
const verifyCertificate = async (id: number): Promise<{ valid: boolean; certificate: Certificate | null }> => {
  const rows = await prisma.$queryRaw<Array<{
    id: number;
    template_name: string;
    user_name: string;
    issued_at: Date;
    status: string;
  }>>`
    SELECT
      c.id,
      ct.name AS template_name,
      u.nickname AS user_name,
      c.issued_at,
      c.status
    FROM certificates c
    JOIN certificate_templates ct ON ct.id = c.template_id
    JOIN users u ON u.id = c.user_id
    WHERE c.id = ${id}
  `;

  if (rows.length === 0) return { valid: false, certificate: null };

  const r = rows[0];
  const certificate: Certificate = {
    id: r.id,
    templateName: r.template_name,
    userName: r.user_name,
    issuedAt: r.issued_at.toISOString(),
    verifyUrl: `https://daodao.co/certificates/verify/${r.id}`,
    status: r.status as Certificate['status'],
  };

  return { valid: r.status === 'valid', certificate };
};

// ============================================================================
// Learning Path
// ============================================================================

/**
 * 列出所有學習路徑
 */
const listPaths = async (): Promise<LearningPath[]> => {
  const rows = await prisma.$queryRaw<Array<{
    id: number;
    name: string;
    description: string;
    course_count: bigint;
    enrolled_users: bigint;
    completion_rate: number | null;
  }>>`
    SELECT
      lp.id,
      lp.name,
      lp.description,
      COUNT(DISTINCT lpc.practice_id)::bigint AS course_count,
      COUNT(DISTINCT lprog.user_id)::bigint AS enrolled_users,
      CASE
        WHEN COUNT(lprog.user_id) = 0 THEN 0
        ELSE (COUNT(CASE WHEN lprog.completed_at IS NOT NULL THEN 1 END)::float / COUNT(lprog.user_id) * 100)
      END AS completion_rate
    FROM learning_paths lp
    LEFT JOIN learning_path_courses lpc ON lpc.learning_path_id = lp.id
    LEFT JOIN learning_progress lprog ON lprog.practice_id = lpc.practice_id
    GROUP BY lp.id
    ORDER BY lp.id
  `;

  // Fetch courses for each path
  const paths: LearningPath[] = [];
  for (const r of rows) {
    const courses = await prisma.$queryRaw<Array<{
      practice_id: number;
      title: string;
      sort_order: number;
    }>>`
      SELECT lpc.practice_id, p.title, lpc.sort_order
      FROM learning_path_courses lpc
      JOIN practices p ON p.id = lpc.practice_id
      WHERE lpc.learning_path_id = ${r.id}
      ORDER BY lpc.sort_order
    `;

    paths.push({
      id: r.id,
      name: r.name,
      description: r.description,
      courseCount: Number(r.course_count),
      enrolledUsers: Number(r.enrolled_users),
      completionRate: Math.round(r.completion_rate ?? 0),
      courses: courses.map((c) => ({
        id: c.practice_id,
        name: c.title,
        order: c.sort_order,
      })),
    });
  }

  return paths;
};

/**
 * 建立學習路徑
 * @param input - 建立學習路徑輸入
 */
const createPath = async (input: CreateLearningPathInput): Promise<LearningPath> => {
  const [row] = await prisma.$queryRaw<Array<{
    id: number;
    name: string;
    description: string;
  }>>`
    INSERT INTO learning_paths (name, description)
    VALUES (${input.name}, ${input.description})
    RETURNING *
  `;

  // Insert course associations
  for (let i = 0; i < input.courseIds.length; i++) {
    await prisma.$executeRaw`
      INSERT INTO learning_path_courses (learning_path_id, practice_id, sort_order)
      VALUES (${row.id}, ${input.courseIds[i]}, ${i + 1})
    `;
  }

  // Fetch course names
  const courses = await prisma.$queryRaw<Array<{
    practice_id: number;
    title: string;
    sort_order: number;
  }>>`
    SELECT lpc.practice_id, p.title, lpc.sort_order
    FROM learning_path_courses lpc
    JOIN practices p ON p.id = lpc.practice_id
    WHERE lpc.learning_path_id = ${row.id}
    ORDER BY lpc.sort_order
  `;

  const [pathStats] = await prisma.$queryRaw<Array<{
    enrolled_users: bigint;
    completion_rate: number | null;
  }>>`
    SELECT
      COUNT(DISTINCT lprog.user_id)::bigint AS enrolled_users,
      CASE
        WHEN COUNT(lprog.user_id) = 0 THEN 0
        ELSE (COUNT(CASE WHEN lprog.completed_at IS NOT NULL THEN 1 END)::float / COUNT(lprog.user_id) * 100)
      END AS completion_rate
    FROM learning_path_courses lpc
    LEFT JOIN learning_progress lprog ON lprog.practice_id = lpc.practice_id
    WHERE lpc.learning_path_id = ${row.id}
  `;

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    courseCount: input.courseIds.length,
    enrolledUsers: Number(pathStats?.enrolled_users ?? 0),
    completionRate: Math.round(pathStats?.completion_rate ?? 0),
    courses: courses.map((c) => ({
      id: c.practice_id,
      name: c.title,
      order: c.sort_order,
    })),
  };
};

/**
 * 更新學習路徑
 * @param id - 路徑 ID
 * @param input - 更新輸入（部分欄位）
 */
const updatePath = async (id: number, input: Partial<CreateLearningPathInput>): Promise<LearningPath> => {
  // Update basic fields if provided
  if (input.name !== undefined || input.description !== undefined) {
    await prisma.$executeRaw`
      UPDATE learning_paths
      SET
        name = COALESCE(${input.name ?? null}, name),
        description = COALESCE(${input.description ?? null}, description),
        updated_at = NOW()
      WHERE id = ${id}
    `;
  }

  // Replace course associations if provided
  if (input.courseIds !== undefined) {
    await prisma.$executeRaw`DELETE FROM learning_path_courses WHERE learning_path_id = ${id}`;
    for (let i = 0; i < input.courseIds.length; i++) {
      await prisma.$executeRaw`
        INSERT INTO learning_path_courses (learning_path_id, practice_id, sort_order)
        VALUES (${id}, ${input.courseIds[i]}, ${i + 1})
      `;
    }
  }

  // Fetch updated path
  const [row] = await prisma.$queryRaw<Array<{
    id: number;
    name: string;
    description: string;
  }>>`
    SELECT id, name, description FROM learning_paths WHERE id = ${id}
  `;

  const courses = await prisma.$queryRaw<Array<{
    practice_id: number;
    title: string;
    sort_order: number;
  }>>`
    SELECT lpc.practice_id, p.title, lpc.sort_order
    FROM learning_path_courses lpc
    JOIN practices p ON p.id = lpc.practice_id
    WHERE lpc.learning_path_id = ${id}
    ORDER BY lpc.sort_order
  `;

  const [pathStats] = await prisma.$queryRaw<Array<{
    enrolled_users: bigint;
    completion_rate: number | null;
  }>>`
    SELECT
      COUNT(DISTINCT lprog.user_id)::bigint AS enrolled_users,
      CASE
        WHEN COUNT(lprog.user_id) = 0 THEN 0
        ELSE (COUNT(CASE WHEN lprog.completed_at IS NOT NULL THEN 1 END)::float / COUNT(lprog.user_id) * 100)
      END AS completion_rate
    FROM learning_path_courses lpc
    LEFT JOIN learning_progress lprog ON lprog.practice_id = lpc.practice_id
    WHERE lpc.learning_path_id = ${id}
  `;

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    courseCount: courses.length,
    enrolledUsers: Number(pathStats?.enrolled_users ?? 0),
    completionRate: Math.round(pathStats?.completion_rate ?? 0),
    courses: courses.map((c) => ({
      id: c.practice_id,
      name: c.title,
      order: c.sort_order,
    })),
  };
};

/**
 * 刪除學習路徑
 * @param id - 路徑 ID
 */
const deletePath = async (id: number): Promise<void> => {
  await prisma.$executeRaw`DELETE FROM learning_path_courses WHERE learning_path_id = ${id}`;
  await prisma.$executeRaw`DELETE FROM learning_paths WHERE id = ${id}`;
};

/**
 * 取得學習路徑分析（完成率、平均進度等）
 * @param id - 路徑 ID
 */
const getPathAnalytics = async (id: number): Promise<{ pathId: number; enrolledUsers: number; completionRate: number; avgProgress: number; courseCompletionRates: Array<{ courseId: number; completionRate: number }> }> => {
  const courseRates = await prisma.$queryRaw<Array<{
    practice_id: number;
    enrolled: bigint;
    completed: bigint;
    avg_progress: number | null;
  }>>`
    SELECT
      lpc.practice_id,
      COUNT(DISTINCT lp.user_id)::bigint AS enrolled,
      COUNT(DISTINCT CASE WHEN lp.completed_at IS NOT NULL THEN lp.user_id END)::bigint AS completed,
      AVG(lp.progress_percent) AS avg_progress
    FROM learning_path_courses lpc
    LEFT JOIN learning_progress lp ON lp.practice_id = lpc.practice_id
    WHERE lpc.learning_path_id = ${id}
    GROUP BY lpc.practice_id
  `;

  const totalEnrolled = courseRates.reduce((sum, r) => sum + Number(r.enrolled), 0);
  const totalCompleted = courseRates.reduce((sum, r) => sum + Number(r.completed), 0);
  const avgProgress = courseRates.length > 0
    ? courseRates.reduce((sum, r) => sum + (r.avg_progress ?? 0), 0) / courseRates.length
    : 0;

  return {
    pathId: id,
    enrolledUsers: totalEnrolled,
    completionRate: totalEnrolled > 0 ? Math.round(totalCompleted / totalEnrolled * 100) : 0,
    avgProgress: Math.round(avgProgress),
    courseCompletionRates: courseRates.map((r) => ({
      courseId: r.practice_id,
      completionRate: Number(r.enrolled) > 0
        ? Math.round(Number(r.completed) / Number(r.enrolled) * 100)
        : 0,
    })),
  };
};

export default {
  // Course
  listCourses,
  getCourseDropOff,
  getStalledUsers,
  getCohortComparison,
  // Drip
  listDripSchedules,
  createDripSchedule,
  deleteDripSchedule,
  manualUnlock,
  // Quiz
  listQuizzes,
  createQuiz,
  deleteQuiz,
  listQuestions,
  createQuestion,
  deleteQuestion,
  getQuizStats,
  // Certificate
  listTemplates,
  createTemplate,
  deleteTemplate,
  issueCertificate,
  bulkIssueCertificate,
  listIssuedCertificates,
  verifyCertificate,
  // Path
  listPaths,
  createPath,
  updatePath,
  deletePath,
  getPathAnalytics,
};
