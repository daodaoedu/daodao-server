---
name: project-rules
description: daodao-server 專案開發規範，涵蓋 API response 格式、錯誤處理、Zod validator、命名慣例、程式碼風格
---

# daodao-server 專案規範

## 環境

- Node.js + Express + TypeScript（`src/` 全 TS，legacy JS 已移除——見 codebase-map）
- 繁體中文互動，註解用英文或繁體中文
- 改 Prisma schema 或剛 clone 後，先跑 `pnpm run prisma:generate`

## API Response 格式

所有 endpoint 一律透過 `src/utils/response-helper.ts`，禁止手組 response 物件：

- 成功：`createSuccessResponse(data)` → `{ success: true, data, timestamp, meta? }`
- 分頁：`createPaginatedResponse` / `createCursorPaginatedResponse`
- 錯誤：不手動回傳——拋 `AppError` 子類，交給 `globalErrorHandler` 統一輸出 `{ success: false, data: null, error: { code, message, details? }, timestamp }`

型別定義在 `src/types/api-response.types.ts`。

## 錯誤處理

- Controller handler 一律包 `asyncHandler`（`src/middleware/error.middleware.ts`）。
- 拋具名錯誤類：`BadRequestError(400)`、`UnauthorizedError(401)`、`ForbiddenError(403)`、`NotFoundError(404)`、`ConflictError(409)`、`UnprocessableEntityError(422)`、`TooManyRequestsError(429)`。
- 禁止在 controller 內 try/catch 後 `res.status(500).json(...)` 手組錯誤。

## Validation

- Zod schema 是 single source of truth，放 `src/validators/<name>.validator.ts`。
- 每個欄位加 `.openapi({ description, example })`——Swagger 文件由此自動生成，`src/swagger/` 目錄是空的，不要在那裡寫 schema。
- Route 層用 `validate(schema)` middleware，controller 內不重複驗證。

## Auth 與 Request 型別

- 一律用標準 Express `Request`，**禁止自訂 `AuthRequest` interface**。
- `req.user` 由 auth middleware（`src/middleware/auth.ts`）填充，型別 augmentation 在 `src/types/express.d.ts`。

## 命名慣例

- 檔名 kebab-case + 分層後綴：`*.controller.ts` / `*.service.ts` / `*.routes.ts` / `*.validator.ts` / `*.types.ts` / `*.middleware.ts`。
- 新 endpoint 的完整分層步驟照 `.claude/skills/codebase-map/SKILL.md` 的清單走。

## 程式碼風格

- **禁 `any`**（eslint error）——用 `unknown` + 型別窄化。既有約 40 處違規是歷史債務，不可新增。
- Service/util 用 factory function 與具名 export function，不用 class（error 型別家族除外）。
- const object + `as const` 取代 enum。
- Prisma import：`import { ... } from '../../generated/prisma'`（依層級調整），一律經 `src/services/database/prisma.service.ts` 的實例存取 DB。
- 所有函式寫 JSDoc。

## Rate Limiting

- Global：1000 requests/min；strict（emails/images）：60 requests/min。

## DB Schema

本 repo **沒有 prisma migrate**。schema 變更源頭在 daodao-storage，流程見 `.claude/skills/system-map/SKILL.md`；改完 prisma schema 跑 `pnpm run schema:drift` 驗證。

## API contract 變更

改了 validator/route/response 後跑 `pnpm run openapi:generate` + `pnpm run openapi:generate-types`，commit 更新後的 `openapi.json` 與 `generated/openapi-types.ts`（f2e 每日從 dev branch 同步此檔）。
