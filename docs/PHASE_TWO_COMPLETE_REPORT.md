# 階段二：TypeScript 型別系統建立 - 完成報告

## 1. 概述

本報告概述 DaoDao 專案中 Resource（學習資源）與 Resource Review（資源心得）API 開發的第二階段：TypeScript 型別系統建立。依照專案規範，我們使用 Zod 定義型別並通過 inference 產生 TypeScript 型別，確保型別安全和一致性。

## 2. 完成項目

### 2.1 共用型別定義

在 `src/types/common.types.ts` 中建立了以下共用型別定義：

- **API 回應格式**：標準化的 API 回應格式，包含 `success`, `data`, `message`, `error` 和 `pagination` 欄位
- **分頁相關型別**：分頁查詢參數和分頁元數據型別
- **基本使用者資訊**：簡化版的使用者資訊型別
- **狀態列舉**：資源和心得評價的狀態列舉
- **通用查詢選項**：標準化的查詢選項型別

```typescript
// 通用的 API 回應格式
export const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  message: z.string().optional(),
  error: z.string().optional(),
  pagination: z.object({
    limit: z.number(),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
    nextCursor: z.string().nullable(),
    prevCursor: z.string().nullable(),
    totalEstimate: z.number()
  }).optional()
});

export type ApiResponse<T = any> = z.infer<typeof apiResponseSchema> & { data?: T };
```

### 2.2 Resource 型別定義

在 `src/types/resource.types.ts` 中建立了以下資源相關型別定義：

- **列舉型別**：`ResourceType`, `CostType`, `LevelType` 等
- **基本屬性**：`ResourceBase` 定義了資源的基本屬性
- **操作型別**：`ResourceCreate`, `ResourceUpdate` 等操作型別
- **回應型別**：`ResourceResponse`, `ResourceDetailResponse`, `ResourceListResponse` 等回應型別
- **欄位映射**：`resourceFieldMappings` 提供 API 與資料庫欄位的映射關係

```typescript
// 資源類型 schema
export const resourceTypeSchema = z.enum([
  'learning_platform_app',
  'learning_tools',
  'books_articles',
  'video_content',
  'podcast_content',
  'workshops_courses',
  'professional_certificates',
  'community_organization',
  'other'
]);

export type ResourceType = z.infer<typeof resourceTypeSchema>;
```

### 2.3 ResourceReview 型別定義

在 `src/types/resource-review.types.ts` 中建立了以下心得評價相關型別定義：

- **評分型別**：`scoreSchema` 定義了支援 0.5 分間距的評分型別
- **內容特色型別**：`contentFeaturesSchema` 定義了 9 個 Boolean 屬性的內容特色物件
- **資源使用型別**：`resourceUsageSchema` 定義了 6 個 Boolean 屬性的資源使用物件
- **基本屬性**：`ResourceReviewBase` 定義了心得評價的基本屬性
- **操作型別**：`ResourceReviewCreate`, `ResourceReviewUpdate` 等操作型別
- **回應型別**：`ResourceReviewResponse`, `ResourceReviewListResponse` 等回應型別
- **欄位映射**：`reviewFieldMappings`, `contentFeaturesMappings`, `resourceUsageMappings` 提供各類欄位的映射關係

```typescript
// 內容特色物件 schema
export const contentFeaturesSchema = z.object({
  wellStructured: z.boolean().default(false),    // 結構清晰
  practiceFocused: z.boolean().default(false),   // 實用導向
  wellRoundedConcepts: z.boolean().default(false), // 觀念完整
  thoughtProvoking: z.boolean().default(false),  // 靈感啟發
  progressiveLearning: z.boolean().default(false), // 循序漸進
  problemBased: z.boolean().default(false),      // 問題導向
  realWorldExamples: z.boolean().default(false), // 具體案例
  interactive: z.boolean().default(false),       // 具互動性
  visuallyRich: z.boolean().default(false)       // 圖文並茂
});
```

### 2.4 轉換工具函數

在 `src/utils/transformUtils.ts` 中建立了以下轉換工具函數：

- **Boolean 欄位轉換**：`objectToBooleanFields` 和 `booleanFieldsToObject` 用於處理 Boolean 欄位和物件之間的轉換
- **欄位名稱轉換**：`apiToDbFields` 和 `dbToApiFields` 用於處理 API 欄位和資料庫欄位之間的轉換
- **分頁處理**：`generateCursor` 和 `parseCursor` 用於處理游標分頁

```typescript
/**
 * 將單獨的 Boolean 欄位轉換為物件結構
 * @param dbRecord - 資料庫記錄
 * @param mappings - 欄位映射配置
 * @returns 轉換後的物件
 */
export function booleanFieldsToObject<M extends Record<string, string>>(
  dbRecord: Record<string, any>,
  mappings: M
): Record<keyof M, boolean> {
  const result = {} as Record<keyof M, boolean>;
  
  Object.entries(mappings).forEach(([apiField, dbField]) => {
    result[apiField as keyof M] = Boolean(dbRecord[dbField]);
  });
  
  return result;
}
```

## 3. 設計決策

### 3.1 Zod 驗證與型別推導

遵循專案規範，我們使用 Zod 來定義 schema，並通過 inference 來產生 TypeScript 型別，這樣做有以下優點：

1. **型別安全**：Zod schema 同時提供運行時驗證和編譯時型別檢查
2. **單一來源**：避免了型別定義和驗證邏輯的重複
3. **彈性**：可以更容易地擴展和修改型別定義

### 3.2 欄位映射設計

為了處理 API 欄位和資料庫欄位之間的轉換，我們採用了以下策略：

1. **集中式映射配置**：將所有欄位映射關係放在一個常數物件中
2. **通用轉換函數**：設計了通用的轉換函數，可以根據映射配置進行轉換
3. **型別安全**：使用 TypeScript 泛型和 const assertions 確保型別安全

### 3.3 Boolean 欄位處理

對於需要在 API 中將多個 Boolean 欄位轉換為物件結構的情況，我們設計了專門的處理函數：

1. **獨立映射配置**：為內容特色和資源使用分別建立了映射配置
2. **雙向轉換**：支援從 API 物件到資料庫欄位和從資料庫欄位到 API 物件的雙向轉換
3. **預設值處理**：提供合理的預設值，避免 undefined 或 null 問題

### 3.4 分頁處理

採用游標分頁方式，提高查詢效能：

1. **Base64 編碼**：使用 Base64 編碼游標值，確保安全性
2. **通用處理函數**：提供生成和解析游標的通用函數
3. **彈性設計**：支援多種欄位組合作為游標基礎

## 4. 發現的問題與解決方案

### 4.1 評分精度問題

**問題**：資料庫中的評分欄位支援 0.5 分間距，需要在 Zod schema 中反映。

**解決方案**：使用 `z.number().min(1).max(5).step(0.5)` 定義評分 schema，確保評分值符合要求。

### 4.2 Boolean 欄位轉換複雜度

**問題**：需要處理總共 15 個 Boolean 欄位到 2 個物件結構的轉換，增加了代碼複雜度。

**解決方案**：設計通用的轉換函數和映射配置，簡化轉換邏輯，提高代碼復用性。

### 4.3 型別安全與彈性平衡

**問題**：需要在確保型別安全的同時保持足夠的彈性，處理不同的資料結構。

**解決方案**：使用 TypeScript 泛型和 Zod 的型別推導，在保持型別安全的同時提供足夠的彈性。

## 5. 未來改進方向

### 5.1 強化型別安全

目前部分地方使用了 `any` 型別，未來可以進一步改進：

- 替換所有 `any` 型別為更具體的型別
- 使用 `unknown` 代替 `any` 作為通用型別
- 增加更多的型別守衛和類型斷言

### 5.2 擴展 Zod 驗證

未來可以擴展 Zod 驗證規則：

- 增加更多的欄位驗證邏輯
- 實作自定義的 Zod 驗證器
- 整合更多的業務邏輯到驗證規則中

### 5.3 優化轉換工具

目前的轉換工具可以進一步優化：

- 增加批量轉換功能
- 實作更高效的轉換算法
- 增加轉換過程中的錯誤處理

## 6. 結論

階段二的 TypeScript 型別系統建立已經完成。我們遵循專案規範，使用 Zod 定義了完整的型別系統，並實作了必要的轉換工具。這些成果為後續的模型建立和 API 開發奠定了堅實的基礎，確保了代碼的型別安全和一致性。

## 7. 下一步計劃

準備進入階段三的 TypeScript Sequelize 模型建立：

1. 基於階段二的型別定義，實作 Resource 模型
2. 實作 ResourceReview 模型
3. 實作 Tag 和 EntityTag 模型
4. 設定模型之間的關聯
5. 整合轉換工具與模型操作

完成階段三後，將進入階段四的 Zod 驗證器設計，繼續推進整個開發計劃。
