import { z } from 'zod';
import {
  apiSuccessResponseSchema,
  paginatedApiResponseSchema
} from './api-response.validators';

// 基礎枚舉
export const ideaStatusSchema = z.enum(['active', 'draft', 'archived'])
  .describe("想法的狀態類型")
  .meta({
    title: "想法狀態",
    examples: ['active', 'draft', 'archived'],
    enumDescriptions: {
      "active": "已發布的活躍想法",
      "draft": "草稿狀態的想法",
      "archived": "已歸檔的想法"
    }
  });

// 想法資源 Schema
export const ideaResourceSchema = z.object({
  name: z.string().min(1, '請輸入資源名稱').max(255, '資源名稱不能超過255字符')
    .describe("資源的顯示名稱")
    .meta({
      title: "資源名稱",
      examples: ["React 官方文檔", "Vue.js 學習指南", "JavaScript 高級教程"]
    }),
  url: z.string().url('請輸入有效的網址').refine(
    (url) => url.startsWith('https://'),
    'URL 必須以 https:// 開頭'
  )
    .describe("資源的完整網址連結")
    .meta({
      title: "資源網址",
      examples: ["https://reactjs.org/docs", "https://vuejs.org/guide", "https://developer.mozilla.org/en-US/docs/Web/JavaScript"]
    }),
  description: z.string().optional()
    .describe("資源的詳細描述或說明")
    .meta({
      title: "資源描述",
      examples: ["官方文檔，包含完整的API參考", "適合初學者的學習指南", "深入探討高級概念的教程"]
    }),
}).describe("想法相關的學習資源資訊").meta({
  title: "想法資源",
  examples: [{
    name: "React 官方文檔",
    url: "https://reactjs.org/docs",
    description: "官方文檔，包含完整的API參考"
  }]
});

// 創建想法請求 Schema
export const createIdeaSchema = z.object({
  content: z.string().min(1, '請輸入內容').max(5000, '內容不能超過5000字')
    .describe("想法的主要內容描述")
    .meta({
      title: "想法內容",
      examples: [
        "我想要開發一個幫助學習者追蹤進度的應用程式",
        "建立一個開源的程式碼分享平台，讓開發者能夠互相學習",
        "設計一個AI輔助的學習路徑規劃系統"
      ]
    }),
  tags: z.array(z.string().min(1).max(50)).max(10, '標籤最多10個').default([])
    .describe("與想法相關的標籤列表")
    .meta({
      title: "想法標籤",
      examples: [
        ["前端", "React", "學習"],
        ["開源", "社群", "程式碼分享"],
        ["AI", "學習路徑", "教育科技"]
      ]
    }),
  resources: z.array(ideaResourceSchema).max(5, '資源最多5個').optional()
    .describe("與想法相關的學習資源清單")
    .meta({
      title: "相關資源",
      examples: [
        [{
          name: "React 官方文檔",
          url: "https://reactjs.org/docs",
          description: "官方文檔，包含完整的API參考"
        }]
      ]
    }),
}).describe("創建新想法的請求資料").meta({
  title: "創建想法",
  examples: [{
    content: "我想要開發一個幫助學習者追蹤進度的應用程式",
    tags: ["前端", "React", "學習"],
    resources: [{
      name: "React 官方文檔",
      url: "https://reactjs.org/docs",
      description: "官方文檔，包含完整的API參考"
    }]
  }]
});

// 更新想法請求 Schema
export const updateIdeaSchema = z.object({
  content: z.string().min(1, '請輸入內容').max(5000, '內容不能超過5000字').optional()
    .describe("更新後的想法內容")
    .meta({
      title: "想法內容",
      examples: [
        "更新：增加了使用者介面的設計考量",
        "修正：加入了資料庫設計的部分"
      ]
    }),
  tags: z.array(z.string().min(1).max(50)).max(10, '標籤最多10個').optional()
    .describe("更新後的標籤列表")
    .meta({
      title: "想法標籤",
      examples: [
        ["前端", "React", "學習", "UI設計"],
        ["後端", "資料庫", "API"]
      ]
    }),
  resources: z.array(ideaResourceSchema).max(5, '資源最多5個').optional()
    .describe("更新後的相關資源清單")
    .meta({
      title: "相關資源",
      examples: [
        [{
          name: "UI設計規範",
          url: "https://material.io/design",
          description: "Google Material Design 規範"
        }]
      ]
    }),
  status: ideaStatusSchema.optional()
    .describe("更新後的想法狀態")
    .meta({
      title: "想法狀態",
      examples: ["active", "draft", "archived"]
    }),
}).describe("更新現有想法的請求資料").meta({
  title: "更新想法",
  examples: [{
    content: "更新：增加了使用者介面的設計考量",
    tags: ["前端", "React", "學習", "UI設計"],
    status: "active"
  }]
});

// 查詢參數 Schema
export const ideaQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1)
    .describe("分頁頁碼，從1開始")
    .meta({
      title: "頁碼",
      examples: [1, 2, 5]
    }),
  limit: z.coerce.number().min(1).max(100).default(20)
    .describe("每頁顯示的想法數量")
    .meta({
      title: "每頁數量",
      examples: [10, 20, 50]
    }),
  query: z.string().optional()
    .describe("搜尋關鍵詞，用於內容搜尋")
    .meta({
      title: "搜尋關鍵詞",
      examples: ["React", "學習", "開源專案"]
    }),
  tags: z.string().optional()
    .describe("標籤篩選條件，多個標籤用逗號分隔")
    .meta({
      title: "標籤篩選",
      examples: ["前端,React", "學習,教育", "開源"]
    }),
  userId: z.string().optional()
    .describe("篩選特定使用者的想法")
    .meta({
      title: "使用者ID",
      examples: ["123e4567-e89b-12d3-a456-426614174000", "user123"]
    }),
  status: z.enum(['active', 'draft', 'archived', 'all']).optional()
    .describe("想法狀態篩選")
    .meta({
      title: "狀態篩選",
      examples: ['active', 'draft', 'archived', 'all'],
      enumDescriptions: {
        "active": "僅顯示活躍想法",
        "draft": "僅顯示草稿想法",
        "archived": "僅顯示歸檔想法",
        "all": "顯示所有狀態的想法"
      }
    }),
  sort: z.enum(['createdAt', 'updatedAt', 'likeCount']).default('createdAt')
    .describe("排序欄位")
    .meta({
      title: "排序方式",
      examples: ['createdAt', 'updatedAt', 'likeCount'],
      enumDescriptions: {
        "createdAt": "按創建時間排序",
        "updatedAt": "按更新時間排序",
        "likeCount": "按點讚數排序"
      }
    }),
  order: z.enum(['asc', 'desc']).default('desc')
    .describe("排序方向")
    .meta({
      title: "排序方向",
      examples: ['asc', 'desc'],
      enumDescriptions: {
        "asc": "升序排列",
        "desc": "降序排列"
      }
    }),
}).describe("想法列表查詢參數").meta({
  title: "想法查詢參數",
  examples: [{
    page: 1,
    limit: 20,
    query: "React",
    tags: "前端,學習",
    status: "active",
    sort: "createdAt",
    order: "desc"
  }]
});

// 事件記錄 Schema
export const eventViewSchema = z.object({
  entityType: z.literal('idea')
    .describe("事件目標類型，固定為想法")
    .meta({
      title: "實體類型",
      examples: ['idea']
    }),
  entityId: z.string().uuid('請提供有效的想法ID')
    .describe("被查看的想法唯一識別ID")
    .meta({
      title: "想法ID",
      examples: ["123e4567-e89b-12d3-a456-426614174000", "987fcdeb-51a2-43d1-b789-123456789abc"]
    }),
  duration: z.number().min(0).optional()
    .describe("查看持續時間（秒）")
    .meta({
      title: "查看時長",
      examples: [30, 120, 300]
    }),
}).describe("想法查看事件記錄").meta({
  title: "查看事件",
  examples: [{
    entityType: "idea",
    entityId: "123e4567-e89b-12d3-a456-426614174000",
    duration: 120
  }]
});

export const eventClickSchema = z.object({
  entityType: z.literal('idea')
    .describe("事件目標類型，固定為想法")
    .meta({
      title: "實體類型",
      examples: ['idea']
    }),
  entityId: z.string().uuid('請提供有效的想法ID')
    .describe("被點擊的想法唯一識別ID")
    .meta({
      title: "想法ID",
      examples: ["123e4567-e89b-12d3-a456-426614174000", "987fcdeb-51a2-43d1-b789-123456789abc"]
    }),
  clickPosition: z.string().optional()
    .describe("點擊位置的描述或座標")
    .meta({
      title: "點擊位置",
      examples: ["title", "content", "tags", "200,150"]
    }),
}).describe("想法點擊事件記錄").meta({
  title: "點擊事件",
  examples: [{
    entityType: "idea",
    entityId: "123e4567-e89b-12d3-a456-426614174000",
    clickPosition: "title"
  }]
});

export const eventShareSchema = z.object({
  entityType: z.literal('idea')
    .describe("事件目標類型，固定為想法")
    .meta({
      title: "實體類型",
      examples: ['idea']
    }),
  entityId: z.string().uuid('請提供有效的想法ID')
    .describe("被分享的想法唯一識別ID")
    .meta({
      title: "想法ID",
      examples: ["123e4567-e89b-12d3-a456-426614174000", "987fcdeb-51a2-43d1-b789-123456789abc"]
    }),
  shareChannel: z.string().min(1, '請指定分享渠道')
    .describe("分享的平台或渠道")
    .meta({
      title: "分享渠道",
      examples: ["facebook", "twitter", "linkedin", "email", "copy_link"]
    }),
}).describe("想法分享事件記錄").meta({
  title: "分享事件",
  examples: [{
    entityType: "idea",
    entityId: "123e4567-e89b-12d3-a456-426614174000",
    shareChannel: "twitter"
  }]
});

export const eventFavoriteSchema = z.object({
  entityType: z.literal('idea')
    .describe("事件目標類型，固定為想法")
    .meta({
      title: "實體類型",
      examples: ['idea']
    }),
  entityId: z.string().uuid('請提供有效的想法ID')
    .describe("被收藏的想法唯一識別ID")
    .meta({
      title: "想法ID",
      examples: ["123e4567-e89b-12d3-a456-426614174000", "987fcdeb-51a2-43d1-b789-123456789abc"]
    }),
}).describe("想法收藏事件記錄").meta({
  title: "收藏事件",
  examples: [{
    entityType: "idea",
    entityId: "123e4567-e89b-12d3-a456-426614174000"
  }]
});

// 路徑參數 Schema
export const ideaParamsSchema = z.object({
  id: z.string().uuid('請提供有效的想法ID')
    .describe("想法的唯一識別ID")
    .meta({
      title: "想法ID",
      examples: ["123e4567-e89b-12d3-a456-426614174000", "987fcdeb-51a2-43d1-b789-123456789abc"]
    }),
}).describe("包含想法ID的路徑參數").meta({
  title: "想法ID路徑參數",
  examples: [{
    id: "123e4567-e89b-12d3-a456-426614174000"
  }]
});

// 型別導出
export type CreateIdeaData = z.infer<typeof createIdeaSchema>;
export type UpdateIdeaData = z.infer<typeof updateIdeaSchema>;
export type IdeaQueryParams = z.infer<typeof ideaQuerySchema>;
export type IdeaParams = z.infer<typeof ideaParamsSchema>;
export type EventViewRequest = z.infer<typeof eventViewSchema>;
export type EventClickRequest = z.infer<typeof eventClickSchema>;
export type EventShareRequest = z.infer<typeof eventShareSchema>;
export type EventFavoriteRequest = z.infer<typeof eventFavoriteSchema>;

// 想法資料格式 Schema (用於回應)
export const ideaDataSchema = z.object({
  id: z.string().uuid()
    .describe("想法的唯一識別ID")
    .meta({
      title: "想法ID",
      examples: ["123e4567-e89b-12d3-a456-426614174000"]
    }),
  content: z.string()
    .describe("想法的主要內容")
    .meta({
      title: "想法內容",
      examples: ["我想要開發一個幫助學習者追蹤進度的應用程式"]
    }),
  tags: z.array(z.string())
    .describe("想法的標籤列表")
    .meta({
      title: "標籤列表",
      examples: [["前端", "React", "學習"]]
    }),
  resources: z.array(ideaResourceSchema).optional()
    .describe("相關學習資源列表")
    .meta({
      title: "相關資源",
      examples: [[{
        name: "React 官方文檔",
        url: "https://reactjs.org/docs",
        description: "官方文檔，包含完整的API參考"
      }]]
    }),
  status: ideaStatusSchema
    .describe("想法的當前狀態")
    .meta({
      title: "想法狀態",
      examples: ["active"]
    }),
  user: z.object({
    id: z.number(),
    _id: z.string(),
    name: z.string(),
    photoURL: z.string().nullable(),
    roleList: z.array(z.string()).optional(),
    educationStage: z.string().nullable().optional(),
    tagList: z.array(z.string()).optional(),
    selfIntroduction: z.string().nullable().optional()
  }).describe("創建者資訊"),
  hasResources: z.boolean().describe("是否有相關資源"),
  resourceCount: z.number().int().min(0).describe("資源數量"),
  likeCount: z.number().int().min(0).default(0)
    .describe("點讚數量")
    .meta({
      title: "點讚數",
      examples: [5, 23, 0]
    }),
  commentCount: z.number().int().min(0).default(0)
    .describe("評論數量")
    .meta({
      title: "評論數",
      examples: [5, 12, 0]
    }),
  viewCount: z.number().int().min(0).default(0)
    .describe("查看次數")
    .meta({
      title: "查看次數",
      examples: [100, 250, 0]
    }),
  shareCount: z.number().int().min(0).default(0)
    .describe("分享次數")
    .meta({
      title: "分享次數",
      examples: [3, 15, 0]
    }),
  isLiked: z.boolean().optional()
    .describe("當前用戶是否已點讚")
    .meta({
      title: "是否已點讚",
      examples: [true, false]
    }),
  isFavorited: z.boolean().optional()
    .describe("當前用戶是否已收藏")
    .meta({
      title: "是否已收藏",
      examples: [true, false]
    }),
  createdAt: z.string().datetime()
    .describe("創建時間")
    .meta({
      title: "創建時間",
      examples: ["2024-01-15T10:30:00.000Z"]
    }),
  updatedAt: z.string().datetime()
    .describe("最後更新時間")
    .meta({
      title: "更新時間",
      examples: ["2024-01-15T15:45:00.000Z"]
    }),
}).describe("想法資料結構").meta({
  title: "想法資料",
  examples: [{
    id: "123e4567-e89b-12d3-a456-426614174000",
    _id: "507f1f77bcf86cd799439011",
    content: "我想要開發一個幫助學習者追蹤進度的應用程式",
    tags: ["前端", "React", "學習"],
    resources: [{
      name: "React 官方文檔",
      url: "https://reactjs.org/docs",
      description: "官方文檔，包含完整的API參考"
    }],
    status: "active",
    userId: 123,
    likeCount: 5,
    viewCount: 100,
    shareCount: 3,
    isLiked: false,
    isFavorited: true,
    createdAt: "2024-01-15T10:30:00.000Z",
    updatedAt: "2024-01-15T15:45:00.000Z"
  }]
});

// Response Schemas

/**
 * 單個想法回應 Schema
 */
export const ideaSuccessResponseSchema = apiSuccessResponseSchema(ideaDataSchema)
  .describe("取得單個想法的成功回應")
  .meta({
    title: "想法詳情回應",
    examples: [{
      success: true,
      data: {
        id: "123e4567-e89b-12d3-a456-426614174000",
        _id: "507f1f77bcf86cd799439011",
        content: "我想要開發一個幫助學習者追蹤進度的應用程式",
        tags: ["前端", "React", "學習"],
        status: "active",
        userId: 123,
        likeCount: 5,
        viewCount: 100,
        shareCount: 3,
        isLiked: false,
        isFavorited: true,
        createdAt: "2024-01-15T10:30:00.000Z",
        updatedAt: "2024-01-15T15:45:00.000Z"
      },
      timestamp: "2024-01-15T10:30:00.000Z"
    }]
  });

/**
 * 想法列表回應 Schema
 */
export const ideasListResponseSchema = paginatedApiResponseSchema(ideaDataSchema)
  .describe("想法列表的分頁回應")
  .meta({
    title: "想法列表回應",
    examples: [{
      success: true,
      data: [{
        id: "123e4567-e89b-12d3-a456-426614174000",
        _id: "507f1f77bcf86cd799439011",
        content: "我想要開發一個幫助學習者追蹤進度的應用程式",
        tags: ["前端", "React", "學習"],
        status: "active",
        userId: 123,
        likeCount: 5,
        viewCount: 100,
        shareCount: 3,
        createdAt: "2024-01-15T10:30:00.000Z",
        updatedAt: "2024-01-15T15:45:00.000Z"
      }],
      pagination: {
        currentPage: 1,
        totalPages: 5,
        totalItems: 50,
        itemsPerPage: 10,
        hasNext: true,
        hasPrev: false
      },
      timestamp: "2024-01-15T10:30:00.000Z"
    }]
  });

/**
 * 創建想法回應 Schema
 */
export const createIdeaResponseSchema = apiSuccessResponseSchema(ideaDataSchema)
.describe("創建想法的成功回應")
.meta({
  title: "創建想法回應",
  examples: [{
    success: true,
    data: {
      id: "123e4567-e89b-12d3-a456-426614174000",
      _id: "507f1f77bcf86cd799439011",
      content: "我想要開發一個幫助學習者追蹤進度的應用程式",
      tags: ["前端", "React", "學習"],
      status: "draft",
      userId: 123,
      likeCount: 0,
      viewCount: 0,
      shareCount: 0,
      createdAt: "2024-01-15T10:30:00.000Z",
      updatedAt: "2024-01-15T10:30:00.000Z"
    },
    timestamp: "2024-01-15T10:30:00.000Z"
  }]
});

/**
 * 更新想法回應 Schema
 */
export const updateIdeaResponseSchema = apiSuccessResponseSchema(ideaDataSchema)
  .describe("更新想法的成功回應")
  .meta({
    title: "更新想法回應",
    examples: [{
      success: true,
      data: {
        id: "123e4567-e89b-12d3-a456-426614174000",
        _id: "507f1f77bcf86cd799439011",
        content: "更新：增加了使用者介面的設計考量",
        tags: ["前端", "React", "學習", "UI設計"],
        status: "active",
        userId: 123,
        likeCount: 8,
        viewCount: 150,
        shareCount: 5,
        createdAt: "2024-01-15T10:30:00.000Z",
        updatedAt: "2024-01-15T16:45:00.000Z"
      },
      timestamp: "2024-01-15T16:45:00.000Z"
    }]
  });

/**
 * 刪除想法回應 Schema
 */
export const deleteIdeaResponseSchema = apiSuccessResponseSchema(
  z.object({
    message: z.string().describe("刪除成功訊息")
  })
).describe("刪除想法的成功回應")
.meta({
  title: "刪除想法回應",
  examples: [{
    success: true,
    data: {
      message: "想法已刪除"
    },
    timestamp: "2024-01-15T10:30:00.000Z"
  }]
});

// 保留舊的類型名稱以保持向後兼容
export type CreateIdeaRequest = CreateIdeaData;
export type UpdateIdeaRequest = UpdateIdeaData;
export type IdeaParamsRequest = IdeaParams;