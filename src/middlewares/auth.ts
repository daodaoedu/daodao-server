/**
 * 身份驗證中間件
 * 負責驗證使用者身份
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../utils/errorHandler';

// 擴展 Express 的 Request 類型
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
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
    req.user = decoded;
    
    next();
  } catch (error) {
    return next(new UnauthorizedError('無效的認證令牌'));
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
    
    if (!roles.includes(req.user.role)) {
      return next(new UnauthorizedError('沒有權限執行此操作'));
    }
    
    next();
  };
};
