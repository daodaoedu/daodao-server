# Entity Tags 資料型別不匹配問題

## 問題描述

在資源 API (`/api/v1/resources`) 呼叫過程中發生 Prisma 驗證錯誤：

```
Invalid `prisma.entity_tags.findMany()` invocation
Argument `in`: Invalid value provided. Expected Int or ListIntFieldRefInput, provided (String, String, String, String, String).
```

## 錯誤位置

- 檔案：`src/services/resource.service.ts:358`
- 函數：`getResources()`
- 錯誤的查詢：
  ```typescript
  const allTags = await prisma.entity_tags.findMany({
    where: {
      entity_type: 'resource',
      entity_id: { in: resourceIds.map(id => String(id)) } // 這裡傳入的是 UUID 字串
    },
    include: {
      tags: true
    }
  })
  ```

## 根本原因

### 資料庫結構分析

1. **resources 表結構**：
   - `id`: integer (主鍵，自動遞增)
   - `external_id`: UUID string (對外使用的 ID)

2. **entity_tags 表結構**：
   - `entity_id`: string (VarChar(36)) - 儲存的是 external_id，不是內部 integer ID
   - `entity_type`: string
   - `tag_id`: integer

### 問題核心

程式碼錯誤地假設 `entity_tags.entity_id` 應該是 integer 型別，但實際上：
- 資料庫 schema 定義 `entity_id` 為 `String @db.VarChar(36)`
- 這個欄位儲存的是資源的 `external_id` (UUID)，不是內部的 `id`

## 影響範圍

1. **直接影響**：
   - 所有包含標籤查詢的資源列表 API 呼叫失敗
   - 回傳 500 錯誤給前端

2. **間接影響**：
   - 前端無法正常顯示資源列表
   - 使用者體驗受到影響

## 解決方案

### 方案一：修正程式碼使用正確的資料型別
```typescript
// 原本錯誤的做法
const resourceIds = resourcesData.map(resource => resource.id); // integer IDs

// 正確的做法
const resourceExternalIds = resourcesData.map(resource => resource.external_id); // UUID strings

const allTags = await prisma.entity_tags.findMany({
  where: {
    entity_type: 'resource',
    entity_id: { in: resourceExternalIds }
  },
  include: {
    tags: true
  }
});
```

### 方案二：統一資料庫設計 (長期方案)
考慮是否要統一使用 internal ID 還是 external ID 作為關聯鍵，避免混淆。

## 修復步驟

1. 修正 `src/services/resource.service.ts` 中的 `getResources()` 函數，使用 `external_id` 而非 `id`
2. 檢查其他可能有相同問題的地方
3. 更新相關的標籤分組邏輯
4. 執行測試確保修復有效

## 預防措施

1. **型別檢查**：加強 TypeScript 型別定義，避免類似的型別不匹配
2. **單元測試**：為標籤查詢功能添加單元測試
3. **程式碼審查**：在 PR 中特別注意資料庫關聯和型別匹配

## 相關檔案

- `src/services/resource.service.ts` - 主要錯誤位置
- `prisma/schema.prisma` - 資料庫結構定義
- `src/services/tag.service.ts` - 標籤相關服務

## 時間記錄

- **發現時間**：2025-07-29 06:57:50
- **問題分析**：2025-07-29 (今日)
- **狀態**：待修復