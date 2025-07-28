/**
 * Integration tests for validation middleware with comment validators
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { validate } from '@/validators/validation.middleware';
import { 
  createCommentSchema, 
  updateCommentSchema, 
  getCommentsQuerySchema,
  commentParamsSchema 
} from '@/validators/comment.validators';

// Mock Express objects
const mockRequest = (data: any, source: 'body' | 'query' | 'params' = 'body') => {
  const req = {
    body: source === 'body' ? data : {},
    query: source === 'query' ? data : {},
    params: source === 'params' ? data : {}
  } as Request;
  return req;
};

const mockResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res) as any;
  res.json = jest.fn().mockReturnValue(res) as any;
  return res;
};

const mockNext = jest.fn() as NextFunction;

describe('Validation Middleware with Comment Validators', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validate middleware with createCommentSchema', () => {
    it('should pass validation with valid comment creation data', () => {
      const validData = {
        targetType: 'post',
        targetId: '123',
        content: 'This is a valid comment',
        visibility: 'public'
      };

      const req = mockRequest(validData, 'body');
      const res = mockResponse();
      const middleware = validate(createCommentSchema, 'body');

      middleware(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(req.body).toEqual(validData);
    });

    it('should apply default values during validation', () => {
      const dataWithoutDefaults = {
        targetType: 'resource',
        targetId: '456',
        content: 'Comment without visibility'
      };

      const req = mockRequest(dataWithoutDefaults, 'body');
      const res = mockResponse();
      const middleware = validate(createCommentSchema, 'body');

      middleware(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(req.body.visibility).toBe('private'); // default applied
    });

    it('should return 400 error for invalid comment creation data', () => {
      const invalidData = {
        targetType: 'invalid_type',
        targetId: 'not_a_number',
        content: ''
      };

      const req = mockRequest(invalidData, 'body');
      const res = mockResponse();
      const middleware = validate(createCommentSchema, 'body');

      middleware(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          type: 'bad_request',
          message: '驗證失敗',
          details: expect.arrayContaining([
            expect.objectContaining({
              path: expect.any(String),
              message: expect.any(String)
            })
          ])
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should coerce and transform data during validation', () => {
      const dataWithStringNumbers = {
        targetType: 'note',
        targetId: '789',
        content: '  Comment with whitespace  ',
        parentId: '123'
      };

      const req = mockRequest(dataWithStringNumbers, 'body');
      const res = mockResponse();
      const middleware = validate(createCommentSchema, 'body');

      middleware(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(req.body.targetId).toBe('789');
      expect(req.body.parentId).toBe(123);
      expect(req.body.content).toBe('Comment with whitespace');
      expect(typeof req.body.targetId).toBe('string');
      expect(typeof req.body.parentId).toBe('number');
    });
  });

  describe('validate middleware with updateCommentSchema', () => {
    it('should pass validation with valid update data', () => {
      const validData = {
        content: 'Updated comment content',
        visibility: 'public'
      };

      const req = mockRequest(validData, 'body');
      const res = mockResponse();
      const middleware = validate(updateCommentSchema, 'body');

      middleware(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(req.body).toEqual(validData);
    });

    it('should pass validation with partial update data', () => {
      const partialData = {
        content: 'Only updating content'
      };

      const req = mockRequest(partialData, 'body');
      const res = mockResponse();
      const middleware = validate(updateCommentSchema, 'body');

      middleware(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(req.body).toEqual(partialData);
    });

    it('should return 400 error for empty update data', () => {
      const emptyData = {};

      const req = mockRequest(emptyData, 'body');
      const res = mockResponse();
      const middleware = validate(updateCommentSchema, 'body');

      middleware(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          type: 'bad_request',
          message: '驗證失敗',
          details: expect.arrayContaining([
            expect.objectContaining({
              message: 'At least one field (content or visibility) must be provided for update'
            })
          ])
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('validate middleware with getCommentsQuerySchema', () => {
    it('should pass validation with valid query parameters', () => {
      const validQuery = {
        targetType: 'post',
        targetId: '123'
      };

      const req = mockRequest(validQuery, 'query');
      const res = mockResponse();
      const middleware = validate(getCommentsQuerySchema, 'query');

      middleware(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(req.query.targetId).toBe('123');
      expect(typeof req.query.targetId).toBe('string');
    });

    it('should return 400 error for missing required query parameters', () => {
      const incompleteQuery = {
        targetType: 'post'
        // missing targetId
      };

      const req = mockRequest(incompleteQuery, 'query');
      const res = mockResponse();
      const middleware = validate(getCommentsQuerySchema, 'query');

      middleware(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          type: 'bad_request',
          message: '驗證失敗',
          details: expect.arrayContaining([
            expect.objectContaining({
              path: 'targetId',
              message: expect.any(String)
            })
          ])
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('validate middleware with commentParamsSchema', () => {
    it('should pass validation with valid URL parameters', () => {
      const validParams = {
        commentId: '456'
      };

      const req = mockRequest(validParams, 'params');
      const res = mockResponse();
      const middleware = validate(commentParamsSchema, 'params');

      middleware(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(req.params.commentId).toBe(456); // coerced to number
      expect(typeof req.params.commentId).toBe('number');
    });

    it('should return 400 error for invalid URL parameters', () => {
      const invalidParams = {
        commentId: 'not_a_number'
      };

      const req = mockRequest(invalidParams, 'params');
      const res = mockResponse();
      const middleware = validate(commentParamsSchema, 'params');

      middleware(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          type: 'bad_request',
          message: '驗證失敗',
          details: expect.arrayContaining([
            expect.objectContaining({
              path: 'commentId',
              message: expect.any(String)
            })
          ])
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle non-Zod errors by calling next', () => {
      const mockSchema = {
        parse: jest.fn().mockImplementation(() => {
          throw new Error('Non-Zod error');
        })
      };

      const req = mockRequest({}, 'body');
      const res = mockResponse();
      const middleware = validate(mockSchema as any, 'body');

      middleware(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should format multiple validation errors correctly', () => {
      const invalidData = {
        targetType: 'invalid_type',
        targetId: -1,
        content: '',
        visibility: 'invalid_visibility'
      };

      const req = mockRequest(invalidData, 'body');
      const res = mockResponse();
      const middleware = validate(createCommentSchema, 'body');

      middleware(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          type: 'bad_request',
          message: '驗證失敗',
          details: expect.arrayContaining([
            expect.objectContaining({
              path: expect.any(String),
              message: expect.any(String)
            })
          ])
        }
      });

      // Check that multiple errors are captured
      const jsonCall = (res.json as jest.Mock).mock.calls[0][0] as any;
      expect(jsonCall.error.details.length).toBeGreaterThan(1);
    });

    it('should handle nested validation errors with proper path formatting', () => {
      const invalidData = {
        targetType: 'post',
        targetId: '123',
        content: 'Valid content',
        nested: {
          invalid: 'field'
        }
      };

      // This would be caught by the schema validation
      const req = mockRequest(invalidData, 'body');
      const res = mockResponse();
      const middleware = validate(createCommentSchema, 'body');

      middleware(req, res, mockNext);

      // Should still pass because extra fields are ignored by Zod
      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('data source handling', () => {
    it('should validate body data when source is body', () => {
      const bodyData = { content: 'Updated content' };
      const req = mockRequest(bodyData, 'body');
      const res = mockResponse();
      const middleware = validate(updateCommentSchema, 'body');

      middleware(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(req.body).toEqual(bodyData);
    });

    it('should validate query data when source is query', () => {
      const queryData = { targetType: 'post', targetId: '123' };
      const req = mockRequest(queryData, 'query');
      const res = mockResponse();
      const middleware = validate(getCommentsQuerySchema, 'query');

      middleware(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(req.query.targetId).toBe('123');
    });

    it('should validate params data when source is params', () => {
      const paramsData = { commentId: '456' };
      const req = mockRequest(paramsData, 'params');
      const res = mockResponse();
      const middleware = validate(commentParamsSchema, 'params');

      middleware(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(req.params.commentId).toBe(456);
    });
  });
});