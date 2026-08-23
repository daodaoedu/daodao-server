import { z } from 'zod';
import { registry } from '../config/openapi-registry';
import { isValidTimelineCursor } from '../utils/timeline-cursor';

export const timelineQuerySchema = z.object({
  cursor: z.string().refine(isValidTimelineCursor, '游標格式無效').optional().openapi({
    description: '上一頁回傳的不透明複合游標；暫時相容舊版 ISO 時間游標',
    example: 'eyJkYXRlIjoiMjAyNi0wOC0wMVQwODowMDowMC4wMDBaIiwia2V5IjoibGV0dGVyOjU1MGU4NDAwIn0',
  }),
  limit: z.coerce.number().int().min(1).max(100).default(20).openapi({ description: '每頁筆數', example: 20 }),
}).openapi('TimelineQuery');

export const timelineEntrySchema = z.object({
  type: z.enum(['check-in', 'milestone', 'letter', 'learning-dna']),
  title: z.string(),
  description: z.string().nullable(),
  date: z.string(),
  meta: z.record(z.string(), z.union([z.string(), z.number(), z.null()])),
}).openapi('TimelineEntry');

export const timelineApiResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(timelineEntrySchema),
  pagination: z.object({
    cursors: z.object({ start: z.string().nullable(), end: z.string().nullable() }),
    hasMore: z.boolean(),
    count: z.number(),
    limit: z.number(),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
    nextCursor: z.string().nullable(),
    prevCursor: z.string().nullable(),
    totalEstimate: z.number().nullable(),
    parentTotalEstimate: z.number().nullable(),
  }),
  timestamp: z.string(),
}).openapi('TimelineApiResponse');

registry.register('TimelineEntry', timelineEntrySchema);
registry.register('TimelineApiResponse', timelineApiResponseSchema);

export type TimelineQuery = z.infer<typeof timelineQuerySchema>;
