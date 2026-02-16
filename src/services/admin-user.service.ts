/**
 * Admin 使用者管理服務
 * 提供 Admin 專用的使用者查詢與管理功能
 */

import { prisma } from './database/prisma.service';
import type { Prisma } from '../../generated/prisma';
import type {
  AdminUserFilters,
  AdminUserListItem,
  AdminUserListResponse,
  AdminUserDetailResponse,
  RoleInfo,
  AdminLoginHistoryFilters,
  AdminLoginHistoryResponse
} from '../types/admin-user.types';
import type { LoginHistoryRecord, UserActivityStats } from '../types/user.types';
import { NotFoundError, BadRequestError } from '../middleware/error.middleware';

/**
 * 取得 Admin 使用者列表
 * @param filters - 查詢參數
 */
const getAdminUserList = async (filters: AdminUserFilters): Promise<AdminUserListResponse> => {
  const {
    search,
    roleId,
    isActive,
    isVerified,
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = filters;

  // 建構 where 條件
  const where: Prisma.usersWhereInput = {};

  // 搜尋名稱或 email
  if (search) {
    where.OR = [
      { nickname: { contains: search, mode: 'insensitive' } },
      { contacts: { email: { contains: search, mode: 'insensitive' } } }
    ];
  }

  // 篩選角色
  if (roleId !== undefined) {
    where.role_id = roleId;
  }

  // 篩選啟用狀態
  if (isActive !== undefined) {
    where.is_active = isActive;
  }

  // 篩選 email 驗證狀態
  if (isVerified !== undefined) {
    where.verified = isVerified;
  }

  // 計算排序
  const orderBy: Prisma.usersOrderByWithRelationInput = {};
  switch (sortBy) {
    case 'name':
      orderBy.nickname = sortOrder;
      break;
    case 'email':
      orderBy.contacts = { email: sortOrder };
      break;
    case 'lastLoginAt':
      orderBy.user_activity_stats = { last_login_at: { sort: sortOrder, nulls: 'last' } };
      break;
    case 'createdAt':
    default:
      orderBy.created_at = sortOrder;
      break;
  }

  // 查詢總數
  const totalCount = await prisma.users.count({ where });

  // 計算分頁
  const totalPages = Math.ceil(totalCount / limit);
  const skip = (page - 1) * limit;

  // 查詢使用者
  const users = await prisma.users.findMany({
    where,
    orderBy,
    skip,
    take: limit,
    include: {
      contacts: {
        select: {
          email: true,
          photo_url: true
        }
      },
      roles: {
        include: {
          role_permissions: {
            include: {
              permissions: true
            }
          }
        }
      },
      user_activity_stats: {
        select: {
          last_login_at: true,
          last_active_at: true
        }
      }
    }
  });

  // 格式化回應
  const formattedUsers: AdminUserListItem[] = users.map(user => {
    const roles: RoleInfo[] = [];
    const permissions: string[] = [];

    if (user.roles) {
      roles.push({
        id: user.roles.id,
        name: user.roles.name,
        description: user.roles.description
      });

      for (const rp of user.roles.role_permissions) {
        if (!permissions.includes(rp.permissions.name)) {
          permissions.push(rp.permissions.name);
        }
      }
    }

    return {
      id: user.external_id ?? '',
      internalId: user.id,
      name: user.nickname,
      email: user.contacts?.email ?? null,
      photoURL: user.contacts?.photo_url ?? null,
      emailVerified: user.verified ?? false,
      emailVerifiedAt: user.verified_at?.toISOString() ?? null,
      isActive: user.is_active ?? true,
      roles,
      permissions,
      createdAt: user.created_at?.toISOString() ?? new Date().toISOString(),
      lastLoginAt: user.user_activity_stats?.last_login_at?.toISOString() ?? null,
      lastActiveAt: user.user_activity_stats?.last_active_at?.toISOString() ?? null
    };
  });

  return {
    users: formattedUsers,
    pagination: {
      currentPage: page,
      totalPages,
      totalCount,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      limit
    }
  };
};

/**
 * 取得 Admin 使用者詳情
 * @param userId - 使用者內部 ID
 */
const getAdminUserDetail = async (userId: number): Promise<AdminUserDetailResponse> => {
  // 查詢使用者
  const user = await prisma.users.findUnique({
    where: { id: userId },
    include: {
      contacts: true,
      roles: {
        include: {
          role_permissions: {
            include: {
              permissions: true
            }
          }
        }
      },
      user_activity_stats: true,
      user_login_history: {
        orderBy: { login_at: 'desc' },
        take: 10
      }
    }
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  const roles: RoleInfo[] = [];
  const permissions: string[] = [];

  // 取得角色和權限
  if (user.roles) {
    roles.push({
      id: user.roles.id,
      name: user.roles.name,
      description: user.roles.description
    });

    for (const rp of user.roles.role_permissions) {
      if (!permissions.includes(rp.permissions.name)) {
        permissions.push(rp.permissions.name);
      }
    }
  }

  // 格式化登入歷史
  const recentLoginHistory: LoginHistoryRecord[] = user.user_login_history.map(h => ({
    id: h.id,
    deviceType: h.device_type,
    os: h.os,
    browser: h.browser,
    userAgent: h.user_agent,
    ipAddress: h.ip_address,
    loginAt: h.login_at?.toISOString() ?? null
  }));

  // 計算最近 30 天登入次數
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentLoginCount = await prisma.user_login_history.count({
    where: {
      user_id: userId,
      login_at: { gte: thirtyDaysAgo }
    }
  });

  // 格式化活躍統計
  const activityStats: UserActivityStats = {
    lastLoginAt: user.user_activity_stats?.last_login_at?.toISOString() ?? null,
    lastActiveAt: user.user_activity_stats?.last_active_at?.toISOString() ?? null,
    loginCount: user.user_activity_stats?.login_count ?? 0,
    profileViews: user.user_activity_stats?.profile_views ?? 0,
    recentLoginCount
  };

  return {
    id: user.external_id ?? '',
    internalId: user.id,
    name: user.nickname,
    email: user.contacts?.email ?? null,
    photoURL: user.contacts?.photo_url ?? null,
    gender: user.gender as 'male' | 'female' | 'other' | null,
    birthDay: user.birth_date?.toISOString() ?? null,
    educationStage: user.education_stage as FormattedEducationStage,
    isOpenLocation: user.is_open_location ?? false,
    isOpenProfile: user.is_open_profile ?? false,
    isSubscribeEmail: user.contacts?.is_subscribe_email ?? false,
    role: user.role_id,
    customId: user.custom_id,
    customIdVerified: user.custom_id_verified,
    customIdCreatedAt: user.custom_id_created_at?.toISOString() ?? null,
    personalSlogan: user.personal_slogan,
    referralSource: user.referral_source,
    contactList: user.contacts ? {
      email: user.contacts.email,
      photoURL: user.contacts.photo_url,
      isSubscribeEmail: user.contacts.is_subscribe_email,
      instagram: user.contacts.ig,
      discord: user.contacts.discord,
      line: user.contacts.line,
      facebook: user.contacts.fb,
      threads: user.contacts.threads,
      linkedin: user.contacts.linkedin,
      website: user.contacts.website,
      github: user.contacts.github
    } : null,
    createdAt: user.created_at?.toISOString() ?? new Date().toISOString(),
    updatedAt: user.updated_at?.toISOString() ?? new Date().toISOString(),
    // Admin 專用欄位
    emailVerified: user.verified ?? false,
    emailVerifiedAt: user.verified_at?.toISOString() ?? null,
    isActive: user.is_active ?? true,
    roles,
    permissions,
    recentLoginHistory,
    activityStats
  };
};

// Type alias for formatted education stage
type FormattedEducationStage = 'elementary' | 'junior_high' | 'high' | 'associate' | 'university' | 'master' | 'doctorate' | 'other' | null;

/**
 * 取得使用者登入歷史
 * @param userId - 使用者內部 ID
 * @param filters - 查詢參數
 */
const getUserLoginHistory = async (
  userId: number,
  filters: AdminLoginHistoryFilters
): Promise<AdminLoginHistoryResponse> => {
  const { startDate, endDate, page = 1, limit = 20 } = filters;

  // 確認使用者存在
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { id: true }
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  // 建構 where 條件
  const where: Prisma.user_login_historyWhereInput = {
    user_id: userId
  };

  if (startDate || endDate) {
    where.login_at = {};
    if (startDate) {
      where.login_at.gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.login_at.lte = end;
    }
  }

  // 查詢總數
  const totalCount = await prisma.user_login_history.count({ where });

  // 計算分頁
  const totalPages = Math.ceil(totalCount / limit);
  const skip = (page - 1) * limit;

  // 查詢登入歷史
  const history = await prisma.user_login_history.findMany({
    where,
    orderBy: { login_at: 'desc' },
    skip,
    take: limit
  });

  // 格式化回應
  const records: LoginHistoryRecord[] = history.map(h => ({
    id: h.id,
    deviceType: h.device_type,
    os: h.os,
    browser: h.browser,
    userAgent: h.user_agent,
    ipAddress: h.ip_address,
    loginAt: h.login_at?.toISOString() ?? null
  }));

  return {
    records,
    pagination: {
      currentPage: page,
      totalPages,
      totalCount,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      limit
    }
  };
};

/**
 * 取得使用者活躍統計
 * @param userId - 使用者內部 ID
 */
const getUserActivityStats = async (userId: number): Promise<UserActivityStats> => {
  // 確認使用者存在
  const user = await prisma.users.findUnique({
    where: { id: userId },
    include: {
      user_activity_stats: true
    }
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  // 計算最近 30 天登入次數
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentLoginCount = await prisma.user_login_history.count({
    where: {
      user_id: userId,
      login_at: { gte: thirtyDaysAgo }
    }
  });

  return {
    lastLoginAt: user.user_activity_stats?.last_login_at?.toISOString() ?? null,
    lastActiveAt: user.user_activity_stats?.last_active_at?.toISOString() ?? null,
    loginCount: user.user_activity_stats?.login_count ?? 0,
    profileViews: user.user_activity_stats?.profile_views ?? 0,
    recentLoginCount
  };
};

/**
 * 切換使用者狀態（啟用/停用）
 * @param userId - 使用者內部 ID
 * @param isActive - 是否啟用
 * @param currentUserId - 當前操作者的使用者 ID
 */
const toggleUserStatus = async (
  userId: number,
  isActive: boolean,
  currentUserId: number
): Promise<{ id: string; isActive: boolean; updatedAt: string }> => {
  // 檢查不可停用自己
  if (userId === currentUserId && !isActive) {
    throw new BadRequestError('Cannot disable your own account');
  }

  // 確認使用者存在
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { id: true, external_id: true }
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  // 更新狀態
  const updated = await prisma.users.update({
    where: { id: userId },
    data: {
      is_active: isActive,
      updated_at: new Date()
    },
    select: {
      external_id: true,
      is_active: true,
      updated_at: true
    }
  });

  return {
    id: updated.external_id ?? '',
    isActive: updated.is_active ?? true,
    updatedAt: updated.updated_at?.toISOString() ?? new Date().toISOString()
  };
};

export const adminUserService = {
  getAdminUserList,
  getAdminUserDetail,
  getUserLoginHistory,
  getUserActivityStats,
  toggleUserStatus
};

export default adminUserService;
