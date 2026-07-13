# CLAUDE.md

## 專案規範

進行任何開發工作（規劃、實作、除錯、review）前，先讀：

1. `.claude/skills/project-rules/SKILL.md` — 開發規範（response 格式、錯誤處理、命名、風格）
2. `.claude/skills/codebase-map/SKILL.md` — codebase 地圖（不熟結構時先讀，內含新增 endpoint 的完整步驟）

變更可能影響其他 daodao repo（API contract、DB schema、auth）時，先讀 `.claude/skills/system-map/SKILL.md`。

## 關鍵前置

- 剛 clone 或改過 `prisma/schema.prisma` → 先跑 `pnpm run prisma:generate`（client 生成在 `generated/prisma`，沒跑 typecheck 會全掛）
- 本 repo **沒有 prisma migrate**——DB schema 變更源頭在 daodao-storage repo

## Commit 流程

commit 時必須依序執行：

1. 先執行 `.claude/skills/pre-commit-check/SKILL.md` skill 跑品質檢查（lint + typecheck）
2. 檢查通過後，執行 `.claude/skills/format-commit/SKILL.md` skill 產生 commit message
3. 使用者確認後才執行 git commit

## Push 流程

使用者說要 push 時，先詢問「要 review 嗎？」：
- Yes → 執行 `.claude/skills/code-review/SKILL.md` skill，review 完再 push
- No → 直接 push

## 品質檢查指令

- `pnpm run lint` — ESLint 檢查（`lint:fix` 自動修復）
- `pnpm run typecheck` — TypeScript 類型檢查
- `pnpm test` — Jest 測試（`test:unit` / `test:integration` / `test:e2e`）
- `pnpm run schema:drift` — 與 daodao-storage schema 比對漂移

## 工作守則

- 規範文件與 codebase 現實衝突時，以現實為準並修正文件
- 同一個錯誤修三次仍失敗 → 停下來總結「已嘗試什麼、卡在哪」，詢問使用者
- 禁止 force push、禁止修改已存在的 migration、禁止手改生成物
- 制度組成與設計原則見 `.claude/README.md`
