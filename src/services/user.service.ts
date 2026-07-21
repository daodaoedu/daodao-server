/**
 * 用戶服務 - 使用 Prisma
 * 處理用戶相關的資料庫操作
 */

import { prisma } from './database/prisma.service';
import { jwtService } from './jwt.service';
import { emailService } from './email/email.service';
import { onboardingService } from './onboarding.service';
import { quizService } from './quiz.service';
import { deriveUserSource } from '../utils/onboarding-source';
import { cityService } from './city.service';
import {
  UserQueryParams,
  CreateUserRequest,
  UpdateUserRequest,
  UpdateUserWithAvatarRequest,
  FormattedUserResponse,
  CompletenessWeights
} from '../types/user.types';
import { uploadToR2, deleteFromR2 } from './r2.service';
import { v4 as uuidv4 } from 'uuid';
import {
  UserPreference
} from '../types/me.types';
import {
  PreferencesQueryParams
} from '../validators/me.validators';
import {
  ApiSuccessResponse,
  PaginatedApiResponse
} from '../types/api-response.types';
import {
  createSuccessResponse,
  createPaginatedResponse
} from '../utils/response-helper';
import { calculatePagination } from '../utils/pagination-helper';
import {
  NotFoundError,
  ConflictError,
  BadRequestError
} from '../middleware/error.middleware';
import { loggerService } from './logging/logger.service';
import { want_to_do_list_t } from '../../generated/prisma';
import moment from 'moment-timezone';
import { validate as isUuid } from 'uuid';
import tagService from './tag.service';
import professionalFieldService from './professional-field.service';
import {
  validateCustomIdFormat,
  CUSTOM_ID_ERROR_MESSAGES
} from '../constants/validation';

/** 郵件發送待處理資料 */
type PendingEmailData = {
  email: string;
  verifyLink: string;
  nickname?: string;
  userId: number;
};

type SettingsSections = {
  onboarding: boolean;
  preferences: boolean;
  account: boolean;
  publicInfo: boolean;
};

/**
 * 將空字串轉換為 null，用於清空欄位
 * undefined 表示不更新，空字串表示清空
 */
const emptyToNull = (value: string | undefined | null): string | null | undefined => {
  if (value === undefined) {
    return undefined; // 不更新
  }
  if (value === null || value === '') {
    return null; // 清空
  }
  return value;
};

/**
 * 獲取用戶標籤
 */
const getUserTags = async (userId: number): Promise<string[]> => {
  const tags = await tagService.getEntityTags('user', userId);
  return tags.map(tag => tag.name);
};

/**
 * 設置用戶興趣 (接收 category names,儲存 category IDs)
 */
const setUserInterests = async (
  userId: number,
  categoryNames: string[],
  tx: Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>
): Promise<void> => {
  // 先刪除現有的 interests
  await tx.user_interests.deleteMany({
    where: { user_id: userId }
  });

  // 如果有提供 category names
  if (categoryNames && categoryNames.length > 0) {
    // 轉換 category names 為 IDs - 使用單一查詢避免 N+1 問題
    const categories = await tx.categories.findMany({
      where: { name: { in: categoryNames } },
      select: { id: true }
    });
    const categoryIds = categories.map((c) => c.id);

    // 批量新增 interests
    if (categoryIds.length > 0) {
      await tx.user_interests.createMany({
        data: categoryIds.map(categoryId => ({
          user_id: userId,
          category_id: categoryId
        }))
      });
    }
  }
};

/**
 * 獲取用戶興趣 (返回 category names 陣列)
 * @param userId - 用戶 ID
 * @param tx - 可選的 Prisma transaction client
 */
const getUserInterests = async (
  userId: number,
  tx?: Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>
): Promise<string[] | null> => {
  const client = tx || prisma;
  const interests = await client.user_interests.findMany({
    where: { user_id: userId },
    include: {
      categories: {
        select: {
          name: true
        }
      }
    }
  });

  if (interests.length === 0) return null;

  // 返回 category names 陣列
  return interests.map(interest => interest.categories.name);
};

/**
 * 處理用戶偏好設定
 */
const handleUserPreferences = async (
  userId: number,
  preferences: Record<string, string[]> | undefined,
  tx: Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>
): Promise<void> => {
  if (!preferences) return;

  // 先刪除現有的所有偏好設定
  await tx.user_preferences.deleteMany({
    where: { user_id: userId }
  });

  // 遍歷每個偏好類型
  for (const [typeValue, optionValues] of Object.entries(preferences)) {
    // 查找偏好選項
    const preferenceOptions = await tx.preference_options.findMany({
      where: {
        value: { in: optionValues },
        preference_types: {
          value: typeValue
        }
      }
    });

    // 創建用戶偏好記錄
    for (const option of preferenceOptions) {
      await tx.user_preferences.create({
        data: {
          user_id: userId,
          preference_option_id: option.id,
          is_selected: true
        }
      });
    }
  }
};


/**
 * 驗證是否為有效的 want_to_do_list_t 值
 */
const isValidWantToDoItem = (value: unknown): value is want_to_do_list_t => {
  return typeof value === 'string' && Object.values(want_to_do_list_t).includes(value as want_to_do_list_t);
};

/**
 * 安全地轉換和驗證 want_to_do_list
 */
const validateWantToDoList = (items: unknown[]): want_to_do_list_t[] => {
  return items
    .filter((item): item is want_to_do_list_t => {
      const isValid = isValidWantToDoItem(item);
      if (!isValid && item !== null && item !== undefined) {
        console.warn(`Invalid want_to_do_list item: ${item}`);
      }
      return isValid;
    });
};

/**
 * 格式化為台北時間
 */
// const formatToTaipeiTime = (date: Date | null | undefined): string | null => {
//   if (!date) return null;
//   return moment(date).tz('Asia/Taipei').format('YYYY-MM-DD HH:mm:ss');
// };

/**
 * 計算完整度分數
 */
const calculateScore = (length: number, config: { base: number; levels: number[] }): number => {
  const { base, levels } = config;
  const levelIndex = levels.findIndex(level => length > level);
  return base + (levelIndex > -1 ? levelIndex * 2 : 0);
};

/**
 * 格式化用戶回應資料
 */
interface PrismaUserWithRelations {
  id: number;
  external_id: string | null;
  nickname?: string | null;
  gender?: string | null;
  birth_date?: Date | null;
  is_open_location?: boolean | null;
  is_open_profile?: boolean | null;
  tag_list?: string[];
  education_stage?: string | null;
  created_at?: Date | null;
  updated_at?: Date | null;
  custom_id?: string | null;
  custom_id_verified?: boolean | null;
  custom_id_created_at?: Date | null;
  professional_field?: string | null;
  personal_slogan?: string | null;
  referral_source?: string | null;
  // 活躍狀態統計（透過關聯）
  user_activity_stats?: {
    last_login_at?: Date | null;
    last_active_at?: Date | null;
    login_count?: number | null;
    profile_views?: number | null;
    last_device_type?: string | null;
    last_os?: string | null;
    last_browser?: string | null;
  } | null;
  user_preferences?: Array<{
    preference_option_id: number;
    is_selected: boolean | null;
    preference_options: {
      name: string;
      value: string;
      preference_types: {
        name: string;
        value: string;
      };
    };
  }>;
  contacts?: {
    email?: string | null;
    photo_url?: string | null;
    is_subscribe_email?: boolean | null;
    ig?: string | null;
    discord?: string | null;
    line?: string | null;
    fb?: string | null;
    threads?: string | null;
    linkedin?: string | null;
    website?: string | null;
    github?: string | null;
  } | null;
  basic_info?: {
    self_introduction?: string | null;
    share_list?: string | null;
    want_to_do_list?: want_to_do_list_t[];
  } | null;
  roles?: {
    id: number;
  };
  location?: {
    city?: {
      name: string | null;
      name_en: string | null;
      name_zh_tw: string | null;
    } | null;
    country?: {
      name: string | null;
      name_en: string | null;
    } | null;
  } | null;
  user_positions?: Array<{
    position: {
      name: string;
    };
  }>;
}

/**
 * 格式化用戶回應資料
 * @param user - Prisma 用戶資料（含關聯）
 * @param tx - 可選的 Prisma transaction client，用於在 transaction 中讀取最新資料
 */
const formatUserResponse = async (
  user: PrismaUserWithRelations,
  tx?: Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>
): Promise<FormattedUserResponse> => {
  // 格式化偏好設定
  const preferences = user.user_preferences?.reduce((acc, pref) => {
    const typeValue = pref.preference_options.preference_types.value;
    if (!acc[typeValue]) {
      acc[typeValue] = [];
    }
    acc[typeValue].push({
      name: pref.preference_options.name,
      value: pref.preference_options.value
    });
    return acc;
  }, {} as Record<string, Array<{ name: string; value: string }>>);

  // 格式化日期為字符串
  const formatBirthDay = (date: Date | null | undefined): string | null => {
    if (!date) return null;
    return moment(date).format('YYYY-MM-DD');
  };

  // 格式化為 ISO 字符串
  const formatToISOString = (date: Date | null | undefined): string => {
    if (!date) return new Date().toISOString();
    return moment(date).toISOString();
  };

  // 組合城市和國家名稱（繁體中文）
  const getLocationNameZh = (): string | null => {
    const city = user.location?.city;
    const country = user.location?.country;
    if (!city) return null;

    const cityName = city.name_zh_tw || city.name_en || city.name;
    const countryName = country?.name || null;

    return countryName ? `${cityName}, ${countryName}` : cityName;
  };

  // 組合城市和國家名稱（英文）
  const getLocationNameEn = (): string | null => {
    const city = user.location?.city;
    const country = user.location?.country;
    if (!city) return null;

    const cityName = city.name_en || city.name;
    const countryName = country?.name_en || country?.name || null;

    return countryName ? `${cityName}, ${countryName}` : cityName;
  };

  // 獲取用戶興趣（傳遞 tx 以在 transaction 中讀取最新資料）
  const interestList = await getUserInterests(user.id, tx);

  // 獲取專業領域（傳遞 tx 以在 transaction 中讀取最新資料）
  const professionalField = await professionalFieldService.getUserProfessionalFields(user.id, tx);

  // 獲取最新測驗結果（使用 tx 或普通 prisma）
  const client = tx || prisma;
  const latestQuizResult = await client.quiz_results.findFirst({
    where: { user_id: user.id },
    orderBy: { completed_at: 'desc' }
  });

  return {
    id: user.external_id || '',
    name: user.nickname || null,
    gender: (user.gender as 'male' | 'female' | 'other') || null,
    email: user.contacts?.email || null,
    photoURL: user.contacts?.photo_url || null,
    birthDay: formatBirthDay(user.birth_date),
    isOpenLocation: user.is_open_location ?? false,
    isOpenProfile: user.is_open_profile ?? false,
    isSubscribeEmail: user.contacts?.is_subscribe_email ?? false,
    role: user.roles?.id || null,
    location: user.location?.city?.name || null,
    locationNameZh: getLocationNameZh(),
    locationNameEn: getLocationNameEn(),
    tagList: await getUserTags(user.id) || null,
    wantToDoList: user.basic_info?.want_to_do_list ?
      user.basic_info.want_to_do_list.map(item => String(item)) : null,
    educationStage: (user.education_stage as 'elementary' | 'junior_high' | 'high' | 'associate' | 'university' | 'master' | 'doctorate' | 'other') || null,
    selfIntroduction: user.basic_info?.self_introduction || null,
    share: user.basic_info?.share_list || null,
    interestList,
    preferences: preferences || null,
    contactList: {
      email: user.contacts?.email || null,
      photoURL: user.contacts?.photo_url || null,
      isSubscribeEmail: user.contacts?.is_subscribe_email || null,
      instagram: user.contacts?.ig || null,
      discord: user.contacts?.discord || null,
      line: user.contacts?.line || null,
      facebook: user.contacts?.fb || null,
      threads: user.contacts?.threads || null,
      linkedin: user.contacts?.linkedin || null,
      website: user.contacts?.website || null,
      github: user.contacts?.github || null
    },
    basicInfo: {
      selfIntroduction: user.basic_info?.self_introduction || null,
      shareList: user.basic_info?.share_list || null,
      wantToDoList: user.basic_info?.want_to_do_list ?
        user.basic_info.want_to_do_list.map(item => String(item)) : null
    },
    positionList: user.user_positions?.map((up) => up.position.name) || null,
    customId: user.custom_id || null,
    customIdVerified: user.custom_id_verified || null,
    customIdCreatedAt: user.custom_id_created_at ?
      moment(user.custom_id_created_at).toISOString() : null,

    // 新增欄位
    professionalField,
    personalSlogan: user.personal_slogan || null,
    referralSource: user.referral_source || null,

    // 活躍狀態統計（透過關聯）
    lastLoginAt: user.user_activity_stats?.last_login_at ? moment(user.user_activity_stats.last_login_at).toISOString() : null,
    lastActiveAt: user.user_activity_stats?.last_active_at ? moment(user.user_activity_stats.last_active_at).toISOString() : null,
    loginCount: user.user_activity_stats?.login_count ?? 0,
    profileViews: user.user_activity_stats?.profile_views ?? 0,

    // 最新測驗結果
    latestQuizResult: latestQuizResult ? {
      id: latestQuizResult.id,
      resultType: latestQuizResult.result_type,
      scores: latestQuizResult.scores as Record<string, number>,
      completedAt: moment(latestQuizResult.completed_at).toISOString()
    } : null,

    createdDate: formatToISOString(user.created_at),
    updatedDate: formatToISOString(user.updated_at)
  };
};

/**
 * 取得所有用戶
 */
const getAllUsers = async (params: UserQueryParams): Promise<PaginatedApiResponse<FormattedUserResponse>> => {
  const {
    page = 1,
    pageSize = 10,
    educationStage,
    positionList,
    location,
    search,
    hasPractices
  } = params;

  const currentPage = parseInt(String(page));
  const currentPageSize = parseInt(String(pageSize));
  const offset = (currentPage - 1) * currentPageSize;

  // 建立 where 條件
  const whereConditions: Record<string, unknown> = {
    is_open_profile: true
  };

  // 教育階段過濾
  if (educationStage) {
    whereConditions.education_stage = {
      in: String(educationStage).split(',')
    };
  }

  // 搜索條件
  if (search) {
    whereConditions.OR = [
      { nickname: { contains: search, mode: 'insensitive' } },
      { basic_info: { self_introduction: { contains: search, mode: 'insensitive' } } },
      { basic_info: { share_list: { contains: search, mode: 'insensitive' } } }
    ];
  }

  // 角色過濾
  if (positionList) {
    whereConditions.user_positions = {
      some: {
        position: {
          name: {
            in: String(positionList).split(',')
          }
        }
      }
    };
  }

  // 地區過濾
  if (location) {
    whereConditions.location = {
      city: {
        name: {
          in: String(location).split(',')
        }
      }
    };
  }

  // 只顯示有主題實踐的用戶
  if (hasPractices === 'true') {
    whereConditions.practices = {
      some: {
        deleted_at: null,
        status: { notIn: ['draft', 'archived'] }
      }
    };
  }

  const userInclude = {
    roles: true,
    location: {
      include: {
        city: true,
        country: true
      }
    },
    contacts: true,
    basic_info: true,
    user_positions: {
      include: {
        position: true
      }
    },
    user_preferences: {
      where: {
        is_selected: true
      },
      include: {
        preference_options: {
          include: {
            preference_types: true
          }
        }
      }
    }
  };

  // hasPractices 模式：額外 include practices + checkins 用於排序
  if (hasPractices === 'true') {
    Object.assign(userInclude, {
      practices: {
        where: {
          deleted_at: null,
          status: { notIn: ['draft', 'archived'] }
        },
        select: {
          id: true,
          created_at: true,
          first_checkin_at: true,
          practice_checkins: {
            select: { checkin_date: true },
            orderBy: { checkin_date: 'desc' as const },
            take: 1
          }
        }
      }
    });
  }

  // 查詢用戶
  const users = await prisma.users.findMany({
    where: whereConditions,
    include: userInclude,
    orderBy: {
      created_at: 'desc'
    }
  });

  let paginatedUsers;

  if (hasPractices === 'true') {
    // 依實踐活躍度排序：最近 checkin 時間 + 實踐數量 + 最近建立實踐時間
    const now = Date.now();
    const DAY_MS = 86400000;

    const usersWithActivity = (users as (typeof users[number] & {
      practices: {
        id: number;
        created_at: Date;
        first_checkin_at: Date | null;
        practice_checkins: { checkin_date: Date }[];
      }[];
    })[]).map(user => {
      const practices = user.practices ?? [];
      const practiceCount = practices.length;

      let latestCheckinTime = 0;
      let latestPracticeCreatedTime = 0;

      for (const p of practices) {
        const createdAt = new Date(p.created_at).getTime();
        if (createdAt > latestPracticeCreatedTime) {
          latestPracticeCreatedTime = createdAt;
        }
        if (p.practice_checkins.length > 0) {
          const checkinTime = new Date(p.practice_checkins[0].checkin_date).getTime();
          if (checkinTime > latestCheckinTime) {
            latestCheckinTime = checkinTime;
          }
        }
      }

      // 最近 checkin 的天數差（越小越好），沒有 checkin 給極大值
      const checkinDaysAgo = latestCheckinTime > 0
        ? (now - latestCheckinTime) / DAY_MS
        : 9999;
      // 最近建立實踐的天數差
      const practiceCreatedDaysAgo = latestPracticeCreatedTime > 0
        ? (now - latestPracticeCreatedTime) / DAY_MS
        : 9999;

      // 加權分數：checkin 活躍度（權重 50%）+ 實踐數量（權重 25%）+ 最近建立（權重 25%）
      const checkinScore = checkinDaysAgo < 9999 ? Math.max(0, 100 - checkinDaysAgo) : 0;
      const countScore = Math.min(practiceCount * 10, 100);
      const createdScore = practiceCreatedDaysAgo < 9999 ? Math.max(0, 100 - practiceCreatedDaysAgo) : 0;

      const activityScore = checkinScore * 0.5 + countScore * 0.25 + createdScore * 0.25;

      return { user, activityScore };
    });

    usersWithActivity.sort((a, b) => b.activityScore - a.activityScore);

    paginatedUsers = usersWithActivity
      .slice(offset, offset + currentPageSize)
      .map(item => item.user);
  } else {
    // 原有邏輯：按 profile 完整度排序
    const completenessWeights: CompletenessWeights = {
      self_introduction: { base: 2, levels: [50, 100, 200, 300] },
      share_list: { base: 2, levels: [50, 100, 200, 300] },
      tag_list: { tagWeight: 0.5, maxScore: 4 },
      contact: 1,
      location: 1,
      positions: 1,
    };

    const usersWithCompleteness = await Promise.all(users.map(async (user) => {
      let completenessScore = 0;

      if (user.basic_info) {
        if (user.basic_info.self_introduction) {
          const introLength = user.basic_info.self_introduction.length;
          completenessScore += calculateScore(introLength, completenessWeights.self_introduction);
        }

        if (user.basic_info.share_list) {
          const shareLength = typeof user.basic_info.share_list === 'string'
            ? user.basic_info.share_list.length
            : JSON.stringify(user.basic_info.share_list).length;
          completenessScore += calculateScore(shareLength, completenessWeights.share_list);
        }
      }

      const userTags = await getUserTags(user.id);
      if (userTags && userTags.length > 0) {
        const tagScore = Math.min(
          userTags.length * completenessWeights.tag_list.tagWeight,
          completenessWeights.tag_list.maxScore
        );
        completenessScore += tagScore;
      }

      if (user.contacts && Object.keys(user.contacts).length > 1) {
        completenessScore += completenessWeights.contact;
      }
      if (user.location?.city) {
        completenessScore += completenessWeights.location;
      }
      if (user.user_positions && user.user_positions.length > 0) {
        completenessScore += completenessWeights.positions;
      }

      return { user, completenessScore };
    }));

    usersWithCompleteness.sort((a, b) => b.completenessScore - a.completenessScore);

    paginatedUsers = usersWithCompleteness
      .slice(offset, offset + currentPageSize)
      .map(item => item.user);
  }

  const formattedData = await Promise.all(paginatedUsers.map(user => formatUserResponse(user)));

  // Calculate pagination info using the new helper
  const paginationInfo = calculatePagination(
    currentPage,
    currentPageSize,
    users.length
  );

  // Create meta information for search and filtering
  const meta = {
    searchQuery: search,
    filters: {
      educationStage: educationStage || undefined,
      positionList: positionList || undefined,
      location: location || undefined
    }
  };

  return createPaginatedResponse(formattedData, paginationInfo, meta);
};

/**
 * 獲取當前用戶
 */
const getMe = async (externalId: string): Promise<ApiSuccessResponse<FormattedUserResponse> | null> => {
  if (!externalId || !isUuid(externalId)) {
    return null;
  }

  const user = await prisma.users.findUnique({
    where: { external_id: externalId },
    include: {
      roles: true,
      location: {
        include: {
          city: true,
          country: true
        }
      },
      contacts: true,
      basic_info: true,
      user_positions: {
        include: {
          position: true
        }
      },
      user_professional_fields: {
        include: {
          professional_fields: {
            select: { value: true }
          }
        }
      }
    }
  });

  if (!user) {
    return null;
  }

  const formattedUser = await formatUserResponse(user);
  return createSuccessResponse(formattedUser);
};

/**
 * 獲取指定用戶
 * @param externalId 目標用戶的 external_id
 * @param viewerId 查看者的內部 ID（可選，用於增加被查看次數）
 */
const getOneUser = async (
  externalId: string,
  viewerId?: number
): Promise<ApiSuccessResponse<FormattedUserResponse> | null> => {
  const user = await prisma.users.findUnique({
    where: { external_id: externalId },
    include: {
      roles: true,
      location: {
        include: {
          city: true,
          country: true
        }
      },
      contacts: true,
      basic_info: true,
      user_positions: {
        include: {
          position: true
        }
      },
      user_professional_fields: {
        include: {
          professional_fields: {
            select: { value: true }
          }
        }
      }
    }
  });

  if (!user) {
    return null;
  }

  // 如果查看者不是自己，增加被查看次數
  if (viewerId && viewerId !== user.id) {
    // 透過 user_activity_stats 關聯更新
    const targetUser = await prisma.users.findUnique({
      where: { id: user.id },
      select: { activity_stats_id: true }
    });

    if (targetUser?.activity_stats_id) {
      await prisma.user_activity_stats.update({
        where: { id: targetUser.activity_stats_id },
        data: { profile_views: { increment: 1 } }
      });
    } else {
      // 創建新的 activity_stats 記錄
      const activityStats = await prisma.user_activity_stats.create({
        data: { profile_views: 1 }
      });
      await prisma.users.update({
        where: { id: user.id },
        data: { activity_stats_id: activityStats.id }
      });
    }
  }

  const formattedUser = await formatUserResponse(user);
  return createSuccessResponse(formattedUser);
};

/**
 * 創建用戶
 */
const createUser = async (
  userData: CreateUserRequest,
  tempUserId: string,
  opts?: { quizClaimToken?: string }
): Promise<ApiSuccessResponse<{ user: FormattedUserResponse; token: string }> & { quizClaimed?: boolean }> => {
  // 將郵件發送資料從 transaction 中提取出來，避免 application-level deadlock
  // （createEmailLog 使用全域 prisma client，而非 tx，會因 FK 檢查等待 transaction commit 造成死鎖）
  const { response, emailData, onboardingData } = await prisma.$transaction(async (tx) => {
    const {
      gender,
      birthDay,
      contactList,
      educationStage,
      isOpenLocation,
      isOpenProfile,
      isSubscribeEmail,
      location: areaCode,
      positionList,
      selfIntroduction,
      share,
      wantToDoList,
      tagList,
      preferences,
      isSendEmail = true,  // 預設發送驗證郵件
      // 新增欄位
      professionalField,
      personalSlogan,
      referralSource,
      registrationFlow,
      interestList,
      customId,
      name: nickname
    } = userData;

    // 查找臨時用戶
    const tempUser = await tx.temp_users.findUnique({
      where: { id: parseInt(tempUserId) }
    });

    if (!tempUser) {
      throw new NotFoundError('Temporary user not found');
    }

    // 使用表單提交的 nickname（userData.name），fallback 到 Google 顯示名稱
    const resolvedNickname = nickname || tempUser.name;

    // 檢查用戶名稱是否已存在
    const existingUser = await tx.users.findFirst({
      where: { nickname: resolvedNickname }
    });

    if (existingUser) {
      throw new ConflictError(`使用者名稱 ${resolvedNickname} 已存在`);
    }

    if (!customId) {
      throw new BadRequestError('Custom ID 為必填欄位');
    }

    // 使用共享的驗證函數
    if (!validateCustomIdFormat(customId)) {
      throw new ConflictError(CUSTOM_ID_ERROR_MESSAGES.FORMAT);
    }

    const existingCustomId = await tx.users.findFirst({
      where: { custom_id: customId }
    });

    if (existingCustomId) {
      throw new ConflictError(CUSTOM_ID_ERROR_MESSAGES.ALREADY_EXISTS);
    }

    // 處理地區 - 使用 cityService 查找或建立 location
    let locationId: number | null = null;
    if (areaCode) {
      locationId = await cityService.findOrCreateLocation(areaCode, tx);

      if (locationId === null) {
        throw new ConflictError(`'${areaCode}' 不是有效的城市代碼`);
      }
    }

    // 創建基本資訊
    const basicInfo = await tx.basic_info.create({
      data: {
        self_introduction: selfIntroduction,
        share_list: Array.isArray(share) ? share.join(',') : share,
        want_to_do_list: validateWantToDoList(wantToDoList || [])
      }
    });

    // 創建聯絡資訊
    const contact = await tx.contacts.create({
      data: {
        google_id: tempUser.google_id,
        photo_url: tempUser.photo_url,
        is_subscribe_email: isSubscribeEmail,
        email: tempUser.email,
        ig: contactList?.instagram,
        discord: contactList?.discord,
        line: contactList?.line,
        fb: contactList?.facebook,
        threads: contactList?.threads,
        linkedin: contactList?.linkedin,
        website: contactList?.website,
        github: contactList?.github
      }
    });

    // 創建用戶
    const newUser = await tx.users.create({
      data: {
        mongo_id: crypto.randomUUID(),
        nickname: resolvedNickname,
        gender: gender as 'male' | 'female' | 'other' | undefined,
        education_stage: (educationStage as 'elementary' | 'junior_high' | 'high' | 'associate' | 'university' | 'master' | 'doctorate' | 'other') || 'other',
        tag_list: [],  // Tags will be handled separately via entity_tags
        contact_id: contact.id,
        is_open_location: isOpenLocation ?? true,
        location_id: locationId,
        role_id: 2, // 默認角色
        is_open_profile: isOpenProfile ?? true,
        birth_date: birthDay ? new Date(birthDay) : null,
        basic_info_id: basicInfo.id,
        created_at: new Date(),

        // 新增欄位
        personal_slogan: personalSlogan,
        referral_source: referralSource,
        custom_id: customId,
        custom_id_verified: customId ? true : false, // 如果在創建時設置,直接驗證
        custom_id_created_at: customId ? new Date() : null,
      }
    });

    // 處理追蹤標籤（來自 ?ref= URL 參數）
    if (referralSource) {
      await tx.$executeRaw`
        INSERT INTO user_tag_assignments (user_id, tag_id, assigned_by, assigned_at)
        SELECT ${newUser.id}, id, 'system', NOW()
        FROM user_tags
        WHERE tracking_slug = ${referralSource}
        ON CONFLICT (user_id, tag_id) DO NOTHING
      `;
    }

    // 處理職位關聯
    if (positionList && positionList.length > 0) {
      const positions = await tx.position.findMany({
        where: { name: { in: positionList } }
      });

      if (positions.length > 0) {
        await tx.user_positions.createMany({
          data: positions.map(position => ({
            user_id: newUser.id,
            position_id: position.id
          }))
        });
      }
    }

    // 獲取完整的用戶資訊
    const createdUser = await tx.users.findUnique({
      where: { id: newUser.id },
      include: {
        roles: true,
        location: {
          include: {
            city: true,
            country: true
          }
        },
        contacts: true,
        basic_info: true,
        user_positions: {
          include: {
            position: true
          }
        }
      }
    });

    if (!createdUser) {
      throw new Error('Failed to retrieve created user');
    }

    // Handle preferences
    if (preferences) {
      await handleUserPreferences(createdUser.id, preferences, tx);
    }
    
    // Handle tags via entity_tags table
    if (tagList && tagList.length > 0) {
      await tagService.setEntityTags('user', createdUser.id, tagList, createdUser.id, tx);
    }

    // Handle interests (interestList)
    if (interestList && interestList.length > 0) {
      await setUserInterests(createdUser.id, interestList, tx);
    }

    // 處理專業領域（新增）
    if (professionalField && professionalField.length > 0) {
      await professionalFieldService.setUserProfessionalFields(
        createdUser.id,
        professionalField,
        tx
      );
    }

    // 生成新 token
    const newToken = jwtService.generateToken({
      id: createdUser.id,
      _id: createdUser.external_id || '',
      isTemp: false,
    });

    // 收集郵件發送資料，在 transaction commit 後才發送
    let pendingEmail: PendingEmailData | null = null;
    if (isSendEmail && createdUser.contacts?.email) {
      pendingEmail = {
        email: createdUser.contacts.email,
        verifyLink: `${process.env.BACKEND_URL}/api/v1/auth/verify-email?token=${newToken}`,
        nickname: createdUser.nickname || undefined,
        userId: createdUser.id
      };
    }

    // 刪除臨時用戶（應在 user 創建成功後執行，不論是否發送郵件）
    await tx.temp_users.delete({ where: { id: tempUser.id } });

    const result = {
      // 傳遞 tx 以在 transaction 中讀取最新創建的資料
      user: await formatUserResponse(createdUser, tx),
      token: newToken
    };

    return {
      response: createSuccessResponse(result),
      emailData: pendingEmail,
      onboardingData: { userId: newUser.id, referralSource: referralSource ?? null, registrationFlow: registrationFlow ?? null },
    };
  });

  // Transaction 已 commit，現在發送驗證郵件（含 email_logs 記錄）
  if (emailData) {
    await emailService.sendVerificationEmail(
      emailData.email,
      emailData.verifyLink,
      emailData.nickname,
      emailData.userId
    );
  }

  // 建立 Onboarding 記錄（await 確保後續 quiz hook 能找到記錄）
  // skipL0Email: email 尚未驗證，歡迎信延後到驗證成功再寄
  try {
    const fromQuiz = onboardingData.registrationFlow === 'quiz';
    await onboardingService.createOnboarding(
      onboardingData.userId,
      deriveUserSource(onboardingData.referralSource, fromQuiz),
      onboardingData.registrationFlow ?? undefined,
      { skipL0Email: true },
    );
  } catch (err: unknown) {
    loggerService.warn('Failed to create onboarding record', {
      userId: onboardingData.userId,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // 認領匿名測驗結果（臨時用戶轉正式用戶時，用正式的 users.id 認領）
  let quizClaimed = false;
  if (opts?.quizClaimToken) {
    try {
      const claimed = await quizService.claimByToken(onboardingData.userId, opts.quizClaimToken);
      if (claimed) {
        quizClaimed = true;
        loggerService.info('Claimed pending quiz result during registration', { userId: onboardingData.userId });
      }
    } catch (err: unknown) {
      loggerService.warn('Failed to claim quiz result during registration', {
        userId: onboardingData.userId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return { ...response, quizClaimed };
};

/**
 * 更新用戶
 */
const updateUser = async (externalId: string, userData: UpdateUserRequest): Promise<ApiSuccessResponse<FormattedUserResponse>> => {
  return await prisma.$transaction(async (tx) => {
    const user = await tx.users.findUnique({
      where: { external_id: externalId },
      include: { 
        contacts: true, 
        basic_info: true,
        user_preferences: {
          where: {
            is_selected: true
          },
          include: {
            preference_options: {
              include: {
                preference_types: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      throw new NotFoundError('用戶不存在');
    }

    const {
      name: nickname,
      photoURL,
      gender,
      birthDay,
      contactList,
      educationStage,
      isOpenLocation,
      isOpenProfile,
      isSubscribeEmail,
      location: areaCode,
      selfIntroduction,
      share,
      wantToDoList,
      tagList,
      positionList,
      preferences,
      // 新增欄位
      professionalField,
      personalSlogan,
      referralSource,
      hideConnectionsCount,
      interestList,
      customId
    } = userData;

    // 處理地區更新 - 使用 cityService 查找或建立 location
    let locationId: number | null | undefined = undefined;
    if (areaCode !== undefined) {
      if (areaCode === null || areaCode === '') {
        locationId = null;
      } else {
        locationId = await cityService.findOrCreateLocation(areaCode, tx);

        if (locationId === null) {
          throw new ConflictError(`'${areaCode}' 不是有效的城市代碼`);
        }
      }
    }

    // 處理 customId 更新
    let customIdData: {
      custom_id?: string | null;
      custom_id_verified?: boolean;
      custom_id_created_at?: Date | null;
    } | undefined = undefined;

    if (customId !== undefined) {
      // 驗證格式
      if (customId && !validateCustomIdFormat(customId)) {
        throw new ConflictError(CUSTOM_ID_ERROR_MESSAGES.FORMAT);
      }

      // 檢查是否與其他用戶重複（排除自己）
      if (customId) {
        const existingCustomId = await tx.users.findFirst({
          where: {
            custom_id: customId,
            id: { not: user.id }
          }
        });

        if (existingCustomId) {
          throw new ConflictError(CUSTOM_ID_ERROR_MESSAGES.ALREADY_EXISTS);
        }

        // 設置新的 customId
        customIdData = {
          custom_id: customId,
          custom_id_verified: true,
          custom_id_created_at: user.custom_id ? user.custom_id_created_at : new Date()
        };
      } else {
        // 清除 customId（傳入空字串或 null）
        customIdData = {
          custom_id: null,
          custom_id_verified: false,
          custom_id_created_at: null
        };
      }
    }

    // 更新聯絡方式
    // 使用 emptyToNull 處理：undefined = 不更新，空字串 = 清空
    if (user.contacts) {
      const contactData: Record<string, string | boolean | null | undefined> = {};

      if (photoURL !== undefined) {
        contactData.photo_url = photoURL;
      }
      if (isSubscribeEmail !== undefined) {
        contactData.is_subscribe_email = isSubscribeEmail;
      }
      if (contactList !== undefined) {
        contactData.ig = emptyToNull(contactList.instagram);
        contactData.discord = emptyToNull(contactList.discord);
        contactData.line = emptyToNull(contactList.line);
        contactData.fb = emptyToNull(contactList.facebook);
        contactData.threads = emptyToNull(contactList.threads);
        contactData.linkedin = emptyToNull(contactList.linkedin);
        contactData.website = emptyToNull(contactList.website);
        contactData.github = emptyToNull(contactList.github);
      }

      if (Object.keys(contactData).length > 0) {
        await tx.contacts.update({
          where: { id: user.contacts.id },
          data: contactData
        });
      }
    }

    // 更新基本資訊
    if (user.basic_info) {
      await tx.basic_info.update({
        where: { id: user.basic_info.id },
        data: {
          self_introduction: selfIntroduction,
          share_list: Array.isArray(share) ? share.join(',') : share,
          want_to_do_list: wantToDoList ? validateWantToDoList(wantToDoList) : undefined
        }
      });
    }

    // 更新用戶主表
    await tx.users.update({
      where: { id: user.id },
      data: {
        nickname,
        gender: gender as 'male' | 'female' | 'other' | undefined,
        tag_list: [],  // Tags will be handled separately via entity_tags
        education_stage: educationStage as 'elementary' | 'junior_high' | 'high' | 'associate' | 'university' | 'master' | 'doctorate' | 'other' | undefined,
        is_open_location: isOpenLocation,
        is_open_profile: isOpenProfile,
        birth_date: birthDay ? new Date(birthDay) : undefined,
        location_id: locationId,
        updated_at: new Date(),

        // 新增欄位
        personal_slogan: personalSlogan,
        referral_source: referralSource,
        hide_connections_count: hideConnectionsCount,

        // customId 更新
        ...customIdData,
      }
    });

    // 更新職位關聯
    if (positionList && Array.isArray(positionList)) {
      // 刪除現有關聯
      await tx.user_positions.deleteMany({
        where: { user_id: user.id }
      });

      // 添加新關聯
      if (positionList.length > 0) {
        const positions = await tx.position.findMany({
          where: { name: { in: positionList } }
        });

        if (positions.length > 0) {
          await tx.user_positions.createMany({
            data: positions.map(position => ({
              user_id: user.id,
              position_id: position.id
            }))
          });
        }
      }
    }

    // Handle tags via entity_tags table
    if (tagList !== undefined) {
      await tagService.setEntityTags('user', user.id, tagList || [], user.id, tx);
    }

    // Handle preferences
    if (preferences !== undefined) {
      await handleUserPreferences(user.id, preferences, tx);
    }

    // Handle interests (interestList)
    if (interestList !== undefined) {
      await setUserInterests(user.id, interestList || [], tx);
    }

    // 更新專業領域（新增）
    if (professionalField !== undefined) {
      await professionalFieldService.setUserProfessionalFields(
        user.id,
        professionalField || [],
        tx
      );
    }

    // 獲取更新後的完整用戶資訊
    const updatedUser = await tx.users.findUnique({
      where: { external_id: externalId },
      include: {
        roles: true,
        location: {
          include: {
            city: true,
            country: true
          }
        },
        contacts: true,
        basic_info: true,
        user_positions: {
          include: {
            position: true
          }
        },
        user_preferences: {
          where: {
            is_selected: true
          },
          include: {
            preference_options: {
              include: {
                preference_types: true
              }
            }
          }
        },
        user_professional_fields: {
          include: {
            professional_fields: {
              select: { value: true }
            }
          }
        }
      }
    });

    if (!updatedUser) {
      throw new Error('Failed to retrieve updated user');
    }

    // 傳遞 tx 以在 transaction 中讀取最新更新的資料
    const formattedUser = await formatUserResponse(updatedUser, tx);
    return createSuccessResponse(formattedUser);
  });
};

/**
 * 從 URL 提取 R2 檔案名稱
 * @param url R2 圖片 URL
 * @returns 檔案名稱（包含路徑）
 */
const extractR2FilenameFromUrl = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    // 移除開頭的斜線
    return urlObj.pathname.replace(/^\//, '');
  } catch {
    return null;
  }
};

/**
 * 更新用戶（含頭像上傳）
 * 實作 FormData 統一提交方案，處理圖片上傳邏輯
 *
 * 流程：
 * 1. 驗證表單資料
 * 2. 上傳新頭像到 R2（如果有）
 * 3. 更新資料庫（使用 transaction）
 * 4. 成功後刪除舊頭像
 * 5. 失敗時刪除已上傳的新頭像
 */
const updateUserWithAvatar = async (
  externalId: string,
  userData: UpdateUserWithAvatarRequest
): Promise<ApiSuccessResponse<FormattedUserResponse>> => {
  const { avatarFile, ...updateData } = userData;

  // 如果沒有頭像檔案，直接使用原有的 updateUser 邏輯
  if (!avatarFile) {
    return updateUser(externalId, updateData);
  }

  // 驗證檔案類型和大小
  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const MAX_AVATAR_SIZE = 500 * 1024; // 500KB

  if (!ALLOWED_IMAGE_TYPES.includes(avatarFile.mimetype)) {
    throw new BadRequestError(
      `不支援的圖片格式: ${avatarFile.mimetype}。支援格式: ${ALLOWED_IMAGE_TYPES.join(', ')}`
    );
  }

  if (avatarFile.size > MAX_AVATAR_SIZE) {
    throw new BadRequestError(
      `檔案大小超過限制: ${Math.round(avatarFile.size / 1024)}KB (最大: ${MAX_AVATAR_SIZE / 1024}KB)`
    );
  }

  // 取得用戶資訊，確認舊頭像 URL
  const user = await prisma.users.findUnique({
    where: { external_id: externalId },
    include: { contacts: true }
  });

  if (!user) {
    throw new NotFoundError('用戶不存在');
  }

  const oldAvatarUrl = user.contacts?.photo_url;
  let newAvatarUrl: string | undefined;
  let newAvatarFilename: string | undefined;

  try {
    // Step 1: 上傳新頭像到 R2
    const fileExtension = avatarFile.originalname.split('.').pop() || 'jpg';
    newAvatarFilename = `avatars/${uuidv4()}.${fileExtension}`;

    await uploadToR2(avatarFile, newAvatarFilename);

    // 建構完整的 URL
    const baseUrl = process.env.R2_PUBLIC_URL ||
      `https://${process.env.R2_BUCKET_NAME}.${process.env.R2_ENDPOINT?.replace('https://', '')}`;
    newAvatarUrl = `${baseUrl}/${newAvatarFilename}`;

    // Step 2: 更新資料庫（含新頭像 URL）
    const result = await updateUser(externalId, {
      ...updateData,
      photoURL: newAvatarUrl
    });

    // Step 3: 資料庫更新成功後，刪除舊頭像
    if (oldAvatarUrl) {
      const oldFilename = extractR2FilenameFromUrl(oldAvatarUrl);
      if (oldFilename) {
        // 非同步刪除舊頭像，不阻塞回應
        deleteFromR2(oldFilename).catch(err => {
          loggerService.warn('Failed to delete old avatar', { oldAvatarUrl, error: err });
        });
      }
    }

    return result;

  } catch (error) {
    // Step 4: 如果更新失敗，刪除已上傳的新頭像
    if (newAvatarFilename) {
      await deleteFromR2(newAvatarFilename).catch(err => {
        loggerService.warn('Failed to cleanup uploaded avatar', { newAvatarFilename, error: err });
      });
    }
    throw error;
  }
};

/**
 * 刪除當前用戶（硬刪除）
 * 完全移除用戶及所有關聯資料，同時清除 temp_users 以允許重新註冊
 * 主要用途：讓 PM/設計師可以重複測試註冊流程
 */
const deleteMe = async (externalId: string): Promise<ApiSuccessResponse<{ message: string }>> => {
  await prisma.$transaction(async (tx) => {
    const user = await tx.users.findUnique({
      where: { external_id: externalId },
      include: { contacts: true }
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const userId = user.id;

    // --- 1. 刪除 onDelete: NoAction 的關聯表（DB 不會自動 cascade） ---
    await tx.rating.deleteMany({ where: { user_id: userId } });
    await tx.user_preferences.deleteMany({ where: { user_id: userId } });
    await tx.user_positions.deleteMany({ where: { user_id: userId } });
    await tx.user_permissions.deleteMany({ where: { user_id: userId } });
    await tx.user_join_group.deleteMany({ where: { user_id: userId } });
    await tx.store.deleteMany({ where: { user_id: userId } });
    await tx.project.deleteMany({ where: { user_id: userId } });
    await tx.groups.updateMany({
      where: { created_by: userId },
      data: { created_by: null }
    });
    await tx.marathon.updateMany({
      where: { created_by: userId },
      data: { created_by: null }
    });

    // --- 2. 保存關聯 ID ---
    const contactId = user.contact_id;
    const basicInfoId = user.basic_info_id;
    const activityStatsId = user.activity_stats_id;
    const googleId = user.contacts?.google_id;
    const appleId = user.contacts?.apple_id;
    const email = user.contacts?.email;

    // --- 3. 刪除用戶（其餘 onDelete: Cascade 的關聯會由 DB 自動處理） ---
    await tx.users.delete({ where: { id: userId } });

    // --- 4. 刪除用戶指向的關聯資料（contacts, basic_info, activity_stats） ---
    if (contactId) {
      await tx.contacts.delete({ where: { id: contactId } });
    }
    if (basicInfoId) {
      await tx.basic_info.delete({ where: { id: basicInfoId } });
    }
    if (activityStatsId) {
      await tx.user_activity_stats.delete({ where: { id: activityStatsId } });
    }

    // --- 5. 刪除 temp_users（允許同一 OAuth 帳號重新註冊） ---
    if (googleId) {
      await tx.temp_users.deleteMany({ where: { google_id: googleId } });
    }
    if (appleId) {
      await tx.temp_users.deleteMany({ where: { apple_id: appleId } });
    }
    if (email) {
      await tx.temp_users.deleteMany({ where: { email } });
    }
  });

  return createSuccessResponse({ message: '用戶已成功刪除' });
};

/**
 * 刪除用戶（管理員功能）
 */
const deleteUser = async (userId: number): Promise<ApiSuccessResponse<{ message: string }>> => {
  await prisma.$transaction(async (tx) => {
    const user = await tx.users.findUnique({
      where: { id: userId },
      include: { 
        contacts: true, 
        basic_info: true,
        user_preferences: {
          where: {
            is_selected: true
          },
          include: {
            preference_options: {
              include: {
                preference_types: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      throw new NotFoundError('用戶不存在');
    }

    // 刪除用戶職位關聯
    await tx.user_positions.deleteMany({
      where: { user_id: userId }
    });

    // 保存關聯資料以便稍後刪除
    const contacts = user.contacts;
    const basicInfo = user.basic_info;

    // 先刪除用戶（解除外鍵引用）
    await tx.users.delete({
      where: { id: userId }
    });

    // 再刪除關聯資料
    if (contacts) {
      await tx.contacts.delete({
        where: { id: contacts.id }
      });
    }

    if (basicInfo) {
      await tx.basic_info.delete({
        where: { id: basicInfo.id }
      });
    }
  });

  return createSuccessResponse({ message: '用戶已成功刪除' });
};

/**
 * 檢查自訂 ID 可用性
 */
const checkCustomIdAvailability = async (customId: string): Promise<ApiSuccessResponse<{ customId: string; available: boolean }>> => {
  // 使用共享的驗證函數
  if (!validateCustomIdFormat(customId)) {
    return createSuccessResponse({ customId, available: false });
  }

  // 檢查資料庫中是否已存在
  const existingUser = await prisma.users.findFirst({
    where: { custom_id: customId }
  });

  return createSuccessResponse({ customId, available: !existingUser });
};

/**
 * 設置用戶自訂 ID
 */
const setCustomId = async (userId: number, customId: string): Promise<ApiSuccessResponse<{ id: string; customId: string; message: string }>> => {
  // 使用共享的驗證函數
  if (!validateCustomIdFormat(customId)) {
    throw new ConflictError(CUSTOM_ID_ERROR_MESSAGES.FORMAT);
  }

  try {
    return await prisma.$transaction(async (tx) => {
      // 檢查是否已被使用
      const existingUser = await tx.users.findFirst({
        where: { custom_id: customId }
      });

      if (existingUser) {
        throw new ConflictError(CUSTOM_ID_ERROR_MESSAGES.ALREADY_EXISTS);
      }

      // 檢查用戶是否存在
      const user = await tx.users.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new NotFoundError('用戶不存在');
      }

      // 檢查用戶是否已有自訂 ID
      if (user.custom_id) {
        throw new ConflictError(CUSTOM_ID_ERROR_MESSAGES.USER_HAS_CUSTOM_ID);
      }

      // 設置自訂 ID
      await tx.users.update({
        where: { id: userId },
        data: {
          custom_id: customId,
          custom_id_verified: true, // 簡化版本直接設為已驗證
          custom_id_created_at: new Date()
        }
      });

      return createSuccessResponse({
        id: user.external_id || '',
        customId,
        message: '自訂 ID 設置成功'
      });
    });
  } catch (error: unknown) {
    // 處理 Prisma 的唯一約束違反錯誤 (P2002)
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { code: string; meta?: { target?: string[] } };
      if (prismaError.code === 'P2002' && prismaError.meta?.target?.includes('custom_id')) {
        throw new ConflictError(CUSTOM_ID_ERROR_MESSAGES.ALREADY_EXISTS);
      }
    }
    throw error;
  }
};

/**
 * 透過自訂 ID 查詢用戶
 */
const getUserByCustomId = async (customId: string): Promise<ApiSuccessResponse<FormattedUserResponse> | null> => {
  const user = await prisma.users.findFirst({
    where: { custom_id: customId },
    include: {
      roles: true,
      location: {
        include: {
          city: true,
          country: true
        }
      },
      contacts: true,
      basic_info: true,
      user_positions: {
        include: {
          position: true
        }
      }
    }
  });

  if (!user) {
    return null;
  }

  const formattedUser = await formatUserResponse(user);
  return createSuccessResponse(formattedUser);
};

/**
 * 移除用戶自訂 ID
 */
const removeCustomId = async (userId: number): Promise<ApiSuccessResponse<{ message: string }>> => {
  const user = await prisma.users.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new NotFoundError('用戶不存在');
  }

  if (!user.custom_id) {
    throw new ConflictError(CUSTOM_ID_ERROR_MESSAGES.NOT_SET);
  }

  await prisma.users.update({
    where: { id: userId },
    data: {
      custom_id: null,
      custom_id_verified: false,
      custom_id_created_at: null
    }
  });

  return createSuccessResponse({ message: '自訂 ID 已成功移除' });
};

/**
 * 獲取用戶偏好設定
 */
const getUserPreferences = async (userId: number, _params: PreferencesQueryParams): Promise<ApiSuccessResponse<{ preferences: UserPreference[]; categories: unknown[] }>> => {
  const where: Record<string, unknown> = { user_id: userId };

  const userPreferences = await prisma.user_preferences.findMany({
    where,
    include: {
      preference_options: {
        include: {
          preference_types: true
        }
      }
    }
  });

  const preferences = userPreferences.map(pref => ({
    id: pref.id,
    preferenceTypeId: pref.preference_options.preference_type_id,
    optionId: pref.preference_option_id,
    isSelected: pref.is_selected || false,
    preferenceType: {
      id: pref.preference_options.preference_types.id,
      name: pref.preference_options.preference_types.name,
      value: pref.preference_options.preference_types.value,
      description: pref.preference_options.preference_types.description ?? null,
      maxSelections: pref.preference_options.preference_types.max_selections ?? null,
      options: []
    },
    option: {
      id: pref.preference_options.id,
      value: pref.preference_options.value,
      name: pref.preference_options.name,
      description: pref.preference_options.description ?? null
    }
  }));

  // Get categories (for now, return empty array to match interface)
  const categories: unknown[] = [];

  return createSuccessResponse({
    preferences,
    categories
  });
};

/**
 * 更新用戶偏好設定
 */
const updateUserPreferences = async (
  userId: number, 
  requestData: { preferences: Array<{ preferenceTypeId: number; optionId: number; isSelected: boolean }> }
): Promise<ApiSuccessResponse<{ updated: number; created: number; deleted: number; message: string }>> => {
  return await prisma.$transaction(async (tx) => {
    const user = await tx.users.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundError('用戶不存在');
    }

    // 處理偏好設定
    let updated = 0;
    let created = 0;
    let deleted = 0;

    for (const pref of requestData.preferences) {
      // 檢查選項是否存在
      const option = await tx.preference_options.findUnique({
        where: { id: pref.optionId },
        include: { preference_types: true }
      });

      if (!option) {
        throw new Error(`偏好選項不存在: ${pref.optionId}`);
      }

      if (option.preference_type_id !== pref.preferenceTypeId) {
        throw new Error('偏好類型與選項不匹配');
      }

      // 查找現有的偏好設定
      const existingPref = await tx.user_preferences.findUnique({
        where: {
          user_id_preference_option_id: {
            user_id: userId,
            preference_option_id: pref.optionId
          }
        }
      });

      if (pref.isSelected) {
        // 如果選擇此選項
        if (existingPref) {
          // 更新現有記錄
          await tx.user_preferences.update({
            where: { id: existingPref.id },
            data: {
              is_selected: true,
              updated_at: new Date()
            }
          });
          updated++;
        } else {
          // 創建新記錄
          await tx.user_preferences.create({
            data: {
              user_id: userId,
              preference_option_id: pref.optionId,
              is_selected: true
            }
          });
          created++;
        }
      } else {
        // 如果不選擇此選項，刪除現有記錄
        if (existingPref) {
          await tx.user_preferences.delete({
            where: { id: existingPref.id }
          });
          deleted++;
        }
      }
    }

    return createSuccessResponse({
      updated,
      created,
      deleted,
      message: '偏好設定更新成功'
    });
  });
};

/**
 * 獲取可用的偏好選項
 */
const getAvailablePreferences = async (): Promise<ApiSuccessResponse<Array<{
  id: number;
  name: string;
  value: string;
  maxSelections: number | null;
  description: string | null;
  options: Array<{
    id: number;
    name: string;
    value: string;
    description: string | null;
  }>;
}>>> => {
  const preferenceTypes = await prisma.preference_types.findMany({
    include: {
      preference_options: {
        where: {
          is_active: true
        },
        orderBy: {
          display_order: 'asc'
        }
      }
    },
    where: {
      is_active: true
    },
    orderBy: {
      display_order: 'asc'
    }
  });

  const availablePreferences = preferenceTypes.map(type => ({
    id: type.id,
    name: type.name,
    value: type.value,
    maxSelections: type.max_selections,
    description: type.description,
    options: type.preference_options.map(option => ({
      id: option.id,
      name: option.name,
      value: option.value,
      description: option.description
    }))
  }));

  return createSuccessResponse(availablePreferences);
};

/**
 * 更新用戶登入時間和次數
 * @param userId 用戶內部 ID
 * @param deviceInfo 可選的裝置資訊
 */
const updateLastLogin = async (
  userId: number,
  deviceInfo?: {
    deviceType?: string;
    os?: string;
    browser?: string;
    userAgent?: string;
    ipAddress?: string;
  }
): Promise<void> => {
  await prisma.$transaction(async (tx) => {
    // 獲取用戶的 activity_stats_id
    const user = await tx.users.findUnique({
      where: { id: userId },
      select: { activity_stats_id: true }
    });

    if (user?.activity_stats_id) {
      // 更新現有的 activity_stats 記錄
      await tx.user_activity_stats.update({
        where: { id: user.activity_stats_id },
        data: {
          last_login_at: new Date(),
          login_count: { increment: 1 },
          ...(deviceInfo && {
            last_device_type: deviceInfo.deviceType,
            last_os: deviceInfo.os,
            last_browser: deviceInfo.browser
          })
        }
      });
    } else {
      // 創建新的 activity_stats 記錄並關聯到用戶
      const activityStats = await tx.user_activity_stats.create({
        data: {
          last_login_at: new Date(),
          login_count: 1,
          ...(deviceInfo && {
            last_device_type: deviceInfo.deviceType,
            last_os: deviceInfo.os,
            last_browser: deviceInfo.browser
          })
        }
      });
      await tx.users.update({
        where: { id: userId },
        data: { activity_stats_id: activityStats.id }
      });
    }

    // 記錄登入歷史
    if (deviceInfo) {
      await tx.user_login_history.create({
        data: {
          user_id: userId,
          device_type: deviceInfo.deviceType,
          os: deviceInfo.os,
          browser: deviceInfo.browser,
          user_agent: deviceInfo.userAgent,
          ip_address: deviceInfo.ipAddress
        }
      });
    }
  });
};

/**
 * 更新用戶最後活動時間
 * @param userId 用戶內部 ID
 */
const updateLastActive = async (userId: number): Promise<void> => {
  // 獲取用戶的 activity_stats_id
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { activity_stats_id: true }
  });

  if (user?.activity_stats_id) {
    // 更新現有的 activity_stats 記錄
    await prisma.user_activity_stats.update({
      where: { id: user.activity_stats_id },
      data: { last_active_at: new Date() }
    });
  } else {
    // 創建新的 activity_stats 記錄並關聯到用戶
    const activityStats = await prisma.user_activity_stats.create({
      data: { last_active_at: new Date() }
    });
    await prisma.users.update({
      where: { id: userId },
      data: { activity_stats_id: activityStats.id }
    });
  }
};

/**
 * 增加用戶檔案被查看次數
 * @param userId 被查看用戶的內部 ID
 */
const incrementProfileViews = async (userId: number): Promise<void> => {
  // 獲取用戶的 activity_stats_id
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { activity_stats_id: true }
  });

  if (user?.activity_stats_id) {
    // 更新現有的 activity_stats 記錄
    await prisma.user_activity_stats.update({
      where: { id: user.activity_stats_id },
      data: { profile_views: { increment: 1 } }
    });
  } else {
    // 創建新的 activity_stats 記錄並關聯到用戶
    const activityStats = await prisma.user_activity_stats.create({
      data: { profile_views: 1 }
    });
    await prisma.users.update({
      where: { id: userId },
      data: { activity_stats_id: activityStats.id }
    });
  }
};

/**
 * 獲取用戶登入歷史
 * @param userId 用戶內部 ID
 * @param limit 限制數量，預設 10
 */
const getLoginHistory = async (
  userId: number,
  limit = 10
): Promise<ApiSuccessResponse<Array<{
  id: number;
  deviceType: string | null;
  os: string | null;
  browser: string | null;
  userAgent: string | null;
  ipAddress: string | null;
  loginAt: string | null;
}>>> => {
  const history = await prisma.user_login_history.findMany({
    where: { user_id: userId },
    orderBy: { login_at: 'desc' },
    take: limit
  });

  const formattedHistory = history.map(record => ({
    id: record.id,
    deviceType: record.device_type,
    os: record.os,
    browser: record.browser,
    userAgent: record.user_agent,
    ipAddress: record.ip_address,
    loginAt: record.login_at ? moment(record.login_at).toISOString() : null
  }));

  return createSuccessResponse(formattedHistory);
};

/**
 * 獲取用戶活躍統計
 * @param userId 用戶內部 ID
 */
const getUserActivityStats = async (
  userId: number
): Promise<ApiSuccessResponse<{
  lastLoginAt: string | null;
  lastActiveAt: string | null;
  loginCount: number;
  profileViews: number;
  recentLoginCount: number; // 最近 30 天登入次數
}>> => {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      user_activity_stats: {
        select: {
          last_login_at: true,
          last_active_at: true,
          login_count: true,
          profile_views: true
        }
      }
    }
  });

  if (!user) {
    throw new NotFoundError('用戶不存在');
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

  const activityStats = user.user_activity_stats;

  return createSuccessResponse({
    lastLoginAt: activityStats?.last_login_at ? moment(activityStats.last_login_at).toISOString() : null,
    lastActiveAt: activityStats?.last_active_at ? moment(activityStats.last_active_at).toISOString() : null,
    loginCount: activityStats?.login_count ?? 0,
    profileViews: activityStats?.profile_views ?? 0,
    recentLoginCount
  });
};

const getSettingsSections = async (userId: number): Promise<SettingsSections> => {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      nickname: true,
      custom_id: true,
      personal_slogan: true,
      education_stage: true,
      user_preferences: {
        where: { is_selected: true },
        take: 1
      },
      user_positions: {
        take: 1
      }
    }
  });

  if (!user) {
    throw new NotFoundError('用戶不存在');
  }

  return {
    onboarding: true,
    preferences: user.user_preferences.length > 0,
    account: user.user_positions.length > 0 && user.education_stage !== null,
    publicInfo: !!(user.nickname && user.custom_id && user.personal_slogan)
  };
};

const isOnboardingProfileComplete = async (userId: number): Promise<boolean> => {
  const sections = await getSettingsSections(userId);
  return sections.preferences && sections.account && sections.publicInfo;
};

/**
 * 獲取設定頁完整度摘要
 * 計算用戶四個設定區塊的完成狀態
 */
const getSettingsSummary = async (
  userId: number
): Promise<ApiSuccessResponse<{
  completed: number;
  total: number;
  sections: SettingsSections;
}>> => {
  const sections = await getSettingsSections(userId);

  const completed = Object.values(sections).filter(Boolean).length;

  return createSuccessResponse({
    completed,
    total: 4,
    sections
  });
};

/**
 * 查詢兩位使用者共同加入的 group 數量
 */
export async function getCommonCirclesCount(userId: number, viewerId: number): Promise<number> {
  const result = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) as count
    FROM user_join_group u1
    INNER JOIN user_join_group u2 ON u1.group_id = u2.group_id
    WHERE u1.user_id = ${userId}
      AND u2.user_id = ${viewerId}
  `;

  return Number(result[0]?.count ?? 0);
}

/**
 * 查詢用戶的 connections 數量（雙向關係：user_a 或 user_b）
 */
export async function getUserConnectionsCount(userId: number): Promise<number> {
  return prisma.connections.count({
    where: {
      OR: [
        { user_a_id: userId },
        { user_b_id: userId }
      ]
    }
  });
}

// 匯出服務函數
export const userService = {
  getAllUsers,
  getMe,
  getOneUser,
  createUser,
  updateUser,
  updateUserWithAvatar,
  deleteMe,
  deleteUser,
  checkCustomIdAvailability,
  setCustomId,
  getUserByCustomId,
  removeCustomId,
  getUserPreferences,
  updateUserPreferences,
  getAvailablePreferences,
  // 活躍狀態統計方法
  updateLastLogin,
  updateLastActive,
  incrementProfileViews,
  getLoginHistory,
  getUserActivityStats,
  isOnboardingProfileComplete,
  getSettingsSummary
} as const;

export default userService;
