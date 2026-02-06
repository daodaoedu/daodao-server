/**
 * City Validators
 * 城市驗證器 - 使用 Zod 進行資料驗證
 */

import { z } from 'zod';
import { registry } from '../config/openapi-registry';

/**
 * 語系驗證
 */
export const localeSchema = z.enum(['zh-TW', 'en', 'default'])
  .optional()
  .default('default')
  .describe("語系，決定城市名稱顯示語言")
  .meta({
    title: "語系",
    examples: ['zh-TW', 'en', 'default'],
    enumDescriptions: {
      "zh-TW": "繁體中文",
      "en": "英文",
      "default": "預設（優先繁中，次英文，最後代碼）"
    }
  });

/**
 * 城市列表查詢參數驗證
 */
export const getCitiesQuerySchema = z.object({
  country: z.string()
    .length(2, '國家代碼必須是 2 個字元（ISO 3166-1 alpha-2）')
    .toUpperCase()
    .optional()
    .describe("國家代碼（ISO 3166-1 alpha-2）")
    .meta({
      title: "國家代碼",
      examples: ["TW", "JP", "US", "KR"]
    }),
  search: z.string()
    .min(1, '搜尋關鍵字至少需要 1 個字元')
    .max(50, '搜尋關鍵字不能超過 50 字元')
    .optional()
    .describe("搜尋關鍵字（支援城市代碼、中文名、英文名）")
    .meta({
      title: "搜尋關鍵字",
      examples: ["tokyo", "東京", "taipei"]
    }),
  locale: localeSchema,
  limit: z.union([z.string(), z.number()])
    .optional()
    .transform(val => {
      if (val === undefined) return "50";
      return typeof val === 'string' ? val : String(val);
    })
    .pipe(
      z.string()
        .regex(/^\d+$/, '限制數量必須是數字')
        .transform(Number)
        .refine(n => n > 0 && n <= 200, '限制數量必須在 1-200 之間')
    )
    .describe("回傳數量限制")
    .meta({
      title: "限制數量",
      examples: ["20", "50", "100"]
    })
}).describe("城市列表查詢參數").meta({
  title: "城市查詢",
  examples: [{
    country: "TW"
  }, {
    search: "tokyo",
    locale: "en"
  }, {
    limit: "20"
  }]
});

/**
 * 城市資料 Schema
 */
export const cityDataSchema = z.object({
  id: z.number()
    .openapi({ description: "城市 ID", example: 1 }),
  code: z.string()
    .openapi({ description: "城市代碼（唯一識別）", example: "taipei_city" }),
  name: z.string()
    .openapi({ description: "城市顯示名稱（依語系）", example: "台北市" }),
  nameEn: z.string().nullable()
    .openapi({ description: "英文名稱", example: "Taipei City" }),
  nameZhTw: z.string().nullable()
    .openapi({ description: "繁體中文名稱", example: "台北市" }),
  countryCode: z.string().nullable()
    .openapi({ description: "國家代碼", example: "TW" }),
  countryName: z.string().nullable()
    .openapi({ description: "國家名稱", example: "Taiwan" }),
  isActive: z.boolean()
    .openapi({ description: "是否啟用", example: true })
}).openapi('CityData', {
  description: '城市資料',
  example: {
    id: 1,
    code: 'taipei_city',
    name: '台北市',
    nameEn: 'Taipei City',
    nameZhTw: '台北市',
    countryCode: 'TW',
    countryName: 'Taiwan',
    isActive: true
  }
});

// 註冊 CityData
registry.register('CityData', cityDataSchema);

/**
 * 國家資料 Schema
 */
export const countryDataSchema = z.object({
  id: z.number()
    .openapi({ description: "國家 ID", example: 1 }),
  code: z.string()
    .openapi({ description: "國家代碼（ISO 3166-1 alpha-2）", example: "TW" }),
  name: z.string()
    .openapi({ description: "國家名稱", example: "Taiwan" }),
  nameEn: z.string().nullable()
    .openapi({ description: "英文名稱", example: "Taiwan" })
}).openapi('CountryData', {
  description: '國家資料',
  example: {
    id: 1,
    code: 'TW',
    name: 'Taiwan',
    nameEn: 'Taiwan'
  }
});

// 註冊 CountryData
registry.register('CountryData', countryDataSchema);

// API Response schemas - 直接返回陣列（比照其他 API）
export const getCitiesApiResponseSchema = z.object({
  success: z.literal(true).describe('Indicates successful API response'),
  data: z.array(cityDataSchema).describe('城市資料陣列'),
  timestamp: z.string().datetime().describe('ISO 8601 timestamp of the response'),
  meta: z.object({
    searchQuery: z.string().optional(),
    processingTime: z.number().optional()
  }).optional().describe('Optional metadata')
}).openapi('GetCitiesResponse', {
  description: '城市列表回應',
  example: {
    success: true,
    data: [
      {
        id: 1,
        code: 'taipei_city',
        name: '台北市',
        nameEn: 'Taipei City',
        nameZhTw: '台北市',
        countryCode: 'TW',
        countryName: 'Taiwan',
        isActive: true
      },
      {
        id: 2,
        code: 'new_taipei_city',
        name: '新北市',
        nameEn: 'New Taipei City',
        nameZhTw: '新北市',
        countryCode: 'TW',
        countryName: 'Taiwan',
        isActive: true
      }
    ],
    timestamp: '2024-01-15T10:30:00.000Z'
  }
});

export const getCountriesApiResponseSchema = z.object({
  success: z.literal(true).describe('Indicates successful API response'),
  data: z.array(countryDataSchema).describe('國家資料陣列'),
  timestamp: z.string().datetime().describe('ISO 8601 timestamp of the response'),
  meta: z.object({
    processingTime: z.number().optional()
  }).optional().describe('Optional metadata')
}).openapi('GetCountriesResponse', {
  description: '國家列表回應',
  example: {
    success: true,
    data: [
      {
        id: 1,
        code: 'TW',
        name: 'Taiwan',
        nameEn: 'Taiwan'
      },
      {
        id: 2,
        code: 'JP',
        name: 'Japan',
        nameEn: 'Japan'
      }
    ],
    timestamp: '2024-01-15T10:30:00.000Z'
  }
});

// 類型導出
export type Locale = z.infer<typeof localeSchema>;
export type GetCitiesQuery = z.infer<typeof getCitiesQuerySchema>;
export type CityData = z.infer<typeof cityDataSchema>;
export type CountryData = z.infer<typeof countryDataSchema>;
