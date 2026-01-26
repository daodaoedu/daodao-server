/**
 * 認證控制器
 * 處理用戶認證相關的請求
 */

import { Request, Response } from 'express';
import { jwtService } from '../services/jwt.service';
import { emailService } from '../services/email/email.service';
import { authService } from '../services/auth/auth.service';
import { prisma } from '../services/database/prisma.service';
import { createSuccessResponse } from '../utils/response-helper';
import {
  BadRequestError,
  UnauthorizedError,
  NotFoundError
} from '../middleware/error.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import {
  logoutResponseSchema,
  refreshTokenResponseSchema,
  getCurrentUserResponseSchema,
  verifyEmailResponseSchema
} from '../validators/auth.validators';
import { setAuthCookie, clearAuthCookie, getAuthToken } from '../utils/cookie-config';
import {
  createOAuthState,
  encodeOAuthState,
  validateOAuthState
} from '../utils/oauth-state';

/**
 * 用戶登入
 * POST /api/auth/login
 * 注意：當前版本僅支援 OAuth 登入，密碼登入需要 schema 更新
 */
export const login = asyncHandler(async (_req: Request, _res: Response) => {
  // 目前 Prisma schema 不包含密碼字段，暫時只支援 OAuth
  // TODO: 更新 schema 以支援密碼認證
  throw new UnauthorizedError('請使用 Google 登入');
});

/**
 * 用戶註冊
 * POST /api/auth/register
 * 注意：當前版本暫不支援註冊，需要 schema 更新
 */
export const register = asyncHandler(async (_req: Request, _res: Response) => {
  // 目前 Prisma schema 不包含密碼字段，暫時禁用註冊功能
  // TODO: 更新 schema 以支援完整的用戶註冊
  throw new BadRequestError('註冊功能暫時不可用，請使用 Google 登入');
});

/**
 * Google OAuth 成功回調
 * GET /api/auth/google/callback
 * 設定 HTTP-only Cookie 並重定向到前端
 */
export const googleCallback = asyncHandler(async (req: Request, res: Response) => {
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
      const rolesResponse = await authService.getUserRoles(id);
      const permissionsResponse = await authService.getUserPermissions(id);

      if (rolesResponse.success) {
        userRoles = rolesResponse.data;
      }
      if (permissionsResponse.success) {
        userPermissions = permissionsResponse.data;
      }
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

  // 設定 HTTP-only Cookie
  setAuthCookie(res, token);

  // 解析 state 參數以驗證並取得前端傳來的原始資訊
  const stateParam = req.query.state as string | undefined;
  let finalEncodedState: string;

  if (stateParam) {
    // 驗證前端傳來的 state
    const validationResult = validateOAuthState(stateParam);

    if (validationResult.valid && validationResult.state) {
      // 驗證成功，保留前端的原始 nonce 和 source
      // 這樣前端可以驗證 nonce 是否匹配，防止 CSRF 攻擊
      const originalState = validationResult.state;

      // 原封不動地使用前端傳來的 state（包含原始 nonce 和 source）
      finalEncodedState = stateParam;

      console.log('OAuth callback - preserving original state:', {
        nonce: originalState.nonce,
        source: originalState.source,
        redirectUrl: originalState.redirectUrl
      });
    } else {
      // 驗證失敗，記錄錯誤但仍創建預設 state
      console.warn('OAuth state validation failed:', validationResult.error);

      // 創建預設 state
      const defaultState = createOAuthState('/dashboard', 'app');
      finalEncodedState = encodeOAuthState(defaultState);
    }
  } else {
    // 沒有 state 參數，創建預設 state
    console.warn('No state parameter provided in OAuth callback');
    const defaultState = createOAuthState('/dashboard', 'app');
    finalEncodedState = encodeOAuthState(defaultState);
  }

  // 重定向到前端 callback 頁面
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const url = `${frontendUrl}/auth/callback?state=${finalEncodedState}`;

  res.redirect(url);
});

/**
 * 登出
 * POST /api/auth/logout
 * 清除認證 Cookie
 */
export const logout = asyncHandler(async (_req: Request, res: Response) => {
  // 清除認證 Cookie
  clearAuthCookie(res);

  // 如果需要服務端登出，可以實現 token 黑名單機制

  const response = createSuccessResponse({
    message: '登出成功'
  });

  // 驗證與回傳響應
  const validatedResponse = logoutResponseSchema.parse(response);
  res.json(validatedResponse);
});

/**
 * 刷新 token
 * POST /api/auth/refresh
 * 支援從 Cookie 或 Authorization header 取得 Token
 */
export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  // 從 Cookie 或 Authorization header 取得 token
  const currentToken = getAuthToken(req);

  if (!currentToken) {
    throw new UnauthorizedError('缺少認證令牌');
  }

  const newToken = jwtService.refreshToken(currentToken);

  if (!newToken) {
    throw new UnauthorizedError('令牌刷新失敗');
  }

  // 更新 Cookie
  setAuthCookie(res, newToken);

  const response = createSuccessResponse({ token: newToken });

  // 驗證與回傳響應
  const validatedResponse = refreshTokenResponseSchema.parse(response);
  res.json(validatedResponse);
});

/**
 * 獲取當前用戶資訊
 * GET /api/v1/auth/me
 * 支援從 Cookie 或 Authorization header 取得 Token
 */
export const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  // 從 Cookie 或 Authorization header 取得 token
  const token = getAuthToken(req);

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
    const userResponse = await authService.findUserByExternalId(decoded._id || '');
    if (!userResponse.success || !userResponse.data) {
      throw new NotFoundError('用戶不存在');
    }
    user = userResponse.data;
    contact = user.contacts;
    
    // 獲取用戶角色和權限
    try {
      const rolesResponse = await authService.getUserRoles(user.id);
      const permissionsResponse = await authService.getUserPermissions(user.id);
      
      if (rolesResponse.success) {
        userRoles = rolesResponse.data;
      }
      if (permissionsResponse.success) {
        userPermissions = permissionsResponse.data;
      }
    } catch (error) {
      console.error('Failed to fetch user roles/permissions:', error);
      // 繼續執行，但不會有權限
    }
  }

  const response = createSuccessResponse({
    user: {
      id: isTemporary ? user.id.toString() : ((user as { external_id?: string }).external_id || ''),
      nickname: isTemporary ? undefined : (user as { nickname?: string }).nickname,
      email: contact?.email || (user as { email?: string }).email,
      name: (user as { name?: string; nickname?: string }).name || (user as { nickname?: string }).nickname,
      photo_url: (user as { photo_url?: string }).photo_url || contact?.photo_url || '',
      is_active: isTemporary ? true : ((user as { is_active?: boolean }).is_active || true),
      email_verified: isTemporary ? false : ((user as { email_verified?: boolean }).email_verified || false),
      email_verified_at: isTemporary ? null : ((user as { email_verified_at?: Date | null }).email_verified_at?.toISOString() || null),
      roles: userRoles.map(role => role.name),
      permissions: userPermissions.map(permission => permission.name)
    },
    isTemporary
  });

  // 驗證與回傳響應
  const validatedResponse = getCurrentUserResponseSchema.parse(response);
  res.json(validatedResponse);
});

/**
 * 請求密碼重設
 * POST /api/auth/forgot-password
 */
export const forgotPassword = asyncHandler(async (_req: Request, _res: Response) => {
  // 目前不支援密碼重設功能
  throw new BadRequestError('密碼重設功能暫時不可用');
});

/**
 * 確認密碼重設
 * POST /api/auth/reset-password
 */
export const resetPassword = asyncHandler(async (_req: Request, _res: Response) => {
  // 目前不支援密碼重設功能
  throw new BadRequestError('密碼重設功能暫時不可用');
});

/**
 * 驗證電子郵件
 * POST /api/auth/verify-email
 */
export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
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
    const userResponse = await authService.findUserByExternalId(decoded._id || '');
    console.log("userResponse", userResponse);

    if (!userResponse.success || !userResponse.data) {
      throw new NotFoundError('用戶不存在');
    }

    const user = userResponse.data;

    // 檢查是否已驗證
    if (user.verified) {
      throw new BadRequestError('郵件已驗證');
    }

    // 更新用戶郵件驗證狀態
    const verifyResponse = await authService.verifyUserEmail(user.id);
    if (!verifyResponse.success) {
      throw new BadRequestError('郵件驗證失敗');
    }
    console.log("user_verification_updated", user.id);
    
    // 發送歡迎郵件
    const contact = user.contacts;
    if (contact?.email) {
      await emailService.sendWelcomeEmail(contact.email, {
        name: user.nickname || 'User',
        hasCompletedQuiz: false
      });
    }

    const response = createSuccessResponse({
      message: '郵件驗證成功'
    });

    // 驗證與回傳響應
    const validatedResponse = verifyEmailResponseSchema.parse(response);
    res.json(validatedResponse);
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