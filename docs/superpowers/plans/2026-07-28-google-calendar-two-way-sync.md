# Google Calendar 雙向同步技術方案

**Goal:** 讓 daodao 使用者（web `apps/product` 與 mobile）能連結自己的 Google 帳號，把實踐排程同步進 Google Calendar，並且在 Google Calendar 上的改動（改時間、刪除）能反向回寫 daodao。

**Architecture:** 獨立於登入之外的第二條 OAuth 授權流程（incremental auth）＋ 加密的 refresh token 儲存 ＋ BullMQ 驅動的雙向同步引擎（push 用 job、pull 用 Google push notification webhook + syncToken 增量拉取）。

**Tech Stack:** TypeScript, Express, Prisma, BullMQ, `googleapis` npm, PostgreSQL, Redis, Next.js (`apps/product`), Expo (`apps/mobile`)

**跨 repo：** `daodao-storage`（schema 源頭）→ `daodao-server`（主要實作）→ `daodao-f2e`（UI + types）→ `daodao-mcp`（PII mask 補登）

---

## 0. 三個先決事實（實作前必讀）

### 0.1 不能沿用登入的 OAuth flow

`src/services/auth/oauth.service.ts:307` 目前的登入 scope 是 `['profile', 'email']`，且刻意不帶 `prompt`（L302-305 註解寫明是為了「無縫重登入」UX），也**沒有 `access_type: 'offline'`——所以目前系統從未取得過任何 refresh token**。

把 calendar scope 併進登入會同時打壞三件事：全體使用者下次登入看到更長的授權頁、既有使用者被迫重新同意、整個 app 進 Google 審核（連只想登入的人都被卡）。

**正解：** 開第二條獨立流程 `/api/v1/integrations/google-calendar/connect`，只有使用者在設定頁主動點「連結」時才走。登入流程一行都不動。

### 0.2 這個 DB 目前不存任何 token

`daodao-mcp/packages/pg/src/mask.ts:4` 的註解明確寫著 *"this DB has no password/token storage"*。存 Google refresh token 是**改變這個 DB 的威脅模型**，連帶三件事必做：

1. refresh token 加密後才落地（`daodao-server` 目前完全沒有加密工具，grep `createCipheriv` 零命中，要新寫）
2. 更新 `daodao-mcp/packages/pg/src/mask.ts` 的 `FULL_MASK_NAMES`，否則新欄位會直接洩進 LLM context
3. 更新隱私政策揭露（Google 審核會逐條比對，見 §1）

### 0.3 兩個 schema 缺口會擋住排程轉換

| 缺口 | 現況 | 為什麼會擋住 |
|---|---|---|
| **沒有 per-user timezone** | 全 schema 無 timezone 欄位，`Asia/Taipei` 硬寫在 5 處（`practice-status.queue.ts:130`、`cohort-stat.service.ts:45`、`types/email/practice.types.ts:290,295` 等） | Google Calendar 事件必須帶 IANA timezone。海外使用者會拿到錯誤時間 |
| **排程是模糊的，不是具體時間** | `practices.practice_time_periods` 是 enum 陣列（`morning`/`afternoon`/`evening`/`night`/`commute`，見 `src/validators/practice.validators.ts:23`）；`frequency_min_days`/`frequency_max_days` 是**區間**（例如「每 2-3 天」） | 「早上」不是時間，「每 2-3 天」不是合法 RRULE。無法直接產生日曆事件 |

**這兩個必須在 Phase 1 解掉**，決策見 §6。

---

## 1. Scope 選擇：建議走兩階段，Phase 1 完全免審核

這是整個方案成本差異最大的決定。

### 建議：Phase 1 只用 `calendar.app.created`

`https://www.googleapis.com/auth/calendar.app.created` 允許 app **建立自己的次要日曆，並在那本日曆上完整讀寫事件**。

關鍵洞察：**這已經足夠做到完整雙向同步**——
- daodao → Google：把實踐排程寫進「島島練習」這本日曆 ✅
- Google → daodao：使用者在 Google Calendar 上拖動／刪除我們建的事件，我們讀得到並回寫 ✅

它做不到的只有一件事：**看不到使用者的其他行程**（無法做衝突偵測、空檔推薦）。

而它是**非 sensitive scope，不需要送 Google 審核**。

### Phase 3 才加 `calendar.readonly`（如果真的需要衝突偵測）

只有當你確定要做「避開已有行程」「推薦空檔」這類功能時才加，屆時才觸發審核。

### 審核成本（Phase 3 才會遇到，資料來自 Google 官方文件）

sensitive scope 需要通過 verification，**最長 10 天**，且要求：

- [ ] 在 Google Search Console 驗證 authorized domain 的擁有權
- [ ] 首頁公開可存取，且清楚說明 app 功能
- [ ] 隱私政策**與首頁同網域**，且明確揭露如何存取／使用／儲存／分享 Google 使用者資料
- [ ] 每個 sensitive scope 寫詳細理由，並解釋**為什麼更窄的 scope 不夠用**
- [ ] 錄一支 unlisted YouTube 影片，**全英文**演示 OAuth 授權流程 + 每個 scope 的實際用途，且要拍到 consent 畫面顯示正確 App Name、網址列含 OAuth client ID

好消息：**sensitive scope 不需要第三方安全稽核（CASA）**，那是 restricted scope（Gmail、Drive 全域等）才要求的。Calendar 全系列都是 sensitive，不是 restricted。

> 開發期間 Publishing Status 保持 `Testing` 即可免審核，但**上限只有測試名單內的帳號**，不能公開上線。

**待人工確認：** Cloud Console 的 Data Access 頁面會逐一標示每個 scope 是 non-sensitive / sensitive / restricted。動工前先去確認 `calendar.app.created` 確實落在 non-sensitive——兩分鐘的事，但整個 Phase 1 的成本假設建立在這上面。

---

## 2. 非程式前置作業（你手動做）

- [ ] Cloud Console 開**獨立的 production project**（Google 政策建議 test/prod 分離）
- [ ] 啟用 Google Calendar API
- [ ] OAuth client 加 redirect URI：`https://api.daodao.so/api/v1/integrations/google-calendar/callback`
- [ ] Data Access 頁面加 `calendar.app.created`，確認 sensitivity 標示
- [ ] 產生加密金鑰：`openssl rand -base64 32` → 進 1Password → 部署為 `GOOGLE_TOKEN_ENCRYPTION_KEY`
- [ ] 產生 webhook 共用密鑰 → `GOOGLE_CALENDAR_WEBHOOK_TOKEN`
- [ ] 隱私政策補上 Google 使用者資料的揭露段落

---

## 3. Schema 設計（daodao-storage）

三張新表。依 repo 慣例：`schema/` 放建表（全新安裝用），`migrate/sql/` 放 migration（既有 DB 用，接續 `080_`）。

### 3.1 `user_google_credentials` — 授權憑證

| 欄位 | 型別 | 說明 |
|---|---|---|
| `id` | SERIAL PK | |
| `user_id` | INT NOT NULL UNIQUE | FK → `users(id)` ON DELETE CASCADE |
| `google_account_email` | VARCHAR(255) | 顯示用（「已連結 xxx@gmail.com」）**需進 mask 清單** |
| `refresh_token_ciphertext` | TEXT NOT NULL | AES-256-GCM 密文 **需進 mask 清單** |
| `refresh_token_iv` | VARCHAR(32) NOT NULL | GCM IV（base64） |
| `refresh_token_tag` | VARCHAR(32) NOT NULL | GCM auth tag |
| `granted_scopes` | TEXT[] NOT NULL | 實際授權到的 scope（**使用者可以在同意頁取消勾選，不能假設等於請求的**） |
| `connected_at` | TIMESTAMPTZ NOT NULL DEFAULT NOW() | |
| `revoked_at` | TIMESTAMPTZ | 非 NULL 代表已解除／token 失效 |
| `last_error_code` | VARCHAR(50) | 例如 `invalid_grant` |

access token **不落地**，只放 Redis（TTL 對齊 Google 給的 `expires_in` 再減 60 秒緩衝）。

### 3.2 `user_google_calendars` — 同步狀態

| 欄位 | 型別 | 說明 |
|---|---|---|
| `id` | SERIAL PK | |
| `user_id` | INT NOT NULL UNIQUE | FK → `users(id)` ON DELETE CASCADE |
| `google_calendar_id` | VARCHAR(255) NOT NULL | 我們建的「島島練習」日曆 ID |
| `sync_token` | TEXT | Google `nextSyncToken`，增量拉取用 |
| `watch_channel_id` | UUID | push notification channel |
| `watch_resource_id` | VARCHAR(255) | 停用 channel 時要用 |
| `watch_expires_at` | TIMESTAMPTZ | channel TTL，到期前要 renew |
| `last_synced_at` | TIMESTAMPTZ | |
| `sync_state` | VARCHAR(20) DEFAULT 'idle' | `idle` / `syncing` / `error` |

### 3.3 `practice_calendar_events` — 事件對應表

| 欄位 | 型別 | 說明 |
|---|---|---|
| `id` | SERIAL PK | |
| `practice_id` | INT NOT NULL | FK → `practices(id)` ON DELETE CASCADE |
| `user_id` | INT NOT NULL | FK → `users(id)` ON DELETE CASCADE |
| `occurrence_date` | DATE NOT NULL | 這是哪一次的練習 |
| `google_event_id` | VARCHAR(1024) NOT NULL | |
| `google_etag` | VARCHAR(255) | 樂觀鎖 |
| `daodao_revision` | INT NOT NULL DEFAULT 1 | **迴圈防護核心**，見 §5.3 |
| `last_pushed_at` / `last_pulled_at` | TIMESTAMPTZ | |
| `user_modified` | BOOLEAN DEFAULT FALSE | 使用者在 Google 端改過→之後 push 不覆蓋 |
| `deleted_at` | TIMESTAMPTZ | |

索引：`UNIQUE (practice_id, occurrence_date)`、`UNIQUE (google_event_id)`、`INDEX (user_id)`

### 3.4 timezone 缺口

`users` 表加 `timezone VARCHAR(64) DEFAULT 'Asia/Taipei'`（IANA）。前端連結日曆時用 `Intl.DateTimeFormat().resolvedOptions().timeZone` 帶上來。

> 這個欄位**不只服務日曆**——現有 5 處硬編碼 `Asia/Taipei` 未來都該讀它。但本方案範圍內只寫入、只讓日曆同步讀，不改動既有行為，避免牽連通知與 email 排程。

---

## 4. OAuth 授權流程（daodao-server）

### 4.1 連結

```
GET /api/v1/integrations/google-calendar/connect   (需 JWT)
  → 產生 state（複用既有 oauth-redis-state-store.service.ts 的機制）
  → redirect Google，帶：
      scope: calendar.app.created
      access_type: 'offline'      ← 沒有這個就拿不到 refresh token
      prompt: 'consent'           ← 沒有這個，重複授權時 Google 不會再給 refresh token
      include_granted_scopes: true

GET /api/v1/integrations/google-calendar/callback
  → 驗 state（沿用 oauth-nonce.service.ts）
  → 換 token
  → 檢查實際 granted scopes，不足就導回錯誤頁
  → 加密 refresh token 落地
  → 建立「島島練習」日曆（calendars.insert）
  → 註冊 watch channel
  → 排入首次全量同步 job
  → redirect 回設定頁（web）或 custom scheme（mobile）
```

**兩個實作陷阱：**
- 少了 `access_type: 'offline'` 只會拿到一小時的 access token，隔天全部失效
- 少了 `prompt: 'consent'`，使用者第二次授權時 Google **不會**再發 refresh token（只發 access token），而你此時可能已經把舊的弄丟了

### 4.2 Mobile 不用另外開發

既有的 CCT → custom scheme → Redis `auth_code` 交換機制（`docs/auth/login-flow-overview.md` §「後端 Google OAuth Callback 流程」，實作在 `src/services/auth/auth-code.service.ts`）可以原封不動複用。callback 判斷 redirect 是 custom scheme 就走 auth_code 路徑。

### 4.3 解除連結

```
DELETE /api/v1/integrations/google-calendar   (需 JWT)
  → 停用 watch channel（channels.stop）
  → 呼叫 Google revoke endpoint
  → 刪除「島島練習」日曆（或保留，讓使用者選）
  → 清空三張表的資料
```

**必做：** 提供真正可用的解除連結入口，這是 Google 審核與隱私政策的硬性期待。

---

## 5. 同步引擎（核心）

### 5.1 Push：daodao → Google

沿用 `src/queues/` 既有 26 個 queue 的 pattern，新增 `calendar-sync.queue.ts` + `calendar-sync.worker.ts`。

觸發點：practice 建立／更新／刪除、排程變更。job payload 帶 `{ userId, practiceId, reason }`。

### 5.2 Pull：Google → daodao

**兩層機制，缺一不可：**

**(a) Push notification（即時）**
```
POST /api/v1/integrations/google-calendar/notifications   ← 無 JWT
```
- Google **不會**帶 JWT，此 endpoint 必須排除在 `authenticate` middleware 之外
- 改用 `X-Goog-Channel-Token` 比對 `GOOGLE_CALENDAR_WEBHOOK_TOKEN` 驗證，再用 `X-Goog-Channel-ID` 反查是哪個 user
- 通知**不含事件內容**，只是「有東西變了」→ 立刻回 200，把實際拉取排進 queue（Google 對慢回應會重試）
- 也要排除在 rate limiter 之外，否則熱門時段會被自己的限流擋掉

**(b) 定期輪詢（保險）**

watch channel 有 TTL，且 webhook 本來就可能漏。加 BullMQ repeatable job（參考 `badge-award.queue.ts:67` 的 `repeat: { pattern: '0 * * * *' }`）每小時掃一次：channel 快到期就 renew、`last_synced_at` 太舊就補拉。

**(c) 增量拉取**
```
events.list(calendarId, { syncToken })
  → 存 nextSyncToken
  → 410 GONE  → syncToken 失效，清空後改用 timeMin 全量重拉
```

### 5.3 迴圈防護（最容易寫錯的地方）

我們寫進 Google 的事件會透過 webhook 再回來。沒有防護就會無限迴圈。

**機制：** 每次 push 時把 revision 寫進事件的 private extended property：

```typescript
extendedProperties: {
  private: {
    daodaoPracticeId: String(practiceId),
    daodaoRevision: String(revision),   // 同步寫入 practice_calendar_events.daodao_revision
  },
},
```

pull 時比對：

| 情況 | 判定 | 動作 |
|---|---|---|
| 事件的 `daodaoRevision` **等於** DB 的 | 我們自己寫的回音 | 略過 |
| 事件的 `daodaoRevision` **小於** DB 的 | 使用者改過（Google 端改動不會動 extended property） | 回寫 daodao，標 `user_modified = true` |
| 沒有 `daodaoPracticeId` | 使用者自己在這本日曆建的事件 | 略過（不是我們管的） |
| `status === 'cancelled'` | 使用者刪了 | 標記該次練習略過，**不刪整個 practice** |

### 5.4 衝突解決

同時在兩邊改同一筆時，規則：

1. 比 Google 事件的 `updated` 與 daodao 的 `updated_at`，**晚的贏**
2. 但 `user_modified = true` 的事件，daodao 側的例行 push **不覆蓋時間**（只同步標題／描述）——使用者手動挪過的時間是明確意圖，不該被自動排程蓋掉
3. 每次衝突都寫 log，前期用來校正規則

### 5.5 錯誤處理

| 錯誤 | 處理 |
|---|---|
| `invalid_grant`（使用者在 Google 端撤銷） | 標 `revoked_at`、停 watch、發站內通知請使用者重新連結。**不要重試** |
| `403 rateLimitExceeded` / `429` | 指數退避重試（BullMQ `attempts` + `backoff`） |
| `410 GONE`（syncToken 失效） | 清 syncToken，改全量重拉 |
| `404`（事件被永久刪除） | 清掉 mapping，不當錯誤 |

---

## 6. 待決策：排程 → 日曆事件的轉換

**這不只是後端問題，會直接影響 UI，建議實作前先定案。**

`practices` 存的是「早上」「每 2-3 天」，Google Calendar 要的是「每週二四 08:00-08:30」。三個選項：

| 方案 | 做法 | 取捨 |
|---|---|---|
| **A. 連結時多問一次（建議）** | 連結日曆後，讓使用者為每個實踐指定具體星期與時間 | 最準確，使用者掌控感最強；多一個設定步驟 |
| **B. 預設對應表** | `morning`→08:00、`afternoon`→14:00、`evening`→18:00、`night`→21:00、`commute`→08:00；頻率取 `frequency_min_days` | 零額外操作；時間必然對不上多數人的實際作息 |
| **C. 只建全天事件** | 不處理時間，只標「今天有練習」 | 最簡單、不會錯；提醒效果最弱，也讓雙向同步失去意義（沒有時間可以改） |

若選 A，需要第四張表 `practice_schedules`（practice_id、weekdays、start_time、duration_minutes）。

**RRULE 產生範例（方案 A）：**
```
RRULE:FREQ=WEEKLY;BYDAY=TU,TH;UNTIL=20260901T000000Z
```
`UNTIL` 取 `practices.end_date`。`frequency_min_days`/`max_days` 的區間語意在 RRULE 中無法表達，方案 A 等於讓使用者把它具體化。

---

## 7. 前端（daodao-f2e）

### 7.1 `apps/product`

`src/components/settings/` 下新增 `integrations/`（旁邊已有 `account/`、`connections/`、`notifications/` 可照抄結構），並在 `settings-list.tsx` 掛入口。

元件：連結狀態卡（已連結顯示 Google 帳號 + 最後同步時間）、連結／解除按鈕、同步錯誤提示（token 失效時引導重新連結）、每個實踐的排程設定（若採方案 A）。

### 7.2 `apps/mobile`

同一組 API，授權走既有 CCT 流程。注意主 tab 需要在 CCT 關閉後刷新連結狀態——`AuthProvider` 已有 `visibilitychange` 補強機制（見 `docs/auth/login-flow-overview.md`），沿用同樣手法。

### 7.3 types

`packages/api/src/types.ts` 由 server 的 OpenAPI 產生，server 端 route 定義完成後重新產生即可。

---

## 8. 實作階段

### Phase 0：決策與前置（無程式碼）
- [ ] Cloud Console 確認 `calendar.app.created` 的 sensitivity 標示
- [ ] 決定 §6 的排程轉換方案（A / B / C）
- [ ] 完成 §2 前置作業清單

### Phase 1：授權打通
- [ ] `daodao-storage`：`081_create_table_user_google_credentials.sql` + `082_create_table_user_google_calendars.sql` + `083_add_users_timezone.sql`，同步補 `schema/`
- [ ] `daodao-server`：`pnpm run prisma:generate`
- [ ] `src/utils/crypto.ts`：AES-256-GCM 加解密 + 單元測試
- [ ] `src/services/integrations/google-calendar-auth.service.ts`：connect / callback / disconnect
- [ ] `src/routes/integrations.routes.ts` + controller + validators
- [ ] 驗收：能連結、DB 有加密憑證、Google 帳號下出現「島島練習」日曆、能解除連結

### Phase 2：單向 push
- [ ] `084_create_table_practice_calendar_events.sql`（+ 方案 A 的 `practice_schedules`）
- [ ] `src/services/integrations/google-calendar-sync.service.ts`：排程 → RRULE
- [ ] `src/queues/calendar-sync.queue.ts` + `.worker.ts`
- [ ] practice CRUD 掛觸發點
- [ ] 驗收：建立／修改／刪除實踐，Google Calendar 正確反映

### Phase 3：反向 pull（完成雙向）
- [ ] webhook endpoint（含 channel token 驗證、排除 auth middleware 與 rate limiter）
- [ ] watch channel 註冊 / renew / stop
- [ ] syncToken 增量拉取 + 410 全量回退
- [ ] §5.3 迴圈防護 + §5.4 衝突解決
- [ ] repeatable job：channel renew + 補拉
- [ ] 驗收：在 Google Calendar 拖動事件 → daodao 反映；刪除 → 標記略過；**連續操作 10 次不出現迴圈**

### Phase 4：前端
- [ ] `apps/product` 設定頁整合區塊
- [ ] mobile 授權串接
- [ ] `packages/api` types 重生

### Phase 5：收尾
- [ ] `daodao-mcp/packages/pg/src/mask.ts` 加入新的敏感欄位
- [ ] 隱私政策更新
- [ ] 若走 Phase 3 的 `calendar.readonly`：送 Google 審核（含 demo 影片）

---

## 9. 風險

| 風險 | 影響 | 緩解 |
|---|---|---|
| 同步迴圈 | 打爆 API 配額、使用者日曆被灌爆 | §5.3 revision 機制；Phase 3 驗收明列迴圈測試 |
| refresh token 外洩 | 直接存取使用者日曆 | 加密落地、金鑰不進 repo、更新 MCP mask |
| webhook 被偽造 | 觸發無效同步 | channel token 驗證 + channel ID 反查 |
| timezone 錯誤 | 海外使用者時間全錯 | `users.timezone` 欄位；前端帶 IANA 時區 |
| Google 審核被退（Phase 3） | 上線延後 10 天以上 | Phase 1 免審先上線；審核素材依 §1 清單逐項備齊 |
| API 配額 | 大量使用者時同步失敗 | BullMQ 限流 + 指數退避；事件用批次操作 |

---

## 10. 參考

- [Sensitive scope verification](https://developers.google.com/identity/protocols/oauth2/production-readiness/sensitive-scope-verification) — 審核要求與時程（10 天）、例外情況
- [Choose Google Calendar API scopes](https://developers.google.com/workspace/calendar/api/auth) — scope 分類
- [Calendars: insert](https://developers.google.com/workspace/calendar/api/v3/reference/calendars/insert) — `calendar.app.created` 建立次要日曆
- 既有實作參考：`src/services/auth/oauth-redis-state-store.service.ts`（state 儲存）、`src/services/auth/auth-code.service.ts`（mobile custom scheme）、`src/queues/badge-award.queue.ts`（repeatable job pattern）
