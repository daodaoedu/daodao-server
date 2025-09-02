/**
 * 想法路由
 * 處理想法相關的路由定義
 */

import { Router, RequestHandler } from 'express';
import { authenticate, optionalAuth } from '@/middleware/auth';
import { validate } from '@/middleware/validation.middleware';
import {
  createIdeaSchema,
  updateIdeaSchema,
  ideaQuerySchema,
  ideaParamsSchema
} from '@/validators/idea.validators';
import ideaController from '@/controllers/idea.controller';

const router = Router();

/**
 * GET /ideas
 * 獲取想法列表
 * 查詢參數：page, limit, query, tags, userId, status, sort, order
 * 支援可選身份驗證（用於個人化內容）
 */
router.get('/',
  optionalAuth,
  validate(ideaQuerySchema, 'query'),
  ideaController.getIdeas as RequestHandler
);

/**
 * GET /ideas/:id
 * 獲取想法詳情
 * 路徑參數：id - 想法 ID
 * 支援可選身份驗證（用於個人化內容）
 */
router.get('/:id',
  optionalAuth,
  validate(ideaParamsSchema, 'params'),
  ideaController.getIdeaById as RequestHandler
);

/**
 * POST /ideas
 * 創建新想法
 * 請求體：CreateIdeaRequest (包含可選的關聯資源)
 * 需要身份驗證
 */
router.post('/',
  authenticate,
  validate(createIdeaSchema, 'body'),
  ideaController.createIdea as RequestHandler
);

/**
 * PATCH /ideas/:id
 * 更新想法
 * 路徑參數：id - 想法 ID
 * 請求體：UpdateIdeaRequest
 * 需要身份驗證和權限檢查（想法作者）
 */
router.patch('/:id',
  authenticate,
  validate(ideaParamsSchema, 'params'),
  validate(updateIdeaSchema, 'body'),
  ideaController.updateIdea as RequestHandler
);

/**
 * DELETE /ideas/:id
 * 刪除想法（軟刪除）
 * 路徑參數：id - 想法 ID
 * 需要身份驗證和權限檢查（想法作者）
 */
router.delete('/:id',
  authenticate,
  validate(ideaParamsSchema, 'params'),
  ideaController.deleteIdea as RequestHandler
);

export default router;