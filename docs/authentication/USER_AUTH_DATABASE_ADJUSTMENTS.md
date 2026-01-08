# 用戶認證系統資料庫調整文件

## 現況分析

### 當前認證系統狀態
目前 DaoDao 學習平台的認證系統主要依賴於 Google OAuth 2.0，系統架構如下：

1. **現有認證方式**
   - ✅ Google OAuth 認證（已實作並運行）
   - ❌ 傳統帳密登入（未實作）
   - ❌ 其他社群登入（Facebook、GitHub 等）

2. **資料庫現狀**
   - `users` 表缺少密碼相關欄位
   - `contacts` 表儲存用戶聯絡資訊（email、社群帳號等）
   - `temp_users` 表用於暫存 Google OAuth 初次登入的用戶
   - 無密碼重設、郵件驗證等相關資料表

3. **程式碼現狀**
   - `src/controllers/auth.controller.ts` 中的 `login` 和 `register` 函數目前僅返回錯誤訊息
   - 驗證器（validators）已定義但未使用
   - JWT 服務已實作並運行良好

## 啟用帳密登入所需的資料庫調整

### 1. 用戶表（users）調整

需要在 `users` 表中新增以下欄位：

```sql
-- 密碼相關欄位
ALTER TABLE users ADD COLUMN password_hash VARCHAR(255);
ALTER TABLE users ADD COLUMN salt VARCHAR(255);

-- 安全性相關欄位
ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN last_failed_login TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN account_locked_until TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN password_changed_at TIMESTAMP WITH TIME ZONE;

-- 多因素認證（可選）
ALTER TABLE users ADD COLUMN two_factor_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN two_factor_secret VARCHAR(255);
ALTER TABLE users ADD COLUMN two_factor_backup_codes TEXT[];
```

### 2. 新增密碼重設表

創建用於處理密碼重設請求的資料表：

```sql
CREATE TABLE password_reset_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by_ip VARCHAR(45),
  used_by_ip VARCHAR(45)
);

-- 建立索引以提高查詢效能
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);
```

### 3. 新增郵件驗證表

創建用於追蹤郵件驗證狀態的資料表：

```sql
CREATE TABLE email_verification_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by_ip VARCHAR(45),
  verified_by_ip VARCHAR(45)
);

-- 建立索引
CREATE INDEX idx_email_verification_tokens_token ON email_verification_tokens(token);
CREATE INDEX idx_email_verification_tokens_user_id ON email_verification_tokens(user_id);
CREATE INDEX idx_email_verification_tokens_email ON email_verification_tokens(email);
```

### 4. 新增登入記錄表（可選但建議）

用於審計和安全性監控：

```sql
CREATE TABLE login_attempts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255),
  ip_address VARCHAR(45),
  user_agent TEXT,
  success BOOLEAN NOT NULL,
  failure_reason VARCHAR(100),
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_token VARCHAR(255),
  device_fingerprint VARCHAR(255)
);

-- 建立索引
CREATE INDEX idx_login_attempts_user_id ON login_attempts(user_id);
CREATE INDEX idx_login_attempts_email ON login_attempts(email);
CREATE INDEX idx_login_attempts_ip_address ON login_attempts(ip_address);
CREATE INDEX idx_login_attempts_attempted_at ON login_attempts(attempted_at);
```

### 5. 新增裝置管理表（可選）

用於管理已認證的裝置：

```sql
CREATE TABLE user_devices (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_name VARCHAR(255),
  device_type VARCHAR(50), -- 'mobile', 'desktop', 'tablet'
  device_fingerprint VARCHAR(255) UNIQUE,
  last_used_at TIMESTAMP WITH TIME ZONE,
  last_ip_address VARCHAR(45),
  trusted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 建立索引
CREATE INDEX idx_user_devices_user_id ON user_devices(user_id);
CREATE INDEX idx_user_devices_device_fingerprint ON user_devices(device_fingerprint);
```

## Prisma Schema 更新

### 更新 prisma/schema.prisma

```prisma
// 更新 users 模型
model users {
  // ... 現有欄位 ...
  
  // 密碼相關欄位
  password_hash           String?    @db.VarChar(255)
  salt                    String?    @db.VarChar(255)
  
  // 安全性相關欄位
  failed_login_attempts   Int?       @default(0)
  last_failed_login       DateTime?  @db.Timestamptz(6)
  account_locked_until    DateTime?  @db.Timestamptz(6)
  password_changed_at     DateTime?  @db.Timestamptz(6)
  
  // 多因素認證
  two_factor_enabled      Boolean?   @default(false)
  two_factor_secret       String?    @db.VarChar(255)
  two_factor_backup_codes String[]
  
  // 關聯
  password_reset_tokens     password_reset_tokens[]
  email_verification_tokens email_verification_tokens[]
  login_attempts           login_attempts[]
  user_devices            user_devices[]
}

// 新增密碼重設令牌模型
model password_reset_tokens {
  id            Int       @id @default(autoincrement())
  user_id       Int
  token         String    @unique @db.VarChar(255)
  token_hash    String    @db.VarChar(255)
  expires_at    DateTime  @db.Timestamptz(6)
  used          Boolean   @default(false)
  used_at       DateTime? @db.Timestamptz(6)
  created_at    DateTime? @default(now()) @db.Timestamptz(6)
  created_by_ip String?   @db.VarChar(45)
  used_by_ip    String?   @db.VarChar(45)
  
  users users @relation(fields: [user_id], references: [id], onDelete: Cascade)
  
  @@index([token])
  @@index([user_id])
  @@index([expires_at])
}

// 新增郵件驗證令牌模型
model email_verification_tokens {
  id              Int       @id @default(autoincrement())
  user_id         Int
  email           String    @db.VarChar(255)
  token           String    @unique @db.VarChar(255)
  token_hash      String    @db.VarChar(255)
  expires_at      DateTime  @db.Timestamptz(6)
  verified        Boolean   @default(false)
  verified_at     DateTime? @db.Timestamptz(6)
  created_at      DateTime? @default(now()) @db.Timestamptz(6)
  created_by_ip   String?   @db.VarChar(45)
  verified_by_ip  String?   @db.VarChar(45)
  
  users users @relation(fields: [user_id], references: [id], onDelete: Cascade)
  
  @@index([token])
  @@index([user_id])
  @@index([email])
}

// 新增登入記錄模型
model login_attempts {
  id                Int       @id @default(autoincrement())
  user_id           Int?
  email             String?   @db.VarChar(255)
  ip_address        String?   @db.VarChar(45)
  user_agent        String?
  success           Boolean
  failure_reason    String?   @db.VarChar(100)
  attempted_at      DateTime? @default(now()) @db.Timestamptz(6)
  session_token     String?   @db.VarChar(255)
  device_fingerprint String?  @db.VarChar(255)
  
  users users? @relation(fields: [user_id], references: [id], onDelete: Cascade)
  
  @@index([user_id])
  @@index([email])
  @@index([ip_address])
  @@index([attempted_at])
}

// 新增裝置管理模型
model user_devices {
  id                 Int       @id @default(autoincrement())
  user_id            Int
  device_name        String?   @db.VarChar(255)
  device_type        String?   @db.VarChar(50)
  device_fingerprint String?   @unique @db.VarChar(255)
  last_used_at       DateTime? @db.Timestamptz(6)
  last_ip_address    String?   @db.VarChar(45)
  trusted            Boolean?  @default(false)
  created_at         DateTime? @default(now()) @db.Timestamptz(6)
  updated_at         DateTime? @default(now()) @db.Timestamptz(6)
  
  users users @relation(fields: [user_id], references: [id], onDelete: Cascade)
  
  @@index([user_id])
  @@index([device_fingerprint])
}
```

## 資料遷移策略

### 第一階段：資料庫結構調整
1. 備份現有資料庫
2. 執行 Prisma migration 新增欄位和資料表
3. 為現有用戶設定預設值（如 failed_login_attempts = 0）

### 第二階段：現有用戶處理
對於已經透過 Google OAuth 註冊的用戶：

```sql
-- 標記所有現有用戶為已驗證（因為他們是透過 Google OAuth 註冊的）
UPDATE users 
SET verified = true, 
    verified_at = created_at 
WHERE verified IS NULL;

-- 設定安全性欄位的預設值
UPDATE users 
SET failed_login_attempts = 0,
    two_factor_enabled = false
WHERE failed_login_attempts IS NULL;
```

### 第三階段：混合認證支援
允許用戶同時使用 Google OAuth 和帳密登入：

1. 如果用戶最初透過 Google OAuth 註冊，允許他們設定密碼
2. 如果用戶透過帳密註冊，允許他們連結 Google 帳號
3. 在 `contacts` 表中記錄所有連結的認證方式

## 實作建議

### 1. 密碼安全性要求
- 最小長度：8 個字符
- 必須包含：大小寫字母、數字
- 建議包含：特殊符號
- 使用 bcrypt 或 argon2 進行密碼雜湊
- 實施密碼歷史記錄（防止重複使用最近的密碼）

### 2. 帳戶安全性措施
- 登入失敗 5 次後鎖定帳戶 15 分鐘
- 實施 CAPTCHA 防止暴力破解
- 發送登入提醒郵件（新裝置登入時）
- 實施 IP 白名單/黑名單機制

### 3. Token 管理
- 密碼重設 token 有效期：1 小時
- 郵件驗證 token 有效期：24 小時
- JWT token 有效期：7 天（可設定）
- Refresh token 有效期：30 天

### 4. 審計和監控
- 記錄所有登入嘗試
- 監控異常登入模式
- 定期生成安全報告
- 實施即時告警機制

## 執行步驟

### 步驟 1：更新 Prisma Schema
```bash
# 更新 schema 檔案後
pnpm run prisma:generate
npx prisma migrate dev --name add-password-authentication
```

### 步驟 2：更新認證服務
1. 更新 `src/services/auth/auth.service.ts` 加入密碼驗證邏輯
2. 實作密碼重設服務
3. 實作郵件驗證服務
4. 更新登入/註冊控制器

### 步驟 3：測試
1. 單元測試：測試各個認證函數
2. 整合測試：測試完整的認證流程
3. 安全測試：測試防護機制
4. 效能測試：測試大量登入請求

### 步驟 4：部署
1. 在測試環境執行遷移
2. 驗證所有功能正常
3. 在生產環境執行遷移
4. 監控系統狀態

## 相容性考量

### 保持向後相容
1. 現有的 Google OAuth 登入不受影響
2. 現有的 JWT token 繼續有效
3. API 端點保持一致

### 漸進式遷移
1. 第一階段：新用戶可選擇帳密或 Google 註冊
2. 第二階段：現有 Google 用戶可設定密碼
3. 第三階段：完全整合的多重認證系統

## 風險評估

### 潛在風險
1. **資料遷移風險**：可能影響現有用戶資料
   - 緩解措施：完整備份、分階段執行
   
2. **安全性風險**：密碼管理不當可能造成資料外洩
   - 緩解措施：使用業界標準加密、定期安全審計
   
3. **效能風險**：新增的驗證邏輯可能影響登入速度
   - 緩解措施：優化查詢、使用快取

### 監控指標
- 登入成功率
- 平均登入時間
- 密碼重設請求數量
- 帳戶鎖定事件
- 異常登入模式

## 時程估計

| 階段 | 工作項目 | 預估時間 |
|------|---------|----------|
| 1 | 資料庫結構調整 | 2 天 |
| 2 | 後端服務實作 | 5 天 |
| 3 | 測試與修正 | 3 天 |
| 4 | 文件撰寫 | 1 天 |
| 5 | 部署與監控 | 2 天 |
| **總計** | | **13 天** |

## 結論

啟用帳密登入功能需要對資料庫結構進行重要調整，但這些調整將大幅提升系統的靈活性和用戶體驗。透過謹慎的規劃和分階段實施，可以最小化對現有系統的影響，同時確保新功能的安全性和可靠性。

建議優先實作基本的帳密登入功能，然後逐步加入進階的安全特性如多因素認證、裝置管理等。這種漸進式的方法可以讓團隊有足夠的時間測試和優化每個功能，確保系統的穩定性。