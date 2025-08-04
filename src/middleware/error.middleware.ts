/**
 * 錯誤處理中間件
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/error-handler';
import { ErrorResponse } from '../types/common.types';
import { 
  isPrismaError, 
  categorizePrismaError, 
} from '../utils/prisma-error-handler';

/**
 * 全域錯誤處理中間件
 * 處理所有未捕獲的錯誤並返回統一的錯誤響應格式
 */
export const globalErrorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // 設定預設錯誤資訊
  let statusCode = 500;
  let message = '伺服器內部錯誤';
  let errors: Record<string, string> | undefined;

  // 如果是我們定義的 AppError
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    errors = error.errors;
  }
  // 處理 null 或 undefined 錯誤
  else if (!error || error === null || error === undefined) {
    statusCode = 500;
    message = '伺服器內部錯誤';
  }
  // 處理 Prisma 錯誤
  else if (isPrismaError(error)) {
    const prismaErrorInfo = categorizePrismaError(error);
    statusCode = prismaErrorInfo.statusCode;
    message = prismaErrorInfo.message;
    if (prismaErrorInfo.details) {
      errors = prismaErrorInfo.details;
    }
  }
  // 處理 MongoDB 重複鍵錯誤
  else if (error.name === 'MongoServerError' && 'code' in error && error.code === 11000) {
    statusCode = 409;
    message = '資料衝突，資源已存在';
  }
  // 處理 Zod 驗證錯誤
  else if (error.name === 'ZodError') {
    statusCode = 400;
    message = '請求資料格式錯誤';
    errors = {};
    if ('issues' in error && Array.isArray(error.issues)) {
      error.issues.forEach((issue: { path?: string[]; message?: string }) => {
        if (errors && issue.path && issue.path.length > 0 && issue.message) {
          const path = issue.path.join('.');
          errors[path] = issue.message;
        }
      });
    }
  }
  // 處理 JWT 錯誤
  else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = '無效的認證令牌';
  }
  else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = '認證令牌已過期';
  }
  // 處理 Multer 檔案上傳錯誤
  else if (error.name === 'MulterError') {
    statusCode = 400;
    message = '檔案上傳錯誤';
    if ('code' in error) {
      switch (error.code) {
        case 'LIMIT_FILE_SIZE':
          message = '檔案大小超過限制';
          break;
        case 'LIMIT_FILE_COUNT':
          message = '檔案數量超過限制';
          break;
        case 'LIMIT_UNEXPECTED_FILE':
          message = '不支援的檔案類型';
          break;
      }
    }
  }

  // 開發環境下記錄完整錯誤
  if (process.env.NODE_ENV === 'dev') {
    try {
      console.error('Error details:', {
        name: error?.name || 'Unknown',
        message: error?.message || 'Unknown error',
        stack: error?.stack || 'No stack trace available',
        statusCode,
      });
    } catch (loggingError) {
      // 如果記錄失敗，繼續處理錯誤響應
      try {
        console.error('Logging failed, but continuing with error response');
      } catch {
        // 如果連這個也失敗，就完全靜默
      }
    }
  } else {
    // 生產環境只記錄必要資訊
    try {
      console.error('Error:', {
        name: error?.name || 'Unknown',
        message: error?.message || 'Unknown error',
        statusCode,
        timestamp: new Date().toISOString(),
        url: req.url,
        method: req.method,
      });
    } catch (loggingError) {
      // 如果記錄失敗，繼續處理錯誤響應
      try {
        console.error('Logging failed, but continuing with error response');
      } catch {
        // 如果連這個也失敗，就完全靜默
      }
    }
  }

  // 獲取錯誤代碼
  const getErrorCode = (error: Error): string => {
    if (!error) return 'INTERNAL_SERVER_ERROR';
    
    // 處理 Prisma 錯誤
    if (isPrismaError(error)) {
      const prismaErrorInfo = categorizePrismaError(error);
      return prismaErrorInfo.errorCode;
    }
    
    switch (error.name) {
      case 'JsonWebTokenError':
        return 'INVALID_TOKEN';
      case 'TokenExpiredError':
        return 'TOKEN_EXPIRED';
      case 'ZodError':
        return 'VALIDATION_ERROR';
      case 'MongoServerError':
        return 'DATABASE_ERROR';
      case 'MulterError':
        return 'FILE_UPLOAD_ERROR';
      default:
        return error instanceof AppError ? 'APP_ERROR' : 'INTERNAL_SERVER_ERROR';
    }
  };

  // 獲取錯誤類型
  const getErrorType = (statusCode: number): string => {
    switch (statusCode) {
      case 400:
        return 'bad_request';
      case 401:
        return 'unauthorized';
      case 403:
        return 'forbidden';
      case 404:
        return 'not_found';
      case 409:
        return 'conflict';
      case 500:
        return 'internal_server_error';
      default:
        return 'error';
    }
  };

  // 返回標準化錯誤響應
  const response: ErrorResponse = {
    success: false,
    error: {
      code: getErrorCode(error),
      message: message,
      type: getErrorType(statusCode) as ErrorResponse['error']['type'],
      ...(errors && { details: errors }),
    },
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'dev' && { 
      debug: {
        stack: error?.stack || 'No stack trace available',
        name: error?.name || 'Unknown' 
      }
    })
  };

  res.status(statusCode).json(response);
};

/**
 * 404 錯誤處理中間件
 * 處理找不到路由的請求
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const error = new AppError(`找不到路由: ${req.originalUrl}`, 404);
  next(error);
};

/**
 * 異步函數包裝器
 * 自動捕獲異步路由處理器中的錯誤
 */
export const asyncHandler = <T extends Request, U extends Response>(
  fn: (req: T, res: U, next: NextFunction) => Promise<void>
) => {
  return (req: T, res: U, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};