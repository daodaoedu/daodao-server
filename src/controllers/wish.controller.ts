/**
 * Wish Controller
 *
 * 使用者許願提交（authenticate）。
 */

import { Request, Response } from 'express';
import { asyncHandler, UnauthorizedError } from '../middleware/error.middleware';
import { wishService } from '../services/wish.service';
import {
  CreateWishInput,
  PublicWishListQuery,
  WishSupportParam,
} from '../validators/wish.validators';

const createWish = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) throw new UnauthorizedError('請先登入');
  const body = req.body as CreateWishInput;
  const result = await wishService.createWish(body, req.user.id, 'web');
  res.status(201).json(result);
});

const listPublic = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as PublicWishListQuery;
  const result = await wishService.listPublicWishes(query, req.user?.id ?? null);
  res.status(200).json(result);
});

const addSupport = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) throw new UnauthorizedError('請先登入');
  const { externalId } = req.params as unknown as WishSupportParam;
  const result = await wishService.addSupport(externalId, req.user.id);
  res.status(200).json(result);
});

const removeSupport = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) throw new UnauthorizedError('請先登入');
  const { externalId } = req.params as unknown as WishSupportParam;
  const result = await wishService.removeSupport(externalId, req.user.id);
  res.status(200).json(result);
});

export const wishController = {
  createWish,
  listPublic,
  addSupport,
  removeSupport,
};
