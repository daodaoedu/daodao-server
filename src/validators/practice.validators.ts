/**
 * Practice validation schemas
 * Using Zod for comprehensive input validation with proper error messages
 * Based on practice-api-v1.md specification
 *
 * 🔄 遷移到 @asteasolutions/zod-to-openapi:
 * 1. 將 .meta() 改為 .openapi()
 * 2. 使用 registry.register() 註冊可重用 schemas
 * 3. 統一 OpenAPI 文檔格式
 */

import { z } from 'zod';
import { registry } from '../config/openapi-registry';

// 基礎枚舉定義
export const practiceStatusSchema = z.enum(['draft', 'not_started', 'active', 'completed', 'archived']).openapi({
  description: '實踐活動狀態 (draft: 草稿, not_started: 未開始, active: 進行中, completed: 已完成, archived: 已封存)',
  example: 'not_started',
  examples: ['draft', 'not_started', 'active', 'completed', 'archived']
});

export const contentTypeSchema = z.enum(['book', 'video', 'articles', 'podcast', 'course', 'custom']).openapi({
  description: '內容類型 (book: 書籍, video: 影片, articles: 文章, podcast: 播客, course: 課程, custom: 自定義)',
  example: 'book',
  examples: ['book', 'video', 'articles', 'podcast', 'course', 'custom']
});

export const dailyGoalTypeSchema = z.enum(['time', 'completion']).openapi({
  description: '每日目標類型 (time: 時間目標, completion: 完成目標)',
  example: 'time',
  examples: ['time', 'completion']
});

// 每日目標 Schema
export const dailyGoalSchema = z.object({
  type: dailyGoalTypeSchema,
  timeMinutes: z.number({
    message: 'Time minutes must be a number'
  })
    .min(5, '時間目標最少5分鐘')
    .max(240, '時間目標最多240分鐘')
    .optional()
    .openapi({
      description: '每日時間目標（分鐘）',
      example: 60,
      examples: [30, 60, 90, 120]
    }),
  amount: z.number({
    message: 'Amount must be a number'
  })
    .min(1, '數量目標最少1')
    .max(100, '數量目標最多100')
    .optional()
    .openapi({
      description: '每日數量目標',
      example: 3,
      examples: [1, 3, 5, 10]
    }),
  unit: z.string()
    .max(10, '單位不能超過10字符')
    .optional()
    .openapi({
      description: '數量單位',
      example: '章',
      examples: ['章', '頁', '集', '篇']
    })
}).openapi('DailyGoal', {
  description: '每日學習目標設定',
  example: {
    type: 'time',
    timeMinutes: 60
  },
  examples: [
    {
      type: 'time',
      timeMinutes: 60
    },
    {
      type: 'completion',
      amount: 3,
      unit: '章'
    }
  ]
}).refine(data => {
  if (data.type === 'time' && !data.timeMinutes) {
    return false;
  }
  if (data.type === 'completion' && (!data.amount || !data.unit)) {
    return false;
  }
  return true;
}, {
  message: '時間類型需要timeMinutes，完成類型需要amount和unit',
  path: ['type']
});

// 註冊 DailyGoal 為可重用組件
registry.register('DailyGoal', dailyGoalSchema);

// 實踐資源 Schema (用於創建)
export const practiceResourceInputSchema = z.object({
  name: z.string({ message: '請輸入資源名稱' })
    .min(1, '請輸入資源名稱')
    .max(100, '資源名稱不可超過100字')
    .openapi({
      description: '實踐資源名稱',
      example: 'React 官方文檔',
      examples: ['React 官方文檔', '《你不知道的 JavaScript》', 'Vue.js 教學影片']
    }),
  url: z.string()
    .url('請輸入有效的網址')
    .optional()
    .or(z.literal(''))
    .openapi({
      description: '資源連結',
      example: 'https://react.dev/',
      examples: ['https://react.dev/', 'https://javascript.info/', 'https://vuejs.org/guide/'],
      format: 'uri'
    })
}).openapi('PracticeResourceInput', {
  description: '實踐資源輸入資料',
  example: {
    name: 'React 官方文檔',
    url: 'https://react.dev/'
  }
});

// 註冊 PracticeResourceInput
registry.register('PracticeResourceInput', practiceResourceInputSchema);

// 實踐資源 Schema (API 回應)
export const practiceResourceSchema = z.object({
  id: z.string()
    .uuid('資源ID格式不正確')
    .openapi({
      description: '資源唯一識別碼',
      example: '123e4567-e89b-12d3-a456-426614174000',
      format: 'uuid'
    }),
  name: z.string()
    .openapi({
      description: '資源名稱',
      example: 'React 官方文檔',
      examples: ['React 官方文檔', '《你不知道的 JavaScript》']
    }),
  url: z.string()
    .optional()
    .openapi({
      description: '資源網址',
      example: 'https://react.dev/',
      examples: ['https://react.dev/', 'https://javascript.info/'],
      format: 'uri'
    })
}).openapi('PracticeResource', {
  description: '實踐資源回應資料',
  example: {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'React 官方文檔',
    url: 'https://react.dev/'
  }
});

// 註冊 PracticeResource
registry.register('PracticeResource', practiceResourceSchema);

// 創建實踐請求 Schema
export const createPracticeSchema = z.object({
  title: z.string({ message: '請輸入標題' })
    .min(1, '請輸入標題')
    .max(100, '標題不可超過100字')
    .openapi({
      description: '實踐活動標題',
      example: '學習 React Hooks',
      examples: ['學習 React Hooks', '閱讀《深入理解計算機系統》', '練習 JavaScript 算法']
    }),
  contentType: contentTypeSchema,
  customContentType: z.string()
    .max(50, '自定義內容類型不可超過50字')
    .optional()
    .openapi({
      description: '自定義內容類型（當選擇 custom 時使用）',
      example: '程式設計練習',
      examples: ['程式設計練習', '語言學習', '技術文檔']
    }),
  totalAmount: z.number({
    message: '總量必須是數字'
  })
    .min(1, '總量必須大於0')
    .max(10000, '總量不可超過10000')
    .openapi({
      description: '學習內容的總量（如總頁數、總章節數等）',
      example: 300,
      examples: [300, 12, 50, 100]
    }),
  startDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '請輸入有效的日期格式 YYYY-MM-DD')
    .optional()
    .openapi({
      description: '實踐開始日期',
      example: '2024-01-15',
      examples: ['2024-01-15', '2024-03-01', '2024-06-01'],
      format: 'date'
    }),
  dailyGoal: dailyGoalSchema,
  practiceAction: z.string()
    .max(200, '實踐行動描述不可超過200字')
    .optional()
    .openapi({
      description: '具體的實踐行動描述',
      example: '每天閱讀並做筆記',
      examples: ['每天閱讀並做筆記', '觀看影片並實作練習', '完成課後習題']
    }),
  tags: z.array(z.string().min(1).max(50))
    .max(3, '標籤最多3個')
    .default([])
    .openapi({
      description: '相關標籤（最多3個）',
      example: ['JavaScript', '前端'],
      examples: [
        ['JavaScript', '前端'],
        ['React', 'Hooks', '實戰'],
        ['算法', '資料結構']
      ]
    }),
  resources: z.array(practiceResourceInputSchema)
    .max(5, '資源最多5個')
    .optional()
    .openapi({
      description: '相關學習資源（最多5個）',
      example: [{
        name: 'React 官方文檔',
        url: 'https://react.dev/'
      }]
    })
}).openapi('CreatePracticeRequest', {
  description: '創建實踐活動的請求資料',
  example: {
    title: '學習 React Hooks',
    contentType: 'course',
    totalAmount: 20,
    startDate: '2024-01-15',
    dailyGoal: {
      type: 'time',
      timeMinutes: 60
    },
    practiceAction: '每天學習 1 小時的 React Hooks 課程並做實作練習',
    tags: ['React', 'Hooks', '前端'],
    resources: [{
      name: 'React 官方文檔',
      url: 'https://react.dev/'
    }]
  }
}).refine(data => {
  if (data.contentType === 'custom' && !data.customContentType) {
    return false;
  }
  return true;
}, {
  message: '選擇自定義類型時，請填寫自定義內容類型',
  path: ['customContentType']
});

// 註冊 CreatePracticeRequest
registry.register('CreatePracticeRequest', createPracticeSchema);

// 更新實踐請求 Schema
export const updatePracticeSchema = z.object({
  title: z.string().min(1, '標題不能為空').max(100, '標題不可超過100字').optional(),
  totalAmount: z.number().min(1, '總量必須大於0').max(10000, '總量不可超過10000').optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '請輸入有效的日期格式 YYYY-MM-DD').optional(),
  dailyGoal: dailyGoalSchema.optional(),
  practiceAction: z.string().max(200, '實踐行動描述不可超過200字').optional(),
  tags: z.array(z.string().min(1).max(50)).max(3, '標籤最多3個').optional(),
  resources: z.array(practiceResourceInputSchema).max(5, '資源最多5個').optional(),
  status: practiceStatusSchema.optional()
}).refine(data => {
  // 至少要更新一個欄位
  return Object.keys(data).length > 0;
}, {
  message: '至少需要提供一個要更新的欄位'
});

// 簽到記錄 Schema
export const checkInSchema = z.object({
  progress: z.number({
    message: '進度必須是數字'
  })
    .min(0.01, '進度必須大於0')
    .openapi({
      description: '今日學習進度',
      example: 25,
      examples: [5, 10, 25, 50, 100]
    }),
  note: z.string()
    .max(500, '筆記不可超過500字')
    .optional()
    .openapi({
      description: '學習筆記',
      example: '今天學習了 React Hooks 的 useState',
      examples: ['今天學習了 React Hooks 的 useState', '完成了三個章節的練習題']
    }),
  mood: z.enum(['awesome', 'happy', 'neutral', 'tired', 'frustrated'])
    .optional()
    .openapi({
      description: '學習心情 (awesome: 非常棒, happy: 開心, neutral: 普通, tired: 疲累, frustrated: 挫折)',
      example: 'happy',
      examples: ['awesome', 'happy', 'neutral', 'tired', 'frustrated']
    }),
  reflectionText: z.string()
    .max(1000, '反思文字不可超過1000字')
    .optional()
    .openapi({
      description: '學習反思',
      example: '今天的學習效果很好，對 Hooks 的理解更深入了',
      examples: ['今天的學習效果很好，對 Hooks 的理解更深入了', '遇到了一些困難，需要多練習']
    }),
  relatedResourceId: z.string()
    .uuid('關聯資源ID格式不正確')
    .optional()
    .openapi({
      description: '相關資源ID',
      example: '123e4567-e89b-12d3-a456-426614174000',
      format: 'uuid'
    }),
  isPublic: z.boolean()
    .default(true)
    .openapi({
      description: '是否公開分享',
      example: true,
      examples: [true, false]
    }),
  tags: z.array(z.string().min(1).max(50))
    .max(5, '標籤最多5個')
    .default([])
    .openapi({
      description: '簽到標籤（最多5個）',
      example: ['React', '學習'],
      examples: [
        ['React', '學習'],
        ['JavaScript', '進步', '練習']
      ]
    })
}).openapi('CheckInRequest', {
  description: '實踐活動簽到記錄',
  example: {
    progress: 25,
    note: '今天學習了 React Hooks 的 useState 和 useEffect',
    mood: 'happy',
    reflectionText: '對 Hooks 的概念有了更清楚的理解',
    isPublic: true,
    tags: ['React', 'Hooks', '學習']
  }
});

// 註冊 CheckInRequest
registry.register('CheckInRequest', checkInSchema);

// 查詢參數 Schema
export const practiceQuerySchema = z.object({
  page: z.coerce.number({
    message: 'Page must be a number'
  }).min(1, 'Page must be at least 1').default(1),
  limit: z.coerce.number({
    message: 'Limit must be a number'
  }).min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(20),
  query: z.string().optional(),
  contentType: z.string().optional(), // 逗號分隔
  tags: z.string().optional(), // 逗號分隔
  userId: z.string().optional(),
  status: z.enum(['draft', 'not_started', 'active', 'completed', 'archived', 'all']).default('active'),
  sort: z.enum(['createdAt', 'updatedAt', 'likeCount'], 'Sort must be one of: createdAt, updatedAt, likeCount').default('createdAt'),
  order: z.enum(['asc', 'desc'], 'Order must be either asc or desc').default('desc'),
  include: z.string().optional() // resources, stats等
});

// 簽到查詢參數 Schema
export const checkInQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '請輸入有效的日期格式 YYYY-MM-DD').optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '請輸入有效的日期格式 YYYY-MM-DD').optional(),
  mood: z.string().optional(),
  include: z.string().optional() // interactions, comments等
});

// 事件記錄 Schema
export const practiceEventViewSchema = z.object({
  entityType: z.literal('practice'),
  entityId: z.string().min(1, 'Entity ID cannot be empty'),
  duration: z.number().min(0, 'Duration must be non-negative').optional()
});

export const practiceEventClickSchema = z.object({
  entityType: z.literal('practice'),
  entityId: z.string().min(1, 'Entity ID cannot be empty'),
  clickPosition: z.string().optional()
});

export const practiceEventShareSchema = z.object({
  entityType: z.literal('practice'),
  entityId: z.string().min(1, 'Entity ID cannot be empty'),
  shareChannel: z.string().min(1, '請指定分享渠道')
});

export const practiceEventFavoriteSchema = z.object({
  entityType: z.literal('practice'),
  entityId: z.string().min(1, 'Entity ID cannot be empty')
});

// 反應（點讚）Schema
export const reactionSchema = z.object({
  reactionType: z.string().default('like')
});

// URL 參數 Schema
export const practiceParamsSchema = z.object({
  id: z.string().min(1, 'Practice ID cannot be empty')
});

export const practiceCommentParamsSchema = z.object({
  id: z.coerce.number({
    message: 'Comment ID must be a number'
  }).int('Comment ID must be an integer').positive('Comment ID must be positive')
});

// 我的實踐查詢參數 Schema
export const myPracticesQuerySchema = practiceQuerySchema.extend({
  status: z.enum(['draft', 'not_started', 'active', 'completed', 'archived', 'all']).default('all')
});

// 型別導出
export type CreatePracticeRequest = z.infer<typeof createPracticeSchema>;
export type UpdatePracticeRequest = z.infer<typeof updatePracticeSchema>;
export type CheckInRequest = z.infer<typeof checkInSchema>;
export type PracticeQueryParams = z.infer<typeof practiceQuerySchema>;
export type CheckInQueryParams = z.infer<typeof checkInQuerySchema>;
export type PracticeResourceInput = z.infer<typeof practiceResourceInputSchema>;
export type PracticeResourceResponse = z.infer<typeof practiceResourceSchema>;
export type PracticeEventViewRequest = z.infer<typeof practiceEventViewSchema>;
export type PracticeEventClickRequest = z.infer<typeof practiceEventClickSchema>;
export type PracticeEventShareRequest = z.infer<typeof practiceEventShareSchema>;
export type PracticeEventFavoriteRequest = z.infer<typeof practiceEventFavoriteSchema>;
export type ReactionRequest = z.infer<typeof reactionSchema>;
export type PracticeParamsRequest = z.infer<typeof practiceParamsSchema>;
export type PracticeCommentParamsRequest = z.infer<typeof practiceCommentParamsSchema>;
export type MyPracticesQueryParams = z.infer<typeof myPracticesQuerySchema>;

// 驗證函數
export const validateCreatePractice = (data: unknown): CreatePracticeRequest => createPracticeSchema.parse(data);
export const validateUpdatePractice = (data: unknown): UpdatePracticeRequest => updatePracticeSchema.parse(data);
export const validateCheckIn = (data: unknown): CheckInRequest => checkInSchema.parse(data);
export const validatePracticeQuery = (data: unknown): PracticeQueryParams => practiceQuerySchema.parse(data);
export const validateCheckInQuery = (data: unknown): CheckInQueryParams => checkInQuerySchema.parse(data);
export const validatePracticeEventView = (data: unknown): PracticeEventViewRequest => practiceEventViewSchema.parse(data);
export const validatePracticeEventClick = (data: unknown): PracticeEventClickRequest => practiceEventClickSchema.parse(data);
export const validatePracticeEventShare = (data: unknown): PracticeEventShareRequest => practiceEventShareSchema.parse(data);
export const validatePracticeEventFavorite = (data: unknown): PracticeEventFavoriteRequest => practiceEventFavoriteSchema.parse(data);
export const validateReaction = (data: unknown): ReactionRequest => reactionSchema.parse(data);
export const validatePracticeParams = (data: unknown): PracticeParamsRequest => practiceParamsSchema.parse(data);
export const validatePracticeCommentParams = (data: unknown): PracticeCommentParamsRequest => practiceCommentParamsSchema.parse(data);
export const validateMyPracticesQuery = (data: unknown): MyPracticesQueryParams => myPracticesQuerySchema.parse(data);

// ===== Response Validation Schemas =====
// These schemas validate API response data to ensure consistency

import {
  apiSuccessResponseSchema,
  paginatedApiResponseSchema
} from './api-response.validators';

// 用戶基本信息 Schema (based on actual UserBasicInfo from common.types.ts)
export const userBasicInfoResponseSchema = z.object({
  id: z.string().openapi({ description: '用戶外部 UUID', example: '123e4567-e89b-12d3-a456-426614174000' }),
  name: z.string().openapi({ description: '用戶名稱', example: '學習者小明' }),
  photoURL: z.string().url().nullable().openapi({ description: '用戶頭像 URL', example: 'https://example.com/avatar/123.jpg', format: 'uri' }),
  roleList: z.array(z.string()).optional().openapi({ description: '用戶角色列表', example: ['學生', '開發者'] }),
  educationStage: z.string().nullable().optional().openapi({ description: '教育階段', example: '大學' }),
  tagList: z.array(z.string()).optional().openapi({ description: '用戶標籤列表', example: ['前端', 'React'] }),
  selfIntroduction: z.string().nullable().optional().openapi({ description: '自我介紹', example: '熱愛學習的開發者' })
}).openapi('UserBasicInfo', {
  description: '用戶基本資訊',
  example: {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: '學習者小明',
    photoURL: 'https://example.com/avatar/123.jpg',
    roleList: ['學生', '開發者'],
    educationStage: '大學',
    tagList: ['前端', 'React'],
    selfIntroduction: '熱愛學習的開發者'
  }
});

// 註冊 UserBasicInfo
registry.register('UserBasicInfo', userBasicInfoResponseSchema);

// 實踐統計 Schema (based on actual stats structure from service)
export const practiceStatsResponseSchema = z.object({
  likeCount: z.number().int().min(0).openapi({ description: '點讚數量', example: 25 }),
  viewCount: z.number().int().min(0).openapi({ description: '瀏覽數量', example: 150 }),
  favoriteCount: z.number().int().min(0).openapi({ description: '收藏數量', example: 12 }),
  shareCount: z.number().int().min(0).openapi({ description: '分享數量', example: 8 }),
  commentCount: z.number().int().min(0).openapi({ description: '評論數量', example: 3 })
}).openapi('PracticeStats', {
  description: '實踐活動統計資訊',
  example: {
    likeCount: 25,
    viewCount: 150,
    favoriteCount: 12,
    shareCount: 8,
    commentCount: 3
  }
});

// 註冊 PracticeStats
registry.register('PracticeStats', practiceStatsResponseSchema);

// 實踐活動回應 Schema (based on actual PracticeEntity from service)
export const practiceEntityResponseSchema = z.object({
  id: z.string().openapi({ description: '實踐活動外部 UUID', example: '123e4567-e89b-12d3-a456-426614174000', format: 'uuid' }),
  title: z.string().openapi({ description: '實踐活動標題', example: '學習 React Hooks' }),
  contentType: contentTypeSchema,
  customContentType: z.string().optional().openapi({ description: '自定義內容類型', example: '程式設計練習' }),
  totalAmount: z.number().int().min(1).openapi({ description: '總學習量', example: 20 }),
  currentProgress: z.number().min(0).openapi({ description: '當前進度', example: 8 }),
  startDate: z.string().optional().openapi({ description: '開始日期 (YYYY-MM-DD)', example: '2024-01-15', format: 'date' }),
  dailyGoal: dailyGoalSchema,
  practiceAction: z.string().optional().openapi({ description: '實踐行動描述', example: '每天學習 1 小時的 React Hooks 課程並做實作練習' }),
  status: practiceStatusSchema,
  hasResources: z.boolean().openapi({ description: '是否有相關資源', example: true }),
  streak: z.number().int().min(0).openapi({ description: '當前連續天數', example: 5 }),
  maxStreak: z.number().int().min(0).openapi({ description: '最大連續天數', example: 12 }),
  lastCheckInDate: z.string().optional().openapi({ description: '最後簽到日期', example: '2024-01-20', format: 'date' }),
  createdAt: z.string().datetime().openapi({ description: '創建時間', example: '2024-01-15T10:30:00.000Z', format: 'date-time' }),
  updatedAt: z.string().datetime().optional().openapi({ description: '更新時間', example: '2024-01-20T15:45:00.000Z', format: 'date-time' }),
  user: userBasicInfoResponseSchema,
  tags: z.array(z.string()).openapi({ description: '相關標籤', example: ['React', 'Hooks', '前端'] }),
  stats: practiceStatsResponseSchema
}).openapi('PracticeEntity', {
  description: '實踐活動詳細資訊',
  example: {
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: '學習 React Hooks',
    contentType: 'course',
    customContentType: null,
    totalAmount: 20,
    currentProgress: 8,
    startDate: '2024-01-15',
    dailyGoal: {
      type: 'time',
      timeMinutes: 60
    },
    practiceAction: '每天學習 1 小時的 React Hooks 課程並做實作練習',
    status: 'active',
    hasResources: true,
    streak: 5,
    maxStreak: 12,
    lastCheckInDate: '2024-01-20',
    createdAt: '2024-01-15T10:30:00.000Z',
    updatedAt: '2024-01-20T15:45:00.000Z',
    user: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: '學習者小明',
      photoURL: 'https://example.com/avatar/123.jpg',
      roleList: ['學生', '開發者'],
      educationStage: '大學',
      tagList: ['前端', 'React'],
      selfIntroduction: '熱愛學習的開發者'
    },
    tags: ['React', 'Hooks', '前端'],
    stats: {
      likeCount: 25,
      viewCount: 150,
      favoriteCount: 12,
      shareCount: 8,
      commentCount: 3
    }
  }
});

// 註冊 PracticeEntity
registry.register('PracticeEntity', practiceEntityResponseSchema);

// 簽到記錄回應 Schema (based on actual CheckInEntity from service)
export const checkInEntityResponseSchema = z.object({
  id: z.number().int().openapi({ description: '簽到記錄內部 ID', example: 456 }),
  practiceId: z.number().int().openapi({ description: '關聯的實踐活動內部 ID', example: 123 }),
  userId: z.number().int().openapi({ description: '簽到用戶內部 ID', example: 789 }),
  checkInDate: z.string().openapi({ description: '簽到日期', example: '2024-01-20', format: 'date' }),
  progressAmount: z.number().min(0).openapi({ description: '簽到進度數量', example: 50 }),
  unit: z.string().optional().openapi({ description: '進度單位（頁、章、集等）', example: '頁' }),
  note: z.string().optional().openapi({ description: '簽到筆記', example: '今天學習了 useState 和 useEffect' }),
  mood: z.enum(['awesome', 'happy', 'neutral', 'tired', 'frustrated']).optional().openapi({ description: '簽到心情', example: 'happy' }),
  reflectionText: z.string().optional().openapi({ description: '學習反思', example: '對 Hooks 的概念有了更清楚的理解' }),
  relatedResourceId: z.string().optional().openapi({ description: '相關資源 ID', example: 'res-123e4567-e89b-12d3-a456-426614174000' }),
  streakDay: z.number().int().min(0).openapi({ description: '連續簽到天數', example: 5 }),
  cumulativeProgress: z.number().min(0).openapi({ description: '累積進度', example: 8 }),
  createdAt: z.string().datetime().openapi({ description: '創建時間', example: '2024-01-20T15:45:00.000Z', format: 'date-time' }),
  updatedAt: z.string().datetime().optional().openapi({ description: '更新時間', example: '2024-01-20T15:45:00.000Z', format: 'date-time' })
}).openapi('CheckInEntity', {
  description: '簽到記錄詳細資訊',
  example: {
    id: 456,
    practiceId: 123,
    userId: 789,
    checkInDate: '2024-01-20',
    progressAmount: 50,
    unit: '頁',
    note: '今天學習了 useState 和 useEffect',
    mood: 'happy',
    reflectionText: '對 Hooks 的概念有了更清楚的理解',
    relatedResourceId: 'res-123e4567-e89b-12d3-a456-426614174000',
    streakDay: 5,
    cumulativeProgress: 8,
    createdAt: '2024-01-20T15:45:00.000Z',
    updatedAt: '2024-01-20T15:45:00.000Z'
  }
});

// 註冊 CheckInEntity
registry.register('CheckInEntity', checkInEntityResponseSchema);

// 實踐統計總覽 Schema (based on actual PracticeStats from service)
export const practiceUserStatsResponseSchema = z.object({
  totalPractices: z.number().int().min(0).openapi({ description: '總實踐數', example: 12 }),
  activePractices: z.number().int().min(0).openapi({ description: '活躍實踐數', example: 3 }),
  completedPractices: z.number().int().min(0).openapi({ description: '已完成實踐數', example: 7 }),
  totalCheckIns: z.number().int().min(0).openapi({ description: '總簽到次數', example: 245 }),
  averageStreak: z.number().min(0).openapi({ description: '平均連續天數', example: 8.5 }),
  maxStreak: z.number().int().min(0).openapi({ description: '最大連續天數', example: 25 })
}).openapi('PracticeUserStats', {
  description: '用戶實踐統計',
  example: {
    totalPractices: 12,
    activePractices: 3,
    completedPractices: 7,
    totalCheckIns: 245,
    averageStreak: 8.5,
    maxStreak: 25
  }
});

// 註冊 PracticeUserStats
registry.register('PracticeUserStats', practiceUserStatsResponseSchema);

// 互動操作回應 Schema (based on actual service responses)
export const toggleLikeResponseSchema = z.object({
  isLiked: z.boolean().describe("點讚狀態"),
  likeCount: z.number().int().min(0).describe("總點讚數")
}).describe("點讚操作回應").meta({
  title: "點讚操作回應",
  examples: [{
    isLiked: true,
    likeCount: 26
  }]
});

export const toggleFavoriteResponseSchema = z.object({
  isFavorited: z.boolean().describe("收藏狀態"),
  favoriteCount: z.number().int().min(0).describe("總收藏數")
}).describe("收藏操作回應").meta({
  title: "收藏操作回應",
  examples: [{
    isFavorited: true,
    favoriteCount: 13
  }]
});

export const recordShareResponseSchema = z.object({
  shareCount: z.number().int().min(0).describe("總分享數")
}).describe("分享記錄回應").meta({
  title: "分享記錄回應",
  examples: [{
    shareCount: 9
  }]
});

export const recordViewResponseSchema = z.object({
  viewCount: z.number().int().min(0).describe("總瀏覽數")
}).describe("瀏覽記錄回應").meta({
  title: "瀏覽記錄回應",
  examples: [{
    viewCount: 151
  }]
});

// 互動統計回應 Schema
export const interactionStatsResponseSchema = z.object({
  likeCount: z.number().int().min(0).describe("點讚數"),
  viewCount: z.number().int().min(0).describe("瀏覽數"),
  favoriteCount: z.number().int().min(0).describe("收藏數"),
  shareCount: z.number().int().min(0).describe("分享數"),
  commentCount: z.number().int().min(0).describe("評論數")
}).describe("互動統計回應").meta({
  title: "互動統計",
  examples: [{
    likeCount: 25,
    viewCount: 150,
    favoriteCount: 12,
    shareCount: 8,
    commentCount: 3
  }]
});

export const userInteractionStatusResponseSchema = z.object({
  isLiked: z.boolean().describe("是否已點讚"),
  isFavorited: z.boolean().describe("是否已收藏")
}).describe("用戶互動狀態回應").meta({
  title: "用戶互動狀態",
  examples: [{
    isLiked: true,
    isFavorited: false
  }]
});

// 簽到統計 Schema (based on actual getCheckInStats service)
export const checkInStatsResponseSchema = z.object({
  totalCheckIns: z.number().int().min(0).describe("總簽到次數"),
  currentStreak: z.number().int().min(0).describe("當前連續天數"),
  maxStreak: z.number().int().min(0).describe("最大連續天數"),
  averageProgress: z.number().min(0).describe("平均進度"),
  lastCheckInDate: z.string().optional().describe("最後簽到日期")
}).describe("簽到統計資訊").meta({
  title: "簽到統計",
  examples: [{
    totalCheckIns: 45,
    currentStreak: 5,
    maxStreak: 12,
    averageProgress: 2.3,
    lastCheckInDate: "2024-01-20"
  }]
});

// 月度簽到日曆 Schema (based on actual getMonthlyCheckInCalendar service)
export const monthlyCheckInCalendarResponseSchema = z.object({
  checkInDates: z.array(z.string()).describe("簽到日期列表 (YYYY-MM-DD)"),
  totalCheckIns: z.number().int().min(0).describe("當月總簽到次數"),
  streakDays: z.array(z.object({
    date: z.string().describe("日期 (YYYY-MM-DD)"),
    streakDay: z.number().int().min(1).describe("該日的連續天數")
  })).describe("連續簽到天數詳情")
}).describe("月度簽到日曆").meta({
  title: "月度簽到日曆",
  examples: [{
    checkInDates: ["2024-01-15", "2024-01-16", "2024-01-17"],
    totalCheckIns: 3,
    streakDays: [
      { date: "2024-01-15", streakDay: 1 },
      { date: "2024-01-16", streakDay: 2 },
      { date: "2024-01-17", streakDay: 3 }
    ]
  }]
});

// 操作成功回應 Schema (用於刪除等操作)
export const operationSuccessResponseSchema = z.object({
  success: z.boolean().describe("操作成功狀態")
}).describe("操作成功回應").meta({
  title: "操作成功",
  examples: [{
    success: true
  }]
});

// ===== Practice Template Schemas =====

// 模板查詢參數
export const practiceTemplateQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  category: z.string().optional().openapi({
    description: '模板分類',
    example: 'reading',
    examples: ['reading', 'learning', 'fitness', 'meditation']
  }),
  search: z.string().optional().openapi({
    description: '搜尋關鍵字',
    example: '閱讀'
  })
}).openapi('PracticeTemplateQuery', {
  description: '實踐模板查詢參數'
});

// 模板回應
export const practiceTemplateResponseSchema = z.object({
  id: z.string().uuid().openapi({ description: '模板 ID' }),
  title: z.string().openapi({ description: '模板標題', example: '每日閱讀 30 分鐘' }),
  description: z.string().optional().openapi({ description: '模板描述' }),
  category: z.string().openapi({ description: '模板分類', example: 'reading' }),
  frequencyMinDays: z.number().int().min(1).openapi({ description: '最低打卡頻率', example: 1 }),
  frequencyMaxDays: z.number().int().min(1).openapi({ description: '最高打卡頻率', example: 3 }),
  durationDays: z.number().int().min(1).openapi({ description: '建議持續天數', example: 30 }),
  suggestedTags: z.array(z.string()).openapi({ description: '建議標籤', example: ['閱讀', '習慣養成'] }),
  createdAt: z.string().datetime().openapi({ description: '建立時間' })
}).openapi('PracticeTemplate', {
  description: '實踐模板'
});

// 註冊 PracticeTemplate
registry.register('PracticeTemplate', practiceTemplateResponseSchema);

// ===== Encouragement Schemas =====

// 鼓勵句回應
export const encouragementResponseSchema = z.object({
  id: z.number().int().openapi({ description: '鼓勵句 ID' }),
  message: z.string().openapi({ description: '鼓勵句內容', example: '太棒了！你做到了！' }),
  category: z.string().optional().openapi({ description: '分類', example: 'general' })
}).openapi('Encouragement', {
  description: '打卡鼓勵句'
});

// 註冊 Encouragement
registry.register('Encouragement', encouragementResponseSchema);

// ===== Tag Prompt Schemas =====

// 引導句查詢參數
export const tagPromptQuerySchema = z.object({
  usageType: z.enum(['checkin', 'practice', 'general']).default('checkin').openapi({
    description: '使用場景類型',
    example: 'checkin'
  }),
  locale: z.enum(['zh-TW', 'en']).default('zh-TW').openapi({
    description: '語言',
    example: 'zh-TW'
  })
}).openapi('TagPromptQuery', {
  description: '引導句查詢參數'
});

// 引導句回應
export const tagPromptResponseSchema = z.object({
  id: z.number().int().openapi({ description: '引導句 ID' }),
  tagName: z.string().openapi({ description: '標籤名稱', example: '閱讀' }),
  prompt: z.string().openapi({ description: '引導句內容', example: '今天讀了什麼書？有什麼收穫嗎？' }),
  usageType: z.string().openapi({ description: '使用場景', example: 'checkin' })
}).openapi('TagPrompt', {
  description: '標籤引導句'
});

// 註冊 TagPrompt
registry.register('TagPrompt', tagPromptResponseSchema);

// ===== Check-in with Encouragement Schema =====

export const checkInWithEncouragementResponseSchema = checkInEntityResponseSchema.extend({
  encouragement: z.string().openapi({ description: '鼓勵句', example: '太棒了！你做到了！' }),
  practiceProgressPercentage: z.number().openapi({ description: '實踐進度百分比', example: 50 }),
  practiceStatus: practiceStatusSchema,
  isFirstCheckIn: z.boolean().openapi({ description: '是否首次打卡', example: false }),
  hasReachedTarget: z.boolean().openapi({ description: '是否達成目標', example: false })
}).openapi('CheckInWithEncouragement', {
  description: '打卡回應（含鼓勵句）'
});

// 註冊 CheckInWithEncouragement
registry.register('CheckInWithEncouragement', checkInWithEncouragementResponseSchema);

// 驗證函數
export const validatePracticeTemplateQuery = (data: unknown) => practiceTemplateQuerySchema.parse(data);
export const validateTagPromptQuery = (data: unknown) => tagPromptQuerySchema.parse(data);

// 類型導出
export type PracticeTemplateQuery = z.infer<typeof practiceTemplateQuerySchema>;
export type PracticeTemplateResponse = z.infer<typeof practiceTemplateResponseSchema>;
export type EncouragementResponse = z.infer<typeof encouragementResponseSchema>;
export type TagPromptQuery = z.infer<typeof tagPromptQuerySchema>;
export type TagPromptResponse = z.infer<typeof tagPromptResponseSchema>;
export type CheckInWithEncouragementResponse = z.infer<typeof checkInWithEncouragementResponseSchema>;

// ===== API Response Schemas =====

// 單一實踐回應
export const practiceApiResponseSchema = apiSuccessResponseSchema(practiceEntityResponseSchema);

// 實踐列表回應
export const practicesListApiResponseSchema = paginatedApiResponseSchema(practiceEntityResponseSchema);

// 簽到記錄回應
export const checkInApiResponseSchema = apiSuccessResponseSchema(checkInEntityResponseSchema);

// 簽到列表回應
export const checkInsListApiResponseSchema = paginatedApiResponseSchema(checkInEntityResponseSchema);

// 統計回應
export const practiceStatsApiResponseSchema = apiSuccessResponseSchema(practiceUserStatsResponseSchema);
export const checkInStatsApiResponseSchema = apiSuccessResponseSchema(checkInStatsResponseSchema);
export const monthlyCalendarApiResponseSchema = apiSuccessResponseSchema(monthlyCheckInCalendarResponseSchema);

// 互動操作回應
export const toggleLikeApiResponseSchema = apiSuccessResponseSchema(toggleLikeResponseSchema);
export const toggleFavoriteApiResponseSchema = apiSuccessResponseSchema(toggleFavoriteResponseSchema);
export const recordShareApiResponseSchema = apiSuccessResponseSchema(recordShareResponseSchema);
export const recordViewApiResponseSchema = apiSuccessResponseSchema(recordViewResponseSchema);
export const interactionStatsApiResponseSchema = apiSuccessResponseSchema(interactionStatsResponseSchema);
export const userInteractionStatusApiResponseSchema = apiSuccessResponseSchema(userInteractionStatusResponseSchema);

// 創建/操作回應
export const createPracticeApiResponseSchema = apiSuccessResponseSchema(practiceEntityResponseSchema);
export const updatePracticeApiResponseSchema = apiSuccessResponseSchema(practiceEntityResponseSchema);
export const operationSuccessApiResponseSchema = apiSuccessResponseSchema(operationSuccessResponseSchema);

// 統一導出對象，遵循專案模式
export const practiceValidators = {
  // 主要 schemas
  createPracticeSchema,
  updatePracticeSchema,
  checkInSchema,
  practiceQuerySchema,
  checkInQuerySchema,
  myPracticesQuerySchema,

  // 事件 schemas
  practiceEventViewSchema,
  practiceEventClickSchema,
  practiceEventShareSchema,
  practiceEventFavoriteSchema,
  reactionSchema,

  // 參數 schemas
  practiceParamsSchema,
  practiceCommentParamsSchema,

  // 子組件 schemas
  dailyGoalSchema,
  practiceResourceInputSchema,
  practiceResourceSchema,

  // 枚舉 schemas
  practiceStatusSchema,
  contentTypeSchema,
  dailyGoalTypeSchema,

  // Template & Encouragement schemas
  practiceTemplateQuerySchema,
  practiceTemplateResponseSchema,
  encouragementResponseSchema,
  tagPromptQuerySchema,
  tagPromptResponseSchema,
  checkInWithEncouragementResponseSchema,

  // Response schemas
  userBasicInfoResponseSchema,
  practiceStatsResponseSchema,
  practiceEntityResponseSchema,
  checkInEntityResponseSchema,
  practiceUserStatsResponseSchema,
  checkInStatsResponseSchema,
  monthlyCheckInCalendarResponseSchema,
  toggleLikeResponseSchema,
  toggleFavoriteResponseSchema,
  recordShareResponseSchema,
  recordViewResponseSchema,
  interactionStatsResponseSchema,
  userInteractionStatusResponseSchema,
  operationSuccessResponseSchema,

  // API Response schemas
  practiceApiResponseSchema,
  practicesListApiResponseSchema,
  checkInApiResponseSchema,
  checkInsListApiResponseSchema,
  practiceStatsApiResponseSchema,
  checkInStatsApiResponseSchema,
  monthlyCalendarApiResponseSchema,
  toggleLikeApiResponseSchema,
  toggleFavoriteApiResponseSchema,
  recordShareApiResponseSchema,
  recordViewApiResponseSchema,
  interactionStatsApiResponseSchema,
  userInteractionStatusApiResponseSchema,
  createPracticeApiResponseSchema,
  updatePracticeApiResponseSchema,
  operationSuccessApiResponseSchema
};

export default practiceValidators;