# 留言 API ID 轉換分析

## 概述

本文檔分析留言 API 目前如何處理前端與後端之間的 ID 轉換，並提供維持現有程式碼模式一致性的指導方針。

## 現有實作分析

### 1. 輸入 ID 處理（前端 → 後端）

留言 API 目前透過 Zod 驗證 schema 處理輸入的 ID：

#### 驗證模式
- **留言 ID（URL 參數）**：使用 `z.coerce.number()` 自動將字串轉換為數字
- **父留言 ID（請求主體）**：使用 `z.coerce.number()` 自動將字串轉換為數字  
- **目標 ID**：在整個系統中保持為字串類型

```typescript
// 來自 src/validators/comment.validators.ts
export const commentParamsSchema = z.object({
  commentId: z.coerce.number({
    invalid_type_error: 'Comment ID must be a number'
  }).int('Comment ID must be an integer').positive('Comment ID must be positive')
});

export const createCommentSchema = z.object({
  parentId: z.coerce.number({
    invalid_type_error: 'Parent ID must be a number'
  }).int('Parent ID must be an integer').positive('Parent ID must be positive').optional()
});
```

#### 目標 ID 處理
目標 ID 刻意保持為字串，因為它們引用不同的實體類型，具有不同的 ID 格式：
- **數字 ID**：`post`、`note`、`outcome`、`review`（使用 `parseInt()` 轉換）
- **字串 ID**：`circle`、`idea`、`resource`（直接使用字串）

```typescript
// 來自 src/services/comment.service.ts - 目標實體解析
switch (targetType) {
  case 'post': {
    const post = await client.post.findUnique({
      where: { id: parseInt(targetId) },  // 字串 → 數字
      select: { id: true, user_id: true }
    });
    break;
  }
  case 'circle': {
    const circle = await client.groups.findUnique({
      where: { external_id: targetId },   // 字串保持字串
      select: { id: true, created_by: true }
    });
    break;
  }
}
```

### 2. 輸出 ID 處理（後端 → 前端）

留言 API 透過 `formatCommentResponse` 方法以資料庫原生格式返回 ID：

```typescript
// 來自 src/services/comment.service.ts
private formatCommentResponse(comment: DatabaseComment): CommentResponse {
  const user: CommentUser = {
    id: comment.users.id,              // 數字（資料庫原生）
    name: comment.users.nickname || '',
    _id: comment.users.external_id || '', // 字串（外部引用）
    roleList: comment.users.user_positions?.map((up) => up.position.name) || [],
    photoURL: comment.users.contacts?.photo_url || null
  };

  return {
    id: comment.id,           // 數字（資料庫原生）
    userId: comment.user_id,  // 數字（資料庫原生）
    content: comment.content,
    visibility: comment.visibility as CommentVisibility,
    createdAt: comment.created_at || new Date(),
    updatedAt: comment.updated_at || new Date(),
    parent_id: comment.parent_id, // 數字 | null（資料庫原生）
    user,
    replies: []
  };
}
```

## ID 類型一致性模式

### 資料庫 ID 類型
- **comment.id**：`number`（自動遞增主鍵）
- **comment.user_id**：`number`（使用者表外鍵）
- **comment.parent_id**：`number | null`（自我引用外鍵）
- **comment.target_id**：`string`（不同實體引用的彈性類型）

### API 回應類型
- **id**：`number` - 從資料庫直接返回
- **userId**：`number` - 從資料庫直接返回  
- **parent_id**：`number | null` - 從資料庫直接返回
- **user.id**：`number` - 使用者的資料庫 ID
- **user._id**：`string` - 使用者的外部 ID，供前端引用

## 轉換策略

### 目前方法（無字串轉換）
留言 API 目前在回應中保持資料庫原生的數字類型，這與後端優先的方法一致，但可能需要前端處理以供顯示用途。

### 如果需要字串轉換

如果您需要將數字 ID 轉換為字串以便前端相容，請在 `formatCommentResponse` 方法中實作轉換：

```typescript
private formatCommentResponse(comment: DatabaseComment): CommentResponse {
  const user: CommentUser = {
    id: comment.users.id.toString(),      // 轉換為字串
    name: comment.users.nickname || '',
    _id: comment.users.external_id || '',
    roleList: comment.users.user_positions?.map((up) => up.position.name) || [],
    photoURL: comment.users.contacts?.photo_url || null
  };

  return {
    id: comment.id.toString(),                    // 轉換為字串
    userId: comment.user_id.toString(),           // 轉換為字串  
    content: comment.content,
    visibility: comment.visibility as CommentVisibility,
    createdAt: comment.created_at || new Date(),
    updatedAt: comment.updated_at || new Date(),
    parent_id: comment.parent_id?.toString() || null, // 非 null 時轉換為字串
    user,
    replies: []
  };
}
```

### 輸入驗證更新

如果實作字串 ID，請更新回應類型但保持驗證強制轉換以維持向後相容性：

```typescript
// 保持現有的驗證，接受字串但轉換為數字供資料庫使用
export const commentParamsSchema = z.object({
  commentId: z.coerce.number() // 仍接受字串輸入，轉換為數字供資料庫使用
});

// TypeScript 類型需要更新
export interface CommentResponse {
  id: string;           // 從 number 改為 string
  userId: string;       // 從 number 改為 string
  parent_id: string | null; // 從 number | null 改為 string | null
  // ... 其他欄位
}
```

## 建議

### 1. 遵循現有模式
查看程式碼庫中其他服務如何處理 ID 轉換：
- **idea.service.ts**：在回應中將 `id` 轉換為字串（`id: idea.users.id.toString()`）
- **practice services**：使用 `.toString()` 和 `toISOString()` 進行各種轉換

### 2. 維持類型安全
- 如果更改 ID 類型，請更新 `src/types/comment.types.ts` 中的 TypeScript 介面
- 確保 `src/validators/comment.validators.ts` 中的 Zod schema 正確處理轉換
- 如果存在，請更新 `src/swagger/schemas/` 中的 Swagger schema

### 3. 資料庫一致性
- 為了效能，保持資料庫操作使用數字類型
- 僅在回應格式化層轉換為字串
- 維持現有的 `z.coerce.number()` 驗證以處理輸入

### 4. 測試考量
- 測試字串和數字輸入處理
- 如果實作字串 ID，驗證樹狀建構邏輯仍然正常運作
- 檢查父子關係解析

## 結論

留言 API 目前使用混合方法：
- **輸入**：接受字串但透過 Zod 強制轉換為數字
- **資料庫**：為了效能使用原生數字類型
- **輸出**：返回資料庫原生數字類型

這種方法與資料庫優先架構一致，但可能需要前端適應。如果需要字串轉換，僅在回應格式化層實作，同時維持資料庫效率。