import type { Request, Response } from 'express';
import type { ArchiveItemType } from '../constants/archive-state';
import { asyncHandler, UnauthorizedError } from '../middleware/error.middleware';
import { lighthouseArchiveService } from '../services/lighthouse-archive.service';
import { createSuccessResponse } from '../utils/response-helper';
import { archiveListResponseSchema, archiveRestoreResultSchema } from '../validators/lighthouse-archive.validators';

const actor = (req: Request): number => { if (!req.user) throw new UnauthorizedError(); return req.user.id; };
const org = (req: Request): number => Number(req.params.organizationId);
const type = (req: Request): ArchiveItemType => (req.params.type ?? req.query.type) as ArchiveItemType;
const item = (req: Request): number => Number(req.params.itemId);

const list = asyncHandler(async (req: Request, res: Response) => {
  const items = await lighthouseArchiveService.list(org(req), actor(req), type(req));
  res.json(createSuccessResponse(archiveListResponseSchema.parse({ type: type(req), items })));
});
const restore = asyncHandler(async (req: Request, res: Response) => {
  res.json(createSuccessResponse(archiveRestoreResultSchema.parse(await lighthouseArchiveService.restore(org(req), actor(req), type(req), item(req)))));
});
const remove = asyncHandler(async (req: Request, res: Response) => {
  await lighthouseArchiveService.remove(org(req), actor(req), type(req), item(req));
  res.status(204).send();
});

export const lighthouseArchiveController = { list, restore, remove };
