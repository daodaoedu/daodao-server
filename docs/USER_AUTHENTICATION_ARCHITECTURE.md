# 用戶認證架構說明文件

## 概述

DaoDao 學習平台採用**混合認證架構**，支援 OAuth 社交登入和基於 JWT 的身份驗證。當前系統主要依賴 Google OAuth，同時保留了密碼認證的 API 接口但尚未完全實現。

## 資料庫架構

### PostgreSQL 主要表結構

#### 1. `users` 表 - 主用戶資料
```sql
-- 核心欄位
id                INTEGER PRIMARY KEY         -- 內部用戶 ID
external_id       UUID UNIQUE                 -- 外部唯一識別碼 (API 使用)
mongo_id          VARCHAR UNIQUE              -- MongoDB 關聯 ID
is_active         BOOLEAN DEFAULT true        -- 帳戶啟用狀態
verified          BOOLEAN DEFAULT false       -- 用戶驗證狀態
verified_at       TIMESTAMPTZ                 -- 驗證時間

-- 自訂 ID 系統
custom_id         VARCHAR(50) UNIQUE          -- 用戶自訂 ID
custom_id_verified BOOLEAN DEFAULT false      -- 自訂 ID 驗證狀態
custom_id_created_at TIMESTAMPTZ             -- 自訂 ID 創建時間

-- 個人資料
nickname          VARCHAR(255)                -- 顯示名稱
gender           ENUM                         -- 性別
birth_date       DATE                         -- 出生日期
education_stage  ENUM DEFAULT 'other'         -- 教育階段
tag_list         TEXT[]                       -- 標籤列表
language         VARCHAR(255)                 -- 語言設定

-- 關聯欄位
contact_id       INTEGER REFERENCES contacts(id)      -- 聯絡資訊
basic_info_id    INTEGER REFERENCES basic_info(id)    -- 基本資訊
location_id      INTEGER REFERENCES location(id)      -- 地址位置
role_id          INTEGER REFERENCES roles(id)         -- 用戶角色

-- 隱私設定
is_open_profile  BOOLEAN DEFAULT true         -- 公開個人資料
is_open_location BOOLEAN DEFAULT true         -- 公開位置資訊
```

#### 2. `contacts` 表 - 聯絡資訊與認證資料
```sql
-- 認證相關
email              VARCHAR(255)               -- 電子郵件 (登入用)
google_id          VARCHAR(255)               -- Google OAuth ID
photo_url          VARCHAR                    -- 個人照片
is_subscribe_email BOOLEAN                    -- 是否訂閱電子報

-- 社交媒體聯絡資訊
ig                 VARCHAR(255)               -- Instagram 帳號
discord            VARCHAR(255)               -- Discord 帳號  
line               VARCHAR(255)               -- LINE 帳號
fb                 VARCHAR(255)               -- Facebook 帳號
```

#### 3. `temp_users` 表 (PostgreSQL) - 臨時用戶
```sql
-- 臨時用戶資料 (Google OAuth 登入但未完成註冊)
id           INTEGER PRIMARY KEY         -- 內部 ID
google_id    VARCHAR(255) UNIQUE         -- Google OAuth ID
email        VARCHAR(255) UNIQUE         -- 電子郵件
name         VARCHAR(255)                -- 顯示名稱
photo_url    VARCHAR(255)                -- 個人照片
created_date TIMESTAMPTZ DEFAULT NOW()   -- 創建時間
updated_date TIMESTAMPTZ DEFAULT NOW()   -- 更新時間
```

### 缺失的密碼認證欄位

**目前資料庫 `contacts` 表缺少以下欄位：**
```sql
-- 需要新增的密碼認證欄位
username          VARCHAR(50) UNIQUE,         -- 登入用戶名
password_hash     VARCHAR(255),               -- 密碼雜湊值
password_salt     VARCHAR(255),               -- 密碼加鹽值
last_login_at     TIMESTAMPTZ,                -- 最後登入時間
login_attempts    INTEGER DEFAULT 0,          -- 登入嘗試次數
locked_until      TIMESTAMPTZ,                -- 帳戶鎖定到期時間
password_reset_token VARCHAR(255),            -- 密碼重設令牌
password_reset_expires TIMESTAMPTZ,           -- 重設令牌到期時間
email_verified    BOOLEAN DEFAULT false,      -- 電子郵件驗證狀態
email_verify_token VARCHAR(255),              -- 郵件驗證令牌
```

## 認證流程

### 1. Google OAuth 登入流程

```mermaid
sequenceDiagram
    participant U as 用戶
    participant F as 前端
    participant S as 後端
    participant G as Google OAuth
    participant TP as PostgreSQL (temp_users)
    participant P as PostgreSQL

    U->>F: 點擊 Google 登入
    F->>S: 重導到 /api/auth/google
    S->>G: 請求 OAuth 認證
    G->>U: 顯示 Google 登入頁面
    U->>G: 授權應用程式
    G->>S: 回調帶有用戶資料
    
    S->>P: 查找 contacts 表中的 email
    alt 已註冊用戶
        P->>S: 返回用戶資料
        S->>F: 生成 JWT，重導到前端
    else 未註冊用戶
        S->>TP: 查找或創建 temp_users 表資料
        TP->>S: 返回臨時用戶資料
        S->>F: 生成臨時 JWT，重導到註冊頁面
    end
```

### 2. 密碼登入流程 (未實現)

```mermaid
sequenceDiagram
    participant U as 用戶
    participant F as 前端
    participant S as 後端
    participant P as PostgreSQL

    U->>F: 輸入帳號密碼
    F->>S: POST /api/auth/login
    Note over S: 目前回傳錯誤：請使用 Google 登入
    
    Note over S,P: 未來實現流程：
    Note over S: 1. 驗證 email/username + password
    Note over S: 2. 檢查帳戶狀態 (is_active, verified)
    Note over S: 3. 更新登入時間和嘗試次數
    Note over S: 4. 生成 JWT token
    S-->>F: 返回 JWT 和用戶資料
```

## JWT Token 結構

### UserJwtPayload 介面
```typescript
interface UserJwtPayload {
  // 基本識別資訊
  id: number;                    // 用戶內部 ID
  externalId: string;            // external_id (UUID)
  mongoId?: string;              // mongo_id (MongoDB 關聯)
  
  // 用戶資訊
  nickname?: string;             // 顯示名稱
  email?: string;                // 電子郵件
  
  // 權限資訊
  roles: string[];               // 角色列表
  permissions: string[];         // 權限列表
  
  // 狀態標記
  isTemp: boolean;               // 是否為臨時用戶
  is_active: boolean;            // 帳戶是否啟用
  verified: boolean;             // 是否已驗證
  email_verified?: boolean;      // 電子郵件是否已驗證
  
  // Token 元資料
  iat: number;                   // 發行時間
  exp: number;                   // 到期時間
}
```

## 認證中介軟體

### 1. 基本認證中介軟體

| 中介軟體 | 功能 | 用途 |
|---------|------|-----|
| `authenticateJWT` | 驗證 JWT Token | 必須登入的端點 |
| `optionalAuth` | 可選驗證 | 支援匿名和登入用戶的端點 |
| `authenticateSession` | Session 認證 | Passport Session 驗證 |
| `authenticateAny` | 混合認證 | 支援 JWT 或 Session |

### 2. 授權中介軟體

| 中介軟體 | 功能 | 檢查項目 |
|---------|------|---------|
| `requireRole` | 角色驗證 | 檢查用戶角色 |
| `requirePermissions` | 權限驗證 | 檢查具體操作權限 |
| `requireFormalUser` | 正式用戶檢查 | 禁止臨時用戶 |
| `requireEmailVerified` | 郵件驗證檢查 | 需要驗證郵件的用戶 |
| `requireActiveUser` | 活躍用戶檢查 | 檢查帳戶是否啟用 |
| `requireCompleteProfile` | 完整資料檢查 | 需要完成註冊流程 |

### 3. 進階認證選項

```typescript
interface AuthMiddlewareOptions {
  required?: boolean;        // 是否必須認證 (預設: true)
  allowTemp?: boolean;       // 是否允許臨時用戶 (預設: true)
  permissions?: PermissionOptions[];  // 需要的權限
  roles?: string[];          // 需要的角色
}

// 使用範例
app.get('/api/protected', 
  authenticateWithOptions({
    required: true,
    allowTemp: false,
    roles: ['admin', 'moderator'],
    permissions: [
      { resource: 'users', action: 'read' }
    ]
  }), 
  controller
);
```

## API 路由結構

### 認證端點

| 端點 | 方法 | 狀態 | 說明 |
|-----|------|------|------|
| `/api/auth/login` | POST | ❌ 未實現 | 密碼登入 |
| `/api/auth/register` | POST | ❌ 未實現 | 用戶註冊 |
| `/api/auth/google` | GET | ✅ 已實現 | Google OAuth 登入 |
| `/api/auth/google/callback` | GET | ✅ 已實現 | Google OAuth 回調 |
| `/api/auth/logout` | POST | ⚠️ 部分實現 | 用戶登出 |
| `/api/auth/forgot-password` | POST | ❌ 未實現 | 忘記密碼 |
| `/api/auth/reset-password` | POST | ❌ 未實現 | 重設密碼 |
| `/api/auth/verify-email` | POST | ❌ 未實現 | 郵件驗證 |
| `/api/auth/change-password` | POST | ❌ 未實現 | 更改密碼 |

### 用戶管理端點

| 端點 | 方法 | 狀態 | 說明 |
|-----|------|------|------|
| `/api/users/me` | GET | ✅ 已實現 | 獲取當前用戶資料 |
| `/api/users/me` | PUT | ✅ 已實現 | 更新當前用戶資料 |
| `/api/users/me` | DELETE | ✅ 已實現 | 刪除當前用戶 |
| `/api/users/:id` | GET | ✅ 已實現 | 獲取指定用戶資料 |

## 用戶狀態與類型

### 1. 用戶狀態

| 狀態 | 欄位 | 說明 |
|------|------|------|
| 啟用 | `is_active = true` | 帳戶正常可用 |
| 停用 | `is_active = false` | 帳戶被停用 |
| 已驗證 | `verified = true` | 用戶身份已驗證 |
| 未驗證 | `verified = false` | 用戶身份未驗證 |
| 郵件已驗證 | `email_verified = true` | 電子郵件已驗證 |
| 郵件未驗證 | `email_verified = false` | 電子郵件未驗證 |

### 2. 用戶類型

| 類型 | 判斷條件 | JWT 標記 | 說明 |
|------|----------|----------|------|
| 正式用戶 | 存在於 PostgreSQL `users` 表 | `isTemp: false` | 已完成註冊流程的用戶 |
| 臨時用戶 | 僅存在於 PostgreSQL `temp_users` 表 | `isTemp: true` | 透過 OAuth 登入但未完成註冊 |

## 驗證器 (Zod Schemas)

### 已實現的驗證器

```typescript
// 登入驗證
loginValidator: {
  email: string (email format, max 254)
  password: string (min 1)
  rememberMe?: boolean (default false)
}

// 註冊驗證
registerValidator: {
  username: string (3-50 chars, alphanumeric + _ -)
  email: string (email format, max 254)
  password: string (8-128 chars, require lowercase + uppercase + digit)
  confirmPassword: string (must match password)
  name?: string (max 100 chars)
}

// 密碼相關
forgotPasswordValidator: { email: string }
resetPasswordValidator: { token: string, newPassword: string, confirmPassword: string }
changePasswordValidator: { currentPassword: string, newPassword: string, confirmPassword: string }

// 郵件驗證
verifyEmailValidator: { token: string, email: string }

// 個人資料更新
updateProfileValidator: {
  name?: string,
  username?: string,
  photo_url?: string,
  bio?: string
}
```

## 權限系統

### 1. 角色系統

```sql
-- roles 表
CREATE TABLE roles (
  id INTEGER PRIMARY KEY,
  name VARCHAR(255) UNIQUE,    -- 角色名稱 (admin, moderator, user)
  description TEXT
);

-- 用戶角色關聯
users.role_id -> roles.id
```

### 2. 權限系統

```sql
-- permissions 表
CREATE TABLE permissions (
  id INTEGER PRIMARY KEY,
  name VARCHAR(255) UNIQUE,    -- 權限名稱 (users:read, posts:write)
  description TEXT
);

-- 角色權限關聯
CREATE TABLE role_permissions (
  role_id INTEGER REFERENCES roles(id),
  permission_id INTEGER REFERENCES permissions(id)
);

-- 用戶個別權限
CREATE TABLE user_permissions (
  user_id INTEGER REFERENCES users(id),
  permission_id INTEGER REFERENCES permissions(id)
);
```

### 3. 權限檢查格式

```typescript
// 權限格式：resource:action
permissions: [
  "users:read",      // 讀取用戶資料
  "users:write",     // 修改用戶資料
  "posts:create",    // 創建貼文
  "posts:delete",    // 刪除貼文
  "admin:access"     // 管理員面板存取
]
```

## 環境變數配置

### 必要的認證相關環境變數

```bash
# JWT 設定
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# 資料庫連線
DATABASE_URL=postgresql://user:pass@localhost:5432/daodao
MONGO_URL=mongodb://localhost:27017/daodao

# 郵件服務 (未來實現密碼重設時使用)
EMAIL_SERVICE=gmail
EMAIL_USERNAME=redacted@example.com
EMAIL_PASSWORD=your-app-password

# 前端 URL (OAuth 重導用)
FRONTEND_URL=http://localhost:3000
```

## 安全性考量

### 1. JWT 安全
- ✅ 使用環境變數儲存 JWT secret
- ✅ Token 有效期限制 (預設 7 天)
- ✅ 支援 Token 過期檢測
- ⚠️ 缺少 Token 刷新機制
- ⚠️ 缺少 Token 撤銷功能

### 2. 密碼安全 (未來實現)
- ❌ 需要實現密碼雜湊 (bcrypt)
- ❌ 需要實現密碼強度檢查
- ❌ 需要實現帳戶鎖定機制
- ❌ 需要實現密碼重設流程

### 3. OAuth 安全
- ✅ 使用官方 Google OAuth 策略
- ✅ 驗證回調 URL
- ✅ 檢查用戶 profile 資料
- ✅ 支援臨時用戶機制

### 4. API 安全
- ✅ CORS 設定
- ✅ Rate limiting
- ✅ 輸入驗證 (Zod)
- ✅ 錯誤處理中介軟體
- ✅ 統一 API 回應格式

## 未來改進建議

### 1. 密碼認證實現
```sql
-- 1. 更新 contacts 表結構
ALTER TABLE contacts ADD COLUMN username VARCHAR(50) UNIQUE;
ALTER TABLE contacts ADD COLUMN password_hash VARCHAR(255);
ALTER TABLE contacts ADD COLUMN password_salt VARCHAR(255);
ALTER TABLE contacts ADD COLUMN last_login_at TIMESTAMPTZ;
ALTER TABLE contacts ADD COLUMN login_attempts INTEGER DEFAULT 0;
ALTER TABLE contacts ADD COLUMN locked_until TIMESTAMPTZ;

-- 2. 郵件驗證相關
ALTER TABLE contacts ADD COLUMN email_verified BOOLEAN DEFAULT false;
ALTER TABLE contacts ADD COLUMN email_verify_token VARCHAR(255);
ALTER TABLE contacts ADD COLUMN email_verify_expires TIMESTAMPTZ;

-- 3. 密碼重設相關
ALTER TABLE contacts ADD COLUMN password_reset_token VARCHAR(255);
ALTER TABLE contacts ADD COLUMN password_reset_expires TIMESTAMPTZ;
```

### 2. 安全性增強
- 實現 JWT refresh token
- 添加 2FA (兩步驟認證)
- 實現設備管理和信任設備
- 添加登入歷史記錄
- 實現異常登入檢測

### 3. 社交登入擴展
- Facebook 登入
- LINE 登入
- Apple ID 登入
- GitHub 登入 (開發者)

### 4. 企業功能
- SSO (Single Sign-On) 整合
- LDAP/Active Directory 支援
- 企業域名限制
- 批量用戶管理

## 故障排除

### 常見問題

1. **"請使用 Google 登入" 錯誤**
   - 原因：密碼認證尚未實現
   - 解決：暫時只能使用 Google OAuth 登入

2. **JWT Token 驗證失敗**
   - 檢查 `JWT_SECRET` 環境變數
   - 檢查 Token 格式：`Bearer <token>`
   - 檢查 Token 是否過期

3. **Google OAuth 失敗**
   - 檢查 Google OAuth 設定
   - 檢查回調 URL 是否正確
   - 檢查 Google Console 設定

4. **權限檢查失敗**
   - 檢查用戶角色設定
   - 檢查權限配置
   - 檢查中介軟體順序

### Debug 模式
```javascript
// 開啟認證 debug
process.env.DEBUG = "passport:*";

// 檢查 JWT payload
console.log('JWT Payload:', req.user);

// 檢查用戶狀態
console.log('Is Temporary:', req.isTemporary);
```

---

*本文件最後更新時間：2024-12-09*
*對應代碼版本：當前 feat/swagger-refactor 分支*