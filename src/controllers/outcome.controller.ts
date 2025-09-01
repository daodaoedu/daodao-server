/**
 * Outcome Controller
 * 成果控制器 - 處理成果相關的 HTTP 請求
 */

import { Request, Response } from 'express';
import { outcomeService } from '../services/outcome.service';
import { HTTP_STATUS } from '../constants/index';
import { asyncHandler, UnauthorizedError, BadRequestError } from '../middleware/error.middleware';
import type {
  OutcomeCreateRequest,
  OutcomeUpdateRequest
} from '../types/outcome.types';
import type { UserJwtPayload } from '../types/auth.types';

/**
 * 創建成果
 * POST /api/v1/outcomes/projects/:projectId
 */
export const createOutcome = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user as UserJwtPayload;
  if (!user || typeof user.id !== 'number') {
    throw new UnauthorizedError('未授權存取');
  }

  const { projectId } = req.params;
  const outcomeData: OutcomeCreateRequest = req.body;

  const result = await outcomeService.createOutcome(
    projectId,
    user.id,
    outcomeData
  );
  res.status(HTTP_STATUS.CREATED).json(result);
});

/**
 * 獲取專案的成果列表
 * GET /api/v1/outcomes/projects/:projectId
 */
export const getOutcomes = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { projectId } = req.params;
  const result = await outcomeService.getOutcomes(projectId);
  res.json(result);
});

/**
 * 獲取用戶的成果列表
 * GET /api/v1/outcomes/my
 */
export const getMyOutcomes = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user as UserJwtPayload;
  if (!user || typeof user.id !== 'number') {
    throw new UnauthorizedError('未授權存取');
  }

  const result = await outcomeService.getMyOutcomes(user.id);
  res.json(result);
});

/**
 * 獲取成果詳情
 * GET /api/v1/outcomes/projects/:projectId/:outcomeId
 */
export const getOutcomeDetail = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { projectId, outcomeId } = req.params;
  const outcomeIdNum = parseInt(outcomeId);

  if (isNaN(outcomeIdNum)) {
    throw new BadRequestError('無效的成果ID');
  }

  const result = await outcomeService.getOutcomeDetail(projectId, outcomeIdNum);
  res.json(result);
});

/**
 * 更新成果
 * PUT /api/v1/outcomes/projects/:projectId/:outcomeId
 */
export const updateOutcome = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user as UserJwtPayload;
  if (!user || typeof user.id !== 'number') {
    throw new UnauthorizedError('未授權存取');
  }

  const { projectId, outcomeId } = req.params;
  const outcomeIdNum = parseInt(outcomeId);
  const updateData: OutcomeUpdateRequest = req.body;

  if (isNaN(outcomeIdNum)) {
    throw new BadRequestError('無效的成果ID');
  }

  const result = await outcomeService.updateOutcome(
    projectId,
    outcomeIdNum,
    updateData
  );
  res.json(result);
});

/**
 * 獲取公開成果列表（分頁）
 * GET /api/v1/outcomes/public
 */
export const getPublicOutcomes = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 10;

  const result = await outcomeService.getPublicOutcomes(page, pageSize);
  res.json(result);
});

/**
 * 刪除成果
 * DELETE /api/v1/outcomes/projects/:projectId/:outcomeId
 */
export const deleteOutcome = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user as UserJwtPayload;
  if (!user || typeof user.id !== 'number') {
    throw new UnauthorizedError('未授權存取');
  }

  const { projectId, outcomeId } = req.params;
  const outcomeIdNum = parseInt(outcomeId);

  if (isNaN(outcomeIdNum)) {
    throw new BadRequestError('無效的成果ID');
  }

  const result = await outcomeService.deleteOutcome(projectId, outcomeIdNum);
  res.json(result);
});