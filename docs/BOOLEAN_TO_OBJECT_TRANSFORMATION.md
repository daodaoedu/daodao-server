# Boolean 欄位轉換指南 (BOOLEAN_TO_OBJECT_TRANSFORMATION)

## 簡介

本文件詳細說明 DaoDao 專案中處理 Boolean 欄位到物件結構的轉換策略與最佳實踐。在 Resource Review API 中，資料庫使用了多個 Boolean 欄位來儲存心得評價的內容特色和資源使用情況，但在 API 層面，這些欄位被組織成結構化的物件，以提供更好的使用體驗。本指南詳述這些轉換的技術實現方式和建議做法。

## 需求背景

### 資料庫設計
在資料庫中，`resource_review` 表包含：
- 9 個描述內容特色的 Boolean 欄位（`well_structured`、`practice_focused` 等）
- 6 個描述資源使用情況的 Boolean 欄位（`with_online_courses`、`with_books` 等）

### API 要求
在 API 回應中，這些欄位需要組織成兩個結構化物件：
- `contentFeatures`：包含 9 個 Boolean 屬性
- `resourceUsage`：包含 6 個 Boolean 屬性

## 轉換映射關係

### 內容特色映射

| 資料庫欄位 | API 欄位 (contentFeatures) | 說明 |
|-----------|------------------------|------|
| well_structured | wellStructured | 結構清晰 |
| practice_focused | practiceFocused | 實用導向 |
| well_rounded_concepts | wellRoundedConcepts | 觀念完整 |
| thought_provoking | thoughtProvoking | 靈感啟發 |
| progressive_learning | progressiveLearning | 循序漸進 |
| problem_based | problemBased | 問題導向 |
| real_world_examples | realWorldExamples | 具體案例 |
| interactive | interactive | 具互動性 |
| visually_rich | visuallyRich | 圖文並茂 |

### 資源使用映射

| 資料庫欄位 | API 欄位 (resourceUsage) | 說明 |
|-----------|----------------------|------|
| with_online_courses | withOnlineCourses | 搭配線上課程 |
| with_books | withBooks | 搭配書籍 |
| with_other_tools | withOtherTools | 搭配其他工具 |
| with_community | withCommunity | 搭配社群 |
| only_this_resource | onlyThisResource | 僅使用此資源 |
| not_applicable_resource | notApplicableResource | 不適用 |

## 轉換實現方案

### 1. 映射配置定義

為了維護映射關係的一致性和可擴展性，我們建立映射配置：

```typescript
// src/constants/mappings.ts

// 內容特色欄位映射配置
export const contentFeaturesMappings = {
  wellStructured: 'well_structured',
  practiceFocused: 'practice_focused',
  wellRoundedConcepts: 'well_rounded_concepts',
  thoughtProvoking: 'thought_provoking',
  progressiveLearning: 'progressive_learning',
  problemBased: 'problem_based',
  realWorldExamples: 'real_world_examples',
  interactive: 'interactive',
  visuallyRich: 'visually_rich'
} as const;

// 資源使用欄位映射配置
export const resourceUsageMappings = {
  withOnlineCourses: 'with_online_courses',
  withBooks: 'with_books',
  withOtherTools: 'with_other_tools',
  withCommunity: 'with_community',
  onlyThisResource: 'only_this_resource',
  notApplicableResource: 'not_applicable_resource'
} as const;

// 映射配置類型
export type MappingConfig = Record<string, string>;
```

### 2. 通用轉換函數

設計通用的轉換函數，可處理任意映射配置：

```typescript
// src/utils/transformUtils.ts

import { MappingConfig } from '../constants/mappings';

/**
 * 將單獨的 Boolean 欄位轉換為物件結構
 * @param dbRecord - 資料庫記錄
 * @param mappings - 欄位映射配置
 * @returns 轉換後的物件
 */
export function booleanFieldsToObject<M extends MappingConfig>(
  dbRecord: Record<string, any>,
  mappings: M
): Record<keyof M, boolean> {
  const result = {} as Record<keyof M, boolean>;
  
  Object.entries(mappings).forEach(([apiField, dbField]) => {
    result[apiField as keyof M] = Boolean(dbRecord[dbField]);
  });
  
  return result;
}

/**
 * 將物件結構轉換為單獨的 Boolean 欄位
 * @param obj - 來源物件
 * @param mappings - 欄位映射配置
 * @returns 轉換後的物件
 */
export function objectToBooleanFields<T extends Record<string, boolean>, M extends MappingConfig>(
  obj: T | undefined,
  mappings: M
): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  
  // 設定所有可能的欄位為 false (預設值)
  Object.values(mappings).forEach(dbField => {
    result[dbField] = false;
  });
  
  // 如果來源物件存在，則根據映射設定值
  if (obj) {
    Object.entries(mappings).forEach(([apiField, dbField]) => {
      if (apiField in obj) {
        result[dbField] = Boolean(obj[apiField as keyof T]);
      }
    });
  }
  
  return result;
}
```

## 實際使用範例

### 在資料轉換服務中使用

```typescript
// src/services/transformService.ts

import { 
  contentFeaturesMappings, 
  resourceUsageMappings 
} from '../constants/mappings';
import { 
  booleanFieldsToObject, 
  objectToBooleanFields 
} from '../utils/transformUtils';

/**
 * 將資料庫 ResourceReview 記錄轉換為 API 回應格式
 * @param dbReview - 資料庫心得評價記錄
 * @returns API格式的心得評價對象
 */
export function transformReviewToApi(dbReview: any) {
  return {
    id: dbReview.id,
    content: dbReview.content,
    
    // 評分欄位轉換
    overallImpact: dbReview.score_impact,
    changeMindset: dbReview.score_mindset,
    solveProblems: dbReview.score_problems,
    gainPerspectives: dbReview.score_perspectives,
    achieveGoals: dbReview.score_goals,
    
    // Boolean 欄位轉物件 - 使用通用函數
    contentFeatures: booleanFieldsToObject(dbReview, contentFeaturesMappings),
    resourceUsage: booleanFieldsToObject(dbReview, resourceUsageMappings),
    
    timeUsage: dbReview.time_usage,
    status: dbReview.status,
    createdAt: dbReview.created_at,
    updatedAt: dbReview.updated_at,
    userId: dbReview.user_id,
    resourceId: dbReview.resource_id
  };
}

/**
 * 將 API 心得評價格式轉換為資料庫格式
 * @param apiReview - API格式的心得評價
 * @returns 資料庫格式的心得評價對象
 */
export function transformReviewToDb(apiReview: any) {
  // 轉換 Boolean 物件結構 - 使用通用函數
  const contentFeatureFields = objectToBooleanFields(
    apiReview.contentFeatures, 
    contentFeaturesMappings
  );
  
  const resourceUsageFields = objectToBooleanFields(
    apiReview.resourceUsage, 
    resourceUsageMappings
  );
  
  return {
    content: apiReview.content,
    
    // 評分欄位轉換
    score_impact: apiReview.overallImpact,
    score_mindset: apiReview.changeMindset,
    score_problems: apiReview.solveProblems,
    score_perspectives: apiReview.gainPerspectives,
    score_goals: apiReview.achieveGoals,
    
    // 時間使用
    time_usage: apiReview.timeUsage,
    
    // 展開轉換後的 Boolean 欄位
    ...contentFeatureFields,
    ...resourceUsageFields,
    
    status: apiReview.status
  };
}
```

### 在控制器中使用

```typescript
// src/controllers/resourceReview.ts

import { Request, Response } from 'express';
import { asyncWrapper } from '../utils/errorHandler';
import { 
  transformReviewToApi,
  transformReviewToDb
} from '../services/transformService';
import ResourceReview from '../models/resourceReview';

/**
 * 獲取單個心得評價
 */
export const getReviewById = asyncWrapper(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const review = await ResourceReview.findByPk(id);
  
  if (!review) {
    return res.status(404).json({
      success: false,
      message: '找不到指定心得評價'
    });
  }
  
  // 使用轉換函數將資料庫記錄轉換為 API 格式
  const apiReview = transformReviewToApi(review);
  
  return res.json({
    success: true,
    data: apiReview
  });
});

/**
 * 建立新心得評價
 */
export const createReview = asyncWrapper(async (req: Request, res: Response) => {
  const { resourceId } = req.params;
  const userId = req.user?.id;
  
  // 使用轉換函數將 API 請求轉換為資料庫格式
  const dbReview = transformReviewToDb({
    ...req.body,
    resource_id: resourceId,
    user_id: userId
  });
  
  const newReview = await ResourceReview.create(dbReview);
  
  // 轉換回 API 格式返回
  const apiReview = transformReviewToApi(newReview);
  
  return res.status(201).json({
    success: true,
    data: apiReview
  });
});
```

## Zod 驗證整合

與 Zod 驗證器整合，確保輸入資料的結構正確：

```typescript
// src/validators/resourceReview.validator.ts

import { z } from 'zod';
import { 
  timeUsageSchema, 
  scoreSchema 
} from '../types/resource-review.types';

// 內容特色物件 schema
export const contentFeaturesSchema = z.object({
  wellStructured: z.boolean().default(false),
  practiceFocused: z.boolean().default(false),
  wellRoundedConcepts: z.boolean().default(false),
  thoughtProvoking: z.boolean().default(false),
  progressiveLearning: z.boolean().default(false),
  problemBased: z.boolean().default(false),
  realWorldExamples: z.boolean().default(false),
  interactive: z.boolean().default(false),
  visuallyRich: z.boolean().default(false)
});

// 資源使用物件 schema
export const resourceUsageSchema = z.object({
  withOnlineCourses: z.boolean().default(false),
  withBooks: z.boolean().default(false),
  withOtherTools: z.boolean().default(false),
  withCommunity: z.boolean().default(false),
  onlyThisResource: z.boolean().default(false),
  notApplicableResource: z.boolean().default(false)
});

// 心得評價驗證 schema
export const resourceReviewSchema = z.object({
  content: z.string().min(1),
  overallImpact: scoreSchema,
  changeMindset: scoreSchema,
  solveProblems: scoreSchema,
  gainPerspectives: scoreSchema,
  achieveGoals: scoreSchema,
  timeUsage: timeUsageSchema,
  contentFeatures: contentFeaturesSchema.optional(),
  resourceUsage: resourceUsageSchema.optional(),
  tags: z.array(z.string()).optional()
});

// 使用 zod 推導型別
export type ResourceReviewSchema = z.infer<typeof resourceReviewSchema>;
```

## 效能考量

### 查詢效能
對於需要根據 Boolean 屬性進行查詢的情況，可以直接查詢資料庫欄位，而不需要進行物件轉換：

```typescript
// 查詢具有特定特色的心得評價
async function findReviewsByFeature(feature: keyof typeof contentFeaturesMappings) {
  const dbField = contentFeaturesMappings[feature];
  
  const reviews = await ResourceReview.findAll({
    where: {
      [dbField]: true
    }
  });
  
  return reviews.map(transformReviewToApi);
}
```

### 聚合查詢
對於需要計算特定 Boolean 屬性的聚合結果的情況：

```typescript
// 計算特定特色的心得評價數量
async function countReviewsByFeature(feature: keyof typeof contentFeaturesMappings) {
  const dbField = contentFeaturesMappings[feature];
  
  const count = await ResourceReview.count({
    where: {
      [dbField]: true
    }
  });
  
  return count;
}
```

## 最佳實踐

1. **使用映射配置**：維護集中式的映射配置，避免硬編碼
2. **通用轉換函數**：使用通用轉換函數處理不同的 Boolean 欄位集合
3. **型別安全**：利用 TypeScript 泛型和 Zod 確保型別安全
4. **預設值處理**：為所有 Boolean 欄位提供合理的預設值（通常為 `false`）
5. **測試覆蓋**：為轉換函數編寫完整的單元測試，確保轉換邏輯正確

## 測試示例

```typescript
// src/tests/unit/transformUtils.test.ts

import { 
  booleanFieldsToObject, 
  objectToBooleanFields 
} from '../../utils/transformUtils';

describe('Boolean 欄位轉換函數測試', () => {
  // 測試映射配置
  const testMappings = {
    propA: 'field_a',
    propB: 'field_b',
    propC: 'field_c'
  };
  
  describe('booleanFieldsToObject', () => {
    it('應正確轉換 Boolean 欄位到物件結構', () => {
      const dbRecord = {
        field_a: true,
        field_b: false,
        field_c: true
      };
      
      const result = booleanFieldsToObject(dbRecord, testMappings);
      
      expect(result).toEqual({
        propA: true,
        propB: false,
        propC: true
      });
    });
    
    it('應處理非 Boolean 值並轉換為 Boolean 型別', () => {
      const dbRecord = {
        field_a: 1,
        field_b: 0,
        field_c: 'yes'
      };
      
      const result = booleanFieldsToObject(dbRecord, testMappings);
      
      expect(result).toEqual({
        propA: true,
        propB: false,
        propC: true
      });
    });
    
    it('應處理欄位缺失的情況', () => {
      const dbRecord = {
        field_a: true
      };
      
      const result = booleanFieldsToObject(dbRecord, testMappings);
      
      expect(result).toEqual({
        propA: true,
        propB: false,
        propC: false
      });
    });
  });
  
  describe('objectToBooleanFields', () => {
    it('應正確轉換物件結構到 Boolean 欄位', () => {
      const obj = {
        propA: true,
        propB: false,
        propC: true
      };
      
      const result = objectToBooleanFields(obj, testMappings);
      
      expect(result).toEqual({
        field_a: true,
        field_b: false,
        field_c: true
      });
    });
    
    it('應處理物件為 undefined 的情況', () => {
      const result = objectToBooleanFields(undefined, testMappings);
      
      expect(result).toEqual({
        field_a: false,
        field_b: false,
        field_c: false
      });
    });
    
    it('應處理物件屬性缺失的情況', () => {
      const obj = {
        propA: true
      };
      
      const result = objectToBooleanFields(obj, testMappings);
      
      expect(result).toEqual({
        field_a: true,
        field_b: false,
        field_c: false
      });
    });
  });
});
```

## 相關文件

- [FIELD_MAPPING_GUIDE.md](./FIELD_MAPPING_GUIDE.md) - 欄位映射指南
- [DATABASE_STRUCTURE_UPDATE.md](./DATABASE_STRUCTURE_UPDATE.md) - 資料表結構更新記錄
- [RESOURCE_API_DEVELOPMENT_PLAN.md](./RESOURCE_API_DEVELOPMENT_PLAN.md) - 開發計劃文件

## 版本控制

**文件版本**：v1.0  
**最後更新**：2024年度  
**維護者**：DaoDao 後端開發團隊
