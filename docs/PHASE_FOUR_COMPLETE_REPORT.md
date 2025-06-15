# 階段四：Zod 驗證器設計 - 完成報告

## 1. 概述

本報告概述 DaoDao 專案中 Resource（學習資源）與 Resource Review（資源心得）API 開發的第四階段：Zod 驗證器設計。依照專案規範，我們使用 Zod 這個 TypeScript 優先的資料驗證庫建立了完善的輸入驗證系統，確保 API 接收到的資料符合預期的結構和約束條件。

## 2. 完成項目

### 2.1 Resource 驗證器

在 `src/validators/resource.validator.ts` 中建立了 Resource 相關驗證器，實現了以下功能：

- **列舉值驗證**：為 `type`、`cost`、`level`、`status` 等欄位建立了嚴格的列舉值驗證
- **URL 欄位驗證**：加強了 URL 驗證邏輯，包含格式檢查和長度限制
- **多層級驗證結構**：建立了基礎驗證 Schema、創建驗證 Schema 和更新驗證 Schema
- **巢狀評論支援**：在建立資源時支援同時提交資源評論

```typescript
// 資源類型驗證
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

// 資源基本驗證 Schema
export const resourceBaseSchema = z.object({
  name: z.string()
    .min(1, { message: "資源名稱不能為空" })
    .max(255, { message: "資源名稱不能超過255個字符" }),
  url: urlSchema,
  imageUrl: urlSchema.optional().nullable(),
  description: z.string()
    .min(1, { message: "資源描述不能為空" }),
  videoUrl: urlSchema.optional().nullable(),
  type: resourceTypeSchema,
  cost: costTypeSchema,
  level: levelTypeSchema.default('all_levels'),
  majorCategoryId: z.number().int().positive().optional().nullable(),
  subCategoryId: z.number().int().positive().optional().nullable(),
  tags: z.array(z.string()).optional()
});
```

### 2.2 ResourceReview 驗證器

在 `src/validators/resourceReview.validator.ts` 中建立了 ResourceReview 相關驗證器，包含：

- **評分欄位驗證**：嚴格檢查評分在 1.0-5.0 之間，並且只允許 0.5 分間距
- **內容特色物件驗證**：驗證 9 個內容特色的 Boolean 欄位結構
- **資源使用物件驗證**：驗證 6 個資源使用的 Boolean 欄位結構
- **時間使用列舉值驗證**：建立時間使用選項的嚴格列舉值驗證
- **狀態驗證**：針對不同操作階段的狀態驗證

```typescript
// 評分驗證 (支援 0.5 分間距)
export const scoreSchema = z.number()
  .min(1.0, { message: "評分最低為1.0" })
  .max(5.0, { message: "評分最高為5.0" })
  .refine(value => {
    const decimal = value % 1;
    return decimal === 0 || decimal === 0.5;
  }, { message: "評分必須以0.5為間距（如1.0, 1.5, 2.0等）" });

// 內容特色物件 schema
export const contentFeaturesSchema = z.object({
  wellStructured: z.boolean().default(false),
  practiceFocused: z.boolean().default(false),
  wellRoundedConcepts: z.boolean().default(false),
  // ... 其他內容特色欄位
});
```

### 2.3 驗證中間件

在 `src/validators/validation.middleware.ts` 中建立了通用的驗證中間件，實現了：

- **統一的驗證處理流程**：可用於 body、query 和 params 的驗證
- **友好的錯誤訊息格式**：將 Zod 錯誤轉換為更易讀的格式
- **無縫整合 Express**：通過中間件方式與路由處理器整合

```typescript
export const validate = (schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = schema.parse(req[source]);
      req[source] = data; // 替換為已驗證的資料
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: '驗證失敗',
          errors: formatZodErrors(error)
        });
      }
      return next(error);
    }
  };
};
```

### 2.4 單元測試

為所有驗證器和中間件編寫了完整的單元測試，確保驗證邏輯的正確性和穩定性：

- **Resource 驗證器測試**：測試不同情境下的資源驗證邏輯
- **ResourceReview 驗證器測試**：測試評論相關的驗證規則
- **驗證中間件測試**：測試中間件的錯誤處理和正確行為

這些測試涵蓋了有效輸入、無效輸入、邊界條件和特殊情況，確保驗證系統在各種情況下都能正確運行。

## 3. 設計決策

### 3.1 使用 Zod 而非其他驗證庫

選擇 Zod 作為驗證庫的原因：

- **與 TypeScript 深度整合**：通過 `z.infer` 可以直接從 schema 生成 TypeScript 型別
- **易讀的錯誤訊息**：提供清晰、結構化的錯誤訊息
- **強大的鏈式 API**：支援複雜的條件驗證和自定義驗證邏輯
- **無縫轉換**：驗證的同時自動進行型別轉換，符合項目需求

### 3.2 驗證器結構設計

採用了分層的驗證器結構設計：

- **基礎 Schema**：包含完整的欄位定義和基本驗證邏輯
- **操作特定 Schema**：針對不同操作（創建、更新等）進行定制
- **部分更新支援**：通過 `partial()` 方法支援部分欄位更新

這種結構使得驗證器易於維護和擴展，避免了重複代碼。

### 3.3 友好的錯誤訊息

設計了友好、易於理解的錯誤訊息：

- **本地化錯誤訊息**：使用繁體中文編寫錯誤訊息，符合用戶語境
- **欄位特定錯誤**：為不同欄位提供特定的錯誤訊息
- **結構化錯誤輸出**：以結構化的格式返回錯誤，方便前端處理

### 3.4 預設值處理

為許多欄位設定了合理的預設值：

- **Boolean 欄位**：預設為 `false`
- **程度欄位**：預設為 `all_levels`
- **物件欄位**：預設為空物件

這確保了即使用戶未提供某些欄位，API 也能正常運行。

## 4. 發現的問題與解決方案

### 4.1 Boolean 物件結構的驗證問題

**問題**：如何有效驗證 contentFeatures 和 resourceUsage 這類物件結構。

**解決方案**：創建專門的物件 schema，並為每個 Boolean 欄位設定預設值，確保即使用戶提供部分欄位也能正確處理。

```typescript
export const contentFeaturesSchema = z.object({
  wellStructured: z.boolean().default(false),
  practiceFocused: z.boolean().default(false),
  // ... 其他欄位
}).optional().default({});
```

### 4.2 評分間距驗證

**問題**：需要確保評分只能是 1.0、1.5、2.0 等 0.5 間距的數值。

**解決方案**：使用 Zod 的 `refine` 方法添加自定義驗證邏輯：

```typescript
export const scoreSchema = z.number()
  .min(1.0, { message: "評分最低為1.0" })
  .max(5.0, { message: "評分最高為5.0" })
  .refine(value => {
    const decimal = value % 1;
    return decimal === 0 || decimal === 0.5;
  }, { message: "評分必須以0.5為間距（如1.0, 1.5, 2.0等）" });
```

### 4.3 巢狀資源與評論的驗證

**問題**：如何支援在創建資源時同時提交資源評論。

**解決方案**：在創建資源的 schema 中添加可選的巢狀評論 schema：

```typescript
export const createResourceSchema = resourceBaseSchema.extend({
  // 可選的巢狀評論
  review: resourceReviewSchema.optional()
});
```

## 5. 與階段三的集成

本階段的驗證器設計與階段三的 Sequelize 模型緊密集成：

- **欄位定義一致性**：確保驗證器的欄位定義與模型的欄位定義一致
- **類型安全性**：驗證器生成的 TypeScript 型別與模型的型別定義兼容
- **錯誤處理協調**：驗證錯誤與模型層錯誤的統一處理

這種集成確保了資料從請求到資料庫的完整驗證流程。

## 6. 未來改進方向

### 6.1 驗證邏輯擴展

隨著業務需求的發展，可以進一步擴展驗證邏輯：

- **跨欄位驗證**：實現依賴於多個欄位的複雜驗證規則
- **動態驗證規則**：基於系統配置或用戶角色動態調整驗證規則
- **預設值函數**：使用函數生成預設值，而非靜態值

### 6.2 國際化支援

為驗證錯誤訊息添加國際化支援：

- **多語言錯誤訊息**：根據用戶偏好顯示不同語言的錯誤訊息
- **錯誤訊息模板**：使用模板系統生成更動態的錯誤訊息

### 6.3 驗證效能優化

針對大型請求的驗證效能進行優化：

- **延遲驗證**：對於不需要立即驗證的大型結構，實現延遲驗證
- **驗證快取**：對於常見的請求模式，實現驗證結果快取

## 7. 結論

階段四的 Zod 驗證器設計已經完成。我們建立了完善的輸入驗證系統，涵蓋了 Resource 和 ResourceReview 相關的所有操作。這些驗證器不僅確保了 API 接收到的資料符合預期的結構和約束條件，還提供了友好的錯誤訊息和無縫的 TypeScript 型別整合。

通過使用 Zod，我們實現了類型安全的驗證系統，大大減少了運行時錯誤的可能性，並為下一階段的服務層開發奠定了堅實的基礎。

## 8. 下一步計劃

準備進入階段五的服務層開發：

1. 基於階段三的 Sequelize 模型，實作 Resource 服務層
2. 實作 ResourceReview 服務層
3. 實作 Tag 相關服務
4. 整合資料轉換邏輯，處理資料庫與 API 格式之間的轉換

完成階段五後，將進入階段六的控制器開發，繼續推進整個開發計劃。
