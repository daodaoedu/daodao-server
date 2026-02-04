# 學習資源收集系統 - 前端 API 對接指南

## 概述

此系統用於從 YouTube、GitHub、Threads 等平台收集學習相關內容，經過 AI/關鍵字分類後，由管理員審核轉換為正式學習資源。

## 資料流程

```
收集來源 → 抓取內容 → AI/關鍵字分類 → 人工審核 → 轉換為資源
   ↓           ↓            ↓             ↓           ↓
 sources   collected    classified    approved    resources
           contents                   /rejected
```

## 狀態說明

| 狀態 | 說明 | 下一步動作 |
|------|------|-----------|
| `pending` | 剛抓取，待分類 | 執行分類 |
| `classified` | 已分類，待審核 | 人工審核 |
| `approved` | 已核准，待轉換 | 自動轉換 |
| `rejected` | 已拒絕 | 結束 |
| `converted` | 已轉換為資源 | 結束 |

---

## API 端點

### Base URL
```
/api/v1/collection
```

### 認證
所有端點需要 JWT Token（管理員權限）
```
Authorization: Bearer <token>
```

---

## 1. 收集來源管理

### 1.1 取得來源列表

```http
GET /sources
```

**Query 參數：**
| 參數 | 類型 | 預設 | 說明 |
|------|------|------|------|
| page | number | 1 | 頁碼 |
| limit | number | 20 | 每頁數量 (最大 100) |
| platform | string | - | 篩選平台: youtube, github, threads |
| sourceType | string | - | 篩選類型: channel, playlist, keyword, topic, user |
| isActive | boolean | - | 篩選啟用狀態 |

**回應範例：**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "uuid-1",
        "platform": "youtube",
        "sourceType": "channel",
        "sourceValue": "UCxxxxxx",
        "sourceName": "程式教學頻道",
        "description": "優質程式教學",
        "isActive": true,
        "fetchInterval": 3600,
        "lastFetchedAt": "2024-01-15T10:00:00Z",
        "fetchCount": 25,
        "errorCount": 0,
        "lastError": null,
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-15T10:00:00Z"
      }
    ],
    "total": 15
  },
  "timestamp": "2024-01-15T12:00:00Z"
}
```

### 1.2 建立收集來源

```http
POST /sources
```

**Request Body：**
```json
{
  "platform": "youtube",
  "sourceType": "channel",
  "sourceValue": "UCxxxxxx",
  "sourceName": "程式教學頻道",
  "description": "優質的程式教學內容",
  "isActive": true,
  "fetchInterval": 3600
}
```

**平台與來源類型對應：**
| 平台 | 支援的來源類型 | sourceValue 範例 |
|------|---------------|-----------------|
| youtube | channel | UCxxxxxx (頻道 ID) |
| youtube | playlist | PLxxxxxx (播放清單 ID) |
| youtube | keyword | "react tutorial" |
| github | topic | "machine-learning" |
| github | user | "facebook" |
| github | keyword | "awesome react" |
| threads | user | "username" |
| threads | hashtag | "#programming" |

### 1.3 更新收集來源

```http
PATCH /sources/:id
```

**Request Body：**
```json
{
  "sourceName": "新名稱",
  "isActive": false,
  "fetchInterval": 7200
}
```

### 1.4 刪除收集來源

```http
DELETE /sources/:id
```

---

## 2. 收集內容管理

### 2.1 取得內容列表

```http
GET /contents
```

**Query 參數：**
| 參數 | 類型 | 預設 | 說明 |
|------|------|------|------|
| page | number | 1 | 頁碼 |
| limit | number | 20 | 每頁數量 |
| platform | string | - | 篩選平台 |
| status | string | - | 篩選狀態: pending, classified, approved, rejected, converted |
| isLearningContent | boolean | - | 篩選是否為學習內容 |
| sourceId | string | - | 篩選來源 ID |
| minConfidence | number | - | 最低信心分數 (0-1) |
| sortBy | string | createdAt | 排序欄位: createdAt, publishedAt, engagementCount, confidenceScore |
| sortOrder | string | desc | 排序方向: asc, desc |

**回應範例：**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "uuid-content-1",
        "sourceId": "uuid-source-1",
        "platform": "youtube",
        "platformContentId": "dQw4w9WgXcQ",
        "originalUrl": "https://youtube.com/watch?v=dQw4w9WgXcQ",
        "title": "React 完整教學 - 從零開始",
        "description": "這是一個完整的 React 教學...",
        "thumbnailUrl": "https://i.ytimg.com/vi/xxx/default.jpg",
        "videoUrl": "https://youtube.com/watch?v=xxx",
        "authorName": "程式教學頻道",
        "authorUrl": "https://youtube.com/channel/UCxxx",
        "authorAvatarUrl": "https://yt3.ggpht.com/xxx",
        "publishedAt": "2024-01-10T08:00:00Z",
        "engagementCount": 15000,
        "stats": {
          "viewCount": 50000,
          "likeCount": 2000,
          "commentCount": 150
        },
        "language": "zh-TW",
        "durationSeconds": 3600,
        "status": "classified",
        "processedAt": "2024-01-15T10:30:00Z",
        "reviewedAt": null,
        "reviewNote": null,
        "isLearningContent": true,
        "confidenceScore": 0.92,
        "suggestedType": "video_content",
        "suggestedLevel": "beginner",
        "suggestedTags": ["react", "javascript", "前端", "教學"],
        "suggestedCategory": 1,
        "classificationReason": "包含教學、入門等關鍵字，影片時長適合學習",
        "resourceId": null,
        "createdAt": "2024-01-15T10:00:00Z",
        "updatedAt": "2024-01-15T10:30:00Z"
      }
    ],
    "total": 150
  },
  "timestamp": "2024-01-15T12:00:00Z"
}
```

### 2.2 取得單一內容詳情

```http
GET /contents/:id
```

---

## 3. 抓取操作

### 3.1 執行單一來源抓取

```http
POST /sources/:id/fetch
```

**回應範例：**
```json
{
  "success": true,
  "data": {
    "fetched": 12,
    "errors": []
  },
  "message": "Fetched 12 items from source"
}
```

### 3.2 執行所有來源抓取

```http
POST /fetch-all
```

**回應範例：**
```json
{
  "success": true,
  "data": {
    "totalFetched": 45,
    "sourceResults": [
      { "sourceId": "uuid-1", "fetched": 15, "errors": [] },
      { "sourceId": "uuid-2", "fetched": 30, "errors": [] }
    ]
  }
}
```

---

## 4. 分類操作

### 4.1 分類單一內容

```http
POST /contents/:id/classify
```

### 4.2 批次分類待處理內容

```http
POST /classify-pending
```

**Query 參數：**
| 參數 | 類型 | 預設 | 說明 |
|------|------|------|------|
| limit | number | 10 | 最大處理數量 |
| platform | string | - | 只處理特定平台 |
| mode | string | auto | 分類模式: keyword, ai, auto |

**分類模式說明：**
| 模式 | 說明 | 速度 | 準確度 | 費用 |
|------|------|------|--------|------|
| keyword | 關鍵字規則分類 | 快 | 中 | 免費 |
| ai | AI 智能分類 | 中 | 高 | 需 API 費用 |
| auto | 自動選擇 | - | - | 優先 AI |

**回應範例：**
```json
{
  "success": true,
  "data": {
    "success": 10,
    "failed": 0,
    "results": [
      { "id": "uuid-1", "success": true },
      { "id": "uuid-2", "success": true }
    ],
    "mode": "ai",
    "modeInfo": {
      "aiAvailable": true,
      "aiProvider": "gemini"
    }
  },
  "message": "Classification completed: 10 success, 0 failed (mode: ai)"
}
```

---

## 5. 審核操作

### 5.1 審核單一內容

```http
POST /contents/:id/review
```

**Request Body (核准)：**
```json
{
  "action": "approve",
  "reviewNote": "內容品質良好",
  "overrideName": "React 入門完整教學",
  "overrideDescription": "適合初學者的 React 教學影片",
  "overrideType": "video_content",
  "overrideLevel": "beginner",
  "overrideTags": ["react", "javascript", "前端"]
}
```

**Request Body (拒絕)：**
```json
{
  "action": "reject",
  "reviewNote": "非學習相關內容"
}
```

**欄位說明：**
| 欄位 | 必填 | 說明 |
|------|------|------|
| action | 是 | approve 或 reject |
| reviewNote | 否 | 審核備註 |
| overrideName | 否 | 覆蓋標題 |
| overrideDescription | 否 | 覆蓋描述 |
| overrideType | 否 | 覆蓋資源類型 |
| overrideLevel | 否 | 覆蓋難度等級 |
| overrideTags | 否 | 覆蓋標籤 |

**資源類型 (type) 選項：**
- `learning_platform_app` - 學習平台/App
- `learning_tools` - 學習工具
- `books_articles` - 書籍/文章
- `video_content` - 影片內容
- `podcast_content` - Podcast
- `workshops_courses` - 工作坊/課程
- `professional_certificates` - 專業證照
- `community_organization` - 社群/組織
- `other` - 其他

**難度等級 (level) 選項：**
- `beginner` - 初學者
- `intermediate` - 中級
- `expert` - 專家
- `all_levels` - 適合所有程度

### 5.2 批次審核

```http
POST /contents/bulk-review
```

**Request Body：**
```json
{
  "contentIds": ["uuid-1", "uuid-2", "uuid-3"],
  "action": "approve",
  "reviewNote": "批次核准"
}
```

**回應範例：**
```json
{
  "success": true,
  "data": {
    "success": 3,
    "failed": 0
  }
}
```

---

## 6. 統計資訊

### 6.1 取得收集統計

```http
GET /stats
```

**回應範例：**
```json
{
  "success": true,
  "data": {
    "totalSources": 15,
    "activeSources": 12,
    "totalContents": 500,
    "contentsByStatus": {
      "pending": 50,
      "classified": 120,
      "approved": 30,
      "rejected": 100,
      "converted": 200
    },
    "contentsByPlatform": {
      "youtube": 350,
      "github": 100,
      "threads": 50
    },
    "recentFetches": {
      "last24Hours": 45,
      "last7Days": 200,
      "last30Days": 500
    }
  }
}
```

---

## 前端頁面建議

### 1. 來源管理頁 `/admin/collection/sources`

```
功能：
- 來源列表 (表格)
- 新增來源 (Modal/側邊欄)
- 編輯來源
- 停用/啟用來源
- 手動觸發抓取
- 顯示最後抓取時間、錯誤狀態
```

### 2. 內容審核頁 `/admin/collection/contents`

```
功能：
- 內容列表 (卡片/表格切換)
- 多重篩選 (平台、狀態、信心分數)
- 快速預覽 (點擊展開詳情)
- 單一審核 (核准/拒絕按鈕)
- 批次選取和審核
- 觸發分類 (選擇模式)
- 編輯 AI 建議的欄位後核准

UI 建議：
- 信心分數用顏色標示 (>0.8 綠色, 0.5-0.8 黃色, <0.5 紅色)
- 非學習內容灰顯
- 已分類內容顯示 AI 建議標籤
```

### 3. 統計儀表板 `/admin/collection/dashboard`

```
功能：
- 總覽數據卡片
- 各狀態數量圖表 (圓餅圖)
- 各平台數量圖表 (長條圖)
- 近期抓取趨勢 (折線圖)
- 快速操作按鈕 (全部抓取、批次分類)
```

---

## 錯誤處理

**錯誤回應格式：**
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid platform value",
    "details": {
      "field": "platform",
      "received": "invalid"
    }
  },
  "timestamp": "2024-01-15T12:00:00Z"
}
```

**常見錯誤碼：**
| 錯誤碼 | HTTP 狀態 | 說明 |
|--------|----------|------|
| VALIDATION_ERROR | 400 | 請求參數驗證失敗 |
| NOT_FOUND | 404 | 資源不存在 |
| UNAUTHORIZED | 401 | 未授權 |
| FORBIDDEN | 403 | 權限不足 |
| INTERNAL_ERROR | 500 | 伺服器內部錯誤 |

---

## TypeScript 型別定義

前端可使用以下型別定義：

```typescript
// 平台類型
type CollectionPlatform = 'youtube' | 'github' | 'threads';

// 來源類型
type CollectionSourceType = 'channel' | 'playlist' | 'keyword' | 'topic' | 'user' | 'hashtag' | 'repository';

// 內容狀態
type CollectedContentStatus = 'pending' | 'classified' | 'approved' | 'rejected' | 'converted';

// 分類模式
type ClassificationMode = 'keyword' | 'ai' | 'auto';

// 審核動作
type ReviewAction = 'approve' | 'reject';

// 資源類型
type ResourceType =
  | 'learning_platform_app'
  | 'learning_tools'
  | 'books_articles'
  | 'video_content'
  | 'podcast_content'
  | 'workshops_courses'
  | 'professional_certificates'
  | 'community_organization'
  | 'other';

// 難度等級
type LevelType = 'beginner' | 'intermediate' | 'expert' | 'all_levels';

// 收集來源
interface CollectionSource {
  id: string;
  platform: CollectionPlatform;
  sourceType: CollectionSourceType;
  sourceValue: string;
  sourceName: string | null;
  description: string | null;
  isActive: boolean;
  fetchInterval: number;
  lastFetchedAt: string | null;
  fetchCount: number;
  errorCount: number;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
}

// 收集內容
interface CollectedContent {
  id: string;
  sourceId: string;
  platform: CollectionPlatform;
  platformContentId: string;
  originalUrl: string;
  title: string | null;
  description: string | null;
  thumbnailUrl: string | null;
  videoUrl: string | null;
  authorName: string | null;
  authorUrl: string | null;
  authorAvatarUrl: string | null;
  publishedAt: string | null;
  engagementCount: number;
  stats: Record<string, unknown> | null;
  language: string | null;
  durationSeconds: number | null;
  status: CollectedContentStatus;
  processedAt: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  isLearningContent: boolean | null;
  confidenceScore: number | null;
  suggestedType: ResourceType | null;
  suggestedLevel: LevelType | null;
  suggestedTags: string[];
  suggestedCategory: number | null;  // 分類 ID，參照 categories 表
  classificationReason: string | null;
  resourceId: string | null;
  createdAt: string;
  updatedAt: string;
}

// 審核請求
interface ReviewContentRequest {
  action: ReviewAction;
  reviewNote?: string;
  overrideName?: string;
  overrideDescription?: string;
  overrideType?: ResourceType;
  overrideLevel?: LevelType;
  overrideTags?: string[];
}

// 統計資訊
interface CollectionStats {
  totalSources: number;
  activeSources: number;
  totalContents: number;
  contentsByStatus: Record<CollectedContentStatus, number>;
  contentsByPlatform: Record<CollectionPlatform, number>;
  recentFetches: {
    last24Hours: number;
    last7Days: number;
    last30Days: number;
  };
}
```

---

## 附錄：Swagger UI

完整 API 文件可在開發環境查看：
```
http://localhost:3000/api-docs
```
