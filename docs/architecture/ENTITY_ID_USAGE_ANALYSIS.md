# DaoDao 學習平台 ID 使用模式分析

> 本文件分析 DaoDao 學習平台中學習資源、標籤系統及相關實體的 ID 使用模式，釐清 targetId、entityId 等不同 ID 類型的用途和關聯關係。

## 概述

DaoDao 平台採用混合 ID 架構，結合了數字 ID（自增主鍵）和 UUID（外部 ID）來支援不同的業務需求。這種設計提供了內部效能優化和外部 API 安全性的平衡。

## 核心 ID 類型

### 1. 數字 ID (Integer ID)
- **用途**: 內部數據庫操作、性能優化
- **格式**: 自增整數 (1, 2, 3...)
- **應用**: 主鍵、外鍵關聯、資料庫索引

### 2. 外部 ID (External ID/UUID)
- **用途**: 對外 API、前端交互、安全性
- **格式**: UUID v4 (例: a1b2c3d4-e5f6-7890-abcd-ef1234567890)
- **應用**: 公開 API 端點、前端路由

## 學習資源 (Resources) ID 架構

### 資料庫結構
```sql
-- resources 表結構
resources {
  id: number (主鍵, 自增)
  external_id: string (UUID, 唯一)
  name: string
  url: string
  ...
}
```

### ID 使用模式

#### 內部操作 (數字 ID)
- **範圍**: 服務層內部、資料庫查詢
- **位置**: `src/services/resource.service.ts`
- **例子**:
  ```typescript
  // 查詢資源的數字 ID 用於標籤關聯
  const resource = await prisma.resources.findFirst({
    where: { external_id: id }
  });
  // 使用數字 ID 進行標籤查詢
  AND et.entity_id::integer = ${resource.id}
  ```

#### 外部 API (UUID)
- **範圍**: 控制器層、API 端點
- **位置**: `src/controllers/resource.controller.ts`
- **例子**:
  ```typescript
  // API 路由使用 UUID
  GET /api/v1/resources/:id  // id 為 UUID
  
  // 控制器接收 UUID
  export const getResourceById = async (req: Request, res: Response) => {
    const { id } = req.params; // UUID 字串
    const resource = await resourceService.getResourceById(id);
  };
  ```

### 轉換機制
1. **API → 服務層**: UUID 轉換為數字 ID
2. **服務層 → 資料庫**: 使用數字 ID 進行高效查詢
3. **回傳結果**: 將數字 ID 轉換回 UUID

## 標籤系統 (Tags) ID 架構

### 標籤與實體關聯表
```sql
-- entity_tags 表結構
entity_tags {
  id: number (主鍵)
  entity_type: string ('resource', 'idea', 'practice', etc.)
  entity_id: number (實體的數字 ID，非 UUID)
  tag_id: number (標籤 ID)
  created_by: number
  created_at: timestamp
}
```

### 關鍵設計決策

#### entity_id 使用數字 ID
- **原因**: 性能考量、數據庫效率
- **影響**: 需要在 UUID 和數字 ID 間轉換

#### 實際使用案例

##### 資源標籤查詢
```typescript
// 1. 通過 UUID 找到資源的數字 ID
const resource = await prisma.resources.findFirst({
  where: { external_id: id },  // UUID
  select: { id: true }         // 數字 ID
});

// 2. 使用數字 ID 查詢標籤
const tags = await tagService.getEntityTags('resource', resource.id);
```

##### 標籤設置操作
```typescript
// 使用資源的 external_id (UUID) 進行標籤設置
await tagService.setEntityTags('resource', resource.external_id, tagNames, userId);

// 內部轉換為數字 ID
export async function setEntityTags(
  entityType: string,
  entityId: number,  // 這裡實際期望數字 ID
  tagNames: string[],
  userId: number
) {
  // 操作 entity_tags 表時使用數字 ID
  await tx.entity_tags.create({
    data: {
      entity_type: entityType,
      entity_id: entityId,  // 數字 ID
      tag_id: tag.id,
      created_by: userId
    }
  });
}
```

## targetId 和 entityId 使用分析

### targetId (評論系統)

#### 定義與用途
- **範圍**: 評論系統 (`comments` 表)
- **格式**: 字串，可以是 UUID 或數字
- **用途**: 指向被評論的目標實體

#### 使用模式
```typescript
// comments 表結構
comments {
  target_id: string      // 目標實體 ID (可以是 UUID 或數字字串)
  target_type: string    // 目標類型 ('post', 'resource', 'idea', etc.)
  user_id: number
  content: string
  ...
}
```

#### 實際應用
```typescript
// 評論 API 接口
interface CommentCreateRequest {
  targetType: CommentTargetType;  // 'resource', 'idea', 'post', etc.
  targetId: string;               // 目標實體的 ID
  content: string;
}

// 根據不同 targetType 解析 targetId
private async getTargetEntity(targetType: string, targetId: string) {
  switch (targetType) {
    case 'resource':
      // targetId 可能是 UUID，需要查詢數字 ID
      return await prisma.resources.findFirst({
        where: { external_id: targetId }
      });
    case 'idea':
      return await prisma.ideas.findFirst({
        where: { external_id: targetId }
      });
    // ...其他類型
  }
}
```

### entityId (標籤系統)

#### 定義與用途
- **範圍**: 標籤關聯系統 (`entity_tags` 表)
- **格式**: 數字 (Integer)
- **用途**: 標籤與實體的關聯鍵

#### 使用模式
```typescript
// 標籤 API 中的 entityId
interface TagOperationRequest {
  entityId: number;      // 實體的數字 ID
  entityType: string;    // 實體類型
  tagName: string;       // 標籤名稱
}

// 標籤控制器
export const addEntityTag = async (req: Request, res: Response) => {
  const { entityId, entityType, tagName } = req.body;
  // entityId 在這裡是數字 ID，直接用於資料庫操作
  await tagService.setEntityTags(entityType, entityId, [tagName], userId);
};
```

## ID 使用不一致問題

### 問題 1: 標籤服務的 ID 類型混亂
```typescript
// 問題：參數名稱和實際類型不匹配
export async function setEntityTags(
  entityType: string,
  entityId: number,    // 參數名暗示數字，但有時傳入 UUID
  tagNames: string[],
  userId: number
) {
  // 在資源服務中的調用
  await tagService.setEntityTags('resource', resource.external_id, tags, userId);
  //                                         ^^^^^^^^^^^^^^^^^^^
  //                                         這是 UUID 字串，不是數字
}
```

### 問題 2: entity_tags 表的設計限制
- `entity_id` 欄位定義為數字類型
- 但某些實體使用 UUID 作為主要識別符
- 導致需要額外的轉換邏輯

## 建議的改進方案

### 1. 統一 ID 命名規範
```typescript
// 建議的命名規範
interface TagOperationParams {
  entityInternalId: number;  // 明確指示使用內部數字 ID
  entityExternalId: string;  // 明確指示使用外部 UUID
  entityType: string;
}
```

### 2. 加強類型安全
```typescript
// 使用 TypeScript 品牌類型區分不同 ID
type InternalId = number & { __brand: 'internal' };
type ExternalId = string & { __brand: 'external' };

interface ResourceOperations {
  getByInternalId(id: InternalId): Promise<Resource>;
  getByExternalId(id: ExternalId): Promise<Resource>;
}
```

### 3. 建立轉換工具函數
```typescript
// ID 轉換服務
export class IdConverter {
  static async resourceExternalToInternal(externalId: string): Promise<number> {
    const resource = await prisma.resources.findFirst({
      where: { external_id: externalId },
      select: { id: true }
    });
    if (!resource) throw new NotFoundError('Resource not found');
    return resource.id;
  }
  
  static async ideaExternalToInternal(externalId: string): Promise<number> {
    // 類似實現...
  }
}
```

## 最佳實踐建議

### 1. API 設計
- **對外 API**: 統一使用 UUID
- **內部服務**: 根據性能需求選擇 ID 類型
- **文檔標註**: 明確標示預期的 ID 格式

### 2. 資料庫設計
- **主鍵**: 使用自增數字 ID 提升性能
- **外部鍵**: 提供 UUID 欄位供 API 使用
- **索引**: 為兩種 ID 類型都建立索引

### 3. 代碼實現
- **類型檢查**: 使用 TypeScript 品牌類型
- **轉換邏輯**: 集中管理 ID 轉換
- **錯誤處理**: 提供清晰的錯誤訊息

## 總結

DaoDao 平台的 ID 系統設計體現了性能和安全性的平衡考量，但在實現過程中存在一些不一致的地方。通過統一命名規範、加強類型安全和建立轉換工具，可以進一步提升系統的可維護性和開發體驗。

### 關鍵要點
1. **資源系統**: 對外使用 UUID，內部使用數字 ID
2. **標籤系統**: entity_id 使用數字 ID，需要轉換邏輯
3. **評論系統**: targetId 格式依據 targetType 而定
4. **改進方向**: 統一規範、類型安全、轉換工具

---

*文件生成時間: 2025-08-19*  
*分析基於: feat/practice 分支代碼*