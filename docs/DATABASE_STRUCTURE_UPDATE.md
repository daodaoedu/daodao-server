# 資料庫結構更新紀錄

## 更新日期
2024年度 - 資料表結構確認與 API 規格調整

## 📊 實際資料表結構

### Resources 表
根據實際建立的資料表，主要欄位如下：

```sql
CREATE TABLE resources (
    id SERIAL PRIMARY KEY,
    created_by INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- 分類資訊
    major_category_id INT REFERENCES categories(id),
    sub_category_id INT REFERENCES categories(id),
    
    -- 基本資源資訊
    name VARCHAR(255) NOT NULL,              -- 資源名稱
    url VARCHAR(1000) NOT NULL,               -- 資源網址
    image_url VARCHAR(1000),                  -- 封面圖
    description TEXT NOT NULL,               -- 資源描述
    video_url VARCHAR(1000),                  -- 影片連結
    
    -- 分類屬性
    type VARCHAR(100) NOT NULL CHECK (type IN (
        'learning_platform_app', 'learning_tools', 'books_articles', 'video_content',
        'podcast_content', 'workshops_courses', 'professional_certificates', 
        'community_organization', 'other'
    )),
    
    -- 費用類型
    cost VARCHAR(50) NOT NULL CHECK (cost IN (
        'free', 'paid', 'partial_free'
    )),
    
    -- 適合程度
    level VARCHAR(50) NOT NULL DEFAULT 'all_levels' CHECK (level IN (
        'beginner', 'intermediate', 'expert', 'all_levels'
    )),
    
    -- 狀態管理
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN (
        'draft', 'active', 'archived', 'reported'
    )),
    
    -- 系統欄位
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);
```

### Resource_Review 表
心得評價表的完整結構：

```sql
CREATE TABLE resource_review (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resource_id INT NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    
    -- 評分項目 (1-5分，支援 0.5 分間距，使用 NUMERIC(2,1))
    score_impact NUMERIC(2, 1) NOT NULL CHECK (score_impact BETWEEN 1.0 AND 5.0),
    score_mindset NUMERIC(2, 1) NOT NULL CHECK (score_mindset BETWEEN 1.0 AND 5.0),
    score_problems NUMERIC(2, 1) NOT NULL CHECK (score_problems BETWEEN 1.0 AND 5.0),
    score_perspectives NUMERIC(2, 1) NOT NULL CHECK (score_perspectives BETWEEN 1.0 AND 5.0),
    score_goals NUMERIC(2, 1) NOT NULL CHECK (score_goals BETWEEN 1.0 AND 5.0),
    
    -- 心得內容
    content TEXT NOT NULL,
    
    -- 內容特色（9個 Boolean 欄位）
    well_structured BOOLEAN DEFAULT FALSE,           -- 結構清晰
    practice_focused BOOLEAN DEFAULT FALSE,          -- 實用導向
    well_rounded_concepts BOOLEAN DEFAULT FALSE,     -- 觀念完整
    thought_provoking BOOLEAN DEFAULT FALSE,         -- 靈感啟發
    progressive_learning BOOLEAN DEFAULT FALSE,      -- 循序漸進
    problem_based BOOLEAN DEFAULT FALSE,             -- 問題導向
    real_world_examples BOOLEAN DEFAULT FALSE,       -- 具體案例
    interactive BOOLEAN DEFAULT FALSE,               -- 具互動性
    visually_rich BOOLEAN DEFAULT FALSE,             -- 圖文並茂
    
    -- 時間運用（單選）
    time_usage VARCHAR(30) CHECK (time_usage IN (
        '1_2_hours_daily',           -- 每日1-2小時
        'few_intensive_days_week',   -- 每週密集幾天
        'spare_moments',             -- 零散時間
        'not_applicable_time'        -- 時間不適用
    )),
    
    -- 資源搭配使用（6個 Boolean 欄位）
    with_online_courses BOOLEAN DEFAULT FALSE,       -- 搭配線上課程
    with_books BOOLEAN DEFAULT FALSE,                -- 搭配書籍
    with_other_tools BOOLEAN DEFAULT FALSE,          -- 搭配其他工具
    with_community BOOLEAN DEFAULT FALSE,            -- 搭配社群
    only_this_resource BOOLEAN DEFAULT FALSE,        -- 僅使用此資源
    not_applicable_resource BOOLEAN DEFAULT FALSE,   -- 不適用
    
    -- 狀態管理
    status VARCHAR(20) DEFAULT 'published' CHECK (status IN (
        'draft', 'published', 'archived', 'reported'
    )),
    
    -- 系統欄位
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    
    -- 唯一性約束：每用戶每資源只能有一個心得
    UNIQUE(user_id, resource_id)
);
```

## 🔄 重要發現與調整

### 1. 欄位命名調整
實際資料表使用了更簡化的命名方式：

**之前預期** → **實際結構**
- `resource_name` → `name`
- `resource_url` → `url` 
- `img_url` → `image_url`
- `description_text` → `description`
- `intro_video_url` → `video_url`
- `suitable_level` → `level`
- `resource_type` → `type`

### 2. 評分欄位精確化
實際採用 `NUMERIC(2,1)` 資料型別，支援 0.5 分間距：
- `score_impact` (API 層: `overallImpact`)
- `score_mindset` (API 層: `changeMindset`)
- `score_problems` (API 層: `solveProblems`)
- `score_perspectives` (API 層: `gainPerspectives`)
- `score_goals` (API 層: `achieveGoals`)

### 3. 時間使用選項更新
實際的 `time_usage` 選項：
- `1_2_hours_daily` - 每日1-2小時
- `few_intensive_days_week` - 每週密集幾天
- `spare_moments` - 零散時間
- `not_applicable_time` - 時間不適用

### 4. 資源類型完整清單
```sql
type IN (
    'learning_platform_app',      -- 學習平台應用
    'learning_tools',             -- 學習工具
    'books_articles',             -- 書籍文章
    'video_content',              -- 影片內容
    'podcast_content',            -- 播客內容
    'workshops_courses',          -- 工作坊課程
    'professional_certificates',  -- 專業證照
    'community_organization',     -- 社群組織
    'other'                       -- 其他
)
```

### 5. 索引策略
實際建立的索引：
```sql
-- 資源表索引
CREATE INDEX idx_resource_type ON resources(type);
CREATE INDEX idx_resource_cost ON resources(cost);
CREATE INDEX idx_resource_created_by ON resources(created_by);
CREATE INDEX idx_resource_created_at ON resources(created_at);
CREATE INDEX idx_resource_level ON resources(level);
CREATE INDEX idx_resource_type_cost_level ON resources(type, cost, level);

-- 心得評價表索引
CREATE INDEX idx_review_resource_id ON resource_review(resource_id);
CREATE INDEX idx_review_user_id ON resource_review(user_id);
```

## 🔧 API 規格調整需求

### TypeScript 型別定義更新
根據專案規範，需要使用 Zod schema 建立以下型別定義：

1. **Resource 相關型別**
   ```typescript
   import { z } from 'zod';
   
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
   
   // 費用類型 schema
   export const costTypeSchema = z.enum([
     'free',
     'paid',
     'partial_free'
   ]);
   
   export type CostType = z.infer<typeof costTypeSchema>;
   
   // 程度類型 schema
   export const levelTypeSchema = z.enum([
     'beginner',
     'intermediate',
     'expert',
     'all_levels'
   ]);
   
   export type LevelType = z.infer<typeof levelTypeSchema>;
   ```

2. **ResourceReview 相關型別**
   ```typescript
   import { z } from 'zod';
   
   // 時間使用選項 schema
   export const timeUsageSchema = z.enum([
     '1_2_hours_daily',
     'few_intensive_days_week',
     'spare_moments',
     'not_applicable_time'
   ]);
   
   export type TimeUsage = z.infer<typeof timeUsageSchema>;
   
   // 評分 schema (支援 0.5 分間距)
   export const scoreSchema = z.number().min(1).max(5).step(0.5);
   
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
   
   export type ContentFeatures = z.infer<typeof contentFeaturesSchema>;
   
   // 資源使用物件 schema
   export const resourceUsageSchema = z.object({
     withOnlineCourses: z.boolean().default(false),
     withBooks: z.boolean().default(false),
     withOtherTools: z.boolean().default(false),
     withCommunity: z.boolean().default(false),
     onlyThisResource: z.boolean().default(false),
     notApplicableResource: z.boolean().default(false)
   });
   
   export type ResourceUsage = z.infer<typeof resourceUsageSchema>;
   ```

### 資料轉換邏輯
需要建立精確的轉換函數，採用函數式設計：

```typescript
/**
 * 將資料庫 Resource 記錄轉換為 API 回應格式
 * @param dbResource - 資料庫資源記錄
 * @returns API格式的資源對象
 */
export function transformResourceToApi(dbResource: any) {
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
    // ... 其他欄位轉換
  };
}

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

/**
 * 將 API 心得評價格式轉換為資料庫格式
 * @param apiReview - API格式的心得評價
 * @returns 資料庫格式的心得評價對象
 */
export function transformReviewToDb(apiReview: any) {
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
    not_applicable_resource: apiReview.resourceUsage?.notApplicableResource || false
  };
}
```

## 🆕 資料轉換工具設計

為了處理 15 個 Boolean 欄位到物件結構的轉換，需要設計專門的資料轉換工具。建議採用以下方式：

### 1. 轉換映射表
建立明確的欄位映射配置，使轉換邏輯更清晰：

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

### 2. 通用轉換函數
建立可重複使用的通用轉換函數：

```typescript
/**
 * 將物件結構轉換為單獨的 Boolean 欄位
 * @param obj - 來源物件
 * @param mappings - 欄位映射配置
 * @returns 轉換後的物件
 */
export function objectToBooleanFields<T extends Record<string, boolean>, M extends Record<string, string>>(
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

## ✅ 後續行動項目

### 立即更新
- [ ] 使用 Zod 更新 TypeScript 型別定義
- [ ] 建立資料轉換函數
- [ ] 實作 Sequelize 模型定義
- [ ] 建立 Zod 驗證器

### 驗證項目
- [ ] 確認所有欄位對應正確
- [ ] 測試資料轉換函數
- [ ] 驗證約束條件符合業務邏輯
- [ ] 檢查索引效能

### 文件更新
- [ ] 建立 FIELD_MAPPING_GUIDE.md 文件
- [ ] 建立 BOOLEAN_TO_OBJECT_TRANSFORMATION.md 文件

## 📝 結論

實際資料表結構採用了更簡化的命名方式，且支援了更精確的評分系統（0.5分間距）。我們需要使用 Zod schema 來定義型別，並建立函數式的資料轉換邏輯，以確保資料庫欄位和 API 回應欄位之間的正確映射。特別是對於 15 個 Boolean 欄位到物件結構的轉換，需要建立通用的轉換工具以提高代碼的可維護性。

透過建立清晰的欄位映射關係和通用的轉換函數，我們可以簡化資料處理邏輯，並確保 API 回應格式的一致性。同時，使用 Zod 進行型別定義和驗證可以提供完整的型別安全保障，讓開發過程更加穩健。

**下一步：實作 TypeScript 型別定義和資料轉換函數** 🚀
