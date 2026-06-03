/**
 * JWT 服務
 * 處理 JWT Token 的生成和驗證
 */

import * as jwt from 'jsonwebtoken';
import { logger } from '@/services/logging';

interface JwtPayload {
  id: number;
  _id?: string;
  username?: string;
  email?: string;
  isTemp?: boolean;
  roles?: string[];
  [key: string]: unknown;
}

interface JwtVerifyResult {
  error?: string;
  id?: number;
  _id?: string;
  username?: string;
  email?: string;
  isTemp?: boolean;
  roles?: string[];
  [key: string]: unknown;
}

const JWT_EXPIRATION = '7d';

// 移除立即檢查，改為在函數中檢查
const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return secret;
};

/**
 * 生成 JWT Token
 * @param payload - JWT payload 數據
 * @returns 生成的 JWT token
 */
export const generateToken = (payload: JwtPayload): string => {
  try {
    const secret = getJwtSecret();
    return jwt.sign(payload, secret, { 
      expiresIn: JWT_EXPIRATION
    });
  } catch (error) {
    logger.error('Token generation failed', { message: error instanceof Error ? error.message : error });
    if (error instanceof Error && error.message === 'JWT_SECRET environment variable is required') {
      throw error;
    }
    throw new Error('Token generation failed');
  }
};

/**
 * 驗證 JWT Token
 * @param token - 需要驗證的 token
 * @returns 解碼後的 payload 或錯誤信息
 */
export const verifyToken = (token: string): JwtVerifyResult => {
  try {
    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret) as JwtPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      logger.warn('Token verification failed: expired');
      return { error: "Token has expired" };
    } else if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('Token verification failed: invalid', { message: error.message });
      return { error: "Token is invalid" };
    } else {
      logger.error('Token verification failed', { message: error instanceof Error ? error.message : error });
      if (error instanceof Error && error.message === 'JWT_SECRET environment variable is required') {
        throw error;
      }
      return { error: "Token verification failed" };
    }
  }
};

/**
 * 刷新 Token
 * @param token - 現有的 token
 * @returns 新的 token 或錯誤信息
 */
export const refreshToken = (token: string): string | null => {
  const decoded = verifyToken(token);
  if (decoded.error) {
    return null;
  }

  // 移除 JWT 的默認字段，只保留 payload
  const payload = { ...decoded };
  delete payload.iat;
  delete payload.exp;
  delete payload.error;
  
  // 添加一個隨機值以確保新 token 與原 token 不同
  const refreshPayload = {
    ...payload,
    refreshedAt: Date.now()
  };
  
  return generateToken(refreshPayload as JwtPayload);
};

export const jwtService = {
  generateToken,
  verifyToken,
  refreshToken
};

export default jwtService;