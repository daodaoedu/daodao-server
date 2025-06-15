# 階段一：架構分析與準備 - 完成報告

## 1. 專案架構分析概述

本報告完成 DaoDao 專案中 Resource（學習資源）與 Resource Review（資源心得）API 開發的第一階段：架構分析與準備。基於現有資料庫表結構和 API 規格要求，我們已完成必要的分析工作，為後續的 TypeScript 型別系統建立奠定基礎。

## 2. 資料表結構分析

### 2.1 Resources 表結構

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

### 2.2 Resource_Review 表結構

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

### 2.3 標籤系統表結構

**Tags 表**
```sql
CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE, -- 標籤名稱
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Entity_Tags 表**
```sql
CREATE TABLE entity_tags (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN (
        'resource', 'idea', 'project', 'practice', 'circle', 'user'
    )),
    entity_id INT NOT NULL, -- 對應實體的 ID
    tag_id INT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE(entity_type, entity_id, tag_id)
);
```

## 3. 欄位映射關係

經過分析，以下是資料庫欄位與 API 欄位的完整對應關係：

### 3.1 Resource 表欄位映射

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

### 3.2 Resource Review 表欄位映射

| 資料庫欄位 | API 欄位 | 型別 | 說明 |
|-----------|----------|------|------|
| id | id | number | 心得 ID |
| user_id | userId | number | 使用者 ID |
| resource_id | resourceId | number | 資源 ID |
| content | content | string | 心得內容 |
| score_impact | overallImpact | number | 整體影響評分 |
| score_mindset | changeMindset | number | 改變思維評分 |
| score_problems | solveProblems | number | 解決問題評分 |
| score_perspectives | gainPerspectives | number | 獲得視角評分 |
| score_goals | achieveGoals | number | 達成目標評分 |
| time_usage | timeUsage | string | 時間運用方式 |
| status | status | string | 心得狀態 |
| created_at | createdAt | Date | 建立時間 |
| updated_at | updatedAt | Date | 更新時間 |
| deleted_at | deletedAt | Date | 刪除時間 (軟刪除) |

### 3.3 Boolean 欄位特殊處理

資料庫中的 15 個 Boolean 欄位將轉換為 API 中的兩個物件：

**內容特色欄位映射**
| 資料庫欄位 | API 欄位 (contentFeatures 物件) |
|-----------|---------------------------|
| well_structured | wellStructured |
| practice_focused | practiceFocused |
| well_rounded_concepts | wellRoundedConcepts |
| thought_provoking | thoughtProvoking |
| progressive_learning | progressiveLearning |
| problem_based | problemBased |
| real_world_examples | realWorldExamples |
| interactive | interactive |
| visually_rich | visuallyRich |

**資源使用欄位映射**
| 資料庫欄位 | API 欄位 (resourceUsage 物件) |
|-----------|--------------------------|
| with_online_courses | withOnlineCourses |
| with_books | withBooks |
| with_other_tools | withOtherTools |
| with_community | withCommunity |
| only_this_resource | onlyThisResource |
| not_applicable_resource | notApplicableResource |

## 4. 現有相關模型分析

### 4.1 User 模型分析

User 模型與 Resource 和 ResourceReview 表有關聯：
- 資源的 `created_by` 欄位關聯到 User 的 `id`
- 心得的 `user_id` 欄位關聯到 User 的 `id`

User 模型提供以下關鍵欄位：
- `id`: 使用者唯一識別碼
- `name`: 使用者名稱
- `email`: 使用者電子郵件
- `_id`: 外部系統 ID
- `roleList`: 使用者角色列表
- `photoURL`: 使用者頭像 URL

在 API 回應中，部分 User 資訊會包含在 Resource 和 ResourceReview 中：

```json
"user": {
  "id": 42,
  "name": "小許",
  "_id": "b4996c36-722d-409b-a5c6-853827ddc471",
  "roleList": ["citizen", "experimental-educator", "other"],
  "photoURL": "https://lh3.googleusercontent.com/a/photo.jpg"
}
```

### 4.2 Categories 模型分析

Categories 模型與 Resource 表有關聯：
- 資源的 `major_category_id` 和 `sub_category_id` 欄位關聯到 Categories 的 `id`

Categories 模型提供以下關鍵欄位：
- `id`: 分類唯一識別碼
- `name`: 分類名稱
- `key`: 分類鍵值（用於 API 和國際化）
- `parent_id`: 父分類 ID（若為子分類）
- `level`: 分類層級（1為主分類，2為子分類）

在 API 請求和回應中，分類會以 `majorCategory` 和 `subCategory` 欄位表示。

### 4.3 Tag 相關模型分析

標籤系統由兩個表組成：
- `tags`: 儲存標籤名稱
- `entity_tags`: 儲存實體與標籤的關聯

關鍵欄位：
- `tags.id`: 標籤唯一識別碼
- `tags.name`: 標籤名稱
- `entity_tags.entity_type`: 實體類型（如 'resource', 'resource_review'）
- `entity_tags.entity_id`: 實體 ID
- `entity_tags.tag_id`: 標籤 ID

在 API 回應中，標籤會以字串陣列形式包含在 Resource 和 ResourceReview 中：

```json
"tags": ["react", "javascript", "frontend"]
```

## 5. API 規格關鍵特性

### 5.1 資源 API 關鍵特性

- **游標分頁**: 使用 `cursor` 和 `limit` 參數實現高效分頁
- **多維度篩選**: 支援 `type`, `cost`, `level`, `majorCategory`, `subCategory`, `tags` 等篩選
- **全文搜尋**: 透過 `query` 參數實現
- **排序選項**: 支援 `sort` 和 `order` 參數
- **巢狀操作**: 在建立/更新資源時可同時處理心得評價
- **標籤系統**: 支援為資源添加多個標籤

### 5.2 心得評價 API 關鍵特性

- **評分系統**: 支援 5 個獨立評分項目，每項 1-5 分，支援 0.5 分間距
- **內容特色**: 使用 9 個 Boolean 欄位描述心得特色，API 中以物件表示
- **資源使用**: 使用 6 個 Boolean 欄位描述資源使用情況，API 中以物件表示
- **唯一限制**: 每用戶每資源只能有一個心得評價
- **標籤系統**: 心得評價也可以有獨立的標籤

### 5.3 通用 API 特性

- **統一回應格式**: 所有 API 使用統一的回應格式，包含 `success`, `data`, `message` 等欄位
- **錯誤處理**: 使用標準化錯誤回應格式
- **軟刪除**: 使用 `deleted_at` 欄位實現軟刪除
- **時間格式**: 所有時間欄位使用 ISO 8601 格式

## 6. 發現的技術債務

### 6.1 欄位命名差異

原先預期的欄位命名與實際資料表結構存在差異：
- 實際資料表使用了更簡化的命名方式，如 `name` 而非 `resource_name`
- 評分欄位使用 `score_` 前綴，而非 API 中的命名

### 6.2 評分精度差異

評分欄位使用 `NUMERIC(2,1)` 支援 0.5 分間距，需要在 Zod 驗證中使用 `step(0.5)` 處理。

### 6.3 Boolean 欄位轉換複雜度

需要處理 15 個 Boolean 欄位到 2 個物件結構的轉換，增加了代碼複雜度。

### 6.4 標籤系統整合

資源和心得評價都需要支援標籤功能，需要設計通用的標籤管理服務。

## 7. 建議的架構優化

### 7.1 資料轉換策略

建立通用轉換函數，處理不同類型的欄位映射：

```typescript
/**
 * 將資料庫記錄轉換為 API 格式
 */
function transformDbToApi<T extends Record<string, any>>(
  dbRecord: Record<string, any>,
  mappings: Record<string, string>
): T {
  const result: Record<string, any> = {};
  
  Object.entries(mappings).forEach(([apiField, dbField]) => {
    result[apiField] = dbRecord[dbField];
  });
  
  return result as T;
}
```

### 7.2 Boolean 欄位處理

使用專門的映射配置和轉換函數處理 Boolean 欄位：

```typescript
// 內容特色欄位映射配置
const contentFeaturesMappings = {
  wellStructured: 'well_structured',
  practiceFocused: 'practice_focused',
  // ... 其他映射
};

// 通用 Boolean 欄位轉換函數
function booleanFieldsToObject<M extends Record<string, string>>(
  dbRecord: Record<string, any>,
  mappings: M
): Record<keyof M, boolean> {
  // ... 實現邏輯
}
```

### 7.3 Zod 驗證設計

針對評分精度和物件結構設計適當的 Zod 驗證：

```typescript
// 評分 schema (支援 0.5 分間距)
const scoreSchema = z.number().min(1).max(5).step(0.5);

// 內容特色物件 schema
const contentFeaturesSchema = z.object({
  wellStructured: z.boolean().default(false),
  // ... 其他欄位
});
```

### 7.4 模型關聯優化

設計合理的模型關聯，支援高效查詢：

```typescript
// 設定 Resource 和 ResourceReview 的一對多關聯
Resource.hasMany(ResourceReview, { foreignKey: 'resource_id', as: 'reviews' });
ResourceReview.belongsTo(Resource, { foreignKey: 'resource_id', as: 'resource' });

// 設定標籤的多對多關聯
// ... 關聯設定
```

## 8. 下一步行動項目

### 8.1 立即執行項目

1. **建立 TypeScript 型別定義**
   - 使用 Zod 建立 Resource 和 ResourceReview 的型別定義
   - 建立列舉值型別定義
   - 建立資料轉換函數型別定義

2. **設計資料轉換工具**
   - 實現通用欄位映射轉換函數
   - 實現 Boolean 欄位到物件的轉換函數
   - 建立映射配置常數

### 8.2 準備項目

1. **設計 Sequelize 模型**
   - 設計 Resource 模型
   - 設計 ResourceReview 模型
   - 設計 Tag 和 EntityTag 模型

2. **設計 Zod 驗證器**
   - 設計 Resource 驗證器
   - 設計 ResourceReview 驗證器
   - 設計通用驗證工具

## 9. 結論

完成階段一的架構分析與準備工作，我們已經：

1. 詳細分析了資料表結構和欄位約束
2. 確定了資料庫欄位與 API 欄位的完整對應關係
3. 分析了現有相關模型和關聯關係
4. 識別了技術債務和優化機會
5. 提出了架構優化建議
6. 制定了下一步行動計劃

此分析為後續的 TypeScript 型別系統建立和模型開發奠定了堅實基礎。

## 附錄：參考資料

1. `DATABASE_STRUCTURE_UPDATE.md` - 資料表結構詳細說明
2. `RESOURCE_API_DEVELOPMENT_PLAN.md` - 開發計劃文件
3. `FIELD_MAPPING_GUIDE.md` - 欄位映射指南
4. `BOOLEAN_TO_OBJECT_TRANSFORMATION.md` - Boolean 欄位轉換指南
5. `Resource.md` - API 規格文件
