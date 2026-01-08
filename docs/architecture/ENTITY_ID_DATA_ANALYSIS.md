# EntityId 資料儲存分析報告

## 概述

本文件分析了 DaoDao 伺服器中 `entityId` 參數在不同層級的使用方式，以及實際儲存在資料庫中的資料類型。

## 資料庫 Schema 定義

### 核心表結構

```sql
-- entity_tags 表 (prisma/schema.prisma:119)
model entity_tags {
  id          Int       @id @default(autoincrement())
  entity_type String    @db.VarChar(50)
  entity_id   Int       -- 👈 所有實體 ID 都是 Int 類型
  tag_id      Int
  created_at  DateTime? @default(now()) @db.Timestamptz(6)
  updated_at  DateTime? @default(now()) @db.Timestamptz(6)
  created_by  Int?
  -- ... 其他欄位
}

-- entity_resources 表 (prisma/schema.prisma:103)  
model entity_resources {
  id          Int       @id @default(autoincrement())
  external_id String?   @unique @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  resource_id Int
  entity_type String    @db.VarChar(20)
  entity_id   Int       -- 👈 所有實體 ID 都是 Int 類型
  created_by  Int
  -- ... 其他欄位
}
```

**重要發現：資料庫中所有 `entity_id` 欄位都是 `Int` 類型**

## 實際儲存的資料類型分析

### 1. Resources (資源)

**儲存位置**: `entity_tags.entity_id`, `entity_resources.entity_id`

**儲存資料**: `resource.id` (數字主鍵)

```typescript
// src/services/resource.service.ts:104, 386
WHERE et.entity_type = 'resource'
AND et.entity_id::integer = ${resource.id}  // 儲存 resource 的數字 ID

// 範例資料
entity_id: 1, 2, 3, 123, 456...
```

### 2. Practices (實踐)

**儲存位置**: `entity_tags.entity_id`

**儲存資料**: `practice.id` (數字主鍵)

```typescript  
// src/services/practice.service.ts:650, 657
entity_id: practiceId,  // practiceId 來自 parseInt(req.params.id)

// 範例資料
entity_id: 1, 2, 3, 123, 456...
```

### 3. Ideas (想法)

**儲存位置**: `entity_tags.entity_id`, `entity_resources.entity_id`

**儲存資料**: `idea.id` (數字主鍵，非 UUID)

```typescript
// src/services/idea.service.ts:73, 84, 363, 421, 445
entity_id: idea.id  // 使用數字主鍵，不是 external_id

// 範例資料
entity_id: 1, 2, 3, 123, 456...
```

**⚠️ 重要發現**: 
- Ideas 表有兩個 ID：`id` (數字主鍵) 和 `external_id` (UUID)
- HTTP API 使用 UUID (`external_id`) 進行外部識別：`GET /ideas/123e4567-e89b-12d3-a456-426614174000`
- 但在關聯表 (`entity_tags`, `entity_resources`) 中儲存的是數字主鍵 `id`
- **資料流程**: UUID → 查詢獲得數字 ID → 儲存到關聯表

```typescript
// src/services/idea.service.ts - 實際儲存過程
// 1. API 接收 UUID: "123e4567-e89b-12d3-a456-426614174000"
// 2. 查詢 ideas 表找到對應的數字 ID
// 3. 在 entity_tags 中儲存數字 ID: entity_id: 42
```

### 4. Resource Reviews (資源評價)

**儲存位置**: `entity_tags.entity_id`

**儲存資料**: `resource_review.id` (數字主鍵)

```typescript
// src/services/resource-review.service.ts:100, 265
entity_id: review.id
entity_id: { in: reviewIds }  // reviewIds 是數字陣列

// 範例資料  
entity_id: 1, 2, 3, 123, 456...
```

## HTTP 請求層的參數處理

### Controller 層接收的參數

#### Tag Controller (標籤控制器)

```typescript
// src/controllers/tag.controller.ts

// POST /tags/entities - 新增標籤
const { entityId, entityType, tagName } = req.body;
// 接收: { entityId: "123", entityType: "resource", tagName: "學習" }

// GET /tags/entities - 查詢標籤  
const { entityId, entityType } = req.query;
// 接收: ?entityId=123&entityType=resource

// 處理方式
parseInt(entityId as string)  // 手動轉換字串為數字
```

#### Practice Controller (實踐控制器)

```typescript
// src/controllers/practice.controller.ts

// GET /practices/:id - 多個端點
const practiceId = parseInt(req.params.id);
// 接收: /practices/123
// 處理: 立即轉換為數字
```

#### Idea Controller (想法控制器) 

```typescript
// src/controllers/idea.controller.ts

// GET /ideas/:id - 獲取想法詳情
const { id } = req.params as IdeaParams;
// 接收: /ideas/123e4567-e89b-12d3-a456-426614174000
// id 是 UUID 字串，用於查詢 external_id

// 內部轉換流程：
// UUID (external_id) -> 查詢資料庫 -> 獲得數字 ID -> 存入關聯表
```

### Service 層的參數類型

所有 Service 函數都使用 `number` 類型：

```typescript
// src/services/tag.service.ts
export async function setEntityTags(
  entityType: string,
  entityId: number,  // 👈 number 類型
  tagNames: string[],
  userId: number
): Promise<void>

export async function getEntityTags(
  entityType: string,  
  entityId: number   // 👈 number 類型
): Promise<tags[]>

// src/services/practice-event.service.ts  
export async function getEventStats(
  entityId: number,  // 👈 number 類型
  entityType = 'practice'
): Promise<ApiSuccessResponse<{...}>>
```

## Validator 層的類型不一致問題

### 目前的驗證規則

#### ✅ 正確實作 (Tag Validators)

```typescript
// src/validators/tag.validators.ts:89
export const entityTagsQuerySchema = z.object({
  entityId: z.string()
    .regex(/^\d+$/, '實體 ID 必須是數字')
    .transform(Number)  // 👈 正確：字串轉數字
    .describe("實體唯一識別碼")
});
```

#### ❌ 錯誤實作 (Practice Validators)

```typescript
// src/validators/practice.validators.ts:380, 386, 392, 398  
export const eventViewSchema = z.object({
  entityType: z.literal('practice'),
  entityId: z.string().min(1, 'Entity ID cannot be empty'), // 👈 錯誤：沒有轉換
  duration: z.number().min(0).optional()
});
```

#### ❌ 錯誤實作 (Idea Validators)

```typescript
// src/validators/idea.validators.ts:228, 256, 284, 312
// 事件記錄用的 validators - 這裡使用 UUID 是正確的
export const ideaViewEventSchema = z.object({
  entityType: z.literal('idea'),
  entityId: z.string().uuid('請提供有效的想法ID'), // 👈 事件記錄用 UUID，正確
  duration: z.number().min(0).optional()
});

// src/validators/idea.validators.ts:327
// 路徑參數用的 validators - 這裡使用 UUID 也是正確的
export const ideaParamsSchema = z.object({
  id: z.string().uuid('請提供有效的想法ID') // 👈 API 路徑用 UUID，正確
});

// 但問題在於：Tag 操作的 entityId 應該如何處理 Ideas？
// 如果 Tag API 收到的是 UUID，需要轉換為數字 ID
```

### 問題分析

**重新評估後的發現：**

1. **Practice Validators**: 使用 `z.string()` 但沒有 `.transform(Number)`，導致類型不匹配 ❌
2. **Idea Validators**: 使用 `z.string().uuid()` 對於事件記錄和 API 路徑是正確的 ✅
3. **Tag Validators**: 使用 `z.string().transform(Number)` 對於數字 ID 實體是正確的 ✅

**核心問題：Tag API 如何處理不同類型的實體 ID？**
- Resources/Practices: 接收數字字串 → 轉換為數字
- Ideas: 應該接收 UUID → 轉換為數字 ID → 儲存到關聯表

**當前 Tag Controller 的問題：**
- `parseInt(entityId as string)` 對 UUID 無效
- 需要根據 `entityType` 決定如何處理 `entityId`

## 資料流轉換過程

### 兩種不同的資料流程

#### 1. 一般實體 (Resources, Practices, Resource Reviews)

**流程**: HTTP 字串 ID → Controller 轉數字 → Service → Database

```mermaid
graph LR
    A[HTTP Request<br/>entityId: "123"] --> B[Controller<br/>parseInt(entityId)]
    B --> C[Service<br/>entityId: number]
    C --> D[Database<br/>entity_id: Int 123]
```

#### 2. Ideas 實體 (特殊處理)

**流程**: HTTP UUID → Controller 接收 UUID → Service 查詢轉換 → Database 儲存數字 ID

```mermaid
graph LR
    A[HTTP Request<br/>id: "123e4567-..."] --> B[Controller<br/>UUID string]
    B --> C[Service<br/>查詢 external_id]
    C --> D[Database Query<br/>找到 id: 42]
    D --> E[關聯表儲存<br/>entity_id: 42]
```

### 實際範例

#### 範例 1: Resource 實體 (一般流程)

```typescript
// 1. HTTP 請求
POST /tags/entities
{
  "entityId": "123",        // 字串
  "entityType": "resource", 
  "tagName": "學習"
}

// 2. Controller 處理
const { entityId, entityType, tagName } = req.body;
const numericEntityId = parseInt(entityId as string);  // 轉為數字: 123

// 3. Service 呼叫  
await setEntityTags(entityType, numericEntityId, [tagName], userId);

// 4. 資料庫儲存
INSERT INTO entity_tags (entity_type, entity_id, tag_id) 
VALUES ('resource', 123, 45);  -- entity_id 儲存為數字
```

#### 範例 2: Ideas 實體 (UUID 轉換流程)

```typescript
// 1. HTTP 請求
POST /tags/entities
{
  "entityId": "123e4567-e89b-12d3-a456-426614174000",  // UUID
  "entityType": "idea",
  "tagName": "學習"
}

// 2. Controller 處理 (目前錯誤的實作)
const { entityId, entityType, tagName } = req.body;
// entityId 是 UUID，但被 parseInt() 會變成 NaN

// 3. 正確的處理應該是
const numericId = await convertExternalIdToInternalId(entityId, entityType);
// 查詢: SELECT id FROM ideas WHERE external_id = '123e4567-...'
// 結果: numericId = 42

// 4. Service 呼叫
await setEntityTags(entityType, numericId, [tagName], userId);

// 5. 資料庫儲存
INSERT INTO entity_tags (entity_type, entity_id, tag_id) 
VALUES ('idea', 42, 45);  -- 儲存的是數字 ID，不是 UUID
```

## SQL 查詢中的型別處理

### 強制型別轉換

```sql
-- src/services/resource.service.ts:104
SELECT et.*, t.name as tag_name
FROM entity_tags et
INNER JOIN tags t ON et.tag_id = t.id  
WHERE et.entity_type = 'resource'
AND et.entity_id::integer = ${resource.id}  -- 強制轉為 integer

-- src/services/resource.service.ts:386
WHERE et.entity_type = 'resource'
AND et.entity_id::integer = ANY(${resourceIds}::integer[])  -- 陣列型別轉換
```

### 查詢結果處理

```typescript
// src/services/resource.service.ts:392
allTags = rawTags.map(row => ({
  entity_id: row.entity_id,           // 原始字串值  
  resource_id: parseInt(row.entity_id), // 轉為數字使用
  tags: { /* ... */ }
}));
```

## 建議的修正方案

基於釐清的資料流程，提出以下修正建議：

### 1. 修正 Practice Validators

**問題**: Practice validators 沒有進行類型轉換

```typescript
// src/validators/practice.validators.ts:380, 386, 392, 398
// 修正前
entityId: z.string().min(1, 'Entity ID cannot be empty')

// 修正後  
entityId: z.string()
  .regex(/^\d+$/, 'Entity ID 必須是數字')
  .transform(Number)
```

### 2. 改善 Tag API 處理邏輯

**問題**: Tag API 需要處理兩種不同的 ID 格式

```typescript
// src/controllers/tag.controller.ts - 建議修正
export const addEntityTag = asyncHandler(async (req: Request, res: Response) => {
  const { entityId, entityType, tagName } = req.body;
  
  // 根據實體類型決定如何處理 entityId
  let numericEntityId: number;
  
  if (entityType === 'idea') {
    // Ideas 使用 UUID，需要轉換為數字 ID
    if (!z.string().uuid().safeParse(entityId).success) {
      throw new BadRequestError('Ideas 必須提供有效的 UUID');
    }
    numericEntityId = await convertExternalIdToInternalId(entityId, entityType);
  } else {
    // 其他實體使用數字字串
    if (!z.string().regex(/^\d+$/).safeParse(entityId).success) {
      throw new BadRequestError('Entity ID 必須是數字');
    }
    numericEntityId = parseInt(entityId);
  }
  
  await setEntityTags(entityType, numericEntityId, [tagName], userId);
});
```

### 3. 建立統一的 ID 轉換服務

利用現有的 `id-converter.service.ts`:

```typescript
// src/services/id-converter.service.ts - 已存在
export async function convertExternalIdToInternalId(
  externalId: string,
  entityType: EntityType
): Promise<number>

// 使用方式
const numericId = await convertExternalIdToInternalId(entityId, entityType);
```

### 4. 更新 Validator Schema

建立智能 Validator 根據實體類型處理：

```typescript
// 新增智能 entityId validator
export const smartEntityIdSchema = z.object({
  entityType: z.string(),
  entityId: z.string()
}).refine(async ({ entityType, entityId }) => {
  if (entityType === 'idea') {
    return z.string().uuid().safeParse(entityId).success;
  } else {
    return z.string().regex(/^\d+$/).safeParse(entityId).success;
  }
}, {
  message: "Entity ID 格式不符合實體類型要求"
});
```

## 總結

### 關鍵發現

1. **資料庫儲存**: 所有 `entity_id` 都是 `Int` 類型，儲存數字資料
2. **雙重 ID 系統**: Ideas 等實體有 `id` (數字) 和 `external_id` (UUID) 兩套 ID
3. **API 層面**: Ideas 使用 UUID 進行外部識別，但內部關聯表儲存數字 ID  
4. **轉換需求**: Tag API 需要根據實體類型處理不同格式的 ID

### 實際資料流程

**Resources/Practices**: `字串數字 ID → 轉數字 → 儲存數字`

**Ideas**: `UUID → 查詢轉換 → 取得數字 ID → 儲存數字`

### 修正優先順序

1. **高優先**: 修正 Practice Validators 的 entityId 類型轉換
2. **中優先**: 改善 Tag Controller 處理不同實體類型的邏輯
3. **低優先**: 建立統一的 ID 轉換機制

### 最終目標

- ✅ Practice Validators 正確進行類型轉換
- ✅ Tag API 支援不同實體類型的 ID 格式
- ✅ 利用現有的 ID 轉換服務統一處理
- ✅ 提高系統對混合 ID 格式的處理能力

---

*文件建立時間: 2025-01-05*  
*最後更新: 2025-01-05*