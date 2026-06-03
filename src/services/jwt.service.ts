/**
 * JWT 服務
 * 處理 JWT Token 的生成和驗證
 */

import * as jwt from 'jsonwebtoken';

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

const JWT_EXPIRATION = '24h';
const JWT_REFRESH_EXPIRATION = '30d';

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
 * @param expiresIn - token 有效期（預設 24h）
 * @returns 生成的 JWT token
 */
export const generateToken = (payload: JwtPayload, expiresIn: string = JWT_EXPIRATION): string => {
  try {
    const secret = getJwtSecret();
    return jwt.sign(payload, secret, {
      expiresIn
    } as jwt.SignOptions);
  } catch (error) {
    console.error('Token generation failed:', error instanceof Error ? error.message : error);
    // Re-throw the original error message if it's from getJwtSecret
    if (error instanceof Error && error.message === 'JWT_SECRET environment variable is required') {
      throw error;
    }
    throw new Error('Token generation failed');
  }
};

/**
 * 生成 Refresh Token（30d 有效期）
 * @param payload - JWT payload 數據
 * @returns 生成的 refresh token
 */
export const generateRefreshToken = (payload: JwtPayload): string => {
  return generateToken(payload, JWT_REFRESH_EXPIRATION);
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
      console.error('Token verification failed: Token has expired');
      return { error: "Token has expired" };
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.error('Token verification failed:', error.message);
      return { error: "Token is invalid" };
    } else {
      console.error('Token verification failed:', error instanceof Error ? error.message : error);
      // Re-throw the original error if it's from getJwtSecret
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
  generateRefreshToken,
  verifyToken,
  refreshToken
};

export default jwtService;