/**
 * Comment Controller Unit Tests
 * 
 * Comprehensive unit tests for the comment controller layer including:
 * - Request/response handling and validation
 * - Authentication and authorization scenarios
 * - Error response formatting and status codes
 * - Service layer mocking and integration
 */

import { Request, Response } from 'express';
import { CommentController } from '@/controllers/comment.controller';
import { commentService } from '@/services/comment.service';
import { AuthRequest } from '@/types/auth.types';
import {
  CommentResponse,
  CommentTargetType,
  CommentVisibility,
  CommentUser
} from '@/types/comment.types';
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  UnauthorizedError,
  InternalServerError
} from '@/utils/error-handler';
import {
  validateCreateComment,
  validateUpdateComment,
  validateGetCommentsQuery,
  validateCommentParams
} from '@/validators/comment.validators';

// Mock the comment service
jest.mock('@/services/comment.service');

// Mock the validators
jest.mock('@/validators/comment.validators');

describe('CommentController', () => {
  let controller: CommentController;
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let mockCommentService: jest.Mocked<typeof commentService>;
  let mockValidateCreateComment: jest.MockedFunction<typeof validateCreateComment>;
  let mockValidateUpdateComment: jest.MockedFunction<typeof validateUpdateComment>;
  let mockValidateGetCommentsQuery: jest.MockedFunction<typeof validateGetCommentsQuery>;
  let mockValidateCommentParams: jest.MockedFunction<typeof validateCommentParams>;

  // Mock data
  const mockUser: CommentUser = {
    id: 1,
    name: 'Test User',
    _id: 'test-user-123',
    roleList: ['Developer'],
    photoURL: 'https://example.com/photo.jpg'
  };

  const mockCommentResponse: CommentResponse = {
    id: 1,
    userId: 1,
    content: 'Test comment content',
    visibility: 'public' as CommentVisibility,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    parent_id: null,
    user: mockUser,
    replies: []
  };

  const mockAuthUser = {
    id: 1,
    username: 'testuser',
    roles: ['user'],
    permissions: ['comment:create', 'comment:read']
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create controller instance
    controller = new CommentController();

    // Mock request and response objects
    mockRequest = {
      body: {},
      query: {} as any,
      params: {} as any,
      user: mockAuthUser
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    // Get mocked service
    mockCommentService = commentService as jest.Mocked<typeof commentService>;

    // Get mocked validators
    mockValidateCreateComment = validateCreateComment as jest.MockedFunction<typeof validateCreateComment>;
    mockValidateUpdateComment = validateUpdateComment as jest.MockedFunction<typeof validateUpdateComment>;
    mockValidateGetCommentsQuery = validateGetCommentsQuery as jest.MockedFunction<typeof validateGetCommentsQuery>;
    mockValidateCommentParams = validateCommentParams as jest.MockedFunction<typeof validateCommentParams>;
  });

  describe('createComment', () => {
    const validCreateData = {
      targetType: 'post' as CommentTargetType,
      targetId: '123',
      content: 'Test comment content',
      visibility: 'public' as CommentVisibility,
      parentId: undefined
    };

    beforeEach(() => {
      mockRequest.body = validCreateData;
      mockValidateCreateComment.mockReturnValue(validCreateData);
      mockCommentService.createComment.mockResolvedValue(mockCommentResponse);
    });

    it('should successfully create a comment with valid data', async () => {
      await controller.createComment(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockValidateCreateComment).toHaveBeenCalledWith(validCreateData);
      expect(mockCommentService.createComment).toHaveBeenCalledWith({
        targetType: 'post',
        targetId: '123',
        content: 'Test comment content',
        visibility: 'public',
        parentId: undefined,
        userId: 1
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Comment created successfully',
        data: mockCommentResponse
      });
    });

    it('should create a comment with default visibility when not provided', async () => {
      const dataWithoutVisibility = { 
        targetType: validCreateData.targetType,
        targetId: validCreateData.targetId,
        content: validCreateData.content,
        parentId: validCreateData.parentId
      };
      mockRequest.body = dataWithoutVisibility;
      mockValidateCreateComment.mockReturnValue({ ...validCreateData, visibility: 'private' });

      await controller.createComment(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockCommentService.createComment).toHaveBeenCalledWith({
        targetType: 'post',
        targetId: '123',
        content: 'Test comment content',
        visibility: 'private',
        parentId: undefined,
        userId: 1
      });
    });

    it('should create a reply comment with parentId', async () => {
      const replyData = { ...validCreateData, parentId: 456 };
      mockRequest.body = replyData;
      mockValidateCreateComment.mockReturnValue(replyData);

      await controller.createComment(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockCommentService.createComment).toHaveBeenCalledWith({
        targetType: 'post',
        targetId: '123',
        content: 'Test comment content',
        visibility: 'public',
        parentId: 456,
        userId: 1
      });
    });

    it('should throw UnauthorizedError when user is not authenticated', async () => {
      mockRequest.user = undefined;

      await expect(
        controller.createComment(mockRequest as AuthRequest, mockResponse as Response)
      ).rejects.toThrow(UnauthorizedError);
      
      expect(mockValidateCreateComment).not.toHaveBeenCalled();
      expect(mockCommentService.createComment).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedError when user ID is missing', async () => {
      mockRequest.user = { ...mockAuthUser, id: undefined as any };

      await expect(
        controller.createComment(mockRequest as AuthRequest, mockResponse as Response)
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should handle validation errors from validateCreateComment', async () => {
      const validationError = new Error('Invalid target type');
      mockValidateCreateComment.mockImplementation(() => {
        throw validationError;
      });

      await expect(
        controller.createComment(mockRequest as AuthRequest, mockResponse as Response)
      ).rejects.toThrow(validationError);
      
      expect(mockCommentService.createComment).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      const serviceError = new NotFoundError('Target entity not found');
      mockCommentService.createComment.mockRejectedValue(serviceError);

      await expect(
        controller.createComment(mockRequest as AuthRequest, mockResponse as Response)
      ).rejects.toThrow(serviceError);
    });

    it('should handle different target types', async () => {
      const resourceData = { ...validCreateData, targetType: 'resource' as CommentTargetType };
      mockRequest.body = resourceData;
      mockValidateCreateComment.mockReturnValue(resourceData);

      await controller.createComment(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockCommentService.createComment).toHaveBeenCalledWith({
        targetType: 'resource',
        targetId: '123',
        content: 'Test comment content',
        visibility: 'public',
        parentId: undefined,
        userId: 1
      });
    });
  });

  describe('getComments', () => {
    const validQueryData = {
      targetType: 'post' as CommentTargetType,
      targetId: '123'
    };

    const mockCommentsArray = [mockCommentResponse];

    beforeEach(() => {
      mockRequest.query = { targetType: 'post', targetId: '123' } as any;
      mockValidateGetCommentsQuery.mockReturnValue(validQueryData);
      mockCommentService.getComments.mockResolvedValue(mockCommentsArray);
    });

    it('should successfully get comments for authenticated user', async () => {
      await controller.getComments(mockRequest as Request, mockResponse as Response);

      expect(mockValidateGetCommentsQuery).toHaveBeenCalledWith({ targetType: 'post', targetId: '123' });
      expect(mockCommentService.getComments).toHaveBeenCalledWith({
        targetType: 'post',
        targetId: '123',
        currentUser: {
          id: 1,
          role: 'user'
        }
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockCommentsArray
      });
    });

    it('should successfully get comments for anonymous user', async () => {
      mockRequest.user = undefined;

      await controller.getComments(mockRequest as Request, mockResponse as Response);

      expect(mockCommentService.getComments).toHaveBeenCalledWith({
        targetType: 'post',
        targetId: '123',
        currentUser: null
      });
    });

    it('should handle user with missing ID', async () => {
      mockRequest.user = { ...mockAuthUser, id: undefined as any };

      await controller.getComments(mockRequest as Request, mockResponse as Response);

      expect(mockCommentService.getComments).toHaveBeenCalledWith({
        targetType: 'post',
        targetId: '123',
        currentUser: {
          id: 0,
          role: 'user'
        }
      });
    });

    it('should handle user with missing roles', async () => {
      mockRequest.user = { ...mockAuthUser, roles: undefined };

      await controller.getComments(mockRequest as Request, mockResponse as Response);

      expect(mockCommentService.getComments).toHaveBeenCalledWith({
        targetType: 'post',
        targetId: '123',
        currentUser: {
          id: 1,
          role: ''
        }
      });
    });

    it('should handle validation errors', async () => {
      const validationError = new Error('Invalid query parameters');
      mockValidateGetCommentsQuery.mockImplementation(() => {
        throw validationError;
      });

      await expect(
        controller.getComments(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(validationError);
      
      expect(mockCommentService.getComments).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      const serviceError = new NotFoundError('Target entity not found');
      mockCommentService.getComments.mockRejectedValue(serviceError);

      await expect(
        controller.getComments(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(serviceError);
    });

    it('should handle different target types', async () => {
      const ideaQueryData = { targetType: 'idea' as CommentTargetType, targetId: '456' };
      mockRequest.query = { targetType: 'idea', targetId: '456' } as any;
      mockValidateGetCommentsQuery.mockReturnValue(ideaQueryData);

      await controller.getComments(mockRequest as Request, mockResponse as Response);

      expect(mockCommentService.getComments).toHaveBeenCalledWith({
        targetType: 'idea',
        targetId: '456',
        currentUser: {
          id: 1,
          role: 'user'
        }
      });
    });

    it('should return empty array when no comments found', async () => {
      mockCommentService.getComments.mockResolvedValue([]);

      await controller.getComments(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: []
      });
    });
  });

  describe('getCommentDetail', () => {
    const validParamsData = { commentId: '123' };

    beforeEach(() => {
      mockRequest.params = validParamsData as any;
      mockValidateCommentParams.mockReturnValue({ commentId: 123 });
      mockCommentService.getCommentDetail.mockResolvedValue(mockCommentResponse);
    });

    it('should successfully get comment detail for authenticated user', async () => {
      await controller.getCommentDetail(mockRequest as Request, mockResponse as Response);

      expect(mockValidateCommentParams).toHaveBeenCalledWith(validParamsData);
      expect(mockCommentService.getCommentDetail).toHaveBeenCalledWith(123, {
        id: 1,
        role: 'user'
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockCommentResponse
      });
    });

    it('should successfully get comment detail for anonymous user', async () => {
      mockRequest.user = undefined;

      await controller.getCommentDetail(mockRequest as Request, mockResponse as Response);

      expect(mockCommentService.getCommentDetail).toHaveBeenCalledWith(123, null);
    });

    it('should handle validation errors', async () => {
      const validationError = new Error('Invalid comment ID');
      mockValidateCommentParams.mockImplementation(() => {
        throw validationError;
      });

      await expect(
        controller.getCommentDetail(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(validationError);
      
      expect(mockCommentService.getCommentDetail).not.toHaveBeenCalled();
    });

    it('should handle comment not found', async () => {
      const notFoundError = new NotFoundError('Comment not found');
      mockCommentService.getCommentDetail.mockRejectedValue(notFoundError);

      await expect(
        controller.getCommentDetail(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(notFoundError);
    });

    it('should handle permission denied', async () => {
      const forbiddenError = new ForbiddenError('You do not have permission to view this comment');
      mockCommentService.getCommentDetail.mockRejectedValue(forbiddenError);

      await expect(
        controller.getCommentDetail(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(forbiddenError);
    });
  });

  describe('updateComment', () => {
    const validParamsData = { commentId: '123' };
    const validUpdateData = {
      content: 'Updated comment content',
      visibility: 'private' as CommentVisibility
    };

    const updatedCommentResponse = {
      ...mockCommentResponse,
      content: 'Updated comment content',
      visibility: 'private' as CommentVisibility
    };

    beforeEach(() => {
      mockRequest.params = validParamsData as any;
      mockRequest.body = validUpdateData;
      mockValidateCommentParams.mockReturnValue({ commentId: 123 });
      mockValidateUpdateComment.mockReturnValue(validUpdateData);
      mockCommentService.updateComment.mockResolvedValue(updatedCommentResponse);
    });

    it('should successfully update a comment', async () => {
      await controller.updateComment(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockValidateCommentParams).toHaveBeenCalledWith(validParamsData);
      expect(mockValidateUpdateComment).toHaveBeenCalledWith(validUpdateData);
      expect(mockCommentService.updateComment).toHaveBeenCalledWith({
        commentId: 123,
        userId: 1,
        content: 'Updated comment content',
        visibility: 'private'
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Comment updated successfully',
        data: updatedCommentResponse
      });
    });

    it('should update only content when visibility is not provided', async () => {
      const contentOnlyUpdate = { content: 'Only content updated' };
      mockRequest.body = contentOnlyUpdate;
      mockValidateUpdateComment.mockReturnValue(contentOnlyUpdate);

      await controller.updateComment(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockCommentService.updateComment).toHaveBeenCalledWith({
        commentId: 123,
        userId: 1,
        content: 'Only content updated'
      });
    });

    it('should update only visibility when content is not provided', async () => {
      const visibilityOnlyUpdate = { visibility: 'public' as CommentVisibility };
      mockRequest.body = visibilityOnlyUpdate;
      mockValidateUpdateComment.mockReturnValue(visibilityOnlyUpdate);

      await controller.updateComment(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockCommentService.updateComment).toHaveBeenCalledWith({
        commentId: 123,
        userId: 1,
        visibility: 'public'
      });
    });

    it('should throw UnauthorizedError when user is not authenticated', async () => {
      mockRequest.user = undefined;

      await expect(
        controller.updateComment(mockRequest as AuthRequest, mockResponse as Response)
      ).rejects.toThrow(UnauthorizedError);
      
      expect(mockValidateCommentParams).not.toHaveBeenCalled();
      expect(mockCommentService.updateComment).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedError when user ID is missing', async () => {
      mockRequest.user = { ...mockAuthUser, id: undefined as any };

      await expect(
        controller.updateComment(mockRequest as AuthRequest, mockResponse as Response)
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should handle validation errors for params', async () => {
      const validationError = new Error('Invalid comment ID');
      mockValidateCommentParams.mockImplementation(() => {
        throw validationError;
      });

      await expect(
        controller.updateComment(mockRequest as AuthRequest, mockResponse as Response)
      ).rejects.toThrow(validationError);
      
      expect(mockCommentService.updateComment).not.toHaveBeenCalled();
    });

    it('should handle validation errors for body', async () => {
      const validationError = new Error('Invalid update data');
      mockValidateUpdateComment.mockImplementation(() => {
        throw validationError;
      });

      await expect(
        controller.updateComment(mockRequest as AuthRequest, mockResponse as Response)
      ).rejects.toThrow(validationError);
      
      expect(mockCommentService.updateComment).not.toHaveBeenCalled();
    });

    it('should handle comment not found', async () => {
      const notFoundError = new NotFoundError('Comment not found');
      mockCommentService.updateComment.mockRejectedValue(notFoundError);

      await expect(
        controller.updateComment(mockRequest as AuthRequest, mockResponse as Response)
      ).rejects.toThrow(notFoundError);
    });

    it('should handle permission denied', async () => {
      const forbiddenError = new ForbiddenError('You do not have permission to update this comment');
      mockCommentService.updateComment.mockRejectedValue(forbiddenError);

      await expect(
        controller.updateComment(mockRequest as AuthRequest, mockResponse as Response)
      ).rejects.toThrow(forbiddenError);
    });
  });

  describe('deleteComment', () => {
    const validParamsData = { commentId: '123' };
    const deleteResult = { message: 'Comment deleted successfully' };

    beforeEach(() => {
      mockRequest.params = validParamsData as any;
      mockValidateCommentParams.mockReturnValue({ commentId: 123 });
      mockCommentService.deleteComment.mockResolvedValue(deleteResult);
    });

    it('should successfully delete a comment', async () => {
      await controller.deleteComment(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockValidateCommentParams).toHaveBeenCalledWith(validParamsData);
      expect(mockCommentService.deleteComment).toHaveBeenCalledWith({
        commentId: 123,
        userId: 1
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Comment deleted successfully',
        data: {}
      });
    });

    it('should throw UnauthorizedError when user is not authenticated', async () => {
      mockRequest.user = undefined;

      await expect(
        controller.deleteComment(mockRequest as AuthRequest, mockResponse as Response)
      ).rejects.toThrow(UnauthorizedError);
      
      expect(mockValidateCommentParams).not.toHaveBeenCalled();
      expect(mockCommentService.deleteComment).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedError when user ID is missing', async () => {
      mockRequest.user = { ...mockAuthUser, id: undefined as any };

      await expect(
        controller.deleteComment(mockRequest as AuthRequest, mockResponse as Response)
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should handle validation errors', async () => {
      const validationError = new Error('Invalid comment ID');
      mockValidateCommentParams.mockImplementation(() => {
        throw validationError;
      });

      await expect(
        controller.deleteComment(mockRequest as AuthRequest, mockResponse as Response)
      ).rejects.toThrow(validationError);
      
      expect(mockCommentService.deleteComment).not.toHaveBeenCalled();
    });

    it('should handle comment not found', async () => {
      const notFoundError = new NotFoundError('Comment not found');
      mockCommentService.deleteComment.mockRejectedValue(notFoundError);

      await expect(
        controller.deleteComment(mockRequest as AuthRequest, mockResponse as Response)
      ).rejects.toThrow(notFoundError);
    });

    it('should handle permission denied', async () => {
      const forbiddenError = new ForbiddenError('You do not have permission to delete this comment');
      mockCommentService.deleteComment.mockRejectedValue(forbiddenError);

      await expect(
        controller.deleteComment(mockRequest as AuthRequest, mockResponse as Response)
      ).rejects.toThrow(forbiddenError);
    });

    it('should handle service errors', async () => {
      const serviceError = new InternalServerError('Database error');
      mockCommentService.deleteComment.mockRejectedValue(serviceError);

      await expect(
        controller.deleteComment(mockRequest as AuthRequest, mockResponse as Response)
      ).rejects.toThrow(serviceError);
    });
  });

  describe('Error Handling Edge Cases', () => {
    beforeEach(() => {
      mockRequest.body = {
        targetType: 'post',
        targetId: 123,
        content: 'Test content'
      };
      mockValidateCreateComment.mockReturnValue(mockRequest.body as any);
    });

    it('should handle service throwing BadRequestError', async () => {
      const badRequestError = new BadRequestError('Invalid target entity');
      mockCommentService.createComment.mockRejectedValue(badRequestError);

      await expect(
        controller.createComment(mockRequest as AuthRequest, mockResponse as Response)
      ).rejects.toThrow(badRequestError);
    });

    it('should handle service throwing ConflictError', async () => {
      const conflictError = new Error('Conflict error');
      mockCommentService.createComment.mockRejectedValue(conflictError);

      await expect(
        controller.createComment(mockRequest as AuthRequest, mockResponse as Response)
      ).rejects.toThrow(conflictError);
    });

    it('should handle unexpected service errors', async () => {
      const unexpectedError = new Error('Unexpected error');
      mockCommentService.createComment.mockRejectedValue(unexpectedError);

      await expect(
        controller.createComment(mockRequest as AuthRequest, mockResponse as Response)
      ).rejects.toThrow(unexpectedError);
    });
  });

  describe('Response Format Validation', () => {
    it('should return proper success response format for createComment', async () => {
      mockRequest.body = {
        targetType: 'post',
        targetId: 123,
        content: 'Test content'
      };
      mockValidateCreateComment.mockReturnValue(mockRequest.body as any);
      mockCommentService.createComment.mockResolvedValue(mockCommentResponse);

      await controller.createComment(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Comment created successfully',
        data: mockCommentResponse
      });
    });

    it('should return proper success response format for getComments', async () => {
      mockRequest.query = { targetType: 'post', targetId: '123' } as any;
      mockValidateGetCommentsQuery.mockReturnValue({ targetType: 'post', targetId: '123' });
      mockCommentService.getComments.mockResolvedValue([mockCommentResponse]);

      await controller.getComments(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: [mockCommentResponse]
      });
    });

    it('should return proper success response format for updateComment', async () => {
      mockRequest.params = { commentId: '123' } as any;
      mockRequest.body = { content: 'Updated content' };
      mockValidateCommentParams.mockReturnValue({ commentId: 123 });
      mockValidateUpdateComment.mockReturnValue(mockRequest.body as any);
      mockCommentService.updateComment.mockResolvedValue(mockCommentResponse);

      await controller.updateComment(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Comment updated successfully',
        data: mockCommentResponse
      });
    });

    it('should return proper success response format for deleteComment', async () => {
      mockRequest.params = { commentId: '123' } as any;
      mockValidateCommentParams.mockReturnValue({ commentId: 123 });
      mockCommentService.deleteComment.mockResolvedValue({ message: 'Comment deleted successfully' });

      await controller.deleteComment(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Comment deleted successfully',
        data: {}
      });
    });
  });

  describe('Authentication Scenarios', () => {
    it('should handle user with all required properties', async () => {
      const fullUser = {
        id: 1,
        username: 'testuser',
        roles: ['user', 'admin'],
        permissions: ['comment:create']
      };
      mockRequest.user = fullUser;
      mockRequest.body = { targetType: 'post', targetId: 123, content: 'Test' };
      mockValidateCreateComment.mockReturnValue(mockRequest.body as any);
      mockCommentService.createComment.mockResolvedValue(mockCommentResponse);

      await controller.createComment(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockCommentService.createComment).toHaveBeenCalledWith({
        targetType: 'post',
        targetId: 123,
        content: 'Test',
        visibility: undefined,
        parentId: undefined,
        userId: 1
      });
    });

    it('should handle user with minimal properties', async () => {
      const minimalUser = { id: 2 };
      mockRequest.user = minimalUser;
      mockRequest.body = { targetType: 'post', targetId: 123, content: 'Test' };
      mockValidateCreateComment.mockReturnValue(mockRequest.body as any);
      mockCommentService.createComment.mockResolvedValue(mockCommentResponse);

      await controller.createComment(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockCommentService.createComment).toHaveBeenCalledWith({
        targetType: 'post',
        targetId: 123,
        content: 'Test',
        visibility: undefined,
        parentId: undefined,
        userId: 2
      });
    });
  });
});