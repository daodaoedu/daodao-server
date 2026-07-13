---
name: codebase-map
description: daodao-server codebase 地圖——src/ 全 TS 架構（legacy JS 已移除）、新增 endpoint 的完整步驟、Prisma 生成時機、已知殘留設定。開工前先讀
---

# daodao-server Codebase 地圖

> 目錄結構有變動時必須同步更新本檔。最後校準：2026-07-06。

## 最重要的事實

**JS→TS 遷移已完成**。根目錄的 legacy `controllers/ models/ routes/`、`index.js`、`src/utils/modelBridge.ts`、MongoDB/Mongoose 皆**已不存在**。若讀到任何文件（舊 CLAUDE.md、openspec、README）描述「雙軌 JS/TS 架構」，那是過時敘述——一律以本檔為準，新程式碼全部寫在 `src/`。

- 進入點：`src/server.ts`（express app、全域 middleware、session/passport、BullMQ queues/workers、`app.listen`）。
- 業務路由與 Swagger：`src/app.ts` 的 `setupTypescriptRoutes(app)`——載入 route 模組觸發 OpenAPI registry，掛 `/api-docs`、`/openapi.json`，再逐一 `app.use('/api/v1/...', ...)`。
- 所有 endpoint 前綴 `/api/v1/`；多數業務路由前置 `requireOnboardingComplete` gate（auth、users、email 等除外）。

## 功能域（皆在 src/，55 controllers / 80+ services / 33 routes）

核心學習（resource、project、milestone、task、note、quiz）、實踐系統（practice-*、buddy-request、encouragement）、社群（comment、reaction、follow、notification-*）、身分（auth、user、me、onboarding、persona）、許願池（roadmap、wish）、問卷（survey）、Email（email-*，`src/services/email/`）、Admin（`admin-*.controller.ts` 約 20 個 + `src/services/admin/`）、基礎設施（`r2.service.ts`、`jwt.service.ts`、`database/prisma.service.ts`、`database/redis.service.ts`）。

## 新增一個 API endpoint 的完整步驟（照抄 resource 系列）

1. **Validator**：`src/validators/<name>.validator.ts` — Zod schema + 每欄位 `.openapi({ description, example })`，import `registry`（`src/config/openapi-registry.ts`）。
2. **Route**：`src/routes/<name>.routes.ts` — `registry.registerPath({...})` 註冊 OpenAPI + `router.<method>(path, authenticate/optionalAuth/requireRole, validate(schema), controllerFn)`。
3. **Controller**：`src/controllers/<name>.controller.ts` — handler 包 `asyncHandler`，用標準 Express `Request`（`req.user` 由 middleware 填充，**禁自訂 AuthRequest**）。
4. **Service**：`src/services/<name>.service.ts` — 業務邏輯，呼叫 `prisma`（import 自 `src/services/database/prisma.service.ts`）。
5. **掛載**：`src/app.ts` 的 `setupTypescriptRoutes` 內 `app.use('/api/v1/<name>', ...)` 並把 route 加進頂部 `routes[]` 陣列。
6. Swagger 由步驟 1/2 自動生成——`src/swagger/` 目錄是空的，**不要**在那裡寫 schema。
7. API contract 變更後：`pnpm run openapi:generate` + `openapi:generate-types` 更新 `openapi.json` 與 `generated/openapi-types.ts`（f2e 靠這個檔同步 types，見 system-map）。

## Prisma（最常見的卡死原因）

- Client 輸出在 **`generated/prisma`**（非 node_modules）。clone 後或改 schema 後**必先** `pnpm run prisma:generate`，否則 lint/typecheck/test 全掛。
- Import 慣例：`import { PrismaClient, Prisma } from '../../generated/prisma'`（依層級調整相對路徑）。
- `prisma/schema.prisma` 有 93 個 model。**本 repo 沒有 `prisma migrate`**——schema 變更源頭在 daodao-storage 的 SQL migration，流程見 `.claude/skills/system-map/SKILL.md` 的「DB Schema 變更 SOP」。改完跑 `pnpm run schema:drift` 驗證。

## 測試

`jest`（ts-jest）：`tests/unit/`（41 檔）、`tests/integration/`（11 檔）、`tests/e2e/`。指令：`pnpm test`、`test:unit`、`test:integration`、`test:e2e`、`test:coverage`。alias `@/`、`@tests/` 由 jest moduleNameMapper 處理。

## 已知殘留與陷阱（改前先知道，不要被誤導）

- `tsconfig.json` 的 `include` 仍列不存在的根目錄 `models/**`、`controllers/**` 等，`paths` 仍有 `@models/*`——無害殘留，勿據此推論架構。
- **兩份 express.d.ts**：`src/types/express.d.ts` 與 `src/types/declarations/express.d.ts` 對 `req.user` 型別定義不同。`.ts-node.json` 只載 declarations 版。動 auth 型別時兩份都要看。
- 路徑 alias 執行期依賴 `tsconfig-paths/register`（僅 `NODE_ENV==='local'`）或 build 時 `tsc-alias`；`.ts-node.json` 只登記 `@/`、`@types/`、`@services/` 三個。大量既有檔案用相對路徑，跟隨周圍程式碼即可。
- `.husky/pre-commit` 跑 `pnpm run lint` + `pnpm run typecheck`，且硬編碼 `/opt/homebrew/bin`。
- eslint 禁 `any`（error），但既有程式碼約 40 處違規（如 `practice-template.service.ts` 的 `const where: any`）——新程式碼不可新增，遇到舊的順手修。
- `openspec/` 是規格驅動工作流（搭配 opsx skills）；`openspec/specs/` 有 15 份能力規格。其 project.md 的統計數字可能落後。

## 品質指令

```
pnpm run prisma:generate   # 先跑（或 types:generate）
pnpm run lint / lint:fix   # eslint src/**/*.ts
pnpm run typecheck         # tsc --noEmit
pnpm test                  # jest --runInBand
pnpm run schema:drift      # 需 ../daodao-storage 存在或設 STORAGE_SCHEMA_PATH
```
