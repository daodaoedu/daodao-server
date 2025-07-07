/**
 * 日誌記錄中間件
 */

import { Request, Response, NextFunction } from 'express';

/**
 * 請求日誌記錄中間件
 * 記錄所有 HTTP 請求的詳細資訊
 */
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now();
  const originalSend = res.send;

  // 覆寫 res.send 以捕獲響應時間
  res.send = function (body: unknown) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // 記錄請求資訊
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      ...(req.user && { userId: (req.user as { id?: string | number }).id })
    };

    // 根據狀態碼決定日誌級別
    if (res.statusCode >= 500) {
      console.error('Server Error:', logData);
    } else if (res.statusCode >= 400) {
      console.warn('Client Error:', logData);
    } else {
      console.log('Request:', logData);
    }

    // 呼叫原始的 send 方法
    return originalSend.call(this, body);
  };

  next();
};

/**
 * API 訪問日誌中間件
 * 簡化版本，僅記錄關鍵資訊
 */
export const apiLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    console.log(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
  });

  next();
};

/**
 * 錯誤日誌記錄函數
 */
export const logError = (error: Error, context?: Record<string, unknown>): void => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    name: error.name,
    message: error.message,
    stack: error.stack,
    ...context,
  };

  console.error('Application Error:', errorLog);
};

/**
 * 資料庫操作日誌記錄函數
 */
export const logDatabaseOperation = (
  operation: string,
  table: string,
  duration?: number,
  success = true
): void => {
  const logData = {
    timestamp: new Date().toISOString(),
    operation,
    table,
    success,
    ...(duration && { duration: `${duration}ms` }),
  };

  if (success) {
    console.log('DB Operation:', logData);
  } else {
    console.error('DB Operation Failed:', logData);
  }
};