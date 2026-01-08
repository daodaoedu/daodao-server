# 統一回應格式重構任務清單

## 📋 概述

本文件詳細規劃了將 DaoDao Server 的 API 回應格式統一化的完整任務清單。採用 **Service 層統一包裝** 策略，解決目前多層包裝和格式不一致的問題。

## 🎯 目標

將所有 API 統一為以下格式：
```typescript
{
  success: boolean;
  data: T | T[];
  pagination?: PaginationInfo;
  meta?: MetaInfo;
  message?: string;
  error?: string;
}
```

## 📊 重構策略

- **Service 層**：負責統一回應格式包裝
- **Controller 層**：直接轉發 Service 回應，不再進行額外包裝
- **錯誤處理**：在 Service 層統一處理
- **向後相容**：分階段遷移，確保不破壞現有功能
- **標準範例**：**PracticeService 已經是完美的實作範例**，其他服務需重構成相同格式

## ✅ **PracticeService 標準範例**

PracticeService 已經完全符合目標格式，**不需要重構**，作為其他服務的參考標準：

### **列表查詢 (分頁)**
```typescript
// src/services/practice.service.ts 第149-153行
return {
  success: true,                    // ✅ 統一成功標誌
  data: practiceEntities,          // ✅ 直接是 PracticeEntity[]
  pagination: {                    // ✅ 標準 PaginationInfo 格式
    currentPage: page,
    totalPages: Math.ceil(total / take),
    totalItems: total,
    itemsPerPage: take,
    hasNext: page < Math.ceil(total / take),
    hasPrev: page > 1
  }
};
```

### **單一資源查詢**
```typescript
// 第230-233行
return {
  success: true,                   // ✅ 統一成功標誌
  data: practiceEntity            // ✅ 直接是 PracticeEntity 物件
};
```

### **創建資源**
```typescript
// 第322-325行
return {
  success: true,                   // ✅ 統一成功標誌
  data: practiceEntity            // ✅ 新建的 PracticeEntity
};
```

### **類型定義**
```typescript
async findAll(params: PracticeQueryParams): Promise<ApiResponse<PracticeEntity[]>>
async findById(id: number, userId?: number): Promise<ApiResponse<PracticeEntity>>
async create(data: CreatePracticeRequest, userId: number): Promise<ApiResponse<PracticeEntity>>
```

### **為什麼是標準？**
- ✅ **Service 層統一包裝** - 不需 Controller 再包裝
- ✅ **類型安全** - 使用 `ApiResponse<T>` 泛型
- ✅ **格式一致** - `success`, `data`, `pagination` 結構統一
- ✅ **錯誤處理** - 統一的 try/catch 和日誌記錄
- ✅ **資料直接** - `data` 直接是陣列或物件，不是 `data.resources`

---

# 🚀 Phase 1: 建立標準介面和工具

**預估工時**: 4 小時  
**負責人**: 待指派  
**狀態**: 待開始  

## 1.1 創建標準回應介面

| # | 任務 | 檔案路徑 | 優先級 | 狀態 |
|---|------|----------|--------|------|
| 1.1.1 | 創建 API 回應類型定義檔 | `src/types/api-response.types.ts` | 高 | ⏳ |
| 1.1.2 | 定義基礎 `ApiResponse<T>` 介面 | - | 高 | ⏳ |
| 1.1.3 | 定義 `PaginatedApiResponse<T>` 介面 | - | 高 | ⏳ |
| 1.1.4 | 定義 `CursorPaginatedApiResponse<T>` 介面 | - | 高 | ⏳ |
| 1.1.5 | 定義 `PaginationInfo` 和 `CursorPaginationInfo` 介面 | - | 高 | ⏳ |
| 1.1.6 | 定義 `MetaInfo` 介面 | - | 中 | ⏳ |

## 1.2 創建回應建構工具

| # | 任務 | 檔案路徑 | 優先級 | 狀態 |
|---|------|----------|--------|------|
| 1.2.1 | 創建回應工具函數檔 | `src/utils/response-helper.ts` | 高 | ⏳ |
| 1.2.2 | 實作 `createSuccessResponse<T>()` | - | 高 | ⏳ |
| 1.2.3 | 實作 `createErrorResponse()` | - | 高 | ⏳ |
| 1.2.4 | 實作 `createPaginatedResponse<T>()` | - | 高 | ⏳ |
| 1.2.5 | 實作 `createCursorPaginatedResponse<T>()` | - | 高 | ⏳ |
| 1.2.6 | 實作 `calculatePagination()` 輔助函數 | - | 中 | ⏳ |

## 1.3 更新類型匯出和文檔

| # | 任務 | 檔案路徑 | 優先級 | 狀態 |
|---|------|----------|--------|------|
| 1.3.1 | 更新 `src/types/index.ts` 匯出新介面 | `src/types/index.ts` | 中 | ⏳ |
| 1.3.2 | 更新 `CLAUDE.md` 說明新標準 | `CLAUDE.md` | 中 | ⏳ |

**Phase 1 完成標準**: 
- ✅ 所有標準介面定義完成
- ✅ 回應工具函數可正常使用
- ✅ TypeScript 編譯無錯誤
- ✅ 介面格式與 PracticeService 保持一致

---

# 🔥 Phase 2: 重構高優先級服務

**預估工時**: 8 小時  
**負責人**: 待指派  
**狀態**: 待開始  
**依賴**: Phase 1 完成

## 2.1 UserService 重構 (最高優先級)

**目標**: 將 UserService 從混亂格式改為 PracticeService 標準格式

| # | 任務 | 檔案路徑 | 優先級 | 狀態 |
|---|------|----------|--------|------|
| 2.1.1 | 分析 UserService 現有回應格式 | `src/services/user.service.ts` | 高 | ⏳ |
| 2.1.2 | 重構 `getUsers()` 使用 `ApiResponse<User[]>` + 標準分頁 | - | 高 | ⏳ |
| 2.1.3 | 重構 `getUserById()` 使用 `ApiResponse<User>` | - | 高 | ⏳ |
| 2.1.4 | 重構其他 UserService 方法參照 PracticeService | - | 高 | ⏳ |
| 2.1.5 | 更新 UserController 移除雙重包裝，直接轉發 | `src/controllers/user.controller.ts` | 高 | ⏳ |
| 2.1.6 | 更新 UserService 單元測試 | `tests/unit/services/user.service.test.ts` | 中 | ⏳ |

**預期結果**:
```typescript
// 從這樣 ❌
{ data: users[], page: 1, pageSize: 20, totalCount: 100 }

// 改成這樣 ✅ (像 PracticeService)
{ success: true, data: users[], pagination: { currentPage: 1, ... } }
```

## 2.2 CommentService 重構

**目標**: 將 CommentService 從直接回傳資料改為 PracticeService 標準格式

| # | 任務 | 檔案路徑 | 優先級 | 狀態 |
|---|------|----------|--------|------|
| 2.2.1 | 分析 CommentService 現有格式 | `src/services/comment.service.ts` | 高 | ⏳ |
| 2.2.2 | 重構所有 CommentService 方法使用 `ApiResponse<T>` | - | 高 | ⏳ |
| 2.2.3 | 更新 CommentController 移除雙重包裝 | `src/controllers/comment.controller.ts` | 高 | ⏳ |
| 2.2.4 | 更新相關測試 | `tests/unit/services/comment.service.test.ts` | 中 | ⏳ |

**預期結果**:
```typescript
// 從這樣 ❌
return comments[]  // 直接回傳陣列
return { message: "已刪除" }

// 改成這樣 ✅ (像 PracticeService)
return { success: true, data: comments[] }
return { success: true, data: null, message: "已刪除" }
```

## 2.3 AuthService 重構

**目標**: 將 AuthService 函數改為 Class，並採用 PracticeService 標準格式

| # | 任務 | 檔案路徑 | 優先級 | 狀態 |
|---|------|----------|--------|------|
| 2.3.1 | 將 AuthService 函數改為 Class (參照 PracticeService) | `src/services/auth/auth.service.ts` | 高 | ⏳ |
| 2.3.2 | 實作統一錯誤處理格式使用 `ApiResponse<T>` | - | 高 | ⏳ |
| 2.3.3 | 更新 AuthController 移除雙重包裝 | `src/controllers/auth.controller.ts` | 高 | ⏳ |
| 2.3.4 | 更新認證相關測試 | `tests/unit/services/auth.service.test.ts` | 中 | ⏳ |

**預期結果**:
```typescript
// 從這樣 ❌ (函數導出)
export async function loginUser(data) {
  return user | null  // 直接回傳或 null
}

// 改成這樣 ✅ (像 PracticeService)
export class AuthService {
  async loginUser(data): Promise<ApiResponse<User>> {
    return { success: true, data: user }
  }
}
```

**Phase 2 完成標準**:
- ✅ UserService 完全符合新格式
- ✅ CommentService 完全符合新格式  
- ✅ AuthService 完全符合新格式
- ✅ 所有相關 Controller 更新完成
- ✅ 現有功能測試通過

---

# 🔧 Phase 3: 重構中優先級服務

**預估工時**: 10 小時  
**負責人**: 待指派  
**狀態**: 待開始  
**依賴**: Phase 2 完成

## 3.1 ResourceService 調整 (特殊處理)

| # | 任務 | 檔案路徑 | 優先級 | 狀態 |
|---|------|----------|--------|------|
| 3.1.1 | 調整 `getResources()` 回傳格式 | `src/services/resource.service.ts` | 中 | ⏳ |
| 3.1.2 | 保留游標分頁，改用 `CursorPaginatedApiResponse` | - | 中 | ⏳ |
| 3.1.3 | 加入 `meta` 欄位支援搜尋資訊 | - | 中 | ⏳ |
| 3.1.4 | 更新 ResourceController 移除額外包裝 | `src/controllers/resource.controller.ts` | 中 | ⏳ |
| 3.1.5 | 驗證現有功能正常運作 | - | 高 | ⏳ |

## 3.2 IdeaService 重構

| # | 任務 | 檔案路徑 | 優先級 | 狀態 |
|---|------|----------|--------|------|
| 3.2.1 | 將 IdeaService 函數改為 Class | `src/services/idea.service.ts` | 中 | ⏳ |
| 3.2.2 | 重構為標準分頁格式 | - | 中 | ⏳ |
| 3.2.3 | 更新 IdeaController | `src/controllers/idea.controller.ts` | 中 | ⏳ |
| 3.2.4 | 更新相關測試 | - | 低 | ⏳ |

## 3.3 MeService 調整

| # | 任務 | 檔案路徑 | 優先級 | 狀態 |
|---|------|----------|--------|------|
| 3.3.1 | 調整 MeService 格式對齊標準 | `src/services/me.service.ts` | 中 | ⏳ |
| 3.3.2 | 移除 `stats` 欄位，改用 `meta` | - | 中 | ⏳ |
| 3.3.3 | 更新 MeController | `src/controllers/me.controller.ts` | 中 | ⏳ |

## 3.4 其他 *ServiceResult 格式服務

| # | 任務 | 檔案路徑 | 優先級 | 狀態 |
|---|------|----------|--------|------|
| 3.4.1 | ReviewService 格式調整 | `src/services/review.service.ts` | 低 | ⏳ |
| 3.4.2 | MentorService 格式調整 | `src/services/mentor.service.ts` | 低 | ⏳ |
| 3.4.3 | NoteService 格式調整 | `src/services/note.service.ts` | 低 | ⏳ |
| 3.4.4 | OutcomeService 格式調整 | `src/services/outcome.service.ts` | 低 | ⏳ |
| 3.4.5 | MilestoneService 格式調整 | `src/services/milestone.service.ts` | 低 | ⏳ |
| 3.4.6 | ProjectService 格式調整 | `src/services/project.service.ts` | 低 | ⏳ |

**Phase 3 完成標準**:
- ✅ ResourceService 保持高效能游標分頁
- ✅ 所有中優先級服務統一格式
- ✅ 所有 Controller 更新完成
- ✅ API 回應格式一致性達到 90%

---

# 🧪 Phase 4: 測試和驗證

**預估工時**: 6 小時  
**負責人**: 待指派  
**狀態**: 待開始  
**依賴**: Phase 3 完成

## 4.1 單元測試

| # | 任務 | 檔案路徑 | 優先級 | 狀態 |
|---|------|----------|--------|------|
| 4.1.1 | 創建 response-helper 測試檔 | `tests/unit/utils/response-helper.test.ts` | 高 | ⏳ |
| 4.1.2 | 測試所有 response-helper 函數 | - | 高 | ⏳ |
| 4.1.3 | 更新現有服務單元測試 | `tests/unit/services/*.test.ts` | 中 | ⏳ |
| 4.1.4 | 確保測試覆蓋率 >80% | - | 中 | ⏳ |

## 4.2 整合測試

| # | 任務 | 檔案路徑 | 優先級 | 狀態 |
|---|------|----------|--------|------|
| 4.2.1 | 更新 API 整合測試 | `tests/integration/*-api.test.ts` | 高 | ⏳ |
| 4.2.2 | 驗證所有 API 端點回應格式 | - | 高 | ⏳ |
| 4.2.3 | 測試錯誤處理回應格式 | - | 中 | ⏳ |
| 4.2.4 | 測試分頁功能正確性 | - | 中 | ⏳ |

## 4.3 性能驗證

| # | 任務 | 檔案路徑 | 優先級 | 狀態 |
|---|------|----------|--------|------|
| 4.3.1 | ResourceService 性能基準測試 | - | 高 | ⏳ |
| 4.3.2 | 其他服務響應時間測試 | - | 中 | ⏳ |
| 4.3.3 | 記憶體使用量檢測 | - | 低 | ⏳ |

**Phase 4 完成標準**:
- ✅ 所有測試通過
- ✅ API 格式 100% 一致
- ✅ 性能無明顯衰退
- ✅ 錯誤處理正確

---

# 📚 Phase 5: 文檔更新和部署

**預估工時**: 3 小時  
**負責人**: 待指派  
**狀態**: 待開始  
**依賴**: Phase 4 完成

## 5.1 文檔更新

| # | 任務 | 檔案路徑 | 優先級 | 狀態 |
|---|------|----------|--------|------|
| 5.1.1 | 更新 API 文檔 (Swagger) | `src/swagger/schemas/*.ts` | 高 | ⏳ |
| 5.1.2 | 更新開發者指南 | `CLAUDE.md` | 中 | ⏳ |
| 5.1.3 | 創建遷移指南 | `docs/API_MIGRATION_GUIDE.md` | 中 | ⏳ |
| 5.1.4 | 更新前端對接文檔 | `docs/FRONTEND_INTEGRATION.md` | 中 | ⏳ |

## 5.2 部署準備

| # | 任務 | 檔案路徑 | 優先級 | 狀態 |
|---|------|----------|--------|------|
| 5.2.1 | 執行完整回歸測試 | - | 高 | ⏳ |
| 5.2.2 | 準備部署檢查清單 | `docs/DEPLOYMENT_CHECKLIST.md` | 中 | ⏳ |
| 5.2.3 | 準備回滾計劃 | - | 中 | ⏳ |

## 5.3 監控和驗證

| # | 任務 | 檔案路徑 | 優先級 | 狀態 |
|---|------|----------|--------|------|
| 5.3.1 | 設定 API 回應格式監控 | - | 中 | ⏳ |
| 5.3.2 | 部署後驗證 | - | 高 | ⏳ |

**Phase 5 完成標準**:
- ✅ 所有文檔更新完成
- ✅ 成功部署到生產環境
- ✅ 前端團隊完成對接
- ✅ 監控顯示一切正常

---

# 📊 總覽統計

## 工時估計
- **Phase 1**: 4 小時
- **Phase 2**: 8 小時  
- **Phase 3**: 10 小時
- **Phase 4**: 6 小時
- **Phase 5**: 3 小時
- **總計**: **31 小時** (約 4 個工作天)

## 優先級分布
- **高優先級**: 45 個任務
- **中優先級**: 25 個任務  
- **低優先級**: 8 個任務
- **總計**: **78 個任務**

## 風險評估
- **技術風險**: 低 (使用現有技術棧)
- **相容性風險**: 中 (需要充分測試)
- **性能風險**: 低 (主要是格式調整)

## 預期收益
- ✅ API 回應格式 100% 一致
- ✅ 前端開發體驗大幅改善
- ✅ 後端程式碼可維護性提升
- ✅ 錯誤處理統一化
- ✅ 為未來功能擴展打下基礎

---

**最後更新**: 2024-01-15  
**版本**: v1.0  
**負責人**: 開發團隊