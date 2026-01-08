# 登入授權機制分析與 PKCE 遷移指南

## 目錄
- [現行常見登入授權方式](#現行常見登入授權方式)
- [從直接傳 Token 改為 PKCE 的考量](#從直接傳-token-改為-pkce-的考量)
- [實作建議與最佳實踐](#實作建議與最佳實踐)
- [PKCE 實作範例](#pkce-實作範例)

---

## 現行常見登入授權方式

### 1. OAuth 2.0 授權碼流程（Authorization Code Flow）

**運作方式：**
1. 用戶點擊登入，重導向至授權伺服器
2. 用戶在授權伺服器完成身份驗證
3. 授權伺服器返回授權碼（code）到後端
4. 後端使用授權碼 + client_secret 換取 access token
5. Token 不會暴露在前端或瀏覽器

**優點：**
- ✅ 最安全的標準流程
- ✅ Token 不經過瀏覽器，避免洩漏
- ✅ 適合傳統 Web 應用

**缺點：**
- ❌ 需要後端伺服器支援
- ❌ 需要安全儲存 client_secret

**適用場景：** 有後端的傳統 Web 應用

---

### 2. OAuth 2.0 隱式流程（Implicit Flow）

**運作方式：**
1. 用戶登入後直接在瀏覽器取得 access token
2. Token 會出現在 URL fragment 中（#access_token=...）

**優點：**
- ✅ 實作簡單，不需要後端

**缺點：**
- ⚠️ **已被視為不安全，不建議使用**
- ❌ Token 暴露在 URL 中
- ❌ 容易從瀏覽器歷史記錄洩漏
- ❌ 易受中間人攻擊
- ❌ 無法使用 refresh token

**適用場景：** 無（已被 PKCE 取代）

---

### 3. PKCE（Proof Key for Code Exchange）

**運作方式：**
1. 客戶端產生隨機字串 `code_verifier`
2. 計算 `code_challenge = BASE64URL(SHA256(code_verifier))`
3. 發起授權請求時帶上 `code_challenge`
4. 取得授權碼後，用 `code_verifier` 換取 token
5. 授權伺服器驗證 `code_verifier` 是否符合先前的 `code_challenge`

**優點：**
- ✅ 防止授權碼攔截攻擊
- ✅ 不需要 client_secret
- ✅ 適合單頁應用（SPA）和行動應用
- ✅ **OAuth 2.1 的建議標準**
- ✅ 可搭配 refresh token

**缺點：**
- ❌ 實作相對複雜

**適用場景：** 單頁應用、行動應用、公開客戶端

---

### 4. Session-based 認證

**運作方式：**
1. 用戶登入後，伺服器產生 session ID
2. Session ID 儲存在 HTTP-only cookie 中
3. 每次請求自動帶上 cookie
4. 伺服器端驗證 session

**優點：**
- ✅ 傳統且成熟
- ✅ Session ID 不易被 XSS 竊取（HTTP-only）
- ✅ 容易實作登出

**缺點：**
- ❌ 不適合分散式系統
- ❌ 需要 session 儲存（記憶體/資料庫/Redis）
- ❌ 水平擴展較困難
- ❌ 不適合跨域應用

**適用場景：** 傳統單體應用、同源應用

---

### 5. JWT Token 認證

**運作方式：**
1. 用戶登入後取得 JWT token
2. 前端儲存 token（localStorage 或 cookie）
3. 每次請求在 Header 中帶上 token
4. 伺服器驗證 JWT 簽章

**優點：**
- ✅ 無狀態，易於水平擴展
- ✅ 適合微服務架構
- ✅ 可跨域使用

**缺點與風險：**
- ❌ 儲存在 localStorage：易受 XSS 攻擊
- ❌ 儲存在一般 cookie：需防範 CSRF 攻擊
- ❌ Token 無法主動撤銷（除非加入黑名單機制）
- ❌ Token 大小較大

**適用場景：** 微服務、API 服務、跨域應用

---

## 從直接傳 Token 改為 PKCE 的考量

### 現行問題（直接傳 Token）

| 風險類型 | 說明 |
|---------|------|
| **URL 洩漏** | Token 可能出現在 URL 中，被瀏覽器歷史、伺服器日誌記錄 |
| **中間人攻擊** | Token 在傳輸過程中可能被攔截 |
| **XSS 攻擊** | Token 儲存在 localStorage 容易被惡意腳本竊取 |
| **Token 重放** | 攔截到的 token 可被重複使用 |
| **無過期機制** | 長期有效的 token 一旦洩漏影響更大 |

### 改用 PKCE 的優勢

| 優勢 | 說明 |
|------|------|
| **授權碼單次使用** | 授權碼只能使用一次，用完即失效 |
| **防攔截** | 即使授權碼被攔截，沒有 code_verifier 也無法換取 token |
| **無需 Secret** | 不需要在客戶端儲存 client_secret |
| **符合現代標準** | OAuth 2.1 建議標準 |
| **適合前端應用** | 專為 SPA、行動應用設計 |
| **降低攻擊面** | 減少 token 在前端的暴露時間 |

### 安全性比較

```
直接傳 Token（Implicit Flow）
用戶 → 授權伺服器 → Token（暴露在 URL）→ 前端
                    ⚠️ 易被攔截

PKCE Flow
用戶 → 授權伺服器 → 授權碼（短暫有效）→ 前端
                         ↓
                    前端 + code_verifier → 授權伺服器 → Token
                    ✅ 需要 verifier 才能換 token
```

---

## 實作建議與最佳實踐

### 推薦方案組合

```
Authorization Code Flow + PKCE + Refresh Token
```

### 安全加強措施

#### 1. Token 儲存策略

**建議方式：**
```
Access Token：HTTP-only、Secure、SameSite=Strict Cookie
Refresh Token：HTTP-only、Secure、SameSite=Strict Cookie
```

**Cookie 屬性說明：**
- `HTTP-only`：防止 JavaScript 存取，避免 XSS 攻擊
- `Secure`：僅在 HTTPS 連線下傳送
- `SameSite=Strict`：防止 CSRF 攻擊

#### 2. Token 生命週期

| Token 類型 | 建議過期時間 | 說明 |
|-----------|------------|------|
| Access Token | 5-15 分鐘 | 短期有效，減少洩漏風險 |
| Refresh Token | 7-30 天 | 用於換取新的 access token |
| Authorization Code | 10 分鐘 | 極短暫，僅用於換 token |

#### 3. Refresh Token Rotation

每次使用 refresh token 換取新的 access token 時：
1. 發放新的 access token
2. 發放新的 refresh token（替換舊的）
3. 舊的 refresh token 立即失效

**優點：**
- 即使 refresh token 洩漏，下次正常使用會讓洩漏的 token 失效
- 可偵測 token 盜用行為

#### 4. 傳輸安全

- ✅ **強制 HTTPS**：所有通訊必須加密
- ✅ **HSTS**：強制瀏覽器使用 HTTPS
- ✅ **Certificate Pinning**（行動應用）：防止中間人攻擊

#### 5. CORS 設定

```javascript
// 範例：嚴格的 CORS 設定
{
  origin: 'https://your-app.com',  // 明確指定來源
  credentials: true,                // 允許攜帶 Cookie
  methods: ['GET', 'POST'],         // 限制 HTTP 方法
  allowedHeaders: ['Content-Type']  // 限制 Header
}
```

#### 6. 其他安全措施

- **Rate Limiting**：限制登入嘗試次數
- **CAPTCHA**：防止自動化攻擊
- **IP 白名單**：限制授權伺服器存取來源（後端）
- **Audit Log**：記錄所有授權行為
- **User Agent 檢查**：偵測異常裝置登入

---

## PKCE 實作範例

### 前端實作（JavaScript）

#### 1. 產生 Code Verifier 和 Code Challenge

```javascript
// 產生隨機的 code_verifier（43-128 個字元）
function generateCodeVerifier() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64URLEncode(array);
}

// 計算 code_challenge（SHA-256 hash）
async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return base64URLEncode(new Uint8Array(hash));
}

// Base64 URL 編碼
function base64URLEncode(buffer) {
  const base64 = btoa(String.fromCharCode(...buffer));
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}
```

#### 2. 發起授權請求

```javascript
async function startOAuthFlow() {
  // 產生並儲存 code_verifier
  const codeVerifier = generateCodeVerifier();
  sessionStorage.setItem('code_verifier', codeVerifier);
  
  // 計算 code_challenge
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  
  // 產生 state（防 CSRF）
  const state = generateCodeVerifier(); // 重用函式產生隨機值
  sessionStorage.setItem('oauth_state', state);
  
  // 建構授權 URL
  const authUrl = new URL('https://auth.example.com/oauth/authorize');
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('client_id', 'YOUR_CLIENT_ID');
  authUrl.searchParams.append('redirect_uri', 'https://your-app.com/callback');
  authUrl.searchParams.append('scope', 'openid profile email');
  authUrl.searchParams.append('state', state);
  authUrl.searchParams.append('code_challenge', codeChallenge);
  authUrl.searchParams.append('code_challenge_method', 'S256');
  
  // 重導向至授權頁面
  window.location.href = authUrl.toString();
}
```

#### 3. 處理授權回調

```javascript
async function handleCallback() {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const state = urlParams.get('state');
  
  // 驗證 state
  const savedState = sessionStorage.getItem('oauth_state');
  if (state !== savedState) {
    throw new Error('State mismatch - possible CSRF attack');
  }
  
  // 取得 code_verifier
  const codeVerifier = sessionStorage.getItem('code_verifier');
  
  // 用授權碼換取 token
  const response = await fetch('https://auth.example.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: 'https://your-app.com/callback',
      client_id: 'YOUR_CLIENT_ID',
      code_verifier: codeVerifier,
    }),
  });
  
  const tokens = await response.json();
  
  // 清除暫存資料
  sessionStorage.removeItem('code_verifier');
  sessionStorage.removeItem('oauth_state');
  
  // 處理取得的 tokens
  handleTokens(tokens);
}

function handleTokens(tokens) {
  // tokens.access_token
  // tokens.refresh_token
  // tokens.expires_in
  
  // 建議：讓後端設定 HTTP-only cookie，而非在前端處理
}
```

### 後端實作（Node.js + Express）

#### 1. 驗證授權碼並換取 Token

```javascript
const express = require('express');
const axios = require('axios');
const crypto = require('crypto');

app.post('/api/auth/token', async (req, res) => {
  const { code, code_verifier } = req.body;
  
  try {
    // 向授權伺服器換取 token
    const tokenResponse = await axios.post(
      'https://auth.example.com/oauth/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: 'https://your-app.com/callback',
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET, // 僅後端持有
        code_verifier: code_verifier,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    
    const { access_token, refresh_token, expires_in } = tokenResponse.data;
    
    // 設定 HTTP-only Cookie
    res.cookie('access_token', access_token, {
      httpOnly: true,
      secure: true, // 僅 HTTPS
      sameSite: 'strict',
      maxAge: expires_in * 1000,
    });
    
    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 天
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Token exchange failed:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
});
```

#### 2. Refresh Token 端點

```javascript
app.post('/api/auth/refresh', async (req, res) => {
  const refreshToken = req.cookies.refresh_token;
  
  if (!refreshToken) {
    return res.status(401).json({ error: 'No refresh token' });
  }
  
  try {
    const tokenResponse = await axios.post(
      'https://auth.example.com/oauth/token',
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
      })
    );
    
    const { access_token, refresh_token, expires_in } = tokenResponse.data;
    
    // 更新 Cookie（Token Rotation）
    res.cookie('access_token', access_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: expires_in * 1000,
    });
    
    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    
    res.json({ success: true });
  } catch (error) {
    // Refresh token 無效或過期，要求重新登入
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    res.status(401).json({ error: 'Please login again' });
  }
});
```

#### 3. 認證中介層

```javascript
function authenticateToken(req, res, next) {
  const token = req.cookies.access_token;
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  // 驗證 JWT（假設使用 JWT）
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      // Token 過期或無效
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
}

// 使用範例
app.get('/api/protected', authenticateToken, (req, res) => {
  res.json({ data: 'Protected data', user: req.user });
});
```

### 完整流程圖

```
1. 用戶點擊登入
   ↓
2. 前端產生 code_verifier 和 code_challenge
   ↓
3. 重導向至授權伺服器（帶 code_challenge）
   ↓
4. 用戶登入並授權
   ↓
5. 授權伺服器重導向回應用（帶 authorization code）
   ↓
6. 前端用 code + code_verifier 呼叫後端
   ↓
7. 後端向授權伺服器換取 token（帶 code_verifier）
   ↓
8. 授權伺服器驗證 code_verifier 是否符合 code_challenge
   ↓
9. 後端取得 access_token 和 refresh_token
   ↓
10. 後端設定 HTTP-only Cookie
    ↓
11. 完成登入
```

---

## 遷移檢查清單

### 規劃階段
- [ ] 確認授權伺服器支援 PKCE
- [ ] 評估現有系統架構是否需調整
- [ ] 規劃 token 儲存策略（Cookie vs. Storage）
- [ ] 制定遷移計畫（漸進式或一次性）

### 開發階段
- [ ] 實作 code_verifier 和 code_challenge 產生邏輯
- [ ] 修改授權請求流程
- [ ] 實作 callback 處理
- [ ] 設定 HTTP-only Cookie
- [ ] 實作 refresh token 機制
- [ ] 實作 token rotation

### 安全加固
- [ ] 強制 HTTPS
- [ ] 設定正確的 CORS 政策
- [ ] 實作 rate limiting
- [ ] 加入 state 參數防止 CSRF
- [ ] 設定適當的 token 過期時間
- [ ] 實作登出機制（清除 Cookie）

### 測試階段
- [ ] 測試正常登入流程
- [ ] 測試 token 刷新機制
- [ ] 測試授權碼被攔截的情境
- [ ] 測試 CSRF 攻擊防護
- [ ] 測試 XSS 攻擊防護
- [ ] 壓力測試

### 上線階段
- [ ] 準備回滾方案
- [ ] 監控錯誤率
- [ ] 監控效能指標
- [ ] 準備用戶溝通文件

---

## 參考資源

- [RFC 7636: PKCE](https://datatracker.ietf.org/doc/html/rfc7636)
- [OAuth 2.1 Draft](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1-09)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

---

**文件版本：** 1.0  
**最後更新：** 2025-10-13