/**
 * 身份驗證中間件
 * 負責驗證使用者身份
 */

import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { UnauthorizedError } from '../utils/error-handler';

// 定義 JWT payload 的類型
interface UserJwtPayload extends JwtPayload {
  id: number;
  username?: string;
  email?: string;
  isTemp?: boolean;
  roles?: string[];
}

/**
 * JWT 身份驗證中間件
 * @param req - Express 請求對象
 * @param res - Express 響應對象
 * @param next - Express 下一個中間件
 */
export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  // 從請求頭中獲取 token
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return next(new UnauthorizedError('缺少認證令牌'));
  }
  
  try {
    // 驗證 token
    const secret = process.env.JWT_SECRET || 'your-default-secret';
    const decoded = jwt.verify(token, secret);
    
    // 將解碼後的用戶信息添加到請求對象中
    if (typeof decoded === 'object' && decoded !== null) {
      req.user = decoded as UserJwtPayload;
    } else {
      throw new Error('Invalid token payload');
    }
    
    next();
  } catch (error) {
    return next(new UnauthorizedError('無效的認證令牌'));
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
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    // 沒有 token，直接繼續
    return next();
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
export const authorizeRoles = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('未經授權的訪問'));
    }
    
    // 檢查用戶是否擁有任一所需角色
    const userRoles = req.user.roles || [];
    const hasRequiredRole = roles.some(role => userRoles.includes(role));
    
    if (!hasRequiredRole) {
      return next(new UnauthorizedError('沒有權限執行此操作'));
    }
    
    next();
  };
};

/**
 * 角色要求中間件
 * 別名，與路由中使用的名稱保持一致
 */
export const requireRole = authorizeRoles;
