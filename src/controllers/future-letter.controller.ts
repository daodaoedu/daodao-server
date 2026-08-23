import { Request, Response } from 'express';
import { asyncHandler, UnauthorizedError } from '../middleware/error.middleware';
import { futureLetterService } from '../services/future-letter.service';
import { createPaginatedResponse, createSuccessResponse } from '../utils/response-helper';
import type { CreateFutureLetterInput, FutureLetterIdParam, FutureLetterListQuery, SendFutureLetterInput, UpdateFutureLetterInput } from '../validators/future-letter.validators';

function requireUserId(req: Request): number {
  if (!req.user?.id) throw new UnauthorizedError('需要登入');
  return req.user.id;
}

export const createLetter = asyncHandler(async (req: Request, res: Response) => {
  const letter = await futureLetterService.create(requireUserId(req), req.body as CreateFutureLetterInput);
  res.status(201).json(createSuccessResponse(letter));
});

export const getLetters = asyncHandler(async (req: Request, res: Response) => {
  const page = await futureLetterService.findAllByUser(requireUserId(req), req.query as unknown as FutureLetterListQuery);
  const totalPages = Math.ceil(page.total / page.limit);
  res.status(200).json(createPaginatedResponse(page.items, {
    currentPage: page.page,
    totalPages,
    totalItems: page.total,
    itemsPerPage: page.limit,
    hasNext: page.page < totalPages,
    hasPrev: page.page > 1,
  }));
});

export const getLetter = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as FutureLetterIdParam;
  res.status(200).json(createSuccessResponse(await futureLetterService.findById(requireUserId(req), id)));
});

export const updateLetter = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as FutureLetterIdParam;
  res.status(200).json(createSuccessResponse(await futureLetterService.update(requireUserId(req), id, req.body as UpdateFutureLetterInput)));
});

export const deleteLetter = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as FutureLetterIdParam;
  await futureLetterService.softDelete(requireUserId(req), id);
  res.status(200).json(createSuccessResponse({ message: '信件已刪除' }));
});

export const sendLetter = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as FutureLetterIdParam;
  const { deliverAt } = req.body as SendFutureLetterInput;
  res.status(200).json(createSuccessResponse(await futureLetterService.send(requireUserId(req), id, deliverAt)));
});

export const openLetter = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as FutureLetterIdParam;
  res.status(200).json(createSuccessResponse(await futureLetterService.open(requireUserId(req), id)));
});
