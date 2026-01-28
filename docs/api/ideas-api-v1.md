# Ideas API v1 設計文件

## 概述

本文件基於專案 API_GUIDE 規範設計 Ideas（想法）功能的 API。Ideas 功能允許使用者分享學習心得、創意想法，並可附帶相關資源。所有內容都是公開的，從 Ideas 創建的資源初始為草稿狀態。

## API 設計原則

- **RESTful 規範**：遵循 REST 架構設計
- **標準化回應格式**：使用統一的成功/錯誤回應結構
- **TypeScript 型別安全**：使用 Zod schema 進行驗證
- **認證機制**：區分公開端點與需認證端點

## API 端點總覽

### Ideas 相關端點

| 方法 | 路徑 | 描述 | 需要認證 |
|------|------|------|----------|
| GET | `/api/v1/ideas` | 取得想法列表（支援篩選/分頁） | 否 |
| GET | `/api/v1/ideas/:id` | 取得想法詳情 | 否 |
| POST | `/api/v1/ideas` | 建立想法（可附帶資源） | 是 |
| PATCH | `/api/v1/ideas/:id` | 更新想法 | 是 |
| DELETE | `/api/v1/ideas/:id` | 刪除想法（軟刪除） | 是 |
| GET | `/api/v1/ideas/:id/resources` | 取得想法關聯的資源 | 否 |
| POST | `/api/v1/ideas/:id/reactions` | 對想法點讚 | 是 |
| DELETE | `/api/v1/ideas/:id/reactions` | 取消點讚 | 是 |

### 使用者相關端點

| 方法 | 路徑 | 描述 | 需要認證 |
|------|------|------|----------|
| GET | `/api/v1/me/ideas` | 取得我的想法 | 是 |
| GET | `/api/v1/me/resources?status=draft` | 取得我的資源草稿 | 是 |

### 評論相關端點

| 方法 | 路徑 | 描述 | 需要認證 |
|------|------|------|----------|
| GET | `/api/v1/comments` | 取得評論列表（需指定 targetType 和 targetId） | 否 |
| POST | `/api/v1/comments` | 建立評論 | 是 |
| PUT | `/api/v1/comments/:id` | 更新評論 | 是 |
| DELETE | `/api/v1/comments/:id` | 刪除評論 | 是 |

### 事件記錄端點

| 方法 | 路徑 | 描述 | 需要認證 |
|------|------|------|----------|
| POST | `/api/v1/events/views` | 記錄瀏覽事件 | 否 |
| POST | `/api/v1/events/clicks` | 記錄點擊事件 | 否 |
| POST | `/api/v1/events/shares` | 記錄分享事件 | 是 |
| POST | `/api/v1/events/favorites` | 記錄收藏事件 | 是 |
| DELETE | `/api/v1/events/favorites` | 取消收藏事件 | 是 |


---

## 標準化回應格式

### 成功回應

```typescript
// 單筆資料
{
  success: true,
  data: T,
  message?: string
}

// 列表資料
{
  success: true,
  data: T[],
  message?: string,
  pagination: {
    page: number,
    limit: number,
    total: number,
    totalPages: number
  }
}
```

### 錯誤回應

```typescript
{
  success: false,
  error: {
    message: string,
    code?: string,
    details?: unknown
  }
}
```

---

## Zod Schema 定義

### 核心 Schema

```typescript
// src/validators/idea.validators.ts

import { z } from 'zod';

// 基礎枚舉
export const ideaStatusSchema = z.enum(['active', 'draft', 'archived']);

// 想法資源 Schema
export const ideaResourceSchema = z.object({
  name: z.string().min(1, '請輸入資源名稱').max(255),
  url: z.string().url('請輸入有效的網址').startsWith('https://', 'URL 必須以 https:// 開頭'),
  description: z.string().optional()
});

// 創建想法請求 Schema
export const createIdeaSchema = z.object({
  content: z.string().min(1, '請輸入內容').max(5000, '內容不能超過5000字'),
  tags: z.array(z.string()).max(10, '標籤最多10個').default([]),
  resources: z.array(ideaResourceSchema).max(5, '資源最多5個').optional()
});

// 更新想法請求 Schema
export const updateIdeaSchema = z.object({
  content: z.string().min(1).max(5000).optional(),
  tags: z.array(z.string()).max(10).optional(),
  status: ideaStatusSchema.optional()
});

// 查詢參數 Schema
export const ideaQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  query: z.string().optional(),
  tags: z.string().optional(), // 逗號分隔
  userId: z.string().optional(),
  sort: z.enum(['createdAt', 'updatedAt', 'likeCount']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc')
});

// 事件記錄 Schema
export const eventViewSchema = z.object({
  entityType: z.literal('idea'),
  entityId: z.string().min(1),
  duration: z.number().min(0).optional()
});

export const eventClickSchema = z.object({
  entityType: z.literal('idea'),
  entityId: z.string().min(1),
  clickPosition: z.string().optional()
});

export const eventShareSchema = z.object({
  entityType: z.literal('idea'),
  entityId: z.string().min(1),
  shareChannel: z.string().min(1)
});

export const eventFavoriteSchema = z.object({
  entityType: z.literal('idea'),
  entityId: z.string().min(1)
});

// 評論功能使用現有的 Comments 服務，不需要額外的事件 Schema

// 型別導出
export type CreateIdeaRequest = z.infer<typeof createIdeaSchema>;
export type UpdateIdeaRequest = z.infer<typeof updateIdeaSchema>;
export type IdeaQueryParams = z.infer<typeof ideaQuerySchema>;
export type EventViewRequest = z.infer<typeof eventViewSchema>;
export type EventClickRequest = z.infer<typeof eventClickSchema>;
export type EventShareRequest = z.infer<typeof eventShareSchema>;
export type EventFavoriteRequest = z.infer<typeof eventFavoriteSchema>;
```

---

## API 端點詳細說明

### 1. 取得想法列表

```http
GET /api/v1/ideas
```

**查詢參數**
- `page`: 頁碼（預設: 1）
- `limit`: 每頁數量（預設: 20，最大: 100）
- `query`: 關鍵字搜尋
- `tags`: 標籤過濾（逗號分隔）
- `userId`: 特定使用者的想法
- `sort`: 排序欄位 (createdAt | updatedAt | likeCount)
- `order`: 排序方向 (asc | desc)

**成功回應** (200)
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "content": "今天學習了 React Hooks 的進階用法...",
      "user": {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "name": "陳小明",
        "photoUrl": "https://example.com/avatar.jpg"
      },
      "tags": ["React", "前端開發", "學習心得"],
      "likeCount": 15,
      "commentCount": 3,
      "viewCount": 120,
      "shareCount": 2,
      "hasResources": true,
      "resourceCount": 2,
      "isLiked": false,
      "status": "active",
      "createdAt": "2024-06-21T10:00Z",
      "updatedAt": "2024-06-21T10:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### 2. 取得想法詳情

```http
GET /api/v1/ideas/:id
```

**路徑參數**
- `id`: 想法 ID

**成功回應** (200)
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "content": "今天學習了 React Hooks 的進階用法，特別是 useCallback 和 useMemo 的使用時機。發現在處理大量資料時，適當使用這些 hooks 可以顯著提升效能。",
    "user": {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "陳小明",
      "photoUrl": "https://example.com/avatar.jpg",
      "role": "學生"
    },
    "tags": ["React", "前端開發", "學習心得", "效能優化"],
    "likeCount": 15,
    "commentCount": 3,
    "viewCount": 121,
    "shareCount": 2,
    "hasResources": true,
    "resourceCount": 2,
    "isLiked": false,
    "status": "active",
    "createdAt": "2024-06-21T10:00Z",
    "updatedAt": "2024-06-21T10:00Z"
  }
}
```

**錯誤回應** (404)
```json
{
  "success": false,
  "error": {
    "message": "找不到指定的想法",
    "code": "IDEA_NOT_FOUND"
  }
}
```

### 3. 建立想法

```http
POST /api/v1/ideas
Authorization: Bearer {token}
Content-Type: application/json
```

**請求內容**
```json
{
  "content": "今天學習了 TypeScript 的泛型，發現它能讓程式碼更有彈性和重用性。",
  "tags": ["TypeScript", "前端開發", "學習筆記"],
  "resources": [
    {
      "name": "TypeScript 官方文檔 - Generics",
      "url": "https://www.typescriptlang.org/docs/handbook/2/generics.html",
      "description": "TypeScript 泛型的官方說明文檔"
    },
    {
      "name": "TypeScript Deep Dive",
      "url": "https://basarat.gitbook.io/typescript/type-system/generics"
    }
  ]
}
```

**成功回應** (201)
```json
{
  "success": true,
  "data": {
    "idea": {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "content": "今天學習了 TypeScript 的泛型，發現它能讓程式碼更有彈性和重用性。",
      "user": {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "name": "陳小明"
      },
      "tags": ["TypeScript", "前端開發", "學習筆記"],
      "likeCount": 0,
      "commentCount": 0,
      "viewCount": 0,
      "shareCount": 0,
      "hasResources": true,
      "resourceCount": 2,
      "status": "active",
      "createdAt": "2024-06-22T14:30Z",
      "updatedAt": "2024-06-22T14:30Z"
    },
    "resources": [
      {
        "id": "880e8400-e29b-41d4-a716-446655440003",
        "name": "TypeScript 官方文檔 - Generics",
        "url": "https://www.typescriptlang.org/docs/handbook/2/generics.html",
        "description": "TypeScript 泛型的官方說明文檔",
        "status": "draft",
        "createdFromType": "idea",
        "createdFromId": "770e8400-e29b-41d4-a716-446655440002"
      },
      {
        "id": "990e8400-e29b-41d4-a716-446655440004",
        "name": "TypeScript Deep Dive",
        "url": "https://basarat.gitbook.io/typescript/type-system/generics",
        "description": "",
        "status": "draft",
        "createdFromType": "idea",
        "createdFromId": "770e8400-e29b-41d4-a716-446655440002"
      }
    ]
  },
  "message": "想法已成功建立"
}
```

**驗證錯誤** (400)
```json
{
  "success": false,
  "error": {
    "message": "請求資料驗證失敗",
    "code": "VALIDATION_ERROR",
    "details": {
      "content": ["請輸入內容"],
      "resources[0].url": ["URL 必須以 https:// 開頭"]
    }
  }
}
```

### 4. 更新想法

```http
PATCH /api/v1/ideas/:id
Authorization: Bearer {token}
Content-Type: application/json
```

**請求內容**
```json
{
  "content": "今天學習了 TypeScript 的泛型，發現它能讓程式碼更有彈性和重用性。補充：泛型在 React 組件中也很實用！",
  "tags": ["TypeScript", "前端開發", "學習筆記", "React"]
}
```

**成功回應** (200)
```json
{
  "success": true,
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "content": "今天學習了 TypeScript 的泛型，發現它能讓程式碼更有彈性和重用性。補充：泛型在 React 組件中也很實用！",
    "tags": ["TypeScript", "前端開發", "學習筆記", "React"],
    "updatedAt": "2024-06-22T15:00Z"
  },
  "message": "想法已更新"
}
```

### 5. 刪除想法

```http
DELETE /api/v1/ideas/:id
Authorization: Bearer {token}
```

**成功回應** (200)
```json
{
  "success": true,
  "message": "想法已刪除"
}
```

### 6. 取得想法關聯的資源

```http
GET /api/v1/ideas/:id/resources
```

**成功回應** (200)
```json
{
  "success": true,
  "data": [
    {
      "id": "880e8400-e29b-41d4-a716-446655440003",
      "name": "TypeScript 官方文檔 - Generics",
      "url": "https://www.typescriptlang.org/docs/handbook/2/generics.html",
      "description": "TypeScript 泛型的官方說明文檔，包含基礎概念和進階用法",
      "type": "learning_platform_app",
      "cost": "free",
      "level": "all_levels",
      "status": "active",
      "majorCategory": "技術",
      "subCategory": "程式語言",
      "relationshipType": "reference",
      "createdAt": "2024-06-22T14:30Z",
      "publishedAt": "2024-06-23T10:00Z"
    }
  ]
}
```

### 7. 點讚想法

```http
POST /api/v1/ideas/:id/reactions
Authorization: Bearer {token}
```

**成功回應** (200)
```json
{
  "success": true,
  "data": {
    "isLiked": true,
    "likeCount": 16
  },
  "message": "已點讚"
}
```

### 8. 取消點讚

```http
DELETE /api/v1/ideas/:id/reactions
Authorization: Bearer {token}
```

**成功回應** (200)
```json
{
  "success": true,
  "data": {
    "isLiked": false,
    "likeCount": 15
  },
  "message": "已取消點讚"
}
```

### 9. 取得我的想法

```http
GET /api/v1/me/ideas
Authorization: Bearer {token}
```

**查詢參數**
- 支援與 `/api/v1/ideas` 相同的查詢參數
- `status`: 狀態過濾 (active | draft | archived | all)

**成功回應** (200)
```json
{
  "success": true,
  "data": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "content": "今天學習了 TypeScript 的泛型...",
      "tags": ["TypeScript", "前端開發"],
      "likeCount": 5,
      "viewCount": 30,
      "hasResources": true,
      "resourceCount": 2,
      "status": "active",
      "createdAt": "2024-06-22T14:30Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "totalPages": 1
  }
}
```

### 10. 記錄瀏覽事件

```http
POST /api/v1/events/views
Content-Type: application/json
```

**請求內容**
```json
{
  "entityType": "idea",
  "entityId": "550e8400-e29b-41d4-a716-446655440000",
  "duration": 45
}
```

**成功回應** (200)
```json
{
  "success": true,
  "message": "瀏覽事件已記錄"
}
```

### 11. 記錄點擊事件

```http
POST /api/v1/events/clicks
Content-Type: application/json
```

**請求內容**
```json
{
  "entityType": "idea",
  "entityId": "550e8400-e29b-41d4-a716-446655440000",
  "clickPosition": "title"
}
```

**成功回應** (200)
```json
{
  "success": true,
  "message": "點擊事件已記錄"
}
```

### 12. 記錄分享事件

```http
POST /api/v1/events/shares
Authorization: Bearer {token}
Content-Type: application/json
```

**請求內容**
```json
{
  "entityType": "idea",
  "entityId": "550e8400-e29b-41d4-a716-446655440000",
  "shareChannel": "facebook"
}
```

**成功回應** (200)
```json
{
  "success": true,
  "message": "分享事件已記錄"
}
```

### 13. 記錄收藏事件

```http
POST /api/v1/events/favorites
Authorization: Bearer {token}
Content-Type: application/json
```

**請求內容**
```json
{
  "entityType": "idea",
  "entityId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**成功回應** (200)
```json
{
  "success": true,
  "data": {
    "isFavorited": true
  },
  "message": "已收藏"
}
```

### 14. 取消收藏事件

```http
DELETE /api/v1/events/favorites
Authorization: Bearer {token}
Content-Type: application/json
```

**請求內容**
```json
{
  "entityType": "idea",
  "entityId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**成功回應** (200)
```json
{
  "success": true,
  "data": {
    "isFavorited": false
  },
  "message": "已取消收藏"
}
```

### 15. 取得想法評論

```http
GET /api/v1/comments?targetType=idea&targetId=123
```

**查詢參數**
- `targetType`: 目標類型（固定為 "idea"）
- `targetId`: 想法 ID

**成功回應** (200)
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "content": "很有幫助的分享，謝謝！",
      "visibility": "public",
      "parentId": null,
      "user": {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "name": "陳小明",
        "photoUrl": "https://example.com/avatar.jpg"
      },
      "createdAt": "2024-06-22T16:30Z",
      "updatedAt": "2024-06-22T16:30Z",
      "replies": [
        {
          "id": 2,
          "content": "不客氣！",
          "visibility": "public",
          "parentId": 1,
          "user": {
            "id": "770e8400-e29b-41d4-a716-446655440002",
            "name": "作者",
            "photoUrl": "https://example.com/avatar2.jpg"
          },
          "createdAt": "2024-06-22T16:45Z",
          "updatedAt": "2024-06-22T16:45Z",
          "replies": []
        }
      ]
    }
  ]
}
```

### 16. 建立想法評論

```http
POST /api/v1/comments
Authorization: Bearer {token}
Content-Type: application/json
```

**請求內容**
```json
{
  "targetType": "idea",
  "targetId": 123,
  "content": "很有幫助的分享，謝謝！",
  "visibility": "public",
  "parentId": null
}
```

**成功回應** (201)
```json
{
  "success": true,
  "data": {
    "id": 1,
    "content": "很有幫助的分享，謝謝！",
    "visibility": "public",
    "parentId": null,
    "user": {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "陳小明",
      "photoUrl": "https://example.com/avatar.jpg"
    },
    "createdAt": "2024-06-22T16:30Z",
    "updatedAt": "2024-06-22T16:30Z",
    "replies": []
  },
  "message": "評論已建立"
}
```

### 17. 更新想法評論

```http
PUT /api/v1/comments/1
Authorization: Bearer {token}
Content-Type: application/json
```

**請求內容**
```json
{
  "id": 1,
  "content": "更新後的評論內容",
  "visibility": "public"
}
```

**成功回應** (200)
```json
{
  "success": true,
  "data": {
    "id": 1,
    "content": "更新後的評論內容",
    "visibility": "public",
    "parentId": null,
    "user": {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "陳小明",
      "photoUrl": "https://example.com/avatar.jpg"
    },
    "createdAt": "2024-06-22T16:30Z",
    "updatedAt": "2024-06-22T17:00Z",
    "replies": []
  },
  "message": "評論已更新"
}
```

### 18. 刪除想法評論

```http
DELETE /api/v1/comments/1
Authorization: Bearer {token}
```

**成功回應** (200)
```json
{
  "success": true,
  "message": "評論已刪除"
}
```

**評論功能整合說明**

評論功能使用現有的統一 Comments 服務，可透過以下方式整合：

```typescript
// 使用現有的 Comments 服務
import { useComments } from '@/services/comments/hooks';
import { CommentSection } from '@/shared/components/Comment/CommentSection';

// 在 Ideas 詳情頁面中
function IdeaDetailPage({ ideaId }: { ideaId: string }) {
  return (
    <div>
      {/* 想法內容 */}
      <CommentSection 
        targetType="Idea" 
        targetId={ideaId}
      />
    </div>
  );
}
```

---

## 型別定義（TypeScript）

### 核心型別

```typescript
// src/types/idea.types.ts

export interface IdeaEntity {
  id: string; // UUID 格式
  content: string;
  user: UserBasicInfo;
  tags: string[];
  likeCount: number;
  commentCount: number;
  viewCount: number;
  shareCount: number;
  hasResources: boolean;
  resourceCount: number;
  isLiked?: boolean;
  isFavorited?: boolean;
  status: IdeaStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface UserBasicInfo {
  id: string; // UUID 格式
  name: string;
  photoUrl?: string;
  role?: string;
}

export type IdeaStatus = 'active' | 'draft' | 'archived';

export interface IdeaResource {
  id: string; // UUID 格式
  name: string;
  url: string;
  description?: string;
  status: ResourceStatus;
  createdFromType?: 'idea';
  createdFromId?: string;
}

export type ResourceStatus = 'draft' | 'active' | 'archived';

// API 回應型別
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
  pagination?: PaginationInfo;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// 事件相關型別
export interface EventResponse {
  success: boolean;
  message: string;
  data?: any;
}

// 評論相關型別（基於現有 Comments 服務）
export interface CommentEntity {
  id: number;
  content: string;
  visibility: 'public' | 'private';
  parentId: number | null;
  user: UserBasicInfo;
  createdAt: string;
  updatedAt: string;
  replies: CommentEntity[];
}

export interface CreateCommentRequest {
  targetType: 'idea';
  targetId: number;
  content: string;
  visibility: 'public' | 'private';
  parentId?: number | null;
}

export interface UpdateCommentRequest {
  id: number;
  content: string;
  visibility: 'public' | 'private';
}
```

---

## 實作建議

### 1. 服務層架構

```typescript
// src/services/ideas/index.ts
export * from './core/api';
export * from './core/schema';

// src/services/ideas/core/api.ts
import { fetcher, mutations } from '@/utils/http';
import type { CreateIdeaRequest, UpdateIdeaRequest, IdeaEntity } from './schema';

export const ideaAPI = {
  // 查詢
  list: (params?: IdeaQueryParams) => 
    fetcher<ApiResponse<IdeaEntity[]>>('/api/v1/ideas', { params }),
  
  get: (id: string) => 
    fetcher<ApiResponse<IdeaEntity>>(`/api/v1/ideas/${id}`),
  
  // 變更
  create: mutations.post<ApiResponse<{ idea: IdeaEntity; resources?: IdeaResource[] }>, CreateIdeaRequest>,
  update: mutations.patch<ApiResponse<IdeaEntity>, UpdateIdeaRequest>,
  delete: mutations.delete<ApiResponse<void>>,
  
  // 互動
  like: (id: string) => 
    mutations.post<ApiResponse<{ isLiked: boolean; likeCount: number }>>(`/api/v1/ideas/${id}/reactions`),
  unlike: (id: string) => 
    mutations.delete<ApiResponse<{ isLiked: boolean; likeCount: number }>>(`/api/v1/ideas/${id}/reactions`),
};

// 事件記錄 API
export const eventAPI = {
  // 瀏覽事件
  recordView: (data: EventViewRequest) =>
    mutations.post<EventResponse, EventViewRequest>('/api/v1/events/views', data),
  
  // 點擊事件
  recordClick: (data: EventClickRequest) =>
    mutations.post<EventResponse, EventClickRequest>('/api/v1/events/clicks', data),
  
  // 分享事件
  recordShare: (data: EventShareRequest) =>
    mutations.post<EventResponse, EventShareRequest>('/api/v1/events/shares', data),
  
  // 收藏事件
  recordFavorite: (data: EventFavoriteRequest) =>
    mutations.post<ApiResponse<{ isFavorited: boolean }>, EventFavoriteRequest>('/api/v1/events/favorites', data),
  
  removeFavorite: (data: EventFavoriteRequest) =>
    mutations.delete<ApiResponse<{ isFavorited: boolean }>, EventFavoriteRequest>('/api/v1/events/favorites', data),
  
};

// 評論 API（基於現有 Comments 服務）
export const commentAPI = {
  // 查詢
  list: (targetType: 'idea', targetId: number) => 
    fetcher<ApiResponse<CommentEntity[]>>('/api/v1/comments', { 
      params: { targetType, targetId } 
    }),
  
  // 變更
  create: (data: CreateCommentRequest) =>
    mutations.post<ApiResponse<CommentEntity>, CreateCommentRequest>('/api/v1/comments', data),
  
  update: (id: number, data: Omit<UpdateCommentRequest, 'id'>) =>
    mutations.put<ApiResponse<CommentEntity>, Omit<UpdateCommentRequest, 'id'>>(`/api/v1/comments/${id}`, data),
  
  delete: (id: number) =>
    mutations.delete<ApiResponse<void>>(`/api/v1/comments/${id}`),
};
```

### 2. 控制器實作範例

```typescript
// src/controllers/idea.controller.ts
import { Request, Response } from 'express';
import { createIdeaSchema, updateIdeaSchema, ideaQuerySchema } from '@/validators/idea.validators';

export const createIdeaController = (service: IdeaService) => ({
  async list(req: Request, res: Response) {
    try {
      const params = ideaQuerySchema.parse(req.query);
      const result = await service.findAll(params);
      
      res.json({
        success: true,
        data: result.ideas,
        pagination: result.pagination
      });
    } catch (error) {
      handleError(res, error);
    }
  },
  
  async create(req: Request, res: Response) {
    try {
      const data = createIdeaSchema.parse(req.body);
      const userId = req.user!.id;
      
      const result = await service.create(userId, data);
      
      res.status(201).json({
        success: true,
        data: result,
        message: '想法已成功建立'
      });
    } catch (error) {
      handleError(res, error);
    }
  }
  
  // 其他方法...
});
```

---

## 資料庫設計

### 1. 主要資料表

#### ideas 表（想法主表）
```sql
CREATE TABLE "ideas" (
    "id" SERIAL PRIMARY KEY,
    "external_id" UUID DEFAULT gen_random_uuid() UNIQUE,
    "user_id" INT NOT NULL,
    "content" TEXT NOT NULL,
    "status" VARCHAR(20) DEFAULT 'active' 
        CHECK ("status" IN ('active', 'draft', 'archived')),
    "like_count" INT DEFAULT 0,
    "comment_count" INT DEFAULT 0,
    "view_count" INT DEFAULT 0,
    "share_count" INT DEFAULT 0,
    "has_resources" BOOLEAN DEFAULT FALSE,
    "resource_count" INT DEFAULT 0,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ DEFAULT NULL,
    "deleted_at" TIMESTAMPTZ DEFAULT NULL,
    "version" INT DEFAULT 1,
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

-- 索引
CREATE INDEX "idx_ideas_user_id" ON "ideas"("user_id");
CREATE INDEX "idx_ideas_status" ON "ideas"("status");
CREATE INDEX "idx_ideas_created_at" ON "ideas"("created_at");
CREATE INDEX "idx_ideas_like_count" ON "ideas"("like_count");
CREATE INDEX "idx_ideas_deleted_at" ON "ideas"("deleted_at") WHERE "deleted_at" IS NULL;

-- 全文搜尋索引（PostgreSQL）
CREATE INDEX "idx_ideas_content_fulltext" 
ON "ideas" USING GIN(to_tsvector('chinese', "content"));
```

#### 使用現有的 reaction 表（點讚記錄）
```sql
-- 使用現有的通用 reaction 表，支援 'idea' 作為 target_type
-- CREATE TABLE "reaction" (
--     "id" SERIAL PRIMARY KEY,
--     "user_id" INT NOT NULL,
--     "target_type" VARCHAR(20) NOT NULL 
--         CHECK ("target_type" IN ('project','post', 'resource','note','outcome','review', 'circle', 'idea','portfolio')),
--     "target_id" INT NOT NULL,
--     "reaction_type" reaction_type NOT NULL,
--     "weight" INT DEFAULT 1,
--     "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     UNIQUE ("user_id", "target_type", "target_id", "reaction_type"),
--     FOREIGN KEY ("user_id") REFERENCES "users"("id")
-- );

-- 對想法點讚的操作：
-- INSERT INTO reaction (user_id, target_type, target_id, reaction_type)
-- VALUES (:user_id, 'idea', :idea_id, 'like');
```

#### 使用現有的 view 表（瀏覽記錄）
```sql
-- 使用現有的通用 view 表，支援 'idea' 作為 target_type
-- CREATE TABLE "view" (
--     "id" SERIAL PRIMARY KEY,
--     "user_id" INT NOT NULL,
--     "target_type" VARCHAR(20) NOT NULL 
--         CHECK ("target_type" IN ('project','post', 'resource','note','outcome','review', 'circle', 'idea','portfolio')),
--     "target_id" INT NOT NULL,
--     "duration" INT,  -- 停留時間（秒）
--     "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     FOREIGN KEY ("user_id") REFERENCES "users"("id"),
--     UNIQUE ("user_id", "target_type", "target_id")
-- );

-- 記錄想法瀏覽的操作：
-- INSERT INTO view (user_id, target_type, target_id, duration)
-- VALUES (:user_id, 'idea', :idea_id, :duration)
-- ON CONFLICT (user_id, target_type, target_id) 
-- DO UPDATE SET updated_at = CURRENT_TIMESTAMP, duration = :duration;
```

### 2. 資源關聯（使用現有資源表）

#### 使用現有的 resources 表
```sql
-- 創建想法時建立的資源將直接儲存在 resources 表中
-- 並透過 entity_tags 表建立關聯，或在 resources 表中增加關聯欄位
-- CREATE TABLE resources (
--     id SERIAL PRIMARY KEY,
--     external_id UUID DEFAULT gen_random_uuid() UNIQUE,
--     created_by INT NOT NULL,
--     major_category_id INT REFERENCES categories(id),
--     sub_category_id INT REFERENCES categories(id),
--     name VARCHAR(255) NOT NULL,
--     url VARCHAR(1000) NOT NULL,
--     image_url VARCHAR(1000),
--     description TEXT NOT NULL,
--     video_url VARCHAR(1000),
--     type VARCHAR(100) NOT NULL,
--     cost VARCHAR(50) NOT NULL,
--     level VARCHAR(50) NOT NULL DEFAULT 'all_levels',
--     status VARCHAR(20) DEFAULT 'active',
--     created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMPTZ DEFAULT NULL,
--     deleted_at TIMESTAMPTZ DEFAULT NULL,
--     FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
-- );

-- 為支援想法資源關聯，可考慮在 resources 表增加欄位：
-- created_from_type VARCHAR(50), -- 'idea', 'manual' 等
-- created_from_id INT -- 關聯的想法 ID
```

### 3. 標籤系統（使用現有表）

#### 使用現有的 tags 表
```sql
-- tags 表已存在於專案中
-- CREATE TABLE "tags" (
--     "id" SERIAL PRIMARY KEY,
--     "name" VARCHAR(100) NOT NULL UNIQUE,
--     "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
--     "updated_at" TIMESTAMPTZ DEFAULT NULL
-- );
```

#### 使用現有的 entity_tags 表
```sql
-- entity_tags 表已存在，支援多種實體類型，包含 'idea'
-- CREATE TABLE entity_tags (
--     id SERIAL PRIMARY KEY,
--     entity_type VARCHAR(50) NOT NULL 
--         CHECK (entity_type IN ('resource', 'idea', 'project', 'practice', 'circle', 'user')),
--     entity_id INT NOT NULL,
--     tag_id INT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
--     created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMPTZ DEFAULT NULL,
--     created_by INT REFERENCES users(id) ON DELETE SET NULL,
--     UNIQUE(entity_type, entity_id, tag_id)
-- );

-- 創建想法標籤時：
-- INSERT INTO entity_tags (entity_type, entity_id, tag_id, created_by)
-- VALUES ('idea', :idea_id, :tag_id, :user_id);
```

### 4. 統計數據更新策略

由於不使用觸發器與函數，統計數據將由應用層負責更新：

#### 點讚數更新
```sql
-- 新增點讚時
BEGIN;
INSERT INTO reaction (user_id, target_type, target_id, reaction_type)
VALUES (:user_id, 'idea', :idea_id, 'like');
UPDATE ideas SET like_count = like_count + 1 WHERE id = :idea_id;
COMMIT;

-- 取消點讚時
BEGIN;
DELETE FROM reaction 
WHERE user_id = :user_id AND target_type = 'idea' AND target_id = :idea_id AND reaction_type = 'like';
UPDATE ideas SET like_count = GREATEST(like_count - 1, 0) WHERE id = :idea_id;
COMMIT;
```

#### 瀏覽數更新
```sql
-- 記錄瀏覽並更新統計
BEGIN;
INSERT INTO view (user_id, target_type, target_id)
VALUES (:user_id, 'idea', :idea_id)
ON CONFLICT (user_id, target_type, target_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;
UPDATE ideas SET view_count = view_count + 1 WHERE id = :idea_id;
COMMIT;
```

### 5. 查詢優化建議

#### 熱門想法查詢（不使用物化視圖）
```sql
-- 直接查詢熱門想法，利用現有索引
SELECT 
    i.*,
    u.nickname as user_nickname,
    u.external_id as user_external_id,
    array_agg(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL) as tag_names
FROM ideas i
JOIN users u ON i.user_id = u.id
LEFT JOIN entity_tags et ON et.entity_type = 'idea' AND et.entity_id = i.id
LEFT JOIN tags t ON et.tag_id = t.id
WHERE i.status = 'active' 
    AND i.deleted_at IS NULL
GROUP BY i.id, u.id, u.nickname, u.external_id
ORDER BY i.like_count DESC, i.created_at DESC
LIMIT 20 OFFSET :offset;
```

#### 快取策略建議
- 使用 Redis 快取熱門想法列表
- 快取使用者點讚狀態
- 定期更新統計數據

### 6. 資料完整性保證

#### 應用層完整性檢查
由於不使用資料庫觸發器，完整性檢查將由應用層負責：

```typescript
// 建立標籤關聯前檢查想法是否存在
async function createIdeaTag(ideaId: number, tagId: number, userId: number) {
  // 檢查想法是否存在且未刪除
  const idea = await db.query(
    'SELECT id FROM ideas WHERE id = $1 AND deleted_at IS NULL',
    [ideaId]
  );
  
  if (!idea.rows.length) {
    throw new Error('Idea not found or has been deleted');
  }
  
  // 建立標籤關聯
  await db.query(
    'INSERT INTO entity_tags (entity_type, entity_id, tag_id, created_by) VALUES ($1, $2, $3, $4)',
    ['idea', ideaId, tagId, userId]
  );
}
```

### 7. 效能優化建議

1. **索引策略**：
   - 充分利用現有索引
   - 針對常用查詢條件建立複合索引
   - 定期分析查詢效能

2. **快取策略**：
   - 使用 Redis 快取熱門想法列表
   - 快取使用者點讚狀態
   - 快取標籤統計資料

3. **批次處理**：
   - 瀏覽記錄可延遲批次寫入
   - 統計數據可定期批次更新
   - 使用佇列系統處理非即時更新

4. **查詢優化**：
   - 使用 EXPLAIN ANALYZE 分析慢查詢
   - 避免 N+1 查詢問題
   - 適當使用 JOIN 而非多次查詢

---

## 整合要點

1. **認證中介軟體**：使用現有的 JWT 認證機制
2. **限流保護**：遵循全域 1000 req/min 限制
3. **錯誤處理**：統一使用標準化錯誤回應格式
4. **Swagger 文件**：建立對應的 Swagger schema 文件
5. **測試覆蓋**：撰寫單元測試和整合測試

## 擴展考量

1. **評論系統**：預留 `commentCount` 欄位，未來可擴展評論功能
2. **分享功能**：預留 `shareCount` 欄位，未來可整合社群分享
3. **草稿管理**：支援 `draft` 狀態，可實作草稿自動儲存
4. **版本控制**：包含 `version` 欄位，支援樂觀鎖定
