# Tags 標籤系統重構

## Why is this necessary?

- **缺乏自動補全**：現有標籤 API 無法提供輸入時的即時建議，影響使用者體驗
- **熱門標籤無時間衰減**：無法優先顯示近期活躍的標籤，導致過時標籤佔據熱門列表
- **缺少快取機制**：每次查詢熱門標籤都需要資料庫運算，造成效能瓶頸
- **實體類型受限**：原有設計僅支援 resource，無法擴展至其他實體類型

---

## How does it address?

### 新增 API 端點

| 端點 | 方法 | 說明 |
|------|------|------|
| `/api/v1/tags/popular` | GET | 取得熱門標籤，支援實體類型與時間範圍篩選 |
| `/api/v1/tags/search` | GET | 關鍵字搜尋標籤 |
| `/api/v1/tags/suggest` | GET | 標籤自動補全建議（含匹配類型與使用次數） |
| `/api/v1/tags/prompts` | GET | 取得標籤引導提示語句 |
| `/api/v1/tags/stats/:tagId` | GET | 取得單一標籤的使用統計 |
| `/api/v1/tags/entity` | POST | 為實體新增標籤 |
| `/api/v1/tags/entity` | DELETE | 移除實體標籤 |
| `/api/v1/tags/entity/:entityType/:entityId` | GET | 取得實體的所有標籤 |

### 核心功能實作

- **Redis 快取機制**：熱門標籤查詢結果快取 5 分鐘，避免頻繁資料庫查詢
- **時間衰減篩選**：`timeRange` 參數支援 `7d`、`30d`、`90d`、`1y`、`all`，讓近期使用的標籤優先顯示
- **智慧標籤建議**：`suggestTags` 實作評分演算法，依據匹配類型（exact > prefix > contains）與使用次數排序
- **擴展實體類型**：支援 `resource`、`idea`、`project`、`practice`、`review` 五種實體類型
- **標籤引導提示**：`tag-prompt.service.ts` 提供分類引導語句，協助用戶選擇適當標籤

### 檔案變更摘要

| 檔案 | 變更類型 | 說明 |
|------|----------|------|
| `src/services/tag.service.ts` | 新增 | 完整標籤服務（801 行），含 CRUD、快取、統計功能 |
| `src/services/tag-prompt.service.ts` | 新增 | 標籤引導提示服務（259 行） |
| `src/controllers/tag.controller.ts` | 新增 | 標籤控制器（280 行） |
| `src/routes/tag.routes.ts` | 新增 | 路由定義與 OpenAPI 註冊（343 行） |
| `src/validators/tag.validators.ts` | 新增 | Zod 驗證 Schema（450 行） |
| `tests/unit/services/tag/*.test.ts` | 新增 | 單元測試（57 個測試案例） |
| `src/services/tag-service.ts` | 刪除 | 舊版服務（已遷移至新架構） |
| `src/models/tag.ts`, `entity-tag.ts` | 刪除 | 舊版 Model（改用 Prisma） |

### 測試覆蓋

- `tag.service.test.ts`：37 個測試案例，涵蓋 CRUD、快取、統計功能
- `tag-suggest.test.ts`：20 個測試案例，涵蓋建議演算法、匹配分類、邊界情況
