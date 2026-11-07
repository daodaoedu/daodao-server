# PR CI 執行範圍

每個 PR 都回報固定的合併檢查；只省略已明確判定不相關的重型工作。required checks 的名稱維持 `workflow-tests`、`test`、`Compare SQL ↔ Prisma schemas` 與既有 PR evidence。GitHub ruleset 不需要變更。

## 執行順序

`workflow-tests` 先取得完整 Git 歷史，以 PR base/head 的 merge-base 計算差異，再執行 `.github/scripts/ci-selection.py`。不使用有檔案數上限的 PR files API；rename 關閉折疊，因此舊路徑、刪除與新路徑都會被分類。差異讀取失敗會令檢查失敗，不以空差異放行。

選擇結果通過完整性驗證後，只有相關變更才安裝 Python 測試相依並執行 workflow 自測。`backend` job 在啟動 PostgreSQL／Redis 與安裝 Node 相依之前套用選擇條件；選中時仍執行完整 Jest、lint、typecheck、runner tests 與類型產生。OAuth 選中時才啟動 Mailpit 並執行既有完整 OAuth 整合測試。

固定的 `test` gate 使用 `always()` 等待上游，並驗證：選擇及 workflow 自測成功、所有選擇旗標完整、選中的 backend 成功且提供 artifact、未選中的 backend 明確 skipped。失敗、取消、遺漏輸出或非預期 skip 都不能通過。CD 繼續從 `jobs.test.outputs.artifact-name` 取得既有 artifact。

Schema workflow 保持單一固定名稱的 required check。在相同的選擇與完整性驗證後，才執行跨 repo checkout、安裝與 schema 檢查，無關 PR 不啟動這些工作。原有排程、手動 paired revisions 驗證及 paired fullstack journeys 保留。

## 分類規則

| 變更 | Backend | OAuth | Schema drift | Workflow 自測 |
|---|---|---|---|---|
| 文件 Markdown（不含 src/tests/public）、docs 下 rst/txt、LICENSE | — | — | — | — |
| monitor／db-info 獨立 router、monitor.html、生成的 OpenAPI | 完整 | — | — | — |
| 一般 `.test.ts`／`.spec.ts` 測試案例 | 完整 | — | — | — |
| OAuth integration 目錄、auth service 目錄（含其測試） | 完整 | 完整 | — | — |
| 一般 src TypeScript／其他 tests 執行檔 | 完整 | 完整 | — | — |
| Prisma 目錄 | 完整 | 完整 | ✓ | — |
| `.schema-drift-ignore.json` | — | — | ✓ | — |
| schema checker | 完整 | — | ✓ | — |
| CI、依賴、lockfile、未知檔案或設定 | 完整 | 完整 | ✓ | ✓ |

多種變更取聯集。只有上表明列的隔離路徑才省略 OAuth：整合測試會載入整個 `organization.routes.ts`，因此 cohort、practice、user、resource、email queue、logger、config、utils 等變更仍保留 OAuth，不能只看檔名含不含 auth。monitor／db-info router 則不由該整合 app 載入。生成檔單獨變更仍有完整 backend 檢查，與來源一起修改時採取來源所需的較廣範圍。

任意 `.txt`／`.rst`／Markdown 並不一律是文件：例如 `public/robots.txt` 和 `src/templates/*.md` 仍採保守完整檢查。新增未知腳本不會自動跳過。

## 完整回歸與發布

非 PR 呼叫一律選完整範圍，包括 CD 的 `push`、手動執行與每日 01:15 UTC（台北 09:15）的完整回歸。排程執行 default branch；目前 server default branch 是 `dev`。CI workflow 本身不部署。Schema 另保留既有每日 02:00 UTC 的完整漂移檢查。

先完成本機回歸、workflow 語法檢查及近期 PR 差異重播；發布後才能比較實際 GitHub runner 耗時。省略幾組工作不等同已量到加速，仍有 checkout 與 required gate 的固定成本。
