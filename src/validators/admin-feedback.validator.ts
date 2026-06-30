import { z } from 'zod'

export const feedbackQuerySchema = z.object({
  status: z.enum(['pending', 'replied', 'closed']).optional(),
  category: z.enum(['bug', 'feature', 'question', 'other']).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
})

export const feedbackIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export const feedbackReplySchema = z.object({
  content: z.string().min(1),
})

export const feedbackStatusSchema = z.object({
  status: z.enum(['pending', 'replied', 'closed']),
  category: z.enum(['bug', 'feature', 'question', 'other']).optional(),
})

export const createFaqCategorySchema = z.object({
  name: z.string().min(1).max(100),
})

export const createFaqSchema = z.object({
  categoryId: z.coerce.number().int().positive(),
  question: z.string().min(1),
  answer: z.string().min(1),
  isPublished: z.boolean().optional().default(false),
})

export const updateFaqSchema = z.object({
  question: z.string().min(1).optional(),
  answer: z.string().min(1).optional(),
  isPublished: z.boolean().optional(),
})

export const faqIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export const faqReorderSchema = z.object({
  items: z.array(z.object({
    id: z.coerce.number().int().positive(),
    sortOrder: z.coerce.number().int().min(0),
  })),
})

export const faqBulkPublishSchema = z.object({
  ids: z.array(z.coerce.number().int().positive()),
  isPublished: z.boolean(),
})
