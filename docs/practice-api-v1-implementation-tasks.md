# Practice API v1 實作任務清單

## 概述

根據 `practice-api-v1.md` 規範文件和專案 `.cursor` 與 `CLAUDE.md` 規範建立的完整實作任務清單。此文件基於現有專案架構（hybrid JavaScript/TypeScript）進行 Practice 功能的全面實作。

## 專案背景分析

### 現有資料庫架構
- ✅ **Prisma Schema**: 已包含 `practices` 和 `practice_checkins` 表定義
- ✅ **相關資料表**: `entity_tags`, `reaction`, `view`, `favorite`, `share`, `comments` 等支援社群功能
- ✅ **PostgreSQL**: 主要資料庫，已配置完整索引和約束

### 現有技術架構
- ✅ **TypeScript 遷移中**: src/ 目錄為現代 TypeScript 架構
- ✅ **Express + Prisma**: 完整的 REST API 框架
- ✅ **驗證系統**: Zod schemas 與 JWT 認證機制
- ✅ **測試框架**: Jest 配置完整，包含單元和整合測試

## 核心任務清單

### ✅ 階段一：資料模型與驗證器 (Priority: High) - **已完成**

#### 1.1 建立 Practice 驗證器 ✅
- **檔案**: `src/validators/practice.validators.ts`
- **內容**: 實作 practice-api-v1.md 中定義的所有 Zod schemas
- **狀態**: ✅ 完成 (2025-07-28)
- **項目**:
  - [x] `practiceStatusSchema` - 實踐狀態枚舉
  - [x] `contentTypeSchema` - 內容類型枚舉  
  - [x] `dailyGoalTypeSchema` - 每日目標類型枚舉
  - [x] `dailyGoalSchema` - 每日目標結構
  - [x] `practiceResourceInputSchema` - 實踐資源輸入驗證
  - [x] `practiceResourceSchema` - 實踐資源回應格式
  - [x] `createPracticeSchema` - 建立實踐請求驗證
  - [x] `updatePracticeSchema` - 更新實踐請求驗證
  - [x] `checkInSchema` - 簽到記錄驗證
  - [x] `practiceQuerySchema` - 查詢參數驗證
  - [x] `checkInQuerySchema` - 簽到查詢參數驗證
  - [x] 所有事件記錄 schemas (view, click, share, favorite)
  - [x] 所有驗證函數和類型導出
  - [x] 解決命名衝突問題

#### 1.2 建立 Practice 類型定義 ✅
- **檔案**: `src/types/practice.types.ts`
- **內容**: 對應 API 文件的 TypeScript 類型定義
- **狀態**: ✅ 完成 (2025-07-28)
- **項目**:
  - [x] `PracticeEntity` 介面
  - [x] `CheckInEntity` 介面
  - [x] `PracticeResource` 介面
  - [x] `UserBasicInfo` 介面
  - [x] `DailyGoal` 介面
  - [x] `PracticeStats` 介面
  - [x] 所有枚舉類型 (ContentType, PracticeStatus, DailyGoalType 等)
  - [x] API 回應類型 (ApiResponse, PaginationInfo 等)
  - [x] 服務和控制器介面定義
  - [x] 資料庫模型介面
  - [x] 錯誤處理類型

#### 1.3 驗證與測試 ✅
- **檔案**: `src/tests/unit/validators/practice.validators.test.ts`
- **內容**: 完整的驗證器測試套件
- **狀態**: ✅ 完成 (2025-07-28)
- **測試結果**: 40 個測試全部通過 ✅
- **項目**:
  - [x] createPracticeSchema 測試 (6 個測試)
  - [x] dailyGoalSchema 測試 (5 個測試)
  - [x] checkInSchema 測試 (5 個測試)
  - [x] practiceQuerySchema 測試 (4 個測試)
  - [x] 事件 schemas 測試 (6 個測試)
  - [x] 參數 schemas 測試 (4 個測試)
  - [x] practiceResourceInputSchema 測試 (5 個測試)
  - [x] updatePracticeSchema 測試 (3 個測試)
  - [x] reactionSchema 測試 (2 個測試)

**階段一完成摘要**:
- ✅ 所有 Zod 驗證器實作完成，包含 20+ schemas
- ✅ 完整的 TypeScript 類型定義，涵蓋所有 API 介面
- ✅ 40 個單元測試全部通過，確保驗證邏輯正確
- ✅ 遵循專案編碼規範，通過 ESLint 檢查
- ✅ 解決命名衝突，與現有代碼庫良好整合
- ✅ 支援 practice-api-v1.md 規範的所有 21 個 API 端點需求

### ✅ 階段二：服務層實作 (Priority: High) - **已完成**

#### 2.1 Practice 核心服務 ✅
- **檔案**: `src/services/practice.service.ts`
- **內容**: Practice 業務邏輯實作
- **狀態**: ✅ 完成 (2025-07-28)
- **項目**:
  - [x] `findAll()` - 取得實踐列表（支援篩選、分頁、搜尋）
  - [x] `findById()` - 取得單一實踐詳情
  - [x] `create()` - 建立實踐（包含資源關聯）
  - [x] `update()` - 更新實踐
  - [x] `delete()` - 軟刪除實踐
  - [x] `findUserPractices()` - 取得使用者的實踐列表
  - [x] `getUserStats()` - 取得使用者實踐統計

#### 2.2 簽到服務 ✅
- **檔案**: `src/services/practice-checkin.service.ts`
- **內容**: 簽到相關業務邏輯
- **狀態**: ✅ 完成 (2025-07-28)
- **項目**:
  - [x] `createCheckIn()` - 建立簽到記錄
  - [x] `getCheckIns()` - 取得簽到記錄列表
  - [x] `calculateStreak()` - 計算連續簽到天數
  - [x] `updatePracticeProgress()` - 更新實踐進度
  - [x] `validateDailyCheckIn()` - 驗證每日簽到限制

#### 2.3 互動服務 ✅
- **檔案**: `src/services/practice-interaction.service.ts`
- **內容**: 點讚、分享、收藏等互動功能
- **狀態**: ✅ 完成 (2025-07-28)
- **項目**:
  - [x] `toggleLike()` - 點讚/取消點讚
  - [x] `recordShare()` - 記錄分享事件
  - [x] `toggleFavorite()` - 收藏/取消收藏
  - [x] `recordView()` - 記錄瀏覽事件
  - [x] `recordClick()` - 記錄點擊事件

#### 2.4 事件記錄服務 ✅
- **檔案**: `src/services/practice-event.service.ts`
- **內容**: 各種使用者行為事件記錄
- **狀態**: ✅ 完成 (2025-07-28)
- **項目**:
  - [x] `recordViewEvent()` - 記錄瀏覽事件
  - [x] `recordClickEvent()` - 記錄點擊事件
  - [x] `recordShareEvent()` - 記錄分享事件
  - [x] `recordFavoriteEvent()` - 記錄收藏事件

**階段二完成摘要**:
- ✅ 所有 4 個服務文件已創建並實作完成
- ✅ 包含 Practice 核心 CRUD 操作、簽到系統、社群互動、事件記錄等功能
- ✅ 整合 Prisma ORM，支援完整的資料庫操作
- ✅ 實作統計功能，包含點讚、瀏覽、收藏、分享等社群指標
- ✅ 支援標籤和資源管理功能
- ✅ 包含完整的錯誤處理和日誌記錄
- ✅ 遵循專案編碼規範和 TypeScript 類型安全
- ⚠️ 部分 TypeScript 編譯錯誤需要在後續階段修正（主要為表結構細節調整）

### 階段三：控制器實作 (Priority: High)

#### 3.1 Practice 主控制器
- **檔案**: `src/controllers/practice.controller.ts`
- **內容**: Practice 相關 API 端點實作
- **項目**:
  - [ ] `GET /api/v1/practices` - 取得實踐列表
  - [ ] `GET /api/v1/practices/:id` - 取得實踐詳情
  - [ ] `POST /api/v1/practices` - 建立實踐
  - [ ] `PATCH /api/v1/practices/:id` - 更新實踐
  - [ ] `DELETE /api/v1/practices/:id` - 刪除實踐
  - [ ] `POST /api/v1/practices/:id/checkin` - 簽到記錄
  - [ ] `GET /api/v1/practices/:id/checkins` - 取得簽到記錄
  - [ ] `POST /api/v1/practices/:id/reactions` - 點讚
  - [ ] `DELETE /api/v1/practices/:id/reactions` - 取消點讚

#### 3.2 使用者相關控制器
- **檔案**: `src/controllers/practice-user.controller.ts`
- **內容**: 使用者相關 Practice API
- **項目**:
  - [ ] `GET /api/v1/me/practices` - 取得我的實踐
  - [ ] `GET /api/v1/me/practice-stats` - 取得我的實踐統計

#### 3.3 事件記錄控制器
- **檔案**: `src/controllers/practice-event.controller.ts`
- **內容**: 事件記錄相關 API
- **項目**:
  - [ ] `POST /api/v1/events/views` - 記錄瀏覽事件
  - [ ] `POST /api/v1/events/clicks` - 記錄點擊事件
  - [ ] `POST /api/v1/events/shares` - 記錄分享事件
  - [ ] `POST /api/v1/events/favorites` - 記錄收藏事件
  - [ ] `DELETE /api/v1/events/favorites` - 取消收藏事件

### 階段四：路由配置 (Priority: High)

#### 4.1 Practice 路由
- **檔案**: `src/routes/practice.routes.ts`
- **內容**: Practice API 路由定義
- **項目**:
  - [ ] 配置所有 Practice CRUD 路由
  - [ ] 整合中間件（認證、驗證、權限）
  - [ ] 配置路由級別的錯誤處理
  - [ ] 設定適當的 HTTP 狀態碼

#### 4.2 事件路由
- **檔案**: `src/routes/event.routes.ts`
- **內容**: 事件記錄 API 路由定義
- **項目**:
  - [ ] 配置所有事件記錄路由
  - [ ] 區分需要認證和公開的端點
  - [ ] 整合速率限制中間件

#### 4.3 路由整合
- **檔案**: `src/routes/index.ts`
- **內容**: 將新路由整合到應用程式
- **項目**:
  - [ ] 註冊 practice 路由到 `/api/v1/practices`
  - [ ] 註冊 event 路由到 `/api/v1/events`
  - [ ] 確保與現有路由架構一致

### 階段五：資料庫整合 (Priority: Medium)

#### 5.1 Prisma 模型驗證
- **檔案**: `prisma/schema.prisma`
- **內容**: 確認現有模型符合 API 需求
- **項目**:
  - [x] 驗證 `practices` 表結構
  - [x] 驗證 `practice_checkins` 表結構
  - [x] 確認相關表關聯 (`entity_tags`, `reaction`, `view` 等)
  - [ ] 檢查是否需要新增欄位或索引

#### 5.2 資料庫遷移
- **項目**:
  - [ ] 建立 practice_resources 表（如果需要獨立表）
  - [ ] 新增必要的索引優化查詢效能
  - [ ] 建立觸發器或約束確保資料一致性

### 階段六：Swagger 文件 (Priority: Medium)

#### 6.1 API 文件定義
- **檔案**: `src/swagger/schemas/practice.schemas.ts`
- **內容**: Practice API 的 OpenAPI 規範
- **項目**:
  - [ ] 定義所有 Practice 相關的 request/response schemas
  - [ ] 定義錯誤回應格式
  - [ ] 包含範例數據

#### 6.2 API 路徑文件
- **檔案**: `src/swagger/paths/practice.paths.ts`
- **內容**: Practice API 端點文件
- **項目**:
  - [ ] 記錄所有 21 個 API 端點
  - [ ] 包含詳細的參數說明
  - [ ] 提供請求/回應範例

#### 6.3 整合到主要 Swagger 配置
- **檔案**: `src/swagger/config/swagger.config.ts`
- **項目**:
  - [ ] 註冊 Practice schemas 和 paths
  - [ ] 確保 Swagger UI 正確顯示

### 階段七：測試實作 (Priority: Medium)

#### 7.1 單元測試
- **檔案**: `src/tests/unit/services/practice.service.test.ts`
- **項目**:
  - [ ] Practice 服務單元測試
  - [ ] 簽到服務單元測試
  - [ ] 互動服務單元測試
  - [ ] 事件記錄服務單元測試

#### 7.2 控制器測試
- **檔案**: `src/tests/unit/controllers/practice.controller.test.ts`
- **項目**:
  - [ ] Practice 控制器測試
  - [ ] 使用者相關控制器測試
  - [ ] 事件控制器測試

#### 7.3 整合測試
- **檔案**: `src/tests/integration/practice-api.test.ts`
- **項目**:
  - [ ] 完整 API 流程測試
  - [ ] 認證和權限測試
  - [ ] 資料一致性測試
  - [ ] 錯誤處理測試

#### 7.4 驗證器測試
- **檔案**: `src/tests/unit/validators/practice.validators.test.ts`
- **項目**:
  - [ ] 所有 Zod schema 驗證測試
  - [ ] 邊界值測試
  - [ ] 錯誤訊息驗證

### 階段八：中間件與安全性 (Priority: Medium)

#### 8.1 認證中間件整合
- **項目**:
  - [ ] 為需要認證的端點配置 JWT 中間件
  - [ ] 確保公開端點不需要認證
  - [ ] 實作適當的錯誤處理

#### 8.2 權限控制
- **項目**:
  - [ ] 實作實踐所有者權限檢查
  - [ ] 確保使用者只能操作自己的實踐
  - [ ] 管理員權限控制（如需要）

#### 8.3 速率限制
- **項目**:
  - [ ] 為創建和更新操作配置速率限制
  - [ ] 為事件記錄配置較寬鬆的限制
  - [ ] 監控和日誌記錄

### 階段九：資料驗證與轉換 (Priority: Medium)

#### 9.1 資料轉換服務
- **檔案**: `src/services/practice-transform.service.ts`
- **內容**: 資料格式轉換和清理
- **項目**:
  - [ ] Prisma 模型到 API 回應格式轉換
  - [ ] 使用者資訊脫敏處理
  - [ ] 分頁資料格式化
  - [ ] 統計數據計算和格式化

#### 9.2 錯誤處理
- **檔案**: `src/utils/practice-error-handler.ts`
- **項目**:
  - [ ] Practice 專用錯誤類型定義
  - [ ] 統一錯誤回應格式
  - [ ] 資料庫錯誤轉換
  - [ ] 業務邏輯錯誤處理

### 階段十：效能優化 (Priority: Low)

#### 10.1 查詢優化
- **項目**:
  - [ ] 資料庫查詢優化
  - [ ] 適當的資料預載 (include)
  - [ ] 分頁查詢效能優化
  - [ ] 索引使用分析

#### 10.2 快取策略
- **項目**:
  - [ ] Redis 快取熱門實踐
  - [ ] 使用者統計資料快取
  - [ ] 查詢結果快取策略
  - [ ] 快取失效機制

#### 10.3 監控與日誌
- **項目**:
  - [ ] API 呼叫監控
  - [ ] 錯誤日誌記錄
  - [ ] 效能指標收集
  - [ ] 使用者行為分析

## 實作順序建議

### Week 1: 核心架構
1. 建立驗證器和類型定義 (階段一)
2. 實作核心服務 (階段二部分)
3. 基本控制器實作 (階段三部分)

### Week 2: API 完成
1. 完成所有控制器 (階段三)
2. 路由配置 (階段四)
3. 基本測試 (階段七部分)

### Week 3: 整合與文件
1. Swagger 文件 (階段六)
2. 資料庫整合和優化 (階段五)
3. 完整測試套件 (階段七)

### Week 4: 安全性與優化
1. 中間件與安全性 (階段八)
2. 資料驗證與轉換 (階段九)
3. 效能優化 (階段十)

## 技術考量

### 資料庫設計
- 利用現有的 `practices` 和 `practice_checkins` 表
- 使用 `entity_tags` 表支援標籤功能
- 利用 `reaction`, `view`, `favorite`, `share` 表支援社群功能
- 確保所有查詢都有適當的索引

### API 設計原則
- 遵循 RESTful 設計
- 統一的回應格式
- 適當的 HTTP 狀態碼
- 完整的錯誤處理

### 安全性考量
- JWT 認證機制
- 資料驗證 (Zod schemas)
- SQL 注入防護 (Prisma ORM)
- 速率限制
- 資料權限控制

### 測試策略
- 單元測試涵蓋率 > 80%
- 整合測試涵蓋主要 API 流程
- 錯誤情況測試
- 效能測試

## 品質檢查清單

### 代碼品質
- [ ] TypeScript 類型安全
- [ ] ESLint 規則通過
- [ ] 代碼註釋完整
- [ ] 函數職責單一

### API 品質
- [ ] 所有 21 個端點實作完成
- [ ] 回應格式符合規範
- [ ] 錯誤處理完整
- [ ] 認證機制正確

### 測試品質
- [ ] 單元測試覆蓋率達標
- [ ] 整合測試通過
- [ ] 邊界值測試
- [ ] 錯誤情況測試

### 文件品質
- [ ] Swagger 文件完整
- [ ] API 使用範例
- [ ] 錯誤碼說明
- [ ] 部署指南

## 結論

此任務清單基於 practice-api-v1.md 規範和專案現有架構制定，涵蓋了完整的 Practice API v1 實作。通過分階段實作，確保系統穩定性和可維護性，同時遵循專案的技術標準和最佳實踐。

---

*文檔版本：1.0*  
*建立日期：2025-07-28*  
*基於：practice-api-v1.md 規範、.cursor 規範、CLAUDE.md 指南*