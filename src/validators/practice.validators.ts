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
  id: z.number().int().describe("用戶內部 ID"),
  _id: z.string().describe("用戶外部 UUID"),
  name: z.string().describe("用戶名稱"),
  photoURL: z.string().url().nullable().describe("用戶頭像 URL"),
  roleList: z.array(z.string()).describe("用戶角色列表"),
  educationStage: z.string().nullable().describe("教育階段"),
  tagList: z.array(z.string()).describe("用戶標籤列表"),
  selfIntroduction: z.string().nullable().describe("自我介紹")
}).describe("用戶基本資訊").meta({
  title: "用戶基本資訊",
  examples: [{
    id: 123,
    _id: "123e4567-e89b-12d3-a456-426614174000",
    name: "學習者小明",
    photoURL: "https://example.com/avatar/123.jpg",
    roleList: ["學生", "開發者"],
    educationStage: "大學",
    tagList: ["前端", "React"],
    selfIntroduction: "熱愛學習的開發者"
  }]
});

// 實踐統計 Schema (based on actual stats structure from service)
export const practiceStatsResponseSchema = z.object({
  likeCount: z.number().int().min(0).describe("點讚數量"),
  viewCount: z.number().int().min(0).describe("瀏覽數量"),
  favoriteCount: z.number().int().min(0).describe("收藏數量"),
  shareCount: z.number().int().min(0).describe("分享數量"),
  commentCount: z.number().int().min(0).describe("評論數量")
}).describe("實踐活動統計資訊").meta({
  title: "實踐統計",
  examples: [{
    likeCount: 25,
    viewCount: 150,
    favoriteCount: 12,
    shareCount: 8,
    commentCount: 3
  }]
});

// 實踐活動回應 Schema (based on actual PracticeEntity from service)
export const practiceEntityResponseSchema = z.object({
  id: z.string().describe("實踐活動外部 UUID"),
  title: z.string().describe("實踐活動標題"),
  contentType: contentTypeSchema.describe("內容類型"),
  customContentType: z.string().optional().describe("自定義內容類型"),
  totalAmount: z.number().int().min(1).describe("總學習量"),
  currentProgress: z.number().min(0).describe("當前進度"),
  startDate: z.string().optional().describe("開始日期 (YYYY-MM-DD)"),
  dailyGoal: dailyGoalSchema.describe("每日目標設定"),
  practiceAction: z.string().optional().describe("實踐行動描述"),
  status: practiceStatusSchema.describe("實踐狀態"),
  hasResources: z.boolean().describe("是否有相關資源"),
  streak: z.number().int().min(0).describe("當前連續天數"),
  maxStreak: z.number().int().min(0).describe("最大連續天數"),
  lastCheckInDate: z.string().optional().describe("最後簽到日期"),
  createdAt: z.string().datetime().describe("創建時間"),
  updatedAt: z.string().datetime().optional().describe("更新時間"),
  user: userBasicInfoResponseSchema.describe("創建者資訊"),
  tags: z.array(z.string()).describe("相關標籤"),
  stats: practiceStatsResponseSchema.describe("統計資訊")
}).describe("實踐活動詳細資訊").meta({
  title: "實踐活動",
  examples: [{
    id: "123e4567-e89b-12d3-a456-426614174000",
    title: "學習 React Hooks",
    contentType: "course",
    customContentType: null,
    totalAmount: 20,
    currentProgress: 8,
    startDate: "2024-01-15",
    dailyGoal: {
      type: "time",
      timeMinutes: 60
    },
    practiceAction: "每天學習 1 小時的 React Hooks 課程並做實作練習",
    status: "active",
    hasResources: true,
    streak: 5,
    maxStreak: 12,
    lastCheckInDate: "2024-01-20",
    createdAt: "2024-01-15T10:30:00.000Z",
    updatedAt: "2024-01-20T15:45:00.000Z",
    user: {
      id: 123,
      _id: "user-123e4567-e89b-12d3-a456-426614174000",
      name: "學習者小明",
      photoURL: "https://example.com/avatar/123.jpg",
      roleList: ["學生", "開發者"],
      educationStage: "大學",
      tagList: ["前端", "React"],
      selfIntroduction: "熱愛學習的開發者"
    },
    tags: ["React", "Hooks", "前端"],
    stats: {
      likeCount: 25,
      viewCount: 150,
      favoriteCount: 12,
      shareCount: 8,
      commentCount: 3
    }
  }]
});

// 簽到記錄回應 Schema (based on actual CheckInEntity from service)
export const checkInEntityResponseSchema = z.object({
  id: z.number().int().describe("簽到記錄內部 ID"),
  practiceId: z.number().int().describe("關聯的實踐活動內部 ID"),
  userId: z.number().int().describe("簽到用戶內部 ID"),
  checkInDate: z.string().describe("簽到日期"),
  progressAmount: z.number().min(0).describe("簽到進度數量"),
  note: z.string().optional().describe("簽到筆記"),
  mood: z.enum(['awesome', 'happy', 'neutral', 'tired', 'frustrated']).optional().describe("簽到心情"),
  reflectionText: z.string().optional().describe("學習反思"),
  relatedResourceId: z.string().optional().describe("相關資源 ID"),
  streakDay: z.number().int().min(0).describe("連續簽到天數"),
  cumulativeProgress: z.number().min(0).describe("累積進度"),
  createdAt: z.string().datetime().describe("創建時間"),
  updatedAt: z.string().datetime().optional().describe("更新時間")
}).describe("簽到記錄詳細資訊").meta({
  title: "簽到記錄",
  examples: [{
    id: 456,
    practiceId: 123,
    userId: 789,
    checkInDate: "2024-01-20",
    progressAmount: 2,
    note: "今天學習了 useState 和 useEffect",
    mood: "happy",
    reflectionText: "對 Hooks 的概念有了更清楚的理解",
    relatedResourceId: "res-123e4567-e89b-12d3-a456-426614174000",
    streakDay: 5,
    cumulativeProgress: 8,
    createdAt: "2024-01-20T15:45:00.000Z",
    updatedAt: "2024-01-20T15:45:00.000Z"
  }]
});

// 實踐統計總覽 Schema (based on actual PracticeStats from service)
export const practiceUserStatsResponseSchema = z.object({
  totalPractices: z.number().int().min(0).describe("總實踐數"),
  activePractices: z.number().int().min(0).describe("活躍實踐數"),
  completedPractices: z.number().int().min(0).describe("已完成實踐數"),
  pausedPractices: z.number().int().min(0).describe("暫停的實踐數"),
  totalCheckIns: z.number().int().min(0).describe("總簽到次數"),
  averageStreak: z.number().min(0).describe("平均連續天數"),
  maxStreak: z.number().int().min(0).describe("最大連續天數")
}).describe("用戶實踐統計").meta({
  title: "用戶實踐統計",
  examples: [{
    totalPractices: 12,
    activePractices: 3,
    completedPractices: 7,
    pausedPractices: 2,
    totalCheckIns: 245,
    averageStreak: 8.5,
    maxStreak: 25
  }]
});

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