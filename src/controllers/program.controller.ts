import type { Request, Response } from 'express';
import { asyncHandler, UnauthorizedError } from '../middleware/error.middleware';
import { programService } from '../services/program.service';
import { createSuccessResponse } from '../utils/response-helper';
import { programListResponseSchema, programResponseSchema, type CreateProgramInput, type UpdateProgramInput } from '../validators/program.validators';
import { programArchiveResultSchema } from '../validators/cohort.validators';

const actor = (req: Request): number => { if (!req.user) throw new UnauthorizedError(); return req.user.id; };
const list = asyncHandler(async (req: Request, res: Response) => { res.json(createSuccessResponse(programListResponseSchema.parse(await programService.list(Number(req.query.organizationId), actor(req))))); });
const create = asyncHandler(async (req: Request, res: Response) => { res.status(201).json(createSuccessResponse(programResponseSchema.parse(await programService.create(req.body as CreateProgramInput, actor(req))))); });
const update = asyncHandler(async (req: Request, res: Response) => { res.json(createSuccessResponse(programResponseSchema.parse(await programService.update(Number(req.params.programId), req.body as UpdateProgramInput, actor(req))))); });
const archive = asyncHandler(async (req: Request, res: Response) => {
  const result = await programService.archive(Number(req.params.programId), actor(req));
  res.json(createSuccessResponse(programArchiveResultSchema.parse(result)));
});
const duplicate = asyncHandler(async (req: Request, res: Response) => {
  res.status(201).json(createSuccessResponse(programResponseSchema.parse(await programService.duplicate(Number(req.params.programId), actor(req)))));
});
export const programController = { list, create, update, archive, duplicate };
