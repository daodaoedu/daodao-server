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
import type { LoginHistoryRecord, UserActivityStats, ActivityTimelineEvent } from '../types/user.types';
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
    personaType,
    badgeGranted,
    userSource,
    registrationFlow,
    creationMethod,
    lastLoginFrom,
    lastLoginTo,
    lastActivityFrom,
    lastActivityTo,
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

  // 篩選最後登入 / 最後操作日期區間
  if (lastLoginFrom || lastLoginTo || lastActivityFrom || lastActivityTo) {
    const statsFilter: Record<string, unknown> = {};
    if (lastLoginFrom || lastLoginTo) {
      const loginFilter: Record<string, Date> = {};
      if (lastLoginFrom) loginFilter.gte = new Date(`${lastLoginFrom}T00:00:00.000Z`);
      if (lastLoginTo) loginFilter.lte = new Date(`${lastLoginTo}T23:59:59.999Z`);
      statsFilter.last_login_at = loginFilter;
    }
    if (lastActivityFrom || lastActivityTo) {
      const activityFilter: Record<string, Date> = {};
      if (lastActivityFrom) activityFilter.gte = new Date(`${lastActivityFrom}T00:00:00.000Z`);
      if (lastActivityTo) activityFilter.lte = new Date(`${lastActivityTo}T23:59:59.999Z`);
      statsFilter.last_active_at = activityFilter;
    }
    where.user_activity_stats = { is: statsFilter as Prisma.user_activity_statsWhereInput };
  }

  // 篩選人物誌類型（有做過該類型測驗的用戶）
  if (personaType !== undefined) {
    where.quiz_results = { some: { result_type: personaType } };
  }

  // 篩選 Onboarding Badge / userSource（user_onboarding 不在 include 裡，預先查 id 集合）
  if (
    badgeGranted !== undefined ||
    userSource !== undefined ||
    registrationFlow !== undefined ||
    creationMethod !== undefined
  ) {
    const onboardingFilter: Prisma.user_onboardingWhereInput = {};

    if (badgeGranted !== undefined) {
      onboardingFilter.badge_granted = badgeGranted;
    }
    if (userSource !== undefined) {
      onboardingFilter.user_source = userSource;
    }
    if (registrationFlow !== undefined) {
      onboardingFilter.registration_flow = registrationFlow;
    }
    if (creationMethod !== undefined) {
      onboardingFilter.creation_method = creationMethod;
    }

    where.user_onboarding = { is: onboardingFilter };
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
    case 'lastActiveAt':
      orderBy.user_activity_stats = { last_active_at: { sort: sortOrder, nulls: 'last' } };
      break;
    case 'registrationFlow':
      orderBy.user_onboarding = { registration_flow: sortOrder };
      break;
    case 'creationMethod':
      orderBy.user_onboarding = { creation_method: sortOrder };
      break;
    case 'daysToComplete':
      orderBy.user_onboarding = { days_to_complete: sortOrder };
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
      },
      user_onboarding: {
        select: {
          badge_granted: true,
          user_source: true,
          registration_flow: true,
          creation_method: true,
          days_to_complete: true,
        },
      },
      quiz_results: {
        orderBy: { completed_at: 'desc' },
        take: 1,
        select: { result_type: true }
      }
    }
  });

  // 批次取得 onboarding 資料（user_onboarding 不在 Prisma 生成的 usersInclude 中）
  const userIds = users.map((u) => u.id);
  const onboardingMap = new Map(users.map((user) => [
    user.id,
    {
      badgeGranted: user.user_onboarding?.badge_granted,
      userSource: user.user_onboarding?.user_source,
      registrationFlow: user.user_onboarding?.registration_flow,
      creationMethod: user.user_onboarding?.creation_method,
      daysToComplete: user.user_onboarding?.days_to_complete,
    },
  ]));

  // 批次取得用戶標籤
  const userTagsData = await prisma.entity_tags.findMany({
    where: { entity_type: 'user', entity_id: { in: userIds } },
    include: { tags: { select: { id: true, name: true } } },
  });
  const userTagsMap = new Map<number, Array<{ id: number; name: string }>>();
  for (const et of userTagsData) {
    const arr = userTagsMap.get(et.entity_id) ?? [];
    arr.push({ id: et.tags.id, name: et.tags.name });
    userTagsMap.set(et.entity_id, arr);
  }

  // 格式化回應
  const formattedUsers: AdminUserListItem[] = users.map(user => {
    const userOnboarding = onboardingMap.get(user.id);
    const userRegistrationFlow = userOnboarding?.registrationFlow;
    const userCreationMethod = userOnboarding?.creationMethod;

    const normalizedRegistrationFlow = userRegistrationFlow === 'landing_page' ||
      userRegistrationFlow === 'quiz' ||
      userRegistrationFlow === 'action_maker'
      ? userRegistrationFlow
      : null;

    const normalizedCreationMethod = userCreationMethod === 'self_created' ||
      userCreationMethod === 'copied' ||
      userCreationMethod === 'action_generator'
      ? userCreationMethod
      : null;

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
      customId: user.custom_id ?? null,
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
      lastActiveAt: user.user_activity_stats?.last_active_at?.toISOString() ?? null,
      personaType: (user.quiz_results[0]?.result_type ?? null) as 'L' | 'C' | 'A' | 'D' | 'O' | null,
      badgeGranted: userOnboarding?.badgeGranted ?? null,
      userSource: userOnboarding?.userSource ?? null,
      registrationFlow: normalizedRegistrationFlow,
      creationMethod: normalizedCreationMethod,
      daysToComplete: userOnboarding?.daysToComplete ?? null,
      tags: userTagsMap.get(user.id) ?? [],
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
      },
      quiz_results: {
        orderBy: { completed_at: 'desc' },
        take: 1,
        select: { result_type: true }
      }
    }
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  const onboarding = await prisma.user_onboarding.findUnique({
    where: { user_id: userId },
    select: { badge_granted: true, user_source: true },
  });

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

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [recentLoginCount, totalPractices, totalCheckins, totalPosts, totalReactions] = await Promise.all([
    prisma.user_login_history.count({ where: { user_id: userId, login_at: { gte: thirtyDaysAgo } } }),
    prisma.practices.count({ where: { user_id: userId } }),
    prisma.practice_checkins.count({ where: { user_id: userId } }),
    prisma.post.count({ where: { user_id: userId } }),
    prisma.reactions.count({ where: { user_id: userId } }),
  ]);

  const activityStats: UserActivityStats = {
    lastLoginAt: user.user_activity_stats?.last_login_at?.toISOString() ?? null,
    lastActiveAt: user.user_activity_stats?.last_active_at?.toISOString() ?? null,
    loginCount: user.user_activity_stats?.login_count ?? 0,
    profileViews: user.user_activity_stats?.profile_views ?? 0,
    recentLoginCount,
    totalPractices,
    totalCheckins,
    totalPosts,
    totalReactions,
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
    activityStats,
    personaType: (user.quiz_results[0]?.result_type ?? null) as 'L' | 'C' | 'A' | 'D' | 'O' | null,
    badgeGranted: onboarding?.badge_granted ?? null,
    userSource: onboarding?.user_source ?? null,
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
  const user = await prisma.users.findUnique({
    where: { id: userId },
    include: { user_activity_stats: true }
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [recentLoginCount, totalPractices, totalCheckins, totalPosts, totalReactions] = await Promise.all([
    prisma.user_login_history.count({ where: { user_id: userId, login_at: { gte: thirtyDaysAgo } } }),
    prisma.practices.count({ where: { user_id: userId } }),
    prisma.practice_checkins.count({ where: { user_id: userId } }),
    prisma.post.count({ where: { user_id: userId } }),
    prisma.reactions.count({ where: { user_id: userId } }),
  ]);

  return {
    lastLoginAt: user.user_activity_stats?.last_login_at?.toISOString() ?? null,
    lastActiveAt: user.user_activity_stats?.last_active_at?.toISOString() ?? null,
    loginCount: user.user_activity_stats?.login_count ?? 0,
    profileViews: user.user_activity_stats?.profile_views ?? 0,
    recentLoginCount,
    totalPractices,
    totalCheckins,
    totalPosts,
    totalReactions,
  };
};

/**
 * 取得使用者活動時間軸（登入、打卡、發文，依時間倒序）
 * @param userId - 使用者內部 ID
 * @param limit - 最多筆數，預設 50，最大 100
 */
const getActivityTimeline = async (userId: number, limit = 50): Promise<ActivityTimelineEvent[]> => {
  const user = await prisma.users.findUnique({ where: { id: userId }, select: { id: true } });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  const [logins, checkins, posts] = await Promise.all([
    prisma.user_login_history.findMany({
      where: { user_id: userId },
      orderBy: { login_at: 'desc' },
      take: limit,
      select: { id: true, user_agent: true, login_at: true },
    }),
    prisma.practice_checkins.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: limit,
      select: { id: true, note: true, created_at: true, practices: { select: { title: true } } },
    }),
    prisma.post.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: limit,
      select: { id: true, title: true, created_at: true },
    }),
  ]);

  const events: ActivityTimelineEvent[] = [
    ...logins.map(l => ({
      id: `login-${l.id}`,
      type: 'login' as const,
      description: l.user_agent ? `從 ${l.user_agent} 登入` : '使用者登入',
      timestamp: l.login_at?.toISOString() ?? '',
    })),
    ...checkins.map(c => ({
      id: `checkin-${c.id}`,
      type: 'checkin' as const,
      description: c.practices?.title ? `打卡「${c.practices.title}」` : '打卡',
      timestamp: c.created_at?.toISOString() ?? '',
    })),
    ...posts.map(p => ({
      id: `post-${p.id}`,
      type: 'post' as const,
      description: p.title || '發文',
      timestamp: p.created_at?.toISOString() ?? '',
    })),
  ];

  return events
    .filter(e => e.timestamp)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
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
  getActivityTimeline,
  toggleUserStatus
};

export default adminUserService;
