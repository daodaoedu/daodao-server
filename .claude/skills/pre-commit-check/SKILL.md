---
name: pre-commit-check
description: commit 前執行 lint、typecheck、單元測試，自動修復可修的錯誤
---

# Pre-Commit Check

commit 前的品質檢查。發現錯誤時先嘗試自動修復，修不了的再報告給使用者。

## 步驟 0：確認生成物存在

1. 若 `generated/prisma/` 不存在或剛改過 `prisma/schema.prisma`，先執行 `pnpm run prisma:generate`
2. 沒有這步，lint/typecheck 會因缺型別而全面失敗——**先跑這步再判讀錯誤**

## 步驟 1：執行 lint

1. 執行 `pnpm run lint`
2. 如果有錯誤，執行 `pnpm run lint:fix` 自動修復
3. 再次執行 `pnpm run lint` 確認
4. 仍有錯誤 → 讀取錯誤訊息，手動修復對應檔案

## 步驟 2：執行 typecheck

1. 執行 `pnpm run typecheck`
2. 如果有錯誤 → 讀取錯誤訊息，逐一修復
3. 修復後重新執行 `pnpm run typecheck` 確認

## 步驟 3：執行單元測試

1. 執行 `pnpm run test:unit`（integration / e2e 需要 DB 環境，pre-commit 只跑 unit）
2. 有失敗 → 讀取失敗訊息，修復對應程式碼或測試
3. 修復後重新執行 `pnpm run test:unit` 確認
4. 環境不具備無法執行（缺依賴、缺 DB）→ 不要跳過不提，在回報中註明「測試未執行：<原因>」

## 步驟 4：條件式檢查

- 有動 `prisma/schema.prisma` → 執行 `pnpm run schema:drift`（需 sibling 目錄有 daodao-storage，或設 `STORAGE_SCHEMA_PATH`；環境不具備時註明「未驗證 drift」而非跳過不提）
- 有動 validator/route 的 API contract → 執行 `pnpm run openapi:generate && pnpm run openapi:generate-types`，把更新後的 `openapi.json`、`openapi.yaml`、`generated/openapi-types.ts` 一併納入 commit

## 步驟 5：回報結果

- 全部通過 → 告知使用者可以 commit
- 有無法自動修復的錯誤 → 列出錯誤，詢問使用者如何處理
