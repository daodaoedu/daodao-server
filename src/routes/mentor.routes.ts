/**
 * Mentor Routes
 * 導師路由配置
 */

import { Router, RequestHandler } from 'express';
import { registry } from '../config/openapi-registry';
import * as mentorController from '../controllers/mentor.controller';
import {
  assignMentorToMarathonSchema,
  updateMentorMarathonSchema,
  assignParticipantToMentorSchema,
  assignmentIdParamsSchema,
  participantIdParamsSchema,
  eventIdParamsSchema,
  paginationQuerySchema,
  assignMentorToMarathonApiResponseSchema,
  updateMentorMarathonApiResponseSchema,
  deleteMentorFromMarathonApiResponseSchema,
  getMentorMarathonsApiResponseSchema,
  assignParticipantToMentorApiResponseSchema,
  updateMentorParticipantApiResponseSchema,
  removeMentorParticipantApiResponseSchema,
  getMentorParticipantsByMarathonApiResponseSchema,
  getReviewsForMentorParticipantsApiResponseSchema
} from '../validators/mentor.validators';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation.middleware';
import { globalLimiter } from '../middleware/rate-limit.middleware';

const router = Router();

// 應用認證中間件到所有路由
router.use(authenticate);

// 應用速率限制中間件
router.use(globalLimiter);

// ============================================================================
// OpenAPI 路由定義（使用 registry.registerPath）
// ============================================================================

/**
 * 導師馬拉松管理路由
 * 注意：這些功能需要 mentor_marathon 表，目前資料庫架構中不存在
 */

/**
 * POST /api/v1/mentor/marathon - 指定導師參與馬拉松
 */
registry.registerPath({
  method: 'post',
  path: '/api/v1/mentor/marathon',
  tags: ['Mentor'],
  summary: '指定導師參與馬拉松',
  description: '將導師指派到特定馬拉松活動',
  request: {
    body: {
      content: {
        'application/json': {
          schema: assignMentorToMarathonSchema
        }
      }
    }
  },
  responses: {
    200: {
      description: '導師成功指派到馬拉松',
      content: {
        'application/json': {
          schema: assignMentorToMarathonApiResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * POST /mentor/marathon
 * 指定導師參與馬拉松
 */
router.post(
  '/marathon',
  validate(assignMentorToMarathonSchema, 'body'),
  mentorController.assignMentorToMarathon as RequestHandler
);

/**
 * PUT /api/v1/mentor/marathon/{assignmentId} - 更新導師馬拉松關聯
 */
registry.registerPath({
  method: 'put',
  path: '/api/v1/mentor/marathon/{assignmentId}',
  tags: ['Mentor'],
  summary: '更新導師馬拉松關聯',
  description: '更新導師與馬拉松活動的關聯資訊',
  request: {
    params: assignmentIdParamsSchema,
    body: {
      content: {
        'application/json': {
          schema: updateMentorMarathonSchema
        }
      }
    }
  },
  responses: {
    200: {
      description: '導師馬拉松關聯更新成功',
      content: {
        'application/json': {
          schema: updateMentorMarathonApiResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * PUT /mentor/marathon/:assignmentId
 * 更新導師馬拉松關聯
 */
router.put(
  '/marathon/:assignmentId',
  validate(assignmentIdParamsSchema, 'params'),
  validate(updateMentorMarathonSchema, 'body'),
  mentorController.updateMentorMarathon as RequestHandler
);

/**
 * DELETE /api/v1/mentor/marathon/{assignmentId} - 刪除導師馬拉松關聯
 */
registry.registerPath({
  method: 'delete',
  path: '/api/v1/mentor/marathon/{assignmentId}',
  tags: ['Mentor'],
  summary: '刪除導師馬拉松關聯',
  description: '移除導師與馬拉松活動的關聯',
  request: {
    params: assignmentIdParamsSchema
  },
  responses: {
    200: {
      description: '導師馬拉松關聯已成功刪除',
      content: {
        'application/json': {
          schema: deleteMentorFromMarathonApiResponseSchema
        }
      }
    },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * DELETE /mentor/marathon/:assignmentId
 * 刪除導師馬拉松關聯
 */
router.delete(
  '/marathon/:assignmentId',
  validate(assignmentIdParamsSchema, 'params'),
  mentorController.deleteMentorFromMarathon as RequestHandler
);

/**
 * GET /api/v1/mentor/marathons - 獲取導師參與的馬拉松列表
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/mentor/marathons',
  tags: ['Mentor'],
  summary: '獲取導師參與的馬拉松列表',
  description: '取得當前導師參與的所有馬拉松活動，支援分頁',
  request: {
    query: paginationQuerySchema
  },
  responses: {
    200: {
      description: '成功獲取馬拉松列表',
      content: {
        'application/json': {
          schema: getMentorMarathonsApiResponseSchema
        }
      }
    },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * GET /mentor/marathons
 * 獲取導師參與的馬拉松列表
 */
router.get(
  '/marathons',
  validate(paginationQuerySchema, 'query'),
  mentorController.getMentorMarathons as RequestHandler
);

/**
 * 導師參與者管理路由
 */

/**
 * POST /api/v1/mentor/participant - 指定參與者給導師
 */
registry.registerPath({
  method: 'post',
  path: '/api/v1/mentor/participant',
  tags: ['Mentor'],
  summary: '指定參與者給導師',
  description: '將參與者指派給當前導師進行輔導',
  request: {
    body: {
      content: {
        'application/json': {
          schema: assignParticipantToMentorSchema
        }
      }
    }
  },
  responses: {
    200: {
      description: '參與者成功指派給導師',
      content: {
        'application/json': {
          schema: assignParticipantToMentorApiResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * POST /mentor/participant
 * 指定參與者給導師
 */
router.post(
  '/participant',
  validate(assignParticipantToMentorSchema, 'body'),
  mentorController.assignParticipantToMentor as RequestHandler
);

/**
 * PUT /api/v1/mentor/participant/{participantId} - 更新導師參與者關聯
 */
registry.registerPath({
  method: 'put',
  path: '/api/v1/mentor/participant/{participantId}',
  tags: ['Mentor'],
  summary: '更新導師參與者關聯',
  description: '更新導師與參與者的關聯資訊（目前未實作）',
  request: {
    params: participantIdParamsSchema
  },
  responses: {
    200: {
      description: '導師參與者關聯更新成功',
      content: {
        'application/json': {
          schema: updateMentorParticipantApiResponseSchema
        }
      }
    },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' },
    501: {
      description: '功能未實作',
      content: {
        'application/json': {
          schema: updateMentorParticipantApiResponseSchema
        }
      }
    }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * PUT /mentor/participant/:participantId
 * 更新導師參與者關聯（未實作）
 */
router.put(
  '/participant/:participantId',
  validate(participantIdParamsSchema, 'params'),
  mentorController.updateMentorParticipant as RequestHandler
);

/**
 * DELETE /api/v1/mentor/participant/{participantId} - 移除導師參與者關聯
 */
registry.registerPath({
  method: 'delete',
  path: '/api/v1/mentor/participant/{participantId}',
  tags: ['Mentor'],
  summary: '移除導師參與者關聯',
  description: '移除導師與參與者的輔導關係',
  request: {
    params: participantIdParamsSchema
  },
  responses: {
    200: {
      description: '導師參與者關聯已成功移除',
      content: {
        'application/json': {
          schema: removeMentorParticipantApiResponseSchema
        }
      }
    },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * DELETE /mentor/participant/:participantId
 * 移除導師參與者關聯
 */
router.delete(
  '/participant/:participantId',
  validate(participantIdParamsSchema, 'params'),
  mentorController.removeMentorParticipant as RequestHandler
);

/**
 * 導師資料查詢路由
 */

/**
 * GET /api/v1/mentor/marathon/{eventId}/participants - 獲取導師在某個馬拉松的參與者列表
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/mentor/marathon/{eventId}/participants',
  tags: ['Mentor'],
  summary: '獲取導師在馬拉松的參與者列表',
  description: '取得導師在指定馬拉松活動中輔導的所有參與者',
  request: {
    params: eventIdParamsSchema
  },
  responses: {
    200: {
      description: '成功獲取參與者列表',
      content: {
        'application/json': {
          schema: getMentorParticipantsByMarathonApiResponseSchema
        }
      }
    },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * GET /mentor/marathon/:eventId/participants
 * 獲取導師在某個馬拉松的參與者列表
 */
router.get(
  '/marathon/:eventId/participants',
  validate(eventIdParamsSchema, 'params'),
  mentorController.getMentorParticipantsByMarathon as RequestHandler
);

/**
 * GET /api/v1/mentor/marathon/{eventId}/reviews - 獲取導師參與者在馬拉松的覆盤資料
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/mentor/marathon/{eventId}/reviews',
  tags: ['Mentor'],
  summary: '獲取導師參與者的覆盤資料',
  description: '取得導師在指定馬拉松活動中參與者的所有覆盤記錄',
  request: {
    params: eventIdParamsSchema
  },
  responses: {
    200: {
      description: '成功獲取覆盤資料',
      content: {
        'application/json': {
          schema: getReviewsForMentorParticipantsApiResponseSchema
        }
      }
    },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * GET /mentor/marathon/:eventId/reviews
 * 獲取導師參與者在某個馬拉松的覆盤資料
 */
router.get(
  '/marathon/:eventId/reviews',
  validate(eventIdParamsSchema, 'params'),
  mentorController.getReviewsForMentorParticipants as RequestHandler
);

// ============================================================================
// Express 路由定義完成
// ============================================================================

export default router;