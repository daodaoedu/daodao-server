/**
 * OAuth 認證服務
 * 處理 Google OAuth 認證整合
 */

import passport from 'passport';
import { Strategy as GoogleStrategy, Profile, StrategyOptions as GoogleStrategyOptions } from 'passport-google-oauth20';
import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { prisma } from '../database/prisma.service';
import { getUserType, getUserId, AnyUser } from '../../utils/user-type-detection';
import { createOAuthState, encodeOAuthState, validateOAuthState } from '../../utils/oauth-state';
import { isValidRedirectUri, validateRedirectParam, isCustomScheme } from '../../utils/redirect-validation';
import { oauthNonceService } from './oauth-nonce.service';
import { redisOAuthStateStore } from './oauth-redis-state-store.service';
import { loggerService } from '../logging/logger.service';

interface AuthOptions {
  clientID: string;
  clientSecret: string;
  callbackURL: string;
}

interface GoogleProfile extends Profile {
  emails: Array<{ value: string; verified: boolean }>;
  photos: Array<{ value: string }>;
}

// 檢查 OAuth 環境變數是否可用
const isOAuthConfigured = () => {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_CALLBACK_URL);
};

// OAuth 配置選項（只在配置可用時創建）
const getAuthOptions = (): AuthOptions | null => {
  if (!isOAuthConfigured()) {
    loggerService.warn('OAuth 配置初始化失敗，將在實際使用時重試: 缺少必要的 OAuth 環境變數: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL');
    return null;
  }

  return {
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: process.env.GOOGLE_CALLBACK_URL!
  };
};

/**
 * 序列化用戶
 * 將用戶物件轉換為可存儲的標識符
 */
passport.serializeUser((user: any, done) => {
  loggerService.debug('SerializeUser', { id: user.external_id || user.id, type: user.external_id ? 'user' : 'temp' });

  // 優先檢查是否為 PostgreSQL 正式用戶（有 external_id）
  if (user.external_id) {
    // PostgreSQL 正式用戶 - external_id 是 UUID 字串
    done(null, { id: user.external_id, type: 'user' });
  } else {
    // 其他用戶類型（temp_users 等）
    const userId = getUserId(user as AnyUser);
    if (userId) {
      const userType = getUserType(user as AnyUser);
      if (userType !== 'unknown') {
        // temp_users 的 ID 保持為數字字串
        done(null, { id: String(userId), type: userType });
      } else {
        done(new Error('Unknown user type'), null);
      }
    } else {
      done(new Error('Invalid user object'), null);
    }
  }
});

/**
 * 反序列化用戶
 * 根據存儲的標識符恢復用戶物件 - 使用 Prisma
 */
passport.deserializeUser(async (sessionData: { id: string; type: 'temp' | 'user' }, done) => {
  try {
    loggerService.debug('DeserializeUser', { id: sessionData.id, type: sessionData.type });

    let foundUser;

    if (sessionData.type === 'user') {
      // 查找正式用戶
      const userResult = await authService.findUserByExternalId(sessionData.id);
      if (userResult.success && userResult.data) {
        foundUser = userResult.data;
      } else {
        loggerService.warn('DeserializeUser - user not found', { externalId: sessionData.id });
        foundUser = null;
      }
    } else if (sessionData.type === 'temp') {
      // 查找臨時用戶
      foundUser = await prisma.temp_users.findUnique({
        where: { id: parseInt(sessionData.id) }
      });
    }

    loggerService.debug('DeserializeUser result', { found: !!foundUser, id: foundUser ? (foundUser as any).id : null, type: sessionData.type });
    done(null, foundUser as unknown as Express.User);
  } catch (error) {
    loggerService.error('DeserializeUser error', { error: error instanceof Error ? error.message : String(error) });
    done(error, null);
  }
});

/**
 * Google OAuth 策略
 * 處理 Google 認證回調 - 使用 Prisma
 */
const authOptions = getAuthOptions();
if (authOptions) {
  passport.use('google', new GoogleStrategy(
    {
      ...authOptions,
      store: redisOAuthStateStore,
    } as unknown as GoogleStrategyOptions,
    async (accessToken: string, refreshToken: string, profile: Profile, done) => {
      try {
        loggerService.debug('Google OAuth profile received', { profileId: profile.id, displayName: profile.displayName });

        if (!profile.emails || profile.emails.length === 0) {
          throw new Error('No email found in Google profile');
        }

        const email = profile.emails[0].value;
        const photoUrl = profile.photos && profile.photos.length > 0 ? profile.photos[0].value : undefined;

        // 首先檢查是否存在正式用戶
        const userResult = await authService.findUserByEmail(email);

        if (userResult && userResult.success && userResult.data) {
          loggerService.info('Google OAuth - existing user found', { profileId: profile.id });
          // 已存在的用戶不是新用戶
          const user = userResult.data.user as Express.User & { _isNewUser?: boolean };
          user._isNewUser = false;
          return done(null, user);
        }

        // 如果沒有正式用戶，則檢查或創建臨時用戶
        const tempUserResult = await authService.findOrCreateTempUser({
          googleId: profile.id,
          email,
          name: profile.displayName,
          photoUrl
        });

        if (tempUserResult.success && tempUserResult.data) {
          const userData = tempUserResult.data as { user: unknown; isNewUser: boolean };
          const user = userData.user as Express.User & { _isNewUser?: boolean };
          user._isNewUser = userData.isNewUser;
          loggerService.info('Google OAuth - temp user', { profileId: profile.id, isNewUser: userData.isNewUser });
          return done(null, user);
        } else {
          return done(new Error('Failed to create temp user'), false);
        }
      } catch (error) {
        loggerService.error('Google OAuth strategy error', { error: error instanceof Error ? error.message : String(error) });
        return done(error, false);
      }
    }
  ));
} else {
  loggerService.warn('跳過 Google OAuth 策略設定：OAuth 未配置');
}

/**
 * 初始化 Passport
 * 配置 Passport 中間件
 */
export const initializePassport = () => {
  return passport.initialize();
};

/**
 * 初始化 Passport Session
 * 配置 Passport Session 支援
 */
export const initializePassportSession = () => {
  return passport.session();
};

/**
 * Google 認證中間件
 * 開始 Google OAuth 流程
 * 支援從前端傳入 state 參數，包含 redirectUrl 等資訊
 */
export const authenticateGoogle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // 檢測 Chrome 預載請求（Speculative Loading）
  // 預載請求會帶有 Sec-Purpose 或 Purpose header
  // Chrome 可能傳送 'prefetch;prerender' 等複合值，使用 includes() 比對
  const secPurpose = String(req.headers['sec-purpose'] || req.headers['purpose'] || '');
  if (secPurpose.includes('prefetch') || secPurpose.includes('prerender')) {
    loggerService.debug('OAuth - ignoring speculative prefetch/prerender request');
    res.status(204).end();
    return;
  }

  // 診斷 log：記錄 OAuth 請求來源
  loggerService.info('OAuth google - request initiated', {
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    hasState: !!req.query.state,
    hasRedirectUri: !!req.query.redirect_uri,
    sessionID: (req as unknown as { sessionID: string }).sessionID || 'none'
  });

  if (!isOAuthConfigured()) {
    res.status(500).json({ error: 'OAuth not configured' });
    return;
  }

  // 設置防止預載和緩存的 headers
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  // 從前端請求中取得 state 參數
  // 前端可以傳入: ?state=xxx (已編碼的 state) 或 ?redirectUrl=xxx&source=xxx
  // App 可以傳入: ?redirect_uri=xxx (custom scheme URL)
  let stateParam = req.query.state as string | undefined;

  if (stateParam) {
    // 前端傳入了 state 參數，需要解析並存儲 nonce 到 Redis
    const validationResult = validateOAuthState(stateParam);
    if (!validationResult.valid || !validationResult.state) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const reason = validationResult.error === 'State has expired' ? 'state_expired' : 'invalid_state';
      loggerService.warn('OAuth initiation - invalid state from frontend', {
        error: validationResult.error,
        reason,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      res.redirect(`${frontendUrl}/auth/error?reason=${reason}`);
      return;
    }

    const existingState = validationResult.state;

    // 驗證 redirect URL
    const frontendUrlForError = process.env.FRONTEND_URL || 'http://localhost:3000';
    if (!isValidRedirectUri(existingState.redirectUrl)) {
      res.redirect(`${frontendUrlForError}/auth/error?reason=invalid_redirect_uri`);
      return;
    }

    // 儲存前端傳入的 nonce 到 Redis（用於 CSRF 保護驗證）
    try {
      await oauthNonceService.storeNonce(
        existingState.nonce,
        existingState.redirectUrl,
        existingState.source
      );
    } catch (error) {
      loggerService.error('Failed to store OAuth nonce from frontend state', { error: error instanceof Error ? error.message : String(error) });
      res.redirect(`${frontendUrlForError}/auth/error?reason=server_error`);
      return;
    }
  } else {
    // 如果沒有 state，從 redirectUrl/redirect_uri 和 source 建立新的 state
    // 支援 redirect_uri（App 慣用）和 redirectUrl（Web 慣用）
    const redirectUri = validateRedirectParam(req.query.redirect_uri);
    const redirectUrlParam = validateRedirectParam(req.query.redirectUrl);
    const redirectUrl = redirectUrlParam || redirectUri || '/dashboard';

    const frontendUrlForError = process.env.FRONTEND_URL || 'http://localhost:3000';

    // 安全性檢查：驗證 redirect URI 是否在白名單中
    if (!isValidRedirectUri(redirectUrl)) {
      res.redirect(`${frontendUrlForError}/auth/error?reason=invalid_redirect_uri`);
      return;
    }

    // 根據 URL 類型決定 source
    const isAppScheme = isCustomScheme(redirectUrl);
    const source = (req.query.source as 'website' | 'app') || (isAppScheme ? 'app' : 'website');

    const state = createOAuthState(redirectUrl, source);

    // 儲存 nonce 到 Redis（用於 CSRF 保護驗證）
    try {
      await oauthNonceService.storeNonce(state.nonce, redirectUrl, source);
    } catch (error) {
      loggerService.error('Failed to store OAuth nonce', { error: error instanceof Error ? error.message : String(error) });
      res.redirect(`${frontendUrlForError}/auth/error?reason=server_error`);
      return;
    }

    stateParam = encodeOAuthState(state);
  }

  // 動態呼叫 passport.authenticate 並傳入 state
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    state: stateParam,
    prompt: 'select_account'  // 強制顯示帳號選擇頁面
  })(req, res, next);
};

/**
 * Google 認證回調中間件
 * 處理 Google OAuth 回調
 */
export const authenticateGoogleCallback = isOAuthConfigured()
  ? (req: Request, res: Response, next: NextFunction): void => {
      passport.authenticate('google', (err: Error | null, user: Express.User | false, info: unknown) => {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

        if (err) {
          loggerService.error('OAuth callback - passport error', {
            error: err.message,
            stack: err.stack,
            userAgent: req.get('User-Agent'),
            ip: req.ip,
            stateParam: req.query.state ? String(req.query.state).substring(0, 20) + '...' : 'missing'
          });
          res.redirect(`${frontendUrl}/auth/error?reason=passport_error`);
          return;
        }

        if (!user) {
          loggerService.warn('OAuth callback - authentication failed (no user)', {
            info: JSON.stringify(info),
            userAgent: req.get('User-Agent'),
            ip: req.ip,
            hasState: !!req.query.state,
            hasCode: !!req.query.code,
            sessionExists: !!(req as unknown as { session: unknown }).session,
            sessionID: (req as unknown as { sessionID: string }).sessionID || 'none'
          });
          res.redirect(`${frontendUrl}/auth/error?reason=auth_failed`);
          return;
        }

        req.user = user;
        next();
      })(req, res, next);
    }
  : (req: Request, res: Response, _next: NextFunction): void => {
      res.status(500).json({ error: 'OAuth not configured' });
    };

/**
 * OAuth 服務導出
 */
export const oauthService = {
  initializePassport,
  initializePassportSession,
  authenticateGoogle,
  authenticateGoogleCallback
};

export default oauthService;