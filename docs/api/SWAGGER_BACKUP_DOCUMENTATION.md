# Swagger 配置備份文檔

## 備份時間
- 備份日期：2025-09-03
- 備份目錄：`/backup/swagger-backup-20250903-011358/`

## 現有 Swagger 結構

### 主要配置檔案
- `src/config/swagger.config.ts` - 主要 Swagger 配置
- 使用 `swagger-jsdoc` 套件自動掃描註解

### API 標籤結構（23個標籤）

#### 核心業務標籤（1-17）
1. **Authentication** - 用戶認證相關操作
2. **OAuth** - OAuth 第三方登入相關操作
3. **Me** - 個人資料相關操作
4. **Users** - 用戶管理相關操作
5. **Ideas** - 想法分享相關操作
6. **Practice** - 實踐管理相關操作
7. **Practice Check-ins** - 實踐簽到相關操作
8. **Practice Interactions** - 實踐互動相關操作（點讚、收藏、分享等）
9. **Projects** - 專案管理相關操作
10. **Milestones** - 里程碑管理相關操作
11. **Notes** - 便利貼相關操作
12. **Outcomes** - 成果相關操作
13. **Reviews** - 覆盤相關操作
14. **Mentor** - 導師系統相關操作
15. **Resources** - 資源管理相關操作
16. **Resource Reviews** - 資源評價和心得相關操作
17. **Tags** - 標籤管理相關操作

#### 輔助功能標籤（18-23）
18. **Comments** - 評論系統相關操作
19. **Email** - 郵件服務相關操作
20. **Images** - 圖片管理相關操作
21. **System** - 系統狀態和資訊相關操作
22. **Database Info** - 資料庫資訊查詢相關操作
23. **System Monitor** - 系統監控相關操作

### 檔案結構

#### Schemas（20個檔案）
- `src/swagger/schemas/auth.schemas.ts`
- `src/swagger/schemas/comment.schemas.ts`
- `src/swagger/schemas/common.schemas.ts`
- `src/swagger/schemas/db-info.schemas.ts`
- `src/swagger/schemas/email.schemas.ts`
- `src/swagger/schemas/idea.schemas.ts`
- `src/swagger/schemas/image.schemas.ts`
- `src/swagger/schemas/me.schemas.ts`
- `src/swagger/schemas/mentor.schemas.ts`
- `src/swagger/schemas/milestone.schemas.ts`
- `src/swagger/schemas/monitor.schemas.ts`
- `src/swagger/schemas/note.schemas.ts`
- `src/swagger/schemas/outcome.schemas.ts`
- `src/swagger/schemas/practice.schemas.ts`
- `src/swagger/schemas/project.schemas.ts`
- `src/swagger/schemas/resource-review.schemas.ts`
- `src/swagger/schemas/resource.schemas.ts`
- `src/swagger/schemas/review.schemas.ts`
- `src/swagger/schemas/tag.schemas.ts`
- `src/swagger/schemas/user.schemas.ts`

#### Paths（20個檔案）
- `src/swagger/paths/auth.paths.ts`
- `src/swagger/paths/comment.paths.ts`
- `src/swagger/paths/common.paths.ts`
- `src/swagger/paths/db-info.paths.ts`
- `src/swagger/paths/email.paths.ts`
- `src/swagger/paths/idea.paths.ts`
- `src/swagger/paths/image.paths.ts`
- `src/swagger/paths/me.paths.ts`
- `src/swagger/paths/mentor.paths.ts`
- `src/swagger/paths/milestone.paths.ts`
- `src/swagger/paths/monitor.paths.ts`
- `src/swagger/paths/note.paths.ts`
- `src/swagger/paths/outcome.paths.ts`
- `src/swagger/paths/practice.paths.ts`
- `src/swagger/paths/project.paths.ts`
- `src/swagger/paths/resource-review.paths.ts`
- `src/swagger/paths/resource.paths.ts`
- `src/swagger/paths/review.paths.ts`
- `src/swagger/paths/tag.paths.ts`
- `src/swagger/paths/user.paths.ts`

### 服務器配置
1. **本機開發** - `http://localhost:4000`
2. **開發環境** - `https://server.daoedu.tw/`
3. **生產環境** - `https://dao-server.daoedu.tw/`

### 安全配置
- **Bearer Authentication** - JWT Token 認證
- Bearer Format: JWT

### 通用參數
- ID 參數：UUID 格式
- Review ID：字串格式數字
- 分頁參數：cursor, limit, page, pageSize
- 排序參數：sort, order

### 標準回應格式
- ApiSuccessResponse
- ApiErrorResponse
- 標準 HTTP 錯誤回應（400, 401, 403, 404, 409, 500）

## 遷移注意事項

1. **保持相容性**：新系統需要保持現有的 23 個標籤結構
2. **路由完整性**：確保所有現有的 API 端點都被涵蓋
3. **認證整合**：保持 JWT Bearer 認證機制
4. **回應格式**：維持現有的 API 回應格式結構
5. **服務器配置**：保持三個環境的服務器配置

## Zod v4 遷移對照表

目前需要對應到 Zod validators 的檔案：

### 高優先級對應
- `auth.schemas.ts` ↔ `auth.validators.ts`
- `user.schemas.ts` ↔ `user.validators.ts`
- `resource.schemas.ts` ↔ `resource.validator.ts`
- `practice.schemas.ts` ↔ `practice.validators.ts`

### 中優先級對應
- `project.schemas.ts` ↔ `project.validators.ts`
- `review.schemas.ts` ↔ `review.validators.ts`
- `comment.schemas.ts` ↔ `comment.validators.ts`
- `mentor.schemas.ts` ↔ `mentor.validators.ts`

### 其他對應檔案
- `idea.schemas.ts` ↔ `idea.validators.ts`
- `milestone.schemas.ts` ↔ `milestone.validators.ts`
- `outcome.schemas.ts` ↔ `outcome.validators.ts`
- `note.schemas.ts` ↔ `note.validators.ts`
- `me.schemas.ts` ↔ `me.validators.ts`
- `email.schemas.ts` ↔ `email.validators.ts`
- `image.schemas.ts` ↔ `image.validators.ts`
- `resource-review.schemas.ts` ↔ `resource-review.validator.ts`

### 通用檔案
- `common.schemas.ts` ↔ `request-params.validator.ts` + API response types

## 下一步驟

1. 完成所有 validators 的 Zod v4 metadata 更新
2. 開發自動生成腳本
3. 測試新系統與舊系統的一致性
4. 逐步遷移並測試