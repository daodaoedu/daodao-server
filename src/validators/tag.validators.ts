/**
 * Tag Validators
 * 標籤驗證器 - 使用 Zod 進行資料驗證
 */

import { z } from 'zod';
import {
  apiSuccessResponseSchema
} from './api-response.validators';
import { registry } from '../config/openapi-registry';

// 標籤名稱基礎驗證
const tagNameSchema = z.string()
  .min(1, '標籤名稱不能為空')
  .max(50, '標籤名稱不能超過 50 字元')
  .regex(/^[a-zA-Z0-9\u4e00-\u9fa5_-]+$/, '標籤名稱只能包含字母、數字、中文、底線和連字號')
  .describe("標籤名稱")
  .meta({
    title: "標籤名稱",
    examples: ["React", "JavaScript", "前端開發", "Machine-Learning", "AI_技術"]
  });

// 實體類型驗證
const entityTypeSchema = z.enum([
  'resource',
  'project',
  'idea',
  'practice',
  'practice_checkin',
  'circle',
  'user',
  'review'
], "無效的實體類型")
  .describe("實體類型")
  .meta({
    title: "實體類型",
    examples: ['resource', 'project', 'idea', 'practice', 'practice_checkin', 'circle', 'user', 'review'],
    enumDescriptions: {
      "resource": "學習資源",
      "project": "專案計畫",
      "idea": "創意想法",
      "practice": "實作練習",
      "practice_checkin": "打卡記錄",
      "circle": "學習圈子",
      "user": "使用者標籤",
      "review": "評論"
    }
  });

// 標籤搜索查詢參數驗證
export const tagSearchQuerySchema = z.object({
  query: z.string()
    .min(1, '搜索關鍵詞不能為空')
    .max(50, '搜索關鍵詞不能超過 50 字元')
    .describe("搜索關鍵詞")
    .meta({
      title: "搜索關鍵詞",
      examples: ["React", "JavaScript", "前端", "機器學習"]
    }),
  limit: z.string()
    .regex(/^\d+$/, '限制數量必須是數字')
    .default("10")
    .transform(Number)
    .refine(n => n > 0 && n <= 100, '限制數量必須在 1-100 之間')
    .describe("返回結果限制數量")
    .meta({
      title: "限制數量",
      examples: ["10", "20", "50"]
    })
}).describe("標籤搜索查詢參數").meta({
  title: "標籤搜索",
  examples: [{
    query: "React",
    limit: "10"
  }]
});

// 標籤建議查詢參數驗證
export const suggestTagsQuerySchema = z.object({
  q: z.string()
    .min(1, '搜索關鍵詞不能為空')
    .max(50, '搜索關鍵詞不能超過 50 字元')
    .describe("搜索關鍵詞")
    .meta({
      title: "搜索關鍵詞",
      examples: ["Rea", "Java", "前端"]
    }),
  limit: z.string()
    .regex(/^\d+$/, '限制數量必須是數字')
    .default("10")
    .transform(Number)
    .refine(n => n > 0 && n <= 100, '限制數量必須在 1-100 之間')
    .describe("返回結果限制數量")
    .meta({
      title: "限制數量",
      examples: ["5", "10", "20"]
    })
}).describe("標籤建議查詢參數").meta({
  title: "標籤建議",
  examples: [{
    q: "Rea",
    limit: "10"
  }]
});

// 熱門標籤查詢參數驗證
export const popularTagsQuerySchema = z.object({
  limit: z.string()
    .regex(/^\d+$/, '限制數量必須是數字')
    .default("20")
    .transform(Number)
    .refine(n => n > 0 && n <= 100, '限制數量必須在 1-100 之間')
    .describe("返回結果限制數量")
    .meta({
      title: "限制數量",
      examples: ["10", "20", "50"]
    }),
  entityType: z.enum([
    'resource',
    'project',
    'idea',
    'practice',
    'practice_checkin',
    'circle',
    'user',
    'review'
  ])
    .optional()
    .describe("篩選特定實體類型的熱門標籤")
    .meta({
      title: "實體類型篩選",
      examples: ['resource', 'project', 'idea', 'practice', 'practice_checkin', 'circle', 'user', 'review'],
      enumDescriptions: {
        "resource": "學習資源",
        "project": "專案計畫",
        "idea": "創意想法",
        "practice": "實作練習",
        "practice_checkin": "打卡記錄",
        "circle": "學習圈子",
        "user": "使用者標籤",
        "review": "評論"
      }
    }),
  timeRange: z.enum(['7d', '30d', '90d', '1y', 'all'])
    .optional()
    .default('all')
    .describe("時間範圍篩選，只統計指定時間內的使用次數")
    .meta({
      title: "時間範圍",
      examples: ['7d', '30d', '90d', '1y', 'all'],
      enumDescriptions: {
        "7d": "近 7 天",
        "30d": "近 30 天",
        "90d": "近 90 天",
        "1y": "近 1 年",
        "all": "全部時間"
      }
    })
}).describe("熱門標籤查詢參數").meta({
  title: "熱門標籤查詢",
  examples: [{
    limit: "20"
  }, {
    limit: "10",
    entityType: "resource"
  }, {
    limit: "20",
    timeRange: "30d"
  }]
});

// 實體標籤查詢參數驗證
export const entityTagsQuerySchema = z.object({
  entityId: z.string()
    .regex(/^\d+$/, '實體 ID 必須是數字')
    .transform(Number)
    .describe("實體唯一識別碼")
    .meta({
      title: "實體 ID",
      examples: ["1", "123", "456"]
    }),
  entityType: entityTypeSchema
}).describe("實體標籤查詢參數").meta({
  title: "實體標籤查詢",
  examples: [{
    entityId: "123",
    entityType: "resource"
  }]
});

// 添加實體標籤請求驗證
export const addEntityTagSchema = z.object({
  entityId: z.union([
    z.string().regex(/^\d+$/, '實體 ID 必須是數字').transform(Number),
    z.number().int('實體 ID 必須是整數')
  ])
    .describe("實體唯一識別碼")
    .meta({
      title: "實體 ID",
      examples: [123, 456, "789"]
    }),
  entityType: entityTypeSchema,
  tagName: tagNameSchema
}).describe("添加實體標籤的請求資料").meta({
  title: "添加實體標籤",
  examples: [{
    entityId: 123,
    entityType: "resource",
    tagName: "React"
  }]
});

// 移除實體標籤請求驗證
export const removeEntityTagSchema = z.object({
  entityId: z.union([
    z.string().regex(/^\d+$/, '實體 ID 必須是數字').transform(Number),
    z.number().int('實體 ID 必須是整數')
  ])
    .describe("實體唯一識別碼")
    .meta({
      title: "實體 ID",
      examples: [123, 456, "789"]
    }),
  entityType: entityTypeSchema,
  tagName: tagNameSchema
}).describe("移除實體標籤的請求資料").meta({
  title: "移除實體標籤",
  examples: [{
    entityId: 123,
    entityType: "resource",
    tagName: "React"
  }]
});

// 批量標籤操作驗證
export const batchTagOperationSchema = z.object({
  action: z.enum(['add', 'remove'], "無效的操作類型")
    .describe("批量操作類型")
    .meta({
      title: "操作類型",
      examples: ['add', 'remove'],
      enumDescriptions: {
        "add": "添加標籤",
        "remove": "移除標籤"
      }
    }),
  entityId: z.union([
    z.string().regex(/^\d+$/, '實體 ID 必須是數字').transform(Number),
    z.number().int('實體 ID 必須是整數')
  ])
    .describe("實體唯一識別碼")
    .meta({
      title: "實體 ID",
      examples: [123, 456, "789"]
    }),
  entityType: entityTypeSchema,
  tagNames: z.array(tagNameSchema)
    .min(1, '至少需要一個標籤')
    .max(10, '單次操作最多 10 個標籤')
    .describe("標籤名稱列表")
    .meta({
      title: "標籤列表",
      examples: [["React", "JavaScript"], ["前端開發", "Vue.js", "TypeScript"]]
    })
}).describe("批量標籤操作的請求資料").meta({
  title: "批量標籤操作",
  examples: [{
    action: "add",
    entityId: 123,
    entityType: "resource",
    tagNames: ["React", "JavaScript", "前端開發"]
  }]
});

// 標籤統計查詢參數驗證
export const tagStatsQuerySchema = z.object({
  entityType: entityTypeSchema
    .optional()
    .describe("指定實體類型的統計")
    .meta({
      title: "實體類型篩選",
      examples: ["resource", "project", "idea"]
    }),
  timeRange: z.enum(['7d', '30d', '90d', '1y', 'all'], "無效的時間範圍")
    .optional()
    .default('30d')
    .describe("統計時間範圍")
    .meta({
      title: "時間範圍",
      examples: ['7d', '30d', '90d', '1y', 'all'],
      enumDescriptions: {
        "7d": "近 7 天",
        "30d": "近 30 天",
        "90d": "近 90 天",
        "1y": "近 1 年",
        "all": "全部時間"
      }
    })
}).describe("標籤統計查詢參數").meta({
  title: "標籤統計查詢",
  examples: [{
    entityType: "resource",
    timeRange: "30d"
  }]
});

// 標籤引導句查詢參數驗證
export const tagPromptsQuerySchema = z.object({
  tags: z.string()
    .min(1, '必須提供至少一個標籤')
    .describe("標籤名稱，多個標籤用逗號分隔")
    .meta({
      title: "標籤名稱",
      examples: ["實作", "實作,新概念,困難"]
    }),
  usageType: z.enum(['practice_checkin', 'reflection', 'summary'])
    .optional()
    .default('practice_checkin')
    .describe("使用場景")
    .meta({
      title: "使用場景",
      examples: ['practice_checkin', 'reflection', 'summary'],
      enumDescriptions: {
        "practice_checkin": "打卡記錄",
        "reflection": "反思",
        "summary": "總結"
      }
    }),
  locale: z.enum(['zh-TW', 'en-US'])
    .optional()
    .default('zh-TW')
    .describe("語言")
    .meta({
      title: "語言",
      examples: ['zh-TW', 'en-US']
    })
}).describe("標籤引導句查詢參數").meta({
  title: "標籤引導句查詢",
  examples: [{
    tags: "實作",
    usageType: "practice_checkin",
    locale: "zh-TW"
  }]
});

// 標籤引導句回應 schema
export const tagPromptItemSchema = z.object({
  id: z.number().openapi({ description: "引導句 ID", example: 101 }),
  tagName: z.string().openapi({ description: "標籤名稱", example: "實作" }),
  prompt: z.string().openapi({ description: "引導句內容", example: "我練習了..." }),
  usageType: z.string().openapi({ description: "使用場景", example: "practice_checkin" })
}).openapi('TagPromptItem', {
  description: '標籤引導句項目',
  example: {
    id: 101,
    tagName: '實作',
    prompt: '我練習了...',
    usageType: 'practice_checkin'
  }
});

// 註冊 TagPromptItem
registry.register('TagPromptItem', tagPromptItemSchema);

// ===== RESPONSE VALIDATION SCHEMAS =====
// Based on tag.service.ts return types and API response structures

// Base tag entity schema (matches Prisma generated type)
export const tagEntitySchema = z.object({
  id: z.number().openapi({ description: "標籤 ID", example: 1 }),
  name: z.string().openapi({ description: "標籤名稱", example: "React" }),
  created_at: z.string().optional().openapi({ description: "創建時間", example: "2024-01-15T10:30:00.000Z" }),
  updated_at: z.string().optional().openapi({ description: "更新時間", example: "2024-01-15T10:30:00.000Z" })
}).openapi('TagEntity', {
  description: '標籤實體',
  example: {
    id: 1,
    name: 'React',
    created_at: '2024-01-15T10:30:00.000Z',
    updated_at: '2024-01-15T10:30:00.000Z'
  }
});

// 註冊 TagEntity
registry.register('TagEntity', tagEntitySchema);

// Formatted tag schema (used in controller responses)
export const formattedTagSchema = z.object({
  id: z.number().openapi({ description: "標籤 ID", example: 1 }),
  name: z.string().openapi({ description: "標籤名稱", example: "JavaScript" })
}).openapi('FormattedTag', {
  description: '格式化標籤',
  example: {
    id: 1,
    name: 'JavaScript'
  }
});

// 註冊 FormattedTag
registry.register('FormattedTag', formattedTagSchema);

// Popular tag item schema
export const popularTagItemSchema = z.object({
  id: z.number().openapi({ description: "標籤 ID", example: 1 }),
  name: z.string().openapi({ description: "標籤名稱", example: "React" }),
  count: z.number().openapi({ description: "使用次數", example: 150 })
}).openapi('PopularTagItem', {
  description: '熱門標籤項目',
  example: {
    id: 1,
    name: 'React',
    count: 150
  }
});

// 註冊 PopularTagItem
registry.register('PopularTagItem', popularTagItemSchema);

// Tag suggestion item schema
export const tagSuggestionItemSchema = z.object({
  id: z.number().openapi({ description: "標籤 ID", example: 1 }),
  name: z.string().openapi({ description: "標籤名稱", example: "React" }),
  count: z.number().openapi({ description: "使用次數", example: 150 }),
  matchType: z.enum(['exact', 'prefix', 'contains'])
    .openapi({ description: "匹配類型", example: "exact" })
    .meta({
      enumDescriptions: {
        "exact": "完全匹配",
        "prefix": "前綴匹配",
        "contains": "包含匹配"
      }
    })
}).openapi('TagSuggestionItem', {
  description: '標籤建議項目',
  example: {
    id: 1,
    name: 'React',
    count: 150,
    matchType: 'exact'
  }
});

// 註冊 TagSuggestionItem
registry.register('TagSuggestionItem', tagSuggestionItemSchema);

// Tag usage statistics schema
export const tagUsageStatsSchema = z.object({
  totalUsage: z.number().openapi({ description: "總使用次數", example: 256 }),
  resourceCount: z.number().openapi({ description: "資源使用次數", example: 120 }),
  ideaCount: z.number().openapi({ description: "想法使用次數", example: 85 })
}).openapi('TagUsageStats', {
  description: '標籤使用統計',
  example: {
    totalUsage: 256,
    resourceCount: 120,
    ideaCount: 85
  }
});

// 註冊 TagUsageStats
registry.register('TagUsageStats', tagUsageStatsSchema);

// Tag stats response schema
export const tagStatsDataSchema = z.object({
  totalTags: z.number().openapi({ description: "總標籤數量", example: 128 }),
  popularTags: z.array(popularTagItemSchema).openapi({ description: "熱門標籤列表" })
}).openapi('TagStatsData', {
  description: '標籤統計資料',
  example: {
    totalTags: 128,
    popularTags: [
      { id: 1, name: 'React', count: 150 },
      { id: 2, name: 'JavaScript', count: 120 }
    ]
  }
});

// 註冊 TagStatsData
registry.register('TagStatsData', tagStatsDataSchema);

// Entity tag operation schema
export const entityTagOperationSchema = z.object({
  entityId: z.number().openapi({ description: "實體 ID", example: 123 }),
  entityType: z.string().openapi({ description: "實體類型", example: "resource" }),
  tagName: z.string().openapi({ description: "標籤名稱", example: "React" })
}).openapi('EntityTagOperation', {
  description: '實體標籤操作',
  example: {
    entityId: 123,
    entityType: 'resource',
    tagName: 'React'
  }
});

// 註冊 EntityTagOperation
registry.register('EntityTagOperation', entityTagOperationSchema);

// Tag cleanup result schema
export const tagCleanupResultSchema = z.object({
  deletedCount: z.number().openapi({ description: "刪除的標籤數量", example: 5 })
}).openapi('TagCleanupResult', {
  description: '標籤清理結果',
  example: {
    deletedCount: 5
  }
});

// 註冊 TagCleanupResult
registry.register('TagCleanupResult', tagCleanupResultSchema);

// API Response schemas based on tag controller usage
export const getPopularTagsApiResponseSchema = apiSuccessResponseSchema(z.array(popularTagItemSchema));
export const searchTagsApiResponseSchema = apiSuccessResponseSchema(z.array(formattedTagSchema));
export const suggestTagsApiResponseSchema = apiSuccessResponseSchema(z.array(tagSuggestionItemSchema));
export const getTagStatsApiResponseSchema = apiSuccessResponseSchema(tagStatsDataSchema);
export const addEntityTagApiResponseSchema = apiSuccessResponseSchema(entityTagOperationSchema);
export const removeEntityTagApiResponseSchema = apiSuccessResponseSchema(z.null());
export const getEntityTagsApiResponseSchema = apiSuccessResponseSchema(z.array(formattedTagSchema));
export const getTagUsageStatsApiResponseSchema = apiSuccessResponseSchema(tagUsageStatsSchema);
export const tagCleanupApiResponseSchema = apiSuccessResponseSchema(tagCleanupResultSchema);
export const tagPromptsApiResponseSchema = apiSuccessResponseSchema(z.array(tagPromptItemSchema));

// 類型導出
export type TagSearchQuery = z.infer<typeof tagSearchQuerySchema>;
export type SuggestTagsQuery = z.infer<typeof suggestTagsQuerySchema>;
export type PopularTagsQuery = z.infer<typeof popularTagsQuerySchema>;
export type TagPromptsQuery = z.infer<typeof tagPromptsQuerySchema>;
export type EntityTagsQuery = z.infer<typeof entityTagsQuerySchema>;
export type AddEntityTagData = z.infer<typeof addEntityTagSchema>;
export type RemoveEntityTagData = z.infer<typeof removeEntityTagSchema>;
export type BatchTagOperationData = z.infer<typeof batchTagOperationSchema>;
export type TagStatsQuery = z.infer<typeof tagStatsQuerySchema>;

// Response type exports
export type TagEntity = z.infer<typeof tagEntitySchema>;
export type FormattedTag = z.infer<typeof formattedTagSchema>;
export type PopularTagItem = z.infer<typeof popularTagItemSchema>;
export type TagSuggestionItem = z.infer<typeof tagSuggestionItemSchema>;
export type TagPromptItem = z.infer<typeof tagPromptItemSchema>;
export type TagUsageStats = z.infer<typeof tagUsageStatsSchema>;
export type TagStatsData = z.infer<typeof tagStatsDataSchema>;
export type EntityTagOperation = z.infer<typeof entityTagOperationSchema>;
export type TagCleanupResult = z.infer<typeof tagCleanupResultSchema>;