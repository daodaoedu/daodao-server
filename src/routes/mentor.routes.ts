/**
 * Mentor Routes
 * 導師路由配置
 */

import { Router } from 'express';
import * as mentorController from '../controllers/mentor.controller';
import {
  assignMentorToMarathonSchema,
  updateMentorMarathonSchema,
  assignParticipantToMentorSchema,
  assignmentIdParamsSchema,
  participantIdParamsSchema,
  eventIdParamsSchema,
  paginationQuerySchema
} from '../validators/mentor.validators';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validator';
import { globalLimiter } from '../middleware/rate-limit.middleware';

const router = Router();

// 應用認證中間件到所有路由
router.use(authenticate);

// 應用速率限制中間件
router.use(globalLimiter);

/**
 * 導師馬拉松管理路由
 * 注意：這些功能需要 mentor_marathon 表，目前資料庫架構中不存在
 */

// POST /api/mentor/marathon - 指定導師參與馬拉松
router.post(
  '/marathon',
  validateRequest(assignMentorToMarathonSchema, 'body'),
  mentorController.assignMentorToMarathon
);

// PUT /api/mentor/marathon/:assignmentId - 更新導師馬拉松關聯
router.put(
  '/marathon/:assignmentId',
  validateRequest(assignmentIdParamsSchema, 'params'),
  validateRequest(updateMentorMarathonSchema, 'body'),
  mentorController.updateMentorMarathon
);

// DELETE /api/mentor/marathon/:assignmentId - 刪除導師馬拉松關聯
router.delete(
  '/marathon/:assignmentId',
  validateRequest(assignmentIdParamsSchema, 'params'),
  mentorController.deleteMentorFromMarathon
);

// GET /api/mentor/marathons - 獲取導師參與的馬拉松列表
router.get(
  '/marathons',
  validateRequest(paginationQuerySchema, 'query'),
  mentorController.getMentorMarathons
);

/**
 * 導師參與者管理路由
 */

// POST /api/mentor/participant - 指定參與者給導師
router.post(
  '/participant',
  validateRequest(assignParticipantToMentorSchema, 'body'),
  mentorController.assignParticipantToMentor
);

// PUT /api/mentor/participant/:participantId - 更新導師參與者關聯（未實作）
router.put(
  '/participant/:participantId',
  validateRequest(participantIdParamsSchema, 'params'),
  mentorController.updateMentorParticipant
);

// DELETE /api/mentor/participant/:participantId - 移除導師參與者關聯
router.delete(
  '/participant/:participantId',
  validateRequest(participantIdParamsSchema, 'params'),
  mentorController.removeMentorParticipant
);

/**
 * 導師資料查詢路由
 */

// GET /api/mentor/marathon/:eventId/participants - 獲取導師在某個馬拉松的參與者列表
router.get(
  '/marathon/:eventId/participants',
  validateRequest(eventIdParamsSchema, 'params'),
  mentorController.getMentorParticipantsByMarathon
);

// GET /api/mentor/marathon/:eventId/reviews - 獲取導師參與者在某個馬拉松的覆盤資料
router.get(
  '/marathon/:eventId/reviews',
  validateRequest(eventIdParamsSchema, 'params'),
  mentorController.getReviewsForMentorParticipants
);

export default router;