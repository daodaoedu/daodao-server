/**
 * 錯誤處理中間件
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/error-handler';

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
  // 處理 Sequelize 驗證錯誤
  else if (error.name === 'SequelizeValidationError') {
    statusCode = 400;
    message = '資料驗證失敗';
    errors = {};
    // 提取驗證錯誤詳情
    if ('errors' in error && Array.isArray(error.errors)) {
      error.errors.forEach((err: { path?: string; message?: string }) => {
        if (errors && err.path && err.message) {
          errors[err.path] = err.message;
        }
      });
    }
  }
  // 處理 Sequelize 唯一約束錯誤
  else if (error.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409;
    message = '資料衝突，資源已存在';
  }
  // 處理 Sequelize 外鍵約束錯誤
  else if (error.name === 'SequelizeForeignKeyConstraintError') {
    statusCode = 400;
    message = '關聯資料不存在';
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
  if (process.env.NODE_ENV === 'development') {
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      statusCode,
    });
  } else {
    // 生產環境只記錄必要資訊
    console.error('Error:', {
      name: error.name,
      message: error.message,
      statusCode,
      timestamp: new Date().toISOString(),
      url: req.url,
      method: req.method,
    });
  }

  // 返回錯誤響應
  res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
    ...(process.env.NODE_ENV === 'development' && { 
      stack: error.stack,
      name: error.name 
    }),
  });
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