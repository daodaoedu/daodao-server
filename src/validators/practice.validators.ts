/**
 * Practice validation schemas
 * Using Zod for comprehensive input validation with proper error messages
 * Based on practice-api-v1.md specification
 */

import { z } from 'zod';

// 基礎枚舉定義
export const practiceStatusSchema = z.enum(['active', 'paused', 'completed', 'archived'], 'Status must be one of: active, paused, completed, archived')
  .describe("實踐活動狀態")
  .meta({
    title: "活動狀態",
    examples: ['active', 'paused', 'completed', 'archived'],
    enumDescriptions: {
      "active": "進行中",
      "paused": "暂停",
      "completed": "已完成",
      "archived": "已封存"
    }
  });

export const contentTypeSchema = z.enum(['book', 'video', 'articles', 'podcast', 'course', 'custom'], 'Content type must be one of: book, video, articles, podcast, course, custom')
  .describe("內容類型")
  .meta({
    title: "內容類型",
    examples: ['book', 'video', 'articles', 'podcast', 'course', 'custom'],
    enumDescriptions: {
      "book": "書籍",
      "video": "影片",
      "articles": "文章",
      "podcast": "播客",
      "course": "課程",
      "custom": "自定義"
    }
  });

export const dailyGoalTypeSchema = z.enum(['time', 'completion'], 'Daily goal type must be either time or completion')
  .describe("每日目標類型")
  .meta({
    title: "目標類型",
    examples: ['time', 'completion'],
    enumDescriptions: {
      "time": "時間目標",
      "completion": "完成目標"
    }
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
    .describe("每日時間目標（分鐘）")
    .meta({
      title: "時間目標（分鐘）",
      examples: [30, 60, 90, 120]
    }),
  amount: z.number({
    message: 'Amount must be a number'
  })
    .min(1, '數量目標最少1')
    .max(100, '數量目標最多100')
    .optional()
    .describe("每日數量目標")
    .meta({
      title: "數量目標",
      examples: [1, 3, 5, 10]
    }),
  unit: z.string()
    .max(10, '單位不能超過10字符')
    .optional()
    .describe("數量單位")
    .meta({
      title: "單位",
      examples: ["章", "頁", "集", "篇"]
    })
}).describe("每日學習目標設定").meta({
  title: "每日目標",
  examples: [{
    type: "time",
    timeMinutes: 60
  }, {
    type: "completion",
    amount: 3,
    unit: "章"
  }]
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

// 實踐資源 Schema (用於創建)
export const practiceResourceInputSchema = z.object({
  name: z.string('請輸入資源名稱')
    .min(1, '請輸入資源名稱')
    .max(100, '資源名稱不可超過100字')
    .describe("實踐資源名稱")
    .meta({
      title: "資源名稱",
      examples: ["React 官方文檔", "《你不知道的 JavaScript》", "Vue.js 教學影片"]
    }),
  url: z.string()
    .url('請輸入有效的網址')
    .optional()
    .or(z.literal(''))
    .describe("資源連結")
    .meta({
      title: "資源網址",
      examples: ["https://react.dev/", "https://javascript.info/", "https://vuejs.org/guide/"]
    })
}).describe("實踐資源輸入資料").meta({
  title: "實踐資源",
  examples: [{
    name: "React 官方文檔",
    url: "https://react.dev/"
  }]
});

// 實踐資源 Schema (API 回應)
export const practiceResourceSchema = z.object({
  id: z.string()
    .uuid('資源ID格式不正確')
    .describe("資源唯一識別碼")
    .meta({
      title: "資源 ID",
      examples: ["123e4567-e89b-12d3-a456-426614174000"]
    }),
  name: z.string()
    .describe("資源名稱")
    .meta({
      title: "資源名稱",
      examples: ["React 官方文檔", "《你不知道的 JavaScript》"]
    }),
  url: z.string()
    .optional()
    .describe("資源網址")
    .meta({
      title: "資源網址",
      examples: ["https://react.dev/", "https://javascript.info/"]
    })
}).describe("實踐資源回應資料").meta({
  title: "實踐資源回應",
  examples: [{
    id: "123e4567-e89b-12d3-a456-426614174000",
    name: "React 官方文檔",
    url: "https://react.dev/"
  }]
});

// 創建實踐請求 Schema
export const createPracticeSchema = z.object({
  title: z.string('請輸入標題')
    .min(1, '請輸入標題')
    .max(100, '標題不可超過100字')
    .describe("實踐活動標題")
    .meta({
      title: "活動標題",
      examples: ["學習 React Hooks", "閱讀《深入理解計算機系統》", "練習 JavaScript 算法"]
    }),
  contentType: contentTypeSchema,
  customContentType: z.string()
    .max(50, '自定義內容類型不可超過50字')
    .optional()
    .describe("自定義內容類型（當選擇 custom 時使用）")
    .meta({
      title: "自定義類型",
      examples: ["程式設計練習", "語言學習", "技術文檔"]
    }),
  totalAmount: z.number({
    message: '總量必須是數字'
  })
    .min(1, '總量必須大於0')
    .max(10000, '總量不可超過10000')
    .describe("學習內容的總量（如總頁數、總章節數等）")
    .meta({
      title: "總量",
      examples: [300, 12, 50, 100]
    }),
  startDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '請輸入有效的日期格式 YYYY-MM-DD')
    .optional()
    .describe("實踐開始日期")
    .meta({
      title: "開始日期",
      examples: ["2024-01-15", "2024-03-01", "2024-06-01"]
    }),
  dailyGoal: dailyGoalSchema,
  practiceAction: z.string()
    .max(200, '實踐行動描述不可超過200字')
    .optional()
    .describe("具體的實踐行動描述")
    .meta({
      title: "實踐行動",
      examples: ["每天閱讀並做筆記", "觀看影片並實作練習", "完成課後習題"]
    }),
  tags: z.array(z.string().min(1).max(50))
    .max(3, '標籤最多3個')
    .default([])
    .describe("相關標籤（最多3個）")
    .meta({
      title: "標籤",
      examples: [["JavaScript", "前端"], ["React", "Hooks", "實戰"], ["算法", "資料結構"]]
    }),
  resources: z.array(practiceResourceInputSchema)
    .max(5, '資源最多5個')
    .optional()
    .describe("相關學習資源（最多5個）")
    .meta({
      title: "學習資源",
      examples: [[{
        name: "React 官方文檔",
        url: "https://react.dev/"
      }]]
    })
}).describe("創建實踐活動的請求資料").meta({
  title: "創建實踐活動",
  examples: [{
    title: "學習 React Hooks",
    contentType: "course",
    totalAmount: 20,
    startDate: "2024-01-15",
    dailyGoal: {
      type: "time",
      timeMinutes: 60
    },
    practiceAction: "每天學習 1 小時的 React Hooks 課程並做實作練習",
    tags: ["React", "Hooks", "前端"],
    resources: [{
      name: "React 官方文檔",
      url: "https://react.dev/"
    }]
  }]
}).refine(data => {
  if (data.contentType === 'custom' && !data.customContentType) {
    return false;
  }
  return true;
}, {
  message: '選擇自定義類型時，請填寫自定義內容類型',
  path: ['customContentType']
});

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
    .describe("今日學習進度")
    .meta({
      title: "學習進度",
      examples: [5, 10, 25, 50, 100]
    }),
  note: z.string()
    .max(500, '筆記不可超過500字')
    .optional()
    .describe("學習筆記")
    .meta({
      title: "學習筆記",
      examples: ["今天學習了 React Hooks 的 useState", "完成了三個章節的練習題"]
    }),
  mood: z.enum(['awesome', 'happy', 'neutral', 'tired', 'frustrated'], 'Mood must be one of: awesome, happy, neutral, tired, frustrated')
    .optional()
    .describe("學習心情")
    .meta({
      title: "心情狀態",
      examples: ['awesome', 'happy', 'neutral', 'tired', 'frustrated'],
      enumDescriptions: {
        "awesome": "非常棒",
        "happy": "開心",
        "neutral": "普通",
        "tired": "疲累",
        "frustrated": "挫折"
      }
    }),
  reflectionText: z.string()
    .max(1000, '反思文字不可超過1000字')
    .optional()
    .describe("學習反思")
    .meta({
      title: "學習反思",
      examples: ["今天的學習效果很好，對 Hooks 的理解更深入了", "遇到了一些困難，需要多練習"]
    }),
  relatedResourceId: z.string()
    .uuid('關聯資源ID格式不正確')
    .optional()
    .describe("相關資源ID")
    .meta({
      title: "相關資源",
      examples: ["123e4567-e89b-12d3-a456-426614174000"]
    }),
  isPublic: z.boolean()
    .default(true)
    .describe("是否公開分享")
    .meta({
      title: "公開分享",
      examples: [true, false]
    }),
  tags: z.array(z.string().min(1).max(50))
    .max(5, '標籤最多5個')
    .default([])
    .describe("簽到標籤（最多5個）")
    .meta({
      title: "簽到標籤",
      examples: [["React", "學習"], ["JavaScript", "進步", "練習"]]
    })
}).describe("實踐活動簽到記錄").meta({
  title: "簽到記錄",
  examples: [{
    progress: 25,
    note: "今天學習了 React Hooks 的 useState 和 useEffect",
    mood: "happy",
    reflectionText: "對 Hooks 的概念有了更清楚的理解",
    isPublic: true,
    tags: ["React", "Hooks", "學習"]
  }]
});

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
  status: z.enum(['active', 'paused', 'completed', 'archived', 'all']).default('active'),
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
export const eventViewSchema = z.object({
  entityType: z.literal('practice'),
  entityId: z.string().min(1, 'Entity ID cannot be empty'),
  duration: z.number().min(0, 'Duration must be non-negative').optional()
});

export const eventClickSchema = z.object({
  entityType: z.literal('practice'),
  entityId: z.string().min(1, 'Entity ID cannot be empty'),
  clickPosition: z.string().optional()
});

export const eventShareSchema = z.object({
  entityType: z.literal('practice'),
  entityId: z.string().min(1, 'Entity ID cannot be empty'),
  shareChannel: z.string().min(1, '請指定分享渠道')
});

export const eventFavoriteSchema = z.object({
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
  status: z.enum(['active', 'paused', 'completed', 'archived', 'all']).default('all')
});

// 型別導出
export type CreatePracticeRequest = z.infer<typeof createPracticeSchema>;
export type UpdatePracticeRequest = z.infer<typeof updatePracticeSchema>;
export type CheckInRequest = z.infer<typeof checkInSchema>;
export type PracticeQueryParams = z.infer<typeof practiceQuerySchema>;
export type CheckInQueryParams = z.infer<typeof checkInQuerySchema>;
export type PracticeResourceInput = z.infer<typeof practiceResourceInputSchema>;
export type PracticeResourceResponse = z.infer<typeof practiceResourceSchema>;
export type EventViewRequest = z.infer<typeof eventViewSchema>;
export type EventClickRequest = z.infer<typeof eventClickSchema>;
export type EventShareRequest = z.infer<typeof eventShareSchema>;
export type EventFavoriteRequest = z.infer<typeof eventFavoriteSchema>;
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
export const validateEventView = (data: unknown): EventViewRequest => eventViewSchema.parse(data);
export const validateEventClick = (data: unknown): EventClickRequest => eventClickSchema.parse(data);
export const validateEventShare = (data: unknown): EventShareRequest => eventShareSchema.parse(data);
export const validateEventFavorite = (data: unknown): EventFavoriteRequest => eventFavoriteSchema.parse(data);
export const validateReaction = (data: unknown): ReactionRequest => reactionSchema.parse(data);
export const validatePracticeParams = (data: unknown): PracticeParamsRequest => practiceParamsSchema.parse(data);
export const validatePracticeCommentParams = (data: unknown): PracticeCommentParamsRequest => practiceCommentParamsSchema.parse(data);
export const validateMyPracticesQuery = (data: unknown): MyPracticesQueryParams => myPracticesQuerySchema.parse(data);

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
  eventViewSchema,
  eventClickSchema,
  eventShareSchema,
  eventFavoriteSchema,
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
  dailyGoalTypeSchema
};

export default practiceValidators;