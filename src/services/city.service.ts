/**
 * 城市服務層
 * 處理城市相關的資料庫操作，支援全球城市
 */

import { prisma } from './database/prisma.service';
import { Prisma } from '../../generated/prisma';
import type { ApiSuccessResponse } from '../types/api-response.types';
import { createSuccessResponse } from '../utils/response-helper';

/**
 * 城市資料介面
 */
export interface CityData {
  id: number;
  code: string;
  name: string;
  nameEn: string | null;
  nameZhTw: string | null;
  countryCode: string | null;
  countryName: string | null;
  isActive: boolean;
}

/**
 * 國家資料介面
 */
export interface CountryData {
  id: number;
  code: string;
  name: string;
  nameEn: string | null;
}

/**
 * 支援的語系
 */
export type Locale = 'zh-TW' | 'en' | 'default';

/**
 * 根據語系獲取城市顯示名稱
 * 優先順序: locale 指定語言 → name_zh_tw → name_en → name (code)
 */
const getDisplayName = (
  city: { name: string; name_en: string | null; name_zh_tw: string | null },
  locale: Locale = 'default'
): string => {
  if (locale === 'en' && city.name_en) {
    return city.name_en;
  }
  if (locale === 'zh-TW' && city.name_zh_tw) {
    return city.name_zh_tw;
  }
  // 預設 fallback: name_zh_tw → name_en → name
  return city.name_zh_tw || city.name_en || city.name;
};

/**
 * 格式化城市資料
 */
const formatCityData = (
  city: {
    id: number;
    name: string;
    name_en: string | null;
    name_zh_tw: string | null;
    is_active: boolean | null;
    country: { alpha2: string | null; name: string } | null;
  },
  locale: Locale = 'default'
): CityData => {
  return {
    id: city.id,
    code: city.name,
    name: getDisplayName(city, locale),
    nameEn: city.name_en,
    nameZhTw: city.name_zh_tw,
    countryCode: city.country?.alpha2 || null,
    countryName: city.country?.name || null,
    isActive: city.is_active ?? true
  };
};

/**
 * 取得所有啟用的城市
 * @param locale 語系，用於決定顯示名稱
 * @param limit 回傳數量限制
 * @returns ApiSuccessResponse 包含城市列表
 */
const getAllCitiesApi = async (
  locale: Locale = 'default',
  limit = 50
): Promise<ApiSuccessResponse<CityData[]>> => {
  const cities = await prisma.city.findMany({
    where: {
      is_active: true
    },
    include: {
      country: {
        select: {
          alpha2: true,
          name: true
        }
      }
    },
    orderBy: [
      { country_id: 'asc' },
      { name: 'asc' }
    ],
    take: limit
  });

  const data = cities.map(city => formatCityData(city, locale));
  return createSuccessResponse(data);
};

/**
 * 按國家篩選城市
 * @param countryCode ISO 3166-1 alpha-2 國家代碼 (例如: TW, JP, US)
 * @param locale 語系
 * @param limit 回傳數量限制
 * @returns ApiSuccessResponse 包含該國家的城市列表
 */
const getCitiesByCountryApi = async (
  countryCode: string,
  locale: Locale = 'default',
  limit = 50
): Promise<ApiSuccessResponse<CityData[]>> => {
  const cities = await prisma.city.findMany({
    where: {
      is_active: true,
      country: {
        alpha2: { equals: countryCode, mode: 'insensitive' }
      }
    },
    include: {
      country: {
        select: {
          alpha2: true,
          name: true
        }
      }
    },
    orderBy: {
      name: 'asc'
    },
    take: limit
  });

  const data = cities.map(city => formatCityData(city, locale));
  return createSuccessResponse(data);
};

/**
 * 搜尋城市
 * @param query 搜尋關鍵字（支援 code、中文名、英文名）
 * @param locale 語系
 * @param limit 回傳數量限制
 * @returns ApiSuccessResponse 包含符合條件的城市列表
 */
const searchCitiesApi = async (
  query: string,
  locale: Locale = 'default',
  limit = 20
): Promise<ApiSuccessResponse<CityData[]>> => {
  const cities = await prisma.city.findMany({
    where: {
      is_active: true,
      OR: [
        { name: { contains: query, mode: Prisma.QueryMode.insensitive } },
        { name_en: { contains: query, mode: Prisma.QueryMode.insensitive } },
        { name_zh_tw: { contains: query, mode: Prisma.QueryMode.insensitive } }
      ]
    },
    include: {
      country: {
        select: {
          alpha2: true,
          name: true
        }
      }
    },
    orderBy: {
      name: 'asc'
    },
    take: limit
  });

  const data = cities.map(city => formatCityData(city, locale));
  return createSuccessResponse(data);
};

/**
 * 取得所有國家列表
 * @returns ApiSuccessResponse 包含國家列表
 */
const getAllCountriesApi = async (): Promise<ApiSuccessResponse<CountryData[]>> => {
  const countries = await prisma.country.findMany({
    orderBy: {
      name: 'asc'
    }
  });

  const data = countries.map(country => ({
    id: country.id,
    code: country.alpha2 || '',
    name: country.name,
    nameEn: country.name_en
  }));

  return createSuccessResponse(data);
};

/**
 * 根據城市代碼取得詳細資訊
 * @param cityCode 城市代碼（city.name 欄位）
 * @returns 城市資料或 null
 */
const getCityByCode = async (cityCode: string): Promise<CityData | null> => {
  const city = await prisma.city.findFirst({
    where: {
      name: cityCode
    },
    include: {
      country: {
        select: {
          alpha2: true,
          name: true
        }
      }
    }
  });

  if (!city) {
    return null;
  }

  return formatCityData(city);
};

/**
 * 驗證城市代碼是否有效
 * @param cityCode 城市代碼
 * @returns 是否為有效且啟用的城市代碼
 */
const validateCityCode = async (cityCode: string): Promise<boolean> => {
  const city = await prisma.city.findFirst({
    where: {
      name: cityCode,
      is_active: true
    },
    select: {
      id: true
    }
  });

  return city !== null;
};

/**
 * 查找或建立 location 記錄
 * 當城市有效但無對應 location 記錄時，自動建立
 *
 * 使用 find-then-create 模式，並處理併發情況：
 * 如果在 findFirst 和 create 之間有其他請求建立了相同的 location，
 * 會捕獲錯誤並重新查詢，確保返回有效的 location ID。
 *
 * @param cityCode 城市代碼（city.name 欄位）
 * @param tx Prisma 交易客戶端（可選，用於事務操作）
 * @returns location ID 或 null（如果城市無效）
 */
const findOrCreateLocation = async (
  cityCode: string,
  tx?: Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>
): Promise<number | null> => {
  const client = tx || prisma;

  // 查找城市
  const city = await client.city.findFirst({
    where: {
      name: cityCode,
      is_active: true
    },
    include: {
      country: {
        select: {
          id: true
        }
      }
    }
  });

  if (!city) {
    return null;
  }

  // 查找現有的 location
  const existingLocation = await client.location.findFirst({
    where: {
      city_id: city.id
    }
  });

  if (existingLocation) {
    return existingLocation.id;
  }

  // 嘗試建立新的 location，處理併發情況
  try {
    const newLocation = await client.location.create({
      data: {
        city_id: city.id,
        country_id: city.country?.id || null,
        isTaiwan: city.country?.id ? await isTaiwanCountry(city.country.id, client) : null
      }
    });

    return newLocation.id;
  } catch (error) {
    // 如果併發請求已建立相同的 location，重新查詢並返回
    // 這處理了 find 和 create 之間的 race condition
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // P2002: Unique constraint violation (如果未來加上 unique constraint)
      // 其他錯誤可能是併發建立導致的重複
      const retryLocation = await client.location.findFirst({
        where: {
          city_id: city.id
        }
      });

      if (retryLocation) {
        return retryLocation.id;
      }
    }

    // 如果不是併發問題，重新拋出錯誤
    throw error;
  }
};

/**
 * 判斷是否為台灣
 */
const isTaiwanCountry = async (
  countryId: number,
  client: Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>
): Promise<boolean> => {
  const country = await client.country.findUnique({
    where: { id: countryId },
    select: { alpha2: true }
  });
  return country?.alpha2 === 'TW';
};

export const cityService = {
  getAllCitiesApi,
  getCitiesByCountryApi,
  searchCitiesApi,
  getAllCountriesApi,
  getCityByCode,
  validateCityCode,
  findOrCreateLocation
} as const;

export default cityService;
