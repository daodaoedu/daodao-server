import { Request, Response } from 'express';
import { asyncHandler, UnauthorizedError } from '../middleware/error.middleware';
import { timelineService } from '../services/timeline.service';
import { createCursorPaginatedResponse } from '../utils/response-helper';
import type { TimelineQuery } from '../validators/timeline.validators';

export const getTimeline = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) throw new UnauthorizedError('需要登入');
  const query = req.query as unknown as TimelineQuery;
  const page = await timelineService.getTimeline(req.user.id, query.cursor, query.limit);
  res.status(200).json(createCursorPaginatedResponse(page.items, {
    cursors: { start: page.items[0]?.date ?? null, end: page.items[page.items.length - 1]?.date ?? null },
    hasMore: page.nextCursor !== null,
    count: page.items.length,
    limit: query.limit,
    hasNext: page.nextCursor !== null,
    hasPrev: Boolean(query.cursor),
    nextCursor: page.nextCursor,
    prevCursor: null,
    totalEstimate: null,
    parentTotalEstimate: null,
  }));
});
