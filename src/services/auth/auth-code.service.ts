/**
 * Authorization Code 服務
 * 實現 OAuth 2.0 Authorization Code Flow
 * 用於安全地交換 token，避免 token 暴露在 URL
 */

import crypto from 'crypto';
import redis from '../database/redis.service';

/** Auth Code 資料結構 */
interface AuthCodeData {
  token: string;
  state: string;
  createdAt: number;
  used: boolean;
}

/** Auth Code 有效期限（秒） */
const AUTH_CODE_EXPIRY_SECONDS = 300; // 5 分鐘

/** Auth Code Redis key 前綴 */
const AUTH_CODE_PREFIX = 'auth_code:';

/**
 * 生成 authorization code
 * @returns 隨機的 authorization code
 */
export const generateAuthCode = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * 儲存 authorization code 與對應的 token
 * @param code - Authorization code
 * @param token - JWT token
 * @param state - OAuth state
 */
export const storeAuthCode = async (
  code: string,
  token: string,
  state: string
): Promise<void> => {
  const data: AuthCodeData = {
    token,
    state,
    createdAt: Date.now(),
    used: false
  };

  await redis.setex(
    `${AUTH_CODE_PREFIX}${code}`,
    AUTH_CODE_EXPIRY_SECONDS,
    JSON.stringify(data)
  );
};

/**
 * 交換 authorization code 獲取 token
 * @param code - Authorization code
 * @returns token 或 null（如果 code 無效或已使用）
 */
export const exchangeAuthCode = async (
  code: string
): Promise<{ token: string; state: string } | null> => {
  const key = `${AUTH_CODE_PREFIX}${code}`;
  const dataStr = await redis.get(key);

  if (!dataStr) {
    return null;
  }

  try {
    const data: AuthCodeData = JSON.parse(dataStr);

    // 檢查是否已使用（防止重放攻擊）
    if (data.used) {
      // 如果已使用，刪除並返回 null（可能是攻擊）
      await redis.del(key);
      console.warn('Auth code replay attempt detected:', code.substring(0, 8) + '...');
      return null;
    }

    // 標記為已使用並立即刪除
    await redis.del(key);

    return {
      token: data.token,
      state: data.state
    };
  } catch (error) {
    console.error('Failed to parse auth code data:', error);
    await redis.del(key);
    return null;
  }
};

/**
 * 驗證 authorization code 是否存在且有效（不消耗）
 * @param code - Authorization code
 * @returns 是否有效
 */
export const isValidAuthCode = async (code: string): Promise<boolean> => {
  const key = `${AUTH_CODE_PREFIX}${code}`;
  const exists = await redis.exists(key);
  return exists === 1;
};

export const authCodeService = {
  generateAuthCode,
  storeAuthCode,
  exchangeAuthCode,
  isValidAuthCode
};

export default authCodeService;
