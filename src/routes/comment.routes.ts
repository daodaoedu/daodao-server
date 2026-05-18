/**
 * Comment Routes - 帶 OpenAPI 定義的完整範例
 * Handles comment-related route definitions with middleware integration
 *
 * 展示如何使用 zod-to-openapi 官方推薦的 registry.registerPath() 方法
 * 定義所有留言 API 端點，並整合 TypeScript middleware 模式進行驗證和身份驗證。
 */

import { Router, RequestHandler } from 'express';
import { registry } from '../config/openapi-registry';
import { commentController } from '../controllers/comment.controller';
import { authenticate, optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validation.middleware';
import { withOnboardingHook } from '../middleware/onboarding-hook.middleware';
import { OnboardingTask } from '../types/onboarding.types';
import {
  createCommentSchema,
  updateCommentSchema,
  getCommentsQuerySchema,
  getMentionCandidatesQuerySchema,
  commentParamsSchema,
  createCommentApiResponseSchema,
  getCommentsApiResponseSchema,
  getMentionCandidatesApiResponseSchema,
  getCommentDetailApiResponseSchema,
  updateCommentApiResponseSchema,
  deleteCommentApiResponseSchema
} from '../validators/comment.validators';

const router = Router();

// ============================================================================
// OpenAPI 路由定義（使用 registry.registerPath）
// ============================================================================

/**
 * POST /api/v1/comments - 創建留言
 */
registry.registerPath({
  method: 'post',
  path: '/api/v1/comments',
  tags: ['Comments'],
  summary: '創建留言',
  description: '為指定目標創建新留言（支援 parentId 用於回覆）',
  request: {
    body: {
      content: {
        'application/json': {
          schema: createCommentSchema
        }
      }
    }
  },
  responses: {
    201: {
      description: '留言創建成功',
      content: {
        'application/json': {
          schema: createCommentApiResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    403: { $ref: '#/components/responses/ForbiddenError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  }
});

/**
 * GET /api/v1/comments/mention-candidates - 獲取 @mention 候選人
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/comments/mention-candidates',
  tags: ['Comments'],
  summary: '獲取 @mention 候選人',
  description: '獲取指定目標可供 @mention 的使用者候選清單',
  request: {
    query: getMentionCandidatesQuerySchema
  },
  responses: {
    200: {
      description: '成功獲取 @mention 候選人',
      content: {
        'application/json': {
          schema: getMentionCandidatesApiResponseSchema
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
 * GET /api/v1/comments - 獲取留言列表
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/comments',
  tags: ['Comments'],
  summary: '獲取留言列表',
  description: '獲取指定目標的所有留言（返回樹狀結構）',
  request: {
    query: getCommentsQuerySchema
  },
  responses: {
    200: {
      description: '成功獲取留言列表',
      content: {
        'application/json': {
          schema: getCommentsApiResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  }
});

/**
 * GET /api/v1/comments/{commentId} - 獲取留言詳情
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/comments/{commentId}',
  tags: ['Comments'],
  summary: '獲取留言詳情',
  description: '獲取指定留言的詳細資訊',
  request: {
    params: commentParamsSchema
  },
  responses: {
    200: {
      description: '成功獲取留言詳情',
      content: {
        'application/json': {
          schema: getCommentDetailApiResponseSchema
        }
      }
    },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  }
});

/**
 * PUT /api/v1/comments/{commentId} - 更新留言
 */
registry.registerPath({
  method: 'put',
  path: '/api/v1/comments/{commentId}',
  tags: ['Comments'],
  summary: '更新留言',
  description: '更新已存在的留言內容或可見性',
  request: {
    params: commentParamsSchema,
    body: {
      content: {
        'application/json': {
          schema: updateCommentSchema
        }
      }
    }
  },
  responses: {
    200: {
      description: '留言更新成功',
      content: {
        'application/json': {
          schema: updateCommentApiResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    403: { $ref: '#/components/responses/ForbiddenError' },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * DELETE /api/v1/comments/{commentId} - 刪除留言
 */
registry.registerPath({
  method: 'delete',
  path: '/api/v1/comments/{commentId}',
  tags: ['Comments'],
  summary: '刪除留言',
  description: '刪除指定的留言',
  request: {
    params: commentParamsSchema
  },
  responses: {
    200: {
      description: '留言刪除成功',
      content: {
        'application/json': {
          schema: deleteCommentApiResponseSchema
        }
      }
    },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    403: { $ref: '#/components/responses/ForbiddenError' },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

// ============================================================================
// Express 路由定義
// ============================================================================

router.post('/',
  authenticate,
  validate(createCommentSchema, 'body'),
  withOnboardingHook(OnboardingTask.E, commentController.createComment as RequestHandler) as RequestHandler
);

router.get('/',
  optionalAuth,
  validate(getCommentsQuerySchema, 'query'),
  commentController.getComments as RequestHandler
);

router.get('/mention-candidates',
  optionalAuth,
  validate(getMentionCandidatesQuerySchema, 'query'),
  commentController.getMentionCandidates as RequestHandler
);

router.get('/:commentId',
  optionalAuth,
  validate(commentParamsSchema, 'params'),
  commentController.getCommentDetail as RequestHandler
);

router.put('/:commentId',
  authenticate,
  validate(commentParamsSchema, 'params'),
  validate(updateCommentSchema, 'body'),
  commentController.updateComment as RequestHandler
);

router.delete('/:commentId',
  authenticate,
  validate(commentParamsSchema, 'params'),
  commentController.deleteComment as RequestHandler
);

export default router;
