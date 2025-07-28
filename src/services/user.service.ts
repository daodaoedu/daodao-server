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
  PaginatedUsersResponse,
  CompletenessWeights
} from '../types/user.types';
import { 
  NotFoundError,
  ConflictError 
} from '../utils/error-handler';
import { city_t, want_to_do_list_t } from '../../generated/prisma';
import moment from 'moment-timezone';
import { validate as isUuid } from 'uuid';

/**
 * 城市名稱映射表
 * 支持中文名稱和英文枚舉值的映射
 */
const cityNameMapping: Record<string, city_t> = {
  // 中文名稱映射
  '台北市': city_t.taipei_city,
  '基隆市': city_t.keelung_city,
  '新北市': city_t.new_taipei_city,
  '連江縣': city_t.lianjiang_county,
  '桃園市': city_t.taoyuan_city,
  '新竹市': city_t.hsinchu_city,
  '新竹縣': city_t.hsinchu_county,
  '苗栗縣': city_t.miaoli_county,
  '台中市': city_t.taichung_city,
  '彰化縣': city_t.changhua_county,
  '雲林縣': city_t.yunlin_county,
  '嘉義縣': city_t.chiayi_county,
  '嘉義市': city_t.chiayi_city,
  '台南市': city_t.tainan_city,
  '南投縣': city_t.nantou_county,
  '高雄市': city_t.kaohsiung_city,
  '屏東縣': city_t.pingtung_county,
  '海南島': city_t.hainan_island,
  '澎湖縣': city_t.penghu_county,
  '金門縣': city_t.kinmen_county,
  // 英文枚舉值直接映射
  'taipei_city': city_t.taipei_city,
  'keelung_city': city_t.keelung_city,
  'new_taipei_city': city_t.new_taipei_city,
  'lianjiang_county': city_t.lianjiang_county,
  'taoyuan_city': city_t.taoyuan_city,
  'hsinchu_city': city_t.hsinchu_city,
  'hsinchu_county': city_t.hsinchu_county,
  'miaoli_county': city_t.miaoli_county,
  'taichung_city': city_t.taichung_city,
  'changhua_county': city_t.changhua_county,
  'yunlin_county': city_t.yunlin_county,
  'chiayi_county': city_t.chiayi_county,
  'chiayi_city': city_t.chiayi_city,
  'tainan_city': city_t.tainan_city,
  'nantou_county': city_t.nantou_county,
  'kaohsiung_city': city_t.kaohsiung_city,
  'pingtung_county': city_t.pingtung_county,
  'hainan_island': city_t.hainan_island,
  'penghu_county': city_t.penghu_county,
  'kinmen_county': city_t.kinmen_county,
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
const formatToTaipeiTime = (date: Date | null | undefined): string | null => {
  if (!date) return null;
  return moment(date).tz('Asia/Taipei').format('YYYY-MM-DD HH:mm:ss');
};

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

const formatUserResponse = (user: PrismaUserWithRelations): FormattedUserResponse => {
  return {
    id: user.id,
    _id: user.external_id || '',
    name: user.nickname || undefined,
    gender: user.gender || undefined,
    email: user.contacts?.email || undefined,
    photoURL: user.contacts?.photo_url || undefined,
    birthDay: user.birth_date || undefined,
    isOpenLocation: user.is_open_location || undefined,
    isOpenProfile: user.is_open_profile || undefined,
    role: user.roles?.id,
    location: user.location?.city?.name || '',
    tagList: user.tag_list || [],
    wantToDoList: (user.basic_info?.want_to_do_list || []).map(item => String(item)),
    educationStage: user.education_stage || undefined,
    selfIntroduction: user.basic_info?.self_introduction || undefined,
    share: user.basic_info?.share_list || undefined,
    contactList: {
      email: user.contacts?.email || undefined,
      photoUrl: user.contacts?.photo_url || undefined,
      isSubscribeEmail: user.contacts?.is_subscribe_email || undefined,
      instagram: user.contacts?.ig || undefined,
      discord: user.contacts?.discord || undefined,
      line: user.contacts?.line || undefined,
      facebook: user.contacts?.fb || undefined
    },
    basicInfo: {
      selfIntroduction: user.basic_info?.self_introduction || undefined,
      shareList: user.basic_info?.share_list || undefined,
      wantToDoList: (user.basic_info?.want_to_do_list || []).map(item => String(item))
    },
    roleList: user.user_positions?.map((up) => up.position.name) || [],
    createdDate: formatToTaipeiTime(user.created_at) || '',
    updatedDate: formatToTaipeiTime(user.updated_at) || ''
  };
};

/**
 * 用戶服務類
 */
export class UserService {
  /**
   * 取得所有用戶
   */
  async getAllUsers(params: UserQueryParams): Promise<PaginatedUsersResponse> {
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

    const usersWithCompleteness = users.map(user => {
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

      if (user.tag_list && user.tag_list.length > 0) {
        const tagScore = Math.min(
          user.tag_list.length * completenessWeights.tag_list.tagWeight,
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
    });

    // 按完整度排序
    usersWithCompleteness.sort((a, b) => b.completenessScore - a.completenessScore);

    // 分頁
    const paginatedUsers = usersWithCompleteness
      .slice(offset, offset + currentPageSize)
      .map(item => item.user);

    const formattedData = paginatedUsers.map(user => formatUserResponse(user));

    return {
      data: formattedData,
      page: currentPage,
      pageSize: currentPageSize,
      totalCount: users.length,
      totalPages: Math.ceil(users.length / currentPageSize)
    };
  }

  /**
   * 獲取當前用戶
   */
  async getMe(externalId: string): Promise<FormattedUserResponse | null> {
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

    return formatUserResponse(user);
  }

  /**
   * 獲取指定用戶
   */
  async getOneUser(externalId: string): Promise<FormattedUserResponse | null> {
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

    return formatUserResponse(user);
  }

  /**
   * 創建用戶
   */
  async createUser(userData: CreateUserRequest, tempUserId: string): Promise<{ user: FormattedUserResponse; token: string }> {
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
        isSendEmail
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

      // 處理地區
      let locationId: number | null = null;
      if (areaCode) {
        // 根據城市名稱映射獲取對應的枚舉值
        const cityEnum = cityNameMapping[areaCode];
        
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
          nickname: tempUser.name,
          gender: gender as 'male' | 'female' | 'other' | undefined,
          education_stage: (educationStage as 'university' | 'high' | 'other') || 'other',
          tag_list: tagList || [],
          contact_id: contact.id,
          is_open_location: isOpenLocation ?? true,
          location_id: locationId,
          role_id: 2, // 默認角色
          is_open_profile: isOpenProfile ?? true,
          birth_date: birthDate ? new Date(birthDate) : null,
          basic_info_id: basicInfo.id,
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

      return {
        user: formatUserResponse(createdUser),
        token: newToken
      };
    });
  }

  /**
   * 更新用戶
   */
  async updateUser(externalId: string, userData: UpdateUserRequest): Promise<FormattedUserResponse> {
    return await prisma.$transaction(async (tx) => {
      const user = await tx.users.findUnique({
        where: { external_id: externalId },
        include: { contacts: true, basic_info: true }
      });

      if (!user) {
        throw new NotFoundError('用戶不存在');
      }

      const {
        name: nickname,
        email,
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
        roleList
      } = userData;

      // 更新聯絡方式
      if (user.contacts) {
        await tx.contacts.update({
          where: { id: user.contacts.id },
          data: {
            photo_url: photoUrl,
            is_subscribe_email: isSubscribeEmail,
            email,
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
          tag_list: tagList,
          education_stage: educationStage as 'university' | 'high' | 'other' | undefined,
          is_open_location: isOpenLocation,
          is_open_profile: isOpenProfile,
          birth_date: birthDate ? new Date(birthDate) : undefined,
          updated_at: new Date()
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
          }
        }
      });

      if (!updatedUser) {
        throw new Error('Failed to retrieve updated user');
      }

      return formatUserResponse(updatedUser);
    });
  }

  /**
   * 刪除當前用戶
   */
  async deleteMe(externalId: string): Promise<void> {
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
  }

  /**
   * 刪除用戶（管理員功能）
   */
  async deleteUser(userId: number): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const user = await tx.users.findUnique({
        where: { id: userId },
        include: { contacts: true, basic_info: true }
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
  }
}

export const userService = new UserService();
export default userService;