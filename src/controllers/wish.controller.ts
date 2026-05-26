/**
 * Wish Controller
 *
 * 使用者許願提交（authenticate）。
 */

import { Request, Response } from 'express';
import { asyncHandler, UnauthorizedError } from '../middleware/error.middleware';
import { wishService } from '../services/wish.service';
import { CreateWishInput } from '../validators/wish.validators';

const createWish = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) throw new UnauthorizedError('請先登入');
  const body = req.body as CreateWishInput;
  const result = await wishService.createWish(body, req.user.id, 'web');
  res.status(201).json(result);
});

export const wishController = {
  createWish,
};
