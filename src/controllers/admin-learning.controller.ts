/**
 * Admin 學習管理控制器
 * 處理課程進度、滴灌內容、測驗、證書、學習路徑相關的 HTTP 請求
 */

import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { createSuccessResponse } from '../utils/response-helper';
import adminLearningService from '../services/admin-learning.service';
import {
  courseIdParamSchema,
  scheduleIdParamSchema,
  quizIdParamSchema,
  questionIdParamSchema,
  templateIdParamSchema,
  certificateIdParamSchema,
  pathIdParamSchema,
  stalledUsersQuerySchema,
  createDripScheduleSchema,
  manualUnlockSchema,
  createQuizSchema,
  createQuizQuestionSchema,
  createCertificateTemplateSchema,
  issueCertificateSchema,
  bulkIssueCertificateSchema,
  createLearningPathSchema,
  updateLearningPathSchema,
} from '../validators/admin-learning.validator';

// ============================================================================
// Course Progress
// ============================================================================

/**
 * 列出所有課程進度摘要
 * GET /admin/learning/courses
 */
const listCourses = asyncHandler(async (_req: Request, res: Response) => {
  const courses = await adminLearningService.listCourses();
  res.json(createSuccessResponse(courses));
});

/**
 * 取得課程流失分析
 * GET /admin/learning/courses/:courseId/drop-off
 */
const getCourseDropOff = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = courseIdParamSchema.parse(req.params);
  const result = await adminLearningService.getCourseDropOff(courseId);
  res.json(createSuccessResponse(result));
});

/**
 * 取得停滯用戶列表
 * GET /admin/learning/stalled-users
 */
const getStalledUsers = asyncHandler(async (req: Request, res: Response) => {
  const { stalledDays } = stalledUsersQuerySchema.parse(req.query);
  const users = await adminLearningService.getStalledUsers(stalledDays);
  res.json(createSuccessResponse(users));
});

/**
 * 取得梯次完成率比較
 * GET /admin/learning/cohort-comparison
 */
const getCohortComparison = asyncHandler(async (_req: Request, res: Response) => {
  const result = await adminLearningService.getCohortComparison();
  res.json(createSuccessResponse(result));
});

// ============================================================================
// Drip Content
// ============================================================================

/**
 * 列出所有滴灌排程
 * GET /admin/learning/drip-schedules
 */
const listDripSchedules = asyncHandler(async (_req: Request, res: Response) => {
  const schedules = await adminLearningService.listDripSchedules();
  res.json(createSuccessResponse(schedules));
});

/**
 * 建立滴灌排程
 * POST /admin/learning/drip-schedules
 */
const createDripSchedule = asyncHandler(async (req: Request, res: Response) => {
  const input = createDripScheduleSchema.parse(req.body);
  const schedule = await adminLearningService.createDripSchedule(input);
  res.status(201).json(createSuccessResponse(schedule));
});

/**
 * 刪除滴灌排程
 * DELETE /admin/learning/drip-schedules/:id
 */
const deleteDripSchedule = asyncHandler(async (req: Request, res: Response) => {
  const { id } = scheduleIdParamSchema.parse(req.params);
  await adminLearningService.deleteDripSchedule(id);
  res.json(createSuccessResponse({ deleted: true, id }));
});

/**
 * 手動解鎖用戶的滴灌內容
 * POST /admin/learning/drip-schedules/manual-unlock
 */
const manualUnlock = asyncHandler(async (req: Request, res: Response) => {
  const { scheduleId, userId } = manualUnlockSchema.parse(req.body);
  const result = await adminLearningService.manualUnlock(scheduleId, userId);
  res.json(createSuccessResponse(result));
});

// ============================================================================
// Quiz
// ============================================================================

/**
 * 列出所有測驗
 * GET /admin/learning/quizzes
 */
const listQuizzes = asyncHandler(async (_req: Request, res: Response) => {
  const quizzes = await adminLearningService.listQuizzes();
  res.json(createSuccessResponse(quizzes));
});

/**
 * 建立測驗
 * POST /admin/learning/quizzes
 */
const createQuiz = asyncHandler(async (req: Request, res: Response) => {
  const input = createQuizSchema.parse(req.body);
  const quiz = await adminLearningService.createQuiz(input);
  res.status(201).json(createSuccessResponse(quiz));
});

/**
 * 刪除測驗
 * DELETE /admin/learning/quizzes/:quizId
 */
const deleteQuiz = asyncHandler(async (req: Request, res: Response) => {
  const { quizId } = quizIdParamSchema.parse(req.params);
  await adminLearningService.deleteQuiz(quizId);
  res.json(createSuccessResponse({ deleted: true, quizId }));
});

/**
 * 列出測驗的所有題目
 * GET /admin/learning/quizzes/:quizId/questions
 */
const listQuestions = asyncHandler(async (req: Request, res: Response) => {
  const { quizId } = quizIdParamSchema.parse(req.params);
  const questions = await adminLearningService.listQuestions(quizId);
  res.json(createSuccessResponse(questions));
});

/**
 * 建立測驗題目
 * POST /admin/learning/quizzes/questions
 */
const createQuestion = asyncHandler(async (req: Request, res: Response) => {
  const input = createQuizQuestionSchema.parse(req.body);
  const question = await adminLearningService.createQuestion(input);
  res.status(201).json(createSuccessResponse(question));
});

/**
 * 刪除測驗題目
 * DELETE /admin/learning/quizzes/questions/:questionId
 */
const deleteQuestion = asyncHandler(async (req: Request, res: Response) => {
  const { questionId } = questionIdParamSchema.parse(req.params);
  await adminLearningService.deleteQuestion(questionId);
  res.json(createSuccessResponse({ deleted: true, questionId }));
});

/**
 * 取得測驗統計
 * GET /admin/learning/quizzes/:quizId/stats
 */
const getQuizStats = asyncHandler(async (req: Request, res: Response) => {
  const { quizId } = quizIdParamSchema.parse(req.params);
  const stats = await adminLearningService.getQuizStats(quizId);
  res.json(createSuccessResponse(stats));
});

// ============================================================================
// Certificate
// ============================================================================

/**
 * 列出所有證書範本
 * GET /admin/learning/certificates/templates
 */
const listTemplates = asyncHandler(async (_req: Request, res: Response) => {
  const templates = await adminLearningService.listTemplates();
  res.json(createSuccessResponse(templates));
});

/**
 * 建立證書範本
 * POST /admin/learning/certificates/templates
 */
const createTemplate = asyncHandler(async (req: Request, res: Response) => {
  const input = createCertificateTemplateSchema.parse(req.body);
  const template = await adminLearningService.createTemplate(input);
  res.status(201).json(createSuccessResponse(template));
});

/**
 * 刪除證書範本
 * DELETE /admin/learning/certificates/templates/:id
 */
const deleteTemplate = asyncHandler(async (req: Request, res: Response) => {
  const { id } = templateIdParamSchema.parse(req.params);
  await adminLearningService.deleteTemplate(id);
  res.json(createSuccessResponse({ deleted: true, id }));
});

/**
 * 發行證書給單一用戶
 * POST /admin/learning/certificates/issue
 */
const issueCertificate = asyncHandler(async (req: Request, res: Response) => {
  const { userId, templateId } = issueCertificateSchema.parse(req.body);
  const certificate = await adminLearningService.issueCertificate(userId, templateId);
  res.status(201).json(createSuccessResponse(certificate));
});

/**
 * 批量發行證書
 * POST /admin/learning/certificates/bulk-issue
 */
const bulkIssueCertificate = asyncHandler(async (req: Request, res: Response) => {
  const { userIds, templateId } = bulkIssueCertificateSchema.parse(req.body);
  const result = await adminLearningService.bulkIssueCertificate(userIds, templateId);
  res.json(createSuccessResponse(result));
});

/**
 * 列出已發行的證書
 * GET /admin/learning/certificates
 */
const listIssuedCertificates = asyncHandler(async (_req: Request, res: Response) => {
  const certificates = await adminLearningService.listIssuedCertificates();
  res.json(createSuccessResponse(certificates));
});

/**
 * 驗證證書有效性
 * GET /admin/learning/certificates/:id/verify
 */
const verifyCertificate = asyncHandler(async (req: Request, res: Response) => {
  const { id } = certificateIdParamSchema.parse(req.params);
  const result = await adminLearningService.verifyCertificate(id);
  res.json(createSuccessResponse(result));
});

// ============================================================================
// Learning Path
// ============================================================================

/**
 * 列出所有學習路徑
 * GET /admin/learning/paths
 */
const listPaths = asyncHandler(async (_req: Request, res: Response) => {
  const paths = await adminLearningService.listPaths();
  res.json(createSuccessResponse(paths));
});

/**
 * 建立學習路徑
 * POST /admin/learning/paths
 */
const createPath = asyncHandler(async (req: Request, res: Response) => {
  const input = createLearningPathSchema.parse(req.body);
  const path = await adminLearningService.createPath(input);
  res.status(201).json(createSuccessResponse(path));
});

/**
 * 更新學習路徑
 * PUT /admin/learning/paths/:id
 */
const updatePath = asyncHandler(async (req: Request, res: Response) => {
  const { id } = pathIdParamSchema.parse(req.params);
  const input = updateLearningPathSchema.parse(req.body);
  const path = await adminLearningService.updatePath(id, input);
  res.json(createSuccessResponse(path));
});

/**
 * 刪除學習路徑
 * DELETE /admin/learning/paths/:id
 */
const deletePath = asyncHandler(async (req: Request, res: Response) => {
  const { id } = pathIdParamSchema.parse(req.params);
  await adminLearningService.deletePath(id);
  res.json(createSuccessResponse({ deleted: true, id }));
});

/**
 * 取得學習路徑分析
 * GET /admin/learning/paths/:id/analytics
 */
const getPathAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const { id } = pathIdParamSchema.parse(req.params);
  const analytics = await adminLearningService.getPathAnalytics(id);
  res.json(createSuccessResponse(analytics));
});

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
