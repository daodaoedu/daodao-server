# 階段六：控制器開發 (TypeScript) - 完成報告

## 1. 概述

本報告概述 DaoDao 專案中 Resource（學習資源）與 Resource Review（資源心得）API 開發的第六階段：控制器開發。在此階段，我們基於階段五的服務層，使用 TypeScript 實作了完整的控制器層，處理 HTTP 請求和回應，實現了資源、心得評價和標籤的控制器，為後續的路由開發奠定了基礎。

## 2. 完成項目

### 2.1 資源控制器 (resourceController)

在 `src/controllers/resourceController.ts` 中實作了資源控制器，實現了以下功能：

- **獲取資源列表**：支援多種篩選條件和分頁的資源列表查詢
- **獲取資源詳情**：根據 ID 獲取資源詳情，同時記錄查看次數
- **創建資源**：支援完整驗證和權限檢查的資源創建
- **更新資源**：支援部分更新和權限檢查
- **更新資源狀態**：獨立的狀態更新端點
- **刪除資源**：軟刪除資源，並進行權限檢查
- **獲取資源標籤**：獲取特定資源的標籤列表

所有控制器函數都使用 `asyncWrapper` 包裝，統一處理錯誤，並使用驗證中間件確保請求資料的有效性。

```typescript
/**
 * 獲取資源列表
 * GET /resources
 */
export const getResources = asyncWrapper(async (req: Request, res: Response) => {
  const { 
    cursor, 
    limit, 
    type, 
    cost, 
    level, 
    majorCategoryId, 
    subCategoryId, 
    tags, 
    query,
    sortField,
    sortDirection
  } = req.query;

  // 處理過濾條件和分頁參數...
  
  // 查詢資源列表
  const result = await resourceService.getResources(filters, pagination);

  // 返回結果
  return res.json({
    success: true,
    data: result
  });
});
```

### 2.2 資源心得評價控制器 (resourceReviewController)

在 `src/controllers/resourceReviewController.ts` 中實作了心得評價控制器，實現了以下功能：

- **獲取心得評價列表**：支援根據資源或用戶過濾的心得評價列表查詢
- **獲取心得評價詳情**：根據 ID 獲取心得評價詳情
- **創建心得評價**：支援完整驗證和權限檢查的心得評價創建
- **更新心得評價**：支援部分更新和權限檢查
- **更新心得評價狀態**：獨立的狀態更新端點
- **刪除心得評價**：軟刪除心得評價，並進行權限檢查
- **點讚/取消點讚功能**：支援對心得評價的點讚和取消點讚操作
- **獲取心得評價標籤**：獲取特定心得評價的標籤列表

控制器中實現了身份驗證檢查和資料驗證，確保請求的有效性和安全性。

```typescript
/**
 * 創建心得評價
 * POST /resources/:resourceId/reviews
 */
export const createReview = asyncWrapper(async (req: Request, res: Response) => {
  const { resourceId } = req.params;
  // 假設經過認證中間件獲取的用戶 ID
  const userId = req.user?.id;
  
  if (!userId) {
    throw new BadRequestError('必須登入才能創建心得評價');
  }

  // 驗證請求數據
  const validatedData = validateCreateResourceReview(req.body);

  // 創建心得評價
  const review = await resourceReviewService.createReview(
    parseInt(resourceId, 10),
    validatedData,
    userId
  );

  // 返回結果
  return res.status(201).json({
    success: true,
    data: review
  });
});
```

### 2.3 標籤控制器 (tagController)

在 `src/controllers/tagController.ts` 中實作了標籤控制器，實現了以下功能：

- **獲取熱門標籤**：支援獲取不同實體類型的熱門標籤
- **搜索標籤**：支援標籤搜索功能
- **獲取標籤統計**：獲取標籤使用統計資料
- **實體標籤操作**：添加、移除和獲取實體標籤

標籤控制器實現了通用的標籤管理功能，支援所有實體類型的標籤操作。

```typescript
/**
 * 獲取熱門標籤
 * GET /tags/popular
 */
export const getPopularTags = asyncWrapper(async (req: Request, res: Response) => {
  const { entityType, limit } = req.query;
  
  // 獲取熱門標籤
  const tags = await tagService.getPopularTags(
    entityType as string | undefined,
    limit ? parseInt(limit as string, 10) : undefined
  );

  // 返回結果
  return res.json({
    success: true,
    data: tags.map(tag => ({
      id: tag.id,
      name: tag.name,
      count: tag.get('count')
    }))
  });
});
```

### 2.4 請求參數驗證器

在 `src/validators/requestParams.validator.ts` 中實作了請求參數驗證器，實現了以下功能：

- **分頁參數驗證**：驗證和轉換分頁相關參數
- **資源過濾參數驗證**：驗證和轉換資源過濾參數
- **心得評價過濾參數驗證**：驗證和轉換心得評價過濾參數
- **標籤相關參數驗證**：驗證和轉換標籤相關參數

這些驗證器確保了請求參數的有效性和類型安全，減少了控制器中的參數處理邏輯。

```typescript
// 通用分頁參數驗證
export const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.string()
    .transform(val => parseInt(val, 10))
    .refine(val => !isNaN(val), { message: "limit 必須是有效的數字" })
    .refine(val => val > 0 && val <= 100, { message: "limit 必須在 1-100 之間" })
    .optional(),
  sortField: z.enum(SORT_FIELDS as [string, ...string[]]).optional(),
  sortDirection: z.enum(SORT_DIRECTIONS as [string, ...string[]]).optional()
});
```

### 2.5 控制器索引模塊

在 `src/controllers/index.ts` 中實作了控制器索引模塊，統一導出所有控制器，方便在路由層使用。

```typescript
/**
 * 控制器模塊索引
 * 統一導出所有控制器
 */

import resourceController from './resourceController';
import resourceReviewController from './resourceReviewController';
import tagController from './tagController';

export {
  resourceController,
  resourceReviewController,
  tagController
};

// 導出默認對象
export default {
  resourceController,
  resourceReviewController,
  tagController
};
```

## 3. 設計決策

### 3.1 控制器架構設計

採用功能模組化的控制器設計模式：

- **功能分離**：將資源操作、心得評價操作和標籤管理分別實作為獨立的控制器
- **統一回應格式**：所有控制器採用一致的回應格式，包含 `success` 狀態和 `data` 資料
- **錯誤處理一致性**：使用 `asyncWrapper` 和自定義錯誤類型確保錯誤處理的一致性

這種設計使得每個控制器專注於特定領域的 HTTP 請求處理，提高了代碼的可讀性和可維護性。

### 3.2 參數處理策略

對於請求參數的處理，採用以下策略：

- **驗證中間件**：使用 Zod 驗證中間件確保請求資料的有效性
- **參數轉換**：將查詢參數轉換為服務層期望的格式，處理類型轉換和預設值
- **錯誤提示**：提供清晰的錯誤提示，幫助客戶端診斷問題

```typescript
// 處理過濾條件
const filters: any = {};
if (type) filters.type = type as string;
if (cost) filters.cost = cost as string;
if (level) filters.level = level as string;
if (majorCategoryId) filters.majorCategoryId = parseInt(majorCategoryId as string, 10);
// ...其他過濾參數處理
```

### 3.3 回應格式標準化

設計了統一的回應格式，確保 API 回應的一致性：

- **成功回應**：包含 `success: true` 和實際資料 `data`
- **錯誤回應**：包含 `success: false`、錯誤訊息 `message` 和錯誤類型 `error`
- **分頁回應**：對於列表查詢，包含分頁元數據 `pagination`

```typescript
// 成功回應範例
return res.json({
  success: true,
  data: result
});

// 錯誤回應範例 (由 errorHandler 處理)
return res.status(400).json({
  success: false,
  message: '驗證失敗',
  error: 'BadRequestError',
  details: errors
});
```

### 3.4 權限控制策略

實現了基本的權限控制策略：

- **登入檢查**：所有修改操作都需要用戶登入
- **所有權檢查**：只有資源或心得評價的創建者才能更新或刪除
- **狀態控制**：僅發布狀態的內容對所有用戶可見

這些檢查同時在控制器層和服務層實現，確保安全性和一致性。

## 4. 發現的問題與解決方案

### 4.1 類型安全與請求參數處理

**問題**：Express 請求參數（query、params）的類型處理不夠嚴格，容易引發運行時錯誤。

**解決方案**：
- 使用 Zod 驗證和轉換請求參數，確保類型安全
- 實現專用的請求參數驗證器，處理常見的參數格式
- 在控制器中進行額外的類型檢查和轉換

### 4.2 錯誤處理與回應一致性

**問題**：不同控制器可能產生不同格式的錯誤回應，影響 API 的一致性。

**解決方案**：
- 使用 `asyncWrapper` 統一捕獲和處理異步錯誤
- 設計全局錯誤處理中間件，統一格式化錯誤回應
- 使用自定義錯誤類型，提供清晰的錯誤資訊

### 4.3 控制器與服務層的職責劃分

**問題**：控制器和服務層的職責邊界不夠清晰，可能導致邏輯重複或錯位。

**解決方案**：
- 控制器專注於 HTTP 請求處理、參數驗證和回應格式化
- 服務層專注於業務邏輯和資料操作
- 清晰定義兩層的介面和職責，避免邏輯重複

### 4.4 身份驗證整合

**問題**：控制器需要整合身份驗證機制，但又不應該過度依賴特定的認證實現。

**解決方案**：
- 假設使用中間件將認證資訊注入到 `req.user` 中
- 在控制器中進行基本的身份檢查，但將詳細的權限邏輯留給服務層
- 預留擴展點，方便後續整合更複雜的認證機制

## 5. 與前階段的集成

本階段的控制器開發充分利用了前幾個階段的成果：

- **與階段二（TypeScript 型別系統）的集成**：使用階段二定義的型別，確保了控制器的類型安全
- **與階段四（Zod 驗證器）的集成**：使用階段四定義的驗證 Schema，確保請求資料的有效性
- **與階段五（服務層）的集成**：基於階段五的服務層實現控制器功能，確保業務邏輯的一致性

這種集成確保了從 HTTP 請求到資料庫操作的完整鏈路，提高了系統的穩定性和可維護性。

## 6. 未來改進方向

### 6.1 身份驗證與授權增強

目前的身份驗證機制較為基礎，可以通過以下方式增強：

- **實現完整的 JWT 認證**：包括令牌生成、驗證和刷新機制
- **角色權限控制**：基於角色的訪問控制，支援管理員和普通用戶不同權限
- **API 訪問限制**：實現速率限制，防止濫用 API

### 6.2 請求參數驗證優化

可以進一步優化請求參數驗證：

- **整合 OpenAPI 規範**：生成符合 OpenAPI 的驗證和文檔
- **更精細的錯誤提示**：提供更友好的驗證錯誤訊息
- **自定義驗證規則**：支援更複雜的業務規則驗證

### 6.3 回應資料優化

可以優化 API 回應資料的處理：

- **資料轉換層**：在控制器和服務層之間添加專用的資料轉換層
- **回應資料過濾**：根據請求需求動態過濾回應資料
- **版本控制**：支援不同版本的 API 回應格式

## 7. 結論

階段六的控制器開發已經完成。我們實現了完整的資源、心得評價和標籤控制器，處理 HTTP 請求和回應，實現了參數驗證、錯誤處理和權限控制。這些控制器為後續的路由開發提供了堅實的基礎，確保了 API 的一致性、安全性和可用性。

控制器的設計充分利用了 TypeScript 的型別系統和 Zod 的驗證能力，結合了前幾個階段的成果，實現了完整的類型安全和資料驗證。同時，我們也設計了清晰的錯誤處理機制和回應格式，提高了 API 的易用性和可靠性。

## 8. 下一步計劃

準備進入階段七的路由設定：

1. 定義資源路由 (`/resources/...`)
2. 定義心得評價路由 (`/reviews/...`)
3. 定義標籤路由 (`/tags/...`)
4. 整合中間件和權限控制
5. 設定 API 文檔生成

完成階段七後，將進入階段八的測試與部署，繼續推進整個開發計劃。
