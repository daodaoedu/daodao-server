/**
 * Note Routes
 * 便利貼路由配置
 */

import { Router } from 'express';
import {
  createNote,
  getNotes,
  getMyNotes,
  getNoteDetail,
  updateNote,
  getPublicNotes,
  deleteNote
} from '../controllers/note.controller';
import { authenticate, optionalAuth } from '../middleware/auth';
import { validateRequest } from '../middleware/validator';
import {
  createNoteSchema,
  updateNoteSchema,
  noteParamsSchema,
  noteProjectParamsSchema,
  publicNotesQuerySchema
} from '../validators/note.validators';

const router = Router();

/**
 * 便利貼相關路由
 */

// 獲取公開便利貼列表（分頁）
router.get(
  '/public',
  validateRequest(publicNotesQuerySchema, 'query'),
  getPublicNotes
);

// 獲取用戶的便利貼列表
router.get(
  '/my',
  authenticate,
  getMyNotes
);

// 專案相關便利貼路由
// 創建便利貼
router.post(
  '/projects/:projectId',
  authenticate,
  validateRequest(noteProjectParamsSchema, 'params'),
  validateRequest(createNoteSchema, 'body'),
  createNote
);

// 獲取專案的便利貼列表
router.get(
  '/projects/:projectId',
  optionalAuth,
  validateRequest(noteProjectParamsSchema, 'params'),
  getNotes
);

// 獲取便利貼詳情
router.get(
  '/projects/:projectId/:noteId',
  optionalAuth,
  validateRequest(noteParamsSchema, 'params'),
  getNoteDetail
);

// 更新便利貼
router.put(
  '/projects/:projectId/:noteId',
  authenticate,
  validateRequest(noteParamsSchema, 'params'),
  validateRequest(updateNoteSchema, 'body'),
  updateNote
);

// 刪除便利貼
router.delete(
  '/projects/:projectId/:noteId',
  authenticate,
  validateRequest(noteParamsSchema, 'params'),
  deleteNote
);

export default router;