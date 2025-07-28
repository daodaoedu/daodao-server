/**
 * 認證控制器
 * 處理用戶認證相關的請求
 */

import { Request, Response } from 'express';
import { jwtService } from '../services/jwt.service';
import { emailService } from '../services/auth/email.service';
import { authService } from '../services/auth/auth.service';
import { prisma } from '../services/database/prisma.service';
import { 
  AuthResponse
} from '../types/auth.types';
import { 
  BadRequestError, 
  UnauthorizedError, 
  NotFoundError
} from '../utils/error-handler';
import { asyncWrapper } from '../utils/error-handler';

/**
 * 用戶登入
 * POST /api/auth/login
 * 注意：當前版本僅支援 OAuth 登入，密碼登入需要 schema 更新
 */
export const login = asyncWrapper(async (_req: Request, _res: Response) => {
  // 目前 Prisma schema 不包含密碼字段，暫時只支援 OAuth
  // TODO: 更新 schema 以支援密碼認證
  throw new UnauthorizedError('請使用 Google 登入');
});

/**
 * 用戶註冊
 * POST /api/auth/register
 * 注意：當前版本暫不支援註冊，需要 schema 更新
 */
export const register = asyncWrapper(async (_req: Request, _res: Response) => {
  // 目前 Prisma schema 不包含密碼字段，暫時禁用註冊功能
  // TODO: 更新 schema 以支援完整的用戶註冊
  throw new BadRequestError('註冊功能暫時不可用，請使用 Google 登入');
});

/**
 * Google OAuth 成功回調
 * GET /api/auth/google/callback
 */
export const googleCallback = asyncWrapper(async (req: Request, res: Response) => {
  const user = req.user as { googleID?: string; _id?: string; id?: number; external_id?: string; roleId?: number; name?: string };
  
  if (!user) {
    throw new UnauthorizedError('Google 認證失敗');
  }
  
  // 參考 JavaScript 版本的邏輯
  const { id, external_id, name } = user;
  let _id: string | number = id || 0;
  let isUserExit = false;

  if (external_id) {
    _id = external_id;
    isUserExit = true;
  }
  
  const isTemp = !isUserExit;

  // 獲取用戶角色和權限（如果是正式用戶）
  let userRoles: Array<{ name: string }> = [];
  let userPermissions: Array<{ name: string }> = [];
  
  if (!isTemp && id) {
    try {
      userRoles = await authService.getUserRoles(id);
      userPermissions = await authService.getUserPermissions(id);
    } catch (error) {
      console.error('Failed to fetch user roles/permissions:', error);
      // 繼續執行，但不會有權限
    }
  }

  const payload = { 
    id: id || 0, 
    _id: typeof _id === 'string' ? _id : undefined, 
    username: name || '', 
    isTemp,
    roles: userRoles.map(role => role.name),
    permissions: userPermissions.map(permission => permission.name)
  };
  
  const token = jwtService.generateToken(payload);
  const url = `${process.env.FRONTEND_URL}/auth/callback?token=${token}`;

  res.redirect(url);
});

/**
 * 登出
 * POST /api/auth/logout
 */
export const logout = asyncWrapper(async (req: Request, res: Response) => {
  // JWT 是無狀態的，客戶端只需要刪除本地 token
  // 如果需要服務端登出，可以實現 token 黑名單機制
  
  const response: AuthResponse = {
    success: true,
    message: '登出成功'
  };

  res.json(response);
});

/**
 * 刷新 token
 * POST /api/auth/refresh
 */
export const refreshToken = asyncWrapper(async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const currentToken = authHeader && authHeader.split(' ')[1];

  if (!currentToken) {
    throw new UnauthorizedError('缺少認證令牌');
  }

  const newToken = jwtService.refreshToken(currentToken);
  
  if (!newToken) {
    throw new UnauthorizedError('令牌刷新失敗');
  }

  const response: AuthResponse = {
    success: true,
    message: '令牌刷新成功',
    token: newToken
  };

  res.json(response);
});

/**
 * 獲取當前用戶資訊
 * GET /api/auth/me
 */
export const getCurrentUser = asyncWrapper(async (req: Request, res: Response) => {
  // 從 JWT 中獲取用戶信息
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    throw new UnauthorizedError('缺少認證令牌');
  }
  
  const decoded = jwtService.verifyToken(token);
  if (decoded.error) {
    throw new UnauthorizedError('無效的認證令牌');
  }
  
  const userId = decoded.id;
  const isTemporary = decoded.isTemp || false;
  
  if (!userId) {
    throw new UnauthorizedError('未找到用戶資訊');
  }

  let user;
  let contact;

  // 獲取用戶角色和權限
  let userRoles: Array<{ name: string }> = [];
  let userPermissions: Array<{ name: string }> = [];

  if (isTemporary) {
    // 臨時用戶
    user = await prisma.temp_users.findUnique({
      where: { id: userId }
    });
    if (!user) {
      throw new NotFoundError('臨時用戶不存在');
    }
  } else {
    // 正式用戶
    user = await authService.findUserByExternalId(decoded._id || '');
    if (!user) {
      throw new NotFoundError('用戶不存在');
    }
    contact = user.contacts;
    
    // 獲取用戶角色和權限
    try {
      userRoles = await authService.getUserRoles(user.id);
      userPermissions = await authService.getUserPermissions(user.id);
    } catch (error) {
      console.error('Failed to fetch user roles/permissions:', error);
      // 繼續執行，但不會有權限
    }
  }

  const response: AuthResponse = {
    success: true,
    message: '獲取用戶資訊成功',
    user: {
      id: user.id,
      nickname: isTemporary ? undefined : (user as { nickname?: string }).nickname,
      email: contact?.email || (user as { email?: string }).email,
      name: (user as { name?: string; nickname?: string }).name || (user as { nickname?: string }).nickname,
      photo_url: (user as { photo_url?: string }).photo_url || contact?.photo_url || '',
      is_active: isTemporary ? true : ((user as { is_active?: boolean }).is_active || true),
      email_verified: isTemporary ? false : ((user as { email_verified?: boolean }).email_verified || false),
      email_verified_at: isTemporary ? null : ((user as { email_verified_at?: Date | null }).email_verified_at || null),
      roles: userRoles.map(role => role.name),
      permissions: userPermissions.map(permission => permission.name)
    },
    isTemporary
  };

  res.json(response);
});

/**
 * 請求密碼重設
 * POST /api/auth/forgot-password
 */
export const forgotPassword = asyncWrapper(async (_req: Request, _res: Response) => {
  // 目前不支援密碼重設功能
  throw new BadRequestError('密碼重設功能暫時不可用');
});

/**
 * 確認密碼重設
 * POST /api/auth/reset-password
 */
export const resetPassword = asyncWrapper(async (_req: Request, _res: Response) => {
  // 目前不支援密碼重設功能
  throw new BadRequestError('密碼重設功能暫時不可用');
});

/**
 * 驗證電子郵件
 * POST /api/auth/verify-email
 */
export const verifyEmail = asyncWrapper(async (req: Request, res: Response) => {
  const { token, email } = req.body;
  
  if (!token) {
    throw new BadRequestError('驗證令牌為必填欄位');
  }

  if (!email) {
    throw new BadRequestError('電子郵件為必填欄位');
  }

  try {
    const cleanedToken = token.replace('Bearer', '').trim();
    
    const decoded = jwtService.verifyToken(cleanedToken);
    console.log("decoded", decoded);

    if (decoded.error) {
      throw new BadRequestError('無效的驗證令牌');
    }

    // 使用 external_id 查找用戶
    const user = await authService.findUserByExternalId(decoded._id || '');
    console.log("user", user);

    if (!user) {
      throw new NotFoundError('用戶不存在');
    }

    // 檢查是否已驗證
    if (user.email_verified) {
      throw new BadRequestError('郵件已驗證');
    }

    // 更新用戶郵件驗證狀態
    await authService.verifyUserEmail(user.id);
    console.log("user_verification_updated", user.id);
    
    // 發送歡迎郵件
    const contact = user.contacts;
    if (contact?.email) {
      await emailService.sendWelcomeEmail(contact.email, user.nickname || 'User');
    }

    res.json({
      success: true,
      message: '郵件驗證成功'
    });
  } catch (err) {
    console.error("verifyEmail error:", err);
    throw err;
  }
});

export const authController = {
  login,
  register,
  googleCallback,
  logout,
  refreshToken,
  getCurrentUser,
  forgotPassword,
  resetPassword,
  verifyEmail
};

export default authController;