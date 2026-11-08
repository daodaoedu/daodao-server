# 離線日誌封存原型（#509）

這個工具只用合成、已完成的 gzip JSONL，在本機驗證封存流程。它沒有 S3/R2 adapter、網路端點或憑證參數，不會接入 Express、Winston、Compose 或排程。請勿把正式日誌、備份或 env 放入原型資料夾。

## 要驗證的行為

1. Producer 提供完成 manifest，明確指定環境、服務、日期、邏輯 artifact ID、相對來源檔名、壓縮大小與 SHA-256。完成標記是合成 producer 的契約，不能用檔案 mtime 推論真實 logger 已關檔。
2. Capture 驗證來源範圍、gzip JSONL 與完整性，再保存可重試的本機副本。Capture 成功後刪除原始合成檔，pending 副本仍須能送出。
3. 本機 mock store 寫入實際 bytes。工具重新讀回並核對大小與 SHA-256，才持久記錄 ack。Put 失敗或讀回不符都維持 pending。
4. Put 完成、ack 前程序中斷時，新程序重試使用相同不可變物件；不同邏輯 artifact 不因內容相同而被合併，也不覆蓋其他環境物件。
5. Cleanup 只清理已 ack 的本機副本，不刪 pending、不刪 mock store。容量不足時拒絕新 capture，保留來源；這是原型行為，尚未核准正式滿載政策。
6. 原始來源與已 ack 的本機副本清掉後，仍可從 mock store 的 gzip 用 DuckDB 查回相同合成記錄。

本機的 atomic rename、fsync 與單寫入者鎖，用於縮小程序中斷造成的狀態缺口；這不是跨主機 exactly-once 投遞保證，也不是針對惡意本機使用者的檔案系統 sandbox。資料目錄應由同一位可信任使用者控制。

## 驗證與交付界線

測試放在 `scripts/log-archive-prototype/__tests__/`，使用 Python 標準庫與暫存目錄，不需安裝 server 的 Node 套件。

```sh
python3 -m unittest discover -s scripts/log-archive-prototype/__tests__ -v
```

DuckDB 回查沿用 #510 的離線 reader，僅在隔離的 `uv` 環境使用 DuckDB 2.0.0；它不構成本工具的 runtime dependency。查詢只選明確列出的 mock-store gzip，使用 timestamp、level、message 欄位，核對筆數與內容。

這輪不代表 #509 AC 全部完成。仍待核准及驗證：真實來源與 producer 完成訊號、完整日誌遮罩、保留期/RPO/預算、private R2 最小權限、真遠端讀回、正式 spool 容量與備份、外部告警及主機導入。尤其尚未解決 Winston `maxFiles` 在 capture 前刪檔的競爭。#506 環境日誌隔離仍暫停；本工具不修改其掛載或部署。

## 執行合成範例

在 repo 根目錄執行，下列 `mktemp` 只建立專屬父目錄；demo 的目標子目錄必須尚未存在。

```sh
DEMO_PARENT=$(mktemp -d)
DEMO_PARENT=$(cd "$DEMO_PARENT" && pwd -P)
python3 scripts/log-archive-prototype/archive.py demo "$DEMO_PARENT/fixture"
python3 scripts/log-archive-prototype/archive.py --config "$DEMO_PARENT/fixture/config.json" capture "$DEMO_PARENT/fixture/completed.json"
python3 scripts/log-archive-prototype/archive.py --config "$DEMO_PARENT/fixture/config.json" retry
python3 scripts/log-archive-prototype/archive.py --config "$DEMO_PARENT/fixture/config.json" status
python3 scripts/log-archive-prototype/archive.py --config "$DEMO_PARENT/fixture/config.json" cleanup
```

`demo` 產生三筆 `synthetic-0`、`synthetic-1`、`synthetic-2`，環境 dev、服務 api；完成 manifest 與 config 都在該 fixture 內。`retry` 與 `status` 回傳 JSON，檢查 `pending`、`acked`、`attempts`、`error_codes`、`last_success`。Cleanup 保留成功身分與 ack metadata，移除的是已 ack 的壓縮副本。

完成 manifest 的必要欄位：

```json
{
  "version": 1,
  "completed": true,
  "env": "dev",
  "service": "api",
  "date": "2026-11-08",
  "artifact_id": "chunk-001",
  "source": "demo.jsonl.gz",
  "compressed_bytes": 123,
  "sha256": "請由合成檔實際計算的64位十六進位SHA256取代"
}
```

上例大小與 hash 只是欄位說明，不能直接 capture；demo 會產生可執行的正確值。每筆 JSONL 須有字串 timestamp、level、message；level 只接受 `debug`、`info`、`warn`、`error`。另外須有與 manifest 一致的 env、service；timestamp 須帶時區且其原始日期與 manifest 一致，日期不做 UTC 轉換。邏輯身分是 env/service/date/artifact_id；相同身分異內容會拒絕。物件路徑為 `env/service/date/artifact_id/sha256.jsonl.gz`。

Config 的 sources 是顯式環境到本機來源根目錄的 map；spool 與 store 是不同的本機根目錄，不能與任何來源互為祖先，也不能經 symlink 指向其他位置。`capacity_bytes` 只限制 spool 壓縮 payload，`max_entries` 限制保留的 artifact metadata 筆數；這些不是檔案系統總用量的硬上限。Cleanup 保留 metadata，因此 max_entries 用盡後仍會拒收新 artifact，正式 metadata 保留政策另行規劃。

輸入錯誤使用安全錯誤碼，不輸出原始例外或來源內容。這是離線測試工具；合成資料限定屬於操作契約，不能把它當作能自動識別所有敏感資料的遮罩器。

Spool 與 mock store 必須是這個原型專用的目錄；不要指到既有服務或共用資料夾。程序中斷後，工具會在取得 spool 鎖後回收未提交的 `.capture-*` staging。Mock store 是本機測試介面，其暫存檔和 metadata 開銷也不計入 payload 容量；正式總磁碟監控、遠端生命週期及垃圾回收尚未實作。

CLI exit code：`0` 表示操作成功；`retry` 結束後仍有 pending 時回傳 `1` 並保留 JSON status；輸入錯誤、鎖忙碌或其他無法完成操作的錯誤回傳 `2`。
