/**
 * 我的 API 路由
 * 處理使用者個人相關的路由定義
 */

import { Router, RequestHandler } from 'express';
import { authenticate } from '@/middleware/auth';
import { validate } from '@/validators/validation.middleware';
import { ideaQuerySchema } from '@/validators/idea.validators';
import ideaController from '@/controllers/idea-controller';

const router = Router();

/**
 * GET /me/ideas
 * 獲取我的想法列表
 * 查詢參數：page, limit, query, tags, status, sort, order
 * 需要身份驗證
 */
router.get('/ideas',
  authenticate,
  validate(ideaQuerySchema, 'query'),
  ideaController.getMyIdeas as RequestHandler
);

export default router;