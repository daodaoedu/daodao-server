# 現有 Swagger 配置分析

在實施 Zod v4 零註解方案之前，需要詳細分析現有的 Swagger 配置，確保平穩過渡。

## 📋 現有配置概覽

### 當前架構
- **配置方式**: 使用 `swagger-jsdoc` 手動維護
- **配置檔**: `src/config/swagger.config.ts`
- **Schema 檔案**: `src/swagger/schemas/` (17 個檔案)
- **Path 檔案**: `src/swagger/paths/` (17 個檔案)
- **路由註冊**: `src/app.ts` 中的 `/api-docs` 和 `/api/docs`

---

## 🔍 詳細分析任務

### 1. 現有 Swagger Config 分析

**檔案**: `src/config/swagger.config.ts`

#### 需要保留的配置:
- [ ] **基本資訊**
  - API 標題: "DaoDao 資源管理 API"
  - 版本: "1.0.0"
  - 描述和聯絡資訊
  - License 資訊

- [ ] **Server 配置**
  - 本機開發: `http://localhost:4000`
  - 開發環境: `https://server.daoedu.tw/`
  - 生產環境: `https://dao-server.daoedu.tw/`

- [ ] **安全配置**
  - JWT Bearer Auth 設定
  - 完整的 securitySchemes 配置

- [ ] **通用參數** (components.parameters)
  - idParam, reviewIdParam, resourceIdParam
  - 分頁參數: cursorParam, limitParam, pageParam 等
  - 排序參數: sortParam, orderParam
  - 各種 API 特定的 limit 參數

- [ ] **通用回應** (components.responses)
  - BadRequestError, UnauthorizedError
  - ForbiddenError, NotFoundError
  - ConflictError, InternalServerError

#### 需要遷移的配置:
- [ ] **API 標籤結構** (23 個標籤)
  1. Authentication (`x-order: 1`)
  2. OAuth (`x-order: 2`)
  3. Me (`x-order: 3`)
  4. Users (`x-order: 4`)
  5. Ideas (`x-order: 5`)
  6. Practice (`x-order: 6`)
  7. Practice Check-ins (`x-order: 7`)
  8. Practice Interactions (`x-order: 8`)
  9. Projects (`x-order: 9`)
  10. Milestones (`x-order: 10`)
  11. Notes (`x-order: 11`)
  12. Outcomes (`x-order: 12`)
  13. Reviews (`x-order: 13`)
  14. Mentor (`x-order: 14`)
  15. Resources (`x-order: 15`)
  16. Resource Reviews (`x-order: 16`)
  17. Tags (`x-order: 17`)
  18. Comments (`x-order: 18`)
  19. Email (`x-order: 19`)
  20. Images (`x-order: 20`)
  21. System (`x-order: 21`)
  22. Database Info (`x-order: 22`)
  23. System Monitor (`x-order: 23`)

### 2. Schema 檔案分析

**目錄**: `src/swagger/schemas/`

需要對照的 schema 檔案:
- [ ] `auth.schemas.ts` → `auth.validators.ts`
- [ ] `comment.schemas.ts` → `comment.validators.ts`
- [ ] `email.schemas.ts` → `email.validators.ts`
- [ ] `idea.schemas.ts` → `idea.validators.ts`
- [ ] `image.schemas.ts` → `image.validators.ts`
- [ ] `me.schemas.ts` → `me.validators.ts`
- [ ] `mentor.schemas.ts` → `mentor.validators.ts`
- [ ] `milestone.schemas.ts` → `milestone.validators.ts`
- [ ] `note.schemas.ts` → `note.validators.ts`
- [ ] `outcome.schemas.ts` → `outcome.validators.ts`
- [ ] `practice.schemas.ts` → `practice.validators.ts`
- [ ] `project.schemas.ts` → `project.validators.ts`
- [ ] `resource.schemas.ts` → `resource.validator.ts`
- [ ] `resource-review.schemas.ts` → `resource-review.validator.ts`
- [ ] `review.schemas.ts` → `review.validators.ts`
- [ ] `user.schemas.ts` → `user.validators.ts`
- [ ] `common.schemas.ts` → 需整合到各 validator 中

### 3. Path 檔案分析

**目錄**: `src/swagger/paths/`

需要對照的 path 檔案:
- [ ] `auth.paths.ts` → 自動從 `auth.routes.ts` 掃描
- [ ] `comment.paths.ts` → 自動從 `comment.routes.ts` 掃描
- [ ] `email.paths.ts` → 自動從 `email.routes.ts` 掃描
- [ ] `idea.paths.ts` → 自動從 `idea.routes.ts` 掃描
- [ ] `image.paths.ts` → 自動從 `image.routes.ts` 掃描
- [ ] `me.paths.ts` → 自動從 `me.routes.ts` 掃描
- [ ] `mentor.paths.ts` → 自動從 `mentor.routes.ts` 掃描
- [ ] `milestone.paths.ts` → 自動從 `milestone.routes.ts` 掃描
- [ ] `note.paths.ts` → 自動從 `note.routes.ts` 掃描
- [ ] `outcome.paths.ts` → 自動從 `outcome.routes.ts` 掃描
- [ ] `practice.paths.ts` → 自動從 `practice.routes.ts` 掃描
- [ ] `project.paths.ts` → 自動從 `project.routes.ts` 掃描
- [ ] `resource.paths.ts` → 自動從 `resource.routes.ts` 掃描
- [ ] `resource-review.paths.ts` → 自動從 `resource-review.routes.ts` 掃描
- [ ] `review.paths.ts` → 自動從 `review.routes.ts` 掃描
- [ ] `user.paths.ts` → 自動從 `user.routes.ts` 掃描
- [ ] `common.paths.ts` → 通用路徑配置

### 4. App.ts 中的配置分析

**檔案**: `src/app.ts` (第 98-108 行)

#### 現有設定:
- [ ] **CORS 設定**
  ```typescript
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  ```

- [ ] **雙路由設定**
  - `/api-docs` - 主要路由
  - `/api/docs` - 替代路由

- [ ] **UI 客製化**
  ```typescript
  {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'DaoDao API 文檔'
  }
  ```

---

## 🔄 遷移策略

### 階段 1: 準備階段
1. **完整備份**
   - 備份整個 `src/swagger/` 目錄
   - 備份 `src/config/swagger.config.ts`
   - 建立 git 分支進行開發

2. **相容性確保**
   - 確保現有 API 文檔正常運作
   - 記錄所有現有的 API 路徑和 schema
   - 建立測試案例確保功能完整

### 階段 2: 雙系統並行
1. **新舊系統同時運作**
   - 保持 swagger-jsdoc 系統運作
   - 新增 Zod v4 系統為平行選項
   - 逐步遷移各個 API 模組

2. **測試和驗證**
   - 比較新舊文檔的完整性
   - 確保 API 測試功能正常
   - 驗證認證流程無誤

### 階段 3: 完全遷移
1. **切換到新系統**
   - 更新 app.ts 中的配置引用
   - 移除對舊 swagger 檔案的依賴
   - 保持 URL 和 UI 配置不變

2. **清理工作**
   - 移除不再需要的檔案
   - 更新相依套件
   - 更新文檔和註釋

---

## ✅ 成功檢核清單

### 功能完整性
- [ ] 所有 23 個 API 標籤都正常顯示
- [ ] 所有 API 端點都有對應文檔
- [ ] JWT 認證功能正常運作
- [ ] 所有範例都可以用於測試

### 設定保持
- [ ] CORS 設定正確
- [ ] 雙路由 (`/api-docs`, `/api/docs`) 正常
- [ ] UI 客製化維持不變
- [ ] Server 配置正確

### 品質改善
- [ ] 文檔更新速度更快 (自動生成)
- [ ] 範例更完整真實
- [ ] 維護成本降低
- [ ] 錯誤減少

---

## 📊 影響評估

### 正面影響
- **維護效率**: 從手動維護 34 個檔案降到自動生成
- **一致性**: Schema 定義與驗證邏輯統一
- **範例品質**: 更真實完整的 API 範例
- **開發體驗**: 更快的文檔更新速度

### 潛在風險
- **過渡期複雜度**: 需要同時維護兩套系統
- **設定遺失**: 可能遺失某些手動配置的細節
- **相容性問題**: 新系統可能無法完全重現舊功能
- **測試覆蓋**: 需要確保所有功能都經過測試

### 風險控制
- 完整的備份和版本控制
- 階段性遷移，隨時可以回滾
- 充分的測試和驗證
- 詳細的文檔記錄

---

這個分析確保了 Zod v4 遷移能夠完整保留現有功能，同時帶來顯著的改善！