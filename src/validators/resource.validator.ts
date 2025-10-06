/**
 * 資源驗證器
 * 使用 Zod 實現資源相關驗證
 */

import { z } from 'zod';
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
    .describe("評價標題")
    .meta({
      title: "評價標題",
      examples: ["React 學習心得", "這個課程很實用", "推薦給初學者"]
    }),
  content: z.string()
    .min(1, { message: "評價內容為必填" })
    .describe("詳細的評價內容，分享使用心得和建議")
    .meta({
      title: "評價內容",
      examples: ["這個 React 課程內容豐富，從基礎到進階都有涵蓋，特別適合有 JavaScript 基礎的學習者。"]
    }),
  scoreImpact: z.number()
    .min(1, { message: "評分最小為 1" })
    .max(5, { message: "評分最大為 5" })
    .describe("影響力評分 (1-5 分)")
    .meta({
      title: "影響力評分",
      examples: [4, 5, 3]
    }),
  scoreComprehensiveness: z.number()
    .min(1, { message: "評分最小為 1" })
    .max(5, { message: "評分最大為 5" })
    .describe("完整性評分 (1-5 分)")
    .meta({
      title: "完整性評分",
      examples: [4, 5, 3]
    }),
  scoreImplementation: z.number()
    .min(1, { message: "評分最小為 1" })
    .max(5, { message: "評分最大為 5" })
    .describe("實用性評分 (1-5 分)")
    .meta({
      title: "實用性評分",
      examples: [4, 5, 3]
    }),
  recommendation: z.string()
    .nullable()
    .optional()
    .describe("推薦建議")
    .meta({
      title: "推薦建議",
      examples: ["適合初學者", "需要有基礎再學", "實戰性很強"]
    }),
  tags: z.array(z.string())
    .nullable()
    .optional()
    .describe("評價標籤")
    .meta({
      title: "評價標籤",
      examples: [["實用", "易懂"], ["進階", "挑戰性"], ["基礎", "入門"]]
    })
}).nullable().optional().describe("資源評價資訊").meta({
  title: "資源評價",
  examples: [{
    title: "很棒的 React 教學資源",
    content: "內容豐富且實用，適合有 JavaScript 基礎的學習者",
    scoreImpact: 5,
    scoreComprehensiveness: 4,
    scoreImplementation: 5,
    recommendation: "強烈推薦給想學 React 的朋友",
    tags: ["實用", "清楚", "完整"]
  }]
});

// 資源基本 schema
const resourceBaseSchema = z.object({
  name: z.string()
    .min(1, { message: "資源名稱為必填" })
    .max(255, { message: "資源名稱最多 255 字符" })
    .describe("資源名稱")
    .meta({
      title: "資源名稱",
      examples: ["React 官方文檔", "Vue.js 入門教學", "JavaScript 進階課程"]
    }),
  url: z.string()
    .min(1, { message: "資源 URL 為必填" })
    .max(1000, { message: "資源 URL 最多 1000 字符" })
    .url({ message: "URL 格式不正確" })
    .describe("資源連結 URL")
    .meta({
      title: "資源 URL",
      examples: ["https://react.dev/", "https://vuejs.org/guide/", "https://javascript.info/"]
    }),
  imageUrl: z.string()
    .max(1000, { message: "圖片 URL 最多 1000 字符" })
    .url({ message: "URL 格式不正確" })
    .nullable()
    .optional()
    .describe("資源縮圖 URL")
    .meta({
      title: "縮圖 URL",
      examples: ["https://example.com/react-logo.png", "https://example.com/vue-logo.png"]
    }),
  description: z.string()
    .min(1, { message: "資源描述為必填" })
    .describe("資源的詳細描述")
    .meta({
      title: "資源描述",
      examples: ["React 官方文檔，提供完整的 API 參考和教學指南", "Vue.js 新手入門教學，從基礎概念到實作專案"]
    }),
  videoUrl: z.string()
    .max(1000, { message: "影片 URL 最多 1000 字符" })
    .url({ message: "URL 格式不正確" })
    .nullable()
    .optional()
    .describe("相關影片 URL")
    .meta({
      title: "影片 URL",
      examples: ["https://youtube.com/watch?v=abc123", "https://vimeo.com/123456789"]
    }),
  type: z.enum(resourceTypeValues as [string, ...string[]], "無效的資源類型")
    .describe("資源類型")
    .meta({
      title: "資源類型",
      examples: resourceTypeValues,
      enumDescriptions: {
        "learning_platform_app": "學習平台應用",
        "learning_tools": "學習工具",
        "books_articles": "書籍文章",
        "video_content": "影片內容",
        "podcast_content": "播客內容",
        "workshops_courses": "工作坊課程",
        "professional_certificates": "專業證照",
        "community_organization": "社群組織",
        "other": "其他"
      }
    }),
  cost: z.enum(costTypeValues as [string, ...string[]], "無效的費用類型")
    .describe("費用類型")
    .meta({
      title: "費用類型",
      examples: costTypeValues,
      enumDescriptions: {
        "free": "免費",
        "paid": "付費",
        "partial_free": "部分免費"
      }
    }),
  level: z.enum(levelTypeValues as [string, ...string[]], "無效的難度等級")
    .describe("難度等級")
    .meta({
      title: "難度等級",
      examples: levelTypeValues,
      enumDescriptions: {
        "beginner": "初學者",
        "intermediate": "中級",
        "expert": "專家",
        "all_levels": "全等級"
      }
    }),
  majorCategory: z.string()
    .min(1, { message: "主分類名稱為必填" })
    .nullable()
    .optional()
    .describe("主要分類")
    .meta({
      title: "主分類",
      examples: ["前端開發", "後端開發", "數據科學", "設計"]
    }),
  subCategory: z.string()
    .min(1, { message: "子分類名稱為必填" })
    .nullable()
    .optional()
    .describe("子分類")
    .meta({
      title: "子分類",
      examples: ["React", "Vue.js", "Node.js", "Python"]
    }),
  tags: z.array(z.string())
    .nullable()
    .optional()
    .describe("資源標籤")
    .meta({
      title: "標籤",
      examples: [["JavaScript", "React", "前端"], ["Python", "機器學習", "數據分析"]]
    })
}).describe("資源基本資訊").meta({
  title: "資源基本資訊"
});

// 創建資源 schema
export const createResourceSchema = resourceBaseSchema.extend({
  status: z.enum(statusValues as [string, ...string[]], "無效的資源狀態")
    .default("active")
    .describe("資源狀態")
    .meta({
      title: "資源狀態",
      examples: statusValues,
      enumDescriptions: {
        "draft": "草稿",
        "active": "啟用中",
        "archived": "已封存",
        "reported": "已被檢舉"
      }
    }),
  review: reviewSchema
}).describe("建立資源的請求資料").meta({
  title: "建立資源",
  examples: [{
    name: "React 官方文檔",
    url: "https://react.dev/",
    description: "React 官方文檔，提供完整的 API 參考和最新的開發指南",
    type: "website",
    cost: "free",
    level: "intermediate",
    majorCategory: "前端開發",
    subCategory: "React",
    tags: ["JavaScript", "React", "前端框架"],
    status: "active",
    review: {
      title: "非常實用的官方文檔",
      content: "內容詳細且更新及時，是學習 React 必備的資源",
      score_impact: 5,
      score_comprehensiveness: 5,
      score_implementation: 4,
      recommendation: "強烈推薦給所有 React 開發者",
      tags: ["官方", "完整", "實用"]
    }
  }]
});

// 更新資源 schema - 重新定義所有欄位為真正的可選，用於部分更新
export const updateResourceSchema = z.object({
  name: z.string()
    .min(1, { message: "資源名稱不能為空" })
    .max(255, { message: "資源名稱最多 255 字符" })
    .optional()
    .describe("資源名稱"),
  url: z.string()
    .min(1, { message: "資源 URL 不能為空" })
    .max(1000, { message: "資源 URL 最多 1000 字符" })
    .url({ message: "URL 格式不正確" })
    .optional()
    .describe("資源連結 URL"),
  imageUrl: z.string()
    .max(1000, { message: "圖片 URL 最多 1000 字符" })
    .url({ message: "URL 格式不正確" })
    .nullable()
    .optional()
    .describe("資源縮圖 URL"),
  description: z.string()
    .min(1, { message: "資源描述不能為空" })
    .optional()
    .describe("資源的詳細描述"),
  videoUrl: z.string()
    .max(1000, { message: "影片 URL 最多 1000 字符" })
    .url({ message: "URL 格式不正確" })
    .nullable()
    .optional()
    .describe("相關影片 URL"),
  type: z.enum(resourceTypeValues as [string, ...string[]], "無效的資源類型")
    .optional()
    .describe("資源類型"),
  cost: z.enum(costTypeValues as [string, ...string[]], "無效的費用類型")
    .optional()
    .describe("費用類型"),
  level: z.enum(levelTypeValues as [string, ...string[]], "無效的難度等級")
    .optional()
    .describe("難度等級"),
  majorCategory: z.string()
    .min(1, { message: "主分類名稱不能為空" })
    .nullable()
    .optional()
    .describe("主要分類"),
  subCategory: z.string()
    .min(1, { message: "子分類名稱不能為空" })
    .nullable()
    .optional()
    .describe("子分類"),
  tags: z.array(z.string())
    .nullable()
    .optional()
    .describe("資源標籤"),
  status: z.enum(statusValues as [string, ...string[]], "無效的資源狀態")
    .optional()
    .describe("資源狀態")
}).describe("更新資源的請求資料（部分更新）").meta({
  title: "更新資源",
  examples: [{
    name: "React 官方文檔 (更新版)",
    description: "React 官方文檔，包含最新的 React 18 功能介紹",
    tags: ["JavaScript", "React", "React 18"]
  }, {
    description: "Updated description only"
  }, {
    name: "New resource name",
    status: "active"
  }]
});

// 更新資源狀態 schema
export const updateResourceStatusSchema = z.object({
  status: z.enum(statusValues as [string, ...string[]], "無效的資源狀態")
    .describe("新的資源狀態")
    .meta({
      title: "資源狀態",
      examples: statusValues,
      enumDescriptions: {
        "draft": "草稿",
        "active": "啟用中",
        "archived": "已封存",
        "reported": "已被檢舉"
      }
    })
}).describe("更新資源狀態的請求資料").meta({
  title: "更新資源狀態",
  examples: [{
    status: "active"
  }, {
    status: "inactive"
  }]
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
  id: z.number().int().describe('用戶 ID'),
  name: z.string().describe('用戶名稱'),
  _id: z.string().describe('用戶外部 ID'),
  roleList: z.array(z.string()).optional().describe('用戶角色列表'),
  photoURL: z.string().url().nullable().describe('用戶頭像 URL'),
  educationStage: z.string().nullable().optional().describe('教育階段'),
  tagList: z.array(z.string()).optional().describe('用戶標籤列表'),
  selfIntroduction: z.string().nullable().optional().describe('自我介紹')
}).describe('用戶基本資訊');


// 資源回應 schema - 匹配 transformResourceToApi 格式
export const resourceResponseSchema = z.object({
  id: z.string().describe('資源 ID'),
  name: z.string().describe('資源名稱'),
  url: z.string().url().describe('資源 URL'),
  imageUrl: z.string().url().nullable().describe('資源縮圖 URL'),
  description: z.string().describe('資源描述'),
  videoUrl: z.string().url().nullable().describe('影片 URL'),
  type: z.enum(resourceTypeValues as [string, ...string[]]).describe('資源類型'),
  cost: z.enum(costTypeValues as [string, ...string[]]).describe('費用類型'),
  level: z.enum(levelTypeValues as [string, ...string[]]).describe('難度等級'),
  status: z.enum(statusValues as [string, ...string[]]).describe('資源狀態'),
  avgRating: z.number().nullable().describe('平均評分'),
  user: userBasicInfoSchema.describe('用戶資訊'),
  majorCategory: z.string().nullable().describe('主分類名稱'),
  subCategory: z.string().nullable().describe('子分類名稱'),
  tags: z.array(z.string()).describe('標籤名稱列表'),
  createdAt: z.string().datetime().describe('創建時間'),
  updatedAt: z.string().datetime().describe('更新時間'),
  viewCount: z.number().int().min(0).describe('瀏覽次數'),
  favoriteCount: z.number().int().min(0).describe('收藏次數'),
  shareCount: z.number().int().min(0).describe('分享次數'),
  reviewCount: z.number().int().min(0).describe('評價次數'),
  likeCount: z.number().int().min(0).describe('按讚次數')
}).describe('資源詳情回應').meta({
  title: '資源詳情',
  examples: [{
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'React 官方文檔',
    url: 'https://react.dev/',
    imageUrl: 'https://example.com/react-logo.png',
    description: 'React 官方文檔，提供完整的 API 參考和開發指南',
    videoUrl: null,
    type: 'website',
    cost: 'free',
    level: 'intermediate',
    status: 'active',
    author: {
      id: 123,
      nickname: '前端開發者',
      photoUrl: 'https://example.com/avatar.jpg'
    },
    majorCategory: {
      id: 1,
      name: '前端開發'
    },
    subCategory: {
      id: 10,
      name: 'React'
    },
    tags: [
      { id: 1, name: 'JavaScript' },
      { id: 2, name: 'React' },
      { id: 3, name: '前端框架' }
    ],
    reviewStats: {
      totalReviews: 25,
      averageScores: {
        impact: 4.8,
        mindset: 4.5,
        problems: 4.6,
        perspectives: 4.4,
        goals: 4.7
      }
    },
    createdAt: '2024-01-15T10:30:00.000Z',
    updatedAt: '2024-01-15T11:00:00.000Z'
  }]
});

// 資源列表項目 schema - 匹配 transformResourceToApi 格式
export const resourceListItemSchema = resourceResponseSchema.describe('資源列表項目').meta({
  title: '資源列表項目',
  examples: [{
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Vue.js 入門教學',
    url: 'https://vuejs.org/guide/',
    imageUrl: 'https://example.com/vue-logo.png',
    description: 'Vue.js 官方入門教學',
    type: 'website',
    cost: 'free',
    level: 'beginner',
    status: 'active',
    author: {
      id: 124,
      nickname: 'Vue 愛好者',
      photoUrl: 'https://example.com/avatar2.jpg'
    },
    majorCategory: {
      id: 1,
      name: '前端開發'
    },
    subCategory: {
      id: 11,
      name: 'Vue.js'
    },
    tags: [
      { id: 4, name: 'JavaScript' },
      { id: 5, name: 'Vue.js' }
    ],
    reviewStats: {
      totalReviews: 18,
      averageScores: {
        impact: 4.5,
        mindset: 4.2,
        problems: 4.3,
        perspectives: 4.1,
        goals: 4.4
      }
    },
    createdAt: '2024-01-14T09:15:00.000Z',
    updatedAt: '2024-01-14T09:15:00.000Z'
  }]
});

// 資源統計回應 schema
export const resourceStatsResponseSchema = z.object({
  totalResources: z.number().int().min(0).describe('總資源數'),
  activeResources: z.number().int().min(0).describe('啟用資源數'),
  categoryStats: z.record(z.string(), z.number().int().min(0)).describe('分類統計'),
  typeStats: z.record(z.string(), z.number().int().min(0)).describe('類型統計')
}).describe('資源統計回應').meta({
  title: '資源統計',
  examples: [{
    totalResources: 150,
    activeResources: 142,
    categoryStats: {
      '前端開發': 45,
      '後端開發': 32,
      '資料科學': 28,
      '設計': 15
    },
    typeStats: {
      'website': 65,
      'video_content': 35,
      'books_articles': 25,
      'learning_tools': 20,
      'other': 5
    }
  }]
});

// 建立具體的回應 schema
export const getResourceByIdResponseSchema = apiSuccessResponseSchema(resourceResponseSchema)
  .describe('獲取單個資源的回應')
  .meta({
    title: '獲取資源詳情回應',
    examples: [{
      success: true,
      data: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'React 官方文檔',
        url: 'https://react.dev/',
        imageUrl: 'https://example.com/react-logo.png',
        description: 'React 官方文檔，提供完整的 API 參考和開發指南',
        videoUrl: null,
        type: 'website',
        cost: 'free',
        level: 'intermediate',
        status: 'active',
        author: {
          id: 123,
          nickname: '前端開發者',
          photoUrl: 'https://example.com/avatar.jpg'
        },
        majorCategory: { id: 1, name: '前端開發' },
        subCategory: { id: 10, name: 'React' },
        tags: [
          { id: 1, name: 'JavaScript' },
          { id: 2, name: 'React' }
        ],
        reviewStats: {
          totalReviews: 25,
          averageScores: { impact: 4.8, mindset: 4.5, problems: 4.6, perspectives: 4.4, goals: 4.7 }
        },
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T11:00:00.000Z'
      },
      timestamp: '2024-01-15T10:30:00.000Z'
    }]
  });

export const getResourcesListResponseSchema = cursorPaginatedApiResponseSchema(resourceListItemSchema)
  .describe('獲取資源列表的回應')
  .meta({
    title: '獲取資源列表回應',
    examples: [{
      success: true,
      data: [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'React 官方文檔',
          url: 'https://react.dev/',
          imageUrl: 'https://example.com/react-logo.png',
          description: 'React 官方文檔',
          type: 'website',
          cost: 'free',
          level: 'intermediate',
          status: 'active',
          author: { id: 123, nickname: '前端開發者', photoUrl: 'https://example.com/avatar.jpg' },
          majorCategory: { id: 1, name: '前端開發' },
          subCategory: { id: 10, name: 'React' },
          tags: [{ id: 1, name: 'JavaScript' }],
          reviewStats: { totalReviews: 25, averageScores: { impact: 4.8, mindset: 4.5, problems: 4.6, perspectives: 4.4, goals: 4.7 } },
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-01-15T11:00:00.000Z'
        }
      ],
      pagination: {
        cursors: { start: 'cursor1', end: 'cursor2' },
        hasMore: true,
        count: 1,
        limit: 10,
        hasNext: true,
        hasPrev: false,
        nextCursor: 'cursor2',
        prevCursor: null,
        totalEstimate: 150,
        parentTotalEstimate: null
      },
      timestamp: '2024-01-15T10:30:00.000Z'
    }]
  });

export const createResourceResponseSchema = apiSuccessResponseSchema(resourceResponseSchema)
  .describe('創建資源的回應')
  .meta({
    title: '創建資源回應',
    examples: [{
      success: true,
      data: {
        id: '550e8400-e29b-41d4-a716-446655440002',
        name: 'TypeScript 學習指南',
        url: 'https://typescript.example.com',
        imageUrl: null,
        description: 'TypeScript 完整學習指南',
        videoUrl: null,
        type: 'website',
        cost: 'free',
        level: 'intermediate',
        status: 'active',
        author: { id: 125, nickname: 'TS 專家', photoUrl: null },
        majorCategory: { id: 1, name: '前端開發' },
        subCategory: { id: 12, name: 'TypeScript' },
        tags: [{ id: 6, name: 'TypeScript' }],
        reviewStats: { totalReviews: 0, averageScores: { impact: 0, mindset: 0, problems: 0, perspectives: 0, goals: 0 } },
        createdAt: '2024-01-15T12:00:00.000Z',
        updatedAt: '2024-01-15T12:00:00.000Z'
      },
      timestamp: '2024-01-15T12:00:00.000Z'
    }]
  });

export const updateResourceResponseSchema = apiSuccessResponseSchema(resourceResponseSchema)
  .describe('更新資源的回應');

export const getResourceStatsResponseSchema = apiSuccessResponseSchema(resourceStatsResponseSchema)
  .describe('獲取資源統計的回應')
  .meta({
    title: '獲取資源統計回應',
    examples: [{
      success: true,
      data: {
        totalResources: 150,
        activeResources: 142,
        categoryStats: { '前端開發': 45, '後端開發': 32 },
        typeStats: { 'website': 65, 'video_content': 35 }
      },
      timestamp: '2024-01-15T10:30:00.000Z'
    }]
  });

export const getResourceTagsResponseSchema = apiSuccessResponseSchema(z.array(z.string()))
  .describe('獲取資源標籤的回應')
  .meta({
    title: '獲取資源標籤回應',
    examples: [{
      success: true,
      data: ['JavaScript', 'React', '前端框架'],
      timestamp: '2024-01-15T10:30:00.000Z'
    }]
  });

export const deleteResourceResponseSchema = apiSuccessResponseSchema(z.object({
  message: z.string().describe('刪除成功訊息')
})).describe('刪除資源的回應').meta({
  title: '刪除資源回應',
  examples: [{
    success: true,
    data: { message: '資源已成功刪除' },
    timestamp: '2024-01-15T10:30:00.000Z'
  }]
});

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
