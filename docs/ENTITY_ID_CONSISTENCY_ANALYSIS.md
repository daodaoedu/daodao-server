# Entity ID 一致性分析與修復計劃

## 執行摘要

本文件分析了 DaoDao 專案中 Entity ID 設計的不一致性問題，並提供詳細的修復計劃。主要問題在於 `entity_tags` 和 `entity_resources` 表對 `entity_id` 欄位的型別定義不一致，導致程式碼混亂和潛在的錯誤。

## 問題分析

### 1. 資料庫設計不一致

#### entity_tags 表
- **欄位定義**: `entity_id Int`
- **預期用途**: 儲存實體的內部整數 ID
- **實際使用**: 程式碼混亂，有些地方傳入 UUID，有些傳入整數

#### entity_resources 表  
- **欄位定義**: `entity_id String @db.VarChar(36)`
- **預期用途**: 儲存實體的 external_id (UUID)
- **實際使用**: 直接使用 UUID 查詢

### 2. 程式碼實作混亂

#### 問題範例

1. **resource.service.ts (第 101 行)**
   ```typescript
   // 使用 SQL 強制轉換來處理型別不匹配
   WHERE et.entity_type = 'resource'
   AND et.entity_id::integer = ${resource.id}
   ```

2. **idea.service.ts (第 68-69 行)**
   ```typescript
   // 直接使用 UUID 查詢 entity_tags（會失敗）
   where: {
     entity_type: 'idea',
     entity_id: idea.external_id || ''  // 這是 UUID，但欄位期望整數
   }
   ```

3. **tag.controller.ts**
   ```typescript
   // 控制器接收字串 ID，但服務層期望數字
   await tagService.setEntityTags(
     entityType as string,
     entityId as string,  // 問題：應該是 number
     [tagName as string],
     userId
   );
   ```

### 3. 影響範圍

- **資源管理**: 標籤關聯功能異常
- **想法管理**: 標籤和資源關聯功能異常  
- **評論系統**: target_id 使用字串（設計正確，但與其他系統不一致）
- **資料完整性**: 可能導致孤立的關聯記錄

## 建議解決方案

### 方案一：統一使用內部整數 ID（推薦）

**優點**：
- 查詢效能最佳（整數索引）
- 資料庫空間效率高
- 與現有大部分表結構一致

**缺點**：
- 需要修改 entity_resources 表結構
- 需要資料遷移

### 方案二：統一使用 UUID

**優點**：
- API 層面更簡單（不需要 ID 轉換）
- 全局唯一性

**缺點**：
- 查詢效能較差
- 需要修改 entity_tags 表結構
- 更大規模的程式碼修改

## 修復任務清單

### Phase 1: 資料庫結構修正（高優先級）

- [ ] **Task 1.1**: 修改 entity_resources 表結構
  - 檔案: `prisma/schema.prisma` (第 129-147 行)
  - 將 `entity_id String @db.VarChar(36)` 改為 `entity_id Int`
  - 執行資料遷移腳本

- [ ] **Task 1.2**: 創建資料遷移腳本
  - 將現有 UUID 對應到內部 ID
  - 備份現有資料
  - 執行遷移

### Phase 2: 服務層修正（高優先級）

- [ ] **Task 2.1**: 修正 tag.service.ts
  - 檔案: `src/services/tag.service.ts` (第 102-134 行)
  - 確保 `entityId` 參數型別為 `number`
  - 移除不必要的型別轉換

- [ ] **Task 2.2**: 修正 resource.service.ts
  - 檔案: `src/services/resource.service.ts` (第 88-102 行)
  - 移除 SQL 強制型別轉換
  - 使用 Prisma 原生查詢

- [ ] **Task 2.3**: 修正 idea.service.ts
  - 檔案: `src/services/idea.service.ts` (第 65-93 行)
  - 修改為先查詢內部 ID
  - 使用內部 ID 進行關聯查詢

### Phase 3: 控制器層修正（中優先級）

- [ ] **Task 3.1**: 修正 tag.controller.ts
  - 檔案: `src/controllers/tag.controller.ts` (第 88-119 行)
  - 添加 UUID 到內部 ID 的轉換邏輯
  - 處理不同實體類型的 ID 查詢

- [ ] **Task 3.2**: 修正 resource.controller.ts
  - 檔案: `src/controllers/resource.controller.ts`
  - 確保正確的 ID 傳遞

- [ ] **Task 3.3**: 創建通用 ID 轉換工具
  - 新檔案: `src/utils/entity-id-resolver.ts`
  - 實作 UUID 到內部 ID 的轉換函數

### Phase 4: 驗證與測試（中優先級）

- [ ] **Task 4.1**: 更新整合測試
  - 檔案: `tests/integration/*.test.ts`
  - 測試標籤關聯功能
  - 測試資源關聯功能

- [ ] **Task 4.2**: 更新單元測試
  - 檔案: `tests/unit/services/*.test.ts`
  - 測試 ID 轉換邏輯
  - 測試服務層功能

### Phase 5: 文件更新（低優先級）

- [ ] **Task 5.1**: 更新 API 文件
  - 檔案: `src/swagger/schemas/*.schemas.ts`
  - 說明 ID 使用規範

- [ ] **Task 5.2**: 更新開發者指南
  - 檔案: `CLAUDE.md`
  - 添加 Entity ID 使用說明

## 實作範例

### ID 轉換工具範例

```typescript
// src/utils/entity-id-resolver.ts
import { prisma } from '@/services/database/prisma.service';
import { NotFoundError } from '@/utils/error-handler';

export async function resolveEntityId(
  entityType: string,
  externalId: string
): Promise<number> {
  switch (entityType) {
    case 'resource': {
      const resource = await prisma.resources.findUnique({
        where: { external_id: externalId },
        select: { id: true }
      });
      if (!resource) throw new NotFoundError('資源不存在');
      return resource.id;
    }
    case 'idea': {
      const idea = await prisma.ideas.findUnique({
        where: { external_id: externalId },
        select: { id: true }
      });
      if (!idea) throw new NotFoundError('想法不存在');
      return idea.id;
    }
    case 'practice': {
      const practice = await prisma.practices.findUnique({
        where: { external_id: externalId },
        select: { id: true }
      });
      if (!practice) throw new NotFoundError('練習不存在');
      return practice.id;
    }
    default:
      throw new BadRequestError(`不支援的實體類型: ${entityType}`);
  }
}
```

### 修正後的控制器範例

```typescript
// src/controllers/tag.controller.ts
import { resolveEntityId } from '@/utils/entity-id-resolver';

export const addEntityTag = asyncWrapper(async (req: Request, res: Response) => {
  const { entityId, entityType, tagName } = req.body;
  
  // 驗證請求數據
  if (!entityId || !entityType || !tagName) {
    throw new BadRequestError('必須提供實體ID、實體類型和標籤名稱');
  }

  // 獲取用戶ID
  const userId = req.user?.id;
  if (!userId) {
    throw new BadRequestError('需要用戶認證');
  }

  // 將 UUID 轉換為內部 ID
  const internalId = await resolveEntityId(entityType, entityId);

  // 使用內部 ID 添加實體標籤
  await tagService.setEntityTags(
    entityType,
    internalId,  // 現在是 number 型別
    [tagName],
    userId
  );

  // 返回結果（仍使用 external_id）
  res.status(201).json({
    success: true,
    data: {
      entityId: entityId,  // 返回原始的 UUID
      entityType,
      tagName
    }
  });
});
```

## 風險評估

### 高風險
- 資料遷移可能導致資料遺失（需要完整備份）
- 現有 API 可能中斷（需要版本控制）

### 中風險
- 效能影響（遷移期間）
- 第三方整合可能受影響

### 低風險
- 開發時間延長
- 測試覆蓋不足

## 時程估計

- **Phase 1**: 2-3 天（包含測試）
- **Phase 2**: 3-4 天
- **Phase 3**: 2-3 天
- **Phase 4**: 2-3 天
- **Phase 5**: 1 天

**總計**: 10-14 天

## 成功指標

1. 所有 entity_tags 和 entity_resources 操作正常運作
2. 無型別轉換錯誤
3. 查詢效能提升 20%+
4. 零資料遺失
5. API 向後相容

## 結論

Entity ID 的不一致性是一個嚴重但可修復的問題。建議採用方案一（統一使用內部整數 ID），並按照上述任務清單逐步實施。這將確保系統的長期穩定性和效能。

---

*文件版本: 1.0*  
*最後更新: 2025-08-13*  
*作者: Claude Code Assistant*