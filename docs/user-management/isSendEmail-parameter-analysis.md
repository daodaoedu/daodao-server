# isSendEmail 參數來源與流程分析

## 概覽

`isSendEmail` 是一個客戶端控制的布林值參數，用於決定在臨時用戶轉換為正式用戶時是否發送驗證郵件。

## 1. 參數定義與類型

### 1.1 TypeScript 類型定義
**檔案**: `src/types/user.types.ts:38`

```typescript
export interface CreateUserRequest {
  // ... 其他欄位
  isSendEmail?: boolean;  // 可選的布林值
}
```

### 1.2 Zod 驗證 Schema
**檔案**: `src/validators/user.validators.ts:32`

```typescript
export const createUserSchema = z.object({
  // ... 其他欄位驗證
  isSendEmail: z.boolean().optional(),  // 可選的布林值驗證
});
```

### 1.3 Swagger API 文件
**檔案**: `src/swagger/schemas/user.schemas.ts:209-211`

```yaml
isSendEmail:
  type: boolean
  description: 是否發送電子郵件 (Whether to send email)
```

## 2. 參數來源

### 2.1 前端請求來源
`isSendEmail` 參數來自前端應用程式的 HTTP POST 請求：

```javascript
// 前端 API 呼叫範例
const response = await fetch('/api/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${tempUserToken}`  // 臨時用戶 JWT
  },
  body: JSON.stringify({
    // 用戶基本資料
    gender: 'male',
    birthDate: '1990-01-01',
    educationStage: 'university',
    selfIntroduction: '自我介紹...',
    
    // 電子郵件控制參數
    isSendEmail: true,  // 客戶端決定是否發送驗證郵件
    
    // 其他欄位...
  })
});
```

### 2.2 API 路由
**檔案**: `src/routes/user.routes.ts:63-68`

```typescript
router.post('/', 
  authenticateToken,           // 需要臨時用戶 JWT 認證
  validator(createUserSchema), // 驗證包含 isSendEmail 的請求體
  userController.createUser    // 控制器處理
);
```

## 3. 參數流程追蹤

### 3.1 控制器層接收
**檔案**: `src/controllers/user.controller.ts`

控制器接收驗證後的請求，將包含 `isSendEmail` 的 `CreateUserRequest` 物件傳遞給服務層。

### 3.2 服務層處理
**檔案**: `src/services/user.service.ts:366`

```typescript
async createUser(userData: CreateUserRequest, tempUserId: string) {
  return await prisma.$transaction(async (tx) => {
    const {
      gender,
      birthDate,
      contactList,
      educationStage,
      // ... 其他欄位
      isSendEmail  // 從請求體中解構出來
    } = userData;
    
    // ... 用戶建立邏輯
    
    // 在交易的最後階段使用 isSendEmail
    if (isSendEmail && createdUser.contacts?.email) {
      // 發送驗證郵件的邏輯
    }
  });
}
```

### 3.3 業務邏輯執行
**檔案**: `src/services/user.service.ts:489-498`

```typescript
// 條件性電子郵件發送
if (isSendEmail && createdUser.contacts?.email) {
  // 發送驗證郵件
  await emailService.sendVerificationEmail(
    createdUser.contacts.email, 
    `${process.env.BACKEND_URL}/email/verify?token=${newToken}`
  );
  
  // 刪除臨時用戶記錄
  await tx.temp_users.delete({ where: { id: tempUser.id } });
}
```

## 4. 參數特性分析

### 4.1 可選性
- **非必填**: 前端可以選擇不提供此參數
- **預設行為**: 如果不提供或為 `false`，則不發送驗證郵件
- **靈活控制**: 允許前端應用根據不同情境決定是否發送郵件

### 4.2 不持久化
```typescript
// isSendEmail 僅作為請求參數，不會儲存到資料庫
// 在 prisma/schema.prisma 中的主要用戶表格都沒有此欄位

// users 表格沒有 isSendEmail 欄位
// contacts 表格沒有 isSendEmail 欄位  
// basic_info 表格沒有 isSendEmail 欄位
```

### 4.3 雙重條件檢查
```typescript
if (isSendEmail && createdUser.contacts?.email) {
  // 必須同時滿足：
  // 1. 客戶端明確要求發送郵件 (isSendEmail === true)
  // 2. 用戶有有效的電子郵件地址
}
```

## 5. 不同場景下的行為

### 5.1 場景一：發送驗證郵件
```json
{
  "isSendEmail": true,
  "email": "user@example.com"
}
```
**結果**: 
- 發送驗證郵件
- 刪除臨時用戶記錄
- 完成正式用戶註冊

### 5.2 場景二：不發送驗證郵件
```json
{
  "isSendEmail": false,
  "email": "user@example.com"
}
```
**結果**:
- 不發送驗證郵件
- 不刪除臨時用戶記錄
- 完成正式用戶註冊

### 5.3 場景三：未提供參數
```json
{
  "email": "user@example.com"
  // 沒有 isSendEmail 欄位
}
```
**結果**:
- `isSendEmail` 為 `undefined` (falsy)
- 不發送驗證郵件
- 不刪除臨時用戶記錄

### 5.4 場景四：無電子郵件地址
```json
{
  "isSendEmail": true
  // 沒有有效的 email
}
```
**結果**:
- 即使 `isSendEmail` 為 `true`，但沒有郵件地址
- 不發送驗證郵件
- 不刪除臨時用戶記錄

## 6. 歷史脈絡

### 6.1 舊版 JavaScript 實作
**檔案**: `controllers/user.js:354-355`

```javascript
const { isSendEmail } = userData;
console.log("isSendEmail", isSendEmail);
```

顯示這個參數在舊版系統中就已經存在。

### 6.2 資料庫遺留欄位
在 `prisma/schema.prisma` 中的舊表格 `old_marathons` 和 `old_marathons_v2` 中有 `is_send_email` 欄位，但主要的用戶相關表格中沒有此欄位，說明這是一個請求時的控制參數，而不是持久化的用戶屬性。

## 7. 前端整合建議

### 7.1 用戶體驗考量
```javascript
// 前端可以根據不同情況設置 isSendEmail
const registrationData = {
  // ... 其他用戶資料
  
  // 情況1: 用戶主動要求接收驗證郵件
  isSendEmail: userWantsEmail,
  
  // 情況2: 根據應用設定決定
  isSendEmail: appConfig.sendVerificationEmail,
  
  // 情況3: 根據用戶來源決定 (社交登入 vs 手動註冊)
  isSendEmail: registrationSource === 'manual'
};
```

### 7.2 錯誤處理
```javascript
// 前端應該處理郵件發送可能失敗的情況
try {
  const response = await createUser({
    ...userData,
    isSendEmail: true
  });
  
  if (response.success) {
    // 如果 isSendEmail 為 true，提醒用戶檢查郵件
    showMessage('請檢查您的電子郵件以完成驗證');
  }
} catch (error) {
  // 處理註冊錯誤
}
```

## 8. 總結

`isSendEmail` 參數的特點：

1. **來源**: 完全由前端客戶端控制的請求參數
2. **用途**: 決定是否在用戶註冊時發送驗證郵件
3. **類型**: 可選的布林值 (`boolean | undefined`)
4. **持久性**: 不儲存到資料庫，僅作為請求時的控制標誌
5. **邏輯**: 需要同時滿足 `isSendEmail === true` 和用戶有有效郵件地址
6. **影響**: 控制驗證郵件發送和臨時用戶記錄清理的時機

這個設計提供了靈活的郵件發送控制機制，允許前端應用根據不同的用戶體驗需求來決定是否發送驗證郵件。