# DaoDao Server API 開發指南

## 專案架構概述
2024年度 - 混合式 JavaScript/TypeScript 架構與現代化學習平台 API

## 🏗️ 混合式架構設計

本專案採用獨特的**雙架構模式**，JavaScript 舊系統與 TypeScript 新系統並存：

### 系統分工
- **JavaScript 系統**：處理既有功能（用戶管理、專案、馬拉松、社群、認證、檔案上傳）
- **TypeScript 系統**：現代化 API 開發（資源管理、評價系統、標籤、健康檢查）

### 整合策略
- `index.js` - 主入口點，同時載入 JS 和 TS 路由
- `src/app.ts` - TypeScript 路由設置與 Swagger 整合
- `src/utils/modelBridge.ts` - JavaScript 與 TypeScript 模型橋接
- 路徑別名：`@/*` → `src/*`，統一 import 語法

## 🌐 完整 API 端點概覽

### 基礎 URL 結構
- **開發環境**: `https://server.daoedu.tw/`
- **生產環境**: `https://dao-server.daoedu.tw/`
- **API 文件**: `/api-docs` 和 `/api/docs`
- **全域限流**: 1000 req/min，嚴格限流: 60 req/min（電子郵件/圖片）

### JavaScript 系統 API 端點

#### 認證系統 (`/auth`)
| 方法 | 路徑 | 描述 | 需要認證 |
|------|------|------|----------|
| GET | `/auth/google` | 啟動 Google OAuth 登入 | 否 |
| GET | `/auth/google/callback` | Google OAuth 回調處理 | 否 |

#### 用戶管理 (`/users`)
| 方法 | 路徑 | 描述 | 需要認證 |
|------|------|------|----------|
| GET | `/users/` | 取得所有用戶 | 否 |
| GET | `/users/me` | 取得當前用戶資料 | 是 |
| GET | `/users/:id` | 取得特定用戶 | 否 |
| POST | `/users/` | 建立新用戶 | 是 |
| PUT | `/users/:id` | 更新用戶資料 | 是 + 完整檔案 |
| DELETE | `/users/me` | 刪除當前用戶 | 是 |
| DELETE | `/users/:id` | 刪除特定用戶 | 是 |
| GET | `/users/login/success` | 檢查登入狀態 | 否 |
| GET | `/users/logout` | 用戶登出 | 否 |

#### 專案管理 (`/projects`)
**專案 CRUD**
| 方法 | 路徑 | 描述 | 需要認證 |
|------|------|------|----------|
| GET | `/projects/public` | 取得公開專案 | 否 |
| GET | `/projects/admin` | 取得所有專案（管理員） | 否 |
| GET | `/projects/me` | 取得我的專案 | 是 |
| GET | `/projects/:projectId` | 取得專案詳情 | 否 |
| POST | `/projects/` | 建立專案 | 是 |
| PUT | `/projects/:projectId` | 更新專案 | 是 |
| DELETE | `/projects/:projectId` | 刪除專案 | 是 |

**里程碑管理**
| 方法 | 路徑 | 描述 | 需要認證 |
|------|------|------|----------|
| GET | `/projects/:projectId/milestones` | 取得專案里程碑 | 否 |
| POST | `/projects/:projectId/milestones` | 建立里程碑 | 是 |
| PUT | `/projects/:projectId/milestones/:milestoneId` | 更新里程碑 | 是 |
| DELETE | `/projects/:projectId/milestones/:milestoneId` | 刪除里程碑 | 是 |

**任務管理**
| 方法 | 路徑 | 描述 | 需要認證 |
|------|------|------|----------|
| GET | `/projects/:projectId/milestones/:milestoneId/tasks` | 取得任務 | 否 |
| GET | `/projects/:projectId/milestones/:milestoneId/tasks/:taskId` | 取得任務詳情 | 否 |
| POST | `/projects/:projectId/milestones/:milestoneId/tasks` | 建立任務 | 是 |
| PUT | `/projects/:projectId/milestones/:milestoneId/tasks/:taskId` | 更新任務 | 是 |
| DELETE | `/projects/:projectId/milestones/:milestoneId/tasks/:taskId` | 刪除任務 | 是 |

**筆記系統**
| 方法 | 路徑 | 描述 | 需要認證 |
|------|------|------|----------|
| GET | `/projects/notes/me` | 取得我的筆記 | 是 |
| GET | `/projects/notes/public` | 取得公開筆記 | 否 |
| GET | `/projects/:projectId/notes/` | 取得專案筆記 | 否 |
| GET | `/projects/:projectId/notes/:noteId` | 取得筆記詳情 | 否 |
| POST | `/projects/:projectId/notes` | 建立筆記 | 是 |
| PUT | `/projects/:projectId/notes/:noteId` | 更新筆記 | 是 |
| DELETE | `/projects/:projectId/notes/:noteId` | 刪除筆記 | 是 |

**成果展示**
| 方法 | 路徑 | 描述 | 需要認證 |
|------|------|------|----------|
| GET | `/projects/outcomes/me` | 取得我的成果 | 是 |
| GET | `/projects/:projectId/outcomes` | 取得專案成果 | 否 |
| GET | `/projects/:projectId/outcomes/:outcomeId` | 取得成果詳情 | 否 |
| POST | `/projects/:projectId/outcomes` | 建立成果 | 是 |
| PUT | `/projects/:projectId/outcomes/:outcomeId` | 更新成果 | 是 |
| DELETE | `/projects/:projectId/outcomes/:outcomeId` | 刪除成果 | 是 |

**週反思系統**
| 方法 | 路徑 | 描述 | 需要認證 |
|------|------|------|----------|
| GET | `/projects/:projectId/reviews` | 取得專案反思 | 否 |
| GET | `/projects/:projectId/reviews/:reviewId` | 取得反思詳情 | 否 |
| POST | `/projects/:projectId/reviews` | 建立反思 | 是 |
| PUT | `/projects/:projectId/reviews/:reviewId` | 更新反思 | 是 |
| DELETE | `/projects/:projectId/reviews/:reviewId` | 刪除反思 | 是 |

#### 馬拉松系統 (`/marathons`)
| 方法 | 路徑 | 描述 | 需要認證 |
|------|------|------|----------|
| GET | `/marathons/` | 取得馬拉松（支援查詢參數） | 否 |
| GET | `/marathons/:id` | 取得馬拉松詳情 | 否 |
| POST | `/marathons/` | 建立馬拉松 | 否 |
| PUT | `/marathons/:id` | 更新馬拉松 | 是 + 完整檔案 |
| DELETE | `/marathons/:id` | 刪除馬拉松 | 是 + 完整檔案 |

#### 導師系統 (`/mentors`)
**導師-馬拉松關係**
| 方法 | 路徑 | 描述 | 需要認證 |
|------|------|------|----------|
| GET | `/mentors/me/marathons` | 取得導師的馬拉松 | 是 |
| POST | `/mentors/marathons` | 指派導師到馬拉松 | 是 |
| PUT | `/mentors/marathons/:assignmentId` | 更新導師-馬拉松關係 | 是 |
| DELETE | `/mentors/marathons/:assignmentId` | 移除導師馬拉松關係 | 是 |

**導師-學員關係**
| 方法 | 路徑 | 描述 | 需要認證 |
|------|------|------|----------|
| GET | `/mentors/me/marathons/:eventId/participants` | 依馬拉松取得導師的學員 | 是 |
| POST | `/mentors/participant` | 指派學員給導師 | 是 |
| PUT | `/mentors/participant/:participantId` | 更新導師-學員關係 | 是 |
| DELETE | `/mentors/participant/:participantId` | 移除導師-學員關係 | 是 |

**導師評價**
| 方法 | 路徑 | 描述 | 需要認證 |
|------|------|------|----------|
| GET | `/mentors/marathons/:eventId/reviews` | 取得導師學員的評價 | 是 |

#### 揪團 (`/circles`)
| 方法 | 路徑 | 描述 | 需要認證 |
|------|------|------|----------|
| GET | `/circles` | 取得揪團清單 | 否 |
| GET | `/circles/:id` | 取得揪團詳情 | 否 |
| GET | `/circles/user/:userId` | 依用戶取得揪團 | 否 |
| POST | `/circles` | 建立揪團 | 是 + 完整檔案 |
| PUT | `/circles/:id` | 更新揪團 | 是 + 完整檔案 |
| PUT | `/circles/:id/status` | 變更揪團狀態 | 是 + 完整檔案 |
| DELETE | `/circles/:id` | 刪除揪團 | 是 + 完整檔案 |

#### 想法 (`/ideas`)
| 方法 | 路徑 | 描述 | 需要認證 |
|------|------|------|----------|
| GET | `/ideas` | 取得想法清單 | 否 |
| GET | `/ideas/:id` | 取得想法詳情 | 否 |
| POST | `/ideas` | 建立想法 | 是 + 完整檔案 |
| PUT | `/ideas/:id` | 更新想法 | 是 + 完整檔案 |
| DELETE | `/ideas/:id` | 刪除想法 | 是 + 完整檔案 |

#### 留言系統 (`/comments`)
| 方法 | 路徑 | 描述 | 需要認證 |
|------|------|------|----------|
| GET | `/comments` | 取得留言（支援查詢參數） | 否 |
| GET | `/comments/:commentId` | 取得留言詳情 | 否 |
| POST | `/comments` | 建立留言 | 是 |
| PUT | `/comments/:commentId` | 更新留言 | 是 |
| DELETE | `/comments/:commentId` | 刪除留言 | 是 |

#### 標籤系統 (`/tags`)
| 方法 | 路徑 | 描述 | 需要認證 |
|------|------|------|----------|
| GET | `/tags/` | 取得熱門標籤 | 否 |

#### 電子郵件 (`/emails`) - 限流 60 req/min
| 方法 | 路徑 | 描述 | 需要認證 |
|------|------|------|----------|
| POST | `/emails` | 發送電子郵件 | 是 + 完整檔案 |
| POST | `/emails/project` | 發送專案驗證郵件 | 是 |
| GET | `/emails/verify` | 驗證電子郵件 | 否 |

#### 圖片管理 (`/images`) - 限流 60 req/min, 5 uploads/15min
| 方法 | 路徑 | 描述 | 需要認證 |
|------|------|------|----------|
| GET | `/images/:filename` | 取得圖片 | 否 |
| POST | `/images/` | 上傳單張圖片 | 是 + 完整檔案 |
| POST | `/images/multiple` | 上傳多張圖片（最多5張） | 是 + 完整檔案 |
| DELETE | `/images/:filename` | 刪除圖片 | 是 + 完整檔案 |

#### 儀表板 (`/`)
| 方法 | 路徑 | 描述 | 需要認證 |
|------|------|------|----------|
| GET | `/dashboard` | 取得儀表板資料（統計、最新資料） | 否 |

#### 專案清單 (`/list`)
| 方法 | 路徑 | 描述 | 需要認證 |
|------|------|------|----------|
| GET | `/list/` | 取得 v2 版專案清單 | 否 |

#### 系統監控
| 方法 | 路徑 | 描述 | 需要認證 |
|------|------|------|----------|
| GET | `/monitor` | 取得系統監控資訊 | 否 |
| GET | `/db-info` | 取得資料庫架構資訊 | 否 |

### TypeScript 系統 API 端點 (`/api/v1`)

#### 健康檢查與資訊
| 方法 | 路徑 | 描述 | 需要認證 |
|------|------|------|----------|
| GET | `/api/v1/health` | API 健康檢查 | 否 |
| GET | `/api/v1/info` | API 資訊 | 否 |
| GET | `/api/ts-test` | TypeScript 測試端點 | 否 |

#### 學習資源管理 (`/api/v1/resources`)
| 方法 | 路徑 | 描述 | 需要認證 |
|------|------|------|----------|
| GET | `/api/v1/resources` | 取得資源（篩選/分頁） | 可選認證 |
| GET | `/api/v1/resources/:id` | 取得資源詳情 | 可選認證 |
| POST | `/api/v1/resources` | 建立資源 | 是 |
| PATCH | `/api/v1/resources/:id` | 更新資源 | 是 |
| PATCH | `/api/v1/resources/:id/status` | 更新資源狀態 | 是（管理員） |
| DELETE | `/api/v1/resources/:id` | 刪除資源 | 是 |
| GET | `/api/v1/resources/:id/tags` | 取得資源標籤 | 否 |

#### 資源評價系統 (`/api/v1/resources/:resourceId/reviews`)
| 方法 | 路徑 | 描述 | 需要認證 |
|------|------|------|----------|
| GET | `/api/v1/resources/:resourceId/reviews` | 取得資源評價 | 可選認證 |
| GET | `/api/v1/resources/:resourceId/reviews/:reviewId` | 取得評價詳情 | 可選認證 |
| POST | `/api/v1/resources/:resourceId/reviews` | 建立評價 | 是 |
| PATCH | `/api/v1/resources/:resourceId/reviews/:reviewId` | 更新評價 | 是 |
| PATCH | `/api/v1/resources/:resourceId/reviews/:reviewId/status` | 更新評價狀態 | 是（管理員） |
| DELETE | `/api/v1/resources/:resourceId/reviews/:reviewId` | 刪除評價 | 是 |
| POST | `/api/v1/resources/:resourceId/reviews/:reviewId/like` | 按讚評價 | 是 |
| DELETE | `/api/v1/resources/:resourceId/reviews/:reviewId/like` | 取消按讚 | 是 |

#### 標籤系統 TypeScript 版本 (`/api/v1/tags`)
| 方法 | 路徑 | 描述 | 需要認證 |
|------|------|------|----------|
| GET | `/api/v1/tags/popular` | 取得熱門標籤 | 否 |
| GET | `/api/v1/tags/search` | 搜尋標籤 | 否 |
| GET | `/api/v1/tags/stats` | 取得標籤統計 | 否 |
| GET | `/api/v1/tags/entities` | 取得實體標籤 | 否 |
| POST | `/api/v1/tags/entities` | 新增實體標籤 | 否（待加認證） |
| DELETE | `/api/v1/tags/entities` | 移除實體標籤 | 否（待加認證） |

#### 測試與除錯
| 方法 | 路徑 | 描述 | 需要認證 |
|------|------|------|----------|
| GET | `/api/test` | 基本 API 測試端點 | 否 |

## 📝 通用查詢參數與回傳格式

### 🔍 標準化查詢參數

#### 分頁參數
| 參數 | 類型 | 說明 | 預設值 | 使用系統 |
|------|------|------|--------|---------|
| `page` | integer | 頁碼 (1-based) | 1 | JavaScript API |
| `pageSize` | integer | 每頁項目數 | 10 | JavaScript API |
| `cursor` | string | 游標分頁標記 | - | TypeScript API |
| `limit` | integer | 最大回傳數量 | 20 | TypeScript API |

#### 排序參數
| 參數 | 類型 | 說明 | 可選值 | 預設值 |
|------|------|------|--------|--------|
| `sort` | string | 排序欄位 | `createdAt`, `updatedAt`, `name` | `createdAt` |
| `order` | string | 排序方向 | `asc`, `desc` | `desc` |

#### 搜尋與篩選參數
| 參數 | 類型 | 說明 | 範例 |
|------|------|------|------|
| `query` | string | 文字搜尋 | `學習平台` |
| `tags` | string | 標籤篩選 (逗號分隔) | `程式設計,網頁開發` |
| `status` | string | 狀態篩選 | `active`, `draft`, `archived` |
| `type` | string | 類型篩選 | `learning_platform_app`, `books_articles` |
| `userId` | string | 用戶ID篩選 | `user-uuid-123` |
| `createdBy` | string | 建立者篩選 | `user-uuid-456` |

#### 資源專用參數
| 參數 | 類型 | 說明 | 可選值 |
|------|------|------|--------|
| `cost` | string | 費用類型 | `free`, `paid`, `partial_free` |
| `level` | string | 難度等級 | `beginner`, `intermediate`, `expert`, `all_levels` |
| `majorCategory` | string | 主要分類 | 分類ID |
| `subCategory` | string | 子分類 | 子分類ID |
| `minScore` | number | 最低評分 | 1.0 - 5.0 |
| `maxScore` | number | 最高評分 | 1.0 - 5.0 |

### 📄 標準化回傳格式

#### TypeScript API 回傳格式 (推薦)

**成功回應格式**
```json
{
  "success": true,
  "data": {
    // 實際資料內容
  },
  "message": "操作成功" // 可選
}
```

**成功回應 (分頁資料)**
```json
{
  "success": true,
  "data": [
    // 資料陣列
  ],
  "pagination": {
    "limit": 20,
    "hasNext": true,
    "hasPrev": false,
    "nextCursor": "eyJpZCI6MTIzLCJjcmVhdGVkQXQiOiIyMDI0LTAxLTE1In0=",
    "prevCursor": null,
    "totalEstimate": 150
  }
}
```

**錯誤回應格式**
```json
{
  "success": false,
  "error": {
    "message": "錯誤描述",
    "code": "ERROR_CODE", // 可選
    "details": {} // 可選，詳細錯誤資訊
  }
}
```

**驗證錯誤回應**
```json
{
  "success": false,
  "error": {
    "message": "驗證失敗",
    "code": "VALIDATION_ERROR",
    "details": {
      "errors": [
        {
          "field": "email",
          "message": "電子郵件格式不正確"
        }
      ]
    }
  }
}
```

#### JavaScript API 回傳格式 (舊版)

**直接資料回傳**
```json
{
  "data": [
    // 資料陣列
  ]
}
```

**分頁資料回傳**
```json
{
  "total": 150,
  "page": 1,
  "totalPages": 8,
  "data": [
    // 資料陣列
  ]
}
```

**錯誤回應**
```json
{
  "error": true,
  "message": "錯誤描述",
  "details": "詳細錯誤資訊" // 可選
}
```

### 📊 HTTP 狀態碼規範

| 狀態碼 | 說明 | 使用場景 |
|--------|------|----------|
| 200 | OK | 成功的 GET 請求 |
| 201 | Created | 成功建立資源 |
| 204 | No Content | 成功刪除資源 |
| 400 | Bad Request | 請求參數錯誤或驗證失敗 |
| 401 | Unauthorized | 需要認證或認證失敗 |
| 403 | Forbidden | 權限不足 |
| 404 | Not Found | 請求的資源不存在 |
| 409 | Conflict | 資源衝突 (如重複建立) |
| 422 | Unprocessable Entity | 語意錯誤 (如商業邏輯驗證失敗) |
| 500 | Internal Server Error | 伺服器內部錯誤 |

### 🎯 API 呼叫範例

#### 查詢資源 (TypeScript API)
```bash
GET /api/v1/resources?limit=10&type=learning_platform_app&cost=free&sort=createdAt&order=desc
```

**回應範例**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Coursera",
      "url": "https://www.coursera.org",
      "type": "learning_platform_app",
      "cost": "partial_free",
      "level": "all_levels",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "limit": 10,
    "hasNext": true,
    "hasPrev": false,
    "nextCursor": "eyJpZCI6MTIzfQ==",
    "totalEstimate": 25
  }
}
```

#### 查詢專案 (JavaScript API)
```bash
GET /projects/public?page=1&pageSize=10
```

**回應範例**
```json
{
  "total": 45,
  "page": 1,
  "totalPages": 5,
  "data": [
    {
      "id": "proj-uuid-123",
      "title": "Web 開發學習專案",
      "description": "從零開始學習現代 Web 開發",
      "status": "active",
      "createdAt": "2024-01-10T08:00:00Z"
    }
  ]
}
```

### 🔧 實作指引

#### 查詢參數驗證
- **TypeScript API**: 使用 Zod schemas 進行參數驗證
- **JavaScript API**: 使用自定義驗證函數或 middleware

#### 錯誤處理
- **TypeScript API**: 使用 `asyncWrapper` + 標準化錯誤類別
- **JavaScript API**: 直接在 controller 中處理錯誤

#### 資料轉換
- **TypeScript API**: 使用 transform utilities (如 `transformResourceDbToApi`)
- **JavaScript API**: 使用 format functions (如 `formatProjectResponse`)

## 📊 完整資料庫架構

### 核心系統架構概述

DaoDao 學習平台採用 PostgreSQL 為主要資料庫，具備以下核心特色：
- **50+ 張資料表**的複雜關係設計
- **UUID 外部標識符**供 API 使用
- **軟刪除支援**（timestamp-based）
- **多語言支援**的 i18n-ready 設計
- **PostgreSQL 加密擴展**與自訂 ENUM 類型

### 認證與授權系統

#### 用戶與權限管理
```sql
-- 用戶基礎表
users (id, external_id, role_id, email, provider_data, ...)

-- 六級角色系統
roles (id, name) -- Guest → User → Participant → Mentor → Admin → SuperAdmin

-- 權限系統（8 項核心權限）
permissions (id, name) -- create_project, join_marathon, mentor_others, etc.

-- 角色-權限關聯
role_permissions (role_id, permission_id)
user_permissions (user_id, permission_id) -- 個人權限覆寫

-- 臨時用戶註冊
temp_users (id, email, verification_token, ...)
```

#### 用戶檔案系統
```sql
-- 聯絡資訊與社群偏好
contacts (id, user_id, line_id, ig_account, communication_preferences, ...)

-- 基本資訊與活動偏好
basic_info (id, user_id, self_introduction, activity_preferences, ...)

-- 進階檔案（配對用）
user_profiles (id, user_id, personality_traits, collaboration_style, ...)

-- 用戶職位關聯
user_positions (user_id, position_id)
position (id, name) -- student, citizen, educator, etc.

-- 訂閱管理
user_subscription (id, user_id, plan_id, start_date, end_date, ...)
subscription_plan (id, name, features_json, pricing, ...)
```

### 地理位置與參考資料

#### 地理系統
```sql
-- 國家資料（278 個國家）
country (id, name, iso_code)

-- 城市資料（台灣為主，30 個城市）
city (id, name, taiwan_flag)

-- 位置整合
location (id, city_id, country_id, description)

-- 定價方案
fee_plans (id, qualification_based_discount, pricing_tiers, ...)
```

### 學習與社群功能

#### 群組學習系統
```sql
-- 學習群組（讀書會、工作坊、專案）
groups (
    id, external_id, creator_id, 
    name, category, difficulty_level,
    max_members, current_members,
    meeting_frequency, location_type,
    created_at, updated_at, deleted_at
)

-- 群組參與
user_join_group (
    id, user_id, group_id, 
    role, joined_at, status
)
```

#### 專案管理系統
```sql
-- 學習專案
project (
    id, external_id, creator_id,
    title, goals, strategies, outcomes,
    start_date, end_date, status,
    visibility, category_id
)

-- 專案協作
user_project (user_id, project_id, role, joined_at)

-- 里程碑管理
milestone (
    id, project_id, title, description,
    target_date, completion_date, status
)

-- 週任務系統
task (
    id, milestone_id, title, description,
    week_number, status, created_at
)

-- 用戶內容商店
store (id, user_id, content_type, content_data)
```

### 內容發布與互動系統

#### 統一內容模型
```sql
-- 通用內容表（支援多種內容類型）
post (
    id, external_id, user_id, project_id,
    type, -- 'outcome', 'note', 'review'
    title, content, media_urls,
    visibility, status,
    created_at, updated_at, deleted_at
)

-- 學習成果
outcome (
    id, post_id, achievement_type,
    media_urls, reflection_content
)

-- 學習筆記
note (
    id, post_id, note_type,
    quick_thoughts, detailed_content
)

-- 週反思
review (
    id, post_id, week_number,
    mood_score, stress_level,
    accomplishments, challenges, next_steps
)

-- 留言系統（跨所有內容類型）
comments (
    id, target_type, target_id, user_id,
    content, parent_comment_id,
    created_at, updated_at, deleted_at
)
```

### 馬拉松與競賽系統

#### 學習馬拉松
```sql
-- 馬拉松活動
marathon (
    id, external_id, title, description,
    start_date, end_date, registration_deadline,
    max_participants, eligibility_criteria,
    fee_structure, status
)

-- 專案參賽
project_marathon (
    id, project_id, marathon_id,
    submission_date, status
)

-- 資格與費用
eligibility (id, marathon_id, criteria_json)

-- 導師-學員配對
mentor_participants (
    id, mentor_id, participant_id, marathon_id,
    assignment_date, status
)
```

### 互動與分析系統

#### 用戶互動追蹤
```sql
-- 反應系統（按讚等）
reaction (
    id, user_id, target_type, target_id,
    reaction_type, weight_score, created_at
)

-- 收藏功能
favorite (
    id, user_id, target_type, target_id,
    collection_name, created_at
)

-- 瀏覽追蹤
view (
    id, user_id, target_type, target_id,
    duration_seconds, device_info, created_at
)

-- 分享統計
share (
    id, user_id, target_type, target_id,
    platform, shared_at
)

-- 點擊追蹤
click (
    id, user_id, target_type, target_id,
    click_type, metadata_json, created_at
)

-- 評分系統
rating (
    id, user_id, target_type, target_id,
    overall_score, created_at
)

rating_detail (
    id, rating_id, dimension_name,
    score, weight, comments
)

-- 簡易按讚（舊系統）
likes (id, user_id, target_type, target_id, created_at)
```

### 學習資源管理系統

#### 資源與評價（TypeScript 新系統）
```sql
-- 學習資源
resources (
    id, external_id, created_by,
    major_category_id, sub_category_id,
    name, url, image_url, description, video_url,
    type, cost, level, status,
    created_at, updated_at, deleted_at
)

-- 資源評價（5 維度評分系統）
resource_review (
    id, user_id, resource_id,
    -- 評分維度（1.0-5.0，支援 0.5 間距）
    score_impact, score_mindset, score_problems,
    score_perspectives, score_goals,
    content, -- 評價內容
    -- 9 個內容特色 Boolean 欄位
    well_structured, practice_focused, well_rounded_concepts,
    thought_provoking, progressive_learning, problem_based,
    real_world_examples, interactive, visually_rich,
    -- 時間運用方式
    time_usage, -- ENUM: daily, intensive, spare_moments, etc.
    -- 6 個資源搭配使用 Boolean 欄位  
    with_online_courses, with_books, with_other_tools,
    with_community, only_this_resource, not_applicable_resource,
    status, created_at, updated_at, deleted_at,
    UNIQUE(user_id, resource_id) -- 每用戶每資源只能一個評價
)
```

### 分類與標籤系統

#### 階層式分類與彈性標籤
```sql
-- 階層式分類系統（17 大類 + 100+ 子類）
categories (
    id, parent_id, name, description,
    level, sort_order, status
)

-- 彈性標籤系統
tags (id, name, description, usage_count)

-- 實體標籤關聯（多對多關係）
entity_tags (
    id, entity_type, entity_id, tag_id,
    weight, created_at
)
```

### 個人化偏好系統

#### 多維度偏好管理
```sql
-- 偏好類型（16 個維度）
preference_types (
    id, name, description, category
)

-- 偏好選項（100+ 細分選項）
preference_options (
    id, preference_type_id, option_key,
    display_name, description, sort_order
)

-- 用戶偏好設定
user_preferences (
    id, user_id, preference_type_id, preference_option_id,
    intensity_level, -- 1-5 強度等級
    created_at, updated_at
)
```

### AI 整合系統

#### AI 輔助功能
```sql
-- AI 學習回饋
ai_review_feedbacks (
    id, user_id, target_type, target_id,
    feedback_content, confidence_score,
    model_version, token_usage,
    created_at
)
```

### 資料庫架構特色

#### 1. 外部標識符系統
- 所有主要實體使用 `external_id UUID` 供 API 使用
- 內部 `id SERIAL` 供資料庫關聯使用
- 提供安全性與效能平衡

#### 2. 軟刪除設計
- 多數表格包含 `deleted_at TIMESTAMP` 欄位
- 支援資料恢復與審計追蹤
- 保持關聯完整性

#### 3. 時區意識
- 使用 `TIMESTAMPTZ` 支援全球使用者
- 標準化 UTC 儲存

#### 4. 彈性關聯設計
- `target_type` + `target_id` 模式支援多型關聯
- 統一互動、留言、標籤系統

#### 5. 效能優化
- 策略性索引設計
- 複合索引支援常見查詢模式
- 分頁查詢優化

## 🚀 現代化 TypeScript API 實作

### 當前 TypeScript API 結構
本專案已完成以下 TypeScript API 實作：

#### 1. 資源管理系統 (`/api/v1/resources`)
- **完整 CRUD 操作**：新增、查詢、更新、刪除
- **進階篩選功能**：類型、費用、程度、分類等多維度篩選
- **分頁機制**：支援 `page` 和 `limit` 參數
- **排序功能**：按建立時間、更新時間等欄位排序
- **關聯查詢**：支援 `include` 參數載入關聯資料

#### 2. 評價系統 (`/api/v1/resources/:resourceId/reviews`)
- **巢狀路由設計**：資源下的評價管理
- **多維度評分**：5 個評分維度，支援 0.5 分間距
- **複雜資料結構**：9 個內容特色 + 6 個資源使用模式
- **Boolean 轉物件**：資料庫 Boolean 欄位自動轉換為 API 物件格式

#### 3. 標籤系統 (`/api/v1/tags`)
- **多對多關係管理**：透過 EntityTag 處理資源與標籤關係
- **統計功能**：標籤使用次數、相關資源數量
- **動態建立**：自動建立不存在的標籤

### API 設計原則

#### 1. RESTful 規範
```typescript
GET    /api/v1/resources           // 查詢資源列表
POST   /api/v1/resources           // 新增資源
GET    /api/v1/resources/:id       // 查詢單一資源
PUT    /api/v1/resources/:id       // 更新資源
DELETE /api/v1/resources/:id       // 刪除資源

GET    /api/v1/resources/:resourceId/reviews    // 查詢資源評價
POST   /api/v1/resources/:resourceId/reviews    // 新增評價
PUT    /api/v1/resources/:resourceId/reviews/:id // 更新評價
DELETE /api/v1/resources/:resourceId/reviews/:id // 刪除評價
```

#### 2. 標準化回應格式
```typescript
// 成功回應
{
  success: true,
  data: T,
  message?: string,
  pagination?: {
    page: number,
    limit: number,
    total: number,
    totalPages: number
  }
}

// 錯誤回應
{
  success: false,
  error: {
    message: string,
    code?: string,
    details?: unknown
  }
}
```

#### 3. Swagger 文件整合
- **自動生成 API 文件**：`/api-docs` 和 `/api/docs`
- **完整的參數說明**：請求/回應範例、驗證規則
- **型別安全**：TypeScript 型別與 Swagger schema 同步

## 🛠️ TypeScript 開發架構

### 已實作的型別系統
專案已完成完整的 TypeScript 型別系統，使用 Zod schema 進行驗證：

#### 1. 檔案結構
```typescript
src/
├── types/
│   ├── resource.types.ts         // 資源相關型別定義
│   ├── resource-review.types.ts  // 評價系統型別定義
│   ├── common.types.ts          // 共用型別與介面
│   ├── transform.types.ts       // 資料轉換型別
│   └── global.d.ts             // 全域型別擴展
├── validators/
│   ├── resource.validators.ts    // 資源驗證 schemas
│   ├── resource-review.validators.ts // 評價驗證 schemas
│   └── common.validators.ts     // 共用驗證 schemas
└── models/
    ├── resource.ts              // Sequelize 模型與型別
    ├── resource-review.ts       // 評價模型與型別
    ├── tag.ts                   // 標籤模型
    └── entity-tag.ts           // 關聯模型
```

#### 2. Zod Schema 實作範例
```typescript
// 資源類型 (已實作於 src/validators/resource.validators.ts)
export const resourceTypeSchema = z.enum([
  'learning_platform_app',
  'learning_tools', 
  'books_articles',
  'video_content',
  'podcast_content',
  'workshops_courses',
  'professional_certificates',
  'community_organization',
  'other'
] as const);

// 評分系統 (已實作於 src/validators/resource-review.validators.ts)
export const scoreSchema = z.number()
  .min(1.0)
  .max(5.0)
  .refine(val => val * 2 === Math.floor(val * 2), {
    message: "Score must be in 0.5 increments"
  });

// 內容特色物件 schema (已實作)
export const contentFeaturesSchema = z.object({
  wellStructured: z.boolean().default(false),
  practiceFocused: z.boolean().default(false),
  wellRoundedConcepts: z.boolean().default(false),
  thoughtProvoking: z.boolean().default(false),
  progressiveLearning: z.boolean().default(false),
  problemBased: z.boolean().default(false),
  realWorldExamples: z.boolean().default(false),
  interactive: z.boolean().default(false),
  visuallyRich: z.boolean().default(false)
}).optional();
```

#### 3. 型別推斷與驗證
```typescript
// 自動型別推斷
export type ResourceType = z.infer<typeof resourceTypeSchema>;
export type ContentFeatures = z.infer<typeof contentFeaturesSchema>;

// API 請求驗證
export const createResourceSchema = z.object({
  name: z.string().min(1).max(255),
  url: z.string().url(),
  description: z.string().min(1),
  type: resourceTypeSchema,
  cost: costTypeSchema,
  level: levelTypeSchema,
  // ... 其他欄位
});

export type CreateResourceRequest = z.infer<typeof createResourceSchema>;
```

### 已實作的資料轉換系統
專案已完成完整的資料轉換架構，位於 `src/utils/transform.ts`：

#### 1. 核心轉換函數
```typescript
// 已實作於 src/utils/transform.ts
import { objectToBooleanFields, booleanFieldsToObject } from '@/utils/transform';

// 資源資料轉換 (已實作)
export const transformResourceToApi = (dbResource: any): ResourceResponse => ({
  id: dbResource.id,
  externalId: dbResource.external_id,
  name: dbResource.name,
  url: dbResource.url,
  imageUrl: dbResource.image_url,
  description: dbResource.description,
  videoUrl: dbResource.video_url,
  type: dbResource.type,
  cost: dbResource.cost,
  level: dbResource.level,
  status: dbResource.status,
  createdAt: dbResource.created_at,
  updatedAt: dbResource.updated_at
});

// 評價資料轉換 (已實作複雜的 Boolean 轉物件邏輯)
export const transformReviewToApi = (dbReview: any): ResourceReviewResponse => ({
  id: dbReview.id,
  content: dbReview.content,
  scores: {
    overallImpact: dbReview.score_impact,
    changeMindset: dbReview.score_mindset,
    solveProblems: dbReview.score_problems,
    gainPerspectives: dbReview.score_perspectives,
    achieveGoals: dbReview.score_goals
  },
  contentFeatures: booleanFieldsToObject(dbReview, contentFeaturesMappings),
  resourceUsage: booleanFieldsToObject(dbReview, resourceUsageMappings),
  timeUsage: dbReview.time_usage,
  // ... 其他欄位
});
```

#### 2. 通用轉換工具 (已實作)
```typescript
// 欄位映射配置 (已實作於 src/utils/transform.ts)
export const contentFeaturesMappings = {
  wellStructured: 'well_structured',
  practiceFocused: 'practice_focused',
  wellRoundedConcepts: 'well_rounded_concepts',
  thoughtProvoking: 'thought_provoking',
  progressiveLearning: 'progressive_learning',
  problemBased: 'problem_based',
  realWorldExamples: 'real_world_examples',
  interactive: 'interactive',
  visuallyRich: 'visually_rich'
} as const;

// 通用轉換函數 (已實作)
export function objectToBooleanFields<T, M>(
  obj: T | undefined,
  mappings: M
): Record<string, boolean> {
  // 完整實作邏輯...
}

export function booleanFieldsToObject<M>(
  dbRecord: Record<string, any>,
  mappings: M
): Record<keyof M, boolean> {
  // 完整實作邏輯...
}
```

## 🔧 開發工具與設置

### 開發指令 (已配置)
根據 CLAUDE.md 文件，專案已配置完整的開發指令：

#### TypeScript 相關指令
```bash
npm run typecheck       # TypeScript 型別檢查
npm run lint           # ESLint 程式碼檢查
npm run lint:fix       # 自動修復 ESLint 問題
tsc --noEmit          # 直接執行型別檢查
ts-node src/index.ts  # 直接執行 TypeScript 檔案
```

#### 測試指令
```bash
npm test              # 執行 Jest 測試
npm run test:paths    # 使用 NODE_PATH=src 執行測試
```

#### 服務啟動
```bash
npm start            # 生產環境伺服器
npm run dev          # 開發環境 (nodemon)
```

### 專案配置檔案

#### TypeScript 配置 (`tsconfig.json`)
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "strict": true,
    "baseUrl": "./",
    "paths": {
      "@/*": ["src/*"],
      "@types/*": ["src/types/*"],
      "@services/*": ["src/services/*"]
    }
  }
}
```

#### Jest 測試配置 (`config/jest.config.js`)
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1'
  }
};
```

### 開發最佳實踐

#### 1. 程式碼風格
- 使用 **factory functions** 和 **object literals** 取代 classes
- 偏好 **const objects with `as const`** 取代 enums
- 使用 **Zod schemas** 進行驗證和型別推斷
- 遵循 **函數式程式設計** 原則

#### 2. 錯誤處理
```typescript
// 標準化錯誤回應格式 (已實作)
export const createErrorResponse = (
  message: string,
  code?: string,
  details?: unknown
): ErrorResponse => ({
  success: false,
  error: { message, code, details }
});

// Async wrapper for route handlers (已實作)
export const asyncHandler = (fn: AsyncRouteHandler) => 
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
```

#### 3. 資料庫存取模式
```typescript
// 依賴注入模式 (已實作於 services)
export const createResourceService = (models: Models) => ({
  async findAll(options: FindOptions) {
    return await models.Resource.findAll(options);
  },
  
  async create(data: CreateResourceData) {
    return await models.Resource.create(data);
  }
  
  // ... 其他方法
});
```

## 🎯 新功能開發指南

### API 開發流程

#### 1. 新增 API 端點的標準流程
```typescript
// 1. 定義型別 (src/types/新功能.types.ts)
export interface NewFeatureRequest {
  name: string;
  description: string;
}

// 2. 建立 Zod 驗證器 (src/validators/新功能.validators.ts)
export const createNewFeatureSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().min(1)
});

// 3. 建立 Sequelize 模型 (src/models/新功能.ts)
export const NewFeature = sequelize.define('NewFeature', {
  // 模型定義...
});

// 4. 建立服務層 (src/services/新功能.service.ts)
export const createNewFeatureService = (models: Models) => ({
  // 服務邏輯...
});

// 5. 建立控制器 (src/controllers/新功能.controller.ts)
export const createNewFeatureController = (service: NewFeatureService) => ({
  // 控制器邏輯...
});

// 6. 定義路由 (src/routes/新功能.routes.ts)
export const createNewFeatureRoutes = (controller: NewFeatureController) => {
  // 路由定義...
};

// 7. 建立 Swagger 文件 (src/swagger/)
// - paths/新功能.paths.ts
// - schemas/新功能.schemas.ts
```

#### 2. 測試開發
```typescript
// src/tests/新功能.test.ts
describe('新功能 API', () => {
  test('應該能夠建立新功能', async () => {
    // 測試邏輯...
  });
});
```

### 整合至主系統

#### 在 `src/app.ts` 中註冊新路由
```typescript
// 載入新功能路由
import { createNewFeatureRoutes } from '@/routes/新功能.routes';

// 註冊路由
app.use('/api/v1/新功能', createNewFeatureRoutes(newFeatureController));
```

## 📊 專案現況總結

### 已完成功能 ✅
- **資源管理系統**：完整 CRUD + 篩選分頁
- **評價系統**：複雜評分機制 + Boolean 轉物件
- **標籤系統**：多對多關係 + 統計功能
- **型別系統**：Zod 驗證 + TypeScript 型別推斷
- **資料轉換**：通用 Boolean 欄位轉換工具
- **API 文件**：Swagger 自動生成與整合
- **測試框架**：Jest + TypeScript 支援

### 技術架構特色 🏗️
- **混合式架構**：JavaScript 舊系統 + TypeScript 新系統
- **型別安全**：端到端 TypeScript 型別檢查
- **函數式設計**：factory functions + object literals
- **依賴注入**：模組化服務層設計
- **標準化回應**：統一 API 回應格式
- **資料轉換**：複雜 Boolean 欄位自動轉換

### 開發優勢 💪
- **漸進式遷移**：可逐步將 JavaScript 功能遷移至 TypeScript
- **型別推斷**：Zod schema 自動產生 TypeScript 型別
- **開發體驗**：完整的 TypeScript 工具鏈與 IDE 支援
- **測試覆蓋**：Jest 測試框架整合
- **文件自動化**：Swagger 文件與程式碼同步

### 擴展性設計 🚀
- **模組化架構**：新功能可獨立開發測試
- **標準化模式**：統一的開發模式可快速複製
- **資料庫抽象**：Sequelize ORM 支援多種資料庫
- **API 版本控制**：`/api/v1/` 路徑預留版本升級空間

## 📚 相關文件參考

- **CLAUDE.md**：專案開發指引與指令說明
- **src/swagger/**：完整 API 文件結構
- **src/types/**：TypeScript 型別定義參考
- **src/validators/**：Zod 驗證 schema 範例
- **config/jest.config.js**：測試設定檔
- **init-scripts/**：完整資料庫架構 SQL 腳本

## 🎯 API 端點統計總覽

### JavaScript 系統 API 統計
- **認證系統**: 2 個端點
- **用戶管理**: 8 個端點
- **專案管理**: 32+ 個端點（含里程碑、任務、筆記、成果、反思）
- **馬拉松系統**: 5 個端點
- **導師系統**: 8 個端點
- **社群功能**: 12 個端點（揪團 + 想法）
- **留言系統**: 4 個端點
- **檔案系統**: 6 個端點（圖片 + 電郵）
- **監控系統**: 4 個端點
- **總計**: 80+ 個 REST API 端點

### TypeScript 系統 API 統計
- **健康檢查**: 3 個端點
- **資源管理**: 7 個端點
- **評價系統**: 8 個端點（含按讚功能）
- **標籤系統**: 6 個端點
- **總計**: 24 個現代化 API 端點

### 資料庫規模統計
- **總表數**: 54 張主要資料表
- **ENUM 類型**: 30+ 個自訂列舉
- **索引數量**: 100+ 個策略性索引
- **關聯約束**: 200+ 個外鍵關係
- **預設資料**: 
  - 278 個國家
  - 30 個台灣城市
  - 17 個主要分類 + 100+ 子分類
  - 16 個偏好維度 + 160+ 偏好選項

### 技術架構特色
- **混合架構**: JavaScript 舊系統 + TypeScript 新系統並存
- **API 版本控制**: 支援 v1 版本控制，預留升級空間
- **認證機制**: JWT + Google OAuth + 角色權限系統
- **檔案儲存**: Cloudflare R2 整合
- **多資料庫**: PostgreSQL + MongoDB + Redis
- **限流保護**: 全域 1000 req/min + 特殊端點 60 req/min
- **文件自動化**: Swagger/OpenAPI 自動生成
- **型別安全**: 端到端 TypeScript 型別檢查

---

**本文件反映了 DaoDao Server 當前完整的 API 設計與資料庫架構實況，為後續開發與系統擴展提供全面的技術參考指引。** 🎯
