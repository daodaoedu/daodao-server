/**
 * 速率限制中間件
 */

import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

/**
 * 全域速率限制器
 * 限制每個 IP 每分鐘的請求數量
 */
export const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 分鐘
  max: 300, // 限制每個 IP 每分鐘最多 300 個請求
  message: {
    success: false,
    message: '請求過於頻繁，請稍後再試',
    error: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true, // 返回速率限制資訊在 `RateLimit-*` headers
  legacyHeaders: false, // 禁用 `X-RateLimit-*` headers
  keyGenerator: (req: Request): string => {
    // 使用 IP 地址作為限制鍵
    return req.ip || req.connection.remoteAddress || 'unknown';
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: '請求過於頻繁，請稍後再試',
      error: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.round(60 / 1000) // 重試等待時間（秒）
    });
  },
});

/**
 * 嚴格速率限制器
 * 用於敏感操作（如登入、註冊、郵件發送）
 */
export const strictLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 分鐘
  max: 60, // 限制每個 IP 每分鐘最多 60 個請求
  message: {
    success: false,
    message: '操作過於頻繁，請稍後再試',
    error: 'STRICT_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request): string => {
    return req.ip || req.connection.remoteAddress || 'unknown';
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: '操作過於頻繁，請稍後再試',
      error: 'STRICT_RATE_LIMIT_EXCEEDED',
      retryAfter: Math.round(60 / 60) // 重試等待時間（秒）
    });
  },
});

/**
 * 認證相關速率限制器
 * 用於登入、註冊等認證操作
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分鐘
  max: 10, // 限制每個 IP 每 15 分鐘最多 10 次認證嘗試
  message: {
    success: false,
    message: '認證嘗試過於頻繁，請 15 分鐘後再試',
    error: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request): string => {
    return req.ip || req.connection.remoteAddress || 'unknown';
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: '認證嘗試過於頻繁，請 15 分鐘後再試',
      error: 'AUTH_RATE_LIMIT_EXCEEDED',
      retryAfter: Math.round((15 * 60 * 1000) / 1000) // 重試等待時間（秒）
    });
  },
});

/**
 * API 創建操作速率限制器
 * 用於限制資源創建操作
 */
export const createLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 分鐘
  max: 30, // 限制每個 IP 每分鐘最多 30 個創建請求
  message: {
    success: false,
    message: '創建操作過於頻繁，請稍後再試',
    error: 'CREATE_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request): string => {
    return req.ip || req.connection.remoteAddress || 'unknown';
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: '創建操作過於頻繁，請稍後再試',
      error: 'CREATE_RATE_LIMIT_EXCEEDED',
      retryAfter: Math.round(60 / 30) // 重試等待時間（秒）
    });
  },
});

/**
 * 檔案上傳速率限制器
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 分鐘
  max: 5, // 限制每個 IP 每分鐘最多 5 個檔案上傳請求
  message: {
    success: false,
    message: '檔案上傳過於頻繁，請稍後再試',
    error: 'UPLOAD_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request): string => {
    return req.ip || req.connection.remoteAddress || 'unknown';
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: '檔案上傳過於頻繁，請稍後再試',
      error: 'UPLOAD_RATE_LIMIT_EXCEEDED',
      retryAfter: Math.round(60 / 10) // 重試等待時間（秒）
    });
  },
});