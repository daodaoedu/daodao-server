# ID 分離策略遷移計劃

## 遷移目標

將 `entity_tags` 表從使用 external_id (UUID) 改為使用 internal_id (integer)，實現完全分離策略。

## 影響範圍分析

### 受影響的表
- `entity_tags` - 主要修改目標
- 其他可能使用類似模式的關聯表

### 受影響的程式碼
- `src/services/resource.service.ts` - 主要修改
- `src/services/tag.service.ts` - 標籤相關服務
- 其他可能使用 entity_tags 的服務

## 遷移步驟

### Phase 1: 準備與備份 🔒

1. **備份資料庫**
```bash
# 建立完整備份
pg_dump -h localhost -U username -d database_name > backup_before_migration_$(date +%Y%m%d_%H%M%S).sql
```

2. **檢查資料一致性**
```sql
-- 確認所有 entity_tags 的 entity_id 都能對應到實際的 resources
SELECT COUNT(*) as orphaned_tags
FROM entity_tags et
LEFT JOIN resources r ON et.entity_id = r.external_id::varchar
WHERE et.entity_type = 'resource' AND r.id IS NULL;
```

### Phase 2: 資料庫遷移 🗄️

1. **新增臨時欄位**
```sql
-- 添加新的 internal_entity_id 欄位
ALTER TABLE entity_tags ADD COLUMN internal_entity_id INTEGER;
```

2. **資料遷移**
```sql
-- 將 external_id 轉換為 internal_id
UPDATE entity_tags 
SET internal_entity_id = resources.id 
FROM resources 
WHERE entity_tags.entity_id = resources.external_id::varchar 
  AND entity_tags.entity_type = 'resource';

-- 檢查遷移結果
SELECT 
  COUNT(*) as total_tags,
  COUNT(internal_entity_id) as migrated_tags,
  COUNT(*) - COUNT(internal_entity_id) as failed_migrations
FROM entity_tags 
WHERE entity_type = 'resource';
```

3. **更新 Prisma Schema**
```prisma
model entity_tags {
  id                Int       @id @default(autoincrement())
  entity_type       String    @db.VarChar(50)
  entity_id         Int       // 改為 Integer 型別
  tag_id            Int
  created_at        DateTime? @default(now()) @db.Timestamptz(6)
  updated_at        DateTime? @default(now()) @db.Timestamptz(6)
  created_by        Int?
  users             users?    @relation(fields: [created_by], references: [id], onUpdate: NoAction)
  tags              tags      @relation(fields: [tag_id], references: [id], onDelete: Cascade, onUpdate: NoAction)

  @@unique([entity_type, entity_id, tag_id])
  @@index([created_at], map: "idx_entity_tags_created_at")
  @@index([tag_id], map: "idx_entity_tags_tag_id")
  @@index([entity_type, entity_id], map: "idx_entity_tags_type_entity")
}
```

4. **執行最終遷移**
```sql
-- 刪除舊欄位，重命名新欄位
ALTER TABLE entity_tags DROP COLUMN entity_id;
ALTER TABLE entity_tags RENAME COLUMN internal_entity_id TO entity_id;

-- 重建約束和索引
ALTER TABLE entity_tags ALTER COLUMN entity_id SET NOT NULL;
DROP INDEX IF EXISTS idx_entity_tags_type_entity;
CREATE INDEX idx_entity_tags_type_entity ON entity_tags(entity_type, entity_id);
```

### Phase 3: 程式碼更新 💻

1. **更新 resource.service.ts**
```typescript
// 修改 getResources 函數
export async function getResources(
  filters: ResourceFilterParams,
  pagination: PaginationParams
) {
  // ... 查詢 resources ...
  
  // 使用內部 ID 查詢標籤
  const resourceInternalIds = resourcesData.map(resource => resource.id);
  
  const allTags = resourceInternalIds.length > 0 ? await prisma.entity_tags.findMany({
    where: {
      entity_type: 'resource',
      entity_id: { in: resourceInternalIds }  // 使用內部 integer ID
    },
    include: {
      tags: true
    }
  }) : [];

  // 將標籤按內部 ID 分組
  const tagsByResourceId = allTags.reduce((acc, tag) => {
    if (!acc[tag.entity_id]) {
      acc[tag.entity_id] = [];
    }
    acc[tag.entity_id].push({
      id: tag.tags.id,
      name: tag.tags.name
    });
    return acc;
  }, {} as Record<number, Array<{ id: number; name: string }>>);

  // 構建資源列表
  const resourceList = resourcesData.map(resource => ({
    id: resource.external_id,  // 對外仍使用 external_id
    // ... other fields ...
    tags: tagsByResourceId[resource.id] || [],  // 使用內部 ID 查找標籤
    // ...
  }));
}
```

2. **更新 getResourceById 函數**
```typescript
export async function getResourceById(externalId: string) {
  const resource = await prisma.resources.findUnique({
    where: { 
      external_id: externalId,
      deleted_at: null 
    },
    // ... includes ...
  });

  if (!resource) {
    throw new NotFoundError('資源不存在');
  }

  // 使用內部 ID 查詢標籤
  const tags = await prisma.entity_tags.findMany({
    where: {
      entity_type: 'resource',
      entity_id: resource.id  // 使用內部 ID
    },
    include: {
      tags: true
    }
  });

  // ... 其餘邏輯 ...
}
```

3. **更新 tag.service.ts**
```typescript
// 更新 setEntityTags 函數
export async function setEntityTags(
  entityType: string,
  entityExternalId: string,  // 接收 external_id
  tagNames: string[],
  userId: number,
  tx?: PrismaTransaction
) {
  const prismaClient = tx || prisma;
  
  // 先找到內部 ID
  let internalEntityId: number;
  
  if (entityType === 'resource') {
    const resource = await prismaClient.resources.findUnique({
      where: { external_id: entityExternalId },
      select: { id: true }
    });
    if (!resource) throw new NotFoundError('資源不存在');
    internalEntityId = resource.id;
  }
  // 其他 entity 類型的處理...

  // 刪除現有標籤
  await prismaClient.entity_tags.deleteMany({
    where: {
      entity_type: entityType,
      entity_id: internalEntityId  // 使用內部 ID
    }
  });

  // 新增標籤
  if (tagNames.length > 0) {
    const tagRecords = await prismaClient.tags.findMany({
      where: { name: { in: tagNames } }
    });

    await prismaClient.entity_tags.createMany({
      data: tagRecords.map(tag => ({
        entity_type: entityType,
        entity_id: internalEntityId,  // 使用內部 ID
        tag_id: tag.id,
        created_by: userId
      }))
    });
  }
}
```

### Phase 4: 測試與驗證 ✅

1. **單元測試**
```typescript
// 測試資源列表查詢
describe('getResources', () => {
  it('should return resources with correct tags', async () => {
    const result = await getResources({}, {});
    expect(result.resources).toBeDefined();
    // 驗證標籤正確關聯
  });
});
```

2. **整合測試**
```bash
# 執行完整測試套件
npm test

# 測試特定的資源 API
npm run test:paths -- --testPathPattern=resource
```

3. **API 測試**
```bash
# 測試資源列表 API
curl "http://localhost:3000/api/v1/resources?limit=5"

# 測試特定資源查詢
curl "http://localhost:3000/api/v1/resources/{uuid}"
```

## 回滾計劃 🔄

如果遷移失敗，可以執行以下回滾步驟：

```sql
-- 恢復備份
psql -h localhost -U username -d database_name < backup_before_migration_*.sql
```

## 風險評估

### 高風險
- 資料遺失：透過備份和分階段遷移降低
- API 中斷：選擇低流量時段執行

### 中風險  
- 性能影響：integer 查詢應該更快
- 程式碼 bug：透過測試覆蓋

### 低風險
- 前端影響：API 介面保持不變

## 預計時程

- **準備階段**：2 小時
- **資料遷移**：1 小時
- **程式碼更新**：3 小時  
- **測試驗證**：2 小時
- **總計**：8 小時

## 執行檢查清單

- [ ] 資料庫備份完成
- [ ] 資料一致性檢查通過
- [ ] Prisma schema 更新
- [ ] 資料遷移腳本執行
- [ ] 程式碼更新完成
- [ ] 單元測試通過
- [ ] 整合測試通過
- [ ] API 測試通過
- [ ] 性能測試通過
- [ ] 文件更新完成