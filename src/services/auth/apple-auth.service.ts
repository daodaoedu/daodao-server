/**
 * Apple 認證服務
 * 處理 Apple Sign In 的 ID Token 驗證和用戶處理
 */

import appleSignin from 'apple-signin-auth';
import { authService } from './auth.service';
import { jwtService } from '../jwt.service';
import { createSuccessResponse } from '../../utils/response-helper';
import { ApiResponse } from '../../types/api-response.types';
import { DeviceInfo } from '../../types/user.types';
import {
  UnauthorizedError,
  BadRequestError
} from '../../middleware/error.middleware';

/**
 * Apple ID Token 解碼後的 payload 結構
 */
interface AppleIdTokenPayload {
  /** Apple 用戶唯一識別碼 */
  sub: string;
  /** Token 簽發者 (https://appleid.apple.com) */
  iss: string;
  /** App Bundle ID (audience) */
  aud: string;
  /** Token 過期時間 */
  exp: string;
  /** Token 簽發時間 */
  iat: string;
  /** 用戶 email (可能為 private relay email) */
  email?: string;
  /** email 是否已驗證 */
  email_verified?: string | boolean;
  /** 是否為 private email */
  is_private_email?: string | boolean;
  /** nonce 值（若有提供） */
  nonce?: string;
  /** nonce 是否已支援 */
  nonce_supported?: boolean;
  /** 真實用戶狀態 */
  real_user_status?: number;
}

/**
 * 已存在用戶的類型
 */
interface ExistingUser {
  id: number;
  external_id?: string;
  nickname?: string;
  role_id: number;
  contacts?: {
    email?: string;
    photo_url?: string;
  };
}

/**
 * 臨時用戶的類型
 */
interface TempUser {
  id: number;
  name: string;
  email: string;
  photo_url?: string;
}

/**
 * Apple Sign In 用戶資訊（首次登入時由 iOS App 提供）
 */
interface AppleUserInfo {
  name?: string;
  email?: string;
}

/**
 * Apple Sign In 請求資料
 */
interface AppleSignInRequest {
  idToken: string;
  user?: AppleUserInfo;
  nonce?: string;
  deviceInfo?: DeviceInfo;
}

/**
 * Apple Sign In 回應資料
 */
interface AppleSignInResult {
  token: string;
  user: {
    id: number;
    _id: string;
    name: string;
    email?: string;
    photoUrl?: string;
    roleId?: number;
  };
  isTemp: boolean;
  isNewUser: boolean;
}

/**
 * 檢查 Apple Sign In 環境變數是否已配置
 */
const isAppleSignInConfigured = (): boolean => {
  return !!(process.env.APPLE_CLIENT_ID);
};

/**
 * 驗證 Apple ID Token
 * 使用 Apple 的公鑰驗證 token 簽名，並檢查相關 claims
 *
 * @param idToken Apple Sign In 返回的 ID Token
 * @param nonce 可選的 nonce 值，用於防止重放攻擊
 * @returns 解碼後的 token payload
 */
export const verifyAppleIdToken = async (
  idToken: string,
  nonce?: string
): Promise<AppleIdTokenPayload> => {
  if (!isAppleSignInConfigured()) {
    throw new BadRequestError('Apple Sign In 尚未配置，請設定 APPLE_CLIENT_ID 環境變數');
  }

  try {
    const clientId = process.env.APPLE_CLIENT_ID!;

    // 使用 apple-signin-auth 驗證 token
    const rawPayload = await appleSignin.verifyIdToken(idToken, {
      audience: clientId,
      ignoreExpiration: false,
      nonce: nonce
    });

    const payload: AppleIdTokenPayload = {
      sub: rawPayload.sub,
      iss: rawPayload.iss,
      aud: rawPayload.aud,
      exp: rawPayload.exp,
      iat: rawPayload.iat,
      email: rawPayload.email,
      email_verified: rawPayload.email_verified,
      is_private_email: rawPayload.is_private_email,
      nonce: rawPayload.nonce,
      nonce_supported: rawPayload.nonce_supported,
      real_user_status: (rawPayload as unknown as { real_user_status?: number }).real_user_status
    };

    // 驗證 issuer
    if (payload.iss !== 'https://appleid.apple.com') {
      throw new UnauthorizedError('無效的 Apple ID Token: 簽發者不正確');
    }

    // 驗證 audience
    if (payload.aud !== clientId) {
      throw new UnauthorizedError('無效的 Apple ID Token: audience 不匹配');
    }

    return payload;
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof BadRequestError) {
      throw error;
    }

    console.error('Apple ID Token 驗證失敗:', error);
    throw new UnauthorizedError('Apple ID Token 驗證失敗');
  }
};

/**
 * 處理 Apple Sign In 登入流程
 * 驗證 token 後，查找或建立用戶
 *
 * @param request Apple Sign In 請求資料
 * @returns 登入結果，包含 JWT token 和用戶資訊
 */
export const handleAppleSignIn = async (
  request: AppleSignInRequest
): Promise<ApiResponse<AppleSignInResult>> => {
  const { idToken, user: userInfo, nonce, deviceInfo } = request;

  // 1. 驗證 Apple ID Token
  const applePayload = await verifyAppleIdToken(idToken, nonce);
  const appleId = applePayload.sub;
  const appleEmail = applePayload.email;

  // 2. 查找現有用戶（通過 Apple ID 或 email）
  let existingUser = await authService.findUserByAppleId(appleId) as ExistingUser | null;

  // 如果沒有通過 Apple ID 找到用戶，嘗試通過 email 查找
  if (!existingUser && appleEmail) {
    const userByEmail = await authService.findUserByEmail(appleEmail);
    if (userByEmail.success && userByEmail.data) {
      existingUser = userByEmail.data.user as ExistingUser;
      // 更新現有用戶的 Apple ID（關聯帳號）
      await authService.linkAppleIdToUser(existingUser.id, appleId);
    }
  }

  let resultUser: AppleSignInResult['user'];
  let isTemp = false;
  let isNewUser = false;

  // 3. 處理用戶
  if (existingUser) {
    // 已存在的正式用戶
    resultUser = {
      id: existingUser.id,
      _id: existingUser.external_id || '',
      name: existingUser.nickname || userInfo?.name || 'Apple User',
      email: existingUser.contacts?.email || appleEmail,
      photoUrl: existingUser.contacts?.photo_url,
      roleId: existingUser.role_id
    };
  } else {
    // 檢查是否啟用直接建立正式用戶
    const isDirectLoginEnabled = process.env.OAUTH_DIRECT_LOGIN === 'true' ||
                                  process.env.OAUTH_DIRECT_LOGIN === '1';

    if (isDirectLoginEnabled) {
      // 直接建立正式用戶
      const newUserResult = await authService.createUserFromAppleOAuth({
        appleId,
        email: appleEmail || userInfo?.email,
        name: userInfo?.name || 'Apple User',
        photoUrl: undefined
      });

      if (newUserResult.success && newUserResult.data) {
        const newUser = newUserResult.data as {
          id: number;
          external_id: string;
          nickname: string;
          role_id: number;
          contacts?: { email?: string; photo_url?: string };
        };
        resultUser = {
          id: newUser.id,
          _id: newUser.external_id,
          name: newUser.nickname,
          email: newUser.contacts?.email || appleEmail,
          photoUrl: newUser.contacts?.photo_url,
          roleId: newUser.role_id
        };
        isNewUser = true;
      } else {
        throw new BadRequestError('建立用戶失敗');
      }
    } else {
      // 建立臨時用戶
      const tempUserResult = await authService.findOrCreateTempUserFromApple({
        appleId,
        email: appleEmail || userInfo?.email || '',
        name: userInfo?.name || 'Apple User',
        photoUrl: undefined
      });

      if (tempUserResult.success && tempUserResult.data) {
        const tempUser = tempUserResult.data as TempUser;
        resultUser = {
          id: tempUser.id,
          _id: String(tempUser.id),
          name: tempUser.name,
          email: tempUser.email,
          photoUrl: tempUser.photo_url,
          roleId: undefined
        };
        isTemp = true;
        isNewUser = true;
      } else {
        throw new BadRequestError('建立臨時用戶失敗');
      }
    }
  }

  // 4. 獲取用戶角色和權限
  let userRoles: Array<{ name: string }> = [];
  let userPermissions: Array<{ name: string }> = [];

  if (!isTemp && resultUser.id) {
    try {
      const rolesResponse = await authService.getUserRoles(resultUser.id);
      if (rolesResponse.success) {
        userRoles = rolesResponse.data;
      }
    } catch (error) {
      console.error('Failed to fetch user roles:', error);
    }

    try {
      const permissionsResponse = await authService.getUserPermissions(resultUser.id);
      if (permissionsResponse.success) {
        userPermissions = permissionsResponse.data;
      }
    } catch (error) {
      console.error('Failed to fetch user permissions:', error);
    }
  }

  // 5. 生成 JWT Token
  const tokenPayload = {
    id: resultUser.id,
    _id: isTemp ? undefined : resultUser._id,
    username: resultUser.name,
    isTemp,
    roles: userRoles.map(role => role.name),
    permissions: userPermissions.map(permission => permission.name)
  };

  const token = jwtService.generateToken(tokenPayload);

  // 6. 更新最後登入時間（非臨時用戶）
  if (!isTemp) {
    try {
      await authService.updateLastLogin(resultUser.id, deviceInfo);
    } catch (error) {
      console.error('Failed to update last login:', error);
    }
  }

  return createSuccessResponse({
    token,
    user: resultUser,
    isTemp,
    isNewUser
  });
};

/**
 * Apple 認證服務導出
 */
export const appleAuthService = {
  verifyAppleIdToken,
  handleAppleSignIn,
  isAppleSignInConfigured
};

export default appleAuthService;
