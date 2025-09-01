# Swagger 文檔更新任務清單

## 概述
根據 src 目錄中更新後的服務與格式，需要全面更新 Swagger 文檔以保持 API 文檔的準確性和一致性。

## 主要更新任務

### 1. 統一響應格式更新
- [x] 更新 `common.schemas.ts` 以符合新的 `ApiResponse` 格式
- [x] 統一所有錯誤響應格式，使用 `ApiErrorResponse` 類型
- [x] 更新成功響應格式，使用 `ApiSuccessResponse<T>` 類型
- [x] 添加新的分頁響應格式：`PaginatedApiResponse` 和 `CursorPaginatedApiResponse`

### 2. 缺少 Swagger 文檔的服務
需要為以下服務創建完整的 Swagger 文檔：

#### 缺少 Swagger 文檔的 Controllers：
- [x] `practice.controller.ts` → **創建** `practice.paths.ts` 和 `practice.schemas.ts` ✅ 已完成

#### 已有完整 Swagger 文檔的 Controllers：
- [x] `me.controller.ts` → 已有 `me.paths.ts` 和 `me.schemas.ts`
- [x] `mentor.controller.ts` → 已有 `mentor.paths.ts` 和 `mentor.schemas.ts`  
- [x] `milestone.controller.ts` → 已有 `milestone.paths.ts` 和 `milestone.schemas.ts`
- [x] `note.controller.ts` → 已有 `note.paths.ts` 和 `note.schemas.ts`
- [x] `outcome.controller.ts` → 已有 `outcome.paths.ts` 和 `outcome.schemas.ts`
- [x] `review.controller.ts` → 已有 `review.paths.ts` 和 `review.schemas.ts`

### 3. 現有服務文檔更新
需要檢查並更新以下現有服務的文檔：

#### 有完整 Swagger 文檔的 Controllers（需更新格式）：
- [x] `auth.controller.ts` → 更新 `auth.paths.ts` 和 `auth.schemas.ts` ✅ 已完成
- [x] `comment.controller.ts` → 更新 `comment.paths.ts` 和 `comment.schemas.ts` ✅ 已完成
- [x] `email.controller.ts` → 更新 `email.paths.ts` 和 `email.schemas.ts` ✅ 已完成
- [x] `idea.controller.ts` → 更新 `idea.paths.ts` 和 `idea.schemas.ts` ✅ 已完成
- [x] `image.controller.ts` → 更新 `image.paths.ts` 和 `image.schemas.ts` ✅ 已完成
- [x] `project.controller.ts` → 更新 `project.paths.ts` 和 `project.schemas.ts` ✅ 已完成
- [x] `resource.controller.ts` → 更新 `resource.paths.ts` 和 `resource.schemas.ts` ✅ 已完成
- [x] `resource-review.controller.ts` → 更新 `resource-review.paths.ts` 和 `resource-review.schemas.ts` ✅ 已完成
- [x] `tag.controller.ts` → 更新 `tag.paths.ts` 和 `tag.schemas.ts` ✅ 已完成
- [x] `user.controller.ts` → 更新 `user.paths.ts` 和 `user.schemas.ts` ✅ 已完成

#### 額外的 Swagger 文檔（可能不需要對應 Controller）：
- [x] `common.paths.ts` 和 `common.schemas.ts` → 通用定義
- [x] `db-info.paths.ts` 和 `db-info.schemas.ts` → 資料庫資訊
- [x] `monitor.paths.ts` 和 `monitor.schemas.ts` → 監控相關

### 4. 類型定義同步
- [x] 檢查 `src/types/*.ts` 文件與對應 Swagger schemas 的一致性 ✅ 已完成
- [x] 更新以下類型的 Swagger 定義： ✅ 已完成
  - [x] `api-response.types.ts` → 統一響應格式 ✅ 已完成
  - [x] `common.types.ts` → 移除重複定義，導入統一類型 ✅ 已完成  
  - [x] `practice.types.ts` → 移除重複定義，導入統一類型 ✅ 已完成
  - [x] `idea.types.ts` → 移除重複定義，導入統一類型 ✅ 已完成
  - [x] `index.ts` → 統一導出所有響應類型 ✅ 已完成
  - [x] 其他類型文件 → 檢查後無重複定義 ✅ 已完成

### 5. 驗證和測試
- [x] 檢查所有 Swagger 路徑定義與實際路由的匹配性 ✅ 已完成
- [x] 確認請求/響應 schema 與實際 controller 實現的一致性 ✅ 已完成
- [x] 驗證分頁參數和響應格式 ✅ 已完成
- [x] 測試 Swagger UI 的正常顯示和功能 ✅ 已完成

### 6. 文檔優化
- [x] 添加詳細的 API 描述和使用範例 ✅ 已完成
- [x] 確保所有必要的參數都有適當的描述 ✅ 已完成
- [x] 統一中文描述的用詞和格式 ✅ 已完成
- [x] 添加適當的標籤和分組 ✅ 已完成

## 優先順序

### 高優先級
1. 統一響應格式更新 (影響所有 API)
2. Practice 相關 API 文檔 (新功能)
3. 現有核心功能文檔更新 (auth, user, resource)

### 中優先級
4. 其他新增功能文檔 (me, mentor, milestone, note, outcome, review)
5. 輔助功能文檔更新 (email, image, tag)

### 低優先級
6. 文檔優化和細節完善
7. 測試和驗證

## 注意事項

1. **響應格式標準化**：所有 API 都應使用新的統一響應格式
2. **類型一致性**：確保 TypeScript 類型定義與 Swagger 定義完全一致
3. **分頁處理**：新的分頁格式需要在所有相關 API 中實現
4. **錯誤處理**：統一錯誤響應格式，包含適當的錯誤代碼和訊息
5. **向後兼容**：在更新過程中考慮 API 版本兼容性

## 完成標準

- [x] 所有新增的 controller 都有對應的完整 Swagger 文檔 ✅ 已完成
- [x] 所有現有 Swagger 文檔都已更新到最新格式 ✅ 已完成
- [x] Swagger UI 可以正常訪問和使用 ✅ 已完成
- [x] API 文檔與實際實現完全一致 ✅ 已完成
- [x] 所有響應格式都遵循統一標準 ✅ 已完成
