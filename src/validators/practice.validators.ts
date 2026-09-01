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

/**
 * 實踐建立流程的數值邊界（daodaoedu/daodao#141）
 * 與 daodao-storage migration 083 的 CHECK 對齊：duration_days 1–90、session_duration_minutes 1–999
 */
export const DURATION_DAYS_MIN = 1;
export const DURATION_DAYS_MAX = 90;
export const SESSION_MINUTES_MIN = 1;
export const SESSION_MINUTES_MAX = 999;
/** Step 1 實踐行動字數上限（FRD FR-1.3；逐段行動同此上限） */
export const PRACTICE_ACTION_MAX_LENGTH = 50;
export const RESOURCES_MAX = 10;
/** 拆段批次建立的段數範圍（FRD OQ-2 定案：上限 3） */
export const BATCH_SEGMENTS_MIN = 2;
export const BATCH_SEGMENTS_MAX = 3;

// 基礎枚舉定義
export const practiceStatusSchema = z.enum(['draft', 'not_started', 'active', 'completed', 'archived']).openapi({
  description: '實踐活動狀態 (draft: 草稿, not_started: 未開始, active: 進行中, completed: 已完成, archived: 已封存)',
  example: 'not_started',
  examples: ['draft', 'not_started', 'active', 'completed', 'archived']
});

// 實踐時段 Schema
export const practiceTimePeriodSchema = z.enum(['morning', 'afternoon', 'evening', 'night', 'commute']).openapi({
  description: '實踐時段 (morning: 早上, afternoon: 下午, evening: 傍晚, night: 晚上, commute: 通勤時)',
  example: 'morning',
  examples: ['morning', 'afternoon', 'evening', 'night', 'commute']
});

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
    }),
  dayNumber: z.number()
    .int('使用天數必須是整數')
    .min(1, '使用天數最少為第 1 天')
    .max(DURATION_DAYS_MAX, `使用天數最多為第 ${DURATION_DAYS_MAX} 天`)
    .nullable()
    .optional()
    .openapi({
      description: '指定第幾天使用此資源（1 = 開始日當天；不填代表整段實踐期間皆可使用）',
      example: 3
    })
}).openapi('PracticeResourceInput', {
  description: '實踐資源輸入資料',
  example: {
    name: 'React 官方文檔',
    url: 'https://react.dev/',
    dayNumber: 3
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
    }),
  dayNumber: z.number()
    .int()
    .nullable()
    .optional()
    .openapi({
      description: '指定第幾天使用此資源（null 代表整段實踐期間皆可使用）',
      example: 3
    })
}).openapi('PracticeResource', {
  description: '實踐資源回應資料',
  example: {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'React 官方文檔',
    url: 'https://react.dev/',
    dayNumber: 3
  }
});

// 註冊 PracticeResource
registry.register('PracticeResource', practiceResourceSchema);

/**
 * 開始日期是否落在「今日 ~ 今日 + 14 天」（UTC 日界）
 * 單筆建立與拆段第一段共用；拆段後續段落的開始日由接續規則決定，不受此限
 */
export const isStartDateWithin14Days = (startDate: string, now: Date = new Date()): boolean => {
  const todayUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const maxDateStr = new Date(todayUTC + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  return startDate <= maxDateStr;
};

// 創建實踐請求 Schema - 基於 Prisma schema practices 表
// createPracticeBaseSchema：欄位定義（拆段各段共用）；createPracticeSchema：加上單筆建立的跨欄位 refine
export const createPracticeBaseSchema = z.object({
  title: z.string({ message: '請輸入標題' })
    .min(1, '請輸入標題')
    .max(100, '標題不可超過100字')
    .openapi({
      description: '實踐活動標題',
      example: '每日閱讀 30 分鐘',
      examples: ['每日閱讀 30 分鐘', '學習 React Hooks', '每天運動 20 分鐘']
    }),
  practiceAction: z.string()
    .max(PRACTICE_ACTION_MAX_LENGTH, `實踐行動描述不可超過${PRACTICE_ACTION_MAX_LENGTH}字`)
    .optional()
    .openapi({
      description: '具體的實踐行動描述（建立流程 Step 1，上限 50 字）',
      example: '閱讀技術書籍或文章',
      examples: ['閱讀技術書籍或文章', '完成線上課程一個章節', '跑步或健身']
    }),
  templateId: z.string()
    .uuid('模版 ID 格式不正確')
    .optional()
    .openapi({
      description: '來源模版的 external_id（從模版建立實踐時帶入，用於追蹤模版使用情況）',
      example: '123e4567-e89b-12d3-a456-426614174000',
      format: 'uuid'
    }),
  startDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '請輸入有效的日期格式 YYYY-MM-DD')
    .optional()
    .openapi({
      description: '實踐開始日期（不可超過 14 天後）',
      example: '2024-01-15',
      examples: ['2024-01-15', '2024-03-01', '2024-06-01'],
      format: 'date'
    }),
  durationDays: z.number({
    message: '持續天數必須是數字'
  })
    .int('持續天數必須是整數')
    .min(DURATION_DAYS_MIN, `持續天數最少 ${DURATION_DAYS_MIN} 天`)
    .max(DURATION_DAYS_MAX, `持續天數最多 ${DURATION_DAYS_MAX} 天`)
    .optional()
    .openapi({
      description: '實踐持續天數（1–90，預設選項 7/14/21/30，可自訂）',
      example: 14,
      examples: [7, 14, 21, 30, 45, 90]
    }),
  frequencyMinDays: z.number({
    message: '最低頻率必須是數字'
  })
    .int('最低頻率必須是整數')
    .min(1, '最低頻率最少 1 天')
    .max(7, '最低頻率最多 7 天')
    .optional()
    .openapi({
      description: '每週最低打卡天數',
      example: 4,
      examples: [1, 3, 4, 5]
    }),
  frequencyMaxDays: z.number({
    message: '最高頻率必須是數字'
  })
    .int('最高頻率必須是整數')
    .min(1, '最高頻率最少 1 天')
    .max(7, '最高頻率最多 7 天')
    .optional()
    .openapi({
      description: '每週最高打卡天數',
      example: 7,
      examples: [5, 6, 7]
    }),
  sessionDurationMinutes: z.number({
    message: '每次時長必須是數字'
  })
    .int('每次時長必須是整數')
    .min(SESSION_MINUTES_MIN, `每次時長最少 ${SESSION_MINUTES_MIN} 分鐘`)
    .max(SESSION_MINUTES_MAX, `每次時長最多 ${SESSION_MINUTES_MAX} 分鐘`)
    .optional()
    .openapi({
      description: '每次實踐時長（分鐘，1–999；預設選項 15/30/45/60，可自訂）',
      example: 30,
      examples: [15, 30, 60, 90]
    }),
  practiceTimePeriods: z.array(practiceTimePeriodSchema)
    .max(4, '最多選擇 4 個時段')
    .default([])
    .openapi({
      description: '偏好實踐時段',
      example: ['morning', 'evening'],
      examples: [['morning'], ['afternoon', 'evening'], ['morning', 'night']]
    }),
  otherContext: z.string()
    .max(500, '其他說明不可超過 500 字')
    .optional()
    .openapi({
      description: '其他補充說明',
      example: '希望養成每天閱讀的習慣'
    }),
  tags: z.array(z.string().min(1).max(50))
    .max(10, '標籤最多 10 個')
    .default([])
    .openapi({
      description: '相關標籤（最多 10 個）',
      example: ['閱讀', '學習'],
      examples: [
        ['閱讀', '學習'],
        ['運動', '健康'],
        ['程式', '前端', 'React']
      ]
    }),
  resources: z.array(practiceResourceInputSchema)
    .max(RESOURCES_MAX, `資源最多 ${RESOURCES_MAX} 個`)
    .optional()
    .openapi({
      description: `相關學習資源（最多 ${RESOURCES_MAX} 個；可只有名稱不帶連結）`,
      example: [{
        name: 'React 官方文檔',
        url: 'https://react.dev/'
      }]
    }),
  isDraft: z.boolean()
    .default(false)
    .openapi({
      description: '是否存為草稿',
      example: false
    }),
  privacyStatus: z.enum(['private', 'public', 'delayed'])
    .optional()
    .openapi({
      description: '隱私狀態（private: 私人, public: 即時公開, delayed: 完成後分享）',
      example: 'public'
    }),
  creationMethod: z.enum(['self_created', 'copied', 'action_generator'])
    .optional()
    .openapi({
      description: '實踐建立方式（用於 Onboarding 任務 C 記錄）',
      example: 'self_created'
    })
}).openapi('CreatePracticeRequest', {
  description: '創建實踐活動的請求資料',
  example: {
    title: '每日閱讀 30 分鐘',
    practiceAction: '閱讀技術書籍或文章',
    startDate: '2024-01-15',
    durationDays: 14,
    frequencyMinDays: 4,
    frequencyMaxDays: 7,
    sessionDurationMinutes: 30,
    practiceTimePeriods: ['morning', 'evening'],
    tags: ['閱讀', '學習'],
    resources: [],
    isDraft: false
  }
});

const frequencyRangeRefine = {
  check: (data: { frequencyMinDays?: number; frequencyMaxDays?: number }): boolean => {
    if (data.frequencyMinDays && data.frequencyMaxDays) {
      return data.frequencyMinDays <= data.frequencyMaxDays;
    }
    return true;
  },
  options: { message: '最低頻率不能大於最高頻率', path: ['frequencyMinDays'] as string[] }
};

/** 拆段單一段落 Schema：欄位 + 頻率區間 refine，不含 14 天開始日限制 */
export const practiceSegmentSchema = createPracticeBaseSchema
  .refine(frequencyRangeRefine.check, frequencyRangeRefine.options);

export const createPracticeSchema = createPracticeBaseSchema
  .refine(frequencyRangeRefine.check, frequencyRangeRefine.options)
  .refine(data => {
    // 驗證 startDate 不能超過 14 天後（UTC）
    return data.startDate ? isStartDateWithin14Days(data.startDate) : true;
  }, {
    message: '開始日期不能超過 14 天後',
    path: ['startDate']
  });

// 註冊 CreatePracticeRequest
registry.register('CreatePracticeRequest', createPracticeSchema);

/**
 * 以 YYYY-MM-DD 字串加天數（UTC，避免時區位移）
 */
export const addDaysToDateString = (dateStr: string, days: number): string => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const t = Date.UTC(y, m - 1, d) + days * 24 * 60 * 60 * 1000;
  return new Date(t).toISOString().slice(0, 10);
};

/**
 * 拆段批次建立請求 Schema（daodaoedu/daodao#141 長天數拆段）
 * 每段沿用 createPracticeSchema；額外要求：段數 2–3、每段 startDate 與 durationDays 必填、日期接續不重疊
 */
export const batchCreatePracticeSchema = z.object({
  segments: z.array(practiceSegmentSchema)
    .min(BATCH_SEGMENTS_MIN, `拆段至少 ${BATCH_SEGMENTS_MIN} 段`)
    .max(BATCH_SEGMENTS_MAX, `拆段最多 ${BATCH_SEGMENTS_MAX} 段`)
    .openapi({
      description: '依序的各段實踐（2–3 段）。標籤由前端複製到每段；資源依段落指派複製到對應段',
    })
}).openapi('BatchCreatePracticeRequest', {
  description: '一次建立多段實踐（長天數拆段）',
  example: {
    segments: [
      { title: '閱讀原子習慣 (1)', practiceAction: '每天閱讀 30 頁', startDate: '2026-09-01', durationDays: 20, frequencyMinDays: 3, frequencyMaxDays: 5 },
      { title: '閱讀原子習慣 (2)', practiceAction: '每天閱讀 30 頁', startDate: '2026-09-21', durationDays: 20, frequencyMinDays: 3, frequencyMaxDays: 5 }
    ]
  }
}).superRefine((data, ctx) => {
  data.segments.forEach((seg, i) => {
    if (!seg.startDate) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: '請選擇開始時間', path: ['segments', i, 'startDate'] });
    } else if (i === 0 && !isStartDateWithin14Days(seg.startDate)) {
      // 14 天限制只套用在第一段；後續段落由接續規則推導
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: '開始日期不能超過 14 天後', path: ['segments', 0, 'startDate'] });
    }
    if (seg.durationDays === undefined) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: '請選擇想要持續多久', path: ['segments', i, 'durationDays'] });
    }
    if (seg.frequencyMinDays === undefined || seg.frequencyMaxDays === undefined) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: '請為每個實踐填寫每週頻率', path: ['segments', i, 'frequencyMinDays'] });
    }
    if (i > 0) {
      const prev = data.segments[i - 1];
      if (prev.startDate && prev.durationDays !== undefined && seg.startDate) {
        const expected = addDaysToDateString(prev.startDate, prev.durationDays);
        if (seg.startDate !== expected) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `第 ${i + 1} 段開始日須為前一段結束日的隔日（${expected}）`,
            path: ['segments', i, 'startDate']
          });
        }
      }
    }
  });
});

registry.register('BatchCreatePracticeRequest', batchCreatePracticeSchema);

// 更新實踐請求 Schema - 基於 Prisma schema practices 表
// 注意：已打卡後，startDate, durationDays, frequencyMinDays, frequencyMaxDays 將被鎖定
export const updatePracticeSchema = z.object({
  title: z.string().min(1, '標題不能為空').max(100, '標題不可超過100字').optional(),
  // 編輯流程沿用舊上限 200，避免既有資料無法編輯；建立流程（createPracticeSchema）為 50
  practiceAction: z.string().max(200, '實踐行動描述不可超過200字').optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '請輸入有效的日期格式 YYYY-MM-DD').optional(),
  durationDays: z.number().int().min(DURATION_DAYS_MIN).max(DURATION_DAYS_MAX).optional(),
  frequencyMinDays: z.number().int().min(1).max(7).optional(),
  frequencyMaxDays: z.number().int().min(1).max(7).optional(),
  sessionDurationMinutes: z.number().int().min(SESSION_MINUTES_MIN).max(SESSION_MINUTES_MAX).optional(),
  practiceTimePeriods: z.array(practiceTimePeriodSchema).max(4).optional(),
  otherContext: z.string().max(500).optional(),
  tags: z.array(z.string().min(1).max(50)).max(10, '標籤最多10個').optional(),
  resources: z.array(practiceResourceInputSchema).max(RESOURCES_MAX, `資源最多${RESOURCES_MAX}個`).optional(),
  status: practiceStatusSchema.optional(),
  privacyStatus: z.enum(['private', 'public', 'delayed']).optional(),
  isDraft: z.boolean().optional().openapi({
    description: '是否存為草稿（true: 設為草稿, false: 發布）',
    example: false
  })
}).refine(data => {
  // 至少要更新一個欄位
  return Object.keys(data).length > 0;
}, {
  message: '至少需要提供一個要更新的欄位'
}).refine(data => {
  // 驗證 frequencyMinDays <= frequencyMaxDays
  if (data.frequencyMinDays && data.frequencyMaxDays) {
    return data.frequencyMinDays <= data.frequencyMaxDays;
  }
  return true;
}, {
  message: '最低頻率不能大於最高頻率',
  path: ['frequencyMinDays']
});

// 簽到記錄 Schema - 基於 Prisma schema practice_checkins 表
export const checkInSchema = z.object({
  mood: z.enum(['give_up', 'frustrated', 'bored', 'neutral', 'good', 'happy'])
    .optional()
    .openapi({
      description: '學習心情 (give_up: 想放棄, frustrated: 挫折, bored: 無聊, neutral: 普通, good: 不錯, happy: 開心)',
      example: 'happy',
      examples: ['give_up', 'frustrated', 'bored', 'neutral', 'good', 'happy']
    }),
  note: z.string()
    .max(600, '詳細描述不可超過600字')
    .optional()
    .openapi({
      description: '詳細描述（最多600字）',
      example: '今天閱讀了第三章，學到了很多新概念',
      examples: ['今天閱讀了第三章，學到了很多新概念', '完成了 30 分鐘的練習']
    }),
  imageUrls: z.array(z.string().url('請輸入有效的圖片網址'))
    .max(3, '圖片最多3張')
    .default([])
    .openapi({
      description: '打卡圖片 URL（最多3張）',
      example: [],
      examples: [[], ['https://example.com/image1.jpg']]
    }),
  ogImageUrl: z.string()
    .url('請輸入有效的 OG 圖片網址')
    .max(500, 'OG 圖片網址不可超過 500 字')
    .nullable()
    .optional()
    .openapi({
      description: 'OG 圖片 URL（用於社群分享）',
      example: null,
      format: 'uri'
    }),
  tags: z.array(z.string().max(50, '標籤名稱不可超過50字'))
    .min(1, '請至少選擇一個標籤')
    .max(10, '標籤最多10個')
    .openapi({
      description: '打卡標籤（必填，至少1個，最多10個）',
      example: ['專注', '有收穫'],
      examples: [['專注', '有收穫'], ['閱讀', '冥想', '運動']]
    })
}).openapi('CheckInRequest', {
  description: '實踐活動簽到記錄',
  example: {
    mood: 'happy',
    note: '今天閱讀了第三章，學到了很多新概念',
    imageUrls: [],
    ogImageUrl: null,
    tags: ['專注', '有收穫']
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

// 用戶實踐列表參數 Schema
export const userPracticesParamsSchema = z.object({
  userId: z.string().uuid('User ID must be a valid UUID').openapi({
    description: '用戶外部 UUID',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
}).openapi('UserPracticesParams', {
  description: '用戶實踐列表路徑參數'
});

// 刪除簽到記錄參數 Schema
export const deleteCheckInParamsSchema = z.object({
  id: z.string().min(1, 'Practice ID cannot be empty').openapi({
    description: '實踐 ID（UUID 格式）',
    example: '550e8400-e29b-41d4-a716-446655440000'
  }),
  checkInId: z.string().regex(/^[1-9]\d*$/, 'checkInId must be a positive integer string').openapi({
    description: '簽到記錄 ID',
    example: '123'
  })
}).openapi({
  description: '刪除簽到記錄路徑參數'
});

// 更新簽到記錄參數 Schema
export const updateCheckInParamsSchema = z.object({
  id: z.string().uuid('Practice ID must be a valid UUID').openapi({
    description: '實踐 ID（UUID 格式）',
    example: '550e8400-e29b-41d4-a716-446655440000'
  }),
  checkInId: z.string().regex(/^[1-9]\d*$/, 'Check-in ID must be a positive integer').openapi({
    description: '簽到記錄 ID',
    example: '123'
  })
}).openapi('UpdateCheckInParams', {
  description: '更新簽到記錄路徑參數'
});

// 更新簽到記錄請求 Schema（所有欄位可選）
export const updateCheckInSchema = z.object({
  mood: z.enum(['give_up', 'frustrated', 'bored', 'neutral', 'good', 'happy'])
    .optional()
    .openapi({
      description: '學習心情 (give_up: 想放棄, frustrated: 挫折, bored: 無聊, neutral: 普通, good: 不錯, happy: 開心)',
      example: 'happy',
      examples: ['give_up', 'frustrated', 'bored', 'neutral', 'good', 'happy']
    }),
  note: z.string()
    .max(600, '詳細描述不可超過600字')
    .optional()
    .openapi({
      description: '詳細描述（最多600字）',
      example: '今天閱讀了第三章，學到了很多新概念'
    }),
  imageUrls: z.array(z.string().url('請輸入有效的圖片網址'))
    .max(3, '圖片最多3張')
    .optional()
    .openapi({
      description: '打卡圖片 URL（最多3張）',
      example: ['https://example.com/image1.jpg']
    }),
  ogImageUrl: z.string()
    .url('請輸入有效的 OG 圖片網址')
    .max(500, 'OG 圖片網址不可超過 500 字')
    .nullable()
    .optional()
    .openapi({
      description: 'OG 圖片 URL（用於社群分享）',
      example: null,
      format: 'uri'
    }),
  tags: z.array(z.string().max(50, '標籤名稱不可超過50字'))
    .max(10, '標籤最多10個')
    .optional()
    .openapi({
      description: '打卡標籤（最多10個）',
      example: ['專注', '有收穫']
    })
}).openapi('UpdateCheckInRequest', {
  description: '更新簽到記錄請求',
  example: {
    mood: 'happy',
    note: '今天閱讀了第三章，學到了很多新概念',
    imageUrls: [],
    ogImageUrl: null,
    tags: ['專注', '有收穫']
  }
}).refine(data => {
  // 至少要更新一個欄位
  return Object.keys(data).length > 0;
}, {
  message: '至少需要提供一個要更新的欄位'
});

// 註冊 UpdateCheckInRequest
registry.register('UpdateCheckInRequest', updateCheckInSchema);

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
export type UserPracticesParamsRequest = z.infer<typeof userPracticesParamsSchema>;
export type DeleteCheckInParamsRequest = z.infer<typeof deleteCheckInParamsSchema>;
export type UpdateCheckInParamsRequest = z.infer<typeof updateCheckInParamsSchema>;
export type UpdateCheckInRequest = z.infer<typeof updateCheckInSchema>;

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
export const validateUserPracticesParams = (data: unknown): UserPracticesParamsRequest => userPracticesParamsSchema.parse(data);

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
  roleList: z.array(z.string()).optional().openapi({ description: '用戶角色列表', example: ['normal_student', 'educator'] }),
  educationStage: z.string().nullable().optional().openapi({ description: '教育階段', example: 'university' }),
  tagList: z.array(z.string()).optional().openapi({ description: '用戶標籤列表', example: ['前端', 'React'] }),
  selfIntroduction: z.string().nullable().optional().openapi({ description: '自我介紹', example: '熱愛學習的開發者' }),
  customId: z.string().nullable().optional().openapi({ description: '用戶自訂 ID（用於個人頁面網址）', example: 'xiaoming' })
}).openapi('UserBasicInfo', {
  description: '用戶基本資訊',
  example: {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: '學習者小明',
    photoURL: 'https://example.com/avatar/123.jpg',
    roleList: ['normal_student', 'educator'],
    educationStage: 'university',
    tagList: ['前端', 'React'],
    selfIntroduction: '熱愛學習的開發者',
    customId: 'xiaoming'
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

// 實踐資源回應 Schema
export const practiceResourceEntitySchema = z.object({
  id: z.string().openapi({ description: '資源外部 UUID', example: '123e4567-e89b-12d3-a456-426614174000', format: 'uuid' }),
  name: z.string().openapi({ description: '資源名稱', example: 'React 官方文檔' }),
  url: z.string().optional().openapi({ description: '資源網址', example: 'https://react.dev/', format: 'uri' }),
  dayNumber: z.number().int().nullable().optional().openapi({ description: '指定第幾天使用此資源（null 代表整段實踐期間皆可使用）', example: 3 })
}).openapi('PracticeResourceEntity', {
  description: '實踐使用的資源',
  example: {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'React 官方文檔',
    url: 'https://react.dev/',
    dayNumber: 3
  }
});

// 註冊 PracticeResourceEntity
registry.register('PracticeResourceEntity', practiceResourceEntitySchema);

// 實踐活動回應 Schema - 基於 Prisma schema practices 表
export const practiceEntityResponseSchema = z.object({
  id: z.string().openapi({ description: '實踐活動外部 UUID', example: '123e4567-e89b-12d3-a456-426614174000', format: 'uuid' }),
  title: z.string().openapi({ description: '實踐活動標題', example: '每日閱讀 30 分鐘' }),
  isChallenge: z.boolean().optional().openapi({ description: '是否為共同挑戰實踐（名稱／期間／隱私由挑戰統一設定、不可複製）', example: false }),
  practiceAction: z.string().optional().openapi({ description: '實踐行動描述', example: '閱讀技術書籍或文章' }),
  startDate: z.string().optional().openapi({ description: '開始日期 (YYYY-MM-DD)', example: '2024-01-15', format: 'date' }),
  endDate: z.string().optional().openapi({ description: '結束日期 (YYYY-MM-DD)', example: '2024-01-29', format: 'date' }),
  durationDays: z.number().int().optional().openapi({ description: '持續天數', example: 14 }),
  frequencyMinDays: z.number().int().optional().openapi({ description: '每週最低打卡天數', example: 4 }),
  frequencyMaxDays: z.number().int().optional().openapi({ description: '每週最高打卡天數', example: 7 }),
  sessionDurationMinutes: z.number().int().optional().openapi({ description: '每次實踐時長（分鐘）', example: 30 }),
  practiceTimePeriods: z.array(z.string()).openapi({ description: '偏好實踐時段', example: ['morning', 'evening'] }),
  otherContext: z.string().optional().openapi({ description: '其他說明' }),
  status: practiceStatusSchema,
  hasResources: z.boolean().openapi({ description: '是否有相關資源', example: true }),
  resources: z.array(practiceResourceEntitySchema).optional().openapi({
    description: '使用的資源列表',
    example: [{ id: '123e4567-e89b-12d3-a456-426614174000', name: 'React 官方文檔', url: 'https://react.dev/' }]
  }),
  progressPercentage: z.number().min(0).openapi({ description: '進度百分比', example: 50 }),
  firstCheckinAt: z.string().optional().openapi({ description: '首次打卡時間', format: 'date-time' }),
  lastCheckinAt: z.string().optional().openapi({ description: '最近打卡時間', format: 'date-time' }),
  checkInCount: z.number().int().min(0).openapi({ description: '已打卡次數', example: 2 }),
  themeColor: z.string().optional().openapi({ description: '主題色（HEX 格式）', example: '#FCDD84' }),
  createdAt: z.string().datetime().openapi({ description: '創建時間', example: '2024-01-15T10:30:00.000Z', format: 'date-time' }),
  updatedAt: z.string().datetime().optional().openapi({ description: '更新時間', example: '2024-01-20T15:45:00.000Z', format: 'date-time' }),
  user: userBasicInfoResponseSchema,
  tags: z.array(z.string()).openapi({ description: '相關標籤', example: ['閱讀', '學習'] }),
  stats: practiceStatsResponseSchema
}).openapi('PracticeEntity', {
  description: '實踐活動詳細資訊',
  example: {
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: '每日閱讀 30 分鐘',
    practiceAction: '閱讀技術書籍或文章',
    startDate: '2024-01-15',
    endDate: '2024-01-29',
    durationDays: 14,
    frequencyMinDays: 4,
    frequencyMaxDays: 7,
    sessionDurationMinutes: 30,
    practiceTimePeriods: ['morning', 'evening'],
    status: 'active',
    hasResources: true,
    resources: [
      { id: '123e4567-e89b-12d3-a456-426614174000', name: 'React 官方文檔', url: 'https://react.dev/' }
    ],
    progressPercentage: 50,
    firstCheckinAt: '2024-01-15T08:30:00.000Z',
    lastCheckinAt: '2024-01-20T09:00:00.000Z',
    checkInCount: 2,
    themeColor: '#FCDD84',
    createdAt: '2024-01-15T10:30:00.000Z',
    updatedAt: '2024-01-20T15:45:00.000Z',
    user: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: '學習者小明',
      photoURL: 'https://example.com/avatar/123.jpg',
      roleList: ['normal_student', 'educator'],
      educationStage: 'university',
      tagList: ['前端', 'React'],
      selfIntroduction: '熱愛學習的開發者'
    },
    tags: ['閱讀', '學習'],
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

// 簽到記錄回應 Schema - 基於 Prisma schema practice_checkins 表
export const checkInEntityResponseSchema = z.object({
  id: z.number().int().openapi({ description: '簽到記錄內部 ID', example: 456 }),
  practiceId: z.number().int().openapi({ description: '關聯的實踐活動內部 ID', example: 123 }),
  userId: z.number().int().openapi({ description: '簽到用戶內部 ID', example: 789 }),
  checkinDate: z.string().openapi({ description: '簽到日期', example: '2024-01-20', format: 'date' }),
  mood: z.enum(['give_up', 'frustrated', 'bored', 'neutral', 'good', 'happy']).optional().openapi({ description: '簽到心情 (give_up: 想放棄, frustrated: 挫折, bored: 無聊, neutral: 普通, good: 不錯, happy: 開心)', example: 'happy' }),
  note: z.string().optional().openapi({ description: '詳細描述', example: '今天閱讀了第三章' }),
  imageUrls: z.array(z.string()).openapi({ description: '打卡圖片 URL（最多3張）', example: [] }),
  ogImageUrl: z.string().nullable().openapi({ description: 'OG 圖片 URL（用於社群分享）', example: null, format: 'uri' }),
  tags: z.array(z.string()).openapi({ description: '打卡標籤', example: ['專注', '有收穫'] }),
  viewCount: z.number().int().min(0).openapi({ description: '累計瀏覽數（同一使用者 24h 內只計一次）', example: 24 }),
  createdAt: z.string().datetime().openapi({ description: '創建時間', example: '2024-01-20T15:45:00.000Z', format: 'date-time' }),
  updatedAt: z.string().datetime().optional().openapi({ description: '更新時間', example: '2024-01-20T15:45:00.000Z', format: 'date-time' })
}).openapi('CheckInEntity', {
  description: '簽到記錄詳細資訊',
  example: {
    id: 456,
    practiceId: 123,
    userId: 789,
    checkinDate: '2024-01-20',
    mood: 'happy',
    note: '今天閱讀了第三章',
    imageUrls: [],
    ogImageUrl: null,
    tags: ['專注', '有收穫'],
    viewCount: 24,
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

export const recordCheckInViewResponseSchema = z.object({
  viewCount: z.number().int().min(0).describe("該打卡紀錄的總瀏覽數")
}).describe("打卡瀏覽記錄回應").meta({
  title: "打卡瀏覽記錄回應",
  examples: [{
    viewCount: 24
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
  lastCheckinAt: z.string().optional().describe("最後簽到時間")
}).describe("簽到統計資訊").meta({
  title: "簽到統計",
  examples: [{
    totalCheckIns: 45,
    currentStreak: 5,
    maxStreak: 12,
    lastCheckinAt: "2024-01-20T09:00:00.000Z"
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
  page: z.coerce.number().min(1).default(1).openapi({
    description: '頁碼',
    example: 1
  }),
  limit: z.coerce.number().min(1).max(100).default(20).openapi({
    description: '每頁數量',
    example: 20
  }),
  category: z.string().optional().openapi({
    description: '模板分類',
    example: 'reading',
    examples: ['reading', 'learning', 'fitness', 'meditation', 'writing', 'coding', 'language']
  }),
  search: z.string().optional().openapi({
    description: '搜尋關鍵字',
    example: '閱讀'
  })
}).openapi('PracticeTemplateQuery', {
  description: '實踐模板查詢參數'
});

// 模板 ID 參數
export const practiceTemplateParamsSchema = z.object({
  id: z.string().min(1, 'Template ID cannot be empty').openapi({
    description: '模板 ID（UUID 或預設模板 ID）',
    example: 'tpl-reading-daily'
  })
}).openapi('PracticeTemplateParams', {
  description: '實踐模板路徑參數'
});

// 模板回應 - 對應 PracticeTemplateEntity from service
export const practiceTemplateResponseSchema = z.object({
  id: z.string().openapi({
    description: '模板 ID（UUID 或預設模板 ID）',
    example: 'tpl-reading-daily'
  }),
  title: z.string().openapi({
    description: '模板標題',
    example: '每日閱讀 30 分鐘'
  }),
  practiceAction: z.string().optional().openapi({
    description: '具體實踐行動描述',
    example: '閱讀'
  }),
  categories: z.array(z.string()).openapi({
    description: '模板分類列表',
    example: ['reading']
  }),
  frequencyMinDays: z.number().int().nullable().openapi({
    description: '每週最低打卡天數',
    example: 1
  }),
  frequencyMaxDays: z.number().int().nullable().openapi({
    description: '每週最高打卡天數',
    example: 2
  }),
  durationDays: z.number().int().nullable().openapi({
    description: '建議持續天數',
    example: 30
  }),
  sessionDurationMinutes: z.number().int().nullable().openapi({
    description: '每次實踐時長（分鐘）',
    example: 30
  }),
  practiceTimePeriods: z.array(z.string()).openapi({
    description: '建議實踐時段',
    example: ['morning', 'evening']
  }),
  suggestedTags: z.array(z.string()).openapi({
    description: '建議標籤',
    example: ['閱讀', '習慣養成', '自我成長']
  }),
  resources: z.array(practiceResourceSchema).optional().openapi({
    description: '模板關聯的資源列表',
    example: [
      { id: '123e4567-e89b-12d3-a456-426614174000', name: 'React 官方文檔', url: 'https://react.dev' }
    ]
  }),
  organization: z.object({
    id: z.number().int(),
    name: z.string(),
    bio: z.string().nullable(),
    externalLink: z.string().url().nullable()
  }).optional().openapi({ description: '模板所屬組織；官方模板不提供此欄位' }),
  answerCount: z.number().int().openapi({
    description: '使用此模板建立實踐的總人次',
    example: 42
  }),
  createdAt: z.string().openapi({
    description: '建立時間',
    example: '2024-01-15T10:30:00.000Z'
  })
}).openapi('PracticeTemplate', {
  description: '實踐模板',
  example: {
    id: 'tpl-reading-daily',
    title: '每日閱讀 30 分鐘',
    practiceAction: '閱讀',
    categories: ['reading'],
    frequencyMinDays: 1,
    frequencyMaxDays: 2,
    durationDays: 30,
    sessionDurationMinutes: 30,
    practiceTimePeriods: ['morning', 'evening'],
    suggestedTags: ['閱讀', '習慣養成', '自我成長'],
    resources: [
      { id: '123e4567-e89b-12d3-a456-426614174000', name: 'React 官方文檔', url: 'https://react.dev' }
    ],
    answerCount: 42,
    createdAt: '2024-01-15T10:30:00.000Z'
  }
});

// 註冊 PracticeTemplate
registry.register('PracticeTemplate', practiceTemplateResponseSchema);

// 模板分類列表回應
export const templateCategoriesResponseSchema = z.array(z.string()).openapi({
  description: '模板分類列表',
  example: ['reading', 'learning', 'fitness', 'meditation', 'writing', 'coding', 'language']
});

// 創建模板請求 Schema
export const createPracticeTemplateSchema = z.object({
  title: z.string()
    .min(1, '標題不能為空')
    .max(100, '標題不可超過 100 字')
    .openapi({
      description: '模板標題',
      example: '每日閱讀 30 分鐘'
    }),
  practiceAction: z.string()
    .max(PRACTICE_ACTION_MAX_LENGTH, `實踐行動描述不可超過 ${PRACTICE_ACTION_MAX_LENGTH} 字`)
    .optional()
    .openapi({
      description: '具體實踐行動描述（上限 50 字，與個人實踐建立流程一致）',
      example: '閱讀'
    }),
  categories: z.array(z.string().min(1).max(50))
    .max(5, '分類最多 5 個')
    .default([])
    .openapi({
      description: '模板分類列表',
      example: ['reading']
    }),
  frequencyMinDays: z.number()
    .int('最低頻率必須是整數')
    .min(1, '最低頻率最少 1 天')
    .max(7, '最低頻率最多 7 天')
    .optional()
    .openapi({
      description: '每週最低打卡天數',
      example: 1
    }),
  frequencyMaxDays: z.number()
    .int('最高頻率必須是整數')
    .min(1, '最高頻率最少 1 天')
    .max(7, '最高頻率最多 7 天')
    .optional()
    .openapi({
      description: '每週最高打卡天數',
      example: 2
    }),
  durationDays: z.number()
    .int('持續天數必須是整數')
    .min(DURATION_DAYS_MIN, `持續天數最少 ${DURATION_DAYS_MIN} 天`)
    .max(DURATION_DAYS_MAX, `持續天數最多 ${DURATION_DAYS_MAX} 天`)
    .optional()
    .openapi({
      description: '建議持續天數（1–90，與個人實踐統一上限）',
      example: 30
    }),
  sessionDurationMinutes: z.number()
    .int('每次時長必須是整數')
    .min(SESSION_MINUTES_MIN, `每次時長最少 ${SESSION_MINUTES_MIN} 分鐘`)
    .max(SESSION_MINUTES_MAX, `每次時長最多 ${SESSION_MINUTES_MAX} 分鐘`)
    .optional()
    .openapi({
      description: '每次實踐時長（分鐘，1–999）',
      example: 30
    }),
  practiceTimePeriods: z.array(practiceTimePeriodSchema)
    .max(4, '最多選擇 4 個時段')
    .default([])
    .openapi({
      description: '建議實踐時段',
      example: ['morning', 'evening']
    }),
  suggestedTags: z.array(z.string().min(1).max(50))
    .max(10, '標籤最多 10 個')
    .default([])
    .openapi({
      description: '建議標籤',
      example: ['閱讀', '習慣養成', '自我成長']
    })
}).openapi('CreatePracticeTemplateRequest', {
  description: '創建實踐模板的請求資料',
  example: {
    title: '每日閱讀 30 分鐘',
    practiceAction: '閱讀',
    categories: ['reading'],
    frequencyMinDays: 1,
    frequencyMaxDays: 2,
    durationDays: 30,
    sessionDurationMinutes: 30,
    practiceTimePeriods: ['morning', 'evening'],
    suggestedTags: ['閱讀', '習慣養成', '自我成長']
  }
}).refine(data => {
  if (data.frequencyMinDays && data.frequencyMaxDays) {
    return data.frequencyMinDays <= data.frequencyMaxDays;
  }
  return true;
}, {
  message: '最低頻率不能大於最高頻率',
  path: ['frequencyMinDays']
});

// 註冊 CreatePracticeTemplateRequest
registry.register('CreatePracticeTemplateRequest', createPracticeTemplateSchema);

/**
 * 拆段批次建立模版 Schema（模版無開始日，不驗日期接續）
 */
export const batchCreatePracticeTemplateSchema = z.object({
  segments: z.array(createPracticeTemplateSchema)
    .min(BATCH_SEGMENTS_MIN, `拆段至少 ${BATCH_SEGMENTS_MIN} 段`)
    .max(BATCH_SEGMENTS_MAX, `拆段最多 ${BATCH_SEGMENTS_MAX} 段`)
    .openapi({ description: '依序的各段模版（2–3 段）' })
}).openapi('BatchCreatePracticeTemplateRequest', {
  description: '一次建立多段實踐模版（長天數拆段）'
}).superRefine((data, ctx) => {
  data.segments.forEach((seg, i) => {
    if (seg.durationDays === undefined) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: '請選擇想要持續多久', path: ['segments', i, 'durationDays'] });
    }
  });
});

registry.register('BatchCreatePracticeTemplateRequest', batchCreatePracticeTemplateSchema);

// 更新模板請求 Schema
export const updatePracticeTemplateSchema = z.object({
  title: z.string()
    .min(1, '標題不能為空')
    .max(100, '標題不可超過 100 字')
    .optional()
    .openapi({
      description: '模板標題',
      example: '每日閱讀 30 分鐘'
    }),
  practiceAction: z.string()
    .max(PRACTICE_ACTION_MAX_LENGTH, `實踐行動描述不可超過 ${PRACTICE_ACTION_MAX_LENGTH} 字`)
    .optional()
    .openapi({
      description: '具體實踐行動描述（上限 50 字，與個人實踐建立流程一致）',
      example: '閱讀'
    }),
  categories: z.array(z.string().min(1).max(50))
    .max(5, '分類最多 5 個')
    .optional()
    .openapi({
      description: '模板分類列表',
      example: ['reading']
    }),
  frequencyMinDays: z.number()
    .int('最低頻率必須是整數')
    .min(1, '最低頻率最少 1 天')
    .max(7, '最低頻率最多 7 天')
    .optional()
    .openapi({
      description: '每週最低打卡天數',
      example: 1
    }),
  frequencyMaxDays: z.number()
    .int('最高頻率必須是整數')
    .min(1, '最高頻率最少 1 天')
    .max(7, '最高頻率最多 7 天')
    .optional()
    .openapi({
      description: '每週最高打卡天數',
      example: 2
    }),
  durationDays: z.number()
    .int('持續天數必須是整數')
    .min(DURATION_DAYS_MIN, `持續天數最少 ${DURATION_DAYS_MIN} 天`)
    .max(DURATION_DAYS_MAX, `持續天數最多 ${DURATION_DAYS_MAX} 天`)
    .optional()
    .openapi({
      description: '建議持續天數',
      example: 30
    }),
  sessionDurationMinutes: z.number()
    .int('每次時長必須是整數')
    .min(SESSION_MINUTES_MIN, `每次時長最少 ${SESSION_MINUTES_MIN} 分鐘`)
    .max(SESSION_MINUTES_MAX, `每次時長最多 ${SESSION_MINUTES_MAX} 分鐘`)
    .optional()
    .openapi({
      description: '每次實踐時長（分鐘）',
      example: 30
    }),
  practiceTimePeriods: z.array(practiceTimePeriodSchema)
    .max(4, '最多選擇 4 個時段')
    .optional()
    .openapi({
      description: '建議實踐時段',
      example: ['morning', 'evening']
    }),
  suggestedTags: z.array(z.string().min(1).max(50))
    .max(10, '標籤最多 10 個')
    .optional()
    .openapi({
      description: '建議標籤',
      example: ['閱讀', '習慣養成', '自我成長']
    })
}).openapi('UpdatePracticeTemplateRequest', {
  description: '更新實踐模板的請求資料'
}).refine(data => {
  return Object.keys(data).length > 0;
}, {
  message: '至少需要提供一個要更新的欄位'
}).refine(data => {
  if (data.frequencyMinDays && data.frequencyMaxDays) {
    return data.frequencyMinDays <= data.frequencyMaxDays;
  }
  return true;
}, {
  message: '最低頻率不能大於最高頻率',
  path: ['frequencyMinDays']
});

// 刪除模板回應 Schema
export const deleteTemplateResponseSchema = z.object({
  deleted: z.boolean().openapi({
    description: '是否成功刪除',
    example: true
  })
}).openapi('DeleteTemplateResponse', {
  description: '刪除模板回應'
});

// 模板列表 API 回應
export const practiceTemplatesListApiResponseSchema = paginatedApiResponseSchema(practiceTemplateResponseSchema);

// 單一模板 API 回應
export const practiceTemplateApiResponseSchema = apiSuccessResponseSchema(practiceTemplateResponseSchema.nullable());
export const batchCreatePracticeTemplatesApiResponseSchema = apiSuccessResponseSchema(z.object({
  templates: z.array(practiceTemplateResponseSchema).describe('依送出順序建立的模板')
}).describe('拆段批次建立模板回應'));

// 模板分類 API 回應
export const templateCategoriesApiResponseSchema = apiSuccessResponseSchema(templateCategoriesResponseSchema);

// 創建模板 API 回應
export const createPracticeTemplateApiResponseSchema = apiSuccessResponseSchema(practiceTemplateResponseSchema);

// 更新模板 API 回應
export const updatePracticeTemplateApiResponseSchema = apiSuccessResponseSchema(practiceTemplateResponseSchema.nullable());

// 刪除模板 API 回應
export const deletePracticeTemplateApiResponseSchema = apiSuccessResponseSchema(deleteTemplateResponseSchema);

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

// ===== Random Template Schemas =====

// 隨機模板查詢參數
export const randomTemplateQuerySchema = z.object({
  count: z.coerce.number().int().min(1).max(20).default(3).openapi({
    description: '要隨機獲取的模板數量',
    example: 3
  }),
  category: z.string().optional().openapi({
    description: '可選的分類過濾',
    example: 'reading',
    examples: ['reading', 'learning', 'fitness', 'meditation', 'writing', 'coding', 'language']
  })
}).openapi('RandomTemplateQuery', {
  description: '隨機模板查詢參數'
});

// 隨機模板 API 回應
export const randomTemplatesApiResponseSchema = apiSuccessResponseSchema(z.array(practiceTemplateResponseSchema));

// 驗證函數
export const validatePracticeTemplateQuery = (data: unknown): PracticeTemplateQuery => practiceTemplateQuerySchema.parse(data);
export const validatePracticeTemplateParams = (data: unknown): PracticeTemplateParams => practiceTemplateParamsSchema.parse(data);
export const validateCreatePracticeTemplate = (data: unknown): CreatePracticeTemplateRequest => createPracticeTemplateSchema.parse(data);
export const validateUpdatePracticeTemplate = (data: unknown): UpdatePracticeTemplateRequest => updatePracticeTemplateSchema.parse(data);
export const validateTagPromptQuery = (data: unknown): TagPromptQuery => tagPromptQuerySchema.parse(data);
export const validateRandomTemplateQuery = (data: unknown): RandomTemplateQuery => randomTemplateQuerySchema.parse(data);

// 類型導出
export type PracticeTemplateQuery = z.infer<typeof practiceTemplateQuerySchema>;
export type PracticeTemplateParams = z.infer<typeof practiceTemplateParamsSchema>;
export type PracticeTemplateResponse = z.infer<typeof practiceTemplateResponseSchema>;
export type CreatePracticeTemplateRequest = z.infer<typeof createPracticeTemplateSchema>;
export type UpdatePracticeTemplateRequest = z.infer<typeof updatePracticeTemplateSchema>;
export type DeleteTemplateResponse = z.infer<typeof deleteTemplateResponseSchema>;
export type TemplateCategoriesResponse = z.infer<typeof templateCategoriesResponseSchema>;
export type EncouragementResponse = z.infer<typeof encouragementResponseSchema>;
export type TagPromptQuery = z.infer<typeof tagPromptQuerySchema>;
export type TagPromptResponse = z.infer<typeof tagPromptResponseSchema>;
export type CheckInWithEncouragementResponse = z.infer<typeof checkInWithEncouragementResponseSchema>;
export type RandomTemplateQuery = z.infer<typeof randomTemplateQuerySchema>;

// ===== API Response Schemas =====

// 單一實踐回應
export const practiceApiResponseSchema = apiSuccessResponseSchema(practiceEntityResponseSchema);

// 實踐列表回應
export const practicesListApiResponseSchema = paginatedApiResponseSchema(practiceEntityResponseSchema);

// 簽到記錄回應
export const checkInApiResponseSchema = apiSuccessResponseSchema(checkInEntityResponseSchema);

// 創建簽到回應（含鼓勵句和進度）
export const createCheckInApiResponseSchema = apiSuccessResponseSchema(checkInWithEncouragementResponseSchema);

// 更新簽到回應
export const updateCheckInApiResponseSchema = apiSuccessResponseSchema(checkInEntityResponseSchema);

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
export const recordCheckInViewApiResponseSchema = apiSuccessResponseSchema(recordCheckInViewResponseSchema);
export const interactionStatsApiResponseSchema = apiSuccessResponseSchema(interactionStatsResponseSchema);
export const userInteractionStatusApiResponseSchema = apiSuccessResponseSchema(userInteractionStatusResponseSchema);

// 創建/操作回應
export const createPracticeApiResponseSchema = apiSuccessResponseSchema(practiceEntityResponseSchema);
export const batchCreatePracticesResponseSchema = z.object({
  practices: z.array(practiceEntityResponseSchema).describe('依送出順序建立的實踐')
}).describe('拆段批次建立回應');
export const batchCreatePracticesApiResponseSchema = apiSuccessResponseSchema(batchCreatePracticesResponseSchema);
export const updatePracticeApiResponseSchema = apiSuccessResponseSchema(practiceEntityResponseSchema);
export const operationSuccessApiResponseSchema = apiSuccessResponseSchema(operationSuccessResponseSchema);

// 複製實踐回應
export const copyPracticeResponseSchema = z.object({
  id: z.string().describe("新實踐 external ID（UUID）")
}).describe("複製實踐回應").meta({
  title: "複製實踐回應",
  examples: [{ id: "550e8400-e29b-41d4-a716-446655440000" }]
});
export const copyPracticeApiResponseSchema = apiSuccessResponseSchema(copyPracticeResponseSchema);
export type CopyPracticeResponse = z.infer<typeof copyPracticeResponseSchema>;

// ===== Admin Practice Schemas =====

// Admin 實踐列表查詢參數（不排除 private / 未完成的 delayed）
export const adminPracticeListQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1).openapi({ description: '頁碼', example: 1 }),
  limit: z.coerce.number().min(1).max(100).default(20).openapi({ description: '每頁筆數', example: 20 }),
  query: z.string().optional().openapi({ description: '搜尋關鍵字（標題、實踐目標）' }),
  status: z.enum(['draft', 'not_started', 'active', 'completed', 'archived', 'all'])
    .default('all')
    .openapi({ description: '實踐狀態篩選；all 包含 archived', example: 'all' }),
  privacyStatus: z.enum(['private', 'public', 'delayed', 'all'])
    .default('all')
    .openapi({ description: '隱私狀態篩選（private: 私密, public: 公開, delayed: 完成後公開）', example: 'all' }),
  sort: z.enum(['createdAt', 'updatedAt', 'likeCount']).default('createdAt').openapi({ description: '排序欄位' }),
  order: z.enum(['asc', 'desc']).default('desc').openapi({ description: '排序方向' })
});
export type AdminPracticeListQuery = z.infer<typeof adminPracticeListQuerySchema>;

// Admin 更新實踐狀態
export const adminPracticeStatusUpdateSchema = z.object({
  status: practiceStatusSchema
});
export type AdminPracticeStatusUpdate = z.infer<typeof adminPracticeStatusUpdateSchema>;

export const adminPracticeStatusResponseSchema = z.object({
  id: z.string().openapi({ description: '實踐 external ID（UUID）' }),
  status: practiceStatusSchema,
  privacyStatus: z.string().openapi({ description: '隱私狀態', example: 'public' }),
  updatedAt: z.string().optional().openapi({ description: '更新時間（ISO 8601）' })
});
export const adminPracticeStatusApiResponseSchema = apiSuccessResponseSchema(adminPracticeStatusResponseSchema);

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
  userPracticesParamsSchema,
  deleteCheckInParamsSchema,
  updateCheckInParamsSchema,
  updateCheckInSchema,

  // 子組件 schemas
  practiceResourceInputSchema,
  practiceResourceSchema,
  practiceTimePeriodSchema,

  // 枚舉 schemas
  practiceStatusSchema,

  // Template & Encouragement schemas
  practiceTemplateQuerySchema,
  practiceTemplateParamsSchema,
  practiceTemplateResponseSchema,
  createPracticeTemplateSchema,
  updatePracticeTemplateSchema,
  deleteTemplateResponseSchema,
  templateCategoriesResponseSchema,
  practiceTemplatesListApiResponseSchema,
  practiceTemplateApiResponseSchema,
  templateCategoriesApiResponseSchema,
  createPracticeTemplateApiResponseSchema,
  updatePracticeTemplateApiResponseSchema,
  deletePracticeTemplateApiResponseSchema,
  randomTemplateQuerySchema,
  randomTemplatesApiResponseSchema,
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
  recordCheckInViewResponseSchema,
  interactionStatsResponseSchema,
  userInteractionStatusResponseSchema,
  operationSuccessResponseSchema,

  // API Response schemas
  practiceApiResponseSchema,
  practicesListApiResponseSchema,
  checkInApiResponseSchema,
  createCheckInApiResponseSchema,
  updateCheckInApiResponseSchema,
  checkInsListApiResponseSchema,
  practiceStatsApiResponseSchema,
  checkInStatsApiResponseSchema,
  monthlyCalendarApiResponseSchema,
  toggleLikeApiResponseSchema,
  toggleFavoriteApiResponseSchema,
  recordShareApiResponseSchema,
  recordViewApiResponseSchema,
  recordCheckInViewApiResponseSchema,
  interactionStatsApiResponseSchema,
  userInteractionStatusApiResponseSchema,
  createPracticeApiResponseSchema,
  updatePracticeApiResponseSchema,
  operationSuccessApiResponseSchema,
  copyPracticeResponseSchema,
  copyPracticeApiResponseSchema
};

export default practiceValidators;
