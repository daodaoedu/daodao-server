# Server Git 歷史清理審查與執行窗口

本文件只定義 `daodao-server` 的清理政策與核准條件。**合併此 PR 不會刪除 Git 歷史，也不授權 force-push、憑證輪替、刪除輸出或公開 repo。** storage、infra 維持私有。

## 需求與驗收契約

- H-01：以最新所有可取得 refs 建立私有備份與本機候選，核對已知敏感路徑及 literal，不將秘密原值寫入報告。
- H-02：核對逐分支 old/new SHA、工作樹與未合併 PR 保全、current tree 差異；PR refs、cache 與外部 clone 另外處置。
- H-03：有效憑證與服務 consumer 同步輪替，保留既有 DB/PM 資料，不以 Git 清理取代憑證撤銷。
- H-04：持續保持私有；核准窗口及候選後才操作遠端歷史，全部公開條件通過後再獨立決定 visibility。

## 本次目前版本修正

移除仍在 current tree 的舊除錯紀錄 `docs/bug.md`，其中曾捕獲私人資料。此刪除僅影響新版本；舊 commit、PR refs 與 cache 仍需依下列歷史窗口處理。

## 證據與限制

本機演練只證明已知路徑與精準 literal 規則的結果，不是未知 secrets/PII 全面認證。替換規則、原 mirror、bundle、掃描原始輸出只放受限私有儲存，不可 commit、上傳 artifact 或貼 PR。

部署與清理分開驗證：#661 已修正 OAuth 測試清理，但後續部署因 Actions 帳務／額度無法啟動 build，因此目前沒有該 revision 的新部署／dev 冒煙證據。處理窗口前需再次確認當下狀態。

## 範圍與清理政策

| 類別 | 需審閱的正式政策 |
|---|---|
| 歷史整檔移除 | backup.sql、.env.dev_temp、.env.prod_temp、.env.production_temp、docs/bug.md及其曾用別名。先列全歷史path，不能只掃代表blob path。 |
| 精準內容替換 | docs/email、docs/qa的捕獲回應與真實身份資料、scripts/與scripts/other的舊API範例、validator範例，以及其他所有reachable blobs/commit messages內已確認的憑證與fixture literal。值由受限檔案提供，計畫與輸出只記rule ID。 |
| 署名與例外 | author/committer已知mailbox仍在舊演練，需決定保留公開署名或匿名化；官方seed身份也需明確例外決策。不得把literal零命中寫成全部PII已清除。 |
| 旁路 | PR refs/cache、issues/PR body/comment、附件、Actions logs/artifacts、release資產、LFS、forks/外部clone逐類盤點；未涵蓋部分必須列BLOCKED。 |

只改server branches；tags目前0但凍結時仍重查。refs/pull不可一般force-push清除，Support是否接受及何時清除均未保證。Git物件SHA、簽章、PR差異和舊SHA部署證據會改變；必須保存commit map及精確branch映射。

## A — 先處理有效憑證與服務依賴

storage維持private不會使server曾曝光的DB憑證失效。私有輪替盤點的指紋證據顯示歷史候選與pg-dev、pg-prod、server dev/prod、AI dev/prod共6個running consumer設定一致；未用舊值登入，也未確認實際role密碼。先前安全查核記錄server曾被發現public後恢復private；曝光期間、存取者未知，forks_count0不能證明無人取得。

輪替需另核准維護範圍：補查cron/backup/管理端/停機consumer；確認role與私有可還原備份；storage共用DAO_POSTGRES_PASSWORD需先明確dev/prod routing，server主機.env.dev/.env.prod與AI來源同步更新。先dev驗新連線/舊值拒絕及server/AI健康，再prod；不能只改POSTGRES_PASSWORD或重建volume。配合storage部署/備份owner，不假定舊PR287仍open或其能力已上線。精確狀態執行前重查。

PM fixture token另依reservation與保留狀態決定指定輪替、私有config/驗收連結更新及讀回；禁止reset整組保留fixtures。storage私有不代表token風險消失。未完成憑證處置可繼續準備，不能通過公開gate。

## B — 凍結、保全與fresh演練

1. 人確認窗口/執行者、server repo owner與每個worktree owner；凍結server push、merge、bot寫入與部署。storage Git不凍結不重寫；只有輪替需要的storage/AI部署另協調短窗口。不要取消PM驗收或擅改別人的worktree。
2. 重取所有open PR/head、全refs、部署SHA、rulesets/branch protection、全部本機及新增registry metadata；逐owner確認dirty/untracked、detached/local-only/ahead工作。舊盤點只作歷史參考，必須逐 owner 重查。
3. 每owner在私有受限持久位置保全staged/unstaged binary patch、必要untracked檔、local-only commits/bundle、index/權限，記SHA256與還原驗證收據；不讀出payload、不stash/reset/clean/prune他人checkout。/tmp舊副本不能代替正式持久備份。
4. 獨立fresh full mirror取得server所有可列branch/tag/PR refs，保存original bundle、refs manifest與SHA256，fsck/bundle verify。正式工作副本無remote寫入能力；只在其中依核准path/literal/metadata政策重寫。
5. 掃全部reachable blobs/path aliases、messages、metadata與LFS/編碼/binary限制；比較current tree語意差異、branch映射、first-changed commits與affected PR heads。開始/結束refs有漂移即停止、保全新工作並重做，不能用舊mirror覆蓋新增成果。

## C — 可審閱執行預覽（本稿不執行）

核准包必須具備：fresh old→new逐branch SHA表、default新SHA、current-tree差異、可還原備份收據、owner停寫收據、policy決策、CI/dev部署檢查方案及必要保護設定最小變更。

若後續精確核准，執行者僅對核准refs/heads逐branch使用匹配凍結oldSHA的lease/CAS更新；不盲目push --mirror、不刪branches/tags、不推refs/pull。任一lease或保護恢復失敗即停。更新後逐ref回讀、恢復並讀回保護、保持PRIVATE。Support請求只包含server受影響refs/first-changed commits與類別，不傳秘密原值。

Actions與其他輸出另精確核准處置。既有91 artifacts/5034 runs數字是雙repo歷史盤點，不能當server全量已審；已知storage artifact13571559682不在本server刪除範圍。需取得server retained logs/artifacts完整集合並審核，抽查7份雙repologs不構成公開證據。

各owner用fresh clone遷移已審patch/逐筆成果，不merge舊branch歷史；掃移植內容以免再污染。驗required checks、cross-repo SHA pins、dev實際部署與核心唯讀health、PM資料/角色/reservation未變；每層分開記錄。所有來源/旁路與有效憑證處置未齊前維持private。

## 中止與rollback限制

遠端更新前失敗：保留private、修正輸入重演練，不改原repo。部分branch更新後失敗：停寫、保存實際refs、逐branch診斷，不重推整個舊mirror。還原舊歷史會重新引入敏感資料，只能由人另核准且保持private；不能恢復撤銷憑證或刪DB volume。Support/cache/外部clone尚未處理就標部分完成；公開後已被複製內容無法靠轉回private追回。

## 待使用者決策（依序）

1. 確認單獨server清理的實際窗口、owner與有效憑證/指定token輪替維護範圍；storage仍private。
2. 核准署名/seed例外及fresh逐branch候選、備份與凍結收據；之後才核准遠端歷史重寫、必要最小保護變更和精確輸出處置/Support送件。
3. 重寫、輪替、旁路清理、遷移與部署證據全通過後，再獨立決定server公開。現在無visibility變更授權。


## 本機演練快照（2026-11-07）

最新私有 mirror 的 588 個 refs（60 branches、528 PR refs）已在隔離副本演練；備份 bundle、還原 refs 及 fsck 通過。6104 個 reachable blobs 中有 45 次已知 literal 命中；候選 6077 blobs 的同規則命中為 0。五個 exact path 在歷史中已移除；當時 current dev tree 差異僅 docs/bug.md。前後遠端 refs 無漂移，候選無 remote。此為本機候選，不是已執行遠端清理；新增本文件的 PR 合併後須再次 refresh mirror。
