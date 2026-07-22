import { z } from 'zod';
export const cohortFeedQuerySchema = z.object({ limit: z.coerce.number().int().min(1).max(100).optional().default(30), offset: z.coerce.number().int().nonnegative().optional().default(0) });

const commentPreviewUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  photoUrl: z.string().nullable(),
  customId: z.string().nullable(),
});

const commentPreviewSchema = z.object({
  id: z.string(),
  content: z.string(),
  createdAt: z.string(),
  user: commentPreviewUserSchema.optional(),
});

const cohortFeedItemSchema = z.object({
  id: z.string(),
  checkinDate: z.string(),
  mood: z.string().nullable(),
  note: z.string(),
  tags: z.array(z.string()),
  imageUrls: z.array(z.string()),
  createdAt: z.string(),
  practice: z.object({ id: z.string(), title: z.string() }),
  user: z.object({
    id: z.string(),
    name: z.string(),
    photoUrl: z.string().nullable(),
    customId: z.string().nullable(),
  }).optional(),
  commentCount: z.number().int().nonnegative(),
  commentPreview: z.array(commentPreviewSchema),
});

export const cohortFeedResponseSchema = z.object({
  perspective: z.enum(['coach', 'learner']),
  items: z.array(cohortFeedItemSchema),
  total: z.number().int().nonnegative(),
  pendingResponseCount: z.number().int().nonnegative(),
});
