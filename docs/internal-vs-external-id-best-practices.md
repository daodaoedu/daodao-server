# Internal vs External ID 最佳實務

## 常見的 ID 管理策略

### 1. 完全分離策略 (Recommended)

**原則**：對外永遠使用 external_id，內部關聯永遠使用 internal id

```typescript
// ✅ 推薦做法
// 對外 API 層
export async function getResourceById(externalId: string) {
  // 先找到內部 ID
  const resource = await prisma.resources.findUnique({
    where: { external_id: externalId }
  });
  
  if (!resource) return null;
  
  // 內部關聯使用 internal ID
  const tags = await prisma.entity_tags.findMany({
    where: {
      entity_type: 'resource',
      entity_id: resource.id  // 使用內部 integer ID
    }
  });
}

// 資料庫設計
model entity_tags {
  entity_id   Int     // 儲存內部 ID (integer)
  entity_type String
  // ...
}
```

**優點**：
- 性能最佳 (integer 比較和索引更快)
- 安全性高 (不暴露內部結構)
- 資料庫關聯清晰

**缺點**：
- 需要額外查詢來轉換 ID
- 程式碼稍微複雜

### 2. 統一 External ID 策略 (Current)

**原則**：所有地方都使用 external_id，包括內部關聯

```typescript
// 目前的做法
model entity_tags {
  entity_id   String @db.VarChar(36)  // 儲存 external_id (UUID)
  entity_type String
  // ...
}
```

**優點**：
- 程式碼簡單一致
- 不需要 ID 轉換
- 容易理解

**缺點**：
- UUID 比較性能較差
- 佔用更多儲存空間
- 索引效率較低

### 3. 混合策略 (不推薦)

部分地方用 internal ID，部分用 external ID - **容易造成混淆**

## 業界常見做法

### GitHub 模式
```
對外：github.com/user/repo/issues/123  (sequential number)
內部：issues.id = 456789                (internal ID)
關聯：issue_comments.issue_id = 456789  (internal ID)
```

### Stripe 模式
```
對外：cus_1234567890abcdef              (prefixed UUID)
內部：customers.id = 123                (internal ID) 
關聯：subscriptions.customer_id = 123   (internal ID)
```

### UUID-First 模式 (如 Supabase)
```
對外：550e8400-e29b-41d4-a716-446655440000
內部：也使用相同的 UUID
關聯：都使用 UUID
```

## 針對你們專案的建議

### 選項 A：改為完全分離策略 (推薦)

```sql
-- 修改 entity_tags 表結構
ALTER TABLE entity_tags ALTER COLUMN entity_id TYPE INTEGER USING entity_id::INTEGER;

-- 需要資料遷移
UPDATE entity_tags 
SET entity_id = resources.id 
FROM resources 
WHERE entity_tags.entity_id = resources.external_id::VARCHAR 
AND entity_tags.entity_type = 'resource';
```

```typescript
// 程式碼模式
const resourceService = {
  async getResources() {
    const resources = await prisma.resources.findMany(/* ... */);
    const resourceInternalIds = resources.map(r => r.id);
    
    // 使用內部 ID 查詢標籤
    const tags = await prisma.entity_tags.findMany({
      where: {
        entity_type: 'resource',
        entity_id: { in: resourceInternalIds }
      }
    });
    
    // 回傳時使用 external_id
    return resources.map(r => ({
      id: r.external_id,  // 對外使用 external_id
      // ... other fields
    }));
  }
};
```

### 選項 B：保持現狀但修正程式碼 (簡單)

```typescript
// 修正目前的程式碼
const allTags = await prisma.entity_tags.findMany({
  where: {
    entity_type: 'resource',
    entity_id: { in: resources.map(r => r.external_id) }  // 使用 external_id
  }
});
```

### 選項 C：建立輔助函數統一管理

```typescript
// src/utils/id-resolver.ts
export class IdResolver {
  static async getInternalIds(entityType: string, externalIds: string[]): Promise<number[]> {
    switch (entityType) {
      case 'resource':
        const resources = await prisma.resources.findMany({
          where: { external_id: { in: externalIds } },
          select: { id: true }
        });
        return resources.map(r => r.id);
      // 其他實體類型...
    }
  }
}

// 使用
const internalIds = await IdResolver.getInternalIds('resource', externalIds);
const tags = await prisma.entity_tags.findMany({
  where: { entity_id: { in: internalIds } }
});
```

## 我的建議

基於你們目前的架構，我建議：

1. **短期**：選項 B - 修正程式碼保持一致性
2. **中期**：考慮選項 A - 改為完全分離，獲得更好的性能
3. **立即**：建立編碼規範，明確定義何時使用哪種 ID

## 編碼規範建議

```typescript
// 命名約定
interface Resource {
  id: number;           // 內部使用
  external_id: string;  // 對外 API
}

// API 層
app.get('/api/resources/:id', (req, res) => {
  const externalId = req.params.id;  // 從 URL 來的是 external_id
});

// 服務層
class ResourceService {
  async findByExternalId(externalId: string) { }  // 對外介面
  private async findByInternalId(id: number) { }  // 內部使用
}
```