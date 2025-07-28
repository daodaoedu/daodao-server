/**
 * Comment Routes
 * Handles comment-related route definitions with middleware integration
 * 
 * This module defines all comment API endpoints following the existing
 * JavaScript API structure while integrating with TypeScript middleware
 * patterns for authentication and validation.
 */

import { Router } from 'express';
import { commentController } from '../controllers/comment.controller';
import { authenticate, optionalAuth } from '../middleware/auth';
import { validate } from '../validators/validation.middleware';
import {
  createCommentSchema,
  updateCommentSchema,
  getCommentsQuerySchema,
  commentParamsSchema
} from '../validators/comment.validators';

const router = Router();

/**
 * POST /comments
 * Create a new comment (supports parentId for replies)
 * 
 * Request body: CreateCommentRequest
 * - targetType: string (post, resource, note, outcome, review, circle, idea, portfolio)
 * - targetId: number
 * - content: string (1-5000 characters)
 * - visibility?: string (public, private) - defaults to private
 * - parentId?: number (for reply comments)
 * 
 * Requires authentication
 */
router.post('/',
  authenticate,
  validate(createCommentSchema, 'body'),
  commentController.createComment
);

/**
 * GET /comments
 * Get all comments for a specific target entity (returns tree structure)
 * 
 * Query parameters:
 * - targetType: string (required) - type of target entity
 * - targetId: number (required) - ID of target entity
 * 
 * Supports optional authentication for personalized visibility
 */
router.get('/',
  optionalAuth,
  validate(getCommentsQuerySchema, 'query'),
  commentController.getComments
);

/**
 * GET /comments/:commentId
 * Get detailed information for a specific comment
 * 
 * Path parameters:
 * - commentId: number (required) - ID of the comment
 * 
 * Supports optional authentication for personalized visibility
 */
router.get('/:commentId',
  optionalAuth,
  validate(commentParamsSchema, 'params'),
  commentController.getCommentDetail
);

/**
 * PUT /comments/:commentId
 * Update an existing comment
 * 
 * Path parameters:
 * - commentId: number (required) - ID of the comment to update
 * 
 * Request body: UpdateCommentRequest
 * - content?: string (1-5000 characters)
 * - visibility?: string (public, private)
 * 
 * At least one field must be provided for update.
 * Requires authentication and ownership/permission validation
 */
router.put('/:commentId',
  authenticate,
  validate(commentParamsSchema, 'params'),
  validate(updateCommentSchema, 'body'),
  commentController.updateComment
);

/**
 * DELETE /comments/:commentId
 * Delete a comment
 * 
 * Path parameters:
 * - commentId: number (required) - ID of the comment to delete
 * 
 * Requires authentication and ownership/permission validation
 */
router.delete('/:commentId',
  authenticate,
  validate(commentParamsSchema, 'params'),
  commentController.deleteComment
);

export default router;