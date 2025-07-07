/**
 * Express 模組的類型定義擴展
 * 處理 JWT 認證和 Passport OAuth 的不同 user 類型
 */

import { UserJwtPayload, User as AuthUser, TempUser } from '../auth.types';

declare global {
  namespace Express {
    // Passport OAuth 回調中的 User 類型
    interface User extends AuthUser {}
    
    interface Request {
      // 一般情況下是 JWT payload，OAuth 回調時是 Sequelize model
      user?: UserJwtPayload | AuthUser | TempUser;
      isTemporary?: boolean;
    }
  }
}

export {};
