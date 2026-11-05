import type { Request, Response } from 'express';
import { asyncHandler, UnauthorizedError } from '../middleware/error.middleware';
import { cohortTemplateResourcesService } from '../services/cohort-template-resources.service';
import { createSuccessResponse } from '../utils/response-helper';
import { cohortResourceBindingListSchema, cohortTemplateResourcesResponseSchema, type UpdateCohortTemplateResourcesInput } from '../validators/cohort-template-resources.validators';

/** Get the authenticated actor supplied by authenticateAny. */
const actor = (req: Request): number => { if (!req.user) throw new UnauthorizedError(); return req.user.id; };
/** Read stable source rows for one authorized binding. */
const list = asyncHandler(async (req: Request, res: Response) => {
  const data = await cohortTemplateResourcesService.list(Number(req.params.organizationId), Number(req.params.templateId), Number(req.params.cohortId), actor(req));
  res.json(createSuccessResponse(cohortTemplateResourcesResponseSchema.parse(data)));
});
/** Save the validated full source set. */
const update = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as UpdateCohortTemplateResourcesInput;
  const data = await cohortTemplateResourcesService.update(Number(req.params.organizationId), Number(req.params.templateId), Number(req.params.cohortId), actor(req), body.resources);
  res.json(createSuccessResponse(cohortTemplateResourcesResponseSchema.parse(data)));
});
/** Coach-only entry point that does not require organization membership. */
const myBindings = asyncHandler(async (req: Request, res: Response) => {
  res.json(createSuccessResponse(cohortResourceBindingListSchema.parse(await cohortTemplateResourcesService.myBindings(actor(req)))));
});
export const cohortTemplateResourcesController = { list, update, myBindings };
