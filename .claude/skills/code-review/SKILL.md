---
name: code-review
description: Push 前 review 整個 branch 的變更，檢查邏輯錯誤、安全問題、效能問題、架構一致性
---

# Code Review

Review 當前 branch 相對於 base branch 的所有變更。

## 步驟 1：取得變更範圍

1. 執行 `git log --oneline dev...HEAD` 確認 commit 數量（本 repo 的 base branch 是 **dev**；若不存在再考慮 main）
2. 執行 `git diff dev...HEAD --stat` 確認變更檔案範圍

## 步驟 2：逐檔 Review

對每個變更的檔案，執行 `git diff dev...HEAD -- <file>` 讀取 diff，檢查：

- **邏輯錯誤**：edge case、null/undefined 未處理、async 錯誤處理、transaction 邊界
- **安全問題**：注入攻擊、硬編碼 secret、缺 auth middleware 的路由、權限檢查（requireRole）遺漏、raw query
- **效能問題**：N+1 query（Prisma include/select 使用）、缺 index 的查詢、未分頁的列表 endpoint
- **架構一致性**：是否遵守 `.claude/skills/project-rules/SKILL.md`（response-helper、AppError、asyncHandler、Zod validator、禁 any、標準 Request）
- **契約影響**：validator/route/response 有變時，`openapi.json` 與 `generated/openapi-types.ts` 是否同步更新；schema 有變時是否走了 system-map 的跨 repo SOP

## 步驟 3：回報結果

以表格格式列出發現的問題：

| 嚴重度 | 檔案 | 問題 | 建議 |
|--------|------|------|------|

嚴重度分三級：
- **High**：必須修，有 bug 或安全風險
- **Medium**：建議修，效能或可維護性問題
- **Low**：可選，風格或小優化

## 步驟 4：處理問題

- High 問題 → 詢問使用者是否要修復
- Medium / Low → 列出即可，由使用者決定
