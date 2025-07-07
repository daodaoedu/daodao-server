/**
 * 錯誤處理中間件測試
 */

import { Request, Response, NextFunction } from 'express';
import { globalErrorHandler, notFoundHandler, asyncHandler } from '@middleware/error.middleware';
import { AppError } from '@utils/error-handler';

describe('Error Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      url: '/test',
      method: 'GET',
      originalUrl: '/test',
      ip: '127.0.0.1',
      connection: { remoteAddress: '127.0.0.1' } as any,
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    
    mockNext = jest.fn();
  });

  describe('globalErrorHandler', () => {
    it('should handle AppError correctly', () => {
      const error = new AppError('Test error', 400);
      
      globalErrorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Test error',
      });
    });

    it('should handle AppError with validation errors', () => {
      const error = new AppError('Validation failed', 400, { field: 'Field is required' });
      
      globalErrorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: { field: 'Field is required' },
      });
    });

    it('should handle generic errors with default values', () => {
      const error = new Error('Generic error');
      
      globalErrorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '伺服器內部錯誤',
      });
    });
  });

  describe('notFoundHandler', () => {
    it('should create 404 error and call next', () => {
      notFoundHandler(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: '找不到路由: /test',
          statusCode: 404,
        })
      );
    });
  });

  describe('asyncHandler', () => {
    it('should call the function and handle successful execution', async () => {
      const mockAsyncFunction = jest.fn().mockResolvedValue(undefined);
      const wrappedFunction = asyncHandler(mockAsyncFunction);
      
      await wrappedFunction(mockRequest as any, mockResponse as any, mockNext);
      
      expect(mockAsyncFunction).toHaveBeenCalledWith(mockRequest, mockResponse, mockNext);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should catch errors and call next', async () => {
      const error = new Error('Async error');
      const mockAsyncFunction = jest.fn().mockRejectedValue(error);
      const wrappedFunction = asyncHandler(mockAsyncFunction);
      
      await wrappedFunction(mockRequest as any, mockResponse as any, mockNext);
      
      expect(mockAsyncFunction).toHaveBeenCalledWith(mockRequest, mockResponse, mockNext);
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});