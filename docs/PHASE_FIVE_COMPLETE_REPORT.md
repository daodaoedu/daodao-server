# 階段五：服務層開發 (TypeScript) - 完成報告

## 1. 概述

本報告概述 DaoDao 專案中 Resource（學習資源）與 Resource Review（資源心得）API 開發的第五階段：服務層開發。在此階段，我們使用 TypeScript 實作了完整的服務層，處理業務邏輯和資料轉換，建立了資源、心得評價和標籤的服務，為後續的控制器和路由開發奠定了基礎。

## 2. 完成項目

### 2.1 資料轉換服務 (transformService)

在 `src/services/transformService.ts` 中實作了資料轉換服務，實現了以下功能：

- **資源資料轉換**：將資料庫的 Resource 記錄轉換為 API 回應格式，處理欄位命名差異和關聯資料
- **心得評價資料轉換**：將資料庫的 ResourceReview 記錄轉換為 API 回應格式，包含 Boolean 欄位的物件化處理
- **API 資料到資料庫格式轉換**：處理前端請求到資料庫格式的轉換，確保資料格式一致性
- **評分計算**：自動計算心得評價的平均評分

```typescript
/**
 * 將資料庫 Resource 記錄轉換為 API 回應格式
 * @param dbResource - 資料庫資源記錄
 * @param includeAssociations - 是否包含關聯資料
 * @returns API格式的資源對象
 */
export function transformResourceToApi(
  dbResource: any,
  includeAssociations = true
): ResourceResponse {
  // 基本資源轉換
  const resource: ResourceResponse = {
    id: dbResource.id,
    name: dbResource.name,
    url: dbResource.url,
    imageUrl: dbResource.image_url,
    description: dbResource.description,
    videoUrl: dbResource.video_url,
    type: dbResource.type,
    cost: dbResource.cost,
    level: dbResource.level,
    // ... 其他欄位轉換
  };

  // 處理關聯資料
  if (includeAssociations) {
    // 處理使用者資訊
    if (dbResource.User) {
      resource.user = {
        id: dbResource.User.id,
        username: dbResource.User.username,
        displayName: dbResource.User.display_name,
        avatarUrl: dbResource.User.avatar_url
      };
    }
    // ... 處理其他關聯資料
  }

  return resource;
}
```

### 2.2 資源服務 (resourceService)

在 `src/services/resourceService.ts` 中實作了資源服務，實現了以下功能：

- **獲取資源詳情**：根據 ID 獲取資源詳情，包含關聯資料和統計數據
- **獲取資源列表**：支援多種篩選條件和游標分頁的資源列表查詢
- **創建資源**：支援同時處理標籤和可選的心得評價，使用事務確保原子性
- **更新資源**：支援部分更新和標籤更新，並進行權限檢查
- **刪除資源**：軟刪除資源，並進行權限檢查
- **狀態管理**：更新資源狀態，並進行權限檢查

```typescript
/**
 * 獲取資源列表
 * @param filters - 篩選條件
 * @param pagination - 分頁參數
 * @returns 資源列表和分頁元數據
 */
export async function getResources(
  filters: ResourceFilterParams = {},
  pagination: PaginationParams = {}
) {
  // 處理分頁參數
  const limit = Math.min(
    pagination.limit || DEFAULT_PAGE_LIMIT,
    MAX_PAGE_LIMIT
  );

  // 處理排序參數
  const sortField = pagination.sortField || 'createdAt';
  const sortDirection = pagination.sortDirection || 'desc';
  
  // ... 構建查詢條件和關聯
  
  // 查詢資源列表
  const { rows, count } = await Resource.findAndCountAll({
    where,
    include,
    order,
    limit: limit + 1 // 多查詢一條記錄，用於判斷是否有下一頁
  });

  // ... 處理結果和分頁

  return { resources, pagination: pagination_meta };
}
```

### 2.3 心得評價服務 (resourceReviewService)

在 `src/services/resourceReviewService.ts` 中實作了心得評價服務，實現了以下功能：

- **獲取心得評價詳情**：根據 ID 獲取心得評價詳情，包含關聯資料和統計數據
- **獲取心得評價列表**：支援多種篩選條件和游標分頁的心得評價列表查詢
- **創建心得評價**：支援同時處理標籤，並檢查用戶是否已評價過該資源
- **更新心得評價**：支援部分更新和標籤更新，並進行權限檢查
- **刪除心得評價**：軟刪除心得評價，並進行權限檢查
- **狀態管理**：更新心得評價狀態，並進行權限檢查
- **點讚功能**：實現心得評價的點讚/取消點讚功能

```typescript
/**
 * 創建心得評價
 * @param resourceId - 資源 ID
 * @param data - 心得評價數據
 * @param userId - 創建者 ID
 * @returns 創建的心得評價
 */
export async function createReview(
  resourceId: number,
  data: ResourceReviewSchema,
  userId: number
) {
  const transaction = await sequelize.transaction();

  try {
    // 檢查資源是否存在
    const resource = await Resource.findByPk(resourceId);
    if (!resource) {
      throw new NotFoundError(`找不到 ID 為 ${resourceId} 的資源`);
    }

    // 檢查用戶是否已經評價過該資源
    const existingReview = await ResourceReview.findOne({
      where: {
        user_id: userId,
        resource_id: resourceId
      }
    });

    if (existingReview) {
      throw new ConflictError('您已經評價過此資源，請修改現有評價');
    }

    // ... 創建心得評價和處理標籤

    // 提交事務
    await transaction.commit();

    // 查詢完整的心得評價數據
    const createdReview = await getReviewById(review.id);

    return createdReview;
  } catch (error) {
    // 回滾事務
    await transaction.rollback();
    throw error;
  }
}
```

### 2.4 標籤服務 (tagService)

在 `src/services/tagService.ts` 中實作了標籤服務，實現了以下功能：

- **標籤管理**：創建標籤、獲取或創建多個標籤
- **實體標籤關聯**：設置實體的標籤、獲取實體的標籤、添加/移除實體標籤
- **標籤統計和查詢**：獲取熱門標籤、搜索標籤、獲取標籤統計

```typescript
/**
 * 設置實體的標籤
 * @param entityId - 實體 ID
 * @param entityType - 實體類型
 * @param tagNames - 標籤名稱數組
 * @param transaction - 事務對象
 */
export async function setEntityTags(
  entityId: number,
  entityType: string,
  tagNames: string[],
  transaction?: Transaction
) {
  // 獲取或創建標籤
  const tags = await getOrCreateTags(tagNames, transaction);

  // 刪除現有的實體標籤關聯
  await EntityTag.destroy({
    where: {
      entity_id: entityId,
      entity_type: entityType
    },
    transaction
  });

  // 創建新的實體標籤關聯
  await Promise.all(
    tags.map(tag => 
      EntityTag.create(
        {
          entity_id: entityId,
          entity_type: entityType,
          tag_id: tag.id
        },
        { transaction }
      )
    )
  );

  return tags;
}
```

### 2.5 服務工具和常數

除了核心服務外，還實作了以下輔助組件：

- **欄位映射常數** (`src/constants/mappings.ts`)：集中管理欄位映射關係和常數
- **轉換工具函數** (`src/utils/transformUtils.ts`)：提供 Boolean 欄位轉換、游標分頁處理等通用功能
- **錯誤處理工具** (`src/utils/errorHandler.ts`)：定義自定義錯誤類型和錯誤處理中間件

### 2.6 單元測試

為服務層編寫了詳細的單元測試，確保服務的正確性和穩定性：

- **轉換服務測試** (`tests/unit/services/transformService.test.ts`)：測試資料轉換功能
- **資源服務測試** (`tests/unit/services/resourceService.test.ts`)：測試資源相關業務邏輯

## 3. 設計決策

### 3.1 服務層架構設計

採用功能模組化的服務設計模式：

- **功能分離**：將資料轉換、資源操作、心得評價操作和標籤管理分別實作為獨立的服務
- **高內聚**：每個服務專注於特定領域的業務邏輯，提高代碼的可維護性
- **低耦合**：服務之間通過清晰的介面進行互動，減少相互依賴

這種設計使得每個服務可以獨立測試和維護，提高了代碼的可讀性和可擴展性。

### 3.2 事務管理策略

對於涉及多表操作的業務邏輯，採用顯式事務管理：

- **原子性保證**：使用 Sequelize 事務確保多表操作的原子性
- **一致性保證**：在發生錯誤時回滾事務，避免資料不一致
- **錯誤處理**：統一的 try-catch 模式處理事務中的錯誤

```typescript
const transaction = await sequelize.transaction();

try {
  // 執行多表操作
  
  // 提交事務
  await transaction.commit();
  
  return result;
} catch (error) {
  // 回滾事務
  await transaction.rollback();
  throw error;
}
```

### 3.3 錯誤處理策略

設計了統一的錯誤處理機制：

- **自定義錯誤類型**：定義了 NotFoundError、BadRequestError、ForbiddenError 等自定義錯誤類型
- **統一錯誤格式**：所有錯誤都遵循一致的格式，包含狀態碼、錯誤訊息和詳細信息
- **詳細錯誤訊息**：提供有意義的錯誤訊息，幫助前端進行適當的錯誤處理

### 3.4 分頁策略

採用游標分頁策略，而非傳統的頁碼分頁：

- **高效性**：游標分頁在處理大量資料時更高效，不需要計算總記錄數
- **穩定性**：即使在查詢過程中有新記錄添加，也不會影響分頁結果
- **實現簡潔**：使用 ID 和時間戳組合作為游標，實現簡單而可靠

```typescript
// 生成游標
export function generateCursor(id: number, timestamp: Date | string): string {
  const ts = typeof timestamp === 'string' ? timestamp : timestamp.toISOString();
  const cursorData = `${ts}:${id}`;
  return Buffer.from(cursorData).toString('base64');
}

// 解析游標
export function decodeCursor(cursor: string): { id: number; timestamp: string } | null {
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
    const [timestamp, idStr] = decoded.split(':');
    const id = parseInt(idStr, 10);
    
    if (isNaN(id)) return null;
    
    return { id, timestamp };
  } catch (error) {
    return null;
  }
}
```

## 4. 發現的問題與解決方案

### 4.1 關聯資料處理複雜性

**問題**：處理多層次的關聯資料（資源-用戶-分類-標籤）時，代碼變得複雜且難以維護。

**解決方案**：
- 設計了靈活的 `transformResourceToApi` 函數，支援通過 `includeAssociations` 參數控制是否包含關聯資料
- 使用條件判斷處理可能缺失的關聯資料，增強系統的穩定性
- 為複雜的關聯查詢定義清晰的 `include` 配置，提高代碼可讀性

### 4.2 Boolean 欄位轉換挑戰

**問題**：需要在 15 個獨立的 Boolean 欄位和 2 個結構化物件之間進行轉換。

**解決方案**：
- 設計了通用的 `booleanFieldsToObject` 和 `objectToBooleanFields` 函數
- 使用集中式的映射配置 (`contentFeaturesMappings` 和 `resourceUsageMappings`)
- 實現了強類型的轉換邏輯，確保類型安全和正確性

### 4.3 權限控制實現

**問題**：不同操作需要不同的權限控制規則，且需要在服務層和控制器層都進行檢查。

**解決方案**：
- 在服務層實現基本的權限檢查，如創建者才能更新/刪除資源
- 使用自定義的 ForbiddenError 統一處理權限錯誤
- 預留了管理員權限檢查的擴展點，方便後續功能開發

### 4.4 游標分頁實現

**問題**：實現高效的游標分頁，同時支援多種排序方式。

**解決方案**：
- 使用 ID 和排序欄位值組合作為游標，支援不同排序欄位的分頁
- 實現了 `generateCursor` 和 `decodeCursor` 工具函數，處理游標的生成和解析
- 設計了 `generatePaginationMetadata` 函數，統一生成分頁元數據

## 5. 與前階段的集成

本階段的服務層開發充分利用了前幾個階段的成果：

- **與階段二（TypeScript 型別系統）的集成**：使用階段二定義的型別，確保了服務層的類型安全
- **與階段三（Sequelize 模型）的集成**：基於階段三定義的模型，實現了資料庫操作
- **與階段四（Zod 驗證器）的集成**：使用階段四定義的驗證 Schema 類型作為服務層函數的參數類型

這種集成確保了從控制器到資料庫的完整類型安全，大幅減少了運行時錯誤的可能性。

## 6. 未來改進方向

### 6.1 快取機制

為提高系統效能，可以實現以下快取機制：

- **資源詳情快取**：使用 Redis 快取熱門資源的詳情
- **列表查詢快取**：針對常見的篩選條件，快取資源列表查詢結果
- **統計數據快取**：將評分、查看次數等統計數據存儲在 Redis 中

### 6.2 搜索功能增強

現有的搜索功能較為基礎，可以通過以下方式增強：

- **全文搜索**：使用 PostgreSQL 的全文搜索功能或 Elasticsearch
- **相關性排序**：基於用戶行為和內容相關性的智能排序
- **搜索建議**：根據熱門搜索和用戶歷史提供搜索建議

### 6.3 效能優化

對於大規模資料，可以實施以下效能優化：

- **查詢優化**：針對常見查詢優化索引和查詢計劃
- **延遲載入**：對於複雜的關聯資料，使用延遲載入減少不必要的查詢
- **資料分片**：對於超大規模資料，考慮實施資料分片策略

## 7. 結論

階段五的服務層開發已經完成。我們實現了完整的資源管理和心得評價服務，包括資料轉換、業務邏輯處理和標籤管理。這些服務為後續的控制器和路由開發提供了堅實的基礎，確保了系統的穩定性、可維護性和可擴展性。

服務層的設計充分利用了 TypeScript 的型別系統，結合了前幾個階段的成果，實現了完整的類型安全。同時，我們也設計了清晰的錯誤處理機制和事務管理策略，確保了系統的穩定性和資料一致性。

## 8. 下一步計劃

準備進入階段六的控制器開發：

1. 基於服務層實作 Resource 控制器
2. 實作 ResourceReview 控制器
3. 實作 Tag 控制器
4. 設計統一的錯誤處理和回應格式

完成階段六後，將進入階段七的路由設定，繼續推進整個開發計劃。
