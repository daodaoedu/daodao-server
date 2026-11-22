import { Request, Response } from 'express';
import { asyncHandler, BadRequestError, UnauthorizedError } from '@/middleware/error.middleware';
import { createSuccessResponse } from '@/utils/response-helper';
import { managedSurveyService } from '@/services/managed-survey.service';

export const managedSurveyImageController = {
  list: asyncHandler(async (req: Request, res: Response) => { const userId = req.user?.id; if (!userId) throw new UnauthorizedError('未登入'); res.json(createSuccessResponse(await managedSurveyService.images(userId))); }),
  upload: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id; if (!userId) throw new UnauthorizedError('未登入');
    if (!req.file) throw new BadRequestError('請選擇圖片');
    res.status(201).json(createSuccessResponse(await managedSurveyService.uploadImage(userId, req.file)));
  }),
  remove: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id; if (!userId) throw new UnauthorizedError('未登入');
    const id = Number(req.params.imageId);
    if (!Number.isSafeInteger(id) || id <= 0) throw new BadRequestError('無效的圖片ID');
    await managedSurveyService.removeImage(userId, id); res.status(204).send();
  }),
};
