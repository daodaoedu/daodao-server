/**
 * 身份驗證中間件
 * 負責驗證使用者身份
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';
import * as jwt from 'jsonwebtoken';
import { UnauthorizedError, ForbiddenError } from '../middleware/error.middleware';
import { 
  UserJwtPayload,
  AuthMiddlewareOptions, 
  PermissionOptions,
  AnyUser
} from '../types/auth.types';
import { isTemporaryUser } from '../utils/user-type-detection';

// AuthRequest has been deprecated in favor of the augmented Express Request type

// 使用統一的 UserJwtPayload 介面

/**
 * JWT 身份驗證中間件
 * @param req - Express 請求對象
 * @param res - Express 響應對象
 * @param next - Express 下一個中間件
 */
export const authenticateJWT: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {
  // 從請求頭中獲取 token
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    next(new UnauthorizedError('缺少認證令牌'));
    return;
  }
  
  try {
    // 驗證 token
    const secret = process.env.JWT_SECRET || process.env.JWT_SECURITY;
    console.log('🔑 JWT secret being used:', secret ? `${secret.substring(0, 10)}...` : 'undefined');
    if (!secret) {
      throw new Error('JWT secret not configured');
    }
    
    const decoded = jwt.verify(token, secret);
    
    // 將解碼後的用戶信息添加到請求對象中
    if (typeof decoded === 'object' && decoded !== null) {
      req.user = decoded as UserJwtPayload;
      req.isTemporary = decoded.isTemp || false;
    } else {
      throw new Error('Invalid token payload');
    }
    
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError('認證令牌已過期'));
      return;
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError('無效的認證令牌'));
      return;
    } else {
      next(new UnauthorizedError('認證失敗'));
      return;
    }
  }
};

/**
 * 必須身份驗證中間件
 * 別名，與路由中使用的名稱保持一致
 */
export const authenticate = authenticateJWT;

/**
 * 可選身份驗證中間件
 * 如果有 token 則驗證，沒有則繼續執行
 * @param req - Express 請求對象
 * @param res - Express 響應對象
 * @param next - Express 下一個中間件
 */
export const optionalAuth: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    // 沒有 token，直接繼續
    next();
    return;
  }
  
  try {
    // 有 token 則驗證
    const secret = process.env.JWT_SECRET || 'your-default-secret';
    const decoded = jwt.verify(token, secret);
    if (typeof decoded === 'object' && decoded !== null) {
      req.user = decoded as UserJwtPayload;
    }
    next();
  } catch (error) {
    // token 無效，直接繼續（不拋出錯誤）
    next();
  }
};

/**
 * 角色驗證中間件
 * @param roles - 允許的角色列表
 * @returns Express 中間件
 */
export const authorizeRoles = (roles: string[]): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('未經授權的訪問'));
      return;
    }

    // 檢查用戶是否擁有任一所需角色
    const userRoles = req.user.roles || [];
    const hasRequiredRole = roles.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      next(new UnauthorizedError('沒有權限執行此操作'));
      return;
    }
    
    next();
  };
};

/**
 * 角色要求中間件
 * 別名，與路由中使用的名稱保持一致
 */
export const requireRole = authorizeRoles;

/**
 * 進階認證中間件
 * 支援更靈活的認證選項
 * @param options - 認證選項
 * @returns Express 中間件
 */
export const authenticateWithOptions = (options: AuthMiddlewareOptions = {}): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const {
      required = true,
      allowTemp = true,
      permissions = [],
      roles = []
    } = options;

    // 嘗試驗證 token
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      if (required) {
        next(new UnauthorizedError('缺少認證令牌'));
        return;
      } else {
        next();
        return;
      }
    }

    try {
      const secret = process.env.JWT_SECRET || process.env.JWT_SECURITY;
      if (!secret) {
        throw new Error('JWT secret not configured');
      }

      const decoded = jwt.verify(token, secret);
      
      if (typeof decoded === 'object' && decoded !== null) {
        const payload = decoded as UserJwtPayload;
        req.user = payload;
        req.isTemporary = payload.isTemp || false;

        // 檢查是否允許臨時用戶
        if (payload.isTemp && !allowTemp) {
          next(new ForbiddenError('此操作需要正式用戶身份'));
          return;
        }

        // 檢查角色權限
        if (roles.length > 0) {
          const userRoles = payload.roles || [];
          const hasRequiredRole = roles.some(role => userRoles.includes(role));
          if (!hasRequiredRole) {
            next(new ForbiddenError('缺少必要的角色權限'));
            return;
          }
        }

        // 檢查具體權限
        if (permissions.length > 0) {
          const userPermissions = payload.permissions || [];
          const hasAllPermissions = permissions.every(perm =>
            userPermissions.includes(`${perm.resource}:${perm.action}`)
          );
          if (!hasAllPermissions) {
            next(new ForbiddenError('缺少必要的操作權限'));
            return;
          }
        }
      }

      next();
    } catch (error) {
      if (required) {
        if (error instanceof jwt.TokenExpiredError) {
          next(new UnauthorizedError('認證令牌已過期'));
          return;
        } else if (error instanceof jwt.JsonWebTokenError) {
          next(new UnauthorizedError('無效的認證令牌'));
          return;
        } else {
          next(new UnauthorizedError('認證失敗'));
          return;
        }
      } else {
        // 非必需認證時忽略錯誤
        next();
        return;
      }
    }
  };
};

/**
 * 權限檢查中間件
 * @param permissions - 需要的權限列表
 * @returns Express 中間件
 */
export const requirePermissions = (permissions: PermissionOptions[]): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('未經授權的訪問'));
      return;
    }

    const userPermissions = req.user.permissions || [];
    const hasAllPermissions = permissions.every(perm => {
      // 檢查是否允許臨時用戶
      if (req.isTemporary && !perm.allowTemp) {
        return false;
      }
      return userPermissions.includes(`${perm.resource}:${perm.action}`);
    });

    if (!hasAllPermissions) {
      next(new ForbiddenError('缺少必要的操作權限'));
      return;
    }

    next();
  };
};

/**
 * 僅限正式用戶中間件
 * 禁止臨時用戶訪問
 */
export const requireFormalUser = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    return next(new UnauthorizedError('未經授權的訪問'));
  }

  if (req.isTemporary) {
    next(new ForbiddenError('此操作僅限正式註冊用戶'));
    return;
  }

  next();
};

/**
 * 需要已驗證郵件的用戶中間件
 * 檢查用戶是否已驗證郵件
 */
export const requireEmailVerified = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    return next(new UnauthorizedError('未經授權的訪問'));
  }

  if (req.isTemporary) {
    next(new ForbiddenError('此操作需要正式用戶身份'));
    return;
  }

  if (!req.user.email_verified) {
    next(new ForbiddenError('此操作需要驗證電子郵件'));
    return;
  }

  next();
};

/**
 * 需要活躍用戶中間件
 * 檢查用戶是否處於活躍狀態
 */
export const requireActiveUser = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    return next(new UnauthorizedError('未經授權的訪問'));
  }

  if (req.user.is_active === false) {
    next(new ForbiddenError('帳戶已被停用'));
    return;
  }

  next();
};

/**
 * 需要完整個人資料中間件
 * 禁止臨時用戶訪問，要求完成註冊流程
 * 別名：與原 JavaScript 版本保持一致
 */
export const requireCompleteProfile = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    return next(new UnauthorizedError('未經授權的訪問'));
  }

  if (req.isTemporary || req.user.isTemp) {
    next(new ForbiddenError('請完成個人資料註冊'));
    return;
  }

  next();
};

/**
 * Session 認證中間件
 * 檢查 Passport session 認證
 */
export const authenticateSession = (req: Request, res: Response, next: NextFunction): void => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    // 檢查是否為臨時用戶 - 使用新的類型檢測邏輯
    const user = req.user as AnyUser;
    req.isTemporary = isTemporaryUser(user);

    next();
  } else {
    next(new UnauthorizedError('未經授權的訪問'));
  }
};

/**
 * 組合認證中間件
 * 支援 JWT 和 Session 兩種認證方式
 */
export const authenticateAny = (req: Request, res: Response, next: NextFunction): void => {
  // 首先嘗試 JWT 認證
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    authenticateJWT(req, res, next);
    return;
  }

  // 如果沒有 JWT，嘗試 Session 認證
  if (req.isAuthenticated && req.isAuthenticated()) {
    authenticateSession(req, res, next);
    return;
  }

  next(new UnauthorizedError('未經授權的訪問'));
};
