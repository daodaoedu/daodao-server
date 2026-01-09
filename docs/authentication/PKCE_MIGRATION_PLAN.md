# DaoDao Server PKCE 遷移規劃文件

## 文件資訊
- **文件版本**: 1.0
- **建立日期**: 2025-10-13
- **專案**: DaoDao Learning Platform Backend
- **作者**: 系統架構團隊
- **目標**: 將現行 OAuth 2.0 Google 登入改用 PKCE（Proof Key for Code Exchange）流程

---

## 目錄
1. [執行摘要](#執行摘要)
2. [現行架構分析](#現行架構分析)
3. [PKCE 技術背景與優勢](#pkce-技術背景與優勢)
4. [遷移策略與實施計畫](#遷移策略與實施計畫)
5. [技術實作細節](#技術實作細節)
6. [安全性增強措施](#安全性增強措施)
7. [測試計畫](#測試計畫)
8. [部署與回滾策略](#部署與回滾策略)
9. [時程規劃](#時程規劃)
10. [風險評估與緩解措施](#風險評估與緩解措施)
11. [參考資源](#參考資源)

---

## 執行摘要

### 目的
將 DaoDao Server 的 Google OAuth 2.0 認證流程從傳統的 Authorization Code Flow **直接替換**為更安全的 Authorization Code Flow + PKCE + Client Secret，以符合 OAuth 2.1 標準並增強系統安全性。

### 遷移策略
⚠️ **直接替換，不考慮向下相容**
- 一次性切換至 PKCE 流程
- 所有用戶需重新登入一次
- 移除舊的 OAuth 流程代碼
- 預計 **8 週**完成（縮短 2 週）

### 主要驅動因素
1. **消除安全風險**: 現行流程將 JWT token 暴露在 URL query parameter（嚴重風險）
2. **PKCE 防護**: 防止授權碼攔截攻擊（Authorization Code Interception）
3. **標準合規**: OAuth 2.1 草案強制要求 PKCE
4. **Token 管理升級**: 改用 localStorage + Authorization Header + Refresh Token Rotation
5. **無狀態架構**: 前端主導 PKCE，後端完全無狀態（可水平擴展）

### 技術特點
🔒 **混合模式 + 前端主導**:
- ✅ **前端生成 PKCE** 參數（code_verifier, code_challenge）
- ✅ **後端完全無狀態**（不需 session 或 Redis 存 PKCE）
- ✅ **Google OAuth 雙重驗證**: PKCE + client_secret
- ✅ **POST API 傳遞 Token**（不透過 URL）
- ✅ **localStorage + Authorization Header** 存取控制

### 預期效益
- ✅ **消除 Token URL 洩漏風險**（從 query parameter 改為 POST API 回應）
- ✅ 防止授權碼攔截攻擊（PKCE 前端主導保護）
- ✅ 支援自動 Token 刷新（Refresh Token Rotation）
- ✅ 符合 OAuth 2.1 標準
- ✅ 完全無狀態架構（後端可水平擴展）
- ✅ 保持現有 JWT + localStorage 設計模式

---

## 現行架構分析

### 技術棧
- **後端框架**: Node.js + Express.js + TypeScript
- **認證框架**: Passport.js (passport-google-oauth20 ^2.0.0)
- **資料庫**: PostgreSQL (Prisma ORM), MongoDB, Redis
- **JWT 管理**: jsonwebtoken ^9.0.2
- **認證方式**: 純 JWT（無 session），前端 localStorage 存儲
- **Session**: express-session 已安裝但**未實際使用**於認證流程

### 現行認證流程

#### 流程圖
```
前端 (SPA)                    後端 (Express)              Google OAuth
     │                              │                           │
     │ 1. 點擊「Google 登入」        │                           │
     │    window.location.href =    │                           │
     │    '/api/auth/google'         │                           │
     ├─────────────────────────────▶│                           │
     │                              │                           │
     │                              │ 2. Passport 觸發策略       │
     │                              │    (無 PKCE)              │
     │                              │                           │
     │ 3. 302 重導向至 Google        │                           │
     │◀─────────────────────────────┤                           │
     │    https://accounts.google.com/o/oauth2/v2/auth?         │
     │    - client_id=xxx                                       │
     │    - redirect_uri=.../callback                           │
     │    - response_type=code                                  │
     │    - scope=profile email                                 │
     │    ⚠️ 無 code_challenge（無 PKCE 保護）                  │
     │                              │                           │
     │ 4. 用戶登入並授權              │                           │
     ├──────────────────────────────────────────────────────────▶
     │                              │                           │
     │ 5. Google 返回 code           │                           │
     │    /callback?code=xxx         │                           │
     ├─────────────────────────────▶│                           │
     │                              │                           │
     │                              │ 6. 換取 access_token       │
     │                              │    code + client_secret    │
     │                              │    ⚠️ 無 code_verifier     │
     │                              ├──────────────────────────▶│
     │                              │◀──────────────────────────┤
     │                              │    { access_token, ... }   │
     │                              │                           │
     │                              │ 7. 取得 Google Profile     │
     │                              ├──────────────────────────▶│
     │                              │◀──────────────────────────┤
     │                              │                           │
     │                              │ 8. 查找/建立用戶            │
     │                              │    - users (正式用戶)       │
     │                              │    - temp_users (臨時)     │
     │                              │                           │
     │                              │ 9. 生成 JWT token          │
     │                              │    { id, email, isTemp }   │
     │                              │    (單一 token，無 refresh) │
     │                              │                           │
     │ 10. 🚨 重導向，token 在 URL    │                           │
     │     /auth/callback?token=xxx  │                           │
     │◀─────────────────────────────┤                           │
     │     ⚠️ 極度不安全！            │                           │
     │                              │                           │
     │ 11. 前端取得 token             │                           │
     │     const params = new       │                           │
     │       URLSearchParams(...)   │                           │
     │     const token =            │                           │
     │       params.get('token')    │                           │
     │                              │                           │
     │ 12. 存入 localStorage          │                           │
     │     localStorage.setItem(    │                           │
     │       'access_token', token) │                           │
     │                              │                           │
     │ 13. 後續 API 請求              │                           │
     │     Authorization: Bearer    │                           │
     │       {token}                │                           │
     ├─────────────────────────────▶│                           │
     │                              │ 14. JWT 中間件驗證          │
     │                              │     - 驗證簽章              │
     │                              │     - 檢查過期              │
     │                              │     - 解析 payload         │
     │◀─────────────────────────────┤                           │
     │     返回資料                  │                           │
     │                              │                           │

⚠️ 問題：Token 過期（15分）後必須重新登入，無自動刷新機制
```

#### 程式碼結構
```
src/
├── controllers/auth.controller.ts          # 認證控制器
│   └── googleCallback()                    # 處理 OAuth 回調
├── routes/auth.routes.ts                   # 認證路由定義
│   ├── GET /auth/google                    # 開始 OAuth
│   └── GET /auth/google/callback           # OAuth 回調
├── services/auth/
│   ├── auth.service.ts                     # 認證業務邏輯
│   │   ├── findUserByEmail()
│   │   ├── findOrCreateTempUser()
│   │   └── generateAuthToken()
│   └── oauth.service.ts                    # Passport OAuth 配置
│       ├── GoogleStrategy 設定
│       ├── serializeUser()
│       └── deserializeUser()
├── middleware/auth.ts                      # JWT 驗證中間件
└── services/jwt.service.ts                 # JWT 簽發與驗證
```

### 現行問題點（需立即修正）

| 問題類型 | 說明 | 嚴重性 | 現況 |
|---------|------|--------|------|
| **🚨 Token 暴露在 URL** | JWT token 透過 URL 傳遞：`/auth/callback?token=xxx`<br>風險：瀏覽器歷史、伺服器日誌、第三方分析工具、Referer header | 🔴 **極高** | `auth.controller.ts:101` |
| **Authorization Code 攔截** | 無 PKCE 保護，authorization code 可能被攔截並兌換 token | 🔴 高 | `oauth.service.ts` |
| **無 Refresh Token** | 僅單一 JWT（15 分鐘），過期需重新登入，使用者體驗差 | 🟡 中 | 全域 |
| **無 Token Rotation** | 缺乏 refresh token rotation 機制，長期洩漏風險 | 🟡 中 | 無實作 |
| **localStorage XSS 風險** | Token 存儲於 localStorage，易受 XSS 攻擊竊取 | 🟡 中 | 前端 |

**架構現況**：
- ✅ 純 JWT 認證（無狀態）
- ✅ 前端 localStorage 存儲
- ✅ Authorization header 傳遞 token
- ❌ Token 透過 URL 傳遞（極度不安全）
- ❌ 無 PKCE 保護
- ❌ 無 Refresh Token 機制

**最嚴重問題**：
```typescript
// ❌ 當前實作（極度不安全）- src/controllers/auth.controller.ts:101
const url = `${process.env.FRONTEND_URL}/auth/callback?token=${token}`;
res.redirect(url);

// 前端接收
const params = new URLSearchParams(window.location.search);
const token = params.get('token'); // Token 已經暴露在 URL
localStorage.setItem('access_token', token);
```

**風險**：
1. 🚨 瀏覽器歷史記錄永久保存 token
2. 🚨 Referer header 可能洩漏 token 給第三方網站
3. 🚨 伺服器日誌記錄完整 URL（包含 token）
4. 🚨 瀏覽器擴充功能可讀取 URL
5. 🚨 分析工具（Google Analytics 等）可能記錄 URL

### 新的 PKCE 認證流程（前端主導，無 Session）

#### 架構設計理念

本方案採用**前端生成 PKCE 參數**的架構，完全無狀態（stateless），符合現有純 JWT + localStorage 設計：

- ✅ **前端生成** `code_verifier` 和 `code_challenge`
- ✅ **暫存於 sessionStorage**（僅 OAuth 流程期間，瀏覽器關閉即清除）
- ✅ **後端完全無狀態**（不需 session 或 Redis 存儲 PKCE）
- ✅ **保持 localStorage** 存儲最終 JWT tokens
- ✅ **手動實作 PKCE**（不依賴 Passport session 機制）
- ✅ **POST 方式傳遞 token**（避免 URL 洩漏）

#### 完整流程圖

```
┌─────────────┐                                      ┌──────────────┐                  ┌──────────────┐
│   前端 SPA  │                                      │ 後端 Server  │                  │    Google    │
└──────┬──────┘                                      └──────┬───────┘                  └──────┬───────┘
       │                                                     │                                 │
       │ 1. 用戶點擊「使用 Google 登入」✨                     │                                 │
       │    前端生成 PKCE 參數：                              │                                 │
       │    const verifier = generateCodeVerifier()         │                                 │
       │      // 43-128 字元隨機字串                         │                                 │
       │    const challenge = await generateCodeChallenge(verifier)                           │
       │      // BASE64URL(SHA256(verifier))                │                                 │
       │    const state = generateRandomState()             │                                 │
       │      // UUID，防 CSRF                              │                                 │
       │                                                     │                                 │
       │    sessionStorage.setItem('pkce_verifier', verifier)                                 │
       │    sessionStorage.setItem('pkce_state', state)      │                                 │
       │    (暫存於瀏覽器，關閉即消失) ✨                      │                                 │
       │                                                     │                                 │
       │ 2. POST /api/auth/google/init ✨                    │                                 │
       │    Body: {                                          │                                 │
       │      code_challenge: challenge,                     │                                 │
       │      code_challenge_method: 'S256',                 │                                 │
       │      state: state                                   │                                 │
       │    }                                                │                                 │
       ├────────────────────────────────────────────────────▶                                 │
       │                                                     │                                 │
       │                                                     │ 3. 構建 Google OAuth URL        │
       │                                                     │    (後端無狀態，不儲存任何資料)   │
       │                                                     │                                 │
       │ 4. 返回 Google OAuth URL ✨                         │                                 │
       │◀────────────────────────────────────────────────────┤                                 │
       │    {                                                │                                 │
       │      authUrl:                                       │                                 │
       │        'https://accounts.google.com/o/oauth2/v2/auth?                                │
       │         client_id=xxx&                              │                                 │
       │         redirect_uri=.../callback&                  │                                 │
       │         response_type=code&                         │                                 │
       │         scope=profile+email&                        │                                 │
       │         state={state}&                              │                                 │
       │         code_challenge={challenge}&                 │                                 │
       │         code_challenge_method=S256'                 │                                 │
       │    }                                                │                                 │
       │                                                     │                                 │
       │ 5. 前端重導向至 Google ✨                            │                                 │
       │    window.location.href = authUrl                   │                                 │
       ├─────────────────────────────────────────────────────────────────────────────────────▶
       │                                                     │                  6. 用戶登入授權  │
       │                                                     │                     並授權應用    │
       │                                                     │                                 │
       │                                                     │                  7. Google 記錄  │
       │                                                     │                     code_challenge
       │                                                     │                     和 state     │
       │                                                     │                                 │
       │ 8. Google 重導向回前端 ✨                            │                                 │
       │    https://daodao.com/auth/callback?               │                                 │
       │    code=AUTHORIZATION_CODE&                         │                                 │
       │    state={same_state}                               │                                 │
       │◀─────────────────────────────────────────────────────────────────────────────────────┤
       │                                                     │                                 │
       │ 9. 前端接收 callback ✨                              │                                 │
       │    URL: /auth/callback?code=xxx&state=xxx           │                                 │
       │    從 sessionStorage 取得:                          │                                 │
       │    - pkce_verifier                                  │                                 │
       │    - pkce_state                                     │                                 │
       │                                                     │                                 │
       │ 10. 驗證 state ✨                                    │                                 │
       │     if (query.state !== sessionStorage.state)      │                                 │
       │       throw Error('CSRF detected')                  │                                 │
       │                                                     │                                 │
       │ 11. POST /api/auth/google/callback ✨               │                                 │
       │     Body: {                                         │                                 │
       │       code: AUTHORIZATION_CODE,                     │                                 │
       │       code_verifier: pkce_verifier                  │                                 │
       │     }                                               │                                 │
       ├────────────────────────────────────────────────────▶                                 │
       │                                                     │                                 │
       │                                                     │ 12. 後端向 Google 換取 token ✨  │
       │                                                     │     POST https://oauth2.googleapis.com/token
       │                                                     ├─────────────────────────────────▶
       │                                                     │     Body: {                     │
       │                                                     │       code,                     │
       │                                                     │       client_id,                │
       │                                                     │       client_secret,            │
       │                                                     │       redirect_uri,             │
       │                                                     │       grant_type: 'authorization_code',
       │                                                     │       code_verifier ✨           │
       │                                                     │     }                           │
       │                                                     │                                 │
       │                                                     │                  13. Google 驗證 ✨
       │                                                     │                      - 驗證 client_secret
       │                                                     │                      - 驗證 SHA256(code_verifier)
       │                                                     │                        === code_challenge
       │                                                     │                      - 雙重驗證通過
       │                                                     │                                 │
       │                                                     │ 14. 返回 Google tokens          │
       │                                                     │◀─────────────────────────────────┤
       │                                                     │     {                           │
       │                                                     │       access_token,             │
       │                                                     │       id_token,                 │
       │                                                     │       expires_in: 3599          │
       │                                                     │     }                           │
       │                                                     │                                 │
       │                                                     │ 15. 取得 Google Profile         │
       │                                                     ├─────────────────────────────────▶
       │                                                     │     GET /oauth2/v2/userinfo     │
       │                                                     │     Authorization: Bearer {token}
       │                                                     │                                 │
       │                                                     │◀─────────────────────────────────┤
       │                                                     │     { email, name, picture }    │
       │                                                     │                                 │
       │                                                     │ 16. 查找或建立用戶               │
       │                                                     │     - users (正式用戶)           │
       │                                                     │     - temp_users (臨時用戶)      │
       │                                                     │                                 │
       │                                                     │ 17. 生成我們的 JWT token pair ✨ │
       │                                                     │     - Access Token (15分鐘)      │
       │                                                     │       { id, email, isTemp, ... }│
       │                                                     │     - Refresh Token (30天)       │
       │                                                     │       { tokenId: uuid, userId }  │
       │                                                     │                                 │
       │                                                     │ 18. 存入 Redis (Token Rotation)  │
       │                                                     │     refresh_token:{uuid} → {     │
       │                                                     │       userId: 123,              │
       │                                                     │       tokenId: 'xxx',           │
       │                                                     │       isTemp: false,            │
       │                                                     │       createdAt: Date.now()     │
       │                                                     │     }                           │
       │                                                     │     TTL: 30 天                  │
       │                                                     │                                 │
       │ 19. 返回 JSON（不是重導向！）✨                       │                                 │
       │◀────────────────────────────────────────────────────┤                                 │
       │     {                                               │                                 │
       │       success: true,                                │                                 │
       │       data: {                                       │                                 │
       │         accessToken: "eyJhbGc...",                  │                                 │
       │         refreshToken: "eyJhbGc...",                 │                                 │
       │         expiresIn: 900, // 15分鐘                   │                                 │
       │         user: {                                     │                                 │
       │           id: 123,                                  │                                 │
       │           email: "user@gmail.com",                  │                                 │
       │           name: "User Name",                        │                                 │
       │           isTemp: false                             │                                 │
       │         }                                           │                                 │
       │       },                                            │                                 │
       │       timestamp: "2024-01-15T10:30:00Z"             │                                 │
       │     }                                               │                                 │
       │                                                     │                                 │
       │ 20. 前端存入 localStorage ✨                         │                                 │
       │     localStorage.setItem('access_token', accessToken)                                │
       │     localStorage.setItem('refresh_token', refreshToken)                              │
       │     localStorage.setItem('token_expires_at',        │                                 │
       │       Date.now() + expiresIn * 1000)                │                                 │
       │                                                     │                                 │
       │ 21. 清除 sessionStorage ✨                           │                                 │
       │     sessionStorage.removeItem('pkce_verifier')      │                                 │
       │     sessionStorage.removeItem('pkce_state')         │                                 │
       │     (PKCE 參數已用完，立即銷毀)                      │                                 │
       │                                                     │                                 │
       │ 22. 前端導向至 Dashboard                             │                                 │
       │     window.location.href = '/dashboard'             │                                 │
       │                                                     │                                 │
       │ ✅ 登入完成！                                        │                                 │
       │                                                     │                                 │

// 後續 API 請求流程
       │                                                     │
       │ 23. 前端發送 API 請求 ✨                             │
       │     GET /api/v1/resources                           │
       │     Authorization: Bearer {access_token}            │
       │     (從 localStorage 取得)                          │
       ├────────────────────────────────────────────────────▶│
       │                                                     │
       │                                                     │ 24. JWT 中間件驗證
       │                                                     │     - 驗證 JWT 簽章
       │                                                     │     - 檢查過期時間
       │                                                     │     - 解析 payload → req.user
       │                                                     │
       │ 25. 返回資料                                         │
       │◀────────────────────────────────────────────────────┤
       │                                                     │

// Token 刷新流程（自動）
       │                                                     │
       │ (14 分鐘後) 前端偵測 Token 即將過期 ✨               │
       │ POST /api/auth/refresh                              │
       │ Authorization: Bearer {refresh_token}               │
       │ (從 localStorage 取得)                              │
       ├────────────────────────────────────────────────────▶│
       │                                                     │
       │                                                     │ 26. 驗證 refresh_token
       │                                                     │     - 驗證 JWT 簽章
       │                                                     │     - 從 Redis 驗證 tokenId
       │                                                     │     - 檢查是否已撤銷
       │                                                     │
       │                                                     │ 27. 撤銷舊的 refresh_token ✨
       │                                                     │     Redis DEL refresh_token:{old_id}
       │                                                     │     (Token Rotation 機制)
       │                                                     │
       │                                                     │ 28. 生成新的 token pair
       │                                                     │     - 新 Access Token (15分)
       │                                                     │     - 新 Refresh Token (30天)
       │                                                     │
       │                                                     │ 29. 存入新 refresh_token 至 Redis
       │                                                     │
       │ 30. 返回新 tokens ✨                                 │
       │◀────────────────────────────────────────────────────┤
       │     {                                               │
       │       success: true,                                │
       │       data: {                                       │
       │         accessToken: "new_token...",                │
       │         refreshToken: "new_refresh...",             │
       │         expiresIn: 900                              │
       │       }                                             │
       │     }                                               │
       │                                                     │
       │ 31. 前端更新 localStorage ✨                         │
       │     localStorage.setItem('access_token', newToken)  │
       │     localStorage.setItem('refresh_token', newRefresh)│
       │     localStorage.setItem('token_expires_at', ...)   │
       │                                                     │
       │ ✅ Token 刷新完成！舊 token 已失效                    │
```

#### 與舊流程對比

| 步驟 | 舊流程（不安全） | 新流程（PKCE + localStorage） | 改善 |
|-----|----------------|------------------------------|------|
| **PKCE 生成** | ❌ 無 | ✅ **前端生成** code_verifier & challenge | 🔒 防攔截 |
| **PKCE 儲存** | ❌ 無 | ✅ sessionStorage（暫時），用完即刪 | 🔒 最小暴露 |
| **啟動登入** | 直接重導向 Google | 前端 POST /init 取得 authUrl，再重導向 | ✅ 參數不外洩 |
| **OAuth 參數** | 無 `code_challenge` | ✅ `code_challenge` + `code_challenge_method=S256` | 🔒 PKCE 保護 |
| **Callback 處理** | 後端直接處理 | ✅ **前端驗證 state**，再 POST 給後端 | 🔒 防 CSRF |
| **Token 交換** | 僅用 `client_secret` | ✅ `client_secret` + `code_verifier` | 🔒 雙重驗證 |
| **Token 傳遞** | 🚨 URL: `/callback?token=xxx` | ✅ **JSON response (POST)** | 🔒 不洩漏 |
| **Token 儲存** | localStorage（但從 URL 取得）| ✅ localStorage（從安全 API 取得） | ✅ 來源安全 |
| **Token 刷新** | ❌ 無（過期需重登） | ✅ Refresh Token (30天) | ✅ 自動刷新 |
| **Token Rotation** | ❌ 無 | ✅ 每次刷新換新 token | 🔒 防洩漏 |
| **狀態管理** | ❌ 後端 session | ✅ **完全無狀態**（前端 sessionStorage） | 🚀 可擴展 |
| **CSRF 防護** | ❌ 無 | ✅ state 參數（前端驗證） | 🔒 防 CSRF |

#### 關鍵安全改進

1. **PKCE 流程（前端主導）**
   ```
   ❌ 舊：Google → code → 後端 (code + secret) → token
            ↑ 若 code 被攔截，攻擊者用 secret 可換 token

   ✅ 新：前端生成 verifier → Google (code + challenge)
          → 前端拿到 code → POST 給後端 (code + verifier)
          → 後端 (code + secret + verifier) → Google → token
            ↑ 即使 code 被攔截，沒有 verifier（前端 sessionStorage）無法換 token
            ↑ 完全無狀態，後端不需存儲 PKCE 參數
   ```

2. **Token 傳遞（POST API vs URL）**
   ```
   ❌ 舊：URL 傳遞（極度不安全）
          https://daodao.com/callback?token=eyJhbGc...
            - 🚨 瀏覽器歷史記錄永久保存
            - 🚨 Referer header 洩漏給第三方
            - 🚨 分析工具記錄
            - 🚨 伺服器日誌記錄
            - 🚨 瀏覽器擴充功能可讀

   ✅ 新：POST API 回應（安全）
          POST /api/auth/google/callback
          Response: { accessToken, refreshToken, user }
            - ✅ 不出現在 URL
            - ✅ 不記錄於歷史
            - ✅ HTTPS 加密傳輸
            - ✅ 前端主動請求，有控制權
            - ✅ 存入 localStorage（雖有 XSS 風險，但至少不外洩）
   ```

3. **狀態管理（無狀態 vs 有狀態）**
   ```
   ❌ 舊：雖說用 localStorage，但 Passport 有 session 依賴
          （session 未被真正使用，但存在於配置中）

   ✅ 新：完全無狀態架構
          - 前端：sessionStorage 暫存 PKCE（OAuth 流程期間）
          - 後端：完全無狀態，不存儲任何 PKCE 或 session
          - Redis：僅存儲 refresh token（用於 Token Rotation）
          - 水平擴展友好，任何後端實例都可處理請求
   ```

4. **Token Rotation（自動刷新機制）**
   ```
   ❌ 舊：單一 JWT（15分），過期需重新登入

   ✅ 新：Access Token (15分) + Refresh Token (30天)
          - 前端自動偵測 Token 即將過期（14分鐘時）
          - 自動 POST /api/auth/refresh 刷新
          - 舊 refresh token 立即失效（Token Rotation）
          - 若被盜用，正常用戶刷新會觸發異常偵測
   ```

5. **CSRF 防護（state 參數）**
   ```
   ❌ 舊：無 state 參數驗證

   ✅ 新：前端生成並驗證 state
          1. 前端生成隨機 state（UUID）
          2. 存入 sessionStorage
          3. 發送給 Google
          4. Google 回傳相同 state
          5. 前端驗證 state 一致性（防止 CSRF 攻擊）
   ```

#### 簡化流程對比圖

```
╔═══════════════════════════════════════════════════════════════════════╗
║                    舊流程（不安全）                                      ║
╚═══════════════════════════════════════════════════════════════════════╝

  前端                  後端                Google
   │                     │                    │
   │ 1. 點擊登入          │                    │
   │────────────────────▶│                    │
   │                     │ 2. 重導向           │
   │◀────────────────────┤                    │
   │                                           │
   │ 3. 授權請求（無 PKCE）                     │
   │──────────────────────────────────────────▶│
   │                                           │
   │ 4. 返回 code                               │
   │◀──────────────────────────────────────────┤
   │                                           │
   │ 5. code 傳給後端     │                    │
   │────────────────────▶│                    │
   │                     │ 6. code + secret → token
   │                     │───────────────────▶│
   │                     │◀───────────────────┤
   │                     │ 7. 取得用戶資料     │
   │                     │───────────────────▶│
   │                     │◀───────────────────┤
   │                     │                    │
   │ 8. 🚨 URL 傳 Token  │                    │
   │    /callback?token=xxx                   │
   │◀────────────────────┤                    │
   │ ⚠️ Token 洩漏！                           │
   │ ⚠️ 無法刷新！                             │

╔═══════════════════════════════════════════════════════════════════════╗
║              新流程（PKCE + localStorage，前端主導）                    ║
╚═══════════════════════════════════════════════════════════════════════╝

  前端                  後端                Google
   │                     │                    │
   │ 1. 生成 PKCE ✨      │                    │
   │    verifier         │                    │
   │    challenge        │                    │
   │    state            │                    │
   │    存 sessionStorage│                    │
   │                     │                    │
   │ 2. POST /init ✨     │                    │
   │    {challenge,state}│                    │
   │────────────────────▶│                    │
   │                     │ 3. 構建 authUrl     │
   │                     │    (無狀態) ✨      │
   │ 4. 返回 authUrl      │                    │
   │◀────────────────────┤                    │
   │                     │                    │
   │ 5. 重導向至 Google   │                    │
   │──────────────────────────────────────────▶│
   │                                Google 記錄 challenge
   │                                           │
   │ 6. 返回 code                               │
   │◀──────────────────────────────────────────┤
   │                     │                    │
   │ 7. 驗證 state ✨     │                    │
   │    (防 CSRF)        │                    │
   │                     │                    │
   │ 8. POST /callback ✨ │                    │
   │    {code, verifier} │                    │
   │────────────────────▶│                    │
   │                     │ 9. code + secret + verifier ✨
   │                     │───────────────────▶│
   │                     │       Google 驗證:  │
   │                     │       ✓ secret     │
   │                     │       ✓ verifier   │
   │                     │◀───────────────────┤
   │                     │ 10. 取得用戶資料    │
   │                     │───────────────────▶│
   │                     │◀───────────────────┤
   │                     │ 11. 生成 JWT pair ✨│
   │                     │    - Access (15分) │
   │                     │    - Refresh (30天)│
   │                     │                    │
   │ 12. ✅ JSON 傳 Token ✨                   │
   │     {accessToken, refreshToken, user}    │
   │◀────────────────────┤                    │
   │                     │                    │
   │ 13. 存 localStorage ✨                    │
   │     清除 sessionStorage                  │
   │                     │                    │
   │ 14. 後續請求攜帶     │                    │
   │     Authorization: Bearer {token}        │
   │────────────────────▶│                    │
   │◀────────────────────┤                    │
   │                     │                    │
   │ ✅ 安全！Token 不洩漏於 URL               │
   │ ✅ 自動刷新 30 天                          │
   │ ✅ 完全無狀態，可水平擴展                  │
```

#### 數據流向對比

```
舊流程 Token 暴露路徑（極度不安全）：
┌─────────┐   Token in URL (302)  ┌──────────┐
│  後端   │ ══════════════════════▶ │  前端    │
└─────────┘   🚨 瀏覽器歷史           └──────────┘
              🚨 Referer header            │
              🚨 分析工具記錄              │ localStorage
              🚨 日誌洩漏                  │ 🚨 Token 已外洩
              🚨 擴充功能可讀              │ 🚨 XSS 可竊取

新流程 Token 安全傳遞（POST API）：
┌─────────┐   POST /callback      ┌──────────┐
│  後端   │◀══════════════════════ │  前端    │ (1) 生成 PKCE
└─────────┘   {code, verifier}     └──────────┘     verifier 在 sessionStorage
     │                                    ▲
     │ JSON Response                     │
     │ {accessToken, refreshToken}       │ (2) 存 localStorage
     └───────────────────────────────────┘
              ✅ 不在 URL                  │ Authorization: Bearer {token}
              ✅ HTTPS 加密                │ ✅ 有控制權
              ✅ 前端主動請求              │ ⚠️ XSS 風險（但至少不外洩）
              ✅ 不記錄於歷史
```

---

## PKCE 技術背景與優勢

### PKCE 原理

PKCE（RFC 7636）透過動態生成的 **code_verifier** 和 **code_challenge** 來保護授權碼：

```
Client 端：
code_verifier = random_string(43-128 chars)
code_challenge = BASE64URL(SHA256(code_verifier))

Authorization Request：
帶上 code_challenge + code_challenge_method=S256

Token Request：
帶上原始的 code_verifier + client_secret（Google 要求）

Authorization Server：
1. 驗證 client_secret（傳統驗證）
2. 驗證 SHA256(code_verifier) == code_challenge（PKCE 驗證）
```

### ⚠️ Google OAuth 特殊要求

**重要**：Google OAuth 2.0 實作 PKCE 時**仍需要 client_secret**，這與標準 PKCE（為公開客戶端設計）略有不同：

- ✅ **支援 PKCE 參數**：`code_challenge`, `code_verifier`
- ⚠️ **仍需 client_secret**：Token 交換時必須提供
- 🔒 **雙重保護**：同時驗證 PKCE 和 client_secret

這意味著我們的實作是 **Authorization Code Flow + PKCE + Client Secret** 的混合模式，提供最高安全性。

### 安全性比較

#### 傳統 OAuth 2.0（無 PKCE）
```
攻擊場景：
1. 攻擊者攔截 authorization code
2. 如果攻擊者知道 client_id（公開資訊）
3. 在沒有 client_secret 保護的公開客戶端中
4. 攻擊者可以直接用 code 換取 access_token
```

#### OAuth 2.0 + PKCE
```
防禦機制：
1. 攻擊者攔截 authorization code
2. 但沒有原始的 code_verifier（僅在客戶端記憶體中）
3. 無法透過逆向 code_challenge 取得 code_verifier（SHA-256 單向）
4. Authorization Server 拒絕兌換 token
```

### OAuth 2.1 標準

根據 OAuth 2.1 草案（draft-ietf-oauth-v2-1-09）：
- ✅ **強制要求**: 所有使用 Authorization Code Flow 的客戶端必須使用 PKCE
- ✅ **廢棄 Implicit Flow**: 不再支援 Implicit Flow
- ✅ **強制 Redirect URI**: 必須精確匹配註冊的 redirect URI
- ✅ **Refresh Token Rotation**: 建議實施 refresh token rotation

### 產業最佳實踐（2025）

根據 Okta、Auth0、Microsoft Identity Platform 的最新指引：

1. **所有客戶端類型都應使用 PKCE**
   - 不僅限於公開客戶端（SPA、Mobile）
   - 包括機密客戶端（Traditional Web Apps）

2. **建議使用 `S256` 方法**
   ```javascript
   // 推薦（S256）
   code_challenge = BASE64URL(SHA256(code_verifier))

   // 不推薦（plain）- 僅在不支援 SHA-256 的舊環境
   code_challenge = code_verifier
   ```

3. **Code Verifier 長度建議**
   - 最小長度: 43 字元
   - 最大長度: 128 字元
   - 建議長度: 64-128 字元

4. **Token 儲存策略**
   ```
   Access Token:  HTTP-only, Secure, SameSite=Strict Cookie (5-15 分鐘)
   Refresh Token: HTTP-only, Secure, SameSite=Strict Cookie (7-30 天)
   ```

---

## 遷移策略與實施計畫

### 遷移原則

#### 1. 直接替換策略（Direct Replacement）
- **不考慮向下相容**：舊的 OAuth 流程將被完全替換
- **一次性遷移**：前後端同步切換至 PKCE 流程
- **理由**：
  - 現有流程存在安全風險（Token 暴露在 URL）
  - PKCE 是 OAuth 2.1 標準，無需維護舊流程
  - 簡化架構，避免雙流程維護成本

#### 2. 零停機部署（Zero Downtime）
- 使用藍綠部署或滾動更新
- 部署窗口選在低流量時段
- 準備快速回滾機制

#### 3. 資料相容性（Data Compatibility）
- JWT payload 結構保持一致
- 現有已登入用戶需重新登入（一次性）
- Redis Session 數據結構變更

### 實施階段

#### Phase 1: 準備階段（1 週）
**目標**: 環境準備與技術驗證

- [ ] **技術驗證**
  - ✅ **好消息**：`passport-google-oauth20` 內建支援 PKCE（v1.5.0+）
  - ✅ **確認**：只需設定 `pkce: true` 和 `state: true`
  - ⚠️ **注意**：Google OAuth 仍需 client_secret（標準行為）

- [ ] **環境設定**
  - ✅ **無需升級**：現有 `passport ^0.6.0` + `passport-google-oauth20 ^2.0.0` 已支援
  - 確認現有 Redis 配置（ioredis ^5.4.1 已滿足需求）
  - 設定開發/測試環境變數

- [ ] **Redis 整合**
  - 設計 Refresh Token 暫存結構（key: `refresh_token:{tokenId}`）
  - 設定過期策略：Refresh token 30 天
  - ⚠️ **PKCE session 由 Passport 自動管理**（存在 express-session）

- [ ] **更新 Passport 配置**
  - 修改現有 GoogleStrategy，啟用 `pkce: true`
  - 移除 serializeUser/deserializeUser（改用 stateless JWT）
  - 更新 callback 處理邏輯

#### Phase 2: 後端實作（2-3 週）
**目標**: 完整實作 PKCE 流程

- [ ] **核心服務開發**
  - 實作 PKCE 服務（code_verifier 生成、驗證）
  - 更新 OAuth 服務支援 PKCE
  - 實作 Refresh Token 服務
  - 實作 Token Rotation 邏輯

- [ ] **API 端點開發**
  - 新增 `POST /api/auth/pkce/start` - 啟動 PKCE 流程
  - 更新 `GET /api/auth/google/callback` - 支援 PKCE 驗證
  - 新增 `POST /api/auth/token` - Token 交換端點
  - 新增 `POST /api/auth/refresh` - Token 刷新端點（更新現有）

- [ ] **中間件與輔助功能**
  - 更新 JWT 驗證中間件
  - 實作 Cookie 管理工具
  - 實作請求驗證中間件

- [ ] **安全性增強**
  - CORS 配置更新
  - Rate Limiting 設定
  - CSRF 保護機制

#### Phase 3: 前端整合（2 週）
**目標**: 前端實作 PKCE 客戶端流程

- [ ] **PKCE 客戶端實作**
  - 實作 code_verifier 和 code_challenge 生成
  - 實作 sessionStorage 管理
  - 實作 state 參數防 CSRF

- [ ] **API 整合**
  - 整合 PKCE 流程 API
  - 實作 token 自動刷新機制
  - 實作錯誤處理

- [ ] **用戶體驗優化**
  - 無感 token 刷新
  - 登入狀態持久化
  - 登出清理流程

#### Phase 4: 測試與驗證（1-2 週）
**目標**: 全面測試與安全驗證

- [ ] **功能測試**
  - 單元測試（覆蓋率 ≥80%）
  - 整合測試
  - E2E 測試

- [ ] **安全測試**
  - PKCE 流程安全測試
  - Token 洩漏測試
  - CSRF 攻擊測試
  - XSS 攻擊測試

- [ ] **效能測試**
  - 負載測試
  - 並發測試
  - Redis 效能測試

#### Phase 5: 部署與監控（3-5 天）
**目標**: 生產環境部署與監控

- [ ] **部署準備**
  - 準備部署文檔和回滾腳本
  - 設定監控告警（錯誤率、延遲、Redis 可用性）
  - 通知用戶：「系統升級，需重新登入一次」

- [ ] **直接替換部署**（無灰度）
  - Day 1: 選擇低流量時段（凌晨 2-4 AM）
  - 部署新版本（藍綠部署）
  - 清除所有舊的 session（強制重新登入）
  - 驗證新流程正常運作

- [ ] **監控與緊急應對**（部署後 48 小時）
  - 實時監控認證成功率（目標 >98%）
  - 監控 PKCE 流程耗時（目標 <2 秒）
  - 監控 Redis 效能
  - 準備快速回滾（若失敗率 >5%）

- [ ] **後續優化**（1 週內）
  - 收集用戶反饋
  - 調整 token 過期時間
  - 優化 Redis TTL 設定

---