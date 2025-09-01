# 服務回傳格式分析文件

## 概述

本文件分析 `src/services` 目錄下所有服務的回傳格式，以便統一 API 回應結構。

## 回傳格式分類

### 1. 標準化 API 回應格式 (推薦)
```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: PaginationInfo;
  message?: string;
  error?: string;
}
```

### 2. 服務特定格式 (需要統一)
```typescript
interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

### 3. 直接回傳資料 (需要重構)
```typescript
// 直接回傳資料或 null
T | null
// 或 throw Error
```

## 錯誤處理格式分析

### 1. 結構化錯誤類 (標準方式)
系統中定義了標準的錯誤類，位於 `src/utils/error-handler.ts`：

```typescript
// 基本錯誤類
export class AppError extends Error {
  statusCode: number;
  errors?: Record<string, string>;
}

// 具體錯誤類型
- BadRequestError (400)
- UnauthorizedError (401) 
- ForbiddenError (403)
- NotFoundError (404)
- ConflictError (409)
- InternalServerError (500)
```

### 2. 錯誤處理格式統計

#### A. 標準錯誤類使用 (38個文件)
使用結構化錯誤類的服務：
- **服務層**: resource.service.ts, user.service.ts, auth.service.ts, comment.service.ts, resource-review.service.ts, idea.service.ts, id-converter.service.ts
- **控制器層**: resource.controller.ts, auth.controller.ts, tag.controller.ts, resource-review.controller.ts, comment.controller.ts, user.controller.ts, email.controller.ts
- **中間件**: auth.ts, permission.middleware.ts, validator.ts
- **Swagger文件**: 所有 swagger/paths/*.ts 和 swagger/schemas/*.ts

#### B. 一般錯誤處理 (27個文件)  
使用 `throw new Error(message)` 或 `catch(error)` 的服務：
- **服務層**: practice.service.ts, practice-checkin.service.ts, practice-interaction.service.ts, practice-event.service.ts, me.service.ts, r2.service.ts, jwt.service.ts, email/email.service.ts, email/enhanced-email.service.ts, logging/logger.service.ts

#### C. 錯誤處理方式分類

**方式1: 結構化錯誤 + HTTP狀態碼 (推薦)**
```typescript
// 範例: resource.service.ts
if (!resource) {
  throw new NotFoundError('資源不存在');
}
if (!hasPermission) {
  throw new ForbiddenError('無權限修改此資源');
}
```

**方式2: 一般錯誤 + catch處理**
```typescript
// 範例: practice.service.ts, me.service.ts
try {
  // 業務邏輯
} catch (error) {
  throw new Error('取得實踐列表失敗');
}
```

**方式3: 配置錯誤**
```typescript
// 範例: r2.service.ts, jwt.service.ts
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
```

### 3. 錯誤處理標準化建議

#### 統一使用現有 ApiResponse 格式 (擴展版)
基於 `src/types/common.types.ts` 中已定義的 `ApiResponse<T>` 格式，建議擴展以包含必要的偵錯資訊：

```typescript
// 成功回應
{
  success: true,
  data: T,
  timestamp: string,
  meta?: {
    requestId: string,       // 請求 ID (偵錯用)
    version?: string,        // API 版本
    processingTime?: number  // 處理時間 (ms)
  }
}

// 錯誤回應 (統一格式 - 建議)
{
  success: false,
  data: null,  // 錯誤時統一為 null (與成功格式保持 data 欄位一致)
  error: {
    code: string,
    message: string,
    type: 'bad_request' | 'unauthorized' | 'forbidden' | 'not_found' | 'conflict' | 'internal_server_error',
    details?: Record<string, string>
  },
  timestamp: string,
  meta?: {
    requestId: string,       // 請求 ID (偵錯用)
    version?: string,        // API 版本
    processingTime?: number  // 處理時間 (ms)
  }
}

// 注意：此格式與現有 common.types.ts 中的 ErrorResponse 不同
// 現有格式沒有 data 欄位，需要後續統一修改
```

#### 實際應用範例
```typescript
// 控制器層成功回應
res.json({
  success: true,
  data: result,
  timestamp: new Date().toISOString(),
  meta: {
    requestId: req.headers['x-request-id'] || generateRequestId(),
    version: 'v1',
    processingTime: Date.now() - req.startTime
  }
});

// 錯誤回應 (由錯誤中間件統一處理)
throw new NotFoundError('資源不存在');

// 錯誤中間件轉換
app.use((err: AppError, req, res, next) => {
  res.status(err.statusCode).json({
    success: false,
    data: null,
    error: {
      code: err.name,
      message: err.message,
      type: getErrorType(err.statusCode),
      details: err.errors
    },
    timestamp: new Date().toISOString(),
    meta: {
      requestId: req.headers['x-request-id'] || generateRequestId(),
      version: 'v1',
      processingTime: Date.now() - req.startTime
    }
  });
});
```

#### 錯誤分類標準
1. **業務邏輯錯誤**: 使用具體的錯誤類 (NotFoundError, ForbiddenError 等)
2. **系統配置錯誤**: 使用 Error 並提供清晰的配置說明
3. **資料庫錯誤**: 統一 catch 處理並轉換為業務錯誤
4. **驗證錯誤**: 使用 BadRequestError 並提供 details 欄位

#### 錯誤回應範例 (按狀態碼排序)
```typescript
// 1. 驗證錯誤 (400 - BadRequestError)
{
  success: false,
  data: null,
  error: {
    code: "BadRequestError",
    message: "請求參數驗證失敗",
    type: "bad_request",
    details: {
      "email": "電子郵件格式不正確",
      "password": "密碼長度至少 8 個字符"
    }
  },
  timestamp: "2024-01-15T10:30:00Z",
  meta: {
    requestId: "req_abc123",
    version: "v1",
    processingTime: 15
  }
}

// 2. 未認證 (401 - UnauthorizedError)
{
  success: false,
  data: null,
  error: {
    code: "UnauthorizedError",
    message: "請先登入",
    type: "unauthorized"
  },
  timestamp: "2024-01-15T10:30:00Z",
  meta: {
    requestId: "req_jkl012",
    version: "v1",
    processingTime: 5
  }
}

// 3. 權限不足 (403 - ForbiddenError)
{
  success: false,
  data: null,
  error: {
    code: "ForbiddenError",
    message: "無權限執行此操作",
    type: "forbidden"
  },
  timestamp: "2024-01-15T10:30:00Z",
  meta: {
    requestId: "req_ghi789",
    version: "v1",
    processingTime: 12
  }
}

// 4. 資源不存在 (404 - NotFoundError)
{
  success: false,
  data: null,
  error: {
    code: "NotFoundError",
    message: "找不到指定的資源",
    type: "not_found"
  },
  timestamp: "2024-01-15T10:30:00Z",
  meta: {
    requestId: "req_def456",
    version: "v1",
    processingTime: 8
  }
}

// 5. 資源衝突 (409 - ConflictError)
{
  success: false,
  data: null,
  error: {
    code: "ConflictError",
    message: "此電子郵件已被使用",
    type: "conflict",
    details: {
      "email": "user@example.com 已存在於系統中"
    }
  },
  timestamp: "2024-01-15T10:30:00Z",
  meta: {
    requestId: "req_mno345",
    version: "v1",
    processingTime: 25
  }
}

// 6. 業務邏輯錯誤 (422 - UnprocessableEntityError)
{
  success: false,
  data: null,
  error: {
    code: "UnprocessableEntityError",
    message: "無法處理請求的實體",
    type: "unprocessable_entity",
    details: {
      "balance": "餘額不足，無法執行此操作",
      "status": "帳戶已被停用"
    }
  },
  timestamp: "2024-01-15T10:30:00Z",
  meta: {
    requestId: "req_vwx234",
    version: "v1",
    processingTime: 18
  }
}

// 7. 請求頻率限制 (429 - TooManyRequestsError) 
{
  success: false,
  data: null,
  error: {
    code: "TooManyRequestsError", 
    message: "請求過於頻繁，請稍後再試",
    type: "too_many_requests",
    details: {
      "retryAfter": "60", 
      "limit": "100 requests per minute"
    }
  },
  timestamp: "2024-01-15T10:30:00Z",
  meta: {
    requestId: "req_stu901",
    version: "v1", 
    processingTime: 3
  }
}

// 8. 伺服器內部錯誤 (500 - InternalServerError)
{
  success: false,
  data: null,
  error: {
    code: "InternalServerError",
    message: "伺服器發生未預期的錯誤",
    type: "internal_server_error"
  },
  timestamp: "2024-01-15T10:30:00Z",
  meta: {
    requestId: "req_pqr678",
    version: "v1",
    processingTime: 1200
  }
}
```

#### 前端統一處理方式
```typescript
// 前端可以統一判斷
if (response.success) {
  // 處理 response.data
  console.log('成功:', response.data);
} else {
  // 處理 response.error
  console.error('錯誤:', response.error.message);
  
  // 處理驗證錯誤詳情
  if (response.error.details) {
    Object.entries(response.error.details).forEach(([field, message]) => {
      console.error(`${field}: ${message}`);
    });
  }
}
```

## 各服務回傳格式分析

### Core Services (核心服務)

#### 1. UserService (Class)
- **格式**: 混合格式
- **回傳類型**:
  - `PaginatedUsersResponse`: `{data: T[], page, pageSize, totalCount, totalPages}`
  - `FormattedUserResponse | null`
- **分析**: 不統一，需要標準化
- **建議**: 統一使用 `ApiResponse<T>` 格式

#### 2. ResourceService (Functions)
- **格式**: 直接回傳資料 + 自定義分頁
- **回傳類型**:
  - `ResourceResponse | null`
  - `{resources: ResourceResponse[], pagination: {...}}`
- **分析**: 函數導出，回傳格式不統一
- **建議**: 改為 Class 並使用標準 API 回應

#### 3. PracticeService (Class) ⭐
- **格式**: 標準 API 回應 (最佳實踐)
- **回傳類型**: `ApiResponse<T>`
- **分析**: 完全標準化，應作為其他服務的模板
- **建議**: 保持現有格式

#### 4. CommentService (Class)
- **格式**: 直接回傳資料
- **回傳類型**:
  - `CommentResponse` / `CommentResponse[]`
  - `{message: string}` (刪除操作)
- **分析**: 缺乏統一的錯誤處理格式
- **建議**: 改用 `ApiResponse<T>` 格式

### Auth Services (認證相關)

#### 5. AuthService (Functions)
- **格式**: 直接回傳資料
- **回傳類型**: 直接回傳 Prisma 物件或 `null`
- **分析**: 函數導出，無標準化格式
- **建議**: 包裝為標準回應格式

#### 6. JWT Service
- **格式**: 直接回傳資料
- **回傳類型**: `string` 或 `object`
- **分析**: 工具性服務，可維持現狀

### Business Logic Services

#### 7. IdeaService (Functions)
- **格式**: 直接回傳資料 + 自定義分頁
- **回傳類型**:
  - `IdeaEntity`
  - `IdeaQueryResult` (包含分頁)
  - `CreateIdeaResponse`
- **分析**: 函數導出，格式不統一
- **建議**: 改為 Class 並使用標準格式

#### 8. TagService (Functions)
- **格式**: 直接回傳 Prisma 物件
- **回傳類型**: 直接回傳 `tags` 物件或陣列
- **分析**: 工具性服務，可包裝基本回應格式
- **建議**: 增加錯誤處理包裝

#### 9. ReviewService (Class) ⭐
- **格式**: 標準服務回應
- **回傳類型**: `ReviewServiceResult<T>`
- **分析**: 格式統一，結構良好
- **建議**: 改用 `ApiResponse<T>` 以保持一致性

#### 10. MentorService (Class) ⭐
- **格式**: 標準服務回應
- **回傳類型**: `MentorServiceResult<T>`
- **分析**: 格式統一，包含完整錯誤處理
- **建議**: 改用 `ApiResponse<T>` 以保持一致性

#### 11. NoteService (Class) ⭐
- **格式**: 標準服務回應 + 分頁支援
- **回傳類型**:
  - `NoteServiceResult<T>`
  - `PaginatedNotesServiceResult` (分頁)
- **分析**: 格式統一，支援分頁
- **建議**: 改用 `ApiResponse<T>` 以保持一致性

#### 12. OutcomeService (Class) ⭐
- **格式**: 標準服務回應 + 分頁支援
- **回傳類型**:
  - `OutcomeServiceResult<T>`
  - `PaginatedOutcomesServiceResult` (分頁)
- **分析**: 格式統一，支援分頁
- **建議**: 改用 `ApiResponse<T>` 以保持一致性

#### 13. MilestoneService (Class) ⭐
- **格式**: 標準服務回應
- **回傳類型**: `MilestoneServiceResult<T>`
- **分析**: 格式統一，錯誤處理完整
- **建議**: 改用 `ApiResponse<T>` 以保持一致性

#### 14. ProjectService (Class) ⭐
- **格式**: 標準服務回應
- **回傳類型**: `ProjectServiceResult<T>`
- **分析**: 格式統一，支援複雜查詢
- **建議**: 改用 `ApiResponse<T>` 以保持一致性

#### 15. MeService (Class)
- **格式**: 自定義回應格式
- **回傳類型**: `{success: boolean, data: T, pagination?, stats?}`
- **分析**: 接近標準格式但有額外欄位
- **建議**: 調整為標準 `ApiResponse<T>` 格式

### Utility Services

#### 16. TransformService
- **格式**: 直接回傳轉換後資料
- **回傳類型**: 轉換後的物件
- **分析**: 工具性服務，可維持現狀

#### 17. R2Service
- **格式**: 直接回傳檔案 URL 或拋出錯誤
- **回傳類型**: `string` 或 `throw Error`
- **分析**: 工具性服務，可增加基本包裝

### Supporting Services

#### 18. DatabaseService (Prisma/Mongo/Redis)
- **格式**: 直接回傳連接實例
- **回傳類型**: 資料庫連接物件
- **分析**: 基礎設施服務，維持現狀

#### 19. LoggerService
- **格式**: 無回傳值 (void)
- **回傳類型**: `void`
- **分析**: 日誌服務，維持現狀

#### 20. EmailService
- **格式**: 混合格式
- **回傳類型**: `Promise<void>` 或 `{success: boolean}`
- **分析**: 可增加統一的成功/失敗回應

## 統一建議

### 推薦的標準回應格式

```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  meta?: {
    // 搜尋相關
    searchQuery?: string;       // 搜尋關鍵字
    searchTime?: number;        // 搜尋耗時 (ms)
    filters?: Record<string, unknown>; // 套用的篩選條件
    
    // 統計資訊
    categoryCounts?: Record<string, number>; // 分類統計
    aggregateData?: Record<string, unknown>; // 聚合資料
    
    // 系統資訊
    requestId: string;          // 請求 ID (偵錯用)
    cacheHit?: boolean;         // 是否命中快取
    processingTime?: number;    // 處理時間 (ms)
    
    // 擴展欄位
    [key: string]: unknown;     // 允許其他自定義欄位
  };
  message?: string;
  error?: string;
}
```

### 分頁回應格式

```typescript
interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
```

## 遷移優先級

### 高優先級 (需要立即修改)
1. **UserService** - 核心服務，格式混亂
2. **ResourceService** - 函數導出，需要 Class 化
3. **CommentService** - 缺乏錯誤處理格式
4. **AuthService** - 認證核心，需要標準化

### 中優先級 (建議修改)
1. **IdeaService** - 函數導出改 Class
2. **MeService** - 調整格式對齊標準
3. **EmailService** - 增加統一回應

### 低優先級 (可選修改)
1. **所有 *ServiceResult 格式** - 統一改為 ApiResponse
2. **TagService** - 增加錯誤處理包裝
3. **R2Service** - 增加基本回應包裝

## 實作建議

### 1. 創建統一回應工具
```typescript
// src/utils/response-helper.ts
export const createSuccessResponse = <T>(
  data: T,
  message?: string,
  pagination?: PaginationInfo
): ApiResponse<T> => ({
  success: true,
  data,
  timestamp: new Date().toISOString(),
  message,
  pagination
});

export const createErrorResponse = (error: string): ApiResponse<null> => ({
  success: false,
  data: null,
  timestamp: new Date().toISOString(),
  error
});
```

### 2. 逐步遷移策略
1. 先修改高優先級服務
2. 更新對應的類型定義
3. 修改控制器以適應新格式
4. 更新 API 文檔
5. 進行回歸測試

### 3. 向後相容性
- 在遷移期間保持舊格式作為備選
- 使用適配器模式處理格式轉換
- 分階段部署避免破壞現有功能

## 分頁格式詳細分析

目前各服務的分頁格式存在 **6 種不同的實作方式**，這是造成 API 不一致的主要原因之一。

### 1. UserService 分頁格式 (需要統一)
```typescript
{
  data: FormattedUserResponse[],
  page: number,                // 當前頁碼
  pageSize: number,           // 每頁數量
  totalCount: number,         // 總筆數
  totalPages: number          // 總頁數
}
```
**問題**: 缺乏 `success`、`timestamp` 包裝，欄位命名不一致

### 2. ResourceService 分頁格式 (游標分頁)
```typescript
{
  resources: ResourceResponse[],
  pagination: {
    cursors: { start: string | null; end: string | null },
    hasMore: boolean,
    count: number,
    parentCount?: number
  }
}
```
**問題**: 使用游標分頁，與其他服務不一致

### 3. PracticeService 分頁格式 ⭐ (建議標準)
```typescript
{
  success: boolean,
  data: PracticeEntity[],
  pagination: {
    currentPage: number,        // 當前頁碼
    totalPages: number,         // 總頁數  
    totalItems: number,         // 總筆數
    itemsPerPage: number,       // 每頁數量
    hasNext: boolean,           // 是否有下一頁
    hasPrev: boolean            // 是否有上一頁
  }
}
```
**優點**: 格式完整，欄位命名一致，包含導航信息

### 4. IdeaService 分頁格式
```typescript
{
  ideas: IdeaEntity[],
  pagination: {
    page: number,               // 當前頁碼
    currentPage: number,        // 重複的當前頁碼
    totalPages: number,         // 總頁數
    total: number,              // 總筆數
    limit: number               // 每頁限制
  }
}
```
**問題**: 欄位重複 (`page` 和 `currentPage`)，缺乏 `success` 包裝

### 5. NoteService/OutcomeService 分頁格式
```typescript
{
  success: boolean,
  data: NoteResponse[],
  page: number,               // 當前頁碼
  pageSize: number,           // 每頁數量
  totalCount: number,         // 總筆數
  totalPages: number          // 總頁數
}
```
**問題**: 分頁信息沒有包在 `pagination` 物件中

### 6. ProjectService 分頁格式
```typescript
{
  success: true,
  data: {
    projects: ProjectResponse[],
    total: number,              // 總筆數
    page: number,               // 當前頁碼
    limit: number               // 每頁限制
  }
}
```
**問題**: 分頁信息包在 `data` 中，結構不一致

### 分頁格式差異總結

| 服務 | 資料欄位 | 當前頁 | 總頁數 | 總筆數 | 每頁數量 | 導航信息 | success包裝 | pagination包裝 |
|------|----------|---------|---------|---------|----------|----------|-------------|---------------|
| UserService | `data` | `page` | `totalPages` | `totalCount` | `pageSize` | ❌ | ❌ | ❌ |
| ResourceService | `resources` | ❌ | ❌ | `count` | ❌ | `hasMore` | ❌ | ✅ |
| PracticeService | `data` | `currentPage` | `totalPages` | `totalItems` | `itemsPerPage` | ✅ | ✅ | ✅ |
| IdeaService | `ideas` | `page`/`currentPage` | `totalPages` | `total` | `limit` | ❌ | ❌ | ✅ |
| NoteService | `data` | `page` | `totalPages` | `totalCount` | `pageSize` | ❌ | ✅ | ❌ |
| ProjectService | `data.projects` | `data.page` | ❌ | `data.total` | `data.limit` | ❌ | ✅ | ❌ |

### 建議的分頁格式策略

採用 **雙重策略**，根據使用場景選擇合適的分頁方式：

#### 1. 基於頁碼的分頁 (大多數服務使用)

基於 **PracticeService** 的格式作為標準：

```typescript
interface PaginatedApiResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    currentPage: number;        // 當前頁碼 (從 1 開始)
    totalPages: number;         // 總頁數
    totalItems: number;         // 總筆數
    itemsPerPage: number;       // 每頁數量
    hasNext: boolean;           // 是否有下一頁
    hasPrev: boolean;           // 是否有上一頁
  };
  meta?: {
    // 搜尋相關
    searchQuery?: string;       // 搜尋關鍵字
    searchTime?: number;        // 搜尋耗時 (ms)
    filters?: Record<string, unknown>; // 套用的篩選條件
    
    // 統計資訊
    categoryCounts?: Record<string, number>; // 分類統計
    aggregateData?: Record<string, unknown>; // 聚合資料
    
    // 系統資訊
    requestId?: string;         // 請求 ID (偵錯用)
    timestamp?: string;         // 回應時間戳
    cacheHit?: boolean;         // 是否命中快取
    processingTime?: number;    // 處理時間 (ms)
    
    // 擴展欄位
    [key: string]: unknown;     // 允許其他自定義欄位
  };
  message?: string;
  error?: string;
}
```

**適用服務**: UserService, PracticeService, IdeaService, NoteService, OutcomeService, ProjectService, MentorService 等

#### 2. 游標分頁 (ResourceService 保留)

保留 ResourceService 現有的游標分頁格式：

```typescript
interface CursorPaginatedApiResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    cursors: { 
      start: string | null;     // 起始游標
      end: string | null;       // 結束游標
    };
    hasMore: boolean;           // 是否有更多資料
    count: number;              // 當前頁筆數
  };
  meta?: {
    // 搜尋相關
    searchQuery?: string;       // 搜尋關鍵字
    searchTime?: number;        // 搜尋耗時 (ms)
    filters?: Record<string, unknown>; // 套用的篩選條件
    
    // 統計資訊
    totalEstimate?: number;     // 總筆數估計 (游標分頁較難精確計算)
    categoryCounts?: Record<string, number>; // 分類統計
    
    // 系統資訊
    requestId?: string;         // 請求 ID (偵錯用)
    timestamp?: string;         // 回應時間戳
    cacheHit?: boolean;         // 是否命中快取
    processingTime?: number;    // 處理時間 (ms)
    
    // 擴展欄位
    [key: string]: unknown;     // 允許其他自定義欄位
  };
  message?: string;
  error?: string;
}
```

**適用服務**: ResourceService (資源數量龐大，主要用於連續瀏覽)

### 分頁策略選擇原則

| 場景類型 | 推薦分頁方式 | 原因 |
|---------|-------------|------|
| **管理後台** | 頁碼分頁 | 需要跳轉特定頁面、顯示總頁數 |
| **內容瀏覽** | 游標分頁 | 大量資料、連續瀏覽、性能優先 |
| **搜尋結果** | 頁碼分頁 | 用戶需要書籤、跳轉功能 |
| **即時動態** | 游標分頁 | 資料即時更新、避免重複 |

### 統一的優點

- **頁碼分頁**: 欄位命名一致、包含完整導航信息、統一 success 包裝
- **游標分頁**: 保持 ResourceService 現有高性能、避免大數據集的 OFFSET 問題
- **Meta 擴展**: 提供靈活的元資料空間，支援搜尋、統計、偵錯等功能
- **靈活選擇**: 根據實際使用場景選擇最適合的分頁策略

## 總結

目前服務層回傳格式不統一，特別是分頁格式有 **6 種不同實作**，建議採用 **雙重分頁策略**：

### 🎯 **統一方案**

1. **採用 `PracticeService` 的 `ApiResponse<T>` 格式作為標準**
2. **雙重分頁策略**：
   - **頁碼分頁** (大多數服務)：管理後台、搜尋結果等需要跳轉功能
   - **游標分頁** (ResourceService)：大量資料、連續瀏覽、性能優先
3. **優先處理核心服務的格式統一** (UserService 優先，ResourceService 保留現有格式)
4. **建立統一的回應處理工具函數**

### 📋 **遷移計劃**

| 優先級 | 服務 | 目標格式 | 原因 |
|--------|------|----------|------|
| **高** | UserService | 頁碼分頁 | 核心服務，管理後台性質 |
| **高** | CommentService | 頁碼分頁 | 評論系統，需要統一格式 |
| **高** | AuthService | 標準回應 | 認證核心，需要錯誤處理 |
| **中** | ResourceService | 游標分頁 | **保留現有**，但增加 success 包裝 |
| **中** | IdeaService | 頁碼分頁 | 函數改 Class，統一格式 |
| **低** | 其他 *ServiceResult | 改為 ApiResponse | 統一回應格式 |

### 🔧 **實作步驟**

1. **定義標準介面** (詳見下方任務清單)
2. **創建回應工具函數**
3. **優先修改高優先級服務**
4. **保留 ResourceService 游標分頁但增加 success 包裝**
5. **更新控制器和 API 文檔**
6. **進行回歸測試**

## 📋 標準介面實作任務清單

為了確保標準化工作的完整性，以下是詳細的實作任務清單：

### 📝 **Phase 1: 介面定義** (任務 1-5)

| # | 任務 | 檔案路徑 | 狀態 |
|---|------|----------|------|
| 1 | 創建標準回應介面定義檔案 | `src/types/api-response.types.ts` | ⏳ |
| 2 | 定義基礎 `ApiResponse<T>` 介面 | - | ⏳ |
| 3 | 定義頁碼分頁介面 `PaginatedApiResponse<T>` | - | ⏳ |
| 4 | 定義游標分頁介面 `CursorPaginatedApiResponse<T>` | - | ⏳ |
| 5 | 定義分頁資訊介面 `PaginationInfo` 和 `CursorPaginationInfo` | - | ⏳ |

### 🔧 **Phase 2: 工具函數** (任務 6-10)

| # | 任務 | 檔案路徑 | 狀態 |
|---|------|----------|------|
| 6 | 創建回應工具函數檔案 | `src/utils/response-helper.ts` | ⏳ |
| 7 | 實作 `createSuccessResponse` 函數 | - | ⏳ |
| 8 | 實作 `createErrorResponse` 函數 | - | ⏳ |
| 9 | 實作 `createPaginatedResponse` 函數 | - | ⏳ |
| 10 | 實作 `createCursorPaginatedResponse` 函數 | - | ⏳ |

### 🔄 **Phase 3: 適配與整合** (任務 11-12)

| # | 任務 | 檔案路徑 | 狀態 |
|---|------|----------|------|
| 11 | 為現有服務創建類型適配器 | `src/utils/response-adapter.ts` | ⏳ |
| 12 | 更新類型匯出 | `src/types/index.ts` | ⏳ |

### 🧪 **Phase 4: 測試** (任務 13-14)

| # | 任務 | 檔案路徑 | 狀態 |
|---|------|----------|------|
| 13 | 創建單元測試檔案 | `tests/unit/utils/response-helper.test.ts` | ⏳ |
| 14 | 撰寫 response-helper 函數的單元測試 | - | ⏳ |

### 📚 **Phase 5: 文檔更新** (任務 15)

| # | 任務 | 檔案路徑 | 狀態 |
|---|------|----------|------|
| 15 | 更新專案說明文件 | `CLAUDE.md` | ⏳ |

### 預期成果

完成所有任務後，將獲得：
- ✅ 統一的 API 回應格式定義
- ✅ 可重用的回應建構工具函數
- ✅ 向後相容的類型適配器
- ✅ 完整的單元測試覆蓋
- ✅ 清晰的開發文檔

### 估計工時

- **Phase 1**: 2 小時
- **Phase 2**: 3 小時
- **Phase 3**: 2 小時
- **Phase 4**: 2 小時
- **Phase 5**: 1 小時
- **總計**: 約 10 小時

此雙重策略既保持了 API 的一致性，又在適當的場景下發揮各種分頁方式的優勢，加上靈活的 meta 欄位設計，將顯著提高系統的整體質量和開發效率。

## 💡 Meta 欄位使用範例

### 實踐列表 API 回應
```typescript
{
  success: true,
  data: [...practices],
  pagination: {
    currentPage: 2,
    totalPages: 5,
    totalItems: 47,
    itemsPerPage: 10,
    hasNext: true,
    hasPrev: true
  },
  meta: {
    // 搜尋資訊
    searchQuery: "健身",
    searchTime: 23,
    filters: {
      status: "active",
      category: "fitness"
    },
    
    // 統計資訊
    categoryCounts: {
      "fitness": 12,
      "reading": 18,
      "coding": 17
    },
    aggregateData: {
      totalActiveUsers: 234,
      averageProgress: 68.5,
      completionRate: 0.85
    },
    
    // 系統資訊
    requestId: "req_abc123",
    cacheHit: false,
    processingTime: 45
  },
  timestamp: "2024-01-15T10:30:00Z"
}
```

### 資源列表 API 回應 (游標分頁)
```typescript
{
  success: true,
  data: [...resources],
  pagination: {
    cursors: {
      start: "eyJpZCI6MTIz...",
      end: "eyJpZCI6NDU2..."
    },
    hasMore: true,
    count: 20
  },
  meta: {
    searchQuery: "React tutorial",
    searchTime: 15,
    totalEstimate: 1250,
    categoryCounts: {
      "tutorial": 450,
      "documentation": 380,
      "video": 420
    },
    
    requestId: "req_def456",
    cacheHit: true,
    processingTime: 12
  },
  timestamp: "2024-01-15T10:30:00Z"
}
```