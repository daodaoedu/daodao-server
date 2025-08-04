/**
 * Winston 日誌服務
 * 提供統一的日誌記錄功能
 */

import winston, { Logger, LoggerOptions } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

// 日誌級別配置
export const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
} as const;

// 日誌級別類型
export type LogLevel = keyof typeof LOG_LEVELS;

// 日誌格式配置
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...meta,
    });
  })
);

// 開發環境格式（更易讀）
const devFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss',
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level}: ${message}${metaStr}`;
  })
);

// 創建 Winston Logger 實例
class LoggerService {
  private logger: Logger;
  private readonly isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV !== 'production';
    this.logger = this.createLogger();
  }

  private createLogger(): Logger {
    const transports: winston.transport[] = [];
    
    // 根據環境決定日誌目錄
    const logDir = this.isDevelopment ? path.join(process.cwd(), 'logs', 'dev') : path.join(process.cwd(), 'logs', 'prod');

    if (this.isDevelopment) {
      // 開發環境：控制台輸出 + 日期分割文件
      transports.push(
        new winston.transports.Console({
          level: 'debug',
          format: devFormat,
        }),
        // 開發環境錯誤日誌（按日期分割）
        new DailyRotateFile({
          filename: path.join(logDir, 'error-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          level: 'error',
          format: logFormat,
          maxSize: '20m',
          maxFiles: '30d',
          zippedArchive: true,
        }),
        // 開發環境合併日誌（按日期分割）
        new DailyRotateFile({
          filename: path.join(logDir, 'combined-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          format: logFormat,
          maxSize: '20m',
          maxFiles: '30d',
          zippedArchive: true,
        })
      );
    } else {
      // 生產環境：僅文件輸出，按日期分割
      transports.push(
        // 生產環境錯誤日誌（按日期分割）
        new DailyRotateFile({
          filename: path.join(logDir, 'error-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          level: 'error',
          format: logFormat,
          maxSize: '20m',
          maxFiles: '30d',
          zippedArchive: true,
        }),
        // 生產環境合併日誌（按日期分割）
        new DailyRotateFile({
          filename: path.join(logDir, 'combined-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          format: logFormat,
          maxSize: '20m',
          maxFiles: '30d',
          zippedArchive: true,
        })
      );
    }

    const loggerOptions: LoggerOptions = {
      levels: LOG_LEVELS,
      level: this.isDevelopment ? 'debug' : 'info',
      transports,
      // 退出時關閉
      exitOnError: false,
    };

    return winston.createLogger(loggerOptions);
  }

  // 基本日誌方法
  error(message: string, meta?: Record<string, unknown>): void {
    this.logger.error(message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.logger.warn(message, meta);
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.logger.info(message, meta);
  }

  http(message: string, meta?: Record<string, unknown>): void {
    this.logger.http(message, meta);
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.logger.debug(message, meta);
  }

  // 特殊日誌方法
  logError(error: Error, context?: Record<string, unknown>): void {
    this.error(error.message, {
      name: error.name,
      stack: error.stack,
      ...context,
    });
  }

  logRequest(req: {
    method: string;
    url: string;
    statusCode?: number;
    duration?: number;
    userAgent?: string;
    ip?: string;
    userId?: string | number;
  }): void {
    this.http('HTTP Request', {
      method: req.method,
      url: req.url,
      statusCode: req.statusCode,
      duration: req.duration,
      userAgent: req.userAgent,
      ip: req.ip,
      userId: req.userId,
    });
  }

  logDatabaseOperation(
    operation: string,
    table: string,
    duration?: number,
    success = true,
    error?: Error
  ): void {
    const level = success ? 'info' : 'error';
    const message = `Database ${operation} on ${table}`;
    
    this.logger.log(level, message, {
      operation,
      table,
      duration,
      success,
      ...(error && { error: error.message, stack: error.stack }),
    });
  }

  logBusinessLogic(
    operation: string,
    details: Record<string, unknown>,
    level: LogLevel = 'info'
  ): void {
    this.logger.log(level, `Business Logic: ${operation}`, details);
  }

  // 獲取底層 Winston Logger（如需自定義用法）
  getWinstonLogger(): Logger {
    return this.logger;
  }
}

// 創建單例實例
export const loggerService = new LoggerService();

// 導出默認實例
export default loggerService;