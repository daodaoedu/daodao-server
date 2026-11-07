/**
 * 日誌記錄中間件 - 整合 Winston
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '@/services/logging';
import { sanitizeUrlForLogging, sanitizeLogText, sanitizeLogData } from '@/utils/log-sanitizer';

// 擴展 Request 類型以支持日誌相關屬性
interface RequestWithLogger extends Request {
  requestId?: string;
  startTime?: number;
}

/**
 * 生成唯一請求 ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 判斷是否需要記錄請求體（排除敏感資料）
 */
export function shouldLogRequestBody(path: string, method: string): boolean {
  const sensitivePatterns = [
    /\/auth\/login/i,
    /\/auth\/register/i,
    /\/auth\/password/i,
    /\/email/i,
    /\/future-letters(?:[/?]|$)/i,
    /\/surveys\/public\/[^/]+\/responses(?:[/?]|$)/i,
  ];
  
  return !sensitivePatterns.some(pattern => pattern.test(path)) && 
         ['POST', 'PUT', 'PATCH'].includes(method);
}

/**
 * 清理敏感資料
 */
export function sanitizeHeadersForLogging(headers: unknown): unknown {
  return sanitizeLogData(headers);
}

function isSensitiveAnswerPath(path: string): boolean {
  return /\/future-letters(?:[/?]|$)/i.test(path) || /\/surveys\/public\/[^/]+\/responses(?:[/?]|$)/i.test(path);
}

export function sanitizeRequestBodyForLogging(path: string, data: unknown): unknown {
  return isSensitiveAnswerPath(path) ? '[REDACTED]' : sanitizeLogData(data);
}

/**
 * 完整版請求日誌記錄中間件
 * 記錄所有 HTTP 請求的詳細資訊
 */
export const requestLogger = (
  req: RequestWithLogger,
  res: Response,
  next: NextFunction
): void => {
  // 生成請求 ID 並記錄開始時間
  req.requestId = generateRequestId();
  req.startTime = Date.now();
  
  // 記錄請求開始
  const requestMeta: {
    requestId: string;
    method: string;
    url: string;
    userAgent: string | undefined;
    ip: string | undefined;
    userId: string | number | undefined;
    query: unknown;
    body?: unknown;
  } = {
    requestId: req.requestId,
    method: req.method,
    url: sanitizeUrlForLogging(req.originalUrl),
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
    userId: req.user ? (req.user as { id?: string | number }).id : undefined,
    query: Object.keys(req.query).length > 0 ? '[REDACTED]' : undefined,
  };

  // 只在適當的情況下記錄請求體
  if (shouldLogRequestBody(req.path, req.method) && req.body) {
    requestMeta.body = sanitizeLogData(req.body);
  }

  logger.info('Request started', requestMeta);

  // 攔截響應
  const originalSend = res.send;
  const originalJson = res.json;
  let responseBody: unknown;

  res.send = function(body: unknown): Response {
    responseBody = body;
    return originalSend.call(this, body);
  };

  res.json = function(body: unknown): Response {
    responseBody = body;
    return originalJson.call(this, body);
  };

  // 監聽響應結束
  res.on('finish', () => {
    const duration = Date.now() - (req.startTime || 0);
    const statusCode = res.statusCode;
    
    // 決定日誌級別
    let logLevel: 'info' | 'warn' | 'error' = 'info';
    if (statusCode >= 500) {
      logLevel = 'error';
    } else if (statusCode >= 400) {
      logLevel = 'warn';
    }

    // 響應元數據
    const responseMeta: {
      requestId: string | undefined;
      method: string;
      url: string;
      statusCode: number;
      duration: number;
      userId: string | number | undefined;
      contentLength: string | undefined;
      responseBody?: unknown;
    } = {
      requestId: req.requestId,
      method: req.method,
      url: sanitizeUrlForLogging(req.originalUrl),
      statusCode,
      duration,
      userId: req.user ? (req.user as { id?: string | number }).id : undefined,
      contentLength: res.get('content-length')
    };

    // 只在錯誤時記錄響應體，且要清理敏感資料
    if (statusCode >= 400 && responseBody) {
      responseMeta.responseBody = sanitizeLogData(responseBody);
    }

    // 記錄響應
    logger[logLevel]('Request completed', responseMeta);

    // 性能警告
    if (duration > 5000) {
      logger.warn('Slow request detected', {
        requestId: req.requestId,
        url: sanitizeUrlForLogging(req.originalUrl),
        duration,
        threshold: '5000ms'
      });
    }
  });

  // 監聽錯誤
  res.on('error', (error) => {
    logger.error('Response error', {
      requestId: req.requestId,
      method: req.method,
      url: sanitizeUrlForLogging(req.originalUrl),
      error: sanitizeLogText(error.message),
      stack: error.stack ? sanitizeLogText(error.stack) : undefined
    });
  });

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
    
    // 使用 Winston 記錄 HTTP 請求
    logger.http(`${req.method} ${sanitizeUrlForLogging(req.originalUrl)} - ${res.statusCode} - ${duration}ms`, {
      method: req.method,
      url: sanitizeUrlForLogging(req.originalUrl),
      statusCode: res.statusCode,
      duration,
      ip: req.ip
    });
  });

  next();
};

/**
 * 錯誤處理中間件 - Winston 版本
 */
export const errorLogger = (
  error: Error,
  req: RequestWithLogger,
  res: Response,
  next: NextFunction
): void => {
  // 記錄錯誤詳情
  logger.error('Unhandled error', {
    requestId: req.requestId,
    method: req.method,
    url: sanitizeUrlForLogging(req.originalUrl),
    userId: req.user ? (req.user as { id?: string | number }).id : undefined,
    error: {
      name: error.name,
      message: sanitizeLogText(error.message),
      stack: error.stack ? sanitizeLogText(error.stack) : undefined
    },
    headers: sanitizeHeadersForLogging(req.headers),
    body: sanitizeRequestBodyForLogging(req.originalUrl, req.body)
  });

  next(error);
};

/**
 * 錯誤日誌記錄函數
 */
export const logError = (error: Error, context?: Record<string, unknown>): void => {
  logger.logError(error, context);
};

/**
 * 資料庫操作日誌記錄函數
 */
export const logDatabaseOperation = (
  operation: string,
  table: string,
  duration?: number,
  success = true,
  error?: Error
): void => {
  logger.logDatabaseOperation(operation, table, duration, success, error);
};

/**
 * 應用程式生命週期日誌
 */
export const logApplicationEvent = (
  event: 'startup' | 'shutdown' | 'database_connected' | 'database_disconnected',
  details?: Record<string, unknown>
): void => {
  logger.info(`Application ${event}`, {
    event,
    timestamp: new Date().toISOString(),
    ...details
  });
};
