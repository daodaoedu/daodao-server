# 城市服務與認證功能增強

## Why is this necessary?

- **城市系統受限於台灣**：原有城市設計僅支援台灣縣市（硬編碼映射表），無法擴展至全球城市
- **缺乏多語系支援**：城市名稱無法根據用戶語系動態切換顯示
- **郵件驗證流程不完整**：缺少從郵件連結直接點擊驗證的 GET 端點和重發驗證郵件功能
- **OAuth 用戶狀態不明確**：無法區分新註冊用戶與既有用戶，影響前端引導流程
- **Apple OAuth email 驗證邏輯缺失**：未正確處理 Apple 回傳的 `email_verified` 狀態

---

## How does it address?

### 新增城市 API 服務

| 端點 | 方法 | 說明 |
|------|------|------|
| `/api/v1/cities` | GET | 取得城市列表，支援國家篩選、關鍵字搜尋、語系切換 |
| `/api/v1/cities/countries` | GET | 取得所有國家列表 |
| `/api/v1/cities/validate/:code` | GET | 驗證城市代碼有效性 |

### 認證功能增強

| 端點 | 方法 | 說明 |
|------|------|------|
| `/api/v1/auth/verify-email` | GET | 郵件連結點擊驗證（302 重定向） |
| `/api/v1/auth/resend-verification` | POST | 重新發送驗證郵件（含嚴格速率限制） |

### 核心功能實作

- **全球城市支援**：`cityService` 提供城市查詢、搜尋、國家篩選功能，支援 `zh-TW`、`en` 語系
- **併發安全的 Location 建立**：`findOrCreateLocation` 使用 find-then-create 模式處理 race condition
- **OAuth isNewUser 標記**：OAuth 回調新增 `isNewUser` 標記，讓前端區分新用戶並引導完成註冊
- **Apple email 驗證邏輯**：根據 `emailVerified` 和 `isPrivateEmail` 狀態決定是否自動標記已驗證
  - Private relay email（@privaterelay.appleid.com）不自動標記為已驗證
- **日誌服務統一**：將 `console.log/error` 替換為 `loggerService`

### 資料庫 Schema 更新

| 表格 | 變更 | 說明 |
|------|------|------|
| `city` | 新增欄位 | `name_en`, `name_zh_tw`, `country_id`, `is_active` |
| `country` | 新增欄位 | `name_en`，建立與 `city` 的關聯 |
| `contacts` | 放寬長度 | `threads`, `github` 由 30/50 擴展至 255 字元 |
| `users` | 新增欄位 | `custom_position`（自訂職位名稱） |
| `migration_history` | 新增表格 | 追蹤 migration 執行記錄 |

### 檔案變更摘要

| 檔案 | 變更類型 | 說明 |
|------|----------|------|
| `src/services/city.service.ts` | 新增 | 城市服務層（365 行） |
| `src/controllers/city.controller.ts` | 新增 | 城市控制器（83 行） |
| `src/routes/city.routes.ts` | 新增 | 路由與 OpenAPI 註冊（117 行） |
| `src/validators/city.validators.ts` | 新增 | Zod 驗證 Schema（212 行） |
| `src/controllers/auth.controller.ts` | 修改 | 新增 GET verify-email、resend-verification |
| `src/services/auth/auth.service.ts` | 修改 | 新增 isNewUser 標記、Apple email 驗證邏輯 |
| `src/services/user.service.ts` | 修改 | 移除硬編碼城市映射，改用 cityService |
| `prisma/schema.prisma` | 修改 | 新增城市國際化欄位、migration_history 表 |
| `tests/unit/services/city.service.test.ts` | 新增 | 城市服務單元測試（477 行） |

### 測試覆蓋

- `city.service.test.ts`：完整城市服務測試，涵蓋查詢、搜尋、國家篩選、Location 建立
- `auth.service.test.ts`：更新 isNewUser 標記、Apple OAuth 相關測試
- `user.service.test.ts`：更新城市處理相關測試
