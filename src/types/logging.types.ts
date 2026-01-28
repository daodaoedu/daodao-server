/**
 * 日誌相關的 TypeScript 類型定義
 */

import { LOG_LEVELS } from '@/services/logging/logger.service';

// 日誌級別類型
export type LogLevel = keyof typeof LOG_LEVELS;

// 日誌上下文接口
export interface LogContext {
  [key: string]: unknown;
}

// HTTP 請求日誌接口
export interface HttpRequestLog {
  method: string;
  url: string;
  statusCode?: number;
  duration?: number;
  userAgent?: string;
  ip?: string;
  userId?: string | number;
  headers?: Record<string, string>;
  body?: unknown;
  query?: Record<string, unknown>;
  params?: Record<string, unknown>;
}

// 資料庫操作日誌接口
export interface DatabaseOperationLog {
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'UPSERT' | 'TRANSACTION';
  table: string;
  duration?: number;
  success: boolean;
  error?: Error;
  query?: string;
  params?: unknown[];
  affectedRows?: number;
}

// 業務邏輯日誌接口
export interface BusinessLogicLog {
  operation: string;
  module: string;
  userId?: string | number;
  details: LogContext;
  level?: LogLevel;
}

// 錯誤日誌接口
export interface ErrorLog {
  name: string;
  message: string;
  stack?: string;
  context?: LogContext;
  userId?: string | number;
  url?: string;
  method?: string;
}

// 系統性能日誌接口
export interface PerformanceLog {
  operation: string;
  duration: number;
  memory?: {
    used: number;
    total: number;
  };
  cpu?: number;
  context?: LogContext;
}

// 安全日誌接口
export interface SecurityLog {
  event: 'LOGIN_SUCCESS' | 'LOGIN_FAILURE' | 'LOGOUT' | 'PERMISSION_DENIED' | 'RATE_LIMIT_EXCEEDED';
  userId?: string | number;
  ip: string;
  userAgent?: string;
  details?: LogContext;
}

// 第三方服務日誌接口
export interface ExternalServiceLog {
  service: string;
  operation: string;
  duration?: number;
  success: boolean;
  statusCode?: number;
  error?: string;
  requestId?: string;
  context?: LogContext;
}

// 日誌配置接口
export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  logDirectory?: string;
  maxFileSize?: number;
  maxFiles?: number;
  enableTimestamp: boolean;
  enableColors: boolean;
}

// 日誌格式化選項
export interface LogFormatOptions {
  includeTimestamp: boolean;
  includeLevel: boolean;
  includeStack: boolean;
  colorize: boolean;
  prettyPrint: boolean;
}