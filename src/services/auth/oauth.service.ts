/**
 * OAuth 認證服務
 * 處理 Google OAuth 認證整合
 */

import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { prisma } from '../database/prisma.service';
import { getUserType, getUserId, AnyUser } from '../../utils/user-type-detection';
import { createOAuthState, encodeOAuthState } from '../../utils/oauth-state';
import { isValidRedirectUri, validateRedirectParam, isCustomScheme } from '../../utils/redirect-validation';
import { oauthNonceService } from './oauth-nonce.service';

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

// 檢查是否啟用 OAuth 直接建立正式用戶
const isOAuthDirectLoginEnabled = (): boolean => {
  const value = process.env.OAUTH_DIRECT_LOGIN;
  return value === 'true' || value === '1';
};

// OAuth 配置選項（只在配置可用時創建）
const getAuthOptions = (): AuthOptions | null => {
  if (!isOAuthConfigured()) {
    console.warn('OAuth 配置初始化失敗，將在實際使用時重試: 缺少必要的 OAuth 環境變數: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL');
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
  console.log('SerializeUser:', user);

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
    console.log('DeserializeUser:', sessionData);

    let foundUser;

    if (sessionData.type === 'user') {
      // 查找正式用戶
      const userResult = await authService.findUserByExternalId(sessionData.id);
      if (userResult.success && userResult.data) {
        foundUser = userResult.data;
      } else {
        console.warn('Failed to find user by external_id:', sessionData.id);
        foundUser = null;
      }
    } else if (sessionData.type === 'temp') {
      // 查找臨時用戶
      foundUser = await prisma.temp_users.findUnique({
        where: { id: parseInt(sessionData.id) }
      });
    }

    console.log('DeserializeUser result:', foundUser);
    done(null, foundUser as unknown as Express.User);
  } catch (error) {
    console.error('Deserialize user error:', error);
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
    authOptions,
    async (accessToken: string, refreshToken: string, profile: Profile, done) => {
      try {
        console.log('Google OAuth profile:', profile);

        if (!profile.emails || profile.emails.length === 0) {
          throw new Error('No email found in Google profile');
        }

        const email = profile.emails[0].value;
        const photoUrl = profile.photos && profile.photos.length > 0 ? profile.photos[0].value : undefined;

        // 首先檢查是否存在正式用戶
        const userResult = await authService.findUserByEmail(email);

        console.log('Found user result:', userResult);

        if (userResult && userResult.success && userResult.data) {
          console.log('用戶已註冊，返回正式用戶');
          return done(null, userResult.data.user as unknown as Express.User);
        }

        // 檢查是否啟用直接建立正式用戶
        if (isOAuthDirectLoginEnabled()) {
          console.log('OAUTH_DIRECT_LOGIN 已啟用，直接建立正式用戶');
          const newUserResult = await authService.createUserFromOAuth({
            googleId: profile.id,
            email,
            name: profile.displayName,
            photoUrl
          });

          if (newUserResult.success && newUserResult.data) {
            console.log('正式用戶已建立:', newUserResult.data);
            return done(null, newUserResult.data as unknown as Express.User);
          } else {
            return done(new Error('Failed to create user from OAuth'), false);
          }
        }

        // 原有流程：如果沒有正式用戶，則檢查或創建臨時用戶
        const tempUserResult = await authService.findOrCreateTempUser({
          googleId: profile.id,
          email,
          name: profile.displayName,
          photoUrl
        });

        console.log('臨時用戶:', tempUserResult);

        if (tempUserResult.success && tempUserResult.data) {
          return done(null, tempUserResult.data as unknown as Express.User);
        } else {
          return done(new Error('Failed to create temp user'), false);
        }
      } catch (error) {
        console.error('Google OAuth 策略錯誤:', error);
        return done(error, false);
      }
    }
  ));
} else {
  console.warn('⚠️ 跳過 Google OAuth 策略設定');
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
  if (!isOAuthConfigured()) {
    res.status(500).json({ error: 'OAuth not configured' });
    return;
  }

  // 從前端請求中取得 state 參數
  // 前端可以傳入: ?state=xxx (已編碼的 state) 或 ?redirectUrl=xxx&source=xxx
  // App 可以傳入: ?redirect_uri=xxx (custom scheme URL)
  let stateParam = req.query.state as string | undefined;

  if (!stateParam) {
    // 如果沒有 state，從 redirectUrl/redirect_uri 和 source 建立新的 state
    // 支援 redirect_uri（App 慣用）和 redirectUrl（Web 慣用）
    const redirectUri = validateRedirectParam(req.query.redirect_uri);
    const redirectUrlParam = validateRedirectParam(req.query.redirectUrl);
    const redirectUrl = redirectUrlParam || redirectUri || '/dashboard';

    // 安全性檢查：驗證 redirect URI 是否在白名單中
    if (!isValidRedirectUri(redirectUrl)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REDIRECT_URI',
          message: 'The provided redirect URI is not allowed'
        }
      });
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
      console.error('Failed to store OAuth nonce:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'NONCE_STORAGE_FAILED',
          message: 'Failed to initialize OAuth flow'
        }
      });
      return;
    }

    stateParam = encodeOAuthState(state);
  }

  // 動態呼叫 passport.authenticate 並傳入 state
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    state: stateParam
  })(req, res, next);
};

/**
 * Google 認證回調中間件
 * 處理 Google OAuth 回調
 */
export const authenticateGoogleCallback = isOAuthConfigured()
  ? passport.authenticate('google', {
    failureRedirect: (process.env.FRONTEND_URL || 'http://localhost:3000') + '/auth/failure'
  })
  : (req: any, res: any, next: any) => {
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