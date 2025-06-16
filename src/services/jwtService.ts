/**
 * JWT 服務
 * 處理 JWT Token 的生成和驗證
 */

import jwt, { SignOptions } from 'jsonwebtoken';

interface JwtPayload {
  id: number;
  username?: string;
  email?: string;
  isTemp?: boolean;
  roles?: string[];
  [key: string]: any;
}

interface JwtVerifyResult {
  error?: string;
  id?: number;
  username?: string;
  email?: string;
  isTemp?: boolean;
  roles?: string[];
  [key: string]: any;
}

const JWT_SECRET = process.env.JWT_SECRET || process.env.JWT_SECURITY;
const JWT_EXPIRATION = '7d';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

/**
 * 生成 JWT Token
 * @param payload - JWT payload 數據
 * @returns 生成的 JWT token
 */
export const generateToken = (payload: JwtPayload): string => {
  try {
    return jwt.sign(payload, JWT_SECRET as string, { 
      expiresIn: JWT_EXPIRATION
    });
  } catch (error) {
    console.error('Token generation failed:', error instanceof Error ? error.message : error);
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
    console.log('verifyToken_token', token);
    
    const decoded = jwt.verify(token, JWT_SECRET as string) as JwtPayload;
    console.log('verifyToken', decoded);
  
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

  // 移除 JWT 的默認字段
  const { iat, exp, ...payload } = decoded;
  
  return generateToken(payload as JwtPayload);
};

export const jwtService = {
  generateToken,
  verifyToken,
  refreshToken
};

export default jwtService;