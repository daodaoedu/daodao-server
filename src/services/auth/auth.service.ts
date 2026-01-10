/**
 * 認證服務 - 使用 Prisma
 * 處理用戶認證相關的資料庫操作
 */

import { prisma } from '../database/prisma.service';
import bcrypt from 'bcrypt';
import { jwtService } from '../jwt.service';
import {
  UnauthorizedError,
  NotFoundError,
  ConflictError
} from '../../middleware/error.middleware';
import { createSuccessResponse } from '../../utils/response-helper';
import { ApiResponse } from '../../types/api-response.types';

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
 */
export const findOrCreateTempUser = async (profile: {
  googleId: string;
  email: string;
  name: string;
  photoUrl?: string;
}): Promise<ApiResponse<any>> => {
  const { googleId, email, name, photoUrl } = profile;

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
  }

  return createSuccessResponse(tempUser);
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
 * 更新用戶最後登入時間
 */
export const updateLastLogin = async (userId: number): Promise<ApiResponse<{ success: boolean }>> => {
  await prisma.users.update({
    where: { id: userId },
    data: {
      updated_at: new Date()
    }
  });

  return createSuccessResponse({ success: true });
};

/**
 * 驗證用戶郵件
 */
export const verifyUserEmail = async (userId: number): Promise<ApiResponse<{ success: boolean }>> => {
  await prisma.users.update({
    where: { id: userId },
    data: {
      verified: true,
      verified_at: new Date(),
      updated_at: new Date()
    }
  });

  return createSuccessResponse({ success: true });
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
  findUserByExternalId,
  getUserRoles,
  getUserPermissions,
  verifyPassword,
  generateAuthToken,
  updateLastLogin,
  verifyUserEmail,
  setUserActiveStatus,
  isUserEmailVerified,
  isUserActive
};

export default authService;