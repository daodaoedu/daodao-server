# 用戶認證系統詳細指南
*適合初學者的完整解說*

## 目錄
1. [認證系統基本概念](#認證系統基本概念)
2. [目前系統現況詳解](#目前系統現況詳解)
3. [資料庫表格設計原理](#資料庫表格設計原理)
4. [逐步實作指南](#逐步實作指南)
5. [程式碼範例](#程式碼範例)
6. [常見問題解答](#常見問題解答)

## 認證系統基本概念

### 什麼是認證（Authentication）？
認證就是確認「你是誰」的過程，就像在現實生活中出示身分證一樣。

**日常生活類比**：
- 🏦 **銀行提款**：插入提款卡（身份識別）+ 輸入密碼（證明）
- 🏠 **回家開門**：拿出鑰匙（身份識別）+ 轉動鑰匙（證明）
- 📱 **解鎖手機**：指紋掃描（身份識別 + 證明同時進行）

### 網站認證的常見方式

#### 1. 帳號密碼登入（傳統方式）
```
使用者輸入：email + password
系統驗證：比對資料庫中的資料
結果：成功 → 給予登入權限，失敗 → 拒絕存取
```

**優點**：
- 用戶可以完全控制自己的帳號
- 不依賴第三方服務
- 可以離線驗證

**缺點**：
- 用戶需要記住密碼
- 容易忘記密碼
- 密碼可能被破解

#### 2. OAuth 登入（社群登入）
```
使用者點擊：「用 Google 登入」
系統轉向：Google 的登入頁面
Google 確認：使用者身份
Google 回傳：「這個人確實是 XXX」
系統接收：建立使用者的登入狀態
```

**優點**：
- 用戶不需要記住新密碼
- Google 的安全性很高
- 登入速度快

**缺點**：
- 依賴 Google 服務
- 用戶對帳號控制權較少
- 如果 Google 帳號被盜，網站帳號也有風險

## 目前系統現況詳解

### 現在的 DaoDao 系統是怎麼運作的？

#### 登入流程（目前只有 Google OAuth）
```
1. 用戶點擊「Google 登入」
   ↓
2. 系統把用戶導向 Google
   ↓
3. 用戶在 Google 頁面輸入帳密
   ↓
4. Google 確認身份後，把用戶導回 DaoDao
   ↓
5. Google 告訴 DaoDao：「這個用戶是真的」
   ↓
6. DaoDao 檢查：這個用戶是第一次來嗎？
   ├── 是 → 創建臨時帳號（存在 temp_users 表）
   └── 否 → 找到現有帳號（存在 users 表）
   ↓
7. 發給用戶一個 JWT Token（像是入場券）
   ↓
8. 用戶可以使用網站功能了
```

#### 目前的資料庫結構
```
temp_users 表（臨時用戶）
├── id: 1
├── google_id: "12345678"
├── email: "user@gmail.com"
├── name: "張三"
└── photo_url: "https://..."

users 表（正式用戶）
├── id: 100
├── external_id: "uuid-123-456"
├── mongo_id: "mongo_obj_id"
├── nickname: "小張"
├── role_id: 2
├── contact_id: 5
└── is_active: true

contacts 表（聯絡資訊）
├── id: 5
├── email: "user@gmail.com"
├── google_id: "12345678"
└── photo_url: "https://..."
```

### 為什麼需要改進？

#### 目前的限制
1. **只能用 Google 登入**
   - 如果用戶沒有 Google 帳號怎麼辦？
   - 如果用戶不想用 Google 帳號怎麼辦？
   - 如果 Google 服務在某些地區不穩定怎麼辦？

2. **無法獨立管理帳號**
   - 用戶無法設定自己的密碼
   - 無法重設密碼
   - 無法變更登入 email

3. **安全性功能不足**
   - 無法追蹤登入記錄
   - 無法偵測異常登入
   - 無法限制登入嘗試次數

## 資料庫表格設計原理

### 為什麼需要這些新的表格？

#### 1. users 表的新欄位解釋

```sql
-- 密碼相關欄位
password_hash VARCHAR(255)    -- 儲存加密後的密碼
salt VARCHAR(255)            -- 密碼加密的「鹽巴」
```

**什麼是密碼雜湊（Hash）？**
```
原始密碼：「mypassword123」
↓ 經過 bcrypt 加密
加密後：「$2b$10$N9qo8uLOickgx2ZMRZoMye.../」
```

**為什麼不直接儲存原始密碼？**
- ❌ 直接儲存：如果資料庫被駭，所有密碼都會洩漏
- ✅ 加密儲存：即使資料庫被駭，駭客也無法知道原始密碼

**什麼是 Salt（鹽巴）？**
```
沒有 salt：password123 → 總是產生相同的 hash
有 salt：  password123 + random_salt → 每次產生不同的 hash
```

```sql
-- 安全性相關欄位
failed_login_attempts INTEGER DEFAULT 0    -- 登入失敗次數
last_failed_login TIMESTAMP               -- 最後失敗時間
account_locked_until TIMESTAMP            -- 帳號鎖定到何時
```

**為什麼需要這些欄位？**
- 防止暴力破解：如果有人一直猜密碼，就鎖定帳號
- 保護用戶：異常登入行為會被記錄和阻止

#### 2. 密碼重設表（password_reset_tokens）

**使用情境**：用戶忘記密碼了
```
1. 用戶點擊「忘記密碼」
2. 輸入 email 
3. 系統發送重設密碼的郵件
4. 用戶點擊郵件中的連結
5. 用戶設定新密碼
```

**表格設計邏輯**：
```sql
CREATE TABLE password_reset_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,     -- 哪個用戶要重設密碼
  token VARCHAR(255) NOT NULL,  -- 重設密碼的密鑰（像是臨時鑰匙）
  expires_at TIMESTAMP,         -- 何時過期（通常 1 小時後）
  used BOOLEAN DEFAULT FALSE    -- 是否已經使用過
);
```

**為什麼需要過期時間？**
- 安全考量：萬一郵件被其他人看到，也不會永遠有效
- 防止濫用：避免大量未使用的 token 累積

#### 3. 郵件驗證表（email_verification_tokens）

**使用情境**：確認用戶真的擁有這個 email
```
1. 用戶註冊帳號時提供 email
2. 系統發送驗證郵件
3. 用戶點擊郵件中的驗證連結
4. 系統標記該 email 為已驗證
```

**為什麼需要郵件驗證？**
- 確保 email 真實存在
- 確保用戶可以收到重要通知
- 防止惡意註冊（用別人的 email 註冊帳號）

#### 4. 登入記錄表（login_attempts）

**用途**：記錄每次登入嘗試
```sql
CREATE TABLE login_attempts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,           -- 哪個用戶
  email VARCHAR(255),        -- 嘗試登入的 email
  ip_address VARCHAR(45),    -- 從哪個 IP 位址登入
  success BOOLEAN,           -- 成功或失敗
  attempted_at TIMESTAMP     -- 何時嘗試
);
```

**實際應用**：
- 管理員可以查看：「這個帳號最近從哪些地方登入？」
- 異常偵測：「怎麼這個帳號從美國和台灣同時登入？」
- 用戶自查：「我的帳號是否被盗用？」

### 表格之間的關聯關係

```
users (主要用戶表)
├── 一對多 → password_reset_tokens (一個用戶可以有多次密碼重設請求)
├── 一對多 → email_verification_tokens (一個用戶可以驗證多個 email)
├── 一對多 → login_attempts (一個用戶有多次登入記錄)
└── 一對多 → user_devices (一個用戶可以有多個裝置)
```

**為什麼是「一對多」關係？**
- 一個用戶可能忘記密碼很多次
- 一個用戶可能更換 email，需要重新驗證
- 一個用戶每天都會登入，產生很多登入記錄

## 逐步實作指南

### 第一步：了解現有程式碼

#### 目前的認證控制器（auth.controller.ts）
現在的登入和註冊函數都是這樣的：

```typescript
// 登入函數 - 目前只會回傳錯誤
export const login = asyncHandler(async (_req: Request, _res: Response) => {
  // 因為資料庫沒有密碼欄位，所以暫時不支援
  throw new UnauthorizedError('請使用 Google 登入');
});

// 註冊函數 - 目前也只會回傳錯誤
export const register = asyncHandler(async (_req: Request, _res: Response) => {
  throw new BadRequestError('註冊功能暫時不可用，請使用 Google 登入');
});
```

**問題解析**：
- 程式碼已經寫好了框架，但因為資料庫缺少必要欄位而無法運作
- 這就像蓋房子時，電線都拉好了，但沒有裝電錶，所以無法通電

#### Google OAuth 如何運作
```typescript
export const googleCallback = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user; // Google 回傳的用戶資料
  
  // 判斷是新用戶還是舊用戶
  if (external_id) {
    // 舊用戶：直接登入
    isUserExit = true;
  } else {
    // 新用戶：先存到暫存表
    isTemp = true;
  }
  
  // 產生 JWT token
  const token = jwtService.generateToken(payload);
  
  // 重定向到前端
  res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}`);
});
```

**流程說明**：
1. 用戶從 Google 登入後，Google 會把用戶資料傳給我們的系統
2. 系統檢查這個用戶是否已經存在
3. 產生一個 JWT token（像是入場券）
4. 把用戶導回前端，並帶著這個 token

### 第二步：資料庫改造計畫

#### 現在 vs 改造後的對比

**現在的 users 表**：
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  external_id UUID,
  mongo_id VARCHAR(255),
  nickname VARCHAR(255),
  role_id INTEGER,
  -- 缺少密碼相關欄位 ❌
);
```

**改造後的 users 表**：
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  external_id UUID,
  mongo_id VARCHAR(255),
  nickname VARCHAR(255),
  role_id INTEGER,
  
  -- 新增的密碼相關欄位 ✅
  password_hash VARCHAR(255),      -- 加密後的密碼
  salt VARCHAR(255),               -- 密碼鹽巴
  failed_login_attempts INTEGER,   -- 失敗次數
  account_locked_until TIMESTAMP,  -- 帳號鎖定時間
  email_verified BOOLEAN,          -- 信箱是否已驗證
  email_verified_at TIMESTAMP      -- 驗證時間
);
```

#### 新增的表格用途說明

**密碼重設表**：
```sql
CREATE TABLE password_reset_tokens (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,           -- 要重設密碼的用戶
  token VARCHAR(255),        -- 重設用的秘鑰（隨機產生）
  expires_at TIMESTAMP,      -- 1小時後過期
  used BOOLEAN DEFAULT FALSE -- 是否已經用過
);
```

**實際使用情境**：
```
用戶："我忘記密碼了"
系統：產生一個隨機 token，例如 "abc123def456"
系統：發郵件給用戶，內容是 "點此重設密碼：example.com/reset?token=abc123def456"
用戶：點擊連結
系統：檢查 token 是否存在且未過期
系統：讓用戶設定新密碼
系統：標記這個 token 為已使用
```

### 第三步：實作密碼認證功能

#### 註冊流程的實作

**步驟拆解**：
```
1. 用戶填寫註冊表單
   ├── email: user@example.com
   ├── password: mypassword123
   └── name: 張三

2. 系統驗證輸入
   ├── email 格式是否正確？
   ├── password 是否符合強度要求？
   └── email 是否已被註冊？

3. 密碼加密處理
   ├── 產生隨機 salt：例如 "random123"
   ├── 結合密碼和 salt："mypassword123" + "random123"
   └── 計算 hash：bcrypt.hash(password + salt) = "$2b$10$..."

4. 儲存到資料庫
   ├── email: user@example.com
   ├── password_hash: "$2b$10$..."
   ├── salt: "random123"
   └── email_verified: false

5. 發送驗證郵件
   ├── 產生驗證 token
   ├── 儲存 token 到 email_verification_tokens 表
   └── 發送郵件：「請點擊連結驗證您的帳號」
```

**程式碼範例**：
```typescript
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, name } = req.body;
  
  // 1. 檢查 email 是否已存在
  const existingUser = await prisma.users.findFirst({
    where: {
      contacts: {
        email: email
      }
    }
  });
  
  if (existingUser) {
    throw new ConflictError('此 email 已被註冊');
  }
  
  // 2. 加密密碼
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);
  
  // 3. 建立用戶（使用資料庫交易確保資料一致性）
  const result = await prisma.$transaction(async (tx) => {
    // 先建立聯絡資訊
    const contact = await tx.contacts.create({
      data: {
        email: email,
        is_subscribe_email: true
      }
    });
    
    // 再建立用戶
    const user = await tx.users.create({
      data: {
        mongo_id: generateMongoId(), // 為了相容性
        nickname: name,
        contact_id: contact.id,
        role_id: 2, // 預設為一般用戶
        password_hash: passwordHash,
        salt: salt,
        failed_login_attempts: 0,
        is_active: true,
        verified: false // 需要驗證 email
      }
    });
    
    return { user, contact };
  });
  
  // 4. 發送驗證郵件
  const verificationToken = generateRandomToken();
  await prisma.email_verification_tokens.create({
    data: {
      user_id: result.user.id,
      email: email,
      token: verificationToken,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24小時後過期
    }
  });
  
  await emailService.sendVerificationEmail(email, verificationToken);
  
  // 5. 回傳成功訊息
  res.json(createSuccessResponse({
    message: '註冊成功，請檢查您的信箱並點擊驗證連結'
  }));
});
```

#### 登入流程的實作

**步驟拆解**：
```
1. 用戶輸入帳密
   ├── email: user@example.com
   └── password: mypassword123

2. 查找用戶
   └── 根據 email 在資料庫中尋找對應的用戶

3. 驗證密碼
   ├── 取得資料庫中的 password_hash 和 salt
   ├── 用相同方法加密用戶輸入的密碼
   └── 比較兩個 hash 是否相同

4. 檢查帳號狀態
   ├── 帳號是否被鎖定？
   ├── email 是否已驗證？
   └── 帳號是否為啟用狀態？

5. 登入成功處理
   ├── 重設失敗登入次數為 0
   ├── 產生 JWT token
   ├── 記錄登入日誌
   └── 回傳 token 給用戶

6. 登入失敗處理
   ├── 增加失敗登入次數
   ├── 如果失敗次數 >= 5，鎖定帳號 15 分鐘
   ├── 記錄失敗日誌
   └── 回傳錯誤訊息
```

**程式碼範例**：
```typescript
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const clientIP = req.ip;
  
  try {
    // 1. 查找用戶
    const userResponse = await authService.findUserByEmail(email);
    if (!userResponse.success || !userResponse.data) {
      // 記錄失敗嘗試
      await recordFailedLogin(null, email, clientIP, 'user_not_found');
      throw new UnauthorizedError('帳號或密碼錯誤');
    }
    
    const { user, contact } = userResponse.data;
    
    // 2. 檢查帳號是否被鎖定
    if (user.account_locked_until && new Date() < user.account_locked_until) {
      throw new UnauthorizedError('帳號暫時被鎖定，請稍後再試');
    }
    
    // 3. 檢查帳號是否啟用
    if (!user.is_active) {
      throw new UnauthorizedError('帳號已被停用');
    }
    
    // 4. 驗證密碼
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      // 密碼錯誤：增加失敗次數
      const newFailureCount = (user.failed_login_attempts || 0) + 1;
      const lockUntil = newFailureCount >= 5 
        ? new Date(Date.now() + 15 * 60 * 1000) // 鎖定15分鐘
        : null;
      
      await prisma.users.update({
        where: { id: user.id },
        data: {
          failed_login_attempts: newFailureCount,
          last_failed_login: new Date(),
          account_locked_until: lockUntil
        }
      });
      
      await recordFailedLogin(user.id, email, clientIP, 'invalid_password');
      throw new UnauthorizedError('帳號或密碼錯誤');
    }
    
    // 5. 檢查 email 是否已驗證
    if (!user.verified) {
      throw new UnauthorizedError('請先驗證您的 email');
    }
    
    // 6. 登入成功：重設失敗計數
    await prisma.users.update({
      where: { id: user.id },
      data: {
        failed_login_attempts: 0,
        last_failed_login: null,
        account_locked_until: null,
        updated_at: new Date()
      }
    });
    
    // 7. 產生 JWT token
    const token = jwtService.generateToken({
      id: user.id,
      _id: user.external_id,
      email: contact.email,
      username: user.nickname,
      roles: [user.roles?.name || 'user']
    });
    
    // 8. 記錄成功登入
    await recordSuccessfulLogin(user.id, email, clientIP);
    
    // 9. 回傳結果
    res.json(createSuccessResponse({
      token,
      user: {
        id: user.id,
        email: contact.email,
        name: user.nickname,
        verified: user.verified
      }
    }));
    
  } catch (error) {
    // 記錄所有錯誤到日誌
    console.error('Login error:', error);
    throw error;
  }
});

// 輔助函數：記錄登入嘗試
async function recordFailedLogin(userId: number | null, email: string, ip: string, reason: string) {
  await prisma.login_attempts.create({
    data: {
      user_id: userId,
      email,
      ip_address: ip,
      success: false,
      failure_reason: reason,
      attempted_at: new Date()
    }
  });
}

async function recordSuccessfulLogin(userId: number, email: string, ip: string) {
  await prisma.login_attempts.create({
    data: {
      user_id: userId,
      email,
      ip_address: ip,
      success: true,
      attempted_at: new Date()
    }
  });
}
```

### 第四步：密碼重設功能

#### 忘記密碼流程

**使用者角度的流程**：
```
1. 用戶點擊「忘記密碼」
2. 輸入 email 地址
3. 收到重設密碼的郵件
4. 點擊郵件中的連結
5. 輸入新密碼
6. 完成密碼重設
```

**系統處理流程**：
```typescript
// 第1步：發送重設郵件
export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  
  // 查找用戶
  const userResponse = await authService.findUserByEmail(email);
  if (!userResponse.success || !userResponse.data) {
    // 基於安全考量，不管 email 是否存在都回傳相同訊息
    return res.json(createSuccessResponse({
      message: '如果該 email 存在於我們的系統中，您將收到重設密碼的郵件'
    }));
  }
  
  const { user } = userResponse.data;
  
  // 檢查是否在短時間內重複請求（防濫用）
  const recentToken = await prisma.password_reset_tokens.findFirst({
    where: {
      user_id: user.id,
      created_at: {
        gte: new Date(Date.now() - 5 * 60 * 1000) // 5分鐘內
      }
    }
  });
  
  if (recentToken) {
    throw new BadRequestError('請等待 5 分鐘後再重新發送');
  }
  
  // 產生重設 token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
  
  // 儲存到資料庫
  await prisma.password_reset_tokens.create({
    data: {
      user_id: user.id,
      token: resetToken,
      token_hash: tokenHash,
      expires_at: new Date(Date.now() + 60 * 60 * 1000), // 1小時後過期
      created_by_ip: req.ip
    }
  });
  
  // 發送郵件
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  await emailService.sendPasswordResetEmail(email, resetUrl);
  
  res.json(createSuccessResponse({
    message: '密碼重設郵件已發送，請檢查您的信箱'
  }));
});

// 第2步：執行密碼重設
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;
  
  // 驗證 token
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const resetToken = await prisma.password_reset_tokens.findFirst({
    where: {
      token_hash: tokenHash,
      used: false,
      expires_at: {
        gt: new Date() // 尚未過期
      }
    },
    include: {
      users: true
    }
  });
  
  if (!resetToken) {
    throw new BadRequestError('無效或已過期的重設連結');
  }
  
  // 加密新密碼
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(newPassword, salt);
  
  // 使用資料庫交易確保資料一致性
  await prisma.$transaction(async (tx) => {
    // 更新用戶密碼
    await tx.users.update({
      where: { id: resetToken.user_id },
      data: {
        password_hash: passwordHash,
        salt: salt,
        password_changed_at: new Date(),
        failed_login_attempts: 0, // 重設失敗次數
        account_locked_until: null // 解除鎖定
      }
    });
    
    // 標記 token 為已使用
    await tx.password_reset_tokens.update({
      where: { id: resetToken.id },
      data: {
        used: true,
        used_at: new Date(),
        used_by_ip: req.ip
      }
    });
  });
  
  // 發送確認郵件
  await emailService.sendPasswordResetConfirmationEmail(
    resetToken.users.contacts?.email || ''
  );
  
  res.json(createSuccessResponse({
    message: '密碼重設成功，請使用新密碼登入'
  }));
});
```

### 第五步：資料庫遷移

#### Prisma 遷移步驟

**1. 更新 schema.prisma 檔案**
```prisma
model users {
  // 現有欄位...
  
  // 新增密碼相關欄位
  password_hash           String?    @db.VarChar(255)
  salt                    String?    @db.VarChar(255)
  failed_login_attempts   Int?       @default(0)
  last_failed_login       DateTime?  @db.Timestamptz(6)
  account_locked_until    DateTime?  @db.Timestamptz(6)
  password_changed_at     DateTime?  @db.Timestamptz(6)
  
  // 多因素認證
  two_factor_enabled      Boolean?   @default(false)
  two_factor_secret       String?    @db.VarChar(255)
  two_factor_backup_codes String[]
  
  // 新增關聯
  password_reset_tokens     password_reset_tokens[]
  email_verification_tokens email_verification_tokens[]
  login_attempts           login_attempts[]
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

// 其他新增表格...
```

**2. 執行遷移指令**
```bash
# 生成遷移檔案
npx prisma migrate dev --name add-password-authentication

# 生成 Prisma client
pnpm run prisma:generate
```

**3. 遷移後的資料處理**
```sql
-- 為現有用戶設定預設值
UPDATE users 
SET failed_login_attempts = 0,
    verified = true,  -- 透過 Google OAuth 的用戶視為已驗證
    verified_at = created_at
WHERE failed_login_attempts IS NULL;
```

### 第六步：前端整合

#### API 端點規劃

**認證相關 API**：
```
POST /api/auth/register          # 註冊
POST /api/auth/login             # 登入
POST /api/auth/logout            # 登出
POST /api/auth/forgot-password   # 忘記密碼
POST /api/auth/reset-password    # 重設密碼
POST /api/auth/verify-email      # 驗證 email
GET  /api/auth/google            # Google OAuth 開始
GET  /api/auth/google/callback   # Google OAuth 回調
```

**使用範例**：
```javascript
// 註冊
const response = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'MyPassword123',
    name: '張三'
  })
});

// 登入
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'MyPassword123'
  })
});

const data = await response.json();
if (data.success) {
  // 儲存 token 到 localStorage 或 cookie
  localStorage.setItem('token', data.data.token);
}
```

## 程式碼範例

### 完整的認證服務模組

```typescript
// src/services/auth/password.service.ts
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { prisma } from '../database/prisma.service';
import { emailService } from './email.service';

export class PasswordService {
  /**
   * 密碼加密
   */
  static async hashPassword(password: string): Promise<{ hash: string; salt: string }> {
    const salt = await bcrypt.genSalt(12); // 較高的成本因子
    const hash = await bcrypt.hash(password, salt);
    return { hash, salt };
  }
  
  /**
   * 密碼驗證
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
  
  /**
   * 產生重設密碼 token
   */
  static async generateResetToken(userId: number, ip: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    await prisma.password_reset_tokens.create({
      data: {
        user_id: userId,
        token: token,
        token_hash: tokenHash,
        expires_at: new Date(Date.now() + 60 * 60 * 1000), // 1小時
        created_by_ip: ip
      }
    });
    
    return token;
  }
  
  /**
   * 驗證重設密碼 token
   */
  static async verifyResetToken(token: string): Promise<{ valid: boolean; userId?: number }> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    const resetToken = await prisma.password_reset_tokens.findFirst({
      where: {
        token_hash: tokenHash,
        used: false,
        expires_at: { gt: new Date() }
      }
    });
    
    if (!resetToken) {
      return { valid: false };
    }
    
    return { valid: true, userId: resetToken.user_id };
  }
  
  /**
   * 標記重設 token 為已使用
   */
  static async markResetTokenAsUsed(token: string, ip: string): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    await prisma.password_reset_tokens.updateMany({
      where: { token_hash: tokenHash },
      data: {
        used: true,
        used_at: new Date(),
        used_by_ip: ip
      }
    });
  }
}
```

### 帳號安全性檢查模組

```typescript
// src/services/auth/security.service.ts
export class SecurityService {
  /**
   * 檢查密碼強度
   */
  static validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('密碼長度至少需要 8 個字符');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('密碼必須包含小寫字母');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('密碼必須包含大寫字母');
    }
    
    if (!/\d/.test(password)) {
      errors.push('密碼必須包含數字');
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?]/.test(password)) {
      errors.push('建議包含特殊符號');
    }
    
    // 檢查常見密碼
    const commonPasswords = ['password', '12345678', 'qwerty', 'admin'];
    if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
      errors.push('不可使用常見密碼');
    }
    
    return { valid: errors.length === 0, errors };
  }
  
  /**
   * 檢查帳號鎖定狀態
   */
  static async checkAccountLockStatus(userId: number): Promise<{ locked: boolean; lockUntil?: Date }> {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { 
        account_locked_until: true,
        failed_login_attempts: true 
      }
    });
    
    if (!user) {
      throw new Error('用戶不存在');
    }
    
    const now = new Date();
    if (user.account_locked_until && user.account_locked_until > now) {
      return { locked: true, lockUntil: user.account_locked_until };
    }
    
    return { locked: false };
  }
  
  /**
   * 記錄登入失敗並檢查是否需要鎖定
   */
  static async handleFailedLogin(userId: number, ip: string): Promise<{ shouldLock: boolean; attemptsLeft: number }> {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { failed_login_attempts: true }
    });
    
    const currentAttempts = (user?.failed_login_attempts || 0) + 1;
    const maxAttempts = 5;
    const shouldLock = currentAttempts >= maxAttempts;
    
    await prisma.users.update({
      where: { id: userId },
      data: {
        failed_login_attempts: currentAttempts,
        last_failed_login: new Date(),
        account_locked_until: shouldLock 
          ? new Date(Date.now() + 15 * 60 * 1000) // 15分鐘
          : undefined
      }
    });
    
    // 記錄到審計日誌
    await prisma.login_attempts.create({
      data: {
        user_id: userId,
        ip_address: ip,
        success: false,
        failure_reason: 'invalid_password',
        attempted_at: new Date()
      }
    });
    
    return { 
      shouldLock, 
      attemptsLeft: Math.max(0, maxAttempts - currentAttempts) 
    };
  }
}
```

## 常見問題解答

### Q1：為什麼密碼要加密儲存？
**A**：想像一下，如果有人闖進你家偷走了你的筆記本，上面寫著所有網站的密碼，這些密碼就全部洩漏了。但如果筆記本上寫的是加密後的亂碼，小偷就算拿到了也不知道真正的密碼是什麼。

**實際例子**：
- 原始密碼：`mypassword123`
- 加密後：`$2b$10$N9qo8uLOickgx2ZMRZoMye.../`
- 即使駭客拿到加密後的字串，也很難逆推出原始密碼

### Q2：什麼是 Salt（鹽巴）？為什麼需要它？
**A**：Salt 就像是做菜時加的調味料，讓相同的食材產生不同的味道。

**問題**：如果兩個用戶都使用 `password123` 作為密碼：
- 沒有 salt：兩個用戶的加密結果會完全相同
- 有 salt：每個用戶都有不同的 salt，所以加密結果不同

**實際例子**：
```
用戶A：password123 + salt_abc → hash_xyz
用戶B：password123 + salt_def → hash_uvw
```
這樣駭客就無法透過比較 hash 來知道哪些用戶使用相同密碼。

### Q3：為什麼要限制登入嘗試次數？
**A**：這就像防盜門一樣，如果有人一直嘗試不同的鑰匙，門鎖會自動鎖死一段時間。

**防護邏輯**：
```
第1次失敗：記錄一下
第2次失敗：開始警覺
第3次失敗：提高警覺
第4次失敗：最後機會
第5次失敗：鎖定15分鐘
```

### Q4：JWT Token 是什麼？
**A**：JWT 就像是遊樂園的手環，證明你已經買票入園了。

**運作方式**：
1. 用戶登入成功後，系統給他一個 JWT token
2. 用戶之後每次請求都帶著這個 token
3. 系統檢查 token 是否有效，有效就讓用戶使用功能

**JWT 的組成**：
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9  ← Header（演算法資訊）
.
eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ  ← Payload（用戶資訊）
.
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c  ← Signature（防篡改簽名）
```

### Q5：為什麼需要郵件驗證？
**A**：確保這個 email 真的是用戶的，而不是別人亂填的。

**實際情況**：
- 用戶A註冊時填寫：`someone_else@example.com`（不是自己的）
- 系統發驗證郵件到 `someone_else@example.com`
- 真正的郵件主人收到莫名其妙的驗證郵件
- 由於沒有點擊驗證，帳號不會被激活

### Q6：密碼重設流程為什麼這麼複雜？
**A**：為了確保安全性，每一步都有其意義：

**如果簡化流程會有什麼問題？**
```
危險的簡化版本：
用戶："我忘記密碼了"
系統："好，你的新密碼是123456"
→ 任何人都可以重設別人的密碼！

安全的完整版本：
用戶："我忘記密碼了"
系統："請提供你的email"
系統："已發送重設郵件到你的信箱"
用戶：點擊郵件中的專屬連結
系統："請設定新密碼"
→ 只有能存取該 email 的人才能重設密碼
```

### Q7：為什麼要記錄登入日誌？
**A**：就像保全系統會記錄誰什麼時候進出大樓一樣。

**實際用途**：
1. **異常偵測**：如果用戶平常從台灣登入，突然從美國登入，可能帳號被盜
2. **用戶查詢**：用戶可以查看「我的帳號最近從哪裡登入？」
3. **事故調查**：如果出現安全問題，可以追溯是何時何地發生的
4. **統計分析**：了解用戶使用習慣，優化系統

### Q8：資料庫遷移會不會影響現有用戶？
**A**：不會，就像在房子裡加裝新的房間，不會影響原有房間的使用。

**遷移策略**：
1. **向下相容**：新增欄位都設為可選（nullable），不影響現有資料
2. **預設值**：為現有用戶設定合理的預設值
3. **漸進式**：可以先讓新用戶使用新功能，舊用戶慢慢遷移

**實際例子**：
```sql
-- 新增欄位時設為可選
ALTER TABLE users ADD COLUMN password_hash VARCHAR(255);

-- 為現有用戶設定預設值
UPDATE users SET failed_login_attempts = 0 WHERE failed_login_attempts IS NULL;
```

## 總結

這個認證系統的改造就像是為房子安裝更完善的門鎖系統：

1. **原本**：只有一把鑰匙（Google OAuth）
2. **改造後**：多種開門方式（Google OAuth + 帳密）
3. **安全升級**：防盜警報（登入失敗鎖定）、訪客記錄（登入日誌）
4. **便民服務**：備用鑰匙（密碼重設）、身份確認（郵件驗證）

透過這樣的設計，既保持了原有的便利性，又增加了安全性和靈活性。用戶可以選擇最適合自己的登入方式，系統也能更好地保護用戶的帳號安全。