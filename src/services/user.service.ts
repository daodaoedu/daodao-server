/**
 * 用戶服務 - 使用 Prisma
 * 處理用戶相關的資料庫操作
 */

import { prisma } from './database/prisma.service';
import { jwtService } from './jwt.service';
import { emailService } from './auth/email.service';
import {
  UserQueryParams,
  CreateUserRequest,
  UpdateUserRequest,
  FormattedUserResponse,
  CompletenessWeights
} from '../types/user.types';
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
  ConflictError 
} from '../middleware/error.middleware';
import { city_t, want_to_do_list_t } from '../../generated/prisma';
import moment from 'moment-timezone';
import { validate as isUuid } from 'uuid';
import tagService from './tag.service';

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
 */
const getUserInterests = async (userId: number): Promise<string[] | null> => {
  const interests = await prisma.user_interests.findMany({
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
 * 城市名稱映射表
 * 支持中文名稱和英文枚舉值的映射
 */
/**
 * 獲取城市名稱映射表（惰性初始化）
 */
const getCityNameMapping = (): Record<string, city_t> => {
  return {
    // 中文名稱映射
    '台北市': 'taipei_city' as city_t,
    '基隆市': 'keelung_city' as city_t,
    '新北市': 'new_taipei_city' as city_t,
    '連江縣': 'lianjiang_county' as city_t,
    '桃園市': 'taoyuan_city' as city_t,
    '新竹市': 'hsinchu_city' as city_t,
    '新竹縣': 'hsinchu_county' as city_t,
    '苗栗縣': 'miaoli_county' as city_t,
    '台中市': 'taichung_city' as city_t,
    '彰化縣': 'changhua_county' as city_t,
    '雲林縣': 'yunlin_county' as city_t,
    '嘉義縣': 'chiayi_county' as city_t,
    '嘉義市': 'chiayi_city' as city_t,
    '台南市': 'tainan_city' as city_t,
    '南投縣': 'nantou_county' as city_t,
    '高雄市': 'kaohsiung_city' as city_t,
    '屏東縣': 'pingtung_county' as city_t,
    '海南島': 'hainan_island' as city_t,
    '澎湖縣': 'penghu_county' as city_t,
    '金門縣': 'kinmen_county' as city_t,
    // 英文枚舉值直接映射
    'taipei_city': 'taipei_city' as city_t,
    'keelung_city': 'keelung_city' as city_t,
    'new_taipei_city': 'new_taipei_city' as city_t,
    'lianjiang_county': 'lianjiang_county' as city_t,
    'taoyuan_city': 'taoyuan_city' as city_t,
    'hsinchu_city': 'hsinchu_city' as city_t,
    'hsinchu_county': 'hsinchu_county' as city_t,
    'miaoli_county': 'miaoli_county' as city_t,
    'taichung_city': 'taichung_city' as city_t,
    'changhua_county': 'changhua_county' as city_t,
    'yunlin_county': 'yunlin_county' as city_t,
    'chiayi_county': 'chiayi_county' as city_t,
    'chiayi_city': 'chiayi_city' as city_t,
    'tainan_city': 'tainan_city' as city_t,
    'nantou_county': 'nantou_county' as city_t,
    'kaohsiung_city': 'kaohsiung_city' as city_t,
    'pingtung_county': 'pingtung_county' as city_t,
    'hainan_island': 'hainan_island' as city_t,
    'penghu_county': 'penghu_county' as city_t,
    'kinmen_county': 'kinmen_county' as city_t,
    'yilan_county': 'yilan_county' as city_t,
    'hualien_county': 'hualien_county' as city_t,
    'taitung_county': 'taitung_county' as city_t,
    'other': 'other' as city_t,
    'tbd': 'tbd' as city_t,
    'online': 'online' as city_t
  };
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
    } | null;
  } | null;
  user_positions?: Array<{
    position: {
      name: string;
    };
  }>;
}

const formatUserResponse = async (user: PrismaUserWithRelations): Promise<FormattedUserResponse> => {
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
    tagList: await getUserTags(user.id) || null,
    wantToDoList: user.basic_info?.want_to_do_list ?
      user.basic_info.want_to_do_list.map(item => String(item)) : null,
    educationStage: (user.education_stage as 'university' | 'high' | 'other') || null,
    selfIntroduction: user.basic_info?.self_introduction || null,
    share: user.basic_info?.share_list || null,
    interestList: await getUserInterests(user.id),
    preferences: preferences || null,
    contactList: {
      email: user.contacts?.email || null,
      photoURL: user.contacts?.photo_url || null,
      isSubscribeEmail: user.contacts?.is_subscribe_email || null,
      instagram: user.contacts?.ig || null,
      discord: user.contacts?.discord || null,
      line: user.contacts?.line || null,
      facebook: user.contacts?.fb || null
    },
    basicInfo: {
      selfIntroduction: user.basic_info?.self_introduction || null,
      shareList: user.basic_info?.share_list || null,
      wantToDoList: user.basic_info?.want_to_do_list ?
        user.basic_info.want_to_do_list.map(item => String(item)) : null
    },
    roleList: user.user_positions?.map((up) => up.position.name) || null,
    customId: user.custom_id || null,
    customIdVerified: user.custom_id_verified || null,
    customIdCreatedAt: user.custom_id_created_at ?
      moment(user.custom_id_created_at).toISOString() : null,

    // 新增欄位
    professionalField: (user.professional_field as import('../types/user.types').ProfessionalField) || null,
    personalSlogan: user.personal_slogan || null,
    referralSource: user.referral_source || null,

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
    roleList,
    location,
    search
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
  if (roleList) {
    whereConditions.user_positions = {
      some: {
        position: {
          name: {
            in: String(roleList).split(',')
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

  // 查詢用戶
  const users = await prisma.users.findMany({
    where: whereConditions,
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
      }
    },
    orderBy: {
      created_at: 'desc'
    }
  });

  // 計算完整度並排序
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

  // 按完整度排序
  usersWithCompleteness.sort((a, b) => b.completenessScore - a.completenessScore);

  // 分頁
  const paginatedUsers = usersWithCompleteness
    .slice(offset, offset + currentPageSize)
    .map(item => item.user);

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
      roleList: roleList || undefined,
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
 */
const getOneUser = async (externalId: string): Promise<ApiSuccessResponse<FormattedUserResponse> | null> => {
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
 * 創建用戶
 */
const createUser = async (userData: CreateUserRequest, tempUserId: string): Promise<ApiSuccessResponse<{ user: FormattedUserResponse; token: string }>> => {
  return await prisma.$transaction(async (tx) => {
    const {
      gender,
      birthDate,
      contactList,
      educationStage,
      isOpenLocation,
      isOpenProfile,
      isSubscribeEmail,
      location: areaCode,
      roleList,
      selfIntroduction,
      share,
      wantToDoList,
      tagList,
      preferences,
      isSendEmail,
      // 新增欄位
      professionalField,
      personalSlogan,
      referralSource,
      interestList,
      customId
    } = userData;

    // 查找臨時用戶
    const tempUser = await tx.temp_users.findUnique({
      where: { id: parseInt(tempUserId) }
    });

    if (!tempUser) {
      throw new NotFoundError('Temporary user not found');
    }

    // 檢查用戶名稱是否已存在
    const existingUser = await tx.users.findFirst({
      where: { nickname: tempUser.name }
    });

    if (existingUser) {
      throw new ConflictError(`使用者名稱 ${tempUser.name} 已存在`);
    }

    // 檢查 customId 是否已被使用(如果有提供)
    if (customId) {
      // 檢查格式 - 使用改進的正則表達式
      const isValidFormat = /^[a-zA-Z0-9](?:[a-zA-Z0-9_-]*[a-zA-Z0-9])?$/.test(customId) &&
                           customId.length >= 3 &&
                           customId.length <= 50;

      if (!isValidFormat) {
        throw new ConflictError('自訂 ID 格式不正確：需3-50個字符,只能包含英文字母、數字、底線和連字符,且不能以底線或連字符開頭/結尾');
      }

      const existingCustomId = await tx.users.findUnique({
        where: { custom_id: customId }
      });

      if (existingCustomId) {
        throw new ConflictError(`自訂 ID "${customId}" 已被使用`);
      }
    }

    // 處理地區
    let locationId: number | null = null;
    if (areaCode) {
      // 根據城市名稱映射獲取對應的枚舉值
      const cityEnum = getCityNameMapping()[areaCode];
      
      if (!cityEnum) {
        throw new ConflictError(`'${areaCode}' 不是有效的城市名稱`);
      }
      
      // 查找對應的 location
      const location = await tx.location.findFirst({
        where: {
          city: {
            name: cityEnum
          }
        }
      });
      
      if (!location) {
        throw new ConflictError(`找不到城市 '${areaCode}' 對應的地區資料`);
      }
      locationId = location.id;
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
        fb: contactList?.facebook
      }
    });

    // 創建用戶
    const newUser = await tx.users.create({
      data: {
        mongo_id: tempUser.id.toString(), // Use temp user ID as mongo_id
        nickname: tempUser.name,
        gender: gender as 'male' | 'female' | 'other' | undefined,
        education_stage: (educationStage as 'university' | 'high' | 'other') || 'other',
        tag_list: [],  // Tags will be handled separately via entity_tags
        contact_id: contact.id,
        is_open_location: isOpenLocation ?? true,
        location_id: locationId,
        role_id: 2, // 默認角色
        is_open_profile: isOpenProfile ?? true,
        birth_date: birthDate ? new Date(birthDate) : null,
        basic_info_id: basicInfo.id,

        // 新增欄位
        professional_field: professionalField,
        personal_slogan: personalSlogan,
        referral_source: referralSource,
        custom_id: customId,
        custom_id_verified: customId ? true : false, // 如果在創建時設置,直接驗證
        custom_id_created_at: customId ? new Date() : null,
      }
    });

    // 處理職位關聯
    if (roleList && roleList.length > 0) {
      const positions = await tx.position.findMany({
        where: { name: { in: roleList } }
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

    // 生成新 token
    const newToken = jwtService.generateToken({
      id: createdUser.id,
      _id: createdUser.external_id || '',
      isTemp: false,
    });

    // 發送註冊郵件
    if (isSendEmail && createdUser.contacts?.email) {
      // 發送驗證郵件
      await emailService.sendVerificationEmail(
        createdUser.contacts.email, 
        `${process.env.BACKEND_URL}/email/verify?token=${newToken}`
      );
      
      // 刪除臨時用戶
      await tx.temp_users.delete({ where: { id: tempUser.id } });
    }

    const result = {
      user: await formatUserResponse(createdUser),
      token: newToken
    };

    return createSuccessResponse(result);
  });
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
      photoUrl,
      gender,
      birthDate,
      contactList,
      educationStage,
      isOpenLocation,
      isOpenProfile,
      isSubscribeEmail,
      selfIntroduction,
      share,
      wantToDoList,
      tagList,
      roleList,
      preferences,
      // 新增欄位
      professionalField,
      personalSlogan,
      referralSource,
      interestList
    } = userData;

    // 更新聯絡方式
    if (user.contacts) {
      await tx.contacts.update({
        where: { id: user.contacts.id },
        data: {
          photo_url: photoUrl,
          is_subscribe_email: isSubscribeEmail,
          ig: contactList?.instagram,
          discord: contactList?.discord,
          line: contactList?.line,
          fb: contactList?.facebook
        }
      });
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
        education_stage: educationStage as 'university' | 'high' | 'other' | undefined,
        is_open_location: isOpenLocation,
        is_open_profile: isOpenProfile,
        birth_date: birthDate ? new Date(birthDate) : undefined,
        updated_at: new Date(),

        // 新增欄位
        professional_field: professionalField,
        personal_slogan: personalSlogan,
        referral_source: referralSource,
      }
    });

    // 更新職位關聯
    if (roleList && Array.isArray(roleList)) {
      // 刪除現有關聯
      await tx.user_positions.deleteMany({
        where: { user_id: user.id }
      });

      // 添加新關聯
      if (roleList.length > 0) {
        const positions = await tx.position.findMany({
          where: { name: { in: roleList } }
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
        }
      }
    });

    if (!updatedUser) {
      throw new Error('Failed to retrieve updated user');
    }

    const formattedUser = await formatUserResponse(updatedUser);
    return createSuccessResponse(formattedUser);
  });
};

/**
 * 刪除當前用戶
 */
const deleteMe = async (externalId: string): Promise<ApiSuccessResponse<{ message: string }>> => {
  await prisma.$transaction(async (tx) => {
    const user = await tx.users.findUnique({
      where: { external_id: externalId }
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // 刪除用戶職位關聯
    await tx.user_positions.deleteMany({
      where: { user_id: user.id }
    });

    // 刪除關聯資料
    if (user.contact_id) {
      await tx.contacts.delete({
        where: { id: user.contact_id }
      });
    }

    if (user.basic_info_id) {
      await tx.basic_info.delete({
        where: { id: user.basic_info_id }
      });
    }

    // 刪除用戶
    await tx.users.delete({
      where: { id: user.id }
    });
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

    // 刪除關聯資料
    if (user.contacts) {
      await tx.contacts.delete({
        where: { id: user.contacts.id }
      });
    }

    if (user.basic_info) {
      await tx.basic_info.delete({
        where: { id: user.basic_info.id }
      });
    }

    // 刪除用戶
    await tx.users.delete({
      where: { id: userId }
    });
  });

  return createSuccessResponse({ message: '用戶已成功刪除' });
};

/**
 * 檢查自訂 ID 可用性
 */
const checkCustomIdAvailability = async (customId: string): Promise<ApiSuccessResponse<{ available: boolean }>> => {
  // 基本格式檢查 - 使用改進的正則表達式
  const isValidFormat = /^[a-zA-Z0-9](?:[a-zA-Z0-9_-]*[a-zA-Z0-9])?$/.test(customId) &&
                       customId.length >= 3 &&
                       customId.length <= 50;

  if (!isValidFormat) {
    return createSuccessResponse({ available: false });
  }

  // 檢查資料庫中是否已存在
  const existingUser = await prisma.users.findUnique({
    where: { custom_id: customId }
  });

  return createSuccessResponse({ available: !existingUser });
};

/**
 * 設置用戶自訂 ID
 */
const setCustomId = async (userId: number, customId: string): Promise<ApiSuccessResponse<{ customId: string }>> => {
  // 檢查格式 - 使用改進的正則表達式
  const isValidFormat = /^[a-zA-Z0-9](?:[a-zA-Z0-9_-]*[a-zA-Z0-9])?$/.test(customId) &&
                       customId.length >= 3 &&
                       customId.length <= 50;

  if (!isValidFormat) {
    throw new ConflictError('自訂 ID 格式不正確：需3-50個字符，只能包含英文字母、數字、底線和連字符，且不能以底線或連字符開頭/結尾');
  }

  try {
    return await prisma.$transaction(async (tx) => {
      // 檢查是否已被使用
      const existingUser = await tx.users.findUnique({
        where: { custom_id: customId }
      });

      if (existingUser) {
        throw new ConflictError('此自訂 ID 已被使用');
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
        throw new ConflictError('用戶已設置自訂 ID，請先移除現有 ID');
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

      return createSuccessResponse({ customId });
    });
  } catch (error: unknown) {
    // 處理 Prisma 的唯一約束違反錯誤 (P2002)
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { code: string; meta?: { target?: string[] } };
      if (prismaError.code === 'P2002' && prismaError.meta?.target?.includes('custom_id')) {
        throw new ConflictError('此自訂 ID 已被其他用戶使用，請選擇其他 ID');
      }
    }
    throw error;
  }
};

/**
 * 透過自訂 ID 查詢用戶
 */
const getUserByCustomId = async (customId: string): Promise<ApiSuccessResponse<FormattedUserResponse> | null> => {
  const user = await prisma.users.findUnique({
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
    throw new ConflictError('用戶尚未設置自訂 ID');
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
  try {
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
        description: pref.preference_options.preference_types.description || undefined,
        maxSelections: pref.preference_options.preference_types.max_selections || undefined,
        options: []
      },
      option: {
        id: pref.preference_options.id,
        value: pref.preference_options.value,
        name: pref.preference_options.name,
        description: pref.preference_options.description || undefined
      }
    }));

    // Get categories (for now, return empty array to match interface)
    const categories: unknown[] = [];

    return createSuccessResponse({
      preferences,
      categories
    });

  } catch (error) {
    throw new Error('獲取個人偏好設定失敗');
  }
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
const getAvailablePreferences = async (): Promise<ApiSuccessResponse<Record<string, Array<{ name: string; value: string }>>>> => {
  const preferenceTypes = await prisma.preference_types.findMany({
    include: {
      preference_options: true
    }
  });

  const availablePreferences = preferenceTypes.reduce((acc, type) => {
    acc[type.value] = type.preference_options.map(option => ({
      name: option.name,
      value: option.value
    }));
    return acc;
  }, {} as Record<string, Array<{ name: string; value: string }>>);

  return createSuccessResponse(availablePreferences);
};

// 匯出服務函數
export const userService = {
  getAllUsers,
  getMe,
  getOneUser,
  createUser,
  updateUser,
  deleteMe,
  deleteUser,
  checkCustomIdAvailability,
  setCustomId,
  getUserByCustomId,
  removeCustomId,
  getUserPreferences,
  updateUserPreferences,
  getAvailablePreferences
} as const;

export default userService;