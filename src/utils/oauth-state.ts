/**
 * OAuth State 工具函數
 * 處理 OAuth 流程中的 state 參數編解碼
 * 用於防止 CSRF 攻擊和保存登入後跳轉 URL
 */

import crypto from 'crypto';

/**
 * OAuth State 結構
 */
export interface OAuthState {
  /** 登入後要跳轉的 URL */
  redirectUrl: string;
  /** 來源網站 */
  source: 'website' | 'app' | 'admin';
  /** 時間戳（防重放攻擊） */
  timestamp: number;
  /** 隨機字串（防 CSRF） */
  nonce: string;
}

/**
 * State 驗證結果
 */
export interface StateValidationResult {
  valid: boolean;
  state?: OAuthState;
  error?: string;
}

/** State 有效期限（10分鐘，與前端一致） */
const STATE_EXPIRY_MS = 10 * 60 * 1000;

/**
 * 生成 nonce 隨機字串
 * @param length - 字串長度，預設 16
 * @returns 隨機字串
 */
export const generateNonce = (length = 16): string => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * 建立 OAuth State
 * @param redirectUrl - 登入後跳轉 URL
 * @param source - 來源網站
 * @returns OAuthState 物件
 */
export const createOAuthState = (
  redirectUrl: string,
  source: 'website' | 'app' | 'admin' = 'app'
): OAuthState => {
  return {
    redirectUrl: redirectUrl || '/dashboard',
    source,
    timestamp: Date.now(),
    nonce: generateNonce()
  };
};

/**
 * 編碼 OAuth State 為 Base64 字串
 * @param state - OAuthState 物件
 * @returns Base64 編碼字串
 */
export const encodeOAuthState = (state: OAuthState): string => {
  try {
    const jsonString = JSON.stringify(state);
    return Buffer.from(jsonString, 'utf-8').toString('base64url');
  } catch (error) {
    console.error('Failed to encode OAuth state:', error);
    throw new Error('Failed to encode OAuth state');
  }
};

/**
 * 解碼 Base64 字串為 OAuth State
 * @param encodedState - Base64 編碼字串
 * @returns OAuthState 物件或 null
 */
export const decodeOAuthState = (encodedState: string): OAuthState | null => {
  try {
    const jsonString = Buffer.from(encodedState, 'base64url').toString('utf-8');
    const state = JSON.parse(jsonString) as OAuthState;
    return state;
  } catch (error) {
    console.error('Failed to decode OAuth state:', error);
    return null;
  }
};

/**
 * 驗證 OAuth State
 * @param encodedState - Base64 編碼字串
 * @param options - 驗證選項
 * @returns 驗證結果
 */
export const validateOAuthState = (
  encodedState: string,
  options: {
    /** 是否檢查時效性，預設 true */
    checkExpiry?: boolean;
    /** 自訂有效期限（毫秒） */
    expiryMs?: number;
  } = {}
): StateValidationResult => {
  const { checkExpiry = true, expiryMs = STATE_EXPIRY_MS } = options;

  // 解碼 state
  const state = decodeOAuthState(encodedState);
  if (!state) {
    return { valid: false, error: 'Invalid state format' };
  }

  // 驗證必要欄位
  if (!state.redirectUrl || !state.source || !state.timestamp || !state.nonce) {
    return { valid: false, error: 'Missing required state fields' };
  }

  // 驗證 source 值
  if (state.source !== 'website' && state.source !== 'app' && state.source !== 'admin') {
    return { valid: false, error: 'Invalid source value' };
  }

  // 驗證時效性
  if (checkExpiry) {
    const now = Date.now();
    const age = now - state.timestamp;
    if (age > expiryMs) {
      return { valid: false, error: 'State has expired' };
    }
    // 允許最多 30 秒的 clock skew（裝置時鐘偏差常超過 5 秒）
    const CLOCK_SKEW_TOLERANCE_MS = 30 * 1000;
    if (age < -CLOCK_SKEW_TOLERANCE_MS) {
      return { valid: false, error: 'Invalid timestamp' };
    }
  }

  return { valid: true, state };
};

/**
 * 從 state 取得前端回調 URL
 * @param state - OAuthState 物件
 * @param frontendUrl - 前端基礎 URL
 * @returns 完整的回調 URL
 */
export const getCallbackUrl = (
  state: OAuthState,
  frontendUrl: string
): string => {
  const encodedState = encodeOAuthState(state);
  return `${frontendUrl}/auth/callback?state=${encodedState}`;
};

/**
 * 從 state 取得最終跳轉 URL
 * @param state - OAuthState 物件
 * @param frontendUrl - 前端基礎 URL
 * @returns 最終跳轉 URL
 */
export const getFinalRedirectUrl = (
  state: OAuthState,
  frontendUrl: string
): string => {
  // 如果 redirectUrl 是相對路徑，加上 frontendUrl
  if (state.redirectUrl.startsWith('/')) {
    return `${frontendUrl}${state.redirectUrl}`;
  }
  // 如果是完整 URL，直接返回
  return state.redirectUrl;
};

export const oauthStateUtils = {
  generateNonce,
  createOAuthState,
  encodeOAuthState,
  decodeOAuthState,
  validateOAuthState,
  getCallbackUrl,
  getFinalRedirectUrl
};

export default oauthStateUtils;
