# Comment 系統 ID 轉換層文件

## 概述
本文件完整記錄 Comment 系統從前端到後端的完整流程，包含資料格式轉換、ID 處理機制、以及 API 的輸入輸出格式。

## 完整 API 流程與資料轉換

### 1. 前端發送請求

#### 建立評論 (POST /api/v1/comments)
```javascript
// 前端請求格式
{
  "targetType": "resource",      // 目標類型
  "targetId": "uuid-string-123", // 外部 UUID (對於 circle, idea, resource)
                                 // 或數字字串 "123" (對於 post, note, outcome, review)
  "content": "這是評論內容",
  "visibility": "public",        // 選填，預設 "private"
  "parentId": 456                // 選填，回覆其他評論時使用
}
```

#### 取得評論列表 (GET /api/v1/comments)
```javascript
// Query 參數
?targetType=resource&targetId=uuid-string-123
```

### 2. 後端處理流程

#### 2.1 路由層 (src/routes/comment.routes.ts)
- 接收 HTTP 請求
- 執行身份驗證中間件
- 執行參數驗證中間件

#### 2.2 驗證層 (src/validators/comment.validators.ts)
```typescript
// Zod Schema 驗證
{
  targetType: z.enum(['post', 'resource', 'note', ...]),
  targetId: z.string().trim().min(1),  // 接受字串格式（UUID 或數字字串）
  content: z.string().min(1).max(5000),
  visibility: z.enum(['public', 'private']).default('private'),
  parentId: z.coerce.number().optional()
}
```

#### 2.3 Controller 層 (src/controllers/comment.controller.ts)
```typescript
// 接收驗證後的資料
const createParams = {
  targetType: validatedData.targetType,
  targetId: validatedData.targetId,      // 仍為字串 (UUID 或數字字串)
  content: validatedData.content,
  visibility: validatedData.visibility,
  parentId: validatedData.parentId,
  userId: req.user.id                    // 從 JWT token 取得
}
```

#### 2.4 Service 層 - ID 轉換核心 (src/services/comment.service.ts)

**關鍵轉換邏輯在 `getTargetEntity` 方法：**

```typescript
// 步驟 1: 根據 targetType 查詢並轉換為內部 ID
const targetEntity = await this.getTargetEntity(targetType, targetId, tx);
const internalTargetId = targetEntity.id;  // 取得內部整數 ID

// 步驟 2: 使用內部 ID 儲存到資料庫
const commentData = {
  target_type: targetType,
  target_id: internalTargetId,  // 儲存內部 int ID，而非外部 UUID
  content,
  visibility,
  parent_id: parentId,
  user_id: userId
};
```

**ID 轉換規則：**

| 實體類型 | 輸入格式 | 查詢方式 | 儲存格式 |
|---------|---------|---------|---------|
| post | "123" (數字字串) | `post.findUnique({ where: { id: parseInt(targetId) }})` | 123 (int) |
| note | "456" (數字字串) | `note.findUnique({ where: { id: parseInt(targetId) }})` | 456 (int) |
| outcome | "789" (數字字串) | `outcome.findUnique({ where: { id: parseInt(targetId) }})` | 789 (int) |
| review | "321" (數字字串) | `review.findUnique({ where: { id: parseInt(targetId) }})` | 321 (int) |
| circle | "uuid-abc" (UUID) | `groups.findUnique({ where: { external_id: targetId }})` | 內部 int ID |
| idea | "uuid-def" (UUID) | `ideas.findUnique({ where: { external_id: targetId }})` | 內部 int ID |
| resource | "uuid-ghi" (UUID) | `resources.findUnique({ where: { external_id: targetId }})` | 內部 int ID |

#### 2.5 資料庫層 (Prisma)
```sql
-- 實際儲存在資料庫的資料
INSERT INTO comments (
  target_type,
  target_id,    -- 永遠是 int 型別
  user_id,
  content,
  visibility,
  parent_id
) VALUES (
  'resource',
  42,           -- 內部 ID，不是 UUID
  1,
  '這是評論內容',
  'public',
  NULL
);
```

### 3. 回傳給前端

#### 3.1 資料查詢與組裝
```typescript
// Service 層查詢評論
const comments = await prisma.comments.findMany({
  where: {
    target_type: targetType,
    target_id: internalTargetId  // 使用內部 ID 查詢
  },
  include: {
    users: {
      include: {
        contacts: true,
        user_positions: { include: { position: true }}
      }
    }
  }
});
```

#### 3.2 格式化回應 (formatCommentResponse)
```typescript
// 步驟 1: 將內部 target_id 轉換回外部 ID
const externalTargetId = await this.convertToExternalId(
  comment.target_type, 
  comment.target_id  // 資料庫中的內部 int ID
);

// 步驟 2: 轉換為前端格式
{
  id: comment.id,                    // 評論 ID
  userId: comment.user_id,           // 作者 ID
  targetId: externalTargetId,        // 外部 ID (UUID 或數字字串)
  targetType: comment.target_type,   // 目標類型
  content: comment.content,          // 內容
  visibility: comment.visibility,    // 可見性
  createdAt: comment.created_at,
  updatedAt: comment.updated_at,
  parent_id: comment.parent_id,
  user: {                           // 使用者資訊
    id: user.id,
    name: user.nickname,
    _id: user.external_id,         // 使用者的外部 UUID
    roleList: ['participant'],
    photoURL: user.contacts?.photo_url
  },
  replies: []                       // 巢狀回覆（樹狀結構）
}
```

**反向轉換規則：**

| 實體類型 | 內部 ID | 查詢方式 | 回傳格式 |
|---------|---------|---------|---------|
| post | 123 (int) | 直接轉換 | "123" (字串) |
| note | 456 (int) | 直接轉換 | "456" (字串) |
| outcome | 789 (int) | 直接轉換 | "789" (字串) |
| review | 321 (int) | 直接轉換 | "321" (字串) |
| circle | 42 (int) | `groups.findUnique({ where: { id: 42 }})` → external_id | "uuid-abc" (UUID) |
| idea | 24 (int) | `ideas.findUnique({ where: { id: 24 }})` → external_id | "uuid-def" (UUID) |
| resource | 68 (int) | `resources.findUnique({ where: { id: 68 }})` → external_id | "uuid-ghi" (UUID) |

#### 3.3 最終 API 回應
```json
{
  "success": true,
  "message": "Comment created successfully",
  "data": {
    "id": 789,
    "userId": 1,
    "targetId": "uuid-string-123",        // 外部 ID (UUID 或數字字串)
    "targetType": "resource",             // 目標類型
    "content": "這是評論內容",
    "visibility": "public",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z",
    "parent_id": null,
    "user": {
      "id": 1,
      "name": "張三",
      "_id": "user-uuid-123",
      "roleList": ["participant"],
      "photoURL": "https://example.com/avatar.jpg"
    },
    "replies": []
  }
}
```

### 4. 關鍵轉換點總結

1. **輸入階段**：前端使用外部 ID（UUID 或數字字串）
2. **驗證階段**：接受字串格式，不做轉換
3. **Service 層 (儲存)**：**關鍵轉換點 1** - 將外部 ID 轉為內部 int ID
4. **儲存階段**：資料庫只儲存內部 int ID
5. **查詢階段**：使用內部 int ID 進行查詢
6. **Service 層 (回應)**：**關鍵轉換點 2** - 將內部 int ID 轉回外部 ID
7. **輸出階段**：回傳外部 ID 給前端（保持一致性）

### 6. 雙向轉換機制

#### 6.1 正向轉換 (外部 → 內部)
- **時機**：建立或查詢評論時
- **位置**：`getTargetEntity` 方法
- **目的**：確保資料庫儲存統一的 int ID

#### 6.2 反向轉換 (內部 → 外部)
- **時機**：回傳評論資料給前端時
- **位置**：`convertToExternalId` 方法
- **目的**：前端接收到的 targetId 格式與輸入時一致

#### 6.3 轉換優勢
1. **資料庫一致性**：target_id 欄位永遠是 int 型別
2. **API 一致性**：前端輸入和輸出格式相同
3. **效能優化基礎**：可以基於內部 ID 建立索引和快取
4. **向後相容性**：現有 API 格式不變

### 5. 權限檢查流程

評論的可見性規則（在 `canViewComment` 方法）：
- **public**：所有人可見
- **private**：僅以下人員可見
  - 評論作者本人
  - 目標實體的擁有者
  - 導師可見其學員的評論

## 現有資料庫結構

### Comments 資料表 (prisma/schema.prisma:46-61)
```prisma
model comments {
  id          Int       @id @default(autoincrement())
  target_id   Int       // 儲存目標實體的 ID
  target_type String    @default("post") @db.VarChar(20)
  user_id     Int
  content     String
  visibility  String?   @default("private") @db.VarChar(10)
  parent_id   Int?
  created_at  DateTime? @default(now()) @db.Timestamp(6)
  updated_at  DateTime? @default(now()) @db.Timestamp(6)
}
```

**關鍵問題**：`target_id` 定義為 `Int` 型別，但某些實體使用 UUID 字串作為主要識別碼。

## 現有實作分析

### 1. 型別定義 (src/types/comment.types.ts)

- **target_id**：在 TypeScript 介面中定義為 `string`，以支援 UUID 和數字字串
- **CommentTargetType**：支援的實體類型列舉
  - `post`、`resource`、`note`、`outcome`、`review`、`circle`、`idea`、`portfolio`

### 2. Service 層轉換邏輯 (src/services/comment.service.ts:364-483)

`getTargetEntity` 方法處理不同實體類型的 ID 轉換：

#### 使用整數 ID 的實體（直接使用）
```typescript
case 'post':
  const post = await client.post.findUnique({
    where: { id: parseInt(targetId) }
  });

case 'note':
  const note = await client.note.findUnique({
    where: { id: parseInt(targetId) }
  });

case 'outcome':
  const outcome = await client.outcome.findUnique({
    where: { id: parseInt(targetId) }
  });

case 'review':
  const review = await client.review.findUnique({
    where: { id: parseInt(targetId) }
  });
```

#### 使用外部 UUID 的實體（需要轉換）
```typescript
case 'circle':
  // 使用 external_id 查詢，回傳內部 id
  const circle = await client.groups.findUnique({
    where: { external_id: targetId },
    select: { id: true, created_by: true }
  });
  entity = { id: circle.id, user_id: circle.created_by };

case 'idea':
  // 使用 external_id 查詢，回傳內部 id
  const idea = await client.ideas.findUnique({
    where: { external_id: targetId },
    select: { id: true, user_id: true }
  });
  entity = { id: idea.id, user_id: idea.user_id };

case 'resource':
  // 透過 entity_resources 表查詢
  const resourceEntity = await client.entity_resources.findFirst({
    where: {
      entity_type: 'resource',
      entity_id: targetId  // 這裡儲存 UUID
    }
  });
  entity = { id: resourceEntity.id, user_id: resourceEntity.created_by };
```

### 3. Controller 層 (src/controllers/comment.controller.ts)

- 從 API 請求接收 `targetId` 為字串格式
- 無轉換邏輯 - 直接傳遞給 service 層
- 使用 Zod schemas 驗證輸入但不處理 ID 轉換

### 4. API 流程

```
API 請求
    ↓
Controller (接收字串 targetId)
    ↓
Service.createComment()
    ↓
Service.getTargetEntity() [轉換在此發生]
    ↓
資料庫 (在 target_id 儲存 int ID)
```

## 已識別的問題

### 1. 資料庫架構不匹配
- **問題**：`comments.target_id` 是 `Int` 型別，但需要儲存對 UUID 為基礎的實體的參照
- **影響**：無法直接儲存 UUID；必須先轉換為內部 ID

### 2. 低效的轉換邏輯
- **問題**：每次操作都進行 ID 轉換
- **影響**：每個 comment 操作都需要額外的資料庫查詢
- **位置**：所有轉換邏輯集中在 `getTargetEntity` 方法

### 3. 缺乏一致性
- **問題**：不同實體混用不同的 ID 類型
- **影響**：每種實體類型都需要複雜的條件邏輯

### 4. 無快取機制
- **問題**：相同的 UUID 到 ID 轉換重複執行多次
- **影響**：不必要的資料庫負載和延遲

### 5. 型別安全問題
- **問題**：TypeScript 對 UUID 和數字 ID 都使用 `string`
- **影響**：無法在編譯時保證 ID 格式的正確性

## 建議改進方案

### 1. 立即修復：確保正確的 ID 儲存
- **內容**：在 `comments.target_id` 中儲存內部整數 ID
- **方法**：在資料庫插入前將 UUID 轉換為內部 ID
- **位置**：在 `createComment` 方法中，建立 comment 之前

### 2. 建立專門的轉換服務
```typescript
// src/services/id-transform.service.ts
interface IdTransformService {
  toInternalId(entityType: string, externalId: string): Promise<number>
  toExternalId(entityType: string, internalId: number): Promise<string>
  bulkTransform(items: TransformRequest[]): Promise<TransformResult[]>
}
```

### 3. 實作快取層
```typescript
// 快取常用的 UUID 到 ID 映射
class IdCache {
  private cache: Map<string, number>
  async get(entityType: string, externalId: string): Promise<number | null>
  async set(entityType: string, externalId: string, internalId: number): void
}
```

### 4. 改進型別定義
```typescript
// 區分內部和外部 ID
type InternalId = number;
type ExternalId = string;

interface CommentCreateRequest {
  targetType: CommentTargetType;
  targetExternalId: ExternalId;  // 明確表示 ID 類型
  // ...
}

interface CommentDatabaseRecord {
  target_id: InternalId;  // 資料庫中永遠是內部 ID
  // ...
}
```

### 5. 遷移策略
1. **階段 1**：在 `createComment` 中新增轉換，確保所有新 comment 使用內部 ID
2. **階段 2**：遷移現有具有 UUID 參照的 comment 使用內部 ID
3. **階段 3**：新增驗證以防止 UUID 儲存在 `target_id`
4. **階段 4**：實作快取並優化轉換邏輯

## 現有的變通方案

系統目前能運作是因為：
1. `getTargetEntity` 在驗證期間將 UUID 轉換為內部 ID
2. 這個內部 ID 然後用於權限檢查
3. 然而，對於基於 UUID 的實體，實際儲存在 `comments.target_id` 中可能仍有問題

## 行動項目

1. **驗證現有資料**：檢查基於 UUID 的實體的現有 comment 是否正確儲存
2. **新增日誌**：記錄轉換操作以了解使用模式
3. **效能測試**：測量重複 ID 轉換的影響
4. **資料遷移**：規劃任何錯誤儲存的 comment 參照的遷移
5. **API 文件**：更新 API 文件以釐清何時預期 UUID 與 ID

## 相關檔案

- `/src/types/comment.types.ts` - 型別定義
- `/src/services/comment.service.ts` - 包含轉換邏輯的主要服務
- `/src/controllers/comment.controller.ts` - API 端點
- `/src/validators/comment.validators.ts` - 輸入驗證
- `/prisma/schema.prisma` - 資料庫架構