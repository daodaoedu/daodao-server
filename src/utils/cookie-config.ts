/**
 * Cookie 設定工具
 * 處理認證 Cookie 的設定和清除
 */

import { Response, CookieOptions } from 'express';

/** Auth Cookie 名稱 */
export const AUTH_COOKIE_NAME = 'auth_token';

/** Cookie 過期時間（7天，單位：毫秒） */
export const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * 取得 Cookie 設定選項
 * @param options - 額外選項
 * @returns Cookie 選項
 */
export const getCookieOptions = (options: {
  /** Cookie 過期時間（毫秒） */
  maxAge?: number;
} = {}): CookieOptions => {
  const {
    maxAge = COOKIE_MAX_AGE_MS
  } = options;

  const cookieOptions: CookieOptions = {
    httpOnly: true,           // 防止 JavaScript 存取
    secure: true,             // 必須 HTTPS（sameSite: 'none' 要求）
    sameSite: 'none',         // 允許跨站請求（前後端分離部署需要）
    path: '/',                // 全站可用
    maxAge                    // 過期時間
  };

  // 設定跨域 Cookie domain（dev/prod 均適用）
  if (process.env.COOKIE_DOMAIN) {
    cookieOptions.domain = process.env.COOKIE_DOMAIN; // e.g., '.daodao.so'
  }

  return cookieOptions;
};

/**
 * 設定認證 Cookie
 * @param res - Express Response
 * @param token - JWT Token
 * @param options - 額外選項
 */
export const setAuthCookie = (
  res: Response,
  token: string,
  options: {
    /** Cookie 過期時間（毫秒） */
    maxAge?: number;
  } = {}
): void => {
  const cookieOptions = getCookieOptions(options);
  res.cookie(AUTH_COOKIE_NAME, token, cookieOptions);
};

/** 所有可能的認證相關 Cookie 名稱（向下相容） */
const AUTH_COOKIE_NAMES = [
  AUTH_COOKIE_NAME,  // 'auth_token' - 主要使用
  'access_token',    // 舊版本可能使用
  'refresh_token',   // 舊版本可能使用
  'session'          // Session cookie
] as const;

/**
 * 清除認證 Cookie
 * 復用 getCookieOptions 以確保 domain, path 等屬性與設定時一致
 * 清除所有可能的認證相關 cookies 以確保完全登出
 * @param res - Express Response
 */
export const clearAuthCookie = (res: Response): void => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { maxAge, ...clearOptions } = getCookieOptions();

  // 清除所有可能的認證相關 cookies
  for (const cookieName of AUTH_COOKIE_NAMES) {
    res.clearCookie(cookieName, clearOptions);
  }
};

/**
 * 從 Request 取得認證 Token
 * 優先從 Cookie 取，備援從 Authorization header 取
 * @param req - Express Request (需要 cookie-parser 中間件)
 * @returns Token 或 undefined
 */
export const getAuthToken = (req: {
  cookies?: Record<string, string>;
  headers: { authorization?: string };
}): string | undefined => {
  // 1. 優先從 Cookie 取
  const cookieToken = req.cookies?.[AUTH_COOKIE_NAME];
  if (cookieToken) {
    return cookieToken;
  }

  // 2. 備援從 Authorization header 取
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }

  return undefined;
};

export const cookieUtils = {
  AUTH_COOKIE_NAME,
  COOKIE_MAX_AGE_MS,
  getCookieOptions,
  setAuthCookie,
  clearAuthCookie,
  getAuthToken
};

export default cookieUtils;
