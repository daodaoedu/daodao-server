# 臨時用戶到正式用戶轉換流程詳細說明

## 流程概覽

從臨時用戶轉換為正式用戶是一個複雜的資料庫交易流程，涉及多個資料表的建立和關聯，確保資料完整性和業務邏輯的正確性。

## 1. 臨時用戶資料結構

**資料表**: `temp_users`
**位置**: `prisma/schema.prisma:908-916`

```sql
model temp_users {
  id           Int      @id @default(autoincrement())
  google_id    String   @unique @db.VarChar(255)
  email        String   @unique @db.VarChar(255)
  name         String   @db.VarChar(255)
  photo_url    String?  @db.VarChar(255)
  created_date DateTime @default(now()) @db.Timestamptz(6)
  updated_date DateTime @default(now()) @db.Timestamptz(6)
}
```

**特點**:
- 最小化資料存儲，僅包含 Google OAuth 必要資訊
- `google_id` 和 `email` 具有唯一性約束
- `photo_url` 為可選欄位

## 2. OAuth 認證階段建立臨時用戶

**服務**: `oauth.service.ts:85-124`

### 2.1 Google 認證回調處理
```typescript
// oauth.service.ts:94-96
if (!profile.emails || profile.emails.length === 0) {
  throw new Error('No email found in Google profile');
}

const email = profile.emails[0].value;
const photoUrl = profile.photos && profile.photos.length > 0 ? profile.photos[0].value : undefined;
```

### 2.2 用戶狀態檢查
```typescript
// oauth.service.ts:98-106
const userResult = await authService.findUserByEmail(email);

if (userResult) {
  console.log('用戶已註冊，返回正式用戶');
  return done(null, userResult.user as unknown as Express.User);
}
```

### 2.3 臨時用戶建立或查找
**服務**: `auth.service.ts:48-84`

```typescript
export const findOrCreateTempUser = async (profile: {
  googleId: string;
  email: string;
  name: string;
  photoUrl?: string;
}) => {
  // 先檢查是否已存在臨時用戶
  let tempUser = await prisma.temp_users.findUnique({
    where: { google_id: profile.googleId }
  });

  if (!tempUser) {
    // 檢查 email 是否已被其他臨時用戶使用
    const existingByEmail = await prisma.temp_users.findUnique({
      where: { email: profile.email }
    });

    if (existingByEmail) {
      throw new ConflictError('此電子郵件已被使用');
    }

    // 建立新的臨時用戶
    tempUser = await prisma.temp_users.create({
      data: {
        google_id: profile.googleId,
        email: profile.email,
        name: profile.name,
        photo_url: profile.photoUrl
      }
    });
  }

  return tempUser;
};
```

## 3. 臨時用戶 JWT Token

**控制器**: `auth.controller.ts:131-142`

```typescript
const payload = { 
  id: tempUser.id,     // 臨時用戶的數字 ID
  _id: '',             // 空字串，因為還沒有 external_id
  username: tempUser.name,
  isTemp: true,        // 關鍵標記：表示臨時用戶
  roles: [],           // 空陣列，臨時用戶沒有角色
  permissions: []      // 空陣列，臨時用戶沒有權限
};

const token = jwtService.generateToken(payload);
```

**臨時用戶 Token 特徵**:
- `isTemp: true` - 標記為臨時狀態
- 有限的權限和角色
- 包含臨時用戶 ID，但 `_id` 為空
- 主要用於前端識別用戶狀態

## 4. 正式用戶註冊流程 (核心轉換)

**服務**: `user.service.ts:350-505`

### 4.1 資料庫交易開始
```typescript
async createUser(userData: CreateUserRequest, tempUserId: string): Promise<{ user: FormattedUserResponse; token: string }> {
  return await prisma.$transaction(async (tx) => {
    // 所有操作都在這個交易內完成
  });
}
```

### 4.2 驗證臨時用戶存在性
**位置**: `user.service.ts:369-376`
```typescript
const tempUser = await tx.temp_users.findUnique({
  where: { id: parseInt(tempUserId) }
});

if (!tempUser) {
  throw new NotFoundError('Temporary user not found');
}
```

### 4.3 檢查用戶名稱唯一性
**位置**: `user.service.ts:378-385`
```typescript
const existingUser = await tx.users.findFirst({
  where: { nickname: tempUser.name }
});

if (existingUser) {
  throw new ConflictError(`使用者名稱 ${tempUser.name} 已存在`);
}
```

### 4.4 地區資料處理
**位置**: `user.service.ts:387-397`
```typescript
let locationId: number | null = null;
if (areaCode) {
  // 根據城市名稱查找對應的 location - 簡化處理，設為第一個 location
  const location = await tx.location.findFirst();
  
  if (!location) {
    throw new ConflictError(`'${areaCode}' 不是有效的城市名稱`);
  }
  locationId = location.id;
}
```

### 4.5 關聯資料表建立

#### 建立基本資訊記錄
**位置**: `user.service.ts:399-406`
```typescript
const basicInfo = await tx.basic_info.create({
  data: {
    self_introduction: selfIntroduction,
    share_list: Array.isArray(share) ? share.join(',') : share,
    want_to_do_list: (wantToDoList || []).map(item => item as want_to_do_list_t)
  }
});
```

#### 建立聯絡方式記錄
**位置**: `user.service.ts:408-420`
```typescript
const contact = await tx.contacts.create({
  data: {
    google_id: tempUser.google_id,        // 從臨時用戶複製
    photo_url: tempUser.photo_url,        // 從臨時用戶複製
    is_subscribe_email: isSubscribeEmail,
    email: tempUser.email,                // 從臨時用戶複製
    ig: contactList?.instagram,
    discord: contactList?.discord,
    line: contactList?.line,
    fb: contactList?.facebook
  }
});
```

### 4.6 建立正式用戶主記錄
**位置**: `user.service.ts:422-438`
```typescript
const newUser = await tx.users.create({
  data: {
    mongo_id: tempUser.id.toString(),     // 保留臨時用戶ID的連結
    nickname: tempUser.name,              // 從臨時用戶複製
    gender: gender as 'male' | 'female' | 'other' | undefined,
    education_stage: (educationStage as 'university' | 'high' | 'other') || 'other',
    tag_list: tagList || [],
    contact_id: contact.id,               // 關聯到聯絡方式記錄
    is_open_location: isOpenLocation ?? true,
    location_id: locationId,              // 關聯到地區記錄
    role_id: 2,                           // 預設角色 ID
    is_open_profile: isOpenProfile ?? true,
    birth_date: birthDate ? new Date(birthDate) : null,
    basic_info_id: basicInfo.id,          // 關聯到基本資訊記錄
  }
});
```

**重要欄位說明**:
- `external_id`: 自動產生的 UUID，作為對外的用戶識別碼
- `mongo_id`: 保存臨時用戶的 ID，作為歷史追蹤
- 各種關聯 ID 建立資料表間的關係

### 4.7 建立職位關聯
**位置**: `user.service.ts:440-454`
```typescript
if (roleList && roleList.length > 0) {
  const positions = await tx.position.findMany({
    where: { name: { in: roleList } }
  });

  if (positions.length > 0) {
    await tx.user_positions.createMany({
      data: positions.map(position => ({
        user_id: newUser.id,
        position_id: position.id
      }))
    });
  }
}
```

## 5. JWT Token 轉換

**位置**: `user.service.ts:481-486`

```typescript
const newToken = jwtService.generateToken({
  id: createdUser.id,                    // 正式用戶的內部 ID
  _id: createdUser.external_id || '',    // UUID external_id
  isTemp: false,                         // 關鍵變更：從 true 變為 false
});
```

**Token 變更比較**:
```javascript
// 臨時用戶 Token
{
  id: 123,              // temp_users.id
  _id: '',              // 空字串
  username: 'John Doe',
  isTemp: true,         // 臨時狀態
  roles: [],
  permissions: []
}

// 正式用戶 Token
{
  id: 456,              // users.id
  _id: 'uuid-string',   // users.external_id
  isTemp: false,        // 正式狀態
  // 可能包含角色和權限資訊
}
```

## 6. 電子郵件驗證流程

### 6.1 isSendEmail 參數來源

**參數特性**:
- **來源**: 完全由前端客戶端控制的請求參數
- **類型**: 可選的布林值 (`boolean | undefined`)
- **用途**: 決定是否在用戶註冊時發送驗證郵件
- **持久性**: 不儲存到資料庫，僅作為請求時的控制標誌

**型別定義**:
```typescript
// src/types/user.types.ts:38
export interface CreateUserRequest {
  // ... 其他欄位
  isSendEmail?: boolean;  // 可選的布林值
}

// src/validators/user.validators.ts:32
export const createUserSchema = z.object({
  // ... 其他欄位驗證
  isSendEmail: z.boolean().optional(),
});
```

**前端請求範例**:
```javascript
// 前端 API 呼叫
const response = await fetch('/api/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${tempUserToken}`
  },
  body: JSON.stringify({
    // ... 其他用戶資料
    isSendEmail: true,  // 客戶端決定是否發送驗證郵件
  })
});
```

### 6.2 條件性郵件發送邏輯

**位置**: `user.service.ts:488-498`

```typescript
// 雙重條件檢查
if (isSendEmail && createdUser.contacts?.email) {
  // 必須同時滿足：
  // 1. 客戶端明確要求發送郵件 (isSendEmail === true)
  // 2. 用戶有有效的電子郵件地址
  
  // 發送驗證郵件
  await emailService.sendVerificationEmail(
    createdUser.contacts.email, 
    `${process.env.BACKEND_URL}/email/verify?token=${newToken}`
  );
  
  // 刪除臨時用戶記錄
  await tx.temp_users.delete({ where: { id: tempUser.id } });
}
```

### 6.3 不同場景下的行為

**場景一：發送驗證郵件**
```json
{ "isSendEmail": true, "email": "user@example.com" }
```
結果: 發送驗證郵件 + 刪除臨時用戶記錄

**場景二：不發送驗證郵件**  
```json
{ "isSendEmail": false, "email": "user@example.com" }
```
結果: 不發送郵件 + 保留臨時用戶記錄

**場景三：未提供參數**
```json
{ "email": "user@example.com" }
```
結果: `isSendEmail` 為 `undefined` + 不發送郵件

### 6.4 驗證郵件內容
- **收件人**: 正式用戶的電子郵件
- **驗證連結**: 包含新生成的正式用戶 JWT Token
- **連結格式**: `{BACKEND_URL}/email/verify?token={newJWT}`

### 6.5 郵件驗證處理
**位置**: `auth.controller.ts:305-340`

當用戶點擊驗證連結時：
1. 解析 JWT Token
2. 確認用戶身份
3. 標記郵件為已驗證
4. 發送歡迎郵件
5. 重定向到前端頁面

## 7. 臨時用戶資料清理

**位置**: `user.service.ts:497`
```typescript
await tx.temp_users.delete({ where: { id: tempUser.id } });
```

**清理特點**:
- 在同一個資料庫交易內執行
- 僅在郵件發送成功後執行
- 確保不會有孤立的臨時用戶記錄
- 立即釋放臨時資料佔用的空間

## 8. 完整資料流程圖

```
OAuth 登入 (Google)
        ↓
   檢查是否為已註冊用戶
   ├─ 是 → 直接登入正式用戶
   └─ 否 → 建立/查找臨時用戶
        ↓
   生成臨時用戶 JWT (isTemp: true)
        ↓
   前端收集額外註冊資料
        ↓
   提交註冊請求 (tempUserId + 表單資料)
        ↓
   【資料庫交易開始】
   ├─ 驗證臨時用戶存在
   ├─ 檢查用戶名稱唯一性
   ├─ 建立 basic_info 記錄
   ├─ 建立 contacts 記錄
   ├─ 建立 users 主記錄 (含 external_id)
   ├─ 建立 user_positions 關聯
   ├─ 生成新 JWT (isTemp: false)
   ├─ 發送驗證郵件
   └─ 刪除臨時用戶記錄
   【資料庫交易結束】
        ↓
   用戶收到驗證郵件
        ↓
   點擊驗證連結
        ↓
   郵件驗證完成
        ↓
   發送歡迎郵件
        ↓
   正式用戶註冊完成
```

## 9. 資料對應關係

### 臨時用戶 → 正式用戶資料映射

```typescript
// 臨時用戶資料來源
tempUser = {
  id: 123,
  google_id: "google_oauth_id",
  email: "user@example.com",
  name: "John Doe",
  photo_url: "https://photo.url"
}

// 對應到正式用戶系統
users = {
  id: 456,                           // 新的內部 ID
  external_id: "uuid-generated",     // 新的對外 ID
  mongo_id: "123",                   // 保留臨時用戶 ID
  nickname: "John Doe",              // 來自 tempUser.name
  // ... 其他新欄位
}

contacts = {
  google_id: "google_oauth_id",      // 來自 tempUser.google_id
  email: "user@example.com",         // 來自 tempUser.email
  photo_url: "https://photo.url",    // 來自 tempUser.photo_url
  // ... 其他新欄位
}
```

## 10. 錯誤處理與回滾

### 可能的錯誤情況
1. **臨時用戶不存在**: 拋出 `NotFoundError`
2. **用戶名稱重複**: 拋出 `ConflictError`
3. **地區資料無效**: 拋出 `ConflictError`
4. **資料庫操作失敗**: 交易自動回滾

### 交易保護機制
```typescript
return await prisma.$transaction(async (tx) => {
  // 所有操作在這裡
  // 任何錯誤都會導致完整回滾
});
```

這個流程確保了資料的完整性和一致性，提供了從臨時狀態到正式狀態的順暢轉換，同時保持了良好的用戶體驗和系統安全性。