/**
 * Cookie 設定工具
 * 處理認證 Cookie 的設定和清除
 */

import { Response, CookieOptions } from 'express';

/** Auth Cookie 預設名稱（正式站） */
export const DEFAULT_AUTH_COOKIE_NAME = 'auth_token';

const AUTH_COOKIE_NAME_PATTERN = /^[A-Za-z0-9_-]+$/;

/**
 * 取得本環境的 Auth Cookie 名稱
 * dev 與正式站共用 COOKIE_DOMAIN（.daodao.so），名稱必須依環境分開，
 * 否則在一個環境登入會覆蓋另一個環境的 Cookie。
 * 以 AUTH_COOKIE_NAME 環境變數設定，未設定時使用 auth_token。
 */
export const getAuthCookieName = (): string => {
  const configured = process.env.AUTH_COOKIE_NAME?.trim();
  if (!configured) return DEFAULT_AUTH_COOKIE_NAME;
  if (!AUTH_COOKIE_NAME_PATTERN.test(configured)) {
    throw new Error('AUTH_COOKIE_NAME may only contain letters, digits, "_" and "-"');
  }
  return configured;
};

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
  res.cookie(getAuthCookieName(), token, cookieOptions);
};

/** 舊版本可能使用的認證相關 Cookie 名稱（向下相容） */
const LEGACY_AUTH_COOKIE_NAMES = [
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

  // 只清本環境的 Auth Cookie：另一個環境的同網域 Cookie 不能動，否則會把對方登出
  for (const cookieName of [getAuthCookieName(), ...LEGACY_AUTH_COOKIE_NAMES]) {
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
  const cookieToken = req.cookies?.[getAuthCookieName()];
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

/** Quiz Claim Cookie 名稱 */
export const QUIZ_CLAIM_COOKIE_NAME = 'quiz_claim';

/** Quiz Claim Cookie 過期時間（24 小時） */
export const QUIZ_CLAIM_MAX_AGE_MS = 24 * 60 * 60 * 1000;

/**
 * 設定 Quiz Claim Cookie
 * @param res - Express Response
 * @param claimToken - 認領 token (UUID)
 */
export const setQuizClaimCookie = (res: Response, claimToken: string): void => {
  const cookieOptions = getCookieOptions({ maxAge: QUIZ_CLAIM_MAX_AGE_MS });
  res.cookie(QUIZ_CLAIM_COOKIE_NAME, claimToken, cookieOptions);
};

/**
 * 清除 Quiz Claim Cookie
 * @param res - Express Response
 */
export const clearQuizClaimCookie = (res: Response): void => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { maxAge, ...clearOptions } = getCookieOptions();
  res.clearCookie(QUIZ_CLAIM_COOKIE_NAME, clearOptions);
};

export const cookieUtils = {
  DEFAULT_AUTH_COOKIE_NAME,
  getAuthCookieName,
  COOKIE_MAX_AGE_MS,
  getCookieOptions,
  setAuthCookie,
  clearAuthCookie,
  getAuthToken,
  QUIZ_CLAIM_COOKIE_NAME,
  QUIZ_CLAIM_MAX_AGE_MS,
  setQuizClaimCookie,
  clearQuizClaimCookie
};

export default cookieUtils;
