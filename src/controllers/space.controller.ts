import { Request, Response } from 'express';
import { asyncHandler, UnauthorizedError } from '../middleware/error.middleware';
import { spaceService } from '../services/space.service';
import { createSuccessResponse } from '../utils/response-helper';
import type {
  CreateBlockInput,
  CreateHomePageInput,
  MoveBlockInput,
  PublishBlockInput,
  SpaceBlockParam,
  SpaceIdParam,
  SpacePublicTokenParam,
  UpdateBlockInput,
} from '../validators/space.validators';

function requireUserId(req: Request): number {
  if (!req.user?.id) throw new UnauthorizedError('需要登入');
  return req.user.id;
}

export const listMySpaces = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json(createSuccessResponse(await spaceService.listMySpaces(requireUserId(req))));
});

export const getSpaceDetail = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as SpaceIdParam;
  res.status(200).json(createSuccessResponse(await spaceService.getSpaceDetail(requireUserId(req), id)));
});

export const listMembers = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as SpaceIdParam;
  res.status(200).json(createSuccessResponse(await spaceService.listMembers(requireUserId(req), id)));
});

export const listSpacePractices = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as SpaceIdParam;
  res.status(200).json(createSuccessResponse(await spaceService.listSpacePractices(requireUserId(req), id)));
});

export const createHomePage = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as SpaceIdParam;
  res.status(201).json(createSuccessResponse(await spaceService.createHomePage(requireUserId(req), id, req.body as CreateHomePageInput)));
});

export const getHomePage = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as SpaceIdParam;
  res.status(200).json(createSuccessResponse(await spaceService.getHomePage(requireUserId(req), id)));
});

export const publishHomePage = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as SpaceIdParam;
  res.status(200).json(createSuccessResponse(await spaceService.publishHomePage(requireUserId(req), id)));
});

export const createBlock = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as SpaceIdParam;
  res.status(201).json(createSuccessResponse(await spaceService.createBlock(requireUserId(req), id, req.body as CreateBlockInput)));
});

export const updateBlock = asyncHandler(async (req: Request, res: Response) => {
  const { id, blockId } = req.params as unknown as SpaceBlockParam;
  res.status(200).json(createSuccessResponse(await spaceService.updateBlock(requireUserId(req), id, blockId, req.body as UpdateBlockInput)));
});

export const moveBlock = asyncHandler(async (req: Request, res: Response) => {
  const { id, blockId } = req.params as unknown as SpaceBlockParam;
  const { direction } = req.body as MoveBlockInput;
  res.status(200).json(createSuccessResponse(await spaceService.moveBlock(requireUserId(req), id, blockId, direction)));
});

export const publishBlock = asyncHandler(async (req: Request, res: Response) => {
  const { id, blockId } = req.params as unknown as SpaceBlockParam;
  const { scheduledAt } = req.body as PublishBlockInput;
  res.status(200).json(createSuccessResponse(await spaceService.publishBlock(requireUserId(req), id, blockId, scheduledAt)));
});

export const draftBlock = asyncHandler(async (req: Request, res: Response) => {
  const { id, blockId } = req.params as unknown as SpaceBlockParam;
  res.status(200).json(createSuccessResponse(await spaceService.draftBlock(requireUserId(req), id, blockId)));
});

export const deleteBlock = asyncHandler(async (req: Request, res: Response) => {
  const { id, blockId } = req.params as unknown as SpaceBlockParam;
  await spaceService.deleteBlock(requireUserId(req), id, blockId);
  res.status(200).json(createSuccessResponse({ message: '區塊已刪除' }));
});

export const getPublicSpace = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.params as unknown as SpacePublicTokenParam;
  res.status(200).json(createSuccessResponse(await spaceService.getPublicSpace(token)));
});
