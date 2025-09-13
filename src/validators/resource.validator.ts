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

// 導出驗證函數
export const validateCreateResource = (data: unknown): CreateResourceSchema => createResourceSchema.parse(data);
export const validateUpdateResource = (data: unknown): UpdateResourceSchema => updateResourceSchema.parse(data);
export const validateUpdateResourceStatus = (data: unknown): UpdateResourceStatusSchema => updateResourceStatusSchema.parse(data);
