/**
 * Note Controller
 * 便利貼控制器 - 處理便利貼相關的 HTTP 請求
 */

import { Request, Response } from 'express';
import { noteService } from '../services/note.service';
import { HTTP_STATUS } from '../constants/index';
import { asyncHandler, UnauthorizedError, BadRequestError } from '../middleware/error.middleware';
import type {
  NoteCreateRequest,
  NoteUpdateRequest
} from '../types/note.types';
import type { UserJwtPayload } from '../types/auth.types';
import {
  singleNoteResponseSchema,
  noteListResponseSchema,
  deleteNoteResponseSchema
} from '../validators/note.validators';

/**
 * 創建便利貼
 * POST /api/v1/projects/:projectId/notes
 */
export const createNote = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user as UserJwtPayload;
  if (!user || typeof user.id !== 'number') {
    throw new UnauthorizedError('未授權存取');
  }

  const { projectId } = req.params;
  const noteData: NoteCreateRequest = req.body;
  
  const result = await noteService.createNote(
    projectId,
    user.id,
    noteData
  );

  // 驗證響應格式
  const validatedResponse = singleNoteResponseSchema.parse(result);

  res.status(HTTP_STATUS.CREATED).json(validatedResponse);
});

/**
 * 獲取專案的便利貼列表
 * GET /api/v1/projects/:projectId/notes
 */
export const getNotes = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { projectId } = req.params;
  const result = await noteService.getNotes(projectId);

  // 驗證響應格式
  const validatedResponse = noteListResponseSchema.parse(result);

  res.json(validatedResponse);
});

/**
 * 獲取用戶的便利貼列表
 * GET /api/v1/notes/my
 */
export const getMyNotes = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user as UserJwtPayload;
  if (!user || typeof user.id !== 'number') {
    throw new UnauthorizedError('未授權存取');
  }

  const result = await noteService.getMyNotes(user.id);

  // 驗證響應格式
  const validatedResponse = noteListResponseSchema.parse(result);

  res.json(validatedResponse);
});

/**
 * 獲取便利貼詳情
 * GET /api/v1/projects/:projectId/notes/:noteId
 */
export const getNoteDetail = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { projectId, noteId } = req.params;
  const noteIdNum = parseInt(noteId);

  if (isNaN(noteIdNum)) {
    throw new BadRequestError('無效的便利貼ID');
  }

  const result = await noteService.getNoteDetail(projectId, noteIdNum);

  // 驗證響應格式
  const validatedResponse = singleNoteResponseSchema.parse(result);

  res.json(validatedResponse);
});

/**
 * 更新便利貼
 * PUT /api/v1/projects/:projectId/notes/:noteId
 */
export const updateNote = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user as UserJwtPayload;
  if (!user || typeof user.id !== 'number') {
    throw new UnauthorizedError('未授權存取');
  }

  const { projectId, noteId } = req.params;
  const noteIdNum = parseInt(noteId);
  const updateData: NoteUpdateRequest = req.body;

  if (isNaN(noteIdNum)) {
    throw new BadRequestError('無效的便利貼ID');
  }

  const result = await noteService.updateNote(
    projectId,
    noteIdNum,
    updateData,
    user.id
  );

  // 驗證響應格式
  const validatedResponse = singleNoteResponseSchema.parse(result);

  res.json(validatedResponse);
});

/**
 * 獲取公開便利貼列表（分頁）
 * GET /api/v1/notes/public
 */
export const getPublicNotes = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 10;

  const result = await noteService.getPublicNotes(page, pageSize);

  // 驗證響應格式
  const validatedResponse = noteListResponseSchema.parse(result);

  res.json(validatedResponse);
});

/**
 * 刪除便利貼
 * DELETE /api/v1/projects/:projectId/notes/:noteId
 */
export const deleteNote = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user as UserJwtPayload;
  if (!user || typeof user.id !== 'number') {
    throw new UnauthorizedError('未授權存取');
  }

  const { projectId, noteId } = req.params;
  const noteIdNum = parseInt(noteId);

  if (isNaN(noteIdNum)) {
    throw new BadRequestError('無效的便利貼ID');
  }

  const result = await noteService.deleteNote(projectId, noteIdNum, user.id);

  // 驗證響應格式
  const validatedResponse = deleteNoteResponseSchema.parse(result);

  res.json(validatedResponse);
});