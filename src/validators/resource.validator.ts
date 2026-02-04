/**
 * 資源驗證器
 * 使用 Zod 實現資源相關驗證，支援 OpenAPI 文檔生成
 */

import { z } from 'zod';
import { registry } from '../config/openapi-registry';
import {
  RESOURCE_TYPES,
  COST_TYPES,
  LEVEL_TYPES,
  RESOURCE_STATUS
} from '@/constants/mappings';
import {
  apiSuccessResponseSchema,
  cursorPaginatedApiResponseSchema
} from './api-response.validators';

// 將物件值轉換為字串陣列，用於 enum 驗證
const resourceTypeValues = Object.values(RESOURCE_TYPES);
const costTypeValues = Object.values(COST_TYPES);
const levelTypeValues = Object.values(LEVEL_TYPES);
const statusValues = Object.values(RESOURCE_STATUS);

// 資源評價嵌套 schema (用於創建資源時同時提交評價)
const reviewSchema = z.object({
  title: z.string()
    .min(1, { message: "評價標題為必填" })
    .max(255, { message: "評價標題最多 255 字符" })
    .openapi({
      description: "評價標題",
      example: "React 學習心得",
      examples: ["React 學習心得", "這個課程很實用", "推薦給初學者"]
    }),
  content: z.string()
    .min(1, { message: "評價內容為必填" })
    .openapi({
      description: "詳細的評價內容，分享使用心得和建議",
      example: "這個 React 課程內容豐富，從基礎到進階都有涵蓋，特別適合有 JavaScript 基礎的學習者。"
    }),
  scoreImpact: z.number()
    .min(1, { message: "評分最小為 1" })
    .max(5, { message: "評分最大為 5" })
    .openapi({
      description: "影響力評分 (1-5 分)",
      example: 4,
      minimum: 1,
      maximum: 5
    }),
  scoreComprehensiveness: z.number()
    .min(1, { message: "評分最小為 1" })
    .max(5, { message: "評分最大為 5" })
    .openapi({
      description: "完整性評分 (1-5 分)",
      example: 4,
      minimum: 1,
      maximum: 5
    }),
  scoreImplementation: z.number()
    .min(1, { message: "評分最小為 1" })
    .max(5, { message: "評分最大為 5" })
    .openapi({
      description: "實用性評分 (1-5 分)",
      example: 5,
      minimum: 1,
      maximum: 5
    }),
  recommendation: z.string()
    .nullable()
    .optional()
    .openapi({
      description: "推薦建議",
      example: "適合初學者",
      examples: ["適合初學者", "需要有基礎再學", "實戰性很強"]
    }),
  tags: z.array(z.string())
    .nullable()
    .optional()
    .openapi({
      description: "評價標籤",
      example: ["實用", "易懂"],
      examples: [["實用", "易懂"], ["進階", "挑戰性"], ["基礎", "入門"]]
    })
}).nullable().optional().openapi('ResourceReview', {
  description: "資源評價資訊",
  example: {
    title: "很棒的 React 教學資源",
    content: "內容豐富且實用，適合有 JavaScript 基礎的學習者",
    scoreImpact: 5,
    scoreComprehensiveness: 4,
    scoreImplementation: 5,
    recommendation: "強烈推薦給想學 React 的朋友",
    tags: ["實用", "清楚", "完整"]
  }
});

// 資源基本 schema
const resourceBaseSchema = z.object({
  name: z.string()
    .min(1, { message: "資源名稱為必填" })
    .max(255, { message: "資源名稱最多 255 字符" })
    .openapi({
      description: "資源名稱",
      example: "React 官方文檔",
      examples: ["React 官方文檔", "Vue.js 入門教學", "JavaScript 進階課程"],
      minLength: 1,
      maxLength: 255
    }),
  url: z.string()
    .min(1, { message: "資源 URL 為必填" })
    .max(1000, { message: "資源 URL 最多 1000 字符" })
    .url({ message: "URL 格式不正確" })
    .openapi({
      description: "資源連結 URL",
      example: "https://react.dev/",
      examples: ["https://react.dev/", "https://vuejs.org/guide/", "https://javascript.info/"],
      format: "uri",
      minLength: 1,
      maxLength: 1000
    }),
  imageUrl: z.string()
    .max(1000, { message: "圖片 URL 最多 1000 字符" })
    .url({ message: "URL 格式不正確" })
    .nullable()
    .optional()
    .openapi({
      description: "資源縮圖 URL",
      example: "https://example.com/react-logo.png",
      examples: ["https://example.com/react-logo.png", "https://example.com/vue-logo.png"],
      format: "uri",
      maxLength: 1000
    }),
  description: z.string()
    .min(1, { message: "資源描述為必填" })
    .openapi({
      description: "資源的詳細描述",
      example: "React 官方文檔，提供完整的 API 參考和教學指南",
      examples: ["React 官方文檔，提供完整的 API 參考和教學指南", "Vue.js 新手入門教學，從基礎概念到實作專案"],
      minLength: 1
    }),
  videoUrl: z.string()
    .max(1000, { message: "影片 URL 最多 1000 字符" })
    .url({ message: "URL 格式不正確" })
    .nullable()
    .optional()
    .openapi({
      description: "相關影片 URL",
      example: "https://youtube.com/watch?v=abc123",
      examples: ["https://youtube.com/watch?v=abc123", "https://vimeo.com/123456789"],
      format: "uri",
      maxLength: 1000
    }),
  type: z.enum(resourceTypeValues as [string, ...string[]], "無效的資源類型")
    .openapi({
      description: "資源類型",
      example: "learning_platform_app",
      enum: resourceTypeValues
    }),
  cost: z.enum(costTypeValues as [string, ...string[]], "無效的費用類型")
    .openapi({
      description: "費用類型",
      example: "free",
      enum: costTypeValues
    }),
  level: z.enum(levelTypeValues as [string, ...string[]], "無效的難度等級")
    .openapi({
      description: "難度等級",
      example: "intermediate",
      enum: levelTypeValues
    }),
  majorCategory: z.string()
    .min(1, { message: "主分類名稱為必填" })
    .nullable()
    .optional()
    .openapi({
      description: "主要分類 key（用於 URL 路徑參數）",
      example: "education_learning",
      examples: ["education_learning", "nature_environment", "information_computer_science", "arts_design"]
    }),
  subCategory: z.string()
    .min(1, { message: "子分類名稱為必填" })
    .nullable()
    .optional()
    .openapi({
      description: "子分類 key（用於 URL 路徑參數）",
      example: "physics",
      examples: ["physics", "biology", "mathematics", "chemistry"]
    }),
  tags: z.array(z.string())
    .nullable()
    .optional()
    .openapi({
      description: "資源標籤",
      example: ["JavaScript", "React", "前端"],
      examples: [["JavaScript", "React", "前端"], ["Python", "機器學習", "數據分析"]]
    })
}).openapi('ResourceBase', {
  description: "資源基本資訊"
});

// 創建資源 schema
export const createResourceSchema = resourceBaseSchema.extend({
  status: z.enum(statusValues as [string, ...string[]], "無效的資源狀態")
    .default("active")
    .openapi({
      description: "資源狀態",
      example: "active",
      enum: statusValues,
      default: "active"
    }),
  review: reviewSchema
}).openapi('CreateResourceRequest', {
  description: "建立資源的請求資料",
  example: {
    name: "React 官方文檔",
    url: "https://react.dev/",
    description: "React 官方文檔，提供完整的 API 參考和最新的開發指南",
    type: "learning_platform_app",
    cost: "free",
    level: "intermediate",
    majorCategory: "information_computer_science",
    subCategory: "physics",
    tags: ["JavaScript", "React", "前端框架"],
    status: "active",
    review: {
      title: "非常實用的官方文檔",
      content: "內容詳細且更新及時，是學習 React 必備的資源",
      scoreImpact: 5,
      scoreComprehensiveness: 5,
      scoreImplementation: 4,
      recommendation: "強烈推薦給所有 React 開發者",
      tags: ["官方", "完整", "實用"]
    }
  }
});

// 更新資源 schema - 重新定義所有欄位為真正的可選，用於部分更新
export const updateResourceSchema = z.object({
  name: z.string()
    .min(1, { message: "資源名稱不能為空" })
    .max(255, { message: "資源名稱最多 255 字符" })
    .optional()
    .openapi({
      description: "資源名稱",
      example: "React 官方文檔 (更新版)",
      minLength: 1,
      maxLength: 255
    }),
  url: z.string()
    .min(1, { message: "資源 URL 不能為空" })
    .max(1000, { message: "資源 URL 最多 1000 字符" })
    .url({ message: "URL 格式不正確" })
    .optional()
    .openapi({
      description: "資源連結 URL",
      example: "https://react.dev/",
      format: "uri",
      minLength: 1,
      maxLength: 1000
    }),
  imageUrl: z.string()
    .max(1000, { message: "圖片 URL 最多 1000 字符" })
    .url({ message: "URL 格式不正確" })
    .nullable()
    .optional()
    .openapi({
      description: "資源縮圖 URL",
      example: "https://example.com/react-logo.png",
      format: "uri",
      maxLength: 1000
    }),
  description: z.string()
    .min(1, { message: "資源描述不能為空" })
    .optional()
    .openapi({
      description: "資源的詳細描述",
      example: "React 官方文檔，包含最新的 React 18 功能介紹",
      minLength: 1
    }),
  videoUrl: z.string()
    .max(1000, { message: "影片 URL 最多 1000 字符" })
    .url({ message: "URL 格式不正確" })
    .nullable()
    .optional()
    .openapi({
      description: "相關影片 URL",
      example: "https://youtube.com/watch?v=abc123",
      format: "uri",
      maxLength: 1000
    }),
  type: z.enum(resourceTypeValues as [string, ...string[]], "無效的資源類型")
    .optional()
    .openapi({
      description: "資源類型",
      example: "learning_platform_app",
      enum: resourceTypeValues
    }),
  cost: z.enum(costTypeValues as [string, ...string[]], "無效的費用類型")
    .optional()
    .openapi({
      description: "費用類型",
      example: "free",
      enum: costTypeValues
    }),
  level: z.enum(levelTypeValues as [string, ...string[]], "無效的難度等級")
    .optional()
    .openapi({
      description: "難度等級",
      example: "intermediate",
      enum: levelTypeValues
    }),
  majorCategory: z.string()
    .min(1, { message: "主分類名稱不能為空" })
    .nullable()
    .optional()
    .openapi({
      description: "主要分類 key（用於 URL 路徑參數）",
      example: "education_learning"
    }),
  subCategory: z.string()
    .min(1, { message: "子分類名稱不能為空" })
    .nullable()
    .optional()
    .openapi({
      description: "子分類 key（用於 URL 路徑參數）",
      example: "physics"
    }),
  tags: z.array(z.string())
    .nullable()
    .optional()
    .openapi({
      description: "資源標籤",
      example: ["JavaScript", "React", "React 18"]
    }),
  status: z.enum(statusValues as [string, ...string[]], "無效的資源狀態")
    .optional()
    .openapi({
      description: "資源狀態",
      example: "active",
      enum: statusValues
    })
}).openapi('UpdateResourceRequest', {
  description: "更新資源的請求資料（部分更新）",
  examples: [
    {
      name: "React 官方文檔 (更新版)",
      description: "React 官方文檔，包含最新的 React 18 功能介紹",
      tags: ["JavaScript", "React", "React 18"]
    },
    {
      description: "Updated description only"
    },
    {
      name: "New resource name",
      status: "active"
    }
  ]
});

// 更新資源狀態 schema
export const updateResourceStatusSchema = z.object({
  status: z.enum(statusValues as [string, ...string[]], "無效的資源狀態")
    .openapi({
      description: "新的資源狀態",
      example: "active",
      enum: statusValues
    })
}).openapi('UpdateResourceStatusRequest', {
  description: "更新資源狀態的請求資料",
  examples: [
    { status: "active" },
    { status: "draft" }
  ]
});

// 使用 zod 推導型別
export type CreateResourceSchema = z.infer<typeof createResourceSchema>;
export type UpdateResourceSchema = z.infer<typeof updateResourceSchema>;
export type UpdateResourceStatusSchema = z.infer<typeof updateResourceStatusSchema>;

// 資源 API 響應類型
export type ResourceSchema = UpdateResourceSchema & {
  id: number;
  created_by: number;
  created_at: string;
  updated_at: string;
  author?: Record<string, unknown>;
  majorCategory?: Record<string, unknown>;
  subCategory?: Record<string, unknown>;
  tags?: string[];
  stats?: {
    view_count: number;
    favorite_count: number;
    share_count: number;
    review_count: number;
  };
  avgRating?: number | null;
};

// 用戶基本資訊 schema - 匹配 transformResourceToApi 的 user 格式
const userBasicInfoSchema = z.object({
  id: z.string().openapi({
    description: '用戶內部 ID',
    example: '123'
  }),
  _id: z.string().openapi({
    description: '用戶外部 ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000'
  }),
  name: z.string().openapi({
    description: '用戶名稱',
    example: '王小明'
  }),
  roleList: z.array(z.string()).optional().openapi({
    description: '用戶角色列表',
    example: ['educator', 'parents']
  }),
  photoURL: z.string().url().nullable().openapi({
    description: '用戶頭像 URL',
    example: 'https://example.com/avatar.jpg',
    format: 'uri'
  }),
  educationStage: z.string().nullable().optional().openapi({
    description: '教育階段',
    example: 'university'
  }),
  tagList: z.array(z.string()).optional().openapi({
    description: '用戶標籤列表',
    example: ['前端開發', '教育']
  }),
  selfIntroduction: z.string().nullable().optional().openapi({
    description: '自我介紹',
    example: '熱愛學習與分享的開發者'
  })
}).openapi('UserBasicInfo', {
  description: '用戶基本資訊'
});


// 資源回應 schema - 匹配 transformResourceToApi 格式
export const resourceResponseSchema = z.object({
  id: z.string().openapi({
    description: '資源 ID',
    example: '550e8400-e29b-41d4-a716-446655440000'
  }),
  name: z.string().openapi({
    description: '資源名稱',
    example: 'React 官方文檔'
  }),
  url: z.string().url().openapi({
    description: '資源 URL',
    example: 'https://react.dev/',
    format: 'uri'
  }),
  imageUrl: z.string().url().nullable().openapi({
    description: '資源縮圖 URL',
    example: 'https://example.com/react-logo.png',
    format: 'uri'
  }),
  description: z.string().openapi({
    description: '資源描述',
    example: 'React 官方文檔，提供完整的 API 參考和開發指南'
  }),
  videoUrl: z.string().url().nullable().openapi({
    description: '影片 URL',
    example: null,
    format: 'uri'
  }),
  type: z.enum(resourceTypeValues as [string, ...string[]]).openapi({
    description: '資源類型',
    example: 'learning_platform_app',
    enum: resourceTypeValues
  }),
  cost: z.enum(costTypeValues as [string, ...string[]]).openapi({
    description: '費用類型',
    example: 'free',
    enum: costTypeValues
  }),
  level: z.enum(levelTypeValues as [string, ...string[]]).openapi({
    description: '難度等級',
    example: 'intermediate',
    enum: levelTypeValues
  }),
  status: z.enum(statusValues as [string, ...string[]]).openapi({
    description: '資源狀態',
    example: 'active',
    enum: statusValues
  }),
  avgRating: z.number().nullable().openapi({
    description: '平均評分',
    example: 4.6
  }),
  user: userBasicInfoSchema,
  majorCategory: z.string().nullable().openapi({
    description: '主分類 key（用於 URL 路徑參數）',
    example: 'education_learning'
  }),
  subCategory: z.string().nullable().openapi({
    description: '子分類 key（用於 URL 路徑參數）',
    example: 'physics'
  }),
  tags: z.array(z.string()).openapi({
    description: '標籤名稱列表',
    example: ['JavaScript', 'React', '前端框架']
  }),
  createdAt: z.string().datetime().openapi({
    description: '創建時間',
    example: '2024-01-15T10:30:00.000Z',
    format: 'date-time'
  }),
  updatedAt: z.string().datetime().openapi({
    description: '更新時間',
    example: '2024-01-15T11:00:00.000Z',
    format: 'date-time'
  }),
  viewCount: z.number().int().min(0).openapi({
    description: '瀏覽次數',
    example: 1250,
    minimum: 0
  }),
  favoriteCount: z.number().int().min(0).openapi({
    description: '收藏次數',
    example: 85,
    minimum: 0
  }),
  shareCount: z.number().int().min(0).openapi({
    description: '分享次數',
    example: 42,
    minimum: 0
  }),
  reviewCount: z.number().int().min(0).openapi({
    description: '評價次數',
    example: 25,
    minimum: 0
  }),
  likeCount: z.number().int().min(0).openapi({
    description: '按讚次數',
    example: 320,
    minimum: 0
  })
}).openapi('ResourceData', {
  description: '資源詳情回應'
});

// 資源列表項目 schema - 與資源詳情相同的格式
export const resourceListItemSchema = resourceResponseSchema;

// 資源統計回應 schema
export const resourceStatsResponseSchema = z.object({
  totalResources: z.number().int().min(0).openapi({
    description: '總資源數',
    example: 150,
    minimum: 0
  }),
  activeResources: z.number().int().min(0).openapi({
    description: '啟用資源數',
    example: 142,
    minimum: 0
  }),
  categoryStats: z.record(z.string(), z.number().int().min(0)).openapi({
    description: '分類統計（key 值對應資源數量）',
    example: {
      'education_learning': 45,
      'nature_environment': 32,
      'information_computer_science': 28,
      'arts_design': 15
    }
  }),
  typeStats: z.record(z.string(), z.number().int().min(0)).openapi({
    description: '類型統計',
    example: {
      'learning_platform_app': 65,
      'video_content': 35,
      'books_articles': 25,
      'learning_tools': 20,
      'other': 5
    }
  })
}).openapi('ResourceStats', {
  description: '資源統計回應'
});

// 建立具體的回應 schema
export const getResourceByIdResponseSchema = apiSuccessResponseSchema(resourceResponseSchema);

export const getResourcesListResponseSchema = cursorPaginatedApiResponseSchema(resourceListItemSchema);

export const createResourceResponseSchema = apiSuccessResponseSchema(resourceResponseSchema);

export const updateResourceResponseSchema = apiSuccessResponseSchema(resourceResponseSchema);

export const getResourceStatsResponseSchema = apiSuccessResponseSchema(resourceStatsResponseSchema);

export const getResourceTagsResponseSchema = apiSuccessResponseSchema(
  z.array(z.string()).openapi({
    description: '標籤名稱列表',
    example: ['JavaScript', 'React', '前端框架']
  })
);

export const deleteResourceResponseSchema = apiSuccessResponseSchema(
  z.object({
    message: z.string().openapi({
      description: '刪除成功訊息',
      example: '資源已成功刪除'
    })
  })
);

// ===================================
// 🎯 註冊 schemas 到 OpenAPI registry
// ===================================

// 註冊可重用的 schema 組件
registry.register('ResourceReview', reviewSchema);
registry.register('ResourceBase', resourceBaseSchema);
registry.register('CreateResourceRequest', createResourceSchema);
registry.register('UpdateResourceRequest', updateResourceSchema);
registry.register('UpdateResourceStatusRequest', updateResourceStatusSchema);
registry.register('UserBasicInfo', userBasicInfoSchema);
registry.register('ResourceData', resourceResponseSchema);
registry.register('ResourceStats', resourceStatsResponseSchema);

// 導出驗證函數
export const validateCreateResource = (data: unknown): CreateResourceSchema => createResourceSchema.parse(data);
export const validateUpdateResource = (data: unknown): UpdateResourceSchema => updateResourceSchema.parse(data);
export const validateUpdateResourceStatus = (data: unknown): UpdateResourceStatusSchema => updateResourceStatusSchema.parse(data);

// 導出回應驗證函數
export const validateGetResourceByIdResponse = (data: unknown): z.infer<typeof getResourceByIdResponseSchema> => getResourceByIdResponseSchema.parse(data);
export const validateGetResourcesListResponse = (data: unknown): z.infer<typeof getResourcesListResponseSchema> => getResourcesListResponseSchema.parse(data);
export const validateCreateResourceResponse = (data: unknown): z.infer<typeof createResourceResponseSchema> => createResourceResponseSchema.parse(data);
export const validateUpdateResourceResponse = (data: unknown): z.infer<typeof updateResourceResponseSchema> => updateResourceResponseSchema.parse(data);
export const validateGetResourceStatsResponse = (data: unknown): z.infer<typeof getResourceStatsResponseSchema> => getResourceStatsResponseSchema.parse(data);
export const validateGetResourceTagsResponse = (data: unknown): z.infer<typeof getResourceTagsResponseSchema> => getResourceTagsResponseSchema.parse(data);
export const validateDeleteResourceResponse = (data: unknown): z.infer<typeof deleteResourceResponseSchema> => deleteResourceResponseSchema.parse(data);
