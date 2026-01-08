# Practice API v1 設計文件

## 概述

本文件基於專案 API_GUIDE 規範設計 Practice（實踐）功能的 API。Practice 功能允許使用者建立學習實踐計畫，設定目標並追蹤學習進度，支援簽到記錄和社群互動。實踐可包含相關學習資源，並支援標籤分類管理。

## API 設計原則

- **RESTful 規範**：遵循 REST 架構設計
- **標準化回應格式**：使用統一的成功/錯誤回應結構
- **TypeScript 型別安全**：使用 Zod schema 進行驗證
- **認證機制**：區分公開端點與需認證端點

## API 端點總覽（共 21 個端點）

### Practice 相關端點

| 方法 | 路徑 | 描述 | 需要認證 |
|------|------|------|----------|
| GET | `/api/v1/practices` | 取得實踐列表（支援篩選/分頁） | 否 |
| GET | `/api/v1/practices/:id` | 取得實踐詳情 | 否 |
| POST | `/api/v1/practices` | 建立實踐（可附帶資源） | 是 |
| PATCH | `/api/v1/practices/:id` | 更新實踐 | 是 |
| DELETE | `/api/v1/practices/:id` | 刪除實踐（軟刪除） | 是 |
| POST | `/api/v1/practices/:id/checkin` | 記錄簽到 | 是 |
| GET | `/api/v1/practices/:id/checkins` | 取得簽到記錄 | 否 |
| POST | `/api/v1/practices/:id/reactions` | 對實踐點讚 | 是 |
| DELETE | `/api/v1/practices/:id/reactions` | 取消點讚 | 是 |

### 使用者相關端點

| 方法 | 路徑 | 描述 | 需要認證 |
|------|------|------|----------|
| GET | `/api/v1/me/practices` | 取得我的實踐 | 是 |
| GET | `/api/v1/me/practice-stats` | 取得我的實踐統計 | 是 |

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

### 13. 記錄瀏覽事件

```http
POST /api/v1/events/views
Content-Type: application/json
```

**請求內容**
```json
{
  "entityType": "practice",
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

### 14. 記錄點擊事件

```http
POST /api/v1/events/clicks
Content-Type: application/json
```

**請求內容**
```json
{
  "entityType": "practice",
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

### 15. 記錄分享事件

```http
POST /api/v1/events/shares
Authorization: Bearer {token}
Content-Type: application/json
```

**請求內容**
```json
{
  "entityType": "practice",
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

### 16. 記錄收藏事件

```http
POST /api/v1/events/favorites
Authorization: Bearer {token}
Content-Type: application/json
```

**請求內容**
```json
{
  "entityType": "practice",
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

### 17. 取消收藏事件

```http
DELETE /api/v1/events/favorites
Authorization: Bearer {token}
Content-Type: application/json
```

**請求內容**
```json
{
  "entityType": "practice",
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

### 18. 取得實踐評論

```http
GET /api/v1/comments?targetType=practice&targetId=550e8400-e29b-41d4-a716-446655440000
```

**查詢參數**
- `targetType`: 目標類型（固定為 "practice"）
- `targetId`: 實踐 ID

**成功回應** (200)
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "content": "很棒的學習計畫，我也想試試看！",
      "visibility": "public",
      "parentId": null,
      "user": {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "name": "陳小明",
        "photoUrl": "https://example.com/avatar.jpg"
      },
      "createdAt": "2025-06-22T16:30Z",
      "updatedAt": "2025-06-22T16:30Z",
      "replies": [
        {
          "id": 2,
          "content": "一起加油！",
          "visibility": "public",
          "parentId": 1,
          "user": {
            "id": "770e8400-e29b-41d4-a716-446655440002",
            "name": "作者",
            "photoUrl": "https://example.com/avatar2.jpg"
          },
          "createdAt": "2025-06-22T16:45Z",
          "updatedAt": "2025-06-22T16:45Z",
          "replies": []
        }
      ]
    }
  ]
}
```

### 19. 建立實踐評論

```http
POST /api/v1/comments
Authorization: Bearer {token}
Content-Type: application/json
```

**請求內容**
```json
{
  "targetType": "practice",
  "targetId": "550e8400-e29b-41d4-a716-446655440000",
  "content": "很棒的學習計畫，我也想試試看！",
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
    "content": "很棒的學習計畫，我也想試試看！",
    "visibility": "public",
    "parentId": null,
    "user": {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "陳小明",
      "photoUrl": "https://example.com/avatar.jpg"
    },
    "createdAt": "2025-06-22T16:30Z",
    "updatedAt": "2025-06-22T16:30Z",
    "replies": []
  },
  "message": "評論已建立"
}
```

### 20. 更新實踐評論

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
    "createdAt": "2025-06-22T16:30Z",
    "updatedAt": "2025-06-22T17:00Z",
    "replies": []
  },
  "message": "評論已更新"
}
```

### 21. 刪除實踐評論

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

---

## Zod Schema 定義

### 核心 Schema

```typescript
// src/validators/practice.validators.ts

import { z } from 'zod';

// 基礎枚舉
export const practiceStatusSchema = z.enum(['active', 'paused', 'completed', 'archived']);
export const contentTypeSchema = z.enum(['book', 'video', 'articles', 'podcast', 'course', 'custom']);
export const dailyGoalTypeSchema = z.enum(['time', 'completion']);

// 每日目標 Schema
export const dailyGoalSchema = z.object({
  type: dailyGoalTypeSchema,
  timeMinutes: z.number().min(5).max(240).optional(),
  amount: z.number().min(1).max(100).optional(),
  unit: z.string().max(10).optional()
});

// 實踐資源 Schema (用於創建)
export const practiceResourceInputSchema = z.object({
  name: z.string().min(1, '請輸入資源名稱').max(100, '資源名稱不可超過 100 字'),
  url: z.string().url('請輸入有效的網址').optional().or(z.literal(''))
});

// 實踐資源 Schema (API 回應)
export const practiceResourceSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  url: z.string().optional()
});

// 創建實踐請求 Schema
export const createPracticeSchema = z.object({
  title: z.string().min(1, '請輸入標題').max(100, '標題不可超過 100 字'),
  contentType: contentTypeSchema,
  customContentType: z.string().max(50).optional(),
  totalAmount: z.number().min(1, '總量必須大於 0').max(10000),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '請輸入有效的日期格式').optional(),
  dailyGoal: dailyGoalSchema,
  practiceAction: z.string().max(200, '實踐行動描述不可超過 200 字').optional(),
  tags: z.array(z.string()).max(3, '標籤最多 3 個').default([]),
  resources: z.array(practiceResourceInputSchema).max(5, '資源最多 5 個').optional()
});

// 更新實踐請求 Schema
export const updatePracticeSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  totalAmount: z.number().min(1).max(10000).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dailyGoal: dailyGoalSchema.optional(),
  practiceAction: z.string().max(200).optional(),
  tags: z.array(z.string()).max(3).optional(),
  resources: z.array(practiceResourceInputSchema).max(5).optional()
});

// 簽到記錄 Schema
export const checkInSchema = z.object({
  progress: z.number().min(0.01, '進度必須大於 0'),
  note: z.string().max(500, '筆記不可超過 500 字').optional(),
  mood: z.enum(['awesome', 'happy', 'neutral', 'tired', 'frustrated']).optional(),
  reflectionText: z.string().max(1000, '反思文字不可超過 1000 字').optional(),
  relatedResourceId: z.string().optional(),
  isPublic: z.boolean().default(true),
  tags: z.array(z.string()).max(5, '標籤最多 5 個').default([])
});

// 查詢參數 Schema
export const practiceQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  query: z.string().optional(),
  contentType: z.string().optional(), // 逗號分隔
  tags: z.string().optional(), // 逗號分隔
  userId: z.string().optional(),
  sort: z.enum(['createdAt', 'updatedAt', 'likeCount']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc')
});

export const checkInQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  mood: z.string().optional(),
  include: z.string().optional()
});

// 事件記錄 Schema
export const eventViewSchema = z.object({
  entityType: z.literal('practice'),
  entityId: z.string().min(1),
  duration: z.number().min(0).optional()
});

export const eventClickSchema = z.object({
  entityType: z.literal('practice'),
  entityId: z.string().min(1),
  clickPosition: z.string().optional()
});

export const eventShareSchema = z.object({
  entityType: z.literal('practice'),
  entityId: z.string().min(1),
  shareChannel: z.string().min(1)
});

export const eventFavoriteSchema = z.object({
  entityType: z.literal('practice'),
  entityId: z.string().min(1)
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
```

---

## API 端點詳細說明

### 1. 取得實踐列表

```http
GET /api/v1/practices
```

**查詢參數**
- `page`: 頁碼（預設: 1）
- `limit`: 每頁數量（預設: 20，最大: 100）
- `query`: 關鍵字搜尋
- `contentType`: 內容類型過濾（逗號分隔）
- `tags`: 標籤過濾（逗號分隔）
- `userId`: 特定使用者的實踐
- `sort`: 排序欄位 (createdAt | updatedAt | likeCount)
- `order`: 排序方向 (asc | desc)

**成功回應** (200)
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "學習 TypeScript",
      "contentType": "course",
      "customContentType": null,
      "totalAmount": 40,
      "startDate": "2025-06-01",
      "dailyGoal": {
        "type": "completion",
        "amount": 2,
        "unit": "堂"
      },
      "practiceAction": "學習並練習 TypeScript",
      "tags": ["程式設計", "前端開發", "TypeScript"],
      "user": {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "name": "李小明",
        "photoUrl": "https://example.com/avatar.jpg"
      },
      "likeCount": 12,
      "commentCount": 3,
      "viewCount": 85,
      "shareCount": 2,
      "hasResources": true,
      "resourceCount": 1,
      "isLiked": false,
      "status": "active",
      "currentProgress": 15,
      "streak": 7,
      "lastCheckinDate": "2025-06-22",
      "createdAt": "2025-06-01T10:00Z",
      "updatedAt": "2025-06-22T08:30Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

### 2. 取得實踐詳情

```http
GET /api/v1/practices/:id
```

**路徑參數**
- `id`: 實踐 ID

**查詢參數**
- `include`: 包含的關聯資料 (resources)

**成功回應** (200)
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "學習 TypeScript",
    "contentType": "course",
    "customContentType": null,
    "totalAmount": 40,
    "startDate": "2025-06-01",
    "dailyGoal": {
      "type": "completion",
      "amount": 2,
      "unit": "堂"
    },
    "practiceAction": "學習並練習 TypeScript",
    "tags": ["程式設計", "前端開發", "TypeScript"],
    "user": {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "李小明",
      "photoUrl": "https://example.com/avatar.jpg",
      "role": "學生"
    },
    "likeCount": 12,
    "commentCount": 3,
    "viewCount": 86,
    "shareCount": 2,
    "hasResources": true,
    "resourceCount": 1,
    "isLiked": false,
    "status": "active",
    "currentProgress": 15,
    "streak": 7,
    "lastCheckinDate": "2025-06-22",
    "maxStreak": 10,
    "totalCheckins": 15,
    "resources": [
      {
        "id": "770e8400-e29b-41d4-a716-446655440002",
        "name": "TypeScript 官方文檔",
        "url": "https://www.typescriptlang.org/docs/"
      }
    ],
    "createdAt": "2025-06-01T10:00Z",
    "updatedAt": "2025-06-22T20:30Z"
  }
}
```

**錯誤回應** (404)
```json
{
  "success": false,
  "error": {
    "message": "找不到指定的實踐",
    "code": "PRACTICE_NOT_FOUND"
  }
}
```

### 3. 建立實踐

```http
POST /api/v1/practices
Authorization: Bearer {token}
Content-Type: application/json
```

**請求內容**
```json
{
  "title": "學習彈鋼琴",
  "contentType": "custom",
  "customContentType": "樂器",
  "totalAmount": 100,
  "startDate": "2025-06-22",
  "dailyGoal": {
    "type": "time",
    "timeMinutes": 60
  },
  "practiceAction": "練習鋼琴，掌握基本技巧",
  "tags": ["音樂", "鋼琴", "興趣培養"],
  "resources": [
    {
      "name": "鋼琴初學者指南",
      "url": "https://example.com/piano-guide"
    },
    {
      "name": "古典鋼琴曲集",
      "url": "https://example.com/piano-classics"
    }
  ]
}
```

**成功回應** (201)
```json
{
  "success": true,
  "data": {
    "practice": {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "title": "學習彈鋼琴",
      "contentType": "custom",
      "customContentType": "樂器",
      "totalAmount": 100,
      "startDate": "2025-06-22",
      "dailyGoal": {
        "type": "time",
        "timeMinutes": 60
      },
      "practiceAction": "練習鋼琴，掌握基本技巧",
      "tags": ["音樂", "鋼琴", "興趣培養"],
      "user": {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "name": "李小明"
      },
      "likeCount": 0,
      "commentCount": 0,
      "viewCount": 0,
      "hasResources": true,
      "resourceCount": 2,
      "status": "active",
      "currentProgress": 0,
      "streak": 0,
      "createdAt": "2025-06-22T14:30Z",
      "updatedAt": "2025-06-22T14:30Z"
    },
    "resources": [
      {
        "id": "880e8400-e29b-41d4-a716-446655440003",
        "name": "鋼琴初學者指南",
        "url": "https://example.com/piano-guide"
      },
      {
        "id": "990e8400-e29b-41d4-a716-446655440004",
        "name": "古典鋼琴曲集",
        "url": "https://example.com/piano-classics"
      }
    ]
  },
  "message": "實踐已成功建立"
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
      "title": ["請輸入標題"],
      "totalAmount": ["總量必須大於0"],
      "resources[0].url": ["請輸入有效的網址"]
    }
  }
}
```

### 4. 更新實踐

```http
PATCH /api/v1/practices/:id
Authorization: Bearer {token}
Content-Type: application/json
```

**請求內容**
```json
{
  "title": "學習彈鋼琴（進階）",
  "totalAmount": 120,
  "startDate": "2025-06-22",
  "dailyGoal": {
    "type": "time",
    "timeMinutes": 90
  },
  "practiceAction": "每天練習鋼琴，從基礎到進階技巧的學習",
  "tags": ["音樂", "鋼琴", "興趣培養"]
}
```

**成功回應** (200)
```json
{
  "success": true,
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "title": "學習彈鋼琴（進階）",
    "totalAmount": 120,
    "startDate": "2025-06-22",
    "dailyGoal": {
      "type": "time",
      "timeMinutes": 90
    },
    "practiceAction": "每天練習鋼琴，從基礎到進階技巧的學習",
    "tags": ["音樂", "鋼琴", "興趣培養"],
    "updatedAt": "2025-06-22T15:00Z"
  },
  "message": "實踐已更新"
}
```

### 5. 刪除實踐

```http
DELETE /api/v1/practices/:id
Authorization: Bearer {token}
```

**成功回應** (200)
```json
{
  "success": true,
  "message": "實踐已刪除"
}
```

### 6. 簽到記錄

```http
POST /api/v1/practices/:id/checkin
Authorization: Bearer {token}
Content-Type: application/json
```

**請求內容**
```json
{
  "progress": 1.5,
  "note": "練習了莫札特的小夜曲",
  "mood": "happy",
  "reflectionText": "指法更流暢了，但節奏還需要加強",
  "relatedResourceId": "880e8400-e29b-41d4-a716-446655440003",
  "isPublic": true,
  "tags": ["莫札特", "小夜曲"]
}
```

**成功回應** (201)
```json
{
  "success": true,
  "data": {
    "id": "aa0e8400-e29b-41d4-a716-446655440005",
    "practiceId": "770e8400-e29b-41d4-a716-446655440002",
    "date": "2025-06-23",
    "progress": 1.5,
    "note": "練習了莫札特的小夜曲",
    "mood": "happy",
    "reflectionText": "指法更流暢了，但節奏還需要加強",
    "relatedResourceId": "880e8400-e29b-41d4-a716-446655440003",
    "streakDay": 1,
    "cumulativeProgress": 1.5,
    "isPublic": true,
    "tags": ["莫札特", "小夜曲"],
    "likeCount": 0,
    "commentCount": 0,
    "createdAt": "2025-06-23T19:30Z"
  },
  "message": "簽到成功！開始連續第 1 天"
}
```

### 7. 取得實踐簽到記錄

```http
GET /api/v1/practices/:id/checkins
```

**查詢參數**
- `page`: 頁碼（預設: 1）
- `limit`: 每頁數量（預設: 20，最大: 100）
- `startDate`: 開始日期過濾（YYYY-MM-DD）
- `endDate`: 結束日期過濾（YYYY-MM-DD）
- `mood`: 心情過濾
- `include`: 包含的關聯資料 (interactions,comments)

**成功回應** (200)
```json
{
  "success": true,
  "data": [
    {
      "id": "aa0e8400-e29b-41d4-a716-446655440005",
      "date": "2025-06-23",
      "progress": 1.5,
      "note": "練習了莫札特的小夜曲",
      "mood": "happy",
      "reflectionText": "指法更流暢了，但節奏還需要加強",
      "relatedResource": {
        "id": "880e8400-e29b-41d4-a716-446655440003",
        "name": "鋼琴初學者指南"
      },
      "streakDay": 1,
      "cumulativeProgress": 1.5,
      "isPublic": true,
      "likeCount": 0,
      "commentCount": 0,
      "isLiked": false,
      "createdAt": "2025-06-23T19:30Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

### 8. 實踐點讚

```http
POST /api/v1/practices/:id/reactions
Authorization: Bearer {token}
Content-Type: application/json
```

**請求內容**
```json
{
  "reactionType": "like"
}
```

**成功回應** (200)
```json
{
  "success": true,
  "data": {
    "isLiked": true,
    "likeCount": 13
  },
  "message": "已點讚"
}
```

### 9. 取消點讚

```http
DELETE /api/v1/practices/:id/reactions
Authorization: Bearer {token}
```

**成功回應** (200)
```json
{
  "success": true,
  "data": {
    "isLiked": false,
    "likeCount": 12
  },
  "message": "已取消點讚"
}
```

### 10. 取得我的實踐

```http
GET /api/v1/me/practices
Authorization: Bearer {token}
```

**查詢參數**
- 支援與 `/api/v1/practices` 相同的查詢參數
- `status`: 狀態過濾 (active | paused | completed | archived | all)

**成功回應** (200)
```json
{
  "success": true,
  "data": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "title": "學習彈鋼琴（進階）",
      "contentType": "custom",
      "customContentType": "樂器",
      "totalAmount": 100,
      "currentProgress": 1.5,
      "dailyGoal": {
        "type": "time",
        "timeMinutes": 90
      },
      "status": "active",
      "streak": 1,
      "lastCheckinDate": "2025-06-23",
      "likeCount": 13,
      "commentCount": 3,
      "viewCount": 88,
      "createdAt": "2025-06-22T14:30Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

### 12. 取得我的實踐統計

```http
GET /api/v1/me/practice-stats
Authorization: Bearer {token}
```

**成功回應** (200)
```json
{
  "success": true,
  "data": {
    "total": 5,
    "active": 3,
    "completed": 1,
    "paused": 1,
    "archived": 0,
    "totalCheckIns": 73,
    "longestStreak": 28,
    "currentStreak": 8,
    "totalProgress": 187.5,
    "contentTypeStats": [
      { "type": "book", "count": 1 },
      { "type": "custom", "count": 2 },
      { "type": "course", "count": 1 },
      { "type": "video", "count": 1 }
    ],
    "monthlyCheckins": [
      { "month": "2025-01", "count": 15 },
      { "month": "2025-02", "count": 12 },
      { "month": "2025-03", "count": 18 },
      { "month": "2025-04", "count": 10 },
      { "month": "2025-05", "count": 12 },
      { "month": "2025-06", "count": 6 }
    ]
  }
}
```


---

## 型別定義（TypeScript）

### 核心型別

```typescript
// src/types/practice.types.ts

export interface PracticeEntity {
  id: string;
  title: string;
  contentType: ContentType;
  customContentType?: string;
  totalAmount: number;
  startDate?: string;
  dailyGoal: DailyGoal;
  practiceAction?: string;
  tags: string[];
  user: UserBasicInfo;
  likeCount: number;
  commentCount: number;
  viewCount: number;
  hasResources: boolean;
  resourceCount: number;
  isLiked?: boolean;
  status: PracticeStatus;
  currentProgress: number;
  streak: number;
  lastCheckinDate?: string;
  maxStreak?: number;
  totalCheckins?: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface UserBasicInfo {
  id: string;
  name: string;
  photoUrl?: string;
  role?: string;
}

export type ContentType = 'book' | 'video' | 'articles' | 'podcast' | 'course' | 'custom';
export type PracticeStatus = 'active' | 'paused' | 'completed' | 'archived';
export type DailyGoalType = 'time' | 'completion';

export interface DailyGoal {
  type: DailyGoalType;
  timeMinutes?: number;
  amount?: number;
  unit?: string;
}

export interface PracticeResource {
  id: string;
  name: string;
  url?: string;
}

export interface CheckInEntity {
  id: string;
  practiceId: string;
  date: string;
  progress: number;
  note?: string;
  mood?: 'awesome' | 'happy' | 'neutral' | 'tired' | 'frustrated';
  reflectionText?: string;
  relatedResourceId?: string;
  relatedResource?: {
    id: string;
    name: string;
  };
  streakDay: number;
  cumulativeProgress: number;
  isPublic: boolean;
  tags: string[];
  likeCount: number;
  commentCount: number;
  isLiked?: boolean;
  createdAt: string;
}

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

// 統計相關型別
export interface PracticeStats {
  total: number;
  active: number;
  completed: number;
  paused: number;
  archived: number;
  totalCheckIns: number;
  longestStreak: number;
  currentStreak: number;
  totalProgress: number;
  contentTypeStats: Array<{
    type: ContentType;
    count: number;
  }>;
  monthlyCheckins: Array<{
    month: string;
    count: number;
  }>;
}

```

---

## 實作建議

### 1. 服務層架構

```typescript
// src/services/practices/index.ts
export * from './core/api';
export * from './core/schema';

// src/services/practices/core/api.ts
import { fetcher, mutations } from '@/utils/http';
import type { 
  CreatePracticeRequest, 
  UpdatePracticeRequest, 
  CheckInRequest,
  PracticeEntity,
  CheckInEntity,
  PracticeQueryParams
} from './schema';

export const practiceAPI = {
  // 查詢
  list: (params?: PracticeQueryParams) => 
    fetcher<ApiResponse<PracticeEntity[]>>('/api/v1/practices', { params }),
  
  get: (id: string, include?: string) => 
    fetcher<ApiResponse<PracticeEntity>>(`/api/v1/practices/${id}`, { 
      params: include ? { include } : undefined 
    }),
  
  getMyPractices: (params?: PracticeQueryParams) => 
    fetcher<ApiResponse<PracticeEntity[]>>('/api/v1/me/practices', { params }),
  
  getStats: () => 
    fetcher<ApiResponse<PracticeStats>>('/api/v1/me/practice-stats'),
  
  getCheckins: (practiceId: string, params?: CheckInQueryParams) => 
    fetcher<ApiResponse<CheckInEntity[]>>(`/api/v1/practices/${practiceId}/checkins`, { params }),
  
  // 變更
  create: mutations.post<
    ApiResponse<{ practice: PracticeEntity; resources?: PracticeResource[] }>, 
    CreatePracticeRequest
  >('/api/v1/practices'),
  
  update: (id: string, data: UpdatePracticeRequest) => 
    mutations.patch<ApiResponse<PracticeEntity>, UpdatePracticeRequest>(`/api/v1/practices/${id}`, data),
  
  delete: (id: string) => 
    mutations.delete<ApiResponse<void>>(`/api/v1/practices/${id}`),
  
  // 簽到
  checkIn: (id: string, data: CheckInRequest) => 
    mutations.post<ApiResponse<CheckInEntity>, CheckInRequest>(`/api/v1/practices/${id}/checkin`, data),
  
  // 互動
  like: (id: string, reactionType?: string) => 
    mutations.post<ApiResponse<{ isLiked: boolean; likeCount: number }>>(`/api/v1/practices/${id}/reactions`, { reactionType }),
  
  unlike: (id: string) => 
    mutations.delete<ApiResponse<{ isLiked: boolean; likeCount: number }>>(`/api/v1/practices/${id}/reactions`),
  
};
```

### 2. 控制器實作範例

```typescript
// src/controllers/practice.controller.ts
import { Request, Response } from 'express';
import { createPracticeSchema, updatePracticeSchema, practiceQuerySchema } from '@/validators/practice.validators';

export const createPracticeController = (service: PracticeService) => ({
  async list(req: Request, res: Response) {
    try {
      const params = practiceQuerySchema.parse(req.query);
      const result = await service.findAll(params);
      
      res.json({
        success: true,
        data: result.practices,
        pagination: result.pagination
      });
    } catch (error) {
      handleError(res, error);
    }
  },
  
  async create(req: Request, res: Response) {
    try {
      const data = createPracticeSchema.parse(req.body);
      const userId = req.user!.id;
      
      const result = await service.create(userId, data);
      
      res.status(201).json({
        success: true,
        data: result,
        message: '實踐已成功建立'
      });
    } catch (error) {
      handleError(res, error);
    }
  },
  
  async checkIn(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = checkInSchema.parse(req.body);
      const userId = req.user!.id;
      
      const result = await service.createCheckIn(id, userId, data);
      
      res.status(201).json({
        success: true,
        data: result,
        message: `簽到成功！開始連續第 ${result.streakDay} 天`
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

#### practices 表（實踐主表）
```sql
CREATE TABLE "practices" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "user_id" UUID NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "content_type" VARCHAR(20) NOT NULL 
        CHECK ("content_type" IN ('book', 'video', 'articles', 'podcast', 'course', 'custom')),
    "custom_content_type" VARCHAR(50),
    "total_amount" INT NOT NULL CHECK ("total_amount" > 0),
    "current_progress" DECIMAL(10,2) DEFAULT 0,
    "start_date" DATE,
    "daily_goal_type" VARCHAR(20) NOT NULL 
        CHECK ("daily_goal_type" IN ('time', 'completion')),
    "daily_goal_time_minutes" INT CHECK ("daily_goal_time_minutes" BETWEEN 5 AND 240),
    "daily_goal_amount" INT CHECK ("daily_goal_amount" BETWEEN 1 AND 100),
    "daily_goal_unit" VARCHAR(10),
    "practice_action" TEXT,
    "status" VARCHAR(20) DEFAULT 'active' 
        CHECK ("status" IN ('active', 'paused', 'completed', 'archived')),
    "like_count" INT DEFAULT 0,
    "comment_count" INT DEFAULT 0,
    "view_count" INT DEFAULT 0,
    "has_resources" BOOLEAN DEFAULT FALSE,
    "resource_count" INT DEFAULT 0,
    "streak" INT DEFAULT 0,
    "max_streak" INT DEFAULT 0,
    "last_checkin_date" DATE,
    "total_checkins" INT DEFAULT 0,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ DEFAULT NULL,
    "deleted_at" TIMESTAMPTZ DEFAULT NULL,
    "version" INT DEFAULT 1,
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

-- 索引
CREATE INDEX "idx_practices_user_id" ON "practices"("user_id");
CREATE INDEX "idx_practices_status" ON "practices"("status");
CREATE INDEX "idx_practices_content_type" ON "practices"("content_type");
CREATE INDEX "idx_practices_created_at" ON "practices"("created_at");
CREATE INDEX "idx_practices_like_count" ON "practices"("like_count");
CREATE INDEX "idx_practices_deleted_at" ON "practices"("deleted_at") WHERE "deleted_at" IS NULL;

-- 全文搜尋索引（PostgreSQL）
CREATE INDEX "idx_practices_title_fulltext" 
ON "practices" USING GIN(to_tsvector('chinese', "title"));
```

#### practice_checkins 表（簽到記錄）
```sql
CREATE TABLE "practice_checkins" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "practice_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "checkin_date" DATE NOT NULL,
    "progress_amount" DECIMAL(10,2) NOT NULL CHECK ("progress_amount" > 0),
    "note" TEXT,
    "mood" VARCHAR(20) CHECK ("mood" IN ('awesome', 'happy', 'neutral', 'tired', 'frustrated')),
    "reflection_text" TEXT,
    "related_resource_id" UUID,
    "streak_day" INT DEFAULT 1,
    "cumulative_progress" DECIMAL(10,2) NOT NULL,
    "is_public" BOOLEAN DEFAULT TRUE,
    "like_count" INT DEFAULT 0,
    "comment_count" INT DEFAULT 0,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ DEFAULT NULL,
    FOREIGN KEY ("practice_id") REFERENCES "practices"("id") ON DELETE CASCADE,
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
    UNIQUE ("practice_id", "checkin_date")
);

-- 索引
CREATE INDEX "idx_practice_checkins_practice_id" ON "practice_checkins"("practice_id");
CREATE INDEX "idx_practice_checkins_user_id" ON "practice_checkins"("user_id");
CREATE INDEX "idx_practice_checkins_date" ON "practice_checkins"("checkin_date");
CREATE INDEX "idx_practice_checkins_mood" ON "practice_checkins"("mood");
```

#### practice_resources 表（實踐資源）
```sql
CREATE TABLE "practice_resources" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "practice_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "url" VARCHAR(1000),
    "order_index" INT DEFAULT 0,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ DEFAULT NULL,
    FOREIGN KEY ("practice_id") REFERENCES "practices"("id") ON DELETE CASCADE
);

-- 索引
CREATE INDEX "idx_practice_resources_practice_id" ON "practice_resources"("practice_id");
```

### 2. 標籤系統（使用現有表）

#### 使用現有的 entity_tags 表
```sql
-- entity_tags 表已存在，支援 'practice' 作為 entity_type
-- CREATE TABLE entity_tags (
--     id SERIAL PRIMARY KEY,
--     entity_type VARCHAR(50) NOT NULL 
--         CHECK (entity_type IN ('resource', 'idea', 'project', 'practice', 'circle', 'user')),
--     entity_id UUID NOT NULL,
--     tag_id INT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
--     created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMPTZ DEFAULT NULL,
--     created_by UUID REFERENCES users(id) ON DELETE SET NULL,
--     UNIQUE(entity_type, entity_id, tag_id)
-- );

-- 創建實踐標籤時：
-- INSERT INTO entity_tags (entity_type, entity_id, tag_id, created_by)
-- VALUES ('practice', :practice_id, :tag_id, :user_id);
```

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

### 3. 互動系統（使用現有表）

#### 使用現有的 reaction 表（點讚記錄）
```sql
-- 使用現有的通用 reaction 表，支援 'practice' 作為 target_type
-- 對實踐點讚的操作：
-- INSERT INTO reaction (user_id, target_type, target_id, reaction_type)
-- VALUES (:user_id, 'practice', :practice_id, 'like');
```

#### 使用現有的 view 表（瀏覽記錄）
```sql
-- 使用現有的通用 view 表，支援 'practice' 作為 target_type
-- 記錄實踐瀏覽的操作：
-- INSERT INTO view (user_id, target_type, target_id)
-- VALUES (:user_id, 'practice', :practice_id)
-- ON CONFLICT (user_id, target_type, target_id) 
-- DO UPDATE SET updated_at = CURRENT_TIMESTAMP;
```

### 4. 統計數據更新策略

#### 實踐進度更新
```sql
-- 簽到時更新實踐進度
BEGIN;
INSERT INTO practice_checkins (practice_id, user_id, checkin_date, progress_amount, cumulative_progress)
VALUES (:practice_id, :user_id, :date, :progress, :cumulative_progress);
UPDATE practices 
SET current_progress = :cumulative_progress,
    total_checkins = total_checkins + 1,
    last_checkin_date = :date,
    streak = :new_streak,
    max_streak = GREATEST(max_streak, :new_streak),
    updated_at = CURRENT_TIMESTAMP
WHERE id = :practice_id;
COMMIT;
```

#### 點讚數更新
```sql
-- 新增點讚時
BEGIN;
INSERT INTO reaction (user_id, target_type, target_id, reaction_type)
VALUES (:user_id, 'practice', :practice_id, 'like');
UPDATE practices SET like_count = like_count + 1 WHERE id = :practice_id;
COMMIT;

-- 取消點讚時
BEGIN;
DELETE FROM reaction 
WHERE user_id = :user_id AND target_type = 'practice' AND target_id = :practice_id AND reaction_type = 'like';
UPDATE practices SET like_count = GREATEST(like_count - 1, 0) WHERE id = :practice_id;
COMMIT;
```

### 5. 查詢優化建議

#### 實踐列表查詢
```sql
-- 查詢實踐列表，包含標籤和使用者資訊
SELECT 
    p.*,
    u.nickname as user_name,
    u.external_id as user_external_id,
    u.photo_url as user_photo_url,
    array_agg(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL) as tag_names,
    CASE WHEN r.user_id IS NOT NULL THEN TRUE ELSE FALSE END as is_liked
FROM practices p
JOIN users u ON p.user_id = u.id
LEFT JOIN entity_tags et ON et.entity_type = 'practice' AND et.entity_id = p.id
LEFT JOIN tags t ON et.tag_id = t.id
LEFT JOIN reaction r ON r.target_type = 'practice' AND r.target_id = p.id 
    AND r.user_id = :current_user_id AND r.reaction_type = 'like'
WHERE p.status = 'active' 
    AND p.deleted_at IS NULL
GROUP BY p.id, u.id, u.nickname, u.external_id, u.photo_url, r.user_id
ORDER BY p.created_at DESC
LIMIT :limit OFFSET :offset;
```

#### 簽到統計查詢
```sql
-- 查詢用戶簽到統計
SELECT 
    COUNT(*) as total_checkins,
    SUM(progress_amount) as total_progress,
    DATE_TRUNC('month', checkin_date) as month,
    COUNT(*) as monthly_count
FROM practice_checkins 
WHERE user_id = :user_id 
GROUP BY DATE_TRUNC('month', checkin_date)
ORDER BY month DESC;
```

---

## 整合要點

1. **認證中介軟體**：使用現有的 JWT 認證機制
2. **限流保護**：遵循全域 1000 req/min 限制
3. **錯誤處理**：統一使用標準化錯誤回應格式
4. **Swagger 文件**：建立對應的 Swagger schema 文件
5. **測試覆蓋**：撰寫單元測試和整合測試

## 擴展考量

1. **評論系統**：預留 `commentCount` 欄位，未來可擴展評論功能
2. **分享功能**：預留分享統計，未來可整合社群分享
3. **進度追蹤**：支援多種進度計算方式（時間/完成量）
4. **版本控制**：包含 `version` 欄位，支援樂觀鎖定
5. **資源整合**：與現有資源系統整合，支援學習資源關聯
6. **通知系統**：預留通知機制，支援簽到提醒和目標達成通知