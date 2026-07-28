import { z } from 'zod';
import { registry } from '../config/openapi-registry';
import {
  apiSuccessResponseSchema,
  paginatedApiResponseSchema
} from './api-response.validators';

// 基礎枚舉
export const ideaStatusSchema = z.enum(['active', 'draft', 'archived'])
  .openapi({
    description: '想法的狀態類型：active (已發布的活躍想法)、draft (草稿狀態的想法)、archived (已歸檔的想法)',
    example: 'active',
    examples: ['active', 'draft', 'archived']
  });

// 想法資源 Schema
export const ideaResourceSchema = z.object({
  name: z.string().min(1, '請輸入資源名稱').max(255, '資源名稱不能超過255字符')
    .openapi({
      description: '資源的顯示名稱',
      example: 'React 官方文檔',
      examples: ['React 官方文檔', 'Vue.js 學習指南', 'JavaScript 高級教程']
    }),
  url: z.string().url('請輸入有效的網址').refine(
    (url) => url.startsWith('https://'),
    'URL 必須以 https:// 開頭'
  )
    .openapi({
      description: '資源的完整網址連結（必須使用 https）',
      example: 'https://reactjs.org/docs',
      examples: ['https://reactjs.org/docs', 'https://vuejs.org/guide', 'https://developer.mozilla.org/en-US/docs/Web/JavaScript'],
      format: 'uri'
    }),
  description: z.string().optional()
    .openapi({
      description: '資源的詳細描述或說明',
      example: '官方文檔，包含完整的API參考',
      examples: ['官方文檔，包含完整的API參考', '適合初學者的學習指南', '深入探討高級概念的教程']
    }),
}).openapi('IdeaResource', {
  description: '想法相關的學習資源資訊'
});

// 創建想法請求 Schema
export const createIdeaSchema = z.object({
  content: z.string().min(1, '請輸入內容').max(5000, '內容不能超過5000字')
    .openapi({
      description: '想法的主要內容描述',
      example: '我想要開發一個幫助學習者追蹤進度的應用程式',
      examples: [
        '我想要開發一個幫助學習者追蹤進度的應用程式',
        '建立一個開源的程式碼分享平台，讓開發者能夠互相學習',
        '設計一個AI輔助的學習路徑規劃系統'
      ],
      minLength: 1,
      maxLength: 5000
    }),
  tags: z.array(z.string().min(1).max(50)).max(10, '標籤最多10個').default([])
    .openapi({
      description: '與想法相關的標籤列表（最多 10 個）',
      example: ['前端', 'React', '學習'],
      examples: [
        ['前端', 'React', '學習'],
        ['開源', '社群', '程式碼分享'],
        ['AI', '學習路徑', '教育科技']
      ]
    }),
  resources: z.array(ideaResourceSchema).max(5, '資源最多5個').optional()
    .openapi({
      description: '與想法相關的學習資源清單（最多 5 個）',
      example: [{
        name: 'React 官方文檔',
        url: 'https://reactjs.org/docs',
        description: '官方文檔，包含完整的API參考'
      }]
    }),
}).openapi('CreateIdeaRequest', {
  description: '創建新想法的請求資料'
});

// 更新想法請求 Schema
export const updateIdeaSchema = z.object({
  content: z.string().min(1, '請輸入內容').max(5000, '內容不能超過5000字').optional()
    .openapi({
      description: '更新後的想法內容',
      example: '更新：增加了使用者介面的設計考量',
      examples: [
        '更新：增加了使用者介面的設計考量',
        '修正：加入了資料庫設計的部分'
      ],
      minLength: 1,
      maxLength: 5000
    }),
  tags: z.array(z.string().min(1).max(50)).max(10, '標籤最多10個').optional()
    .openapi({
      description: '更新後的標籤列表（最多 10 個）',
      example: ['前端', 'React', '學習', 'UI設計'],
      examples: [
        ['前端', 'React', '學習', 'UI設計'],
        ['後端', '資料庫', 'API']
      ]
    }),
  resources: z.array(ideaResourceSchema).max(5, '資源最多5個').optional()
    .openapi({
      description: '更新後的相關資源清單（最多 5 個）',
      example: [{
        name: 'UI設計規範',
        url: 'https://material.io/design',
        description: 'Google Material Design 規範'
      }]
    }),
  status: ideaStatusSchema.optional()
    .openapi({
      description: '更新後的想法狀態',
      example: 'active'
    }),
}).openapi('UpdateIdeaRequest', {
  description: '更新現有想法的請求資料'
});

// 查詢參數 Schema
export const ideaQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1)
    .openapi({
      description: '分頁頁碼，從 1 開始',
      example: 1,
      examples: [1, 2, 5]
    }),
  limit: z.coerce.number().min(1).max(100).default(20)
    .openapi({
      description: '每頁顯示的想法數量（1-100）',
      example: 20,
      examples: [10, 20, 50]
    }),
  query: z.string().optional()
    .openapi({
      description: '搜尋關鍵詞，用於內容搜尋',
      example: 'React',
      examples: ['React', '學習', '開源專案']
    }),
  tags: z.string().optional()
    .openapi({
      description: '標籤篩選條件，多個標籤用逗號分隔',
      example: '前端,React',
      examples: ['前端,React', '學習,教育', '開源']
    }),
  userId: z.string().optional()
    .openapi({
      description: '篩選特定使用者的想法',
      example: '123e4567-e89b-12d3-a456-426614174000',
      examples: ['123e4567-e89b-12d3-a456-426614174000', 'user123']
    }),
  status: z.enum(['active', 'draft', 'archived', 'all']).optional()
    .openapi({
      description: '想法狀態篩選：active (僅顯示活躍想法)、draft (僅顯示草稿想法)、archived (僅顯示歸檔想法)、all (顯示所有狀態)',
      example: 'active',
      examples: ['active', 'draft', 'archived', 'all']
    }),
  sort: z.enum(['createdAt', 'updatedAt', 'likeCount']).default('createdAt')
    .openapi({
      description: '排序欄位：createdAt (按創建時間)、updatedAt (按更新時間)、likeCount (按點讚數)',
      example: 'createdAt',
      examples: ['createdAt', 'updatedAt', 'likeCount']
    }),
  order: z.enum(['asc', 'desc']).default('desc')
    .openapi({
      description: '排序方向：asc (升序)、desc (降序)',
      example: 'desc',
      examples: ['asc', 'desc']
    }),
}).openapi('IdeaQueryParams', {
  description: '想法列表查詢參數'
});

// 事件記錄 Schema
export const eventViewSchema = z.object({
  entityType: z.literal('idea')
    .openapi({
      description: '事件目標類型，固定為想法',
      example: 'idea'
    }),
  entityId: z.string().uuid('請提供有效的想法ID')
    .openapi({
      description: '被查看的想法唯一識別 ID',
      example: '123e4567-e89b-12d3-a456-426614174000',
      format: 'uuid'
    }),
  duration: z.number().min(0).optional()
    .openapi({
      description: '查看持續時間（秒）',
      example: 120,
      examples: [30, 120, 300]
    }),
}).openapi('EventViewRequest', {
  description: '想法查看事件記錄'
});

export const eventClickSchema = z.object({
  entityType: z.literal('idea')
    .openapi({
      description: '事件目標類型，固定為想法',
      example: 'idea'
    }),
  entityId: z.string().uuid('請提供有效的想法ID')
    .openapi({
      description: '被點擊的想法唯一識別 ID',
      example: '123e4567-e89b-12d3-a456-426614174000',
      format: 'uuid'
    }),
  clickPosition: z.string().optional()
    .openapi({
      description: '點擊位置的描述或座標',
      example: 'title',
      examples: ['title', 'content', 'tags', '200,150']
    }),
}).openapi('EventClickRequest', {
  description: '想法點擊事件記錄'
});

export const eventShareSchema = z.object({
  entityType: z.literal('idea')
    .openapi({
      description: '事件目標類型，固定為想法',
      example: 'idea'
    }),
  entityId: z.string().uuid('請提供有效的想法ID')
    .openapi({
      description: '被分享的想法唯一識別 ID',
      example: '123e4567-e89b-12d3-a456-426614174000',
      format: 'uuid'
    }),
  shareChannel: z.string().min(1, '請指定分享渠道')
    .openapi({
      description: '分享的平台或渠道',
      example: 'twitter',
      examples: ['facebook', 'twitter', 'linkedin', 'email', 'copy_link']
    }),
}).openapi('EventShareRequest', {
  description: '想法分享事件記錄'
});

export const eventFavoriteSchema = z.object({
  entityType: z.literal('idea')
    .openapi({
      description: '事件目標類型，固定為想法',
      example: 'idea'
    }),
  entityId: z.string().uuid('請提供有效的想法ID')
    .openapi({
      description: '被收藏的想法唯一識別 ID',
      example: '123e4567-e89b-12d3-a456-426614174000',
      format: 'uuid'
    }),
}).openapi('EventFavoriteRequest', {
  description: '想法收藏事件記錄'
});

// 路徑參數 Schema
export const ideaParamsSchema = z.object({
  id: z.string().uuid('請提供有效的想法ID')
    .openapi({
      description: '想法的唯一識別 ID',
      example: '123e4567-e89b-12d3-a456-426614174000',
      format: 'uuid',
      param: {
        name: 'id',
        in: 'path'
      }
    }),
}).openapi('IdeaParams', {
  description: '包含想法 ID 的路徑參數'
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
    .openapi({
      description: '想法的唯一識別 ID',
      example: '123e4567-e89b-12d3-a456-426614174000',
      format: 'uuid'
    }),
  content: z.string()
    .openapi({
      description: '想法的主要內容',
      example: '我想要開發一個幫助學習者追蹤進度的應用程式'
    }),
  tags: z.array(z.string())
    .openapi({
      description: '想法的標籤列表',
      example: ['前端', 'React', '學習']
    }),
  resources: z.array(ideaResourceSchema).optional()
    .openapi({
      description: '相關學習資源列表',
      example: [{
        name: 'React 官方文檔',
        url: 'https://reactjs.org/docs',
        description: '官方文檔，包含完整的API參考'
      }]
    }),
  status: ideaStatusSchema
    .openapi({
      description: '想法的當前狀態',
      example: 'active'
    }),
  user: z.object({
    id: z.string().openapi({
      description: '用戶 ID',
      example: '123'
    }),
    name: z.string().openapi({
      description: '用戶名稱',
      example: '王小明'
    }),
    photoURL: z.string().nullable().openapi({
      description: '用戶頭像 URL',
      example: 'https://example.com/avatar.jpg',
      format: 'uri'
    }),
    roleList: z.array(z.string()).optional().openapi({
      description: '用戶角色列表',
      example: ['normal_student', 'educator']
    }),
    educationStage: z.string().nullable().optional().openapi({
      description: '教育階段',
      example: 'university'
    }),
    tagList: z.array(z.string()).optional().openapi({
      description: '用戶標籤列表',
      example: ['程式設計', '前端開發']
    }),
    selfIntroduction: z.string().nullable().optional().openapi({
      description: '自我介紹',
      example: '熱愛程式設計的學習者'
    })
  }).openapi({
    description: '創建者資訊'
  }),
  hasResources: z.boolean().openapi({
    description: '是否有相關資源',
    example: true
  }),
  resourceCount: z.number().int().min(0).openapi({
    description: '資源數量',
    example: 1
  }),
  likeCount: z.number().int().min(0).default(0)
    .openapi({
      description: '點讚數量',
      example: 5,
      examples: [5, 23, 0]
    }),
  commentCount: z.number().int().min(0).default(0)
    .openapi({
      description: '評論數量',
      example: 5,
      examples: [5, 12, 0]
    }),
  viewCount: z.number().int().min(0).default(0)
    .openapi({
      description: '查看次數',
      example: 100,
      examples: [100, 250, 0]
    }),
  shareCount: z.number().int().min(0).default(0)
    .openapi({
      description: '分享次數',
      example: 3,
      examples: [3, 15, 0]
    }),
  isLiked: z.boolean().optional()
    .openapi({
      description: '當前用戶是否已點讚',
      example: false
    }),
  isFavorited: z.boolean().optional()
    .openapi({
      description: '當前用戶是否已收藏',
      example: true
    }),
  createdAt: z.string().datetime()
    .openapi({
      description: '創建時間',
      example: '2024-01-15T10:30:00.000Z',
      format: 'date-time'
    }),
  updatedAt: z.string().datetime()
    .openapi({
      description: '最後更新時間',
      example: '2024-01-15T15:45:00.000Z',
      format: 'date-time'
    }),
}).openapi('IdeaData', {
  description: '想法資料結構'
});

// Response Schemas

/**
 * 單個想法回應 Schema
 */
export const ideaSuccessResponseSchema = apiSuccessResponseSchema(ideaDataSchema)
  .openapi('IdeaSuccessResponse', {
    description: '取得單個想法的成功回應'
  });

/**
 * 想法列表回應 Schema
 */
export const ideasListResponseSchema = paginatedApiResponseSchema(ideaDataSchema)
  .openapi('IdeasListResponse', {
    description: '想法列表的分頁回應'
  });

/**
 * 創建想法回應 Schema
 */
export const createIdeaResponseSchema = apiSuccessResponseSchema(ideaDataSchema)
  .openapi('CreateIdeaResponse', {
    description: '創建想法的成功回應'
  });

/**
 * 更新想法回應 Schema
 */
export const updateIdeaResponseSchema = apiSuccessResponseSchema(ideaDataSchema)
  .openapi('UpdateIdeaResponse', {
    description: '更新想法的成功回應'
  });

/**
 * 刪除想法回應 Schema
 */
export const deleteIdeaResponseSchema = apiSuccessResponseSchema(
  z.object({
    message: z.string().openapi({
      description: '刪除成功訊息',
      example: '想法已刪除'
    })
  })
).openapi('DeleteIdeaResponse', {
  description: '刪除想法的成功回應'
});

/**
 * 記錄想法瀏覽回應 Schema
 */
export const recordIdeaViewResponseSchema = apiSuccessResponseSchema(
  z.object({
    viewCount: z.number().int().min(0).openapi({
      description: '該想法目前的累計瀏覽數',
      example: 42
    })
  })
).openapi('RecordIdeaViewResponse', {
  description: '記錄想法瀏覽的成功回應'
});

// 保留舊的類型名稱以保持向後兼容
export type CreateIdeaRequest = CreateIdeaData;
export type UpdateIdeaRequest = UpdateIdeaData;
export type IdeaParamsRequest = IdeaParams;

// ===================================
// 🎯 註冊 schemas 到 OpenAPI registry
// ===================================

// 註冊可重用的組件
registry.register('IdeaResource', ideaResourceSchema);
registry.register('CreateIdeaRequest', createIdeaSchema);
registry.register('UpdateIdeaRequest', updateIdeaSchema);
registry.register('IdeaQueryParams', ideaQuerySchema);
registry.register('EventViewRequest', eventViewSchema);
registry.register('EventClickRequest', eventClickSchema);
registry.register('EventShareRequest', eventShareSchema);
registry.register('EventFavoriteRequest', eventFavoriteSchema);
registry.register('IdeaParams', ideaParamsSchema);
registry.register('IdeaData', ideaDataSchema);
registry.register('IdeaSuccessResponse', ideaSuccessResponseSchema);
registry.register('IdeasListResponse', ideasListResponseSchema);
registry.register('CreateIdeaResponse', createIdeaResponseSchema);
registry.register('UpdateIdeaResponse', updateIdeaResponseSchema);
registry.register('DeleteIdeaResponse', deleteIdeaResponseSchema);