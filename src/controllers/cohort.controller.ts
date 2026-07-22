import type { Request, Response } from 'express';
import { asyncHandler, UnauthorizedError } from '../middleware/error.middleware';
import { cohortService } from '../services/cohort.service';
import { createSuccessResponse } from '../utils/response-helper';
import { cohortJoinTokenResponseSchema, cohortListResponseSchema, cohortResponseSchema, type CreateCohortInput, type UpdateCohortInput } from '../validators/cohort.validators';

const actor = (req: Request): number => { if (!req.user) throw new UnauthorizedError(); return req.user.id; };
const programId = (req: Request): number => Number(req.params.programId);
const cohortId = (req: Request): number => Number(req.params.cohortId);
const list = asyncHandler(async (req: Request, res: Response) => { res.json(createSuccessResponse(cohortListResponseSchema.parse(await cohortService.list(programId(req), actor(req))))); });
const get = asyncHandler(async (req: Request, res: Response) => { res.json(createSuccessResponse(cohortResponseSchema.parse(await cohortService.get(programId(req), cohortId(req), actor(req))))); });
const create = asyncHandler(async (req: Request, res: Response) => { res.status(201).json(createSuccessResponse(cohortResponseSchema.parse(await cohortService.create(programId(req), req.body as CreateCohortInput, actor(req))))); });
const update = asyncHandler(async (req: Request, res: Response) => { res.json(createSuccessResponse(cohortResponseSchema.parse(await cohortService.update(programId(req), cohortId(req), req.body as UpdateCohortInput, actor(req))))); });
const archive = asyncHandler(async (req: Request, res: Response) => { await cohortService.archive(programId(req), cohortId(req), actor(req)); res.status(204).send(); });
const rotateJoinToken = asyncHandler(async (req: Request, res: Response) => { res.json(createSuccessResponse(cohortJoinTokenResponseSchema.parse(await cohortService.setJoinToken(programId(req), cohortId(req), actor(req), 'rotate')))); });
const pauseJoin = asyncHandler(async (req: Request, res: Response) => { res.json(createSuccessResponse(cohortJoinTokenResponseSchema.parse(await cohortService.setJoinToken(programId(req), cohortId(req), actor(req), 'pause')))); });
export const cohortController = { list, get, create, update, archive, rotateJoinToken, pauseJoin };
