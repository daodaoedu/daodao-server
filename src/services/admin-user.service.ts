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

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const resolveUserId = async (userId: string): Promise<number> => {
  if (/^\d+$/.test(userId)) return Number(userId);
  if (!UUID_REGEX.test(userId)) throw new NotFoundError('User not found');
  const user = await prisma.users.findUnique({
    where: { external_id: userId },
    select: { id: true },
  });
  if (!user) throw new NotFoundError('User not found');
  return user.id;
};

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
    createdFrom,
    createdTo,
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

  // 篩選註冊日期區間
  if (createdFrom || createdTo) {
    const createdFilter: Record<string, Date> = {};
    if (createdFrom) createdFilter.gte = new Date(`${createdFrom}T00:00:00.000Z`);
    if (createdTo) createdFilter.lte = new Date(`${createdTo}T23:59:59.999Z`);
    where.created_at = createdFilter;
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

  // 批次取得用戶標籤（從 user_tag_assignments + user_tags）
  const userTagsData = await prisma.$queryRaw<Array<{
    user_id: number;
    tag_id: number;
    tag_name: string;
  }>>`
    SELECT uta.user_id, ut.id AS tag_id, ut.name AS tag_name
    FROM user_tag_assignments uta
    JOIN user_tags ut ON ut.id = uta.tag_id
    WHERE uta.user_id = ANY(${userIds}::int[])
  `;
  const userTagsMap = new Map<number, Array<{ id: number; name: string }>>();
  for (const row of userTagsData) {
    const arr = userTagsMap.get(row.user_id) ?? [];
    arr.push({ id: row.tag_id, name: row.tag_name });
    userTagsMap.set(row.user_id, arr);
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
      referralSource: user.referral_source ?? null,
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
const getAdminUserDetail = async (userId: number | string): Promise<AdminUserDetailResponse> => {
  const numericId = typeof userId === 'number' ? userId : /^\d+$/.test(String(userId)) ? Number(userId) : null;

  if (!numericId && !UUID_REGEX.test(String(userId))) {
    throw new NotFoundError('User not found');
  }

  const user = await prisma.users.findUnique({
    where: numericId ? { id: numericId } : { external_id: String(userId) },
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
    where: { user_id: user.id },
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
    prisma.user_login_history.count({ where: { user_id: user.id, login_at: { gte: thirtyDaysAgo } } }),
    prisma.practices.count({ where: { user_id: user.id } }),
    prisma.practice_checkins.count({ where: { user_id: user.id } }),
    prisma.post.count({ where: { user_id: user.id } }),
    prisma.reactions.count({ where: { user_id: user.id } }),
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
 * 取得使用者活動時間軸（登入、打卡、發文、瀏覽、反應、留言，依時間倒序）
 * @param userId - 使用者內部 ID
 * @param limit - 最多筆數，預設 50，最大 100
 */
const getActivityTimeline = async (userId: number, limit = 50): Promise<ActivityTimelineEvent[]> => {
  const user = await prisma.users.findUnique({ where: { id: userId }, select: { id: true } });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  const perSource = Math.ceil(limit * 1.5);

  const [logins, checkins, practices, personaAnswers, interactions, reactions, comments] = await Promise.all([
    prisma.user_login_history.findMany({
      where: { user_id: userId },
      orderBy: { login_at: 'desc' },
      take: perSource,
      select: { id: true, user_agent: true, login_at: true },
    }),
    prisma.practice_checkins.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: perSource,
      select: { id: true, created_at: true, practices: { select: { title: true, external_id: true } } },
    }),
    prisma.practices.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: perSource,
      select: { id: true, external_id: true, title: true, created_at: true },
    }),
    prisma.persona_answers.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: perSource,
      select: {
        id: true,
        selected_value: true,
        created_at: true,
        persona_questions: {
          select: {
            persona_question_translations: {
              where: { locale: 'zh-TW' },
              select: { prompt: true },
              take: 1,
            },
          },
        },
      },
    }),
    prisma.interaction_events.findMany({
      where: { user_id: userId, event_type: 'view' },
      orderBy: { created_at: 'desc' },
      take: perSource,
      select: { id: true, entity_type: true, entity_id: true, created_at: true },
    }),
    prisma.reactions.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: perSource,
      select: { id: true, target_type: true, target_id: true, reaction_type: true, created_at: true },
    }),
    prisma.comments.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: perSource,
      select: { id: true, target_type: true, target_id: true, content: true, created_at: true },
    }),
  ]);

  // 批次查所有 polymorphic 引用的 practice（瀏覽/反應/留言用）
  const refPracticeIds = new Set<number>();
  for (const i of interactions) { if (i.entity_type === 'practice') refPracticeIds.add(i.entity_id); }
  for (const r of reactions) { if (r.target_type === 'practice') refPracticeIds.add(r.target_id); }
  for (const c of comments) { if (c.target_type === 'practice') refPracticeIds.add(c.target_id); }

  const practiceMap = new Map<number, { title: string; extId: string | null }>();
  if (refPracticeIds.size > 0) {
    const rows = await prisma.practices.findMany({
      where: { id: { in: [...refPracticeIds] } },
      select: { id: true, title: true, external_id: true },
    });
    for (const r of rows) { practiceMap.set(r.id, { title: r.title, extId: r.external_id }); }
  }

  const ENTITY_LABEL: Record<string, string> = {
    practice: '實踐', resource: '資源', group: '社群',
  };

  const entityName = (type: string, id: number) => {
    if (type === 'practice') {
      const p = practiceMap.get(id);
      return p ? `「${p.title}」` : `${ENTITY_LABEL[type] ?? type}`;
    }
    return `${ENTITY_LABEL[type] ?? type}`;
  };

  const practiceUrl = (extId: string | null | undefined) =>
    extId ? `/practices/${extId}` : undefined;

  const entityUrl = (type: string, id: number) => {
    if (type === 'practice') return practiceUrl(practiceMap.get(id)?.extId);
    return undefined;
  };

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
      url: practiceUrl(c.practices?.external_id),
    })),
    ...practices.map(p => ({
      id: `practice-${p.id}`,
      type: 'practice' as const,
      description: `建立實踐「${p.title}」`,
      timestamp: p.created_at?.toISOString() ?? '',
      url: practiceUrl(p.external_id),
    })),
    ...personaAnswers.map(a => {
      const prompt = a.persona_questions.persona_question_translations[0]?.prompt;
      return {
        id: `persona-${a.id}`,
        type: 'persona' as const,
        description: prompt
          ? `回答「${prompt}」${a.selected_value ? `：${a.selected_value}` : ''}`
          : '填寫人物誌',
        timestamp: a.created_at.toISOString(),
      };
    }),
    ...interactions.map(i => ({
      id: `view-${i.id}`,
      type: 'view' as const,
      description: `瀏覽${entityName(i.entity_type, i.entity_id)}`,
      timestamp: i.created_at.toISOString(),
      url: entityUrl(i.entity_type, i.entity_id),
    })),
    ...reactions.map(r => ({
      id: `reaction-${r.id}`,
      type: 'reaction' as const,
      description: `對${entityName(r.target_type, r.target_id)} ${r.reaction_type === 'like' ? '按讚' : `反應 ${r.reaction_type}`}`,
      timestamp: r.created_at?.toISOString() ?? '',
      url: entityUrl(r.target_type, r.target_id),
    })),
    ...comments.map(c => ({
      id: `comment-${c.id}`,
      type: 'comment' as const,
      description: `在${entityName(c.target_type, c.target_id)}留言：${c.content.slice(0, 50)}${c.content.length > 50 ? '…' : ''}`,
      timestamp: c.created_at?.toISOString() ?? '',
      url: entityUrl(c.target_type, c.target_id),
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
  resolveUserId,
  getAdminUserList,
  getAdminUserDetail,
  getUserLoginHistory,
  getUserActivityStats,
  getActivityTimeline,
  toggleUserStatus
};

export default adminUserService;
