/**
 * Comment Controller - TypeScript implementation
 * 
 * This controller handles all comment-related HTTP requests including:
 * - Creating new comments
 * - Retrieving comments for target entities
 * - Getting individual comment details
 * - Updating existing comments
 * - Deleting comments
 * 
 * All endpoints include proper error handling, authentication integration,
 * and response formatting following existing API patterns.
 */

import { Request, Response } from 'express';
import { commentService } from '../services/comment.service';
import {
  CommentControllerInterface
} from '../types/comment.types';
import {
  UnauthorizedError
} from '../middleware/error.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import {
  validateCreateComment,
  validateUpdateComment,
  validateGetCommentsQuery,
  validateCommentParams,
  createCommentApiResponseSchema,
  getCommentsApiResponseSchema,
  getCommentDetailApiResponseSchema,
  updateCommentApiResponseSchema,
  deleteCommentApiResponseSchema
} from '../validators/comment.validators';

/**
 * Comment Controller Class
 * Implements all comment-related HTTP endpoint handlers
 */
export class CommentController implements CommentControllerInterface {

  /**
   * Create a new comment
   * POST /api/v1/comments
   * 
   * @param req - Authenticated request with comment data
   * @param res - Response object
   */
  async createComment(req: Request, res: Response): Promise<void> {
    // Validate authentication
    if (!req.user || !req.user.id) {
      throw new UnauthorizedError('Authentication required to create comments');
    }

    // Validate request body
    const validatedData = validateCreateComment(req.body);
    
    const createParams = {
      targetType: validatedData.targetType,
      targetId: validatedData.targetId,
      content: validatedData.content,
      visibility: validatedData.visibility,
      parentId: validatedData.parentId,
      userId: req.user.id
    };

    // Create comment through service
    const result = await commentService.createComment(createParams);

    // Validate and send success response
    const validatedResponse = createCommentApiResponseSchema.parse(result);
    res.status(201).json(validatedResponse);
  }

  /**
   * Get comments for a specific target entity
   * GET /api/v1/comments?targetType=post&targetId=123
   * 
   * @param req - Request with query parameters
   * @param res - Response object
   */
  async getComments(req: Request, res: Response): Promise<void> {
    // Validate query parameters
    const validatedQuery = validateGetCommentsQuery(req.query);
    
    // Extract current user from request (may be null for anonymous users)
    const currentUser = req.user ? {
      id: req.user.id || 0,
      role: req.user.roles?.[0] || ''
    } : null;

    const getParams = {
      targetType: validatedQuery.targetType,
      targetId: validatedQuery.targetId,
      currentUser
    };

    // Get comments through service
    const result = await commentService.getComments(getParams);

    // Validate and send success response
    const validatedResponse = getCommentsApiResponseSchema.parse(result);
    res.json(validatedResponse);
  }

  /**
   * Get details of a specific comment
   * GET /api/v1/comments/:commentId
   * 
   * @param req - Request with comment ID parameter
   * @param res - Response object
   */
  async getCommentDetail(req: Request, res: Response): Promise<void> {
    // Validate URL parameters
    const validatedParams = validateCommentParams(req.params);
    
    // Extract current user from request (may be null for anonymous users)
    const currentUser = req.user ? {
      id: req.user.id || 0,
      role: req.user.roles?.[0] || ''
    } : null;

    // Get comment detail through service
    const result = await commentService.getCommentDetail(
      validatedParams.commentId,
      currentUser
    );

    // Validate and send success response
    const validatedResponse = getCommentDetailApiResponseSchema.parse(result);
    res.json(validatedResponse);
  }

  /**
   * Update an existing comment
   * PUT /api/v1/comments/:commentId
   * 
   * @param req - Authenticated request with comment ID and update data
   * @param res - Response object
   */
  async updateComment(req: Request, res: Response): Promise<void> {
    // Validate authentication
    if (!req.user || !req.user.id) {
      throw new UnauthorizedError('Authentication required to update comments');
    }

    // Validate URL parameters
    const validatedParams = validateCommentParams(req.params);
    
    // Validate request body
    const validatedData = validateUpdateComment(req.body);

    const updateParams = {
      commentId: validatedParams.commentId,
      userId: req.user.id,
      ...validatedData
    };

    // Update comment through service
    const result = await commentService.updateComment(updateParams);

    // Validate and send success response
    const validatedResponse = updateCommentApiResponseSchema.parse(result);
    res.json(validatedResponse);
  }

  /**
   * Delete a comment
   * DELETE /api/v1/comments/:commentId
   * 
   * @param req - Authenticated request with comment ID
   * @param res - Response object
   */
  async deleteComment(req: Request, res: Response): Promise<void> {
    // Validate authentication
    if (!req.user || !req.user.id) {
      throw new UnauthorizedError('Authentication required to delete comments');
    }

    // Validate URL parameters
    const validatedParams = validateCommentParams(req.params);

    const deleteParams = {
      commentId: validatedParams.commentId,
      userId: req.user.id
    };

    // Delete comment through service
    const result = await commentService.deleteComment(deleteParams);

    // Validate and send success response
    const validatedResponse = deleteCommentApiResponseSchema.parse(result);
    res.json(validatedResponse);
  }
}

// Create controller instance
const commentControllerInstance = new CommentController();

// Export individual controller methods wrapped with asyncHandler
export const createComment = asyncHandler(
  commentControllerInstance.createComment.bind(commentControllerInstance)
);

export const getComments = asyncHandler(
  commentControllerInstance.getComments.bind(commentControllerInstance)
);

export const getCommentDetail = asyncHandler(
  commentControllerInstance.getCommentDetail.bind(commentControllerInstance)
);

export const updateComment = asyncHandler(
  commentControllerInstance.updateComment.bind(commentControllerInstance)
);

export const deleteComment = asyncHandler(
  commentControllerInstance.deleteComment.bind(commentControllerInstance)
);

// Export controller object following existing patterns
export const commentController = {
  createComment,
  getComments,
  getCommentDetail,
  updateComment,
  deleteComment
};

export default commentController;