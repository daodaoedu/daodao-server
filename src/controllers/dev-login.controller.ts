/**
 * dev 環境測試登入控制器
 * POST /api/v1/auth/dev-login
 *
 * 只在 dev 環境掛載（見 routes/dev-login.routes.ts 的 isDevLoginEnabled）。
 * 讓 agent 做部署後冒煙時不需真人 Google 登入即可取得 temp／正式用戶身份。
 */

import { timingSafeEqual } from 'crypto';
import { Request, Response } from 'express';
import { jwtService } from '../services/jwt.service';
import { authService } from '../services/auth/auth.service';
import { prisma } from '../services/database/prisma.service';
import { createSuccessResponse } from '../utils/response-helper';
import { asyncHandler, NotFoundError, UnauthorizedError } from '../middleware/error.middleware';
import { setAuthCookie } from '../utils/cookie-config';
import { loggerService } from '../services/logging/logger.service';
import {
  DEV_LOGIN_SECRET_HEADER,
  devLoginResponseSchema,
  type DevLoginRequest
} from '../validators/dev-login.validators';

/** temp_users.google_id 前綴，避免與真實 Google ID 碰撞 */
export const DEV_LOGIN_GOOGLE_ID_PREFIX = 'dev-login:';

/** 常數時間比對，長度不同直接視為不符，不洩漏 secret 資訊 */
const secretMatches = (provided: string | undefined, expected: string): boolean => {
  if (!provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
};

/** 驗證 X-Dev-Login-Secret；expected 由路由工廠在掛載時注入，不在請求時讀 env */
export const requireDevLoginSecret = (expected: string) =>
  (req: Request, _res: Response, next: (err?: unknown) => void): void => {
    const provided = req.get(DEV_LOGIN_SECRET_HEADER);
    if (!secretMatches(provided, expected)) {
      loggerService.warn('dev-login secret mismatch', { ip: req.ip });
      next(new UnauthorizedError('dev-login 驗證失敗'));
      return;
    }
    next();
  };

interface DevLoginResult {
  token: string;
  isTemporary: boolean;
  user: { id: string; email: string; name?: string | null; nickname?: string | null };
}

const issueTempLogin = async (email: string, name: string | undefined): Promise<DevLoginResult> => {
  // 同 email 重複呼叫回同一列（AC-09），不論該列是否來自真實 Google 登入
  let tempUser = await prisma.temp_users.findFirst({ where: { email } });
  if (!tempUser) {
    const created = await authService.findOrCreateTempUser({
      googleId: `${DEV_LOGIN_GOOGLE_ID_PREFIX}${email}`,
      email,
      name: name || email.split('@')[0] || 'dev-login'
    });
    tempUser = (created.data?.user ?? null) as typeof tempUser;
  }
  if (!tempUser) {
    throw new NotFoundError('臨時用戶建立失敗');
  }

  const token = jwtService.generateToken({
    id: tempUser.id,
    username: tempUser.name || '',
    isTemp: true,
    roles: [],
    permissions: []
  });

  return {
    token,
    isTemporary: true,
    user: { id: tempUser.id.toString(), email: tempUser.email, name: tempUser.name }
  };
};

const issueUserLogin = async (email: string): Promise<DevLoginResult> => {
  const found = await authService.findUserByEmail(email);
  const user = found.data?.user as
    | { id: number; external_id: string; nickname?: string | null }
    | undefined;
  if (!user) {
    throw new NotFoundError('找不到此 email 的正式用戶');
  }

  // 與 googleCallback 相同來源取角色／權限，失敗時退化為無權限但仍可登入
  let roles: Array<{ name: string }> = [];
  let permissions: Array<{ name: string }> = [];
  try {
    const [rolesResponse, permissionsResponse] = await Promise.all([
      authService.getUserRoles(user.id),
      authService.getUserPermissions(user.id)
    ]);
    if (rolesResponse.success) roles = rolesResponse.data;
    if (permissionsResponse.success) permissions = permissionsResponse.data;
  } catch (error) {
    loggerService.error('dev-login: failed to fetch user roles/permissions', {
      userId: user.id,
      error: error instanceof Error ? error.message : String(error)
    });
  }

  const token = jwtService.generateToken({
    id: user.id,
    _id: user.external_id,
    username: user.nickname || '',
    isTemp: false,
    roles: roles.map(role => role.name),
    permissions: permissions.map(permission => permission.name)
  });

  return {
    token,
    isTemporary: false,
    user: { id: user.external_id, email, nickname: user.nickname ?? null }
  };
};

/**
 * 測試登入
 * POST /api/v1/auth/dev-login
 */
export const devLogin = asyncHandler(async (req: Request, res: Response) => {
  const { email, mode, name } = req.body as DevLoginRequest;

  const result = mode === 'temp' ? await issueTempLogin(email, name) : await issueUserLogin(email);

  setAuthCookie(res, result.token);
  loggerService.info('dev-login issued', { mode, email, isTemporary: result.isTemporary });

  const response = createSuccessResponse(result);
  res.json(devLoginResponseSchema.parse(response));
});

export const devLoginController = { devLogin };
