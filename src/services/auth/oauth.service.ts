/**
 * OAuth 認證服務
 * 處理 Google OAuth 認證整合
 */

import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import { authService } from './auth.service';
import { prisma } from '../database/prisma.service';
import { getUserType, getUserId, AnyUser } from '../../utils/user-type-detection';

interface AuthOptions {
  clientID: string;
  clientSecret: string;
  callbackURL: string;
}

interface GoogleProfile extends Profile {
  emails: Array<{ value: string; verified: boolean }>;
  photos: Array<{ value: string }>;
}

// 驗證必要的環境變數
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_CALLBACK_URL) {
  throw new Error('Missing required OAuth environment variables: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL');
}

// OAuth 配置選項
const AUTH_OPTIONS: AuthOptions = {
  clientID: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  callbackURL: process.env.GOOGLE_CALLBACK_URL!
};

// 檢查 OAuth 是否已配置
const isOAuthConfigured = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_CALLBACK_URL;

/**
 * 序列化用戶
 * 將用戶物件轉換為可存儲的標識符
 */
passport.serializeUser((user: any, done) => {
  console.log('SerializeUser:', user);
  
  const userId = getUserId(user as AnyUser);
  if (userId) {
    // 使用新的用戶類型檢測邏輯
    const userType = getUserType(user as AnyUser);
    if (userType !== 'unknown') {
      done(null, { id: userId, type: userType });
    } else {
      done(new Error('Unknown user type'), null);
    }
  } else if (user.external_id) {
    // PostgreSQL 正式用戶（備用識別）
    done(null, { id: user.external_id, type: 'user' });
  } else {
    done(new Error('Invalid user object'), null);
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
      foundUser = await authService.findUserByExternalId(sessionData.id);
    } else if (sessionData.type === 'temp') {
      // 查找臨時用戶
      foundUser = await prisma.temp_users.findUnique({
        where: { id: parseInt(sessionData.id) }
      });
    }
    
    console.log('DeserializeUser result:', foundUser);
    done(null, foundUser as any);
  } catch (error) {
    console.error('Deserialize user error:', error);
    done(error, null);
  }
});

/**
 * Google OAuth 策略
 * 處理 Google 認證回調 - 使用 Prisma
 */
if (isOAuthConfigured) {
  passport.use('google', new GoogleStrategy(
    AUTH_OPTIONS,
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
      
      if (userResult) {
        console.log('用戶已註冊，返回正式用戶');
        return done(null, userResult.user as unknown as Express.User);
      }

      // 如果沒有正式用戶，則檢查或創建臨時用戶
      const tempUser = await authService.findOrCreateTempUser({
        googleId: profile.id,
        email,
        name: profile.displayName,
        photoUrl
      });
      
      console.log('臨時用戶:', tempUser);
      
      return done(null, tempUser as unknown as Express.User);
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
 */
export const authenticateGoogle = isOAuthConfigured 
  ? passport.authenticate('google', {
      scope: ['profile', 'email']
    })
  : (req: any, res: any, next: any) => {
      res.status(500).json({ error: 'OAuth not configured' });
    };

/**
 * Google 認證回調中間件
 * 處理 Google OAuth 回調
 */
export const authenticateGoogleCallback = isOAuthConfigured
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