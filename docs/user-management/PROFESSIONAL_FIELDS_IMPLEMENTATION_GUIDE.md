# Professional Fields Implementation Guide

## 概述

將 `professionalField` 從單一字串欄位改為多對多關聯表結構，參考 `interestList` 的實現模式。

## 資料庫架構

### 新增的表格

1. **professional_fields** - 專業領域主表
   - `id`: 主鍵
   - `name`: 中文名稱
   - `value`: 英文值 (用於 API)
   - `description`: 描述
   - `display_order`: 顯示順序
   - `is_active`: 是否啟用

2. **user_professional_fields** - 用戶與專業領域關聯表 (多對多)
   - `id`: 主鍵
   - `user_id`: 用戶 ID (外鍵 -> users.id)
   - `professional_field_id`: 專業領域 ID (外鍵 -> professional_fields.id)
   - `created_at`, `updated_at`: 時間戳記

### 關聯關係

```
users (1) ←→ (N) user_professional_fields (N) ←→ (1) professional_fields
```

## 執行步驟

### 1. 執行資料庫 Migration

```bash
# 執行 SQL migration (會自動遷移現有資料)
psql $DATABASE_URL -f migrations/create_professional_fields_tables.sql
```

### 2. 更新 Prisma Schema

選項 A: 自動拉取 (推薦)
```bash
pnpm prisma db pull
```

選項 B: 手動添加
參考 `migrations/prisma_schema_additions.prisma` 中的內容，將以下關聯添加到 `users` model:

```prisma
model users {
  // ... 其他欄位 ...
  user_professional_fields user_professional_fields[]
  // ... 其他關聯 ...
}
```

### 3. 生成 Prisma Client

```bash
pnpm run prisma:generate
```

### 4. 更新 User Service

在 `src/services/user.service.ts` 中整合專業領域處理：

#### 導入服務
```typescript
import professionalFieldService from './professional-field.service';
```

#### 在 createUser 函數中
參考現有的 `setUserInterests` 函數（第 55-84 行），添加類似的處理：

```typescript
// 在 transaction 中處理專業領域
if (professionalField && professionalField.length > 0) {
  await professionalFieldService.setUserProfessionalFields(
    newUser.id,
    professionalField,
    tx
  );
}
```

#### 在 updateUser 函數中
參考現有的興趣處理邏輯，添加：

```typescript
// 更新專業領域（如果有提供）
if (professionalField !== undefined) {
  await professionalFieldService.setUserProfessionalFields(
    user.id,
    professionalField || [],
    tx
  );
}
```

#### 在 formatUserResponse 函數中
參考 `getUserInterests`（第 89-105 行），添加：

```typescript
// 獲取專業領域
const professionalFields = await professionalFieldService.getUserProfessionalFields(user.id);

// 在返回對象中添加
professionalField: professionalFields,
```

### 5. 具體修改位置

#### src/services/user.service.ts

**位置 1: createUser 函數** (約在第 632-850 行)
在處理完 `interestList` 之後添加：

```typescript
// 處理興趣（新增欄位）
if (interestList && interestList.length > 0) {
  await setUserInterests(newUser.id, interestList, tx);
}

// 處理專業領域（新增）⬇️
if (professionalField && professionalField.length > 0) {
  await professionalFieldService.setUserProfessionalFields(
    newUser.id,
    professionalField,
    tx
  );
}
```

**位置 2: updateUser 函數** (約在第 873-1050 行)
在處理完 `interestList` 之後添加：

```typescript
// 更新興趣
if (interestList !== undefined) {
  await setUserInterests(userId, interestList || [], tx);
}

// 更新專業領域（新增）⬇️
if (professionalField !== undefined) {
  await professionalFieldService.setUserProfessionalFields(
    userId,
    professionalField || [],
    tx
  );
}
```

**位置 3: formatUserResponse 函數** (約在第 453-600 行)
在獲取 `interestList` 的地方添加：

```typescript
// 獲取用戶興趣
const interestList = await getUserInterests(user.id);

// 獲取專業領域（新增）⬇️
const professionalField = await professionalFieldService.getUserProfessionalFields(user.id);

// ... 在返回對象中
return {
  // ... 其他欄位 ...
  interestList,
  professionalField,  // ⬅️ 新增
  // ... 其他欄位 ...
};
```

### 6. TypeScript 類型檢查

```bash
pnpm run typecheck
```

## API 使用範例

### 創建用戶時設置專業領域

```json
POST /api/users
{
  "professionalField": [
    "information_and_communication_technologies_icts",
    "education",
    "business_administration_and_law"
  ],
  // ... 其他欄位
}
```

### 更新用戶專業領域

```json
PUT /api/users/me
{
  "professionalField": [
    "arts_and_humanities",
    "social_sciences_journalism_and_information"
  ]
}
```

### 回應格式

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "王小明",
    "professionalField": [
      "education",
      "business_administration_and_law"
    ],
    // ... 其他欄位
  },
  "timestamp": "2025-10-20T10:30:00.000Z"
}
```

## 優勢

### 與簡單陣列欄位相比

✅ **資料正規化**: 避免資料重複，易於維護
✅ **資料完整性**: 外鍵約束確保資料一致性
✅ **查詢效能**: 可以建立索引，提升查詢速度
✅ **擴展性**: 容易添加新的專業領域屬性（如描述、排序、啟用狀態）
✅ **統計分析**: 方便統計每個專業領域的用戶數量
✅ **國際化**: 可以輕鬆添加多語言支援

### 查詢範例

```sql
-- 統計每個專業領域的用戶數
SELECT
  pf.name,
  COUNT(upf.user_id) as user_count
FROM professional_fields pf
LEFT JOIN user_professional_fields upf ON upf.professional_field_id = pf.id
GROUP BY pf.id, pf.name
ORDER BY user_count DESC;

-- 查找有特定專業領域的用戶
SELECT u.*
FROM users u
INNER JOIN user_professional_fields upf ON upf.user_id = u.id
INNER JOIN professional_fields pf ON pf.id = upf.professional_field_id
WHERE pf.value = 'education';
```

## Rollback (如果需要回滾)

```sql
-- 恢復原始結構
DROP FUNCTION IF EXISTS get_user_professional_fields;
ALTER TABLE users ADD COLUMN professional_field VARCHAR(100);
DROP TABLE IF EXISTS user_professional_fields;
DROP TABLE IF EXISTS professional_fields;
```

## 測試檢查清單

- [ ] 執行 SQL migration 成功
- [ ] Prisma schema 已更新
- [ ] Prisma client 已生成
- [ ] TypeScript 類型檢查通過
- [ ] 創建用戶時可以設置專業領域
- [ ] 更新用戶時可以修改專業領域
- [ ] 獲取用戶時可以正確返回專業領域陣列
- [ ] 專業領域最多 3 個的驗證正常工作
- [ ] 現有資料已正確遷移

## 相關文件

- SQL Migration: `/migrations/create_professional_fields_tables.sql`
- Prisma Schema: `/migrations/prisma_schema_additions.prisma`
- Professional Field Service: `/src/services/professional-field.service.ts`
- User Types: `/src/types/user.types.ts`
- User Validators: `/src/validators/user.validators.ts`
