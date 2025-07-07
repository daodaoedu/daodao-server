/**
 * OAuth 認證服務
 * 處理 Google OAuth 認證整合
 */

import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import { User, Contact, TempUser } from '../../models/index';

interface AuthOptions {
  clientID: string;
  clientSecret: string;
  callbackURL: string;
}

interface GoogleProfile extends Profile {
  emails: Array<{ value: string; verified: boolean }>;
  photos: Array<{ value: string }>;
}

// OAuth 配置選項
const AUTH_OPTIONS: AuthOptions = {
  clientID: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  callbackURL: process.env.GOOGLE_CALLBACK_URL || ''
};

// 驗證必要的環境變數
if (!AUTH_OPTIONS.clientID || !AUTH_OPTIONS.clientSecret || !AUTH_OPTIONS.callbackURL) {
  throw new Error('Missing required OAuth environment variables');
}

/**
 * 序列化用戶
 * 將用戶物件轉換為可存儲的標識符
 */
passport.serializeUser((user: any, done) => {
  console.log('SerializeUser:', user);
  
  if (user.id) {
    // PostgreSQL 用戶（正式用戶或臨時用戶）
    const userType = user.dataValues ? 'user' : 'temp';
    done(null, { id: user.id, type: userType });
  } else if (user.external_id) {
    // PostgreSQL 正式用戶（備用識別）
    done(null, { id: user.external_id, type: 'user' });
  } else {
    done(new Error('Invalid user object'), null);
  }
});

/**
 * 反序列化用戶
 * 根據存儲的標識符恢復用戶物件
 */
passport.deserializeUser(async (sessionData: { id: string; type: 'temp' | 'user' }, done) => {
  try {
    console.log('DeserializeUser:', sessionData);
    
    let foundUser;
    
    if (sessionData.type === 'user') {
      // 查找正式用戶
      foundUser = await User.findByPk(sessionData.id);
    } else if (sessionData.type === 'temp') {
      // 查找臨時用戶
      foundUser = await TempUser.findByPk(sessionData.id);
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
 * 處理 Google 認證回調
 */
passport.use(new GoogleStrategy(
  AUTH_OPTIONS,
  async (accessToken: string, refreshToken: string, profile: Profile, done) => {
    try {
      console.log('Google OAuth profile:', profile);
      
      if (!profile.emails || profile.emails.length === 0) {
        throw new Error('No email found in Google profile');
      }
      
      const email = profile.emails[0].value;
      
      // 首先檢查是否存在正式用戶
      const foundContact = await Contact.findOne({
        where: { email },
        include: [{
          model: User,
          as: 'user',
          required: false
        }]
      });
      
      console.log('Found contact:', foundContact);
      
      if (foundContact && foundContact.user) {
        console.log('用戶已註冊，返回正式用戶');
        return done(null, foundContact.user as Express.User);
      }

      // 如果沒有正式用戶，則檢查或創建 PostgreSQL 臨時用戶
      let tempUser = await TempUser.findOne({ 
        where: { google_id: profile.id }
      });
      
      if (!tempUser) {
        console.log('新用戶，創建臨時資料');
        
        const tempUserData = {
          google_id: profile.id,
          email,
          name: profile.displayName,
          photo_url: profile.photos?.[0]?.value || '',
          created_at: new Date(),
          updated_at: new Date()
        };
        
        try {
          tempUser = await TempUser.create(tempUserData);
        } catch (saveError: any) {
          if (saveError.name === 'SequelizeUniqueConstraintError') {
            // 如果是唯一約束錯誤，重新取得該臨時用戶
            console.log('臨時用戶已存在，正在重新取得');
            tempUser = await TempUser.findOne({ 
              where: { google_id: profile.id }
            });
          } else {
            throw saveError;
          }
        }
      } else {
        console.log('找到現有的臨時用戶');
        
        // 更新臨時用戶資訊
        await tempUser.update({
          name: profile.displayName,
          photo_url: profile.photos?.[0]?.value || '',
          updated_at: new Date()
        });
      }

      if (!tempUser) {
        return done(new Error('無法創建或找到用戶'), false);
      }
      
      return done(null, tempUser as any);
    } catch (error) {
      console.error('Google OAuth 策略錯誤:', error);
      return done(error, false);
    }
  }
));

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
export const authenticateGoogle = passport.authenticate('google', {
  scope: ['profile', 'email']
});

/**
 * Google 認證回調中間件
 * 處理 Google OAuth 回調
 */
export const authenticateGoogleCallback = passport.authenticate('google', {
  failureRedirect: process.env.FRONTEND_URL + '/auth/failure'
});

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