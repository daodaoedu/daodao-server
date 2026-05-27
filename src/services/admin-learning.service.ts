/**
 * Admin 學習管理服務
 * 提供課程進度、滴灌內容、測驗、證書、學習路徑管理功能
 * TODO: 所有方法目前回傳 mock/空資料，待實作資料庫查詢
 */

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
  // TODO: 實作資料庫查詢
  return [];
};

/**
 * 取得課程流失分析（哪個課堂最多人放棄）
 * @param courseId - 課程 ID
 */
const getCourseDropOff = async (courseId: number): Promise<{ courseId: number; lessons: Array<{ lesson: string; dropOffCount: number }> }> => {
  // TODO: 實作資料庫查詢
  return { courseId, lessons: [] };
};

/**
 * 取得停滯用戶列表
 * @param stalledDays - 停滯天數門檻
 */
const getStalledUsers = async (stalledDays: number): Promise<StalledUser[]> => {
  // TODO: 實作資料庫查詢，找出超過 stalledDays 天未有進度的用戶
  void stalledDays;
  return [];
};

/**
 * 取得不同梯次的完成率比較
 */
const getCohortComparison = async (): Promise<Array<{ cohort: string; enrollmentCount: number; completionRate: number }>> => {
  // TODO: 實作資料庫查詢
  return [];
};

// ============================================================================
// Drip Content
// ============================================================================

/**
 * 列出所有滴灌排程
 */
const listDripSchedules = async (): Promise<DripSchedule[]> => {
  // TODO: 實作資料庫查詢
  return [];
};

/**
 * 建立滴灌排程
 * @param input - 建立滴灌排程輸入
 */
const createDripSchedule = async (input: CreateDripScheduleInput): Promise<DripSchedule> => {
  // TODO: 實作資料庫寫入
  return {
    id: 1,
    courseId: input.courseId,
    courseName: '',
    moduleName: input.moduleName,
    unlockType: input.unlockType,
    unlockValue: input.unlockValue,
    unlockedUsers: 0,
    waitingUsers: 0,
  };
};

/**
 * 刪除滴灌排程
 * @param id - 排程 ID
 */
const deleteDripSchedule = async (id: number): Promise<void> => {
  // TODO: 實作資料庫刪除
  void id;
};

/**
 * 手動解鎖某用戶的滴灌內容
 * @param scheduleId - 排程 ID
 * @param userId - 用戶 ID
 */
const manualUnlock = async (scheduleId: number, userId: number): Promise<{ unlocked: boolean }> => {
  // TODO: 實作資料庫更新
  void scheduleId;
  void userId;
  return { unlocked: true };
};

// ============================================================================
// Quiz
// ============================================================================

/**
 * 列出所有測驗
 */
const listQuizzes = async (): Promise<Quiz[]> => {
  // TODO: 實作資料庫查詢
  return [];
};

/**
 * 建立測驗
 * @param input - 建立測驗輸入
 */
const createQuiz = async (input: CreateQuizInput): Promise<Quiz> => {
  // TODO: 實作資料庫寫入
  return {
    id: 1,
    name: input.name,
    courseName: '',
    questionCount: 0,
    passThreshold: input.passThreshold,
    avgScore: 0,
    passRate: 0,
  };
};

/**
 * 刪除測驗
 * @param quizId - 測驗 ID
 */
const deleteQuiz = async (quizId: number): Promise<void> => {
  // TODO: 實作資料庫刪除
  void quizId;
};

/**
 * 列出測驗的所有題目
 * @param quizId - 測驗 ID
 */
const listQuestions = async (quizId: number): Promise<QuizQuestion[]> => {
  // TODO: 實作資料庫查詢
  void quizId;
  return [];
};

/**
 * 建立測驗題目
 * @param input - 建立測驗題目輸入
 */
const createQuestion = async (input: CreateQuizQuestionInput): Promise<QuizQuestion> => {
  // TODO: 實作資料庫寫入
  return {
    id: 1,
    quizId: input.quizId,
    questionText: input.questionText,
    questionType: input.questionType,
    correctRate: 0,
  };
};

/**
 * 刪除測驗題目
 * @param questionId - 題目 ID
 */
const deleteQuestion = async (questionId: number): Promise<void> => {
  // TODO: 實作資料庫刪除
  void questionId;
};

/**
 * 取得測驗統計（答題率、平均分數等）
 * @param quizId - 測驗 ID
 */
const getQuizStats = async (quizId: number): Promise<{ quizId: number; totalAttempts: number; avgScore: number; passRate: number; questionStats: Array<{ questionId: number; correctRate: number }> }> => {
  // TODO: 實作資料庫查詢
  return { quizId, totalAttempts: 0, avgScore: 0, passRate: 0, questionStats: [] };
};

// ============================================================================
// Certificate
// ============================================================================

/**
 * 列出所有證書範本
 */
const listTemplates = async (): Promise<CertificateTemplate[]> => {
  // TODO: 實作資料庫查詢
  return [];
};

/**
 * 建立證書範本
 * @param input - 建立證書範本輸入
 */
const createTemplate = async (input: CreateCertificateTemplateInput): Promise<CertificateTemplate> => {
  // TODO: 實作資料庫寫入
  return {
    id: 1,
    name: input.name,
    criteria: input.criteria,
    issuedCount: 0,
    createdAt: new Date().toISOString(),
  };
};

/**
 * 刪除證書範本
 * @param id - 範本 ID
 */
const deleteTemplate = async (id: number): Promise<void> => {
  // TODO: 實作資料庫刪除
  void id;
};

/**
 * 發行證書給單一用戶
 * @param userId - 用戶 ID
 * @param templateId - 範本 ID
 */
const issueCertificate = async (userId: number, templateId: number): Promise<Certificate> => {
  // TODO: 實作資料庫寫入
  return {
    id: 1,
    templateName: '',
    userName: '',
    issuedAt: new Date().toISOString(),
    verifyUrl: `https://daodao.co/certificates/verify/1`,
    status: 'valid',
  };
};

/**
 * 批量發行證書
 * @param userIds - 用戶 ID 列表
 * @param templateId - 範本 ID
 */
const bulkIssueCertificate = async (userIds: number[], templateId: number): Promise<{ issued: number }> => {
  // TODO: 實作資料庫批量寫入
  void templateId;
  return { issued: userIds.length };
};

/**
 * 列出已發行的證書
 */
const listIssuedCertificates = async (): Promise<Certificate[]> => {
  // TODO: 實作資料庫查詢
  return [];
};

/**
 * 驗證證書有效性
 * @param id - 證書 ID
 */
const verifyCertificate = async (id: number): Promise<{ valid: boolean; certificate: Certificate | null }> => {
  // TODO: 實作資料庫查詢
  void id;
  return { valid: false, certificate: null };
};

// ============================================================================
// Learning Path
// ============================================================================

/**
 * 列出所有學習路徑
 */
const listPaths = async (): Promise<LearningPath[]> => {
  // TODO: 實作資料庫查詢
  return [];
};

/**
 * 建立學習路徑
 * @param input - 建立學習路徑輸入
 */
const createPath = async (input: CreateLearningPathInput): Promise<LearningPath> => {
  // TODO: 實作資料庫寫入
  return {
    id: 1,
    name: input.name,
    description: input.description,
    courseCount: input.courseIds.length,
    enrolledUsers: 0,
    completionRate: 0,
    courses: input.courseIds.map((cid, idx) => ({ id: cid, name: '', order: idx + 1 })),
  };
};

/**
 * 更新學習路徑
 * @param id - 路徑 ID
 * @param input - 更新輸入（部分欄位）
 */
const updatePath = async (id: number, input: Partial<CreateLearningPathInput>): Promise<LearningPath> => {
  // TODO: 實作資料庫更新
  return {
    id,
    name: input.name ?? '',
    description: input.description ?? '',
    courseCount: input.courseIds?.length ?? 0,
    enrolledUsers: 0,
    completionRate: 0,
    courses: (input.courseIds ?? []).map((cid, idx) => ({ id: cid, name: '', order: idx + 1 })),
  };
};

/**
 * 刪除學習路徑
 * @param id - 路徑 ID
 */
const deletePath = async (id: number): Promise<void> => {
  // TODO: 實作資料庫刪除
  void id;
};

/**
 * 取得學習路徑分析（完成率、平均進度等）
 * @param id - 路徑 ID
 */
const getPathAnalytics = async (id: number): Promise<{ pathId: number; enrolledUsers: number; completionRate: number; avgProgress: number; courseCompletionRates: Array<{ courseId: number; completionRate: number }> }> => {
  // TODO: 實作資料庫查詢
  return { pathId: id, enrolledUsers: 0, completionRate: 0, avgProgress: 0, courseCompletionRates: [] };
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
