# API 回應格式標準化任務清單

基於 `SERVICE_RESPONSE_FORMATS.md` 的深度分析，本文件列出完整的 API 回應格式統一化任務。

## 📊 現況分析摘要

- **服務總數**: 20 個核心服務
- **分頁格式**: 6 種不同實作方式  
- **錯誤處理**: 3 種不同方式 (38個標準化 vs 27個一般錯誤)
- **回應格式**: 混亂不統一，影響前端開發效率

## 🎯 **執行進度總覽** (2025-08-30 更新)

### ✅ **已完成階段**:
- **Phase 1**: 基礎介面定義 (5個任務) - **100% 完成**
- **Phase 2**: 工具函數實作 (5個任務) - **100% 完成** 
- **Phase 3**: 中間件整合 (1個任務) - **100% 完成**

### 📈 **完成統計**:
- **已完成任務**: 23/41 個主要任務 ✅
- **基礎建設完成度**: 100% ✅
- **Phase 4 進度**: 12/15 個任務已完成 (80.0%)
- **實際耗時**: 11.7 小時 (預估 7-10 小時)
- **下一階段**: 完成 Phase 4 - Practice 控制器遷移

### 🛠 **已建立的基礎設施**:
1. **統一類型系統** - 完整的 API 回應介面 ✅
2. **工具函數庫** - 標準化回應建構器 ✅
3. **中間件整合** - 自動化元資料注入 ✅
4. **錯誤處理** - 統一格式錯誤回應 ✅
5. **核心服務遷移** - UserService, CommentService, AuthService, ResourceService, ResourceReviewService, Practice 系列服務 (4個) 及其 Controllers 已完成 🆕

## 🎯 統一目標

採用 **雙重分頁策略**：

- **頁碼分頁**: 基於 PracticeService 的 `ApiResponse<T>` 格式 (大多數服務)
- **游標分頁**: 保留 ResourceService 現有格式但增加標準包裝 (高性能場景)

---

## Phase 1: 基礎介面定義 (2-3 小時) ✅ **已完成**

### ✅ TASK-001: 建立標準回應介面 - **已完成**

- **檔案**: `src/types/api-response.types.ts` ✅
- **描述**: 定義統一的 API 回應介面 ✅
- **完成時間**: 2025-08-30
- **狀態**: ✅ 已實作所有基礎回應介面

已創建以下介面：
- `ApiSuccessResponse<T>` - 成功回應格式
- `ApiErrorResponse` - 錯誤回應格式
- `ApiResponse<T>` - 統一回應類型
- `PaginationInfo` - 分頁資訊介面
- `CursorPaginationInfo` - 游標分頁介面
- `ResponseMeta` - 回應元資料介面

- **優先級**: P0 - 緊急
- **實際時間**: 30 分鐘

### 完整回應格式範例

#### ✅ 成功回應範例

```typescript
// 1. 基本資料查詢成功
{
  success: true,
  data: {
    id: 123,
    name: "實踐項目",
    status: "active"
  },
  timestamp: "2024-01-15T10:30:00Z",
  meta: {
    requestId: "req_abc123",
    processingTime: 15
  }
}

// 2. 分頁資料查詢成功
{
  success: true,
  data: [...practices],
  timestamp: "2024-01-15T10:30:00Z",
  meta: {
    requestId: "req_def456",
    searchTime: 23,
    cacheHit: false
  }
}
```

#### ❌ 錯誤回應範例

```typescript
// 1. 請求錯誤 (400)
{
  success: false,
  data: null,
  error: {
    code: "BAD_REQUEST",
    message: "請求參數驗證失敗",
    details: {
      email: "電子郵件格式不正確",
      password: "密碼長度至少 8 個字符"
    }
  },
  timestamp: "2024-01-15T10:30:00Z",
  meta: {
    requestId: "req_abc123",
    processingTime: 15
  }
}

// 2. 未認證 (401)
{
  success: false,
  data: null,
  error: {
    code: "UNAUTHORIZED",
    message: "請先登入"
  },
  timestamp: "2024-01-15T10:30:00Z",
  meta: {
    requestId: "req_jkl012",
    processingTime: 5
  }
}

// 3. 權限不足 (403)
{
  success: false,
  data: null,
  error: {
    code: "FORBIDDEN",
    message: "無權限執行此操作"
  },
  timestamp: "2024-01-15T10:30:00Z",
  meta: {
    requestId: "req_ghi789",
    processingTime: 12
  }
}

// 4. 資源不存在 (404)
{
  success: false,
  data: null,
  error: {
    code: "NOT_FOUND",
    message: "找不到指定的資源"
  },
  timestamp: "2024-01-15T10:30:00Z",
  meta: {
    requestId: "req_def456",
    processingTime: 8
  }
}

// 5. 資源衝突 (409)
{
  success: false,
  data: null,
  error: {
    code: "CONFLICT",
    message: "此電子郵件已被使用",
    details: {
      email: "user@example.com 已存在於系統中"
    }
  },
  timestamp: "2024-01-15T10:30:00Z",
  meta: {
    requestId: "req_mno345",
    processingTime: 25
  }
}

// 6. 業務邏輯錯誤 (422)
{
  success: false,
  data: null,
  error: {
    code: "UNPROCESSABLE_ENTITY",
    message: "無法處理請求的實體",
    details: {
      balance: "餘額不足，無法執行此操作",
      status: "帳戶已被停用"
    }
  },
  timestamp: "2024-01-15T10:30:00Z",
  meta: {
    requestId: "req_vwx234",
    processingTime: 18
  }
}

// 7. 請求頻率限制 (429)
{
  success: false,
  data: null,
  error: {
    code: "TOO_MANY_REQUESTS",
    message: "請求過於頻繁，請稍後再試",
    details: {
      retryAfter: "60",
      limit: "100 requests per minute"
    }
  },
  timestamp: "2024-01-15T10:30:00Z",
  meta: {
    requestId: "req_stu901",
    processingTime: 3
  }
}

// 8. 伺服器內部錯誤 (500)
{
  success: false,
  data: null,
  error: {
    code: "INTERNAL_SERVER_ERROR",
    message: "伺服器發生未預期的錯誤"
  },
  timestamp: "2024-01-15T10:30:00Z",
  meta: {
    requestId: "req_pqr678",
    processingTime: 1200
  }
}
```

### ✅ TASK-002: 定義分頁回應介面 - **已完成**

- **檔案**: `src/types/api-response.types.ts` ✅
- **描述**: 創建分頁專用介面 ✅
- **完成時間**: 2025-08-30
- **狀態**: ✅ 已實作所有分頁介面

已創建以下介面：
- `PaginatedApiResponse<T>` - 頁碼分頁回應
- `CursorPaginatedApiResponse<T>` - 游標分頁回應  
- `PaginatedResponse<T>` - 分頁 Union 類型
- `CursorPaginatedResponse<T>` - 游標分頁 Union 類型

- **優先級**: P0 - 緊急  
- **實際時間**: 15 分鐘

### ✅ TASK-003: 定義 Meta 欄位介面 - **已完成**

- **檔案**: `src/types/api-response.types.ts` ✅
- **描述**: 支援搜尋、統計、偵錯等擴展資訊 ✅
- **完成時間**: 2025-08-30
- **狀態**: ✅ 已在 TASK-001 中一併完成

已實作 `ResponseMeta` 介面，支援：
- 搜尋相關欄位 (searchQuery, searchTime, filters)
- 統計資訊 (categoryCounts, aggregateData)
- 系統資訊 (requestId, cacheHit, processingTime)
- 擴展欄位支援

- **優先級**: P1 - 高
- **實際時間**: 已包含在 TASK-001 中

### ✅ TASK-004: 擴展 Express Request 介面 - **已完成**

- **檔案**: `src/types/express.d.ts` ✅
- **描述**: 為中間件添加必要的屬性定義 ✅
- **完成時間**: 2025-08-30
- **狀態**: ✅ 已擴展 Express Request 介面

已添加屬性：
- `startTime?: number` - 請求開始時間
- `requestId?: string` - 請求唯一識別碼

- **優先級**: P0 - 緊急
- **實際時間**: 5 分鐘

### ✅ TASK-005: 更新類型匯出 - **已完成**

- **檔案**: `src/types/index.ts` ✅
- **描述**: 統一匯出所有新定義的介面 ✅
- **完成時間**: 2025-08-30
- **狀態**: ✅ 已使用明確匯出避免型別衝突

已匯出所有新介面：
- API 回應格式類型 (ApiResponse, ApiSuccessResponse, ApiErrorResponse)
- 分頁相關類型 (PaginatedResponse, CursorPaginatedResponse)
- 工具類型 (PaginationInfo, CursorPaginationInfo, ResponseMeta)

- **優先級**: P1 - 高
- **實際時間**: 10 分鐘

---

## Phase 2: 工具函數實作 (3-4 小時) ✅ **已完成**

### ✅ TASK-006: 建立回應工具函數 - **已完成**

- **檔案**: `src/utils/response-helper.ts` ✅
- **描述**: 實作標準回應建構函數 ✅
- **完成時間**: 2025-08-30
- **狀態**: ✅ 已實作所有回應建構函數

已實作工具函數：
- `createSuccessResponse<T>()` - 標準成功回應
- `createPaginatedResponse<T>()` - 分頁回應
- `createCursorPaginatedResponse<T>()` - 游標分頁回應
- `createErrorResponse()` - 錯誤回應
- `createErrorFromAppError()` - 從 AppError 建立錯誤回應

- **優先級**: P0 - 緊急
- **實際時間**: 45 分鐘

### ✅ TASK-007: 建立 RequestID 生成工具 - **已完成**

- **檔案**: `src/utils/request-id.ts` ✅
- **描述**: 生成唯一請求識別碼的工具函數 ✅
- **完成時間**: 2025-08-30
- **狀態**: ✅ 已實作 RequestID 相關工具

已實作工具函數：
- `generateRequestId()` - 生成格式化唯一 ID (req_<12chars>)
- `extractRequestId()` - 從 Request 提取或生成 RequestID

支援多種來源：
- `req.requestId` (優先)
- `x-request-id` header
- 自動生成 (fallback)

- **優先級**: P0 - 緊急
- **實際時間**: 15 分鐘

### ✅ TASK-008: 更新現有錯誤中間件以支援新的回應格式 - **已完成**

- **檔案**: `src/middleware/error.middleware.ts` ✅
- **描述**: 修改現有的 `globalErrorHandler` 以配合新的標準回應格式 ✅
- **完成時間**: 2025-08-30
- **狀態**: ✅ 已更新錯誤中間件格式

主要變更：
- 使用 `ApiErrorResponse` 介面
- 新增 `data: null` 欄位統一格式
- 移除 `error.type` 欄位
- 整合 `requestId` 和 `processingTime`
- 保持現有錯誤分類邏輯

- **優先級**: P0 - 緊急
- **實際時間**: 30 分鐘

### ✅ TASK-009: 建立錯誤回應工具 - **已完成**

- **檔案**: `src/utils/response-helper.ts` ✅
- **描述**: 統一錯誤回應格式 ✅
- **完成時間**: 2025-08-30
- **狀態**: ✅ 已在 TASK-006 中一併完成

已實作錯誤工具：
- `createErrorResponse()` - 標準錯誤回應建構器
- `createErrorFromAppError()` - AppError 轉換器
- 支援標準錯誤代碼映射 (BAD_REQUEST, UNAUTHORIZED 等)

- **優先級**: P0 - 緊急
- **實際時間**: 已包含在 TASK-006 中

### ✅ TASK-010: 建立分頁工具函數 - **已完成**

- **檔案**: `src/utils/pagination-helper.ts` ✅
- **描述**: 計算分頁資訊的工具函數 ✅
- **完成時間**: 2025-08-30
- **狀態**: ✅ 已實作分頁計算工具

已實作工具函數：
- `calculatePagination()` - 計算頁碼分頁資訊
- `createCursorInfo()` - 建立游標分頁資訊
- 支援自訂游標欄位 (預設為 'id')
- 自動 base64 編碼游標值

- **優先級**: P1 - 高
- **實際時間**: 20 分鐘

---

## Phase 3: 中間件整合 (2-3 小時) ✅ **已完成**

### ✅ TASK-011: 建立中間件整合 - **已完成**

- **檔案**: `src/middleware/response-enhancer.ts` ✅
- **描述**: 自動注入 requestId、timestamp、processingTime ✅
- **完成時間**: 2025-08-30
- **狀態**: ✅ 已實作回應增強中間件

功能特點：
- 自動設定請求開始時間和 RequestID
- 攔截 `res.json` 方法自動注入元資料
- 僅增強標準格式回應 (包含 `success` 欄位)
- 計算並注入請求處理時間
- 保持與現有程式碼相容性

已實作功能：
- `responseEnhancerMiddleware` - 主要中間件函數
- 自動 RequestID 提取和設定
- 回應時間戳記自動生成
- 處理時間自動計算

- **優先級**: P0 - 緊急
- **實際時間**: 25 分鐘
- **依賴**: TASK-004 ✅, TASK-007 ✅

### TASK-012: 標準化服務錯誤處理

- **影響檔案**: 27 個使用一般錯誤的服務檔案
  - `practice.service.ts`
  - `practice-checkin.service.ts`
  - `practice-interaction.service.ts`
  - `practice-event.service.ts`
  - `me.service.ts`
  - `r2.service.ts`
  - `jwt.service.ts`
  - `email/email.service.ts`
  - 等等...
- **描述**: 將一般 `throw new Error()` 改用結構化錯誤類
- **優先級**: P1 - 高
- **預估**: 3 小時

---

## Phase 4: 服務遷移 - 高優先級 (16-20 小時)

### ✅ TASK-013: 遷移 UserService ⭐ 最高優先級 - **已完成**

- **檔案**: `src/services/user.service.ts` ✅
- **目前格式**: `{data: T[], page, pageSize, totalCount, totalPages}` → **已更新**
- **目標格式**: `PaginatedApiResponse<FormattedUserResponse>` ✅
- **理由**: 核心服務，管理後台性質，使用頻率最高
- **優先級**: P0 - 緊急
- **預估**: 2.5 小時
- **完成時間**: 2025-08-30
- **實際時間**: 1 小時
- **狀態**: ✅ 已完成所有方法遷移，使用 PaginatedApiResponse 和 createPaginatedResponse

### ✅ TASK-014: 更新 UserService 控制器 - **已完成**

- **檔案**: `src/controllers/user.controller.ts` ✅
- **描述**: 配合 UserService 遷移，更新控制器為統一模式 ✅
- **標準模式**: ✅

  ```typescript
  export const getUsersController = asyncHandler(async (req: Request, res: Response) => {
    const result = await UserService.getUsers(req.query);
    res.json(result); // 直接透傳結果
  });
  ```

- **優先級**: P0 - 緊急
- **預估**: 1.5 小時
- **完成時間**: 2025-08-30
- **實際時間**: 30 分鐘
- **依賴**: TASK-013 ✅
- **狀態**: ✅ 已完成所有控制器方法更新，使用直接透傳模式

### ✅ TASK-015: 遷移 CommentService - **已完成**

- **檔案**: `src/services/comment.service.ts` ✅
- **目前格式**: 直接回傳 `CommentResponse` 或 `{message: string}` → **已更新**
- **目標格式**: `ApiResponse<CommentResponse>` ✅
- **理由**: 評論系統需要統一錯誤處理
- **優先級**: P0 - 緊急
- **預估**: 2 小時
- **完成時間**: 2025-08-30
- **實際時間**: 45 分鐘
- **狀態**: ✅ 已完成所有方法遷移，使用 createSuccessResponse 和 meta 資訊

### ✅ TASK-016: 更新 CommentService 控制器 - **已完成**

- **檔案**: `src/controllers/comment.controller.ts` ✅
- **描述**: 配合 CommentService 遷移，簡化控制器邏輯 ✅
- **優先級**: P0 - 緊急
- **預估**: 1 小時
- **完成時間**: 2025-08-30
- **實際時間**: 15 分鐘
- **依賴**: TASK-015 ✅
- **狀態**: ✅ 已完成所有控制器方法更新，使用直接透傳模式

### ✅ TASK-017: 遷移 AuthService - **已完成**

- **檔案**: `src/services/auth/auth.service.ts` ✅
- **目前格式**: 直接回傳 Prisma 物件或 `null` → **已更新**
- **目標格式**: `ApiResponse<T>` ✅
- **理由**: 認證核心，需要標準錯誤處理
- **優先級**: P0 - 緊急
- **預估**: 2 小時
- **完成時間**: 2025-08-30
- **實際時間**: 1.5 小時
- **狀態**: ✅ 已完成所有方法遷移，使用 ApiResponse 和 createSuccessResponse

### ✅ TASK-018: 更新 AuthService 控制器 - **已完成**

- **檔案**: `src/controllers/auth.controller.ts` ✅
- **描述**: 配合 AuthService 遷移，統一認證相關端點回應格式 ✅
- **優先級**: P0 - 緊急
- **預估**: 1 小時
- **完成時間**: 2025-08-30
- **實際時間**: 45 分鐘
- **依賴**: TASK-017 ✅
- **狀態**: ✅ 已完成所有控制器方法更新，適配 ApiResponse 回應格式

### ✅ TASK-019: 包裝 ResourceService (保留游標分頁) - **已完成**

- **檔案**: `src/services/resource.service.ts` ✅
- **目前格式**: `{resources: T[], pagination: {...}}` → **已更新**
- **目標格式**: `CursorPaginatedApiResponse<ResourceResponse>` ✅
- **理由**: 保留高性能游標分頁，但增加標準包裝
- **優先級**: P1 - 高
- **預估**: 2 小時
- **完成時間**: 2025-08-30
- **實際時間**: 1.5 小時
- **特殊處理**: 不改變分頁邏輯，只包裝回應格式 ✅
- **狀態**: ✅ 已完成所有方法遷移，使用 CursorPaginatedApiResponse 和相關工具函數

### ✅ TASK-020: 更新 ResourceService 控制器 - **已完成**

- **檔案**: `src/controllers/resource.controller.ts` ✅
- **描述**: 配合 ResourceService 遷移，保持游標分頁功能 ✅
- **優先級**: P1 - 高
- **預估**: 1 小時
- **完成時間**: 2025-08-30
- **實際時間**: 30 分鐘
- **依賴**: TASK-019 ✅
- **狀態**: ✅ 已完成所有控制器方法更新，使用直接透傳模式

### ✅ TASK-021: 遷移 ResourceReviewService - **已完成**

- **檔案**: `src/services/resource-review.service.ts` ✅
- **目前格式**: 直接回傳物件或包裝物件 → **已更新**
- **目標格式**: `ApiResponse<ResourceReviewResponse>` 和 `CursorPaginatedApiResponse<ResourceReviewResponse>` ✅
- **理由**: 資源評審是核心功能，需要統一回應格式
- **優先級**: P0 - 緊急
- **預估**: 2 小時
- **完成時間**: 2025-08-30
- **實際時間**: 1.5 小時
- **狀態**: ✅ 已完成所有方法遷移，使用 ApiResponse 和 CursorPaginatedApiResponse

### ✅ TASK-022: 更新 ResourceReviewService 控制器 - **已完成**

- **檔案**: `src/controllers/resource-review.controller.ts` ✅
- **描述**: 配合 ResourceReviewService 遷移，使用直接透傳模式 ✅
- **優先級**: P0 - 緊急
- **預估**: 1 小時
- **完成時間**: 2025-08-30
- **實際時間**: 30 分鐘
- **依賴**: TASK-021 ✅
- **狀態**: ✅ 已完成所有控制器方法更新，使用直接透傳模式

### ✅ TASK-023: 遷移 Practice 系列服務 - **已完成**

- **檔案**:
  - `src/services/practice.service.ts` ✅
  - `src/services/practice-checkin.service.ts` ✅
  - `src/services/practice-event.service.ts` ✅
  - `src/services/practice-interaction.service.ts` ✅
- **目前格式**: 自定義 `ApiResponse<T>` 類型 → **已更新**
- **目標格式**: `PaginatedApiResponse<T>` 和 `ApiSuccessResponse<T>` ✅
- **理由**: 實踐系統是核心功能，需要統一處理
- **優先級**: P0 - 緊急
- **預估**: 4 小時 (每個服務約1小時)
- **完成時間**: 2025-08-30
- **實際時間**: 2.5 小時
- **狀態**: ✅ 已完成所有 4 個服務遷移，使用統一 API 回應格式

#### 具體遷移內容：
- **practice.service.ts**: 使用 `PaginatedApiResponse` (列表) 和 `ApiSuccessResponse` (單項)
- **practice-checkin.service.ts**: 使用 `PaginatedApiResponse` (簽到列表) 和 `ApiSuccessResponse` (操作)
- **practice-event.service.ts**: 使用 `ApiSuccessResponse` (事件記錄)
- **practice-interaction.service.ts**: 使用 `ApiSuccessResponse` (互動操作)

### ✅ TASK-024: 更新 Practice 系列控制器 - **已完成**

- **檔案**: `src/controllers/practice.controller.ts` ✅ 
- **描述**: 配合 Practice 系列服務遷移，更新為直接透傳模式 ✅
- **優先級**: P0 - 緊急
- **預估**: 2 小時
- **完成時間**: 2025-08-30
- **實際時間**: 1 小時
- **依賴**: TASK-023 ✅
- **狀態**: ✅ Practice 控制器已更新為使用 asyncHandler 和直接透傳模式

#### 控制器遷移內容：
- **移除舊模式**: 不再檢查 `result.success` 和重新包裝回應
- **使用 asyncHandler**: 統一錯誤處理模式
- **直接透傳**: 服務層回應直接透過 `res.json(result)`
- **簡化邏輯**: 移除重複的錯誤處理代碼

---

## Phase 5: 服務遷移 - 中優先級 (10-12 小時)

### TASK-025: 遷移 IdeaService (函數改 Class)

- **檔案**: `src/services/idea.service.ts`
- **目前格式**: 函數導出 + 自定義分頁
- **目標格式**: Class + `PaginatedApiResponse<IdeaEntity>`
- **理由**: 函數導出不利於維護，需要 Class 化
- **優先級**: P1 - 高
- **預估**: 2.5 小時

### TASK-026: 更新 IdeaService 控制器

- **檔案**: 相關 Idea 控制器檔案
- **描述**: 配合 IdeaService Class 化，更新控制器調用方式
- **優先級**: P1 - 高
- **預估**: 1 小時
- **依賴**: TASK-025

### TASK-027: 遷移 MeService

- **檔案**: `src/services/me.service.ts`
- **目前格式**: `{success: boolean, data: T, pagination?, stats?}`
- **目標格式**: `PaginatedApiResponse<T>` (移除 stats 到 meta)
- **理由**: 接近標準格式，微調即可
- **優先級**: P1 - 高
- **預估**: 1.5 小時

### TASK-028: 更新 MeService 控制器

- **檔案**: `src/controllers/me.controller.ts`
- **描述**: 配合 MeService 遷移，統一個人中心相關端點
- **優先級**: P1 - 高
- **預估**: 1 小時
- **依賴**: TASK-027

### TASK-029: 遷移 ServiceResult 格式服務

- **影響檔案**: 6 個服務檔案
  - `src/services/review.service.ts` → `ReviewServiceResult<T>` 改為 `ApiResponse<T>`
  - `src/services/mentor.service.ts` → `MentorServiceResult<T>` 改為 `ApiResponse<T>`
  - `src/services/note.service.ts` → `NoteServiceResult<T>` 改為 `PaginatedApiResponse<T>`
  - `src/services/outcome.service.ts` → `OutcomeServiceResult<T>` 改為 `PaginatedApiResponse<T>`
  - `src/services/milestone.service.ts` → `MilestoneServiceResult<T>` 改為 `ApiResponse<T>`
  - `src/services/project.service.ts` → `ProjectServiceResult<T>` 改為 `ApiResponse<T>`
- **優先級**: P2 - 中
- **預估**: 3 小時 (每個約 30 分鐘)

### TASK-030: 更新 ServiceResult 格式服務的控制器

- **影響檔案**: 對應的 6 個控制器檔案
- **描述**: 批量更新相關控制器，配合服務遷移
- **優先級**: P2 - 中
- **預估**: 2 小時
- **依賴**: TASK-029

---

## Phase 6: 工具性服務優化 (5-6 小時)

### TASK-031: 包裝 TagService

- **檔案**: `src/services/tag.service.ts`
- **目前格式**: 直接回傳 Prisma 物件
- **目標格式**: `ApiResponse<Tag[]>`
- **理由**: 工具性服務，增加基本錯誤處理
- **優先級**: P2 - 中
- **預估**: 1 小時

### TASK-032: 包裝 R2Service

- **檔案**: `src/services/r2.service.ts`  
- **目前格式**: 直接回傳 `string` 或拋出錯誤
- **目標格式**: `ApiResponse<{url: string}>`
- **理由**: 檔案上傳服務需要統一回應
- **優先級**: P2 - 中
- **預估**: 1 小時

### TASK-033: 優化 EmailService 系列

- **檔案**:
  - `src/services/email/email.service.ts`
  - `src/services/email/enhanced-email.service.ts`
  - `src/services/email/template.service.ts`
- **目前格式**: `Promise<void>` 或 `{success: boolean}`
- **目標格式**: `ApiResponse<{messageId?: string}>`
- **理由**: 郵件服務需要統一成功/失敗回應
- **優先級**: P3 - 低
- **預估**: 2 小時 (3個服務)

### TASK-034: 包裝 OAuth 服務（部分方法）

- **檔案**: `src/services/auth/oauth.service.ts`
- **目前格式**: 混合格式（部分返回用戶數據，部分返回令牌）
- **目標格式**: 用戶相關方法使用 `ApiResponse<UserData>`，令牌相關保持原格式
- **理由**: 僅對外部 API 調用相關方法標準化
- **優先級**: P3 - 低
- **預估**: 1 小時

### ⚠️ **排除的服務**（不適用 ApiResponse）

以下服務為純工具函數或基礎設施，**不需要**包裝為 `ApiResponse` 格式：

- **工具函數**: `jwt.service.ts`, `id-converter.service.ts`, `transform.service.ts`
- **權限檢查**: `auth/permission.service.ts`
- **模板渲染**: `email/template.service.ts`
- **基礎設施**: `database/*.service.ts`, `logging/logger.service.ts`

這些服務維持現有格式，專注於內部功能而非 API 回應。

---

## Phase 7: 測試與驗證 (4-5 小時)

### TASK-036: 建立回應工具測試

- **檔案**: `tests/unit/utils/response-helper.test.ts`
- **描述**: 測試所有回應建構函數
- **優先級**: P1 - 高
- **預估**: 2 小時

### TASK-037: 建立分頁工具測試  

- **檔案**: `tests/unit/utils/pagination-helper.test.ts`
- **描述**: 測試分頁計算邏輯
- **優先級**: P1 - 高
- **預估**: 1 小時

### TASK-038: 整合測試驗證

- **檔案**: `tests/integration/api-response-format.test.ts`
- **描述**: 驗證所有 API 端點回應格式一致性
- **優先級**: P1 - 高
- **預估**: 2 小時

---

## Phase 8: 文檔與最終化 (2-3 小時)

### TASK-039: 更新 CLAUDE.md

- **檔案**: `CLAUDE.md`
- **描述**: 更新專案說明，記錄新的 API 回應格式標準
- **優先級**: P1 - 高
- **預估**: 30 分鐘

### TASK-040: 建立 API 回應格式文檔

- **檔案**: `docs/API_RESPONSE_FORMAT_GUIDE.md`
- **描述**: 詳細說明標準格式使用方式和範例
- **優先級**: P2 - 中
- **預估**: 1 小時

### TASK-041: Swagger 文檔同步更新

- **影響檔案**: 所有 `src/swagger/schemas/*.ts` 檔案
- **描述**: API 格式改變需要更新 OpenAPI 定義
- **優先級**: P1 - 高
- **預估**: 2 小時

---

## 📋 執行時程表

### Week 1: 基礎建設 (P0 任務)

- **Day 1-2**: Phase 1 + Phase 2 (介面定義 + 工具函數)
- **Day 3**: Phase 3 (錯誤處理標準化)  
- **Day 4**: TASK-013~014 (UserService + Controller) ✅ **已完成**
- **Day 5**: TASK-015~016 (CommentService + Controller) ✅ **已完成**

### Week 2: 核心服務遷移 (P0-P1 任務)

- **Day 1**: TASK-017~018 (AuthService + Controller)
- **Day 2**: TASK-019~020 (ResourceService + Controller)
- **Day 3**: TASK-021~022 (ResourceReviewService + Controller)
- **Day 4**: TASK-023~024 (Practice 系列服務 + Controllers)
- **Day 5**: TASK-025~026 (IdeaService + Controller)

### Week 3: 中優先級服務遷移 (P1-P2 任務)

- **Day 1**: TASK-027~028 (MeService + Controller)
- **Day 2**: TASK-029~030 (ServiceResult 格式服務 + Controllers)
- **Day 3**: Phase 6 前半部分 (TASK-031~033)
- **Day 4**: Phase 6 後半部分 (TASK-034~035)
- **Day 5**: Phase 7 核心測試

### Week 4: 測試與文檔

- **Day 1-2**: 完成所有測試驗證
- **Day 3-4**: 文檔更新
- **Day 5**: 最終驗收和部署準備

## 📊 風險評估與緩解策略

### 🔴 高風險任務

- **TASK-013~014 (UserService + Controller)**: 核心服務，影響面廣
  - **緩解**: 詳細測試覆蓋，分階段部署，Service-Controller 成對遷移
- **TASK-019~020 (ResourceService + Controller)**: 高性能要求
  - **緩解**: 保留現有分頁邏輯，只包裝格式
- **TASK-023~024 (Practice 系列服務)**: 4個相關服務，影響實踐系統
  - **緩解**: 分批遷移，每完成一個立即測試

### 🟡 中風險任務

- **TASK-025~026 (IdeaService + Controller)**: 函數改 Class，結構變化大
  - **緩解**: 先寫完整測試，再進行重構，同步更新控制器
- **Phase 6 工具性服務**: 涉及10個服務，覆蓋面廣
  - **緩解**: 按優先級分批處理，P3服務可後置
- **Phase 3 錯誤處理**: 影響所有服務
  - **緩解**: 逐個服務測試，確保向後相容

## ✅ 成功指標

1. **統一性**: 所有 API 回應格式符合標準
2. **性能**: ResourceService 性能不下降  
3. **測試覆蓋**: 新增工具函數達到 90% 覆蓋率
4. **文檔完整**: 開發者可依據文檔快速上手
5. **前端友好**: 前端可統一處理所有 API 回應

## 🚨 **統一 Service-Controller 模式** (整合至各 Phase)

已將控制器更新整合到各個服務遷移任務中，採用成對遷移策略：

### 標準模式範例

```typescript
// ✅ Service 層
export const getUserById = async (id: string): Promise<ApiSuccessResponse<User>> => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new NotFoundError('用戶不存在'); // 錯誤中間件處理
  }
  
  return {
    success: true,
    data: user,
    timestamp: new Date().toISOString()
  };
};

// ✅ Controller 層
export const getUserController = asyncHandler(async (req: Request, res: Response) => {
  const result = await UserService.getUserById(req.params.id);
  res.json(result); // 直接透傳，錯誤由 asyncHandler + globalErrorHandler 處理
});
```

### 設計優勢

- **Service-Controller 成對遷移**: 避免中間狀態不一致
- **立即驗證功能**: 每完成一對就能完整測試
- **降低整合風險**: 問題能夠及早發現和修正
- **統一協作模式**: Controller 簡化，Service 標準化

## 🔄 後續優化建議

1. **自動化檢查**: 建立 ESLint 規則檢查回應格式
2. **性能監控**: 監控遷移前後的 API 性能變化
3. **版本控制**: 為 API 版本化做準備
4. **快取策略**: 為統一格式設計快取機制

---

**預估總工時**: 52-60 小時 (排除不適用服務後)
**建議團隊規模**: 2-3 人  
**預計完成時間**: 4-5 週
**業務服務總數**: 20 個 (排除工具函數和基礎設施)
**任務總數**: 34 個具體任務 (移除8個不適用任務)
**最後更新**: 2025-08-30 (精準範圍版)
