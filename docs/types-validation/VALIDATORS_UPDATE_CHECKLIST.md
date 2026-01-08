# Validators 更新檢查清單

基於專案實際結構，詳細列出所有需要更新的 validators 檔案和具體工作內容。

## 📊 統計概覽 (已更新 - 2024年1月)

- **總計**: 21 個 validator 檔案已檢查
- **完全符合**: 15 個 validators (71%)
- **需要更新**: 6 個 validators (29%)
- **主要業務**: 5 個核心業務 validators (已完成 ✅)
- **次要業務**: 8 個支援業務 validators (全部完成 ✅)
- **輔助功能**: 3 個工具性 validators (已完成 1個，剩餘2個)
- **共用組件**: 3 個共用 validators (部分完成)
- **額外發現**: 2 個未列出的檔案 (其中 1 個已符合)

---

## 🎯 高優先級 - 主要業務 Validators ✅ 已完成

### 1. resource.validator.ts ✅ 完全符合
**檔案位置**: `src/validators/resource.validator.ts`

**檢查結果**: ✅ 完全符合 Zod v4 零註解標準
- [x] 加入 `.describe()` 描述所有欄位
- [x] 使用 `.meta({ examples: [...], title: "..." })` 
- [x] 為所有欄位添加完整範例
- [x] 設定 enum 描述 (`enumDescriptions`)
- [x] 資源類型、費用類型、難度等級 enum 完整
- [x] 資源狀態相關 schema 完整

**狀態**: ✅ 無需更新

### 2. user.validators.ts ✅ 完全符合
**檔案位置**: `src/validators/user.validators.ts`

**檢查結果**: ✅ 完全符合 Zod v4 零註解標準
- [x] 使用者註冊 schema metadata 完整
- [x] 使用者登入 schema metadata 完整
- [x] 使用者更新 schema metadata 完整
- [x] 使用者 profile 相關欄位 完整
- [x] 使用者權限、角色等 enum 完整
- [x] 真實範例資料完整
- [x] 使用者偏好設定相關 schema 完整

**狀態**: ✅ 無需更新

### 3. auth.validators.ts ✅ 完全符合
**檔案位置**: `src/validators/auth.validators.ts`

**檢查結果**: ✅ 完全符合 Zod v4 零註解標準
- [x] JWT 相關 schema metadata 完整
- [x] 登入、註冊 schema metadata 完整
- [x] OAuth 相關 schema 完整
- [x] 密碼重設、驗證等 schema 完整
- [x] Token 驗證相關 schema 完整
- [x] 認證狀態、權限等 enum 完整

**狀態**: ✅ 無需更新

### 4. project.validators.ts ✅ 完全符合
**檔案位置**: `src/validators/project.validators.ts`

**檢查結果**: ✅ 完全符合 Zod v4 零註解標準
- [x] 專案建立、更新 schema 完整
- [x] 專案狀態、類型等 enum 描述完整
- [x] 專案成員管理相關 schema 完整
- [x] 專案進度追蹤 schema 完整
- [x] 專案設定相關欄位完整
- [x] 真實專案範例資料完整

**狀態**: ✅ 無需更新

### 5. practice.validators.ts ✅ 完全符合
**檔案位置**: `src/validators/practice.validators.ts`

**檢查結果**: ✅ 完全符合 Zod v4 零註解標準
- [x] 練習活動相關 schema 完整
- [x] 練習記錄、檢查點 schema 完整
- [x] 練習互動相關 schema 完整
- [x] 練習類型、狀態等 enum 完整
- [x] 練習進度追蹤相關欄位完整
- [x] 練習成果評估 schema 完整

**狀態**: ✅ 無需更新

---

## 🔧 中優先級 - 次要業務 Validators

### 6. review.validators.ts ✅ 完全符合
**檔案位置**: `src/validators/review.validators.ts`

**檢查結果**: ✅ 完全符合 Zod v4 零註解標準
- [x] 評論、評分相關 schema 已添加 `.describe()` 和 `.meta()`
- [x] 評論內容、評分範圍等已添加完整範例
- [x] 評論狀態、類型 enum 已添加 `enumDescriptions`
- [x] 評論回覆相關 schema 已完整設定

**預估時間**: 已完成
**狀態**: ✅ 無需更新

### 7. comment.validators.ts ✅ 完全符合
**檔案位置**: `src/validators/comment.validators.ts`

**檢查結果**: ✅ 完全符合 Zod v4 零註解標準
- [x] 留言系統相關 schema 完整
- [x] 留言內容、回覆等 schema 完整
- [x] 留言狀態、類型 enum 完整
- [x] 留言管理相關欄位完整
- [x] 詳細的 `.describe()` 和 `.meta()` 設定
- [x] `enumDescriptions` 完整
- [x] 真實範例資料完整

**狀態**: ✅ 無需更新

### 8. mentor.validators.ts ✅ 完全符合
**檔案位置**: `src/validators/mentor.validators.ts`

**檢查結果**: ✅ 完全符合 Zod v4 零註解標準
- [x] 導師系統相關 schema 已添加 `.describe()` 和 `.meta()`
- [x] 導師指派、馬拉松關聯等已添加完整範例
- [x] 路徑參數、查詢參數已完整設定
- [x] 分頁查詢相關 schema 已完整設定

**預估時間**: 已完成
**狀態**: ✅ 無需更新

### 9. idea.validators.ts ✅ 完全符合
**檔案位置**: `src/validators/idea.validators.ts`

**檢查結果**: ✅ 完全符合 Zod v4 零註解標準
- [x] 想法、創意相關 schema 已添加 `.describe()` 和 `.meta()`
- [x] 想法分類、標籤、資源等已添加完整範例
- [x] 想法狀態、查詢參數 enum 已添加 `enumDescriptions`
- [x] 事件記錄相關欄位已完整設定

**預估時間**: 已完成
**狀態**: ✅ 無需更新

### 10. milestone.validators.ts ✅ 完全符合
**檔案位置**: `src/validators/milestone.validators.ts`

**檢查結果**: ✅ 完全符合 Zod v4 零註解標準
- [x] 里程碑管理 schema 完整
- [x] 進度追蹤相關欄位完整
- [x] 里程碑類型、狀態 enum 完整
- [x] 成就解鎖相關 schema 完整
- [x] 詳細的 `.describe()` 和 `.meta()` 設定
- [x] `enumDescriptions` 完整

**狀態**: ✅ 無需更新

### 11. outcome.validators.ts ✅ 完全符合
**檔案位置**: `src/validators/outcome.validators.ts`

**檢查結果**: ✅ 完全符合 Zod v4 零註解標準
- [x] 學習成果相關 schema 已添加 `.describe()` 和 `.meta()`
- [x] 成果創建、更新、查詢等已添加完整範例
- [x] 可見性設定 enum 已添加 `enumDescriptions`
- [x] 路徑參數驗證 schema 已完整設定

**預估時間**: 已完成
**狀態**: ✅ 無需更新

### 12. note.validators.ts ✅ 完全符合
**檔案位置**: `src/validators/note.validators.ts`

**檢查結果**: ✅ 完全符合 Zod v4 零註解標準
- [x] 筆記系統 schema 已添加 `.describe()` 和 `.meta()`
- [x] 筆記創建、更新、查詢等已添加完整範例
- [x] 可見性設定 enum 已添加 `enumDescriptions`
- [x] 路徑參數驗證 schema 已完整設定

**預估時間**: 已完成
**狀態**: ✅ 無需更新

### 13. me.validators.ts ✅ 完全符合
**檔案位置**: `src/validators/me.validators.ts`

**檢查結果**: ✅ 完全符合 Zod v4 零註解標準
- [x] 個人資料管理 schema 已添加 `.describe()` 和 `.meta()`
- [x] 個人設定、偏好、資源查詢等已添加完整範例
- [x] 狀態類型、排序方式等 enum 已添加 `enumDescriptions`
- [x] 練習統計、時間範圍設定已完整設定

**預估時間**: 已完成
**狀態**: ✅ 無需更新

### 14. tag.validators.ts ✅ 完全符合 (額外發現)
**檔案位置**: `src/validators/tag.validators.ts`

**檢查結果**: ✅ 完全符合 Zod v4 零註解標準
- [x] 標籤系統相關 schema 完整
- [x] 標籤搜索、管理等 schema 完整
- [x] 標籤類型、狀態 enum 完整
- [x] 詳細的 `.describe()` 和 `.meta()` 設定
- [x] `enumDescriptions` 完整
- [x] 真實範例資料完整

**狀態**: ✅ 無需更新

---

## 🛠️ 低優先級 - 輔助功能 Validators

### 15. email.validators.ts ✅ 完全符合
**檔案位置**: `src/validators/email.validators.ts`

**檢查結果**: ✅ 完全符合 Zod v4 零註解標準
- [x] 郵件發送相關 schema 已添加 `.describe()` 和 `.meta()`
- [x] 郵件模板、收件人、批量發送等已添加完整範例
- [x] 郵件類型、模板類型 enum 已添加 `enumDescriptions`
- [x] 郵件統計、預覽、驗證等設定已完整設定

**預估時間**: 已完成
**狀態**: ✅ 無需更新

### 16. image.validators.ts ✅ 完全符合
**檔案位置**: `src/validators/image.validators.ts`

**檢查結果**: ✅ 完全符合 Zod v4 零註解標準
- [x] 圖片上傳、處理 schema 已添加 `.describe()` 和 `.meta()`
- [x] 圖片格式、大小限制、檔案名稱等已添加完整範例
- [x] 單一檔案、多檔案、增強驗證等 schema 已完整設定
- [x] 檔案上傳請求、參數驗證等已完整設定

**預估時間**: 已完成
**狀態**: ✅ 無需更新

### 17. resource-review.validator.ts ✅ 完全符合
**檔案位置**: `src/validators/resource-review.validator.ts`

**檢查結果**: ✅ 完全符合 Zod v4 零註解標準
- [x] 資源評論相關 schema 已添加 `.describe()` 和 `.meta()`
- [x] 評論內容、評分、時間使用、評分等已添加完整範例
- [x] 評論狀態、評分間距等 enum 已添加 `enumDescriptions`
- [x] 內容特色評估、資源使用方式等已完整設定

**預估時間**: 已完成
**狀態**: ✅ 無需更新

---

## 🔗 共用 Validators

### 18. request-params.validator.ts ❌ 需要更新
**檔案位置**: `src/validators/request-params.validator.ts`

**檢查結果**: ❌ 缺少 Zod v4 metadata 設定
- [ ] 共用的請求參數 schema 需要添加 `.describe()` 和 `.meta()`
- [ ] ID 驗證、分頁參數等需要完整範例
- [ ] 排序、篩選參數 schema 需要 `enumDescriptions`
- [ ] 通用查詢參數需要完整設定

**預估時間**: 1 小時
**狀態**: ❌ 需要更新

### 19. user-custom-id.validators.ts ❌ 需要更新
**檔案位置**: `src/validators/user-custom-id.validators.ts`

**檢查結果**: ❌ 缺少 Zod v4 metadata 設定
- [ ] 使用者自訂 ID 相關 schema 需要添加 `.describe()` 和 `.meta()`
- [ ] ID 格式驗證等需要完整範例
- [ ] 自訂 ID 唯一性檢查需要 `enumDescriptions`
- [ ] ID 類型相關 enum 需要完整設定

**預估時間**: 30 分鐘
**狀態**: ❌ 需要更新

### 20. api-response.validators.ts ✅ 存在但未評估 (額外發現)
**檔案位置**: `src/validators/api-response.validators.ts`

**檢查結果**: ✅ 基礎 API 回應格式驗證器
- [x] API 回應格式 schema
- [x] 分頁回應格式 schema  
- [x] 錯誤回應格式 schema
- [x] 成功回應格式 schema

**狀態**: ✅ 功能完整，為共用基礎組件

### 21. index.ts ✅ 索引檔案 (額外發現)
**檔案位置**: `src/validators/index.ts`

**檢查結果**: ✅ 索引檔案
- [x] 統一導出所有 validators
- [x] 便於模組化管理

**狀態**: ✅ 無需檢查

---

## ✅ 統一品質標準

### 每個 Validator 檔案都需要確保:

**Metadata 完整性**:
- [ ] 所有 schema 都有 `.describe()` 描述
- [ ] 所有欄位都有 `.meta({ title, examples })` 
- [ ] 所有 enum 都有 `enumDescriptions`
- [ ] 範例資料真實且有意義

**程式碼品質**:
- [ ] 遵循專案的 TypeScript 規範
- [ ] 使用一致的命名規則
- [ ] 適當的錯誤訊息 (中文)
- [ ] 合理的驗證規則 (長度、格式等)

**文檔品質**:
- [ ] 清晰的欄位描述
- [ ] 實用的使用範例
- [ ] 適當的 enum 說明
- [ ] 一致的語言風格

---

## 📅 建議執行時程 (更新版)

### ✅ 第 1 階段 - 主要業務 (高優先級) - 已完成 
- **已完成**: resource.validator.ts ✅
- **已完成**: user.validators.ts ✅
- **已完成**: auth.validators.ts ✅
- **已完成**: project.validators.ts ✅
- **已完成**: practice.validators.ts ✅

### 🔧 第 2 階段 - 次要業務 (中優先級) - 進行中
- **Day 1**: review.validators.ts ✅ 已完成
- **Day 2**: mentor.validators.ts, idea.validators.ts ❌
- **Day 3**: outcome.validators.ts, note.validators.ts ❌ 
- **Day 4**: me.validators.ts ❌
- **Day 5**: 品質檢查與測試

### 🛠️ 第 3 階段 - 輔助功能與收尾
- **Day 1**: email.validators.ts, image.validators.ts ❌
- **Day 2**: resource-review.validator.ts ❌
- **Day 3**: request-params.validator.ts, user-custom-id.validators.ts ❌
- **Day 4-5**: 整體測試、品質確保、文檔生成測試

### 📊 當前狀況統計
- **已完成**: 9 個檔案 (43%) ✅
- **剩餘工作**: 12 個檔案 (57%) ❌
- **已節省時間**: 14-17 小時 ✅
- **剩餘預估時間**: 10-13 小時 ⏰

**原總預估時間**: 25-35 小時 (約 3 週工作時間)
**更新後預估**: 10-13 小時 (約 1-1.5 週工作時間)

---

## 🎯 完成檢核標準 (更新版)

### 當前進度統計
- [ ] **所有 21 個 validator 檔案都已更新 Zod v4 metadata** - 目前完成 9/21 (43%)
- [x] **自動生成腳本能正確掃描所有 validators** - ✅ 檔案結構完整
- [ ] **生成的 OpenAPI 文檔包含完整範例** - 需完成剩餘 12 個檔案
- [ ] **Swagger UI 顯示正常，範例可用於測試** - 需完成剩餘檔案更新
- [x] **所有 API 端點都有對應的文檔** - ✅ 結構完整
- [ ] **文檔中的範例資料真實有效** - 僅 9 個檔案符合標準
- [x] **通過 TypeScript 類型檢查** - ✅ 所有檔案語法正確
- [ ] **通過 ESLint 檢查** - 需要運行檢查
- [ ] **所有測試通過** - 需要運行測試

### 優先修復清單
**立即完成 (高優先級)**: ✅ 已完成 5/5
**第二階段 (中優先級)**: ❌ 需修復 5/8 檔案 (1個新完成)
**第三階段 (低優先級)**: ❌ 需修復 5/5 檔案

**總預估修復時間**: 10-13 小時

---

## 📋 實際案例：comment.validators.ts 標準範例

以下是一個**完全符合** Zod v4 零註解標準的實際案例，展示正確的 metadata 設定：

### ✅ 正確範例 - 已符合標準的檔案

```typescript
// src/validators/comment.validators.ts (節選)

export const createCommentSchema = z.object({
  targetType: z.enum(COMMENT_TARGET_TYPES, 'Invalid target type...')
    .describe("留言目標類型")
    .meta({
      title: "目標類型",
      examples: ["post", "resource", "note", "outcome"],
      enumDescriptions: {
        "post": "記事",
        "resource": "資源", 
        "note": "筆記",
        "outcome": "成果",
        "review": "評論",
        "circle": "圈子",
        "idea": "想法",
        "portfolio": "作品集"
      }
    }),
  content: z.string().trim().min(1, 'Comment content cannot be empty')
    .max(5000, 'Comment content cannot exceed 5000 characters')
    .describe("留言內容")
    .meta({
      title: "留言內容",
      examples: [
        "這個資源非常有用，謝謝分享！", 
        "我也遇到了相同的問題，已經解決了", 
        "很棒的分享，期待更多內容"
      ]
    }),
}).describe("創建留言的請求資料").meta({
  title: "創建留言",
  examples: [{
    targetType: "resource",
    targetId: "123e4567-e89b-12d3-a456-426614174000",
    content: "這個資源非常有用，謝謝分享！",
    visibility: "public"
  }]
});
```

### ❌ 需要更新的檔案範例

```typescript
// src/validators/review.validators.ts (節選) - 需要更新

// 目前狀況 - 缺少 metadata
export const moodSchema = z.enum([
  'excellent',
  'good', 
  'neutral',
  'poor',
  'terrible'
], '心情必須是以下之一: excellent, good, neutral, poor, terrible');

// 需要更新為：
export const moodSchema = z.enum([
  'excellent',
  'good', 
  'neutral',
  'poor',
  'terrible'
], '心情必須是以下之一: excellent, good, neutral, poor, terrible')
  .describe("心情評估等級")
  .meta({
    title: "心情狀態",
    examples: ['excellent', 'good', 'neutral', 'poor', 'terrible'],
    enumDescriptions: {
      "excellent": "非常好",
      "good": "良好",
      "neutral": "普通",
      "poor": "不好",
      "terrible": "很糟"
    }
  });
```

### 🔧 修復步驟

1. **添加 `.describe()`**: 為每個 schema 添加中文描述
2. **添加 `.meta()`**: 為每個欄位添加 title 和 examples
3. **添加 `enumDescriptions`**: 為所有 enum 添加中文說明
4. **提供真實範例**: examples 中使用有意義的真實資料
5. **整體 schema metadata**: 為整個 schema 添加完整描述和範例

這個檢查清單確保了 Zod v4 零註解方案的完整實施！