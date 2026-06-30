import { Request, Response } from 'express';
import { asyncHandler, NotFoundError, BadRequestError, UnauthorizedError } from '@/middleware/error.middleware';
import { surveyService } from '@/services/survey.service';

function parseId(param: string): number {
  const id = parseInt(param, 10);
  if (!Number.isInteger(id) || id <= 0) throw new BadRequestError('無效的問卷 ID');
  return id;
}

export const surveyController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedError('未登入');
    const result = await surveyService.create(userId, req.body);
    res.status(201).json(result);
  }),

  listMine: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedError('未登入');
    const result = await surveyService.listMine(userId);
    res.json(result);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedError('未登入');
    const id = parseId(req.params.id);
    const result = await surveyService.getById(id, userId);
    if (!result) throw new NotFoundError('問卷不存在');
    res.json(result);
  }),

  getPublic: asyncHandler(async (req: Request, res: Response) => {
    const result = await surveyService.getPublic(req.params.externalId);
    if (!result) throw new NotFoundError('問卷不存在或尚未開放');
    res.json(result);
  }),

  updateStatus: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedError('未登入');
    const id = parseId(req.params.id);
    const result = await surveyService.updateStatus(id, userId, req.body);
    if (!result) throw new NotFoundError('問卷不存在');
    res.json(result);
  }),

  submitResponse: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id ?? null;
    const result = await surveyService.submitResponse(req.params.externalId, userId, req.body);
    if (!result) throw new NotFoundError('問卷不存在或尚未開放');
    if (result === 'max_reached') throw new BadRequestError('問卷已達最大回應數');
    if (result === 'invalid_question') throw new BadRequestError('包含無效的問題 ID');
    if (result === 'invalid_answer') throw new BadRequestError('答案格式不符合題型');
    if (result === 'missing_required') throw new BadRequestError('必填題目未作答');
    res.status(201).json(result);
  }),

  getAnalytics: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedError('未登入');
    const id = parseId(req.params.id);
    const result = await surveyService.getAnalytics(id, userId);
    if (!result) throw new NotFoundError('問卷不存在');
    res.json(result);
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedError('未登入');
    const id = parseId(req.params.id);
    const result = await surveyService.delete(id, userId);
    if (!result) throw new NotFoundError('問卷不存在');
    res.status(204).send();
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedError('未登入');
    const id = parseId(req.params.id);
    const result = await surveyService.update(id, userId, req.body);
    if (!result) throw new NotFoundError('問卷不存在');
    res.json(result);
  }),

  listResponses: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedError('未登入');
    const id = parseId(req.params.id);
    const result = await surveyService.listResponses(id, userId);
    if (!result) throw new NotFoundError('問卷不存在');
    res.json(result);
  }),

  generateAnalytics: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedError('未登入');
    const id = parseId(req.params.id);
    const result = await surveyService.getAnalytics(id, userId);
    if (!result) throw new NotFoundError('問卷不存在');
    res.json(result);
  }),

  trackView: asyncHandler(async (req: Request, res: Response) => {
    await surveyService.trackView(req.params.externalId);
    res.status(204).send();
  }),

  trackPartial: asyncHandler(async (req: Request, res: Response) => {
    await surveyService.trackPartial(req.params.externalId, req.body);
    res.status(204).send();
  }),

  getResponse: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedError('未登入');
    const id = parseId(req.params.id);
    const responseId = parseId(req.params.responseId);
    const result = await surveyService.getResponse(id, userId, responseId);
    if (!result) throw new NotFoundError('回應不存在');
    res.json(result);
  }),

  deleteResponse: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedError('未登入');
    const id = parseId(req.params.id);
    const responseId = parseId(req.params.responseId);
    const result = await surveyService.deleteResponse(id, userId, responseId);
    if (!result) throw new NotFoundError('回應不存在');
    res.status(204).send();
  }),
};
