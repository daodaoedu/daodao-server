# GET /users/me API Schema 驗證錯誤分析

## 錯誤概述
在實施 API 響應驗證後，發現 `GET /users/me` 端點的響應資料與 `formattedUserResponseSchema` 定義不符，導致驗證失敗。

## 錯誤詳情

### 錯誤訊息
```
ZodError: [
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "object",
    "path": ["birthDay"],
    "message": "Expected string, received object"
  },
  {
    "code": "invalid_type", 
    "expected": "string",
    "received": "null",
    "path": ["name"],
    "message": "Expected string, received null"
  },
  {
    "code": "invalid_type",
    "expected": "string", 
    "received": "null",
    "path": ["email"],
    "message": "Expected string, received null"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "object", 
    "path": ["createdDate"],
    "message": "Expected string, received object"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "object",
    "path": ["updatedDate"], 
    "message": "Expected string, received object"
  }
]
```

## 資料庫實際格式 vs Schema 定義

### 1. Date 類型欄位不匹配

#### 資料庫返回格式（Date 物件）
```typescript
{
  birthDay: 2024-01-15T00:00:00.000Z,     // Date object
  createdDate: 2024-01-15T10:30:00.000Z,  // Date object  
  updatedDate: 2024-01-20T14:25:00.000Z   // Date object
}
```

#### Schema 期望格式（字串）
```typescript
{
  birthDay: z.string().nullable(),         // ISO string expected
  createdDate: z.string().datetime(),      // ISO string expected
  updatedDate: z.string().datetime()       // ISO string expected  
}
```

### 2. 必填欄位的 null 值處理

#### 資料庫返回格式
```typescript
{
  name: null,    // 實際可能為 null
  email: null    // 實際可能為 null
}
```

#### Schema 定義
```typescript
{
  name: z.string(),        // 不允許 null
  email: z.string().email() // 不允許 null
}
```

### 3. contactList 欄位結構不完整

#### 資料庫返回格式
```typescript
{
  contactList: {
    // 可能缺少某些子欄位
  }
}
```

#### Schema 期望格式
```typescript
{
  contactList: z.object({
    email: z.string().nullable(),
    photoURL: z.string().nullable(),
    isSubscribeEmail: z.boolean().nullable(),
    instagram: z.string().nullable(),
    discord: z.string().nullable(),
    line: z.string().nullable(),
    facebook: z.string().nullable()
  }).nullable()
}
```

## 根本原因分析

### 1. **資料類型轉換缺失**
- 資料庫（Prisma）返回的 Date 物件未轉換為 ISO 字串
- 前端期望收到字串格式的日期資料

### 2. **Schema 定義過於嚴格**
- 某些欄位在資料庫中允許 NULL，但 schema 定義為必填
- 缺少適當的 nullable() 修飾符

### 3. **資料轉換層缺失**
- 缺少在控制器層面進行資料格式轉換的邏輯
- 直接將資料庫資料傳遞給 schema 驗證

## 受影響的 API 端點

### 確認受影響
- `GET /api/users/me` - 驗證失敗
- `GET /api/users/:id` - 可能受影響（使用相同 schema）

### 可能受影響  
- `POST /api/users` - 可能在 user 物件部分受影響
- `PUT /api/users/:id` - 可能受影響（如果返回完整用戶資料）

## 修復策略

### 方案 1：修改 Schema 定義
```typescript
// 修改 formattedUserResponseSchema
{
  name: z.string().nullable(),
  email: z.string().email().nullable(), 
  birthDay: z.union([z.string().datetime(), z.date()]).nullable()
    .transform(val => val instanceof Date ? val.toISOString() : val),
  createdDate: z.union([z.string().datetime(), z.date()])
    .transform(val => val instanceof Date ? val.toISOString() : val),
  updatedDate: z.union([z.string().datetime(), z.date()])
    .transform(val => val instanceof Date ? val.toISOString() : val)
}
```

### 方案 2：資料轉換層
```typescript
// 在 service 或 controller 層加入轉換邏輯
const transformUserResponse = (user: any) => ({
  ...user,
  birthDay: user.birthDay instanceof Date ? user.birthDay.toISOString() : user.birthDay,
  createdDate: user.createdDate instanceof Date ? user.createdDate.toISOString() : user.createdDate,
  updatedDate: user.updatedDate instanceof Date ? user.updatedDate.toISOString() : user.updatedDate
});
```

### 方案 3：資料庫層面處理
```typescript
// 在 Prisma service 中處理格式轉換
const formatUserDates = (user: any) => ({
  ...user,
  birthDay: user.birthDay?.toISOString() || null,
  createdDate: user.createdDate?.toISOString(),
  updatedDate: user.updatedDate?.toISOString()
});
```

## 建議修復順序

1. **立即修復**：更新 `formattedUserResponseSchema` 支援 nullable 欄位和 Date 轉換
2. **短期**：在 service 層加入資料轉換邏輯  
3. **長期**：標準化所有 API 的資料轉換流程

## 測試驗證

修復後需要驗證：
1. `GET /users/me` 響應驗證通過
2. 前端收到正確格式的資料
3. 其他用戶相關 API 端點正常運作
4. 新用戶創建和更新流程正常

## 相關檔案

- `/src/validators/user.validators.ts` - Schema 定義
- `/src/controllers/user.controller.ts` - 響應驗證邏輯
- `/src/services/user.service.ts` - 資料查詢邏輯
- `/generated/prisma/` - Prisma 類型定義