# 欄位映射指南 (FIELD_MAPPING_GUIDE)

## 簡介

本文件詳細說明 DaoDao 專案中 Resource（學習資源）與 Resource Review（資源心得）相關 API 的欄位映射關係。由於資料庫使用蛇形命名法（snake_case）而 API 使用駝峰命名法（camelCase），本指南旨在提供清晰的映射參考，確保開發過程中的一致性。

## 資料庫與 API 欄位映射表

### 1. Resource 表欄位映射

| 資料庫欄位 | API 欄位 | 型別 | 說明 |
|-----------|----------|------|------|
| id | id | number | 資源 ID |
| name | name | string | 資源名稱 |
| url | url | string | 資源網址 |
| image_url | imageUrl | string | 資源圖片 URL |
| description | description | string | 資源描述 |
| video_url | videoUrl | string | 影片連結 |
| type | type | string | 資源類型 |
| cost | cost | string | 費用類型 |
| level | level | string | 適合程度 |
| major_category_id | majorCategoryId | number | 主分類 ID |
| sub_category_id | subCategoryId | number | 子分類 ID |
| created_by | createdBy | number | 建立者 ID |
| status | status | string | 資源狀態 |
| created_at | createdAt | Date | 建立時間 |
| updated_at | updatedAt | Date | 更新時間 |
| deleted_at | deletedAt | Date | 刪除時間 (軟刪除) |

### 2. Resource Review 表欄位映射

| 資料庫欄位 | API 欄位 | 型別 | 說明 |
|-----------|----------|------|------|
| id | id | number | 心得 ID |
| user_id | userId | number | 使用者 ID |
| resource_id | resourceId | number | 資源 ID |
| content | content | string | 心得內容 |
| score_impact | overallImpact | number | 整體影響評分 (1-5分，支援0.5分間距) |
| score_mindset | changeMindset | number | 改變思維評分 (1-5分，支援0.5分間距) |
| score_problems | solveProblems | number | 解決問題評分 (1-5分，支援0.5分間距) |
| score_perspectives | gainPerspectives | number | 獲得視角評分 (1-5分，支援0.5分間距) |
| score_goals | achieveGoals | number | 達成目標評分 (1-5分，支援0.5分間距) |
| time_usage | timeUsage | string | 時間運用方式 |
| status | status | string | 心得狀態 |
| created_at | createdAt | Date | 建立時間 |
| updated_at | updatedAt | Date | 更新時間 |
| deleted_at | deletedAt | Date | 刪除時間 (軟刪除) |

### 3. 內容特色欄位映射 (Boolean 到物件)

資料庫中使用 9 個 Boolean 欄位，API 中轉換為 `contentFeatures` 物件。

| 資料庫欄位 | API 欄位 (contentFeatures 中的屬性) | 型別 | 說明 |
|-----------|----------------------------------|------|------|
| well_structured | wellStructured | boolean | 結構清晰 |
| practice_focused | practiceFocused | boolean | 實用導向 |
| well_rounded_concepts | wellRoundedConcepts | boolean | 觀念完整 |
| thought_provoking | thoughtProvoking | boolean | 靈感啟發 |
| progressive_learning | progressiveLearning | boolean | 循序漸進 |
| problem_based | problemBased | boolean | 問題導向 |
| real_world_examples | realWorldExamples | boolean | 具體案例 |
| interactive | interactive | boolean | 具互動性 |
| visually_rich | visuallyRich | boolean | 圖文並茂 |

### 4. 資源使用欄位映射 (Boolean 到物件)

資料庫中使用 6 個 Boolean 欄位，API 中轉換為 `resourceUsage` 物件。

| 資料庫欄位 | API 欄位 (resourceUsage 中的屬性) | 型別 | 說明 |
|-----------|--------------------------------|------|------|
| with_online_courses | withOnlineCourses | boolean | 搭配線上課程 |
| with_books | withBooks | boolean | 搭配書籍 |
| with_other_tools | withOtherTools | boolean | 搭配其他工具 |
| with_community | withCommunity | boolean | 搭配社群 |
| only_this_resource | onlyThisResource | boolean | 僅使用此資源 |
| not_applicable_resource | notApplicableResource | boolean | 不適用 |

## 列舉值對照表

### 1. 資源類型 (type)

| 資料庫值 | API 值 | 說明 |
|---------|-------|------|
| learning_platform_app | learning_platform_app | 學習平台應用 |
| learning_tools | learning_tools | 學習工具 |
| books_articles | books_articles | 書籍文章 |
| video_content | video_content | 影片內容 |
| podcast_content | podcast_content | 播客內容 |
| workshops_courses | workshops_courses | 工作坊課程 |
| professional_certificates | professional_certificates | 專業證照 |
| community_organization | community_organization | 社群組織 |
| other | other | 其他 |

### 2. 費用類型 (cost)

| 資料庫值 | API 值 | 說明 |
|---------|-------|------|
| free | free | 免費 |
| paid | paid | 付費 |
| partial_free | partial_free | 部分免費 |

### 3. 程度類型 (level)

| 資料庫值 | API 值 | 說明 |
|---------|-------|------|
| beginner | beginner | 初學者 |
| intermediate | intermediate | 進階 |
| expert | expert | 專家 |
| all_levels | all_levels | 不分程度 |

### 4. 時間運用 (time_usage)

| 資料庫值 | API 值 | 說明 |
|---------|-------|------|
| 1_2_hours_daily | 1_2_hours_daily | 每日1-2小時 |
| few_intensive_days_week | few_intensive_days_week | 每週密集幾天 |
| spare_moments | spare_moments | 零散時間 |
| not_applicable_time | not_applicable_time | 時間不適用 |

### 5. 狀態 (status)

#### 資源狀態
| 資料庫值 | API 值 | 說明 |
|---------|-------|------|
| draft | draft | 草稿 |
| active | active | 啟用 |
| archived | archived | 封存 |
| reported | reported | 被檢舉 |

#### 心得狀態
| 資料庫值 | API 值 | 說明 |
|---------|-------|------|
| draft | draft | 草稿 |
| published | published | 已發布 |
| archived | archived | 封存 |
| reported | reported | 被檢舉 |

## 資料轉換映射配置

以下是用於資料轉換的映射配置程式碼：

```typescript
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
```

## 使用範例

### 資料庫到 API 的轉換範例

```typescript
// 資源轉換範例
function transformResourceToApi(dbResource: any) {
  return {
    id: dbResource.id,
    name: dbResource.name,
    url: dbResource.url,
    imageUrl: dbResource.image_url,
    description: dbResource.description,
    videoUrl: dbResource.video_url,
    type: dbResource.type,
    cost: dbResource.cost,
    level: dbResource.level,
    majorCategoryId: dbResource.major_category_id,
    subCategoryId: dbResource.sub_category_id,
    status: dbResource.status,
    createdAt: dbResource.created_at,
    updatedAt: dbResource.updated_at,
    deletedAt: dbResource.deleted_at
  };
}

// 心得評價轉換範例
function transformReviewToApi(dbReview: any) {
  return {
    id: dbReview.id,
    content: dbReview.content,
    
    // 評分欄位轉換
    overallImpact: dbReview.score_impact,
    changeMindset: dbReview.score_mindset,
    solveProblems: dbReview.score_problems,
    gainPerspectives: dbReview.score_perspectives,
    achieveGoals: dbReview.score_goals,
    
    // Boolean 欄位轉物件
    contentFeatures: {
      wellStructured: dbReview.well_structured,
      practiceFocused: dbReview.practice_focused,
      wellRoundedConcepts: dbReview.well_rounded_concepts,
      thoughtProvoking: dbReview.thought_provoking,
      progressiveLearning: dbReview.progressive_learning,
      problemBased: dbReview.problem_based,
      realWorldExamples: dbReview.real_world_examples,
      interactive: dbReview.interactive,
      visuallyRich: dbReview.visually_rich
    },
    
    resourceUsage: {
      withOnlineCourses: dbReview.with_online_courses,
      withBooks: dbReview.with_books,
      withOtherTools: dbReview.with_other_tools,
      withCommunity: dbReview.with_community,
      onlyThisResource: dbReview.only_this_resource,
      notApplicableResource: dbReview.not_applicable_resource
    },
    
    timeUsage: dbReview.time_usage,
    status: dbReview.status,
    createdAt: dbReview.created_at,
    updatedAt: dbReview.updated_at,
    userId: dbReview.user_id,
    resourceId: dbReview.resource_id
  };
}
```

### API 到資料庫的轉換範例

```typescript
// 資源轉換範例
function transformResourceToDb(apiResource: any) {
  return {
    name: apiResource.name,
    url: apiResource.url,
    image_url: apiResource.imageUrl,
    description: apiResource.description,
    video_url: apiResource.videoUrl,
    type: apiResource.type,
    cost: apiResource.cost,
    level: apiResource.level,
    major_category_id: apiResource.majorCategoryId,
    sub_category_id: apiResource.subCategoryId,
    status: apiResource.status
  };
}

// 心得評價轉換範例
function transformReviewToDb(apiReview: any) {
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
    
    // 內容特色物件拆解為 Boolean 欄位
    well_structured: apiReview.contentFeatures?.wellStructured || false,
    practice_focused: apiReview.contentFeatures?.practiceFocused || false,
    well_rounded_concepts: apiReview.contentFeatures?.wellRoundedConcepts || false,
    thought_provoking: apiReview.contentFeatures?.thoughtProvoking || false,
    progressive_learning: apiReview.contentFeatures?.progressiveLearning || false,
    problem_based: apiReview.contentFeatures?.problemBased || false,
    real_world_examples: apiReview.contentFeatures?.realWorldExamples || false,
    interactive: apiReview.contentFeatures?.interactive || false,
    visually_rich: apiReview.contentFeatures?.visuallyRich || false,
    
    // 資源使用物件拆解為 Boolean 欄位
    with_online_courses: apiReview.resourceUsage?.withOnlineCourses || false,
    with_books: apiReview.resourceUsage?.withBooks || false,
    with_other_tools: apiReview.resourceUsage?.withOtherTools || false,
    with_community: apiReview.resourceUsage?.withCommunity || false,
    only_this_resource: apiReview.resourceUsage?.onlyThisResource || false,
    not_applicable_resource: apiReview.resourceUsage?.notApplicableResource || false,
    
    status: apiReview.status
  };
}
```

## 最佳實踐

1. **避免硬編碼**：使用本文件中的映射配置，避免在代碼中硬編碼欄位映射
2. **使用通用轉換函數**：對於 Boolean 欄位的轉換，使用通用轉換函數
3. **測試覆蓋**：為所有轉換函數編寫單元測試，確保轉換邏輯正確
4. **完整性檢查**：轉換時檢查所有必要欄位是否存在
5. **預設值處理**：對於可選欄位，提供合理的預設值

## 相關文件

- [DATABASE_STRUCTURE_UPDATE.md](./DATABASE_STRUCTURE_UPDATE.md) - 資料表結構詳細說明
- [BOOLEAN_TO_OBJECT_TRANSFORMATION.md](./BOOLEAN_TO_OBJECT_TRANSFORMATION.md) - Boolean 欄位轉換指南
- [RESOURCE_API_DEVELOPMENT_PLAN.md](./RESOURCE_API_DEVELOPMENT_PLAN.md) - 開發計劃文件

## 版本控制

**文件版本**：v1.0  
**最後更新**：2024年度  
**維護者**：DaoDao 後端開發團隊
