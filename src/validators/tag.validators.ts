/**
 * Tag Validators
 * 標籤驗證器 - 使用 Zod 進行資料驗證
 */

import { z } from 'zod';
import {
  apiSuccessResponseSchema
} from './api-response.validators';

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
  'review'
], "無效的實體類型")
  .describe("實體類型")
  .meta({
    title: "實體類型",
    examples: ['resource', 'project', 'idea', 'practice', 'review'],
    enumDescriptions: {
      "resource": "資源",
      "project": "專案",
      "idea": "想法",
      "practice": "實作",
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
    })
}).describe("熱門標籤查詢參數").meta({
  title: "熱門標籤查詢",
  examples: [{
    limit: "20"
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

// ===== RESPONSE VALIDATION SCHEMAS =====
// Based on tag.service.ts return types and API response structures

// Base tag entity schema (matches Prisma generated type)
export const tagEntitySchema = z.object({
  id: z.number().describe("標籤 ID"),
  name: z.string().describe("標籤名稱"),
  created_at: z.string().optional().describe("創建時間"),
  updated_at: z.string().optional().describe("更新時間")
});

// Formatted tag schema (used in controller responses)
export const formattedTagSchema = z.object({
  id: z.number().describe("標籤 ID"),
  name: z.string().describe("標籤名稱")
});

// Popular tag item schema
export const popularTagItemSchema = z.object({
  id: z.number().describe("標籤 ID"),
  name: z.string().describe("標籤名稱"),
  count: z.number().describe("使用次數")
});

// Tag usage statistics schema
export const tagUsageStatsSchema = z.object({
  totalUsage: z.number().describe("總使用次數"),
  resourceCount: z.number().describe("資源使用次數"),
  ideaCount: z.number().describe("想法使用次數")
});

// Tag stats response schema
export const tagStatsDataSchema = z.object({
  totalTags: z.number().describe("總標籤數量"),
  popularTags: z.array(popularTagItemSchema).describe("熱門標籤列表")
});

// Entity tag operation schema
export const entityTagOperationSchema = z.object({
  entityId: z.number().describe("實體 ID"),
  entityType: z.string().describe("實體類型"),
  tagName: z.string().describe("標籤名稱")
});

// Tag cleanup result schema
export const tagCleanupResultSchema = z.object({
  deletedCount: z.number().describe("刪除的標籤數量")
});

// API Response schemas based on tag controller usage
export const getPopularTagsApiResponseSchema = apiSuccessResponseSchema(z.array(popularTagItemSchema));
export const searchTagsApiResponseSchema = apiSuccessResponseSchema(z.array(formattedTagSchema));
export const getTagStatsApiResponseSchema = apiSuccessResponseSchema(tagStatsDataSchema);
export const addEntityTagApiResponseSchema = apiSuccessResponseSchema(entityTagOperationSchema);
export const removeEntityTagApiResponseSchema = apiSuccessResponseSchema(z.undefined());
export const getEntityTagsApiResponseSchema = apiSuccessResponseSchema(z.array(formattedTagSchema));
export const getTagUsageStatsApiResponseSchema = apiSuccessResponseSchema(tagUsageStatsSchema);
export const tagCleanupApiResponseSchema = apiSuccessResponseSchema(tagCleanupResultSchema);

// 類型導出
export type TagSearchQuery = z.infer<typeof tagSearchQuerySchema>;
export type PopularTagsQuery = z.infer<typeof popularTagsQuerySchema>;
export type EntityTagsQuery = z.infer<typeof entityTagsQuerySchema>;
export type AddEntityTagData = z.infer<typeof addEntityTagSchema>;
export type RemoveEntityTagData = z.infer<typeof removeEntityTagSchema>;
export type BatchTagOperationData = z.infer<typeof batchTagOperationSchema>;
export type TagStatsQuery = z.infer<typeof tagStatsQuerySchema>;

// Response type exports
export type TagEntity = z.infer<typeof tagEntitySchema>;
export type FormattedTag = z.infer<typeof formattedTagSchema>;
export type PopularTagItem = z.infer<typeof popularTagItemSchema>;
export type TagUsageStats = z.infer<typeof tagUsageStatsSchema>;
export type TagStatsData = z.infer<typeof tagStatsDataSchema>;
export type EntityTagOperation = z.infer<typeof entityTagOperationSchema>;
export type TagCleanupResult = z.infer<typeof tagCleanupResultSchema>;