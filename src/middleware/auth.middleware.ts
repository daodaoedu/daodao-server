/**
 * 身份驗證中間件
 * 處理用戶身份驗證和權限檢查
 */

import { Request, Response, NextFunction } from 'express';
import { jwtService } from '@/services/jwtService';

// Express Request 類型已在 types/declarations/express.d.ts 中定義

/**
 * 身份驗證中間件
 * 檢查請求中的 JWT token 並驗證用戶身份
 */
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    res.status(401).json({
      success: false,
      message: "Authorization header is required"
    });
    return;
  }

  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : authHeader;

  if (!token) {
    res.status(401).json({
      success: false,
      message: "Token is required"
    });
    return;
  }

  try {
    const decoded = jwtService.verifyToken(token);
    
    if (decoded.error) {
      res.status(401).json({
        success: false,
        message: decoded.error
      });
      return;
    }

    // 將用戶信息附加到請求對象
    req.user = {
      id: decoded.id!,
      username: decoded.username || undefined,
      email: decoded.email || undefined,
      isTemp: decoded.isTemp || false,
      roles: decoded.roles || ['user']
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      message: "Token is invalid"
    });
  }
};

/**
 * 要求完整個人資料的中間件
 * 檢查用戶是否已完成個人資料設置
 */
export const requireCompleteProfile = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required"
    });
    return;
  }

  if (req.user.isTemp) {
    res.status(403).json({
      success: false,
      message: "Please complete your profile registration"
    });
    return;
  }

  next();
};

/**
 * 角色檢查中間件
 * 檢查用戶是否具有指定的角色
 */
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required"
      });
      return;
    }

    const userRoles = req.user.roles || ['user'];
    const hasRole = allowedRoles.some(role => userRoles.includes(role));

    if (!hasRole) {
      res.status(403).json({
        success: false,
        message: "Insufficient permissions"
      });
      return;
    }

    next();
  };
};

/**
 * 可選的身份驗證中間件
 * 如果提供了 token 則驗證，否則繼續處理
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    next();
    return;
  }

  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : authHeader;

  if (!token) {
    next();
    return;
  }

  try {
    const decoded = jwtService.verifyToken(token);
    
    if (!decoded.error) {
      req.user = {
        id: decoded.id!,
        username: decoded.username || undefined,
        email: decoded.email || undefined,
        isTemp: decoded.isTemp || false,
        roles: decoded.roles || ['user']
      };
    }
  } catch (error) {
    // 忽略錯誤，繼續處理
    console.warn('Optional auth failed:', error);
  }

  next();
};

/**
 * 檢查資源所有權的中間件
 * 確保用戶只能操作自己的資源
 */
export const requireOwnership = (userIdField: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required"
      });
      return;
    }

    // 從請求體、查詢參數或路由參數中獲取用戶ID
    const resourceUserId = req.body[userIdField] || 
                          req.query[userIdField] || 
                          req.params[userIdField];

    if (resourceUserId && parseInt(resourceUserId) !== req.user.id) {
      res.status(403).json({
        success: false,
        message: "Access denied: You can only access your own resources"
      });
      return;
    }

    next();
  };
};

export default {
  authenticate,
  requireCompleteProfile,
  requireRole,
  optionalAuth,
  requireOwnership
};