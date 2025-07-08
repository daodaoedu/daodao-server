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
        error: {
          code: 'APP_ERROR',
          message: 'Test error',
          type: 'bad_request',
        },
        timestamp: expect.any(String),
      });
    });

    it('should handle AppError with validation errors', () => {
      const error = new AppError('Validation failed', 400, { field: 'Field is required' });
      
      globalErrorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'APP_ERROR',
          message: 'Validation failed',
          type: 'bad_request',
          details: { field: 'Field is required' },
        },
        timestamp: expect.any(String),
      });
    });

    it('should handle generic errors with default values', () => {
      const error = new Error('Generic error');
      
      globalErrorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: '伺服器內部錯誤',
          type: 'internal_server_error',
        },
        timestamp: expect.any(String),
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

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';
      const mockAsyncFunction = jest.fn().mockRejectedValue(timeoutError);
      const wrappedFunction = asyncHandler(mockAsyncFunction);
      
      await wrappedFunction(mockRequest as any, mockResponse as any, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(timeoutError);
    });

    it('should handle promise rejection with non-Error objects', async () => {
      const rejectionValue = 'String error';
      const mockAsyncFunction = jest.fn().mockRejectedValue(rejectionValue);
      const wrappedFunction = asyncHandler(mockAsyncFunction);
      
      await wrappedFunction(mockRequest as any, mockResponse as any, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(rejectionValue);
    });
  });

  describe('Enhanced Error Handling', () => {
    describe('Database Errors', () => {
      it('should handle Prisma connection errors', () => {
        const error = new Error('Connection terminated');
        error.name = 'PrismaClientUnknownRequestError';
        
        globalErrorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
        
        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: '伺服器內部錯誤',
            type: 'internal_server_error',
          },
          timestamp: expect.any(String),
        });
      });

      it('should handle Prisma validation errors', () => {
        const error = new Error('Validation failed');
        error.name = 'PrismaClientValidationError';
        
        globalErrorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
        
        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: '伺服器內部錯誤',
            type: 'internal_server_error',
          },
          timestamp: expect.any(String),
        });
      });

      it('should handle unique constraint violations', () => {
        const error = new Error('Unique constraint violation');
        error.name = 'PrismaClientKnownRequestError';
        (error as any).code = 'P2002';
        
        globalErrorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
        
        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: '伺服器內部錯誤',
            type: 'internal_server_error',
          },
          timestamp: expect.any(String),
        });
      });
    });

    describe('Authentication Errors', () => {
      it('should handle JWT errors', () => {
        const error = new Error('Invalid token');
        error.name = 'JsonWebTokenError';
        
        globalErrorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
        
        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: '無效的認證令牌',
            type: 'unauthorized',
          },
          timestamp: expect.any(String),
        });
      });

      it('should handle token expiration', () => {
        const error = new Error('Token expired');
        error.name = 'TokenExpiredError';
        
        globalErrorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
        
        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: false,
          error: {
            code: 'TOKEN_EXPIRED',
            message: '認證令牌已過期',
            type: 'unauthorized',
          },
          timestamp: expect.any(String),
        });
      });
    });

    describe('Validation Errors', () => {
      it('should handle Zod validation errors', () => {
        const error = new Error('Validation failed');
        error.name = 'ZodError';
        (error as any).issues = [{
          path: ['email'],
          message: 'Invalid email format'
        }];
        
        globalErrorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
        
        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '請求資料格式錯誤',
            type: 'bad_request',
            details: {
              email: 'Invalid email format'
            }
          },
          timestamp: expect.any(String),
        });
      });

      it('should handle express-validator errors', () => {
        const error = new Error('Validation failed');
        error.name = 'ValidationError';
        (error as any).array = () => [{
          param: 'email',
          msg: 'Invalid email'
        }];
        
        globalErrorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
        
        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: '伺服器內部錯誤',
            type: 'internal_server_error',
          },
          timestamp: expect.any(String),
        });
      });
    });

    describe('Network Errors', () => {
      it('should handle connection timeout', () => {
        const error = new Error('Connection timeout');
        error.name = 'TimeoutError';
        (error as any).code = 'TIMEOUT';
        
        globalErrorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
        
        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: '伺服器內部錯誤',
            type: 'internal_server_error',
          },
          timestamp: expect.any(String),
        });
      });

      it('should handle network connection errors', () => {
        const error = new Error('Network error');
        error.name = 'NetworkError';
        (error as any).code = 'ECONNRESET';
        
        globalErrorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
        
        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: '伺服器內部錯誤',
            type: 'internal_server_error',
          },
          timestamp: expect.any(String),
        });
      });
    });

    describe('File System Errors', () => {
      it('should handle file not found errors', () => {
        const error = new Error('File not found');
        error.name = 'ENOENT';
        (error as any).code = 'ENOENT';
        
        globalErrorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
        
        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: '伺服器內部錯誤',
            type: 'internal_server_error',
          },
          timestamp: expect.any(String),
        });
      });

      it('should handle permission denied errors', () => {
        const error = new Error('Permission denied');
        error.name = 'EACCES';
        (error as any).code = 'EACCES';
        
        globalErrorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
        
        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: '伺服器內部錯誤',
            type: 'internal_server_error',
          },
          timestamp: expect.any(String),
        });
      });
    });

    describe('Memory and Resource Errors', () => {
      it('should handle out of memory errors', () => {
        const error = new Error('Out of memory');
        error.name = 'RangeError';
        
        globalErrorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
        
        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: '伺服器內部錯誤',
            type: 'internal_server_error',
          },
          timestamp: expect.any(String),
        });
      });

      it('should handle stack overflow errors', () => {
        const error = new Error('Maximum call stack size exceeded');
        error.name = 'RangeError';
        
        globalErrorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
        
        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: '伺服器內部錯誤',
            type: 'internal_server_error',
          },
          timestamp: expect.any(String),
        });
      });
    });

    describe('Custom Error Types', () => {
      it('should handle errors with custom status codes', () => {
        const error = new Error('Custom error');
        (error as any).statusCode = 418;
        
        globalErrorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
        
        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: '伺服器內部錯誤',
            type: 'internal_server_error',
          },
          timestamp: expect.any(String),
        });
      });

      it('should handle errors with additional metadata', () => {
        const error = new Error('Error with metadata');
        (error as any).metadata = { requestId: '123', userId: 'user456' };
        
        globalErrorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
        
        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: '伺服器內部錯誤',
            type: 'internal_server_error',
          },
          timestamp: expect.any(String),
        });
      });
    });

    describe('Edge Cases', () => {
      it('should handle null error objects', () => {
        globalErrorHandler(null as any, mockRequest as Request, mockResponse as Response, mockNext);
        
        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: '伺服器內部錯誤',
            type: 'internal_server_error',
          },
          timestamp: expect.any(String),
        });
      });

      it('should handle undefined error objects', () => {
        globalErrorHandler(undefined as any, mockRequest as Request, mockResponse as Response, mockNext);
        
        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: '伺服器內部錯誤',
            type: 'internal_server_error',
          },
          timestamp: expect.any(String),
        });
      });

      it('should handle circular reference errors', () => {
        const error = new Error('Circular reference');
        (error as any).circular = error; // Create circular reference
        
        globalErrorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
        
        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: '伺服器內部錯誤',
            type: 'internal_server_error',
          },
          timestamp: expect.any(String),
        });
      });

      it('should handle errors with very long messages', () => {
        const longMessage = 'A'.repeat(10000);
        const error = new Error(longMessage);
        
        globalErrorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
        
        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: '伺服器內部錯誤',
            type: 'internal_server_error',
          },
          timestamp: expect.any(String),
        });
      });
    });

    describe('Error Logging and Monitoring', () => {
      it('should handle errors when logging fails', () => {
        const originalConsoleError = console.error;
        console.error = jest.fn().mockImplementation(() => {
          throw new Error('Logging failed');
        });
        
        const error = new Error('Original error');
        
        // Should not throw even if logging fails
        expect(() => {
          globalErrorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
        }).not.toThrow();
        
        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: '伺服器內部錯誤',
            type: 'internal_server_error',
          },
          timestamp: expect.any(String),
        });
        
        console.error = originalConsoleError;
      });
    });
  });
});