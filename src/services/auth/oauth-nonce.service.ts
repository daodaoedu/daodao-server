/**
 * OAuth Nonce 服務
 * 用於 CSRF 保護驗證
 */

import redis from '../database/redis.service';

/** Nonce 有效期限（秒） */
const NONCE_EXPIRY_SECONDS = 600; // 10 分鐘

/** Nonce Redis key 前綴 */
const NONCE_PREFIX = 'oauth_nonce:';

/** Nonce 資料結構 */
interface NonceData {
  redirectUrl: string;
  source: 'website' | 'app' | 'admin';
  createdAt: number;
}

/**
 * 儲存 OAuth nonce
 * @param nonce - Nonce 值
 * @param redirectUrl - 重定向 URL
 * @param source - 來源（website 或 app）
 */
export const storeNonce = async (
  nonce: string,
  redirectUrl: string,
  source: 'website' | 'app' | 'admin'
): Promise<void> => {
  const data: NonceData = {
    redirectUrl,
    source,
    createdAt: Date.now()
  };

  await redis.setex(
    `${NONCE_PREFIX}${nonce}`,
    NONCE_EXPIRY_SECONDS,
    JSON.stringify(data)
  );
};

/**
 * 驗證並消耗 OAuth nonce
 * @param nonce - Nonce 值
 * @returns Nonce 資料或 null（如果無效）
 */
export const verifyAndConsumeNonce = async (
  nonce: string
): Promise<NonceData | null> => {
  const key = `${NONCE_PREFIX}${nonce}`;
  const dataStr = await redis.get(key);

  if (!dataStr) {
    return null;
  }

  try {
    const data: NonceData = JSON.parse(dataStr);

    // 刪除 nonce（一次性使用）
    await redis.del(key);

    return data;
  } catch (error) {
    console.error('Failed to parse nonce data:', error);
    await redis.del(key);
    return null;
  }
};

/**
 * 檢查 nonce 是否存在（不消耗）
 * @param nonce - Nonce 值
 * @returns 是否存在
 */
export const nonceExists = async (nonce: string): Promise<boolean> => {
  const key = `${NONCE_PREFIX}${nonce}`;
  const exists = await redis.exists(key);
  return exists === 1;
};

export const oauthNonceService = {
  storeNonce,
  verifyAndConsumeNonce,
  nonceExists
};

export default oauthNonceService;
