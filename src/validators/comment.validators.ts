/**
 * Comment validation schemas
 * Using Zod for comprehensive input validation with proper error messages
 */

import { z } from 'zod';

// Comment target type enum values for validation
const COMMENT_TARGET_TYPES = [
  'post',
  'resource', 
  'note',
  'outcome',
  'review',
  'circle',
  'idea',
  'portfolio'
] as const;

// Comment visibility enum values for validation
const COMMENT_VISIBILITY_OPTIONS = ['public', 'private'] as const;

/**
 * Schema for creating a new comment
 */
export const createCommentSchema = z.object({
  targetType: z.enum(COMMENT_TARGET_TYPES, {
    errorMap: () => ({ message: 'Invalid target type. Must be one of: post, resource, note, outcome, review, circle, idea, portfolio' })
  }),
  targetId: z.string({
    required_error: 'Target ID is required'
  }).trim().min(1, 'Target ID cannot be empty'),
  content: z.string({
    required_error: 'Comment content is required'
  }).trim().min(1, 'Comment content cannot be empty').max(5000, 'Comment content cannot exceed 5000 characters'),
  visibility: z.enum(COMMENT_VISIBILITY_OPTIONS, {
    errorMap: () => ({ message: 'Visibility must be either public or private' })
  }).optional().default('private'),
  parentId: z.coerce.number({
    invalid_type_error: 'Parent ID must be a number'
  }).int('Parent ID must be an integer').positive('Parent ID must be positive').optional()
});

/**
 * Schema for updating an existing comment
 */
export const updateCommentSchema = z.object({
  content: z.string().trim().min(1, 'Comment content cannot be empty').max(5000, 'Comment content cannot exceed 5000 characters').optional(),
  visibility: z.enum(COMMENT_VISIBILITY_OPTIONS, {
    errorMap: () => ({ message: 'Visibility must be either public or private' })
  }).optional()
}).refine(data => data.content !== undefined || data.visibility !== undefined, {
  message: 'At least one field (content or visibility) must be provided for update'
});

/**
 * Schema for comment query parameters (getting comments for a target)
 */
export const getCommentsQuerySchema = z.object({
  targetType: z.enum(COMMENT_TARGET_TYPES, {
    errorMap: () => ({ message: 'Invalid target type. Must be one of: post, resource, note, outcome, review, circle, idea, portfolio' })
  }),
  targetId: z.string({
    required_error: 'Target ID is required'
  }).trim().min(1, 'Target ID cannot be empty')
});

/**
 * Schema for comment URL parameters (comment ID)
 */
export const commentParamsSchema = z.object({
  commentId: z.coerce.number({
    invalid_type_error: 'Comment ID must be a number'
  }).int('Comment ID must be an integer').positive('Comment ID must be positive')
});

/**
 * Schema for bulk comment operations (future use)
 */
export const bulkCommentOperationSchema = z.object({
  commentIds: z.array(z.coerce.number().int().positive(), {
    required_error: 'Comment IDs array is required'
  }).min(1, 'At least one comment ID is required').max(100, 'Cannot operate on more than 100 comments at once'),
  operation: z.enum(['delete', 'update_visibility'], {
    errorMap: () => ({ message: 'Operation must be either delete or update_visibility' })
  }),
  visibility: z.enum(COMMENT_VISIBILITY_OPTIONS).optional()
}).refine(data => {
  if (data.operation === 'update_visibility' && !data.visibility) {
    return false;
  }
  return true;
}, {
  message: 'Visibility is required when operation is update_visibility',
  path: ['visibility']
});

/**
 * Schema for comment search/filter parameters
 */
export const commentFilterSchema = z.object({
  targetType: z.enum(COMMENT_TARGET_TYPES).optional(),
  targetId: z.string().trim().min(1).optional(),
  userId: z.coerce.number().int().positive().optional(),
  visibility: z.enum(COMMENT_VISIBILITY_OPTIONS).optional(),
  hasReplies: z.coerce.boolean().optional(),
  createdAfter: z.string().datetime('Invalid datetime format').optional(),
  createdBefore: z.string().datetime('Invalid datetime format').optional(),
  content: z.string().min(1).max(100, 'Search content cannot exceed 100 characters').optional()
});

/**
 * Schema for comment pagination parameters
 */
export const commentPaginationSchema = z.object({
  cursor: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').optional().default(20),
  sort: z.enum(['created_at', 'updated_at'], {
    errorMap: () => ({ message: 'Sort field must be either created_at or updated_at' })
  }).optional().default('created_at'),
  order: z.enum(['asc', 'desc'], {
    errorMap: () => ({ message: 'Order must be either asc or desc' })
  }).optional().default('desc')
});

// Type inference from schemas
export type CreateCommentSchema = z.infer<typeof createCommentSchema>;
export type UpdateCommentSchema = z.infer<typeof updateCommentSchema>;
export type GetCommentsQuerySchema = z.infer<typeof getCommentsQuerySchema>;
export type CommentParamsSchema = z.infer<typeof commentParamsSchema>;
export type BulkCommentOperationSchema = z.infer<typeof bulkCommentOperationSchema>;
export type CommentFilterSchema = z.infer<typeof commentFilterSchema>;
export type CommentPaginationSchema = z.infer<typeof commentPaginationSchema>;

// Validation functions for direct use
export const validateCreateComment = (data: unknown): CreateCommentSchema => createCommentSchema.parse(data);
export const validateUpdateComment = (data: unknown): UpdateCommentSchema => updateCommentSchema.parse(data);
export const validateGetCommentsQuery = (data: unknown): GetCommentsQuerySchema => getCommentsQuerySchema.parse(data);
export const validateCommentParams = (data: unknown): CommentParamsSchema => commentParamsSchema.parse(data);
export const validateBulkCommentOperation = (data: unknown): BulkCommentOperationSchema => bulkCommentOperationSchema.parse(data);
export const validateCommentFilter = (data: unknown): CommentFilterSchema => commentFilterSchema.parse(data);
export const validateCommentPagination = (data: unknown): CommentPaginationSchema => commentPaginationSchema.parse(data);

// Unified export object following codebase patterns
export const commentValidators = {
  createCommentSchema,
  updateCommentSchema,
  getCommentsQuerySchema,
  commentParamsSchema,
  bulkCommentOperationSchema,
  commentFilterSchema,
  commentPaginationSchema
};

export default commentValidators;