# OAuth 測試分層

一般功能測試不需要每次操作 Google 登入頁。本專案把登入後權限、自己的 OAuth 處理，以及真實 Google 設定驗證分開，報告也分開記錄覆蓋範圍。

| 層次 | 執行方式 | 能證明的行為 |
|---|---|---|
| 功能與權限 | 既有 unit/integration、dev-login、獨立角色 session | 邀請、人工核准、交接與撤權；dev-login 本身不提供 provider 驗證過的 Email |
| OAuth 應用整合 | `test:oauth:integration` | 真正 Express／Passport、PostgreSQL、Redis 與 Mailpit；只攔截 Google 外部 token／userinfo HTTP 回應 |
| 前端流程 | 既有前端與瀏覽器測試 | 邀請網址 303、host-only cookie、語系及 onboarding 返回；server suite 不取代這些測試 |
| 真 Google 專項冒煙 | 指定 QA 帳號、正式 provider 與部署環境 | OAuth client、redirect URI、scope、Google 實際互通；不把模擬回應當成這層的證據 |

## 在本機執行

使用 Node.js 20（至少20.12.1）、pnpm、Git 與本機 Docker。工作樹位於另一個 pnpm workspace 下時，安裝依賴應明確隔離：

```sh
pnpm --ignore-workspace install --frozen-lockfile
pnpm run test:oauth:local
```

若已經有可讀取的 storage Git checkout，可避免額外下載：

```sh
pnpm run test:oauth:local --schema-repo /absolute/path/to/daodao-storage
```

runner 會從 `.github/test-database.json` 的固定 commit 載入 canonical schema，不使用 storage 工作樹尚未提交的 SQL。每次建立自己的 PostgreSQL、Redis、Mailpit，綁定動態 loopback port；結束、失敗或中斷時，只清除本次 ownership label 對應的資源。它不沿用目前 shell 的業務資料庫／Redis／SMTP 位址或正式登入設定。

## CI 執行

既有必要的 `test` job 在初始化 disposable schema、產生 Prisma 與一般品質檢查之後，另外執行：

```sh
pnpm run test:oauth:integration
```

CI 為這個步驟提供 PostgreSQL、Redis、Mailpit；本機通常使用上面的 runner，不手動拼接服務位址。直接執行 suite 時必須明確提供 `NODE_ENV=test`、`OAUTH_INTEGRATION_TEST=1` 、四個隔離服務位址，以及同一執行的資源所有權參數：

- `OAUTH_TEST_DATABASE_URL`
- `OAUTH_TEST_REDIS_URL`
- `OAUTH_TEST_SMTP_PORT`
- `OAUTH_TEST_MAILPIT_URL`
- `OAUTH_TEST_RUN_ID`
- `OAUTH_TEST_POSTGRES_CONTAINER_ID`
- `OAUTH_TEST_REDIS_CONTAINER_ID`
- `OAUTH_TEST_MAILPIT_CONTAINER_ID`

global setup 會透過本機 Docker 核對三個容器的執行中狀態、ownership label 與實際 port mapping，確認位址屬於本次 disposable 資源後才載入應用程式。只填一個本機 `daodao_test` 位址並不足以執行。

缺少參數、所有權／端口不符、服務無法連線或外部 Google HTTP 未被測試明確攔截時，測試應失敗，不能跳過或改連共享 dev。應用的 state 檢查、Prisma、Redis 與 Passport 均使用真實實作；Google 身份資料來自被明確攔截的外部 HTTP 回應。收到邀請的測試連結來自本機 Mailpit，不透過共享資料庫補寫可信 Email。

此 suite 組裝實際 auth／organization routers 與 Passport middleware，沒有啟動 `server.ts` 的完整服務與背景排程，因此不涵蓋完整 server 的 route mount、CORS、rate limit 或 Redis session store 組裝；部署後冒煙仍需檢查服務入口。

## 真 Google 與帳號安全

真實 provider 冒煙仍獨立保留：OAuth client／redirect／scope 或登入交換流程變更時，應在對應部署版本重驗；一般功能回歸則使用前面的自動化層。實際頻率及發布條件由該次需求與驗收契約決定，不因模擬 suite 通過而自動改成「真 Google 已驗」。

需要重複呼叫真實 provider 時，可以另行設計專用 QA 帳號的合法 refresh-token／session 重用，但本次未新增這種入口或憑證。它需要適當的 token 驗證、保密、到期／撤銷處理，也不等同瀏覽器整條 authorization-code redirect 已測。不要為了自動化關閉 MFA、破解 CAPTCHA、接受未驗證的前端身份，或在正式／共享 dev 新增任意授予可信身份的測試入口。

參考官方做法：[Playwright authentication](https://playwright.dev/docs/auth)、[Cypress best practices](https://docs.cypress.io/app/core-concepts/best-practices)、[Cypress Google authentication](https://docs.cypress.io/app/guides/authentication-testing/google-authentication)、[Firebase Auth Emulator](https://firebase.google.com/docs/emulator-suite/connect_auth)。
