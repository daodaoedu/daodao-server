/**
 * 錯誤處理工具
 */

import { Request, Response, NextFunction } from 'express';

/**
 * 基本錯誤類
 */
export class AppError extends Error {
  statusCode: number;
  errors?: Record<string, string>;

  constructor(message: string, statusCode: number, errors?: Record<string, string>) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 400 錯誤 - 錯誤的請求
 */
export class BadRequestError extends AppError {
  constructor(message = '無效的請求', errors?: Record<string, string>) {
    super(message, 400, errors);
  }
}

/**
 * 401 錯誤 - 未授權
 */
export class UnauthorizedError extends AppError {
  constructor(message = '未經授權的訪問') {
    super(message, 401);
  }
}

/**
 * 403 錯誤 - 禁止訪問
 */
export class ForbiddenError extends AppError {
  constructor(message = '無權限執行此操作') {
    super(message, 403);
  }
}

/**
 * 404 錯誤 - 資源不存在
 */
export class NotFoundError extends AppError {
  constructor(message = '找不到請求的資源') {
    super(message, 404);
  }
}

/**
 * 409 錯誤 - 資源衝突
 */
export class ConflictError extends AppError {
  constructor(message = '資源衝突') {
    super(message, 409);
  }
}

/**
 * 500 錯誤 - 伺服器內部錯誤
 */
export class InternalServerError extends AppError {
  constructor(message = '伺服器內部錯誤') {
    super(message, 500);
  }
}

/**
 * 異步函數包裝器
 * 自動捕獲異步路由處理器中的錯誤並傳遞給 Express 錯誤中間件
 */
export const asyncWrapper = (fn: (req: Request, res: Response, next?: NextFunction) => Promise<void>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
