/**
 * Express Request interface augmentation
 * Extends Express Request to include our custom user property types
 * 使用標準 Express/Passport 類型定義
 */

import { UserJwtPayload } from './auth.types';

declare global {
  namespace Express {
    // 標準 Express User 類型，與 Passport 兼容
    interface User extends UserJwtPayload {}
    
    // 擴展標準 Request 介面
    interface Request {
      user?: UserJwtPayload;
      isTemporary?: boolean;
      startTime?: number;
      requestId?: string;
    }
    
    // AuthenticatedRequest 由 Passport 提供，確保兼容性
    // interface AuthenticatedRequest 已由 @types/passport 定義
  }
}

export {};