# Zod v4 零註解方案實作任務清單

基於 `ZOD_V4_ZERO_ANNOTATION_GUIDE.md` 的完整實作任務規劃。

## 📚 相關文檔

本文檔為主要任務清單，建議搭配以下詳細文檔使用：

- **[VALIDATORS_UPDATE_CHECKLIST.md](./VALIDATORS_UPDATE_CHECKLIST.md)** - 17 個 validator 檔案的詳細更新檢查清單
- **[CURRENT_SWAGGER_ANALYSIS.md](./CURRENT_SWAGGER_ANALYSIS.md)** - 現有 Swagger 配置的詳細分析與遷移策略
- **[ZOD_V4_ZERO_ANNOTATION_GUIDE.md](./ZOD_V4_ZERO_ANNOTATION_GUIDE.md)** - 技術實作指南與範例程式碼

## 🎯 專案目標

利用 **Zod v4 內建的 metadata 功能**，實現零註解自動生成帶完整範例的 Swagger 文檔。

**核心優勢**：

- ✅ **零額外依賴** - 純 Zod v4 內建功能
- ✅ 零手動註解
- ✅ 完整 Example Values
- ✅ 線上測試 API
- ✅ 產出 openapi.yaml
- ✅ 不依賴第三方維護風險

---

## 📋 實作任務清單

### 階段 1: 環境升級與準備 🔧

#### 1.1 Zod 版本升級

- [x] **檢查目前 Zod 版本**
  - ✅ 檢查 `package.json` 中的 zod 版本 (已是 4.1.5)
  - ✅ 檢查是否有版本衝突的相依套件 (無衝突)
- [x] **升級到 Zod v4**
  - ✅ 執行 `pnpm add zod@^4.0.0` (已完成升級)
  - ✅ 更新相關型別定義
  - ✅ 檢查升級後的相容性

#### 1.2 現有 Swagger 配置分析

> 📋 **詳細分析**: 請參閱 [CURRENT_SWAGGER_ANALYSIS.md](./CURRENT_SWAGGER_ANALYSIS.md) 了解現有 34 個 Swagger 檔案的詳細對照表、23 個 API 標籤分析，以及完整的遷移策略。

- [x] **分析現有 swagger.config.ts**
  - ✅ 檢查目前使用的 `swagger-jsdoc` 配置
  - ✅ 識別現有的 schemas 和 paths 結構
  - ✅ 確認目前的 API 路徑和標籤分類 (23 個標籤)

- [x] **分析現有 src/swagger/ 目錄**
  - ✅ 檢查 `src/swagger/schemas/` 中的 20 個 schema 檔案
  - ✅ 檢查 `src/swagger/paths/` 中的 20 個 path 檔案
  - ✅ 評估目前手動維護的 Swagger 標註工作量

#### 1.3 專案結構檢查

- [x] **確認現有 validators 目錄結構**
  - ✅ 檢查 `src/validators/` 目錄內容 (18 個檔案)
  - ✅ 對照 validators 與 swagger schemas 的對應關係
- [x] **檢查現有 Zod schemas**
  - ✅ 分析現有 schema 的使用模式
  - ✅ 識別需要更新的 schema 檔案
  - ✅ 評估 Zod v4 metadata 串接的難度

### 階段 2: Zod v4 Metadata 整合 🏗️

#### 2.1 核心 Validators 更新

> 💡 **詳細清單**: 請參閱 [VALIDATORS_UPDATE_CHECKLIST.md](./VALIDATORS_UPDATE_CHECKLIST.md) 了解每個 validator 的具體更新內容、預估時間和優先級分類。

**主要業務 Validators** (高優先級):

- [x] **更新 resource.validator.ts**
  - ✅ 加入 `.describe()` 描述
  - ✅ 使用 `.meta({ examples: [...], title: "..." })`
  - ✅ 為所有欄位添加完整範例
  - ✅ 設定 enum 描述 (`enumDescriptions`)

- [x] **更新 user.validators.ts**
  - ✅ 使用者註冊、登入、更新 schema 的 metadata
  - ✅ 加入真實範例資料
  - ✅ 處理 user profile 相關欄位

- [x] **更新 auth.validators.ts**
  - ✅ JWT、登入、註冊等 schema 的 metadata
  - ✅ OAuth 相關 schema 更新
  - ✅ 密碼重設、驗證等 schema

- [ ] **更新 project.validators.ts**
  - 專案建立、更新 schema
  - 專案狀態、類型等 enum 描述
  - 專案成員管理相關 schema

- [x] **更新 practice.validators.ts**
  - ✅ 練習活動相關 schema
  - ✅ 練習記錄、檢查點 schema
  - ✅ 練習互動相關 schema

**次要業務 Validators** (中優先級):

- [ ] **更新 review.validators.ts**
  - 評論、評分相關 schema
  - 評論內容、評分範圍等

- [ ] **更新 comment.validators.ts**
  - 留言系統相關 schema
  - 留言內容、回覆等

- [ ] **更新 mentor.validators.ts**
  - 導師系統相關 schema
  - 導師配對、輔導記錄等

- [ ] **更新 idea.validators.ts**
  - 想法、創意相關 schema
  - 想法分類、標籤等

- [ ] **更新 milestone.validators.ts**
  - 里程碑管理 schema
  - 進度追蹤相關欄位

- [ ] **更新 outcome.validators.ts**
  - 學習成果相關 schema
  - 成果類型、評估等

- [ ] **更新 note.validators.ts**
  - 筆記系統 schema
  - 筆記內容、分類等

- [ ] **更新 me.validators.ts**
  - 個人資料管理 schema
  - 個人設定、偏好等

**輔助功能 Validators** (低優先級):

- [ ] **更新 email.validators.ts**
  - 郵件發送相關 schema
  - 郵件模板、收件人等

- [ ] **更新 image.validators.ts**
  - 圖片上傳、處理 schema
  - 圖片格式、大小限制等

- [ ] **更新 resource-review.validator.ts**
  - 資源評論相關 schema
  - 評論內容、評分等

**共用 Validators**:

- [ ] **更新 request-params.validator.ts**
  - 共用的請求參數 schema
  - ID 驗證、分頁參數等

- [ ] **更新 user-custom-id.validators.ts**
  - 使用者自訂 ID 相關 schema
  - ID 格式驗證等

**統一品質標準**:

- [ ] **所有 validators 品質檢查**
  - 統一 metadata 格式和範例品質
  - 確保所有 enum 都有 `enumDescriptions`
  - 檢查範例資料的真實性和有效性
  - 統一描述文字的語言和風格

#### 2.2 API Response Schemas

- [x] **建立標準 API 回應格式**
  - ✅ `apiSuccessResponseSchema` with metadata
  - ✅ `apiErrorResponseSchema` with metadata
  - ✅ `paginatedResponseSchema` with metadata  
  - ✅ `cursorPaginatedResponseSchema` with metadata
  - ✅ `responseMetaSchema` with comprehensive metadata fields
  - ✅ 創建 `src/validators/api-response.validators.ts` 包含完整 Zod v4 schemas 和 metadata
- [x] **Response Schema 整合**
  - ✅ 確保所有 controller 使用統一回應格式（已實現，透過 response-helper.ts）
  - ✅ 加入 timestamp、meta 等標準欄位（已存在於所有 20 個 service 檔案中）
  - ✅ TypeScript 型別與 Zod schemas 完全一致

### 階段 3: 自動生成腳本開發 🤖

#### 3.1 Metadata 提取功能

- [x] **開發 metadata 提取函數**
  - ✅ `extractZodV4Metadata()` 函數
  - ✅ 支援 `.describe()` 和 `.meta()` 提取
  - ✅ 處理巢狀 schema 的 metadata
- [x] **Schema 載入系統**
  - ✅ `loadZodV4SchemasWithMetadata()` 函數
  - ✅ 動態載入所有 validator 檔案
  - ✅ 錯誤處理和警告系統

#### 3.2 路由掃描功能

- [x] **路由自動掃描**
  - ✅ `scanRouteDefinitions()` 函數
  - ✅ 掃描 `src/routes/**/*.routes.ts` 檔案
  - ✅ 提取 HTTP methods 和路徑（基礎架構）
- [ ] **路由 metadata 關聯**
  - 自動關聯路由與對應的 schema
  - 生成適當的 tags 和 summary

#### 3.3 OpenAPI 生成引擎

- [x] **開發 `generate-swagger.ts` 腳本**
  - ✅ 完整的 OpenAPI 3.0 結構生成
  - ✅ Zod v4 metadata 轉換為 OpenAPI format
  - ✅ 支援多重範例 (examples array)
  - ✅ 成功生成了 81 個 schemas
- [x] **Schema 轉換優化**
  - ✅ 使用 Zod v4 內建的 JSON Schema 生成功能
  - ✅ 自動整合 Zod v4 的 metadata 到 JSON Schema 輸出
  - ✅ 移除不必要的 `$schema` 屬性
  - ✅ 確保 `.describe()` 和 `.meta()` 正確轉換

### 階段 4: Express.js 整合 🚀

#### 4.1 Swagger 配置遷移與整合

- [x] **備份現有 Swagger 配置**
  - ✅ 備份 `src/config/swagger.config.ts`
  - ✅ 備份 `src/swagger/` 整個目錄
  - ✅ 文檔化目前的 API 結構和標籤分類
  - ✅ 創建 `SWAGGER_BACKUP_DOCUMENTATION.md` 文檔
  - ✅ 備份位置：`/backup/swagger-backup-20250903-011358/`

- [x] **更新 `src/app.ts` 中的 Swagger 配置**
  - ✅ 取代目前的 `swaggerSpec` 引用
  - ✅ 使用新的 `openapi.json` 檔案（帶回退機制）
  - ✅ 保持現有的 CORS 設定和 UI 配置
  - ✅ 確保 `/api-docs` 和 `/api/docs` 路由正常運作
  - ✅ 加入錯誤處理和舊配置回退機制

- [ ] **測試和驗證新舊系統**
  - 測試現有 Swagger UI 功能不受影響
  - 驗證新 Zod v4 生成的文檔品質
  - 確保 API 測試功能正常

#### 4.2 認證整合

- [ ] **JWT 認證配置**
  - 設定 `bearerAuth` security scheme
  - 為需要認證的路由加上 security 要求
  - 測試認證流程

### 階段 5: 自動化與 CI/CD 🔄

#### 5.1 pnpm scripts 配置

- [ ] **新增 package.json scripts**

  ```json
  {
    "swagger:generate": "ts-node scripts/generate-swagger.ts",
    "swagger:watch": "nodemon --watch src/validators --exec pnpm run swagger:generate",
    "swagger:legacy": "swagger-jsdoc 舊系統命令 (保留以防報錯)",
    "dev": "pnpm run swagger:generate && pnpm run dev:server"
  }
  ```

- [ ] **開發模式整合**
  - 開發時自動重新生成文檔
  - Watch validators 檔案變化自動重新生成

#### 5.2 系統更換

- [ ] **直接更換舊系統**
  - 完成 Zod v4 validators 更新後
  - 更新 `src/app.ts` 使用新的 `openapi.json`
  - 停用舊的 swagger-jsdoc 系統

- [ ] **清理舊檔案**
  - 移除 `src/swagger/` 目錄 (34 個檔案)
  - 移除舊的 swagger 相依套件
  - 簡化 `src/config/swagger.config.ts` (只保留基本配置)

### 階段 6: 測試與驗證 🧪

#### 6.1 功能測試

- [ ] **自動生成測試**
  - 驗證所有 17 個 validators 都能正確載入
  - 檢查 metadata 提取的完整性
  - 驗證 OpenAPI 文檔格式正確性
  - 測試路由掃描功能不遺漏 API 端點

- [ ] **Swagger UI 測試**
  - 測試所有 API 端點的文檔顯示
  - 驗證範例資料的正確性
  - 測試線上 API 呼叫功能
  - 確保 JWT 認證正常運作

- [ ] **相容性測試**
  - 測試新舊兩系統的 API 文檔一致性
  - 驗證現有客戶端不受影響
  - 測試所有 23 個 API 標籤的完整性

#### 6.2 效能測試

- [ ] **大型 Schema 效能測試**
  - 測試大量 validators 的載入時間
  - 文檔生成時間測試
  - Memory usage 監控
- [ ] **生產環境測試**
  - 部署環境文檔生成測試
  - 負載測試下的文檔服務穩定性

### 階段 7: 文檔與維護 📚

#### 7.1 使用說明文檔

- [ ] **開發者指南**
  - 如何新增 Zod v4 metadata
  - Best practices 指南
  - 範例資料編寫準則
  - 從 swagger-jsdoc 遷移到 Zod v4 的指南

- [ ] **API 文檔最佳化**
  - 確保所有範例資料真實有效
  - 加入詳細的欄位說明
  - 提供使用情境說明
  - 保持 23 個 API 標籤的完整分類

- [ ] **遷移文檔**
  - 記錄從舊系統到新系統的變化
  - 提供新舊系統的對照表
  - 記錄可能的破壞性變更

#### 7.2 維護機制

- [ ] **監控機制**
  - Schema 變更自動重新生成文檔
  - 錯誤回報和日誌系統

- [ ] **版本升級準備**
  - Zod 後續版本相容性計劃
  - 簡化的維護流程

#### 7.3 最終驗證

- [ ] **功能驗證**
  - 確保所有 17 個 validators 都正常生成文檔
  - 確保 23 個 API 標籤都正常顯示
  - 確保所有範例都可以用於測試
  - 測試 JWT 認證功能正常

- [ ] **效能測試**
  - 文檔生成速度測試
  - Swagger UI 載入效能
  - API 回應時間測試

---

## 🗂️ 檔案結構預覽

完成後的專案結構：

```text
daodao-server/
├── src/
│   ├── validators/           # 更新的 Zod v4 validators
│   │   ├── auth.validators.ts        # ✨ 加入 metadata
│   │   ├── comment.validators.ts     # ✨ 加入 metadata
│   │   ├── email.validators.ts       # ✨ 加入 metadata
│   │   ├── idea.validators.ts        # ✨ 加入 metadata
│   │   ├── image.validators.ts       # ✨ 加入 metadata
│   │   ├── me.validators.ts          # ✨ 加入 metadata
│   │   ├── mentor.validators.ts      # ✨ 加入 metadata
│   │   ├── milestone.validators.ts   # ✨ 加入 metadata
│   │   ├── note.validators.ts        # ✨ 加入 metadata
│   │   ├── outcome.validators.ts     # ✨ 加入 metadata
│   │   ├── practice.validators.ts    # ✨ 加入 metadata
│   │   ├── project.validators.ts     # ✨ 加入 metadata
│   │   ├── resource.validator.ts     # ✨ 加入 metadata
│   │   ├── resource-review.validator.ts # ✨ 加入 metadata
│   │   ├── review.validators.ts      # ✨ 加入 metadata
│   │   ├── user.validators.ts        # ✨ 加入 metadata
│   │   ├── user-custom-id.validators.ts # ✨ 加入 metadata
│   │   ├── request-params.validator.ts # ✨ 加入 metadata
│   │   └── index.ts                  # ✨ 統一匯出
│   ├── routes/              # 路由定義 (17+ 檔案)
│   ├── controllers/         # 控制器 (17+ 檔案)
│   ├── services/            # 業務邏輯服務
│   └── app.ts              # ✨ 整合 Swagger UI
├── scripts/
│   └── generate-swagger.ts    # ✨ 自動生成腳本
├── docs/
│   └── ZOD_V4_IMPLEMENTATION_TASKS.md # 📋 本任務清單
├── openapi.yaml            # ✨ 生成的文檔
├── openapi.json            # ✨ 生成的文檔
└── package.json            # ✨ 更新的 scripts
```

---

## 🚀 執行順序建議

### Phase 1 (基礎設定)

1. 執行階段 1.1 - 1.2 (環境升級與結構檢查)
2. 執行階段 2.1 (核心 validators 更新)

### Phase 2 (核心功能)

1. 執行階段 3.1 - 3.3 (自動生成腳本開發)
2. 執行階段 2.2 (API Response schemas)

### Phase 3 (整合測試)

1. 執行階段 4.1 - 4.2 (Express.js 整合)
2. 執行階段 6.1 (功能測試)

### Phase 4 (自動化與文檔)

1. 執行階段 5.1 - 5.2 (自動化設定)
2. 執行階段 7.1 - 7.2 (文檔與維護)

---

## 🎯 成功指標

專案完成後應達到以下目標：

- [ ] **零額外依賴**: 僅使用 Zod v4 內建功能
- [ ] **完整範例**: 所有 API 欄位都有真實範例
- [ ] **自動同步**: Schema 變更自動更新文檔
- [ ] **線上測試**: 完整的 Swagger UI 測試環境
- [ ] **標準輸出**: 產出標準 OpenAPI 3.0 YAML/JSON
- [ ] **長期穩定**: 基於 Zod 官方 API，無第三方風險

---

## 📝 備註

- 本任務清單基於 `ZOD_V4_ZERO_ANNOTATION_GUIDE.md` 的技術規格
- 建議按照階段順序執行，確保每個階段完成後再進入下一階段
- 遇到問題時請參考原始技術指南文檔
- 建議在開發過程中持續測試和驗證功能正確性

## 📖 如何使用這些文檔

1. **開始前**: 閱讀 [ZOD_V4_ZERO_ANNOTATION_GUIDE.md](./ZOD_V4_ZERO_ANNOTATION_GUIDE.md) 了解技術原理
2. **現況分析**: 使用 [CURRENT_SWAGGER_ANALYSIS.md](./CURRENT_SWAGGER_ANALYSIS.md) 了解需要遷移的內容
3. **執行工作**: 按照本文檔的 7 個階段執行任務
4. **詳細作業**: 使用 [VALIDATORS_UPDATE_CHECKLIST.md](./VALIDATORS_UPDATE_CHECKLIST.md) 進行具體的 validator 更新工作

> 💡 **提示**: 建議將這些文檔加入書籤，方便在開發過程中快速查閱！
