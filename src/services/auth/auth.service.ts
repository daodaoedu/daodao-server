/**
 * 認證服務 - 使用 Prisma
 * 處理用戶認證相關的資料庫操作
 */

import { prisma } from '../database/prisma.service';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { jwtService } from '../jwt.service';
import {
  UnauthorizedError,
  NotFoundError,
  ConflictError
} from '../../middleware/error.middleware';
import { createSuccessResponse } from '../../utils/response-helper';
import { ApiResponse } from '../../types/api-response.types';
import { userService } from '../user.service';
import { loggerService } from '../logging/logger.service';
import { sendWelcomeEmailInBackground } from '../email/welcome-email.service';

/**
 * 根據 email 查找用戶及其聯絡資訊
 */
export const findUserByEmail = async (email: string): Promise<ApiResponse<{ contact: any; user: any } | null>> => {
  const contact = await prisma.contacts.findFirst({
    where: { email },
    include: {
      users: {
        include: {
          roles: true,
          user_positions: {
            include: {
              position: true
            }
          }
        }
      }
    }
  });

  if (!contact || !contact.users || contact.users.length === 0) {
    return createSuccessResponse(null);
  }

  // 返回第一個關聯的用戶
  const result = {
    contact,
    user: contact.users[0]
  };

  return createSuccessResponse(result);
};

/**
 * 根據 Google ID 查找或創建臨時用戶
 * @returns 包含 user 和 isNewUser 標記的回應
 */
export const findOrCreateTempUser = async (profile: {
  googleId: string;
  email: string;
  name: string;
  photoUrl?: string;
}): Promise<ApiResponse<{ user: unknown; isNewUser: boolean }>> => {
  const { googleId, email, name, photoUrl } = profile;

  let isNewUser = false;

  // 先檢查是否已存在
  let tempUser = await prisma.temp_users.findFirst({
    where: { google_id: googleId }
  });

  if (!tempUser) {
    // 檢查 email 是否已存在
    const existingByEmail = await prisma.temp_users.findFirst({
      where: { email }
    });

    if (existingByEmail) {
      throw new ConflictError('此電子郵件已被使用');
    }

    // 創建新的臨時用戶
    tempUser = await prisma.temp_users.create({
      data: {
        google_id: googleId,
        email,
        name,
        photo_url: photoUrl
      }
    });

    isNewUser = true;
  }

  return createSuccessResponse({ user: tempUser, isNewUser });
};

/**
 * 根據 Apple ID 查找正式用戶
 */
export const findUserByAppleId = async (appleId: string): Promise<unknown | null> => {
  const contact = await prisma.contacts.findFirst({
    where: { apple_id: appleId },
    include: {
      users: {
        include: {
          roles: true,
          contacts: true,
          location: {
            include: {
              city: true,
              country: true
            }
          },
          user_positions: {
            include: {
              position: true
            }
          }
        }
      }
    }
  });

  if (!contact || !contact.users || contact.users.length === 0) {
    return null;
  }

  return contact.users[0];
};

/**
 * 根據 Apple ID 查找或創建臨時用戶
 */
export const findOrCreateTempUserFromApple = async (profile: {
  appleId: string;
  email: string;
  name: string;
  photoUrl?: string;
}): Promise<ApiResponse<unknown>> => {
  const { appleId, email, name, photoUrl } = profile;

  // 先檢查是否已存在（通過 Apple ID）
  let tempUser = await prisma.temp_users.findFirst({
    where: { apple_id: appleId }
  });

  if (!tempUser) {
    // 檢查 email 是否已存在
    const existingByEmail = await prisma.temp_users.findFirst({
      where: { email }
    });

    if (existingByEmail) {
      // 如果 email 已存在但沒有 Apple ID，更新 Apple ID
      if (!existingByEmail.apple_id) {
        tempUser = await prisma.temp_users.update({
          where: { id: existingByEmail.id },
          data: { apple_id: appleId }
        });
      } else {
        throw new ConflictError('此電子郵件已被使用');
      }
    } else {
      // 創建新的臨時用戶
      tempUser = await prisma.temp_users.create({
        data: {
          apple_id: appleId,
          email,
          name,
          photo_url: photoUrl
        }
      });
    }
  }

  return createSuccessResponse(tempUser);
};

/**
 * 直接從 Apple OAuth 建立正式用戶（跳過臨時用戶階段）
 * 在事務中建立 basic_info、contacts 和 users 記錄
 *
 * @param profile.emailVerified - Apple 提供的 email_verified 狀態
 *   - 如果為 true，表示 Apple 已驗證此 email，設定 verified: true
 *   - 如果為 false 或未提供，設定 verified: false
 *   - 注意：private relay email (@privaterelay.appleid.com) 雖然 emailVerified 可能為 true，
 *     但由於是轉發地址，建議仍視為未驗證
 */
export const createUserFromAppleOAuth = async (profile: {
  appleId: string;
  email?: string;
  name: string;
  photoUrl?: string;
  emailVerified?: boolean;
  isPrivateEmail?: boolean;
}): Promise<ApiResponse<unknown>> => {
  const { appleId, email, name, photoUrl, emailVerified, isPrivateEmail } = profile;

  // 判斷是否應設定 verified: true
  // Apple private relay email 雖然 email_verified 可能為 true，但實際上是轉發地址
  // 為了確保用戶能收到重要通知，private relay email 不自動標記為已驗證
  const shouldMarkVerified = emailVerified === true && isPrivateEmail !== true;

  // 使用事務確保資料一致性
  const newUser = await prisma.$transaction(async (tx) => {
    // 1. 建立 basic_info（空白預設值）
    const basicInfo = await tx.basic_info.create({
      data: {
        self_introduction: null,
        share_list: null,
        want_to_do_list: []
      }
    });

    // 2. 建立 contacts（Apple 資訊）
    const contact = await tx.contacts.create({
      data: {
        apple_id: appleId,
        email,
        photo_url: photoUrl,
        is_subscribe_email: false
      }
    });

    // 3. 生成唯一的 mongo_id（使用 crypto 生成 24 字元的十六進位字串，模擬 MongoDB ObjectId 格式）
    const mongoId = crypto.randomBytes(12).toString('hex');

    // 4. 建立 users 記錄
    // 根據 Apple 回傳的 email_verified 狀態和是否為 private relay email 決定 verified 欄位
    const user = await tx.users.create({
      data: {
        mongo_id: mongoId,
        nickname: name,
        contact_id: contact.id,
        basic_info_id: basicInfo.id,
        role_id: 2, // 一般用戶
        is_open_location: false,
        is_open_profile: false,
        verified: shouldMarkVerified,
        verified_at: shouldMarkVerified ? new Date() : null,
        is_active: true,
        created_at: new Date()
      }
    });

    // 5. 獲取完整的用戶資訊
    const createdUser = await tx.users.findUnique({
      where: { id: user.id },
      include: {
        roles: true,
        contacts: true,
        basic_info: true,
        location: {
          include: {
            city: true,
            country: true
          }
        },
        user_positions: {
          include: {
            position: true
          }
        }
      }
    });

    return createdUser;
  });

  // Apple 登入無 email 驗證步驟，建立用戶後直接寄歡迎信（非阻塞）
  if (newUser) {
    sendWelcomeEmailInBackground(newUser.id, 'apple-oauth');
  }

  return createSuccessResponse(newUser);
};

/**
 * 將 Apple ID 關聯到現有用戶
 */
export const linkAppleIdToUser = async (userId: number, appleId: string): Promise<ApiResponse<{ success: boolean }>> => {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    include: { contacts: true }
  });

  if (!user || !user.contact_id) {
    throw new NotFoundError('用戶不存在');
  }

  await prisma.contacts.update({
    where: { id: user.contact_id },
    data: { apple_id: appleId }
  });

  return createSuccessResponse({ success: true });
};

/**
 * 直接從 OAuth 建立正式用戶（跳過臨時用戶階段）
 * 在事務中建立 basic_info、contacts 和 users 記錄
 * @returns 包含 user 和 isNewUser 標記的回應（新建用戶必定是 isNewUser = true）
 */
export const createUserFromOAuth = async (profile: {
  googleId: string;
  email: string;
  name: string;
  photoUrl?: string;
}): Promise<ApiResponse<{ user: unknown; isNewUser: boolean }>> => {
  const { googleId, email, name, photoUrl } = profile;

  // 使用事務確保資料一致性
  const newUser = await prisma.$transaction(async (tx) => {
    // 1. 建立 basic_info（空白預設值）
    const basicInfo = await tx.basic_info.create({
      data: {
        self_introduction: null,
        share_list: null,
        want_to_do_list: []
      }
    });

    // 2. 建立 contacts（Google 資訊）
    const contact = await tx.contacts.create({
      data: {
        google_id: googleId,
        email,
        photo_url: photoUrl,
        is_subscribe_email: false
      }
    });

    // 3. 生成唯一的 mongo_id（使用 crypto 生成 24 字元的十六進位字串，模擬 MongoDB ObjectId 格式）
    const mongoId = crypto.randomBytes(12).toString('hex');

    // 4. 建立 users 記錄
    const user = await tx.users.create({
      data: {
        mongo_id: mongoId,
        nickname: name,
        contact_id: contact.id,
        basic_info_id: basicInfo.id,
        role_id: 2, // 一般用戶
        is_open_location: false,
        is_open_profile: false,
        verified: false,
        is_active: true,
        created_at: new Date()
      }
    });

    // 5. 獲取完整的用戶資訊
    const createdUser = await tx.users.findUnique({
      where: { id: user.id },
      include: {
        roles: true,
        contacts: true,
        basic_info: true,
        location: {
          include: {
            city: true,
            country: true
          }
        },
        user_positions: {
          include: {
            position: true
          }
        }
      }
    });

    return createdUser;
  });

  return createSuccessResponse({ user: newUser, isNewUser: true });
};

/**
 * 根據 external_id 查找正式用戶
 */
export const findUserByExternalId = async (externalId: string): Promise<ApiResponse<any | null>> => {
  const user = await prisma.users.findUnique({
    where: { external_id: externalId },
    include: {
      roles: true,
      contacts: true,
      location: {
        include: {
          city: true,
          country: true
        }
      },
      user_positions: {
        include: {
          position: true
        }
      }
    }
  });

  return createSuccessResponse(user);
};

/**
 * 根據用戶 ID 獲取角色
 */
export const getUserRoles = async (userId: number): Promise<ApiResponse<any[]>> => {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    include: {
      roles: true,
      user_positions: {
        include: {
          position: true
        }
      }
    }
  });

  if (!user) {
    return createSuccessResponse([]);
  }

  const roles = [];

  // 添加主要角色
  if (user.roles) {
    roles.push(user.roles);
  }

  // 添加職位角色
  if (user.user_positions) {
    user.user_positions.forEach(up => {
      roles.push({
        id: up.position.id,
        name: up.position.name
      });
    });
  }

  return createSuccessResponse(roles);
};

/**
 * 獲取用戶權限
 */
export const getUserPermissions = async (userId: number): Promise<ApiResponse<any[]>> => {
  const userPermissions = await prisma.user_permissions.findMany({
    where: { user_id: userId },
    include: {
      permissions: true
    }
  });

  const permissions = userPermissions.map(up => ({
    id: up.permissions.id,
    name: up.permissions.name,
    description: up.permissions.description
  }));

  return createSuccessResponse(permissions);
};

/**
 * 驗證用戶密碼（注意：當前 Prisma schema 不包含 password_hash）
 * 這是一個 placeholder，實際實現需要 schema 更新
 */
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

/**
 * 生成認證 token
 */
export const generateAuthToken = (payload: {
  id: number;
  email?: string;
  username?: string;
  isTemp?: boolean;
  roles?: string[];
  permissions?: string[];
}) => {
  return jwtService.generateToken(payload);
};

/**
 * 更新用戶最後登入時間和登入次數
 * 委派給 userService 處理，避免重複實作
 * @param userId 用戶 ID
 * @param deviceInfo 可選的裝置資訊
 */
export const updateLastLogin = async (
  userId: number,
  deviceInfo?: {
    deviceType?: string;
    os?: string;
    browser?: string;
    userAgent?: string;
    ipAddress?: string;
  }
): Promise<ApiResponse<{ success: boolean }>> => {
  await userService.updateLastLogin(userId, deviceInfo);
  return createSuccessResponse({ success: true });
};

/**
 * 驗證用戶郵件
 */
export const verifyUserEmail = async (userId: number): Promise<ApiResponse<{ success: boolean }>> => {
  // 只在 verified=false 時更新：同一 token 的 POST/GET 併發只會有一個拿到 count=1，
  // 呼叫端據此決定是否寄歡迎信（取代舊 onboarding queue 的 L0-<userId> jobId 冪等）
  const { count } = await prisma.users.updateMany({
    where: { id: userId, verified: false },
    data: {
      verified: true,
      verified_at: new Date(),
      updated_at: new Date()
    }
  });

  return createSuccessResponse({ success: count > 0 });
};

/**
 * 啟用/停用用戶
 */
export const setUserActiveStatus = async (userId: number, isActive: boolean): Promise<ApiResponse<{ success: boolean }>> => {
  await prisma.users.update({
    where: { id: userId },
    data: {
      is_active: isActive,
      updated_at: new Date()
    }
  });

  return createSuccessResponse({ success: true });
};

/**
 * 檢查用戶是否已驗證郵件
 */
export const isUserEmailVerified = async (userId: number): Promise<ApiResponse<boolean>> => {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { verified: true }
  });
  
  return createSuccessResponse(user?.verified || false);
};

/**
 * 檢查用戶是否處於活躍狀態
 */
export const isUserActive = async (userId: number): Promise<ApiResponse<boolean>> => {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { is_active: true }
  });
  
  return createSuccessResponse(user?.is_active || false);
};

export const authService = {
  findUserByEmail,
  findOrCreateTempUser,
  createUserFromOAuth,
  findUserByExternalId,
  getUserRoles,
  getUserPermissions,
  verifyPassword,
  generateAuthToken,
  updateLastLogin,
  verifyUserEmail,
  setUserActiveStatus,
  isUserEmailVerified,
  isUserActive,
  // Apple Sign In 相關方法
  findUserByAppleId,
  findOrCreateTempUserFromApple,
  createUserFromAppleOAuth,
  linkAppleIdToUser
};

export default authService;