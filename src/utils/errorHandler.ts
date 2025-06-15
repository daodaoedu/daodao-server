/**
 * 錯誤處理工具
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * 自定義 API 錯誤類
 */
export class ApiError extends Error {
  statusCode: number;
  details?: any;

  constructor(message: string, statusCode: number = 500, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
    
    // 捕獲錯誤堆棧
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 資源未找到錯誤
 */
export class NotFoundError extends ApiError {
  constructor(message: string = '找不到請求的資源', details?: any) {
    super(message, 404, details);
    this.name = 'NotFoundError';
  }
}

/**
 * 無效請求錯誤
 */
export class BadRequestError extends ApiError {
  constructor(message: string = '無效的請求參數', details?: any) {
    super(message, 400, details);
    this.name = 'BadRequestError';
  }
}

/**
 * 權限錯誤
 */
export class ForbiddenError extends ApiError {
  constructor(message: string = '沒有操作權限', details?: any) {
    super(message, 403, details);
    this.name = 'ForbiddenError';
  }
}

/**
 * 未授權錯誤
 */
export class UnauthorizedError extends ApiError {
  constructor(message: string = '需要登入後才能操作', details?: any) {
    super(message, 401, details);
    this.name = 'UnauthorizedError';
  }
}

/**
 * 衝突錯誤
 */
export class ConflictError extends ApiError {
  constructor(message: string = '資源衝突', details?: any) {
    super(message, 409, details);
    this.name = 'ConflictError';
  }
}

/**
 * 請求過多錯誤
 */
export class TooManyRequestsError extends ApiError {
  constructor(message: string = '請求過多，請稍後再試', details?: any) {
    super(message, 429, details);
    this.name = 'TooManyRequestsError';
  }
}

/**
 * 異步處理器包裝函數
 * 用於捕獲異步路由處理器中的錯誤
 */
export const asyncWrapper = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 全局錯誤處理中間件
 */
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('Error:', err);

  // 對於已知的 API 錯誤，直接使用錯誤信息
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      error: err.name,
      details: err.details
    });
  }

  // Sequelize 唯一約束錯誤
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      message: '資料已存在，無法建立重複記錄',
      error: 'ConflictError',
      details: err.errors.map((e: any) => ({
        message: e.message,
        field: e.path
      }))
    });
  }

  // Sequelize 驗證錯誤
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      message: '資料驗證失敗',
      error: 'ValidationError',
      details: err.errors.map((e: any) => ({
        message: e.message,
        field: e.path
      }))
    });
  }

  // 處理 JWT 錯誤
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: '無效的認證令牌',
      error: 'AuthenticationError'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: '認證令牌已過期',
      error: 'AuthenticationError'
    });
  }

  // 處理其他未知錯誤
  const statusCode = err.statusCode || 500;
  const message = err.message || '伺服器內部錯誤';

  // 在生產環境中不暴露具體錯誤訊息
  const responseMessage = process.env.NODE_ENV === 'production' && statusCode === 500
    ? '伺服器內部錯誤'
    : message;

  return res.status(statusCode).json({
    success: false,
    message: responseMessage,
    error: err.name || 'InternalServerError',
    details: process.env.NODE_ENV !== 'production' ? err.stack : undefined
  });
}
