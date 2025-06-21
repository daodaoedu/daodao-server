# Resource 與 Resource Review API 開發計劃

## 專案概述

本文件規劃 DaoDao 專案中 Resource（學習資源）與 Resource Review（資源心得）API 的完整開發計劃。基於現有資料庫表結構 (`resources`, `resource_review`, `tags`, `entity_tags`) 進行 **TypeScript 漸進式導入** 的 API 開發。

## 🔧 TypeScript 導入策略

### 技術架構決策
- **新開發模組**：全面使用 TypeScript (.ts)
- **現有模組**：保持 JavaScript (.js)，避免影響系統穩定性
- **漸進式遷移**：依照 `.cursor/rules/typescript-swagger-guide.mdc` 規範執行

### TypeScript 設定
- ✅ **tsconfig.json**：已建立專案 TypeScript 配置
- ✅ **型別定義**：建立完整的型別系統
- ✅ **編譯設定**：支援 JavaScript 和 TypeScript 混合使用

## 現有資料表結構分析

### Resources 表
- **主要欄位**：`name`, `url`, `image_url`, `description`, `video_url`
- **分類系統**：`major_category_id`, `sub_category_id` (關聯 categories 表)
- **屬性分類**：`type`, `cost`, `level`
- **狀態管理**：`status`, `created_at`, `updated_at`, `deleted_at`

### Resource_Review 表
- **評分系統**：5個獨立評分項目 (1-5分，支援0.5分間距) - `score_impact`, `score_mindset`, `score_problems`, `score_perspectives`, `score_goals`
- **內容特色**：9個 Boolean 欄位描述資源特色 (`well_structured`, `practice_focused` 等)
- **使用體驗**：`time_usage` 和多個資源搭配使用的 Boolean 欄位
- **限制**：每用戶每資源只能有一個心得 (UNIQUE 約束)

### 標籤系統
- **Tags 表**：標籤名稱存儲
- **Entity_Tags 表**：多對多關聯，支援多種實體類型的標籤

## 開發階段規劃

### 🔍 階段一：架構分析與準備 (1-2天) ✅ 已完成

#### 1.1 現有架構分析
- [x] **比對 Resource.md 規格與實際表結構差異**
  - [x] 欄位命名差異分析 (蛇形 vs 駝峰)
  - [x] 缺失欄位識別
  - [x] 資料類型差異分析

- [x] **確認需要調整的對應關係** ✅ 已更新
  ```typescript
  // 資料庫欄位 → API 回應欄位
  name → name
  url → url
  image_url → imageUrl
  description → description
  video_url → videoUrl
  level → level
  type → type
  
  // 評分欄位映射
  score_impact → overallImpact
  score_mindset → changeMindset
  score_problems → solveProblems
  score_perspectives → gainPerspectives
  score_goals → achieveGoals
  ```

- [x] **檢查現有相關模型**
  - [x] User 模型分析
  - [x] Categories 模型確認  
  - [x] 現有 Tag 相關模型檢查

### ✅ 階段二：TypeScript 型別系統建立 (2-3天) ✅ 已完成

#### 2.1 核心型別定義
- [ ] **建立 `src/types/common.types.ts`** - 共用型別和基本定義
- [ ] **建立 `src/types/resource.types.ts`** - Resource 完整型別定義
  ```typescript
  import { z } from 'zod';
  
  // 定義資源類型 schema
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
  
  // 使用 inference 產生型別
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

- [ ] **建立 `src/types/resource-review.types.ts`** - ResourceReview 完整型別定義
  ```typescript
  import { z } from 'zod';
  
  // 定義時間使用選項 schema
  export const timeUsageSchema = z.enum([
    '1_2_hours_daily',
    'few_intensive_days_week',
    'spare_moments',
    'not_applicable_time'
  ]);
  
  export type TimeUsage = z.infer<typeof timeUsageSchema>;
  
  // 定義評分 schema (支援 0.5 分間距)
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

### 🗄️ 階段三：TypeScript Sequelize 模型建立 (2-3天) 🔄 進行中

#### 3.1 Resource 模型 (TypeScript)
- [ ] **建立 `models/resource.ts`** - 使用 TypeScript 和型別定義
  ```typescript
  import { DataTypes, Model, Optional } from 'sequelize';
  import sequelize from '@/config/database';
  
  // 定義資料庫屬性接口
  export interface ResourceAttributes {
    id: number;
    name: string;
    url: string;
    image_url?: string;
    description: string;
    video_url?: string;
    type: string;
    cost: string;
    level: string;
    major_category_id?: number;
    sub_category_id?: number;
    created_by: number;
    status: string;
    created_at: Date;
    updated_at: Date;
    deleted_at?: Date;
  }
  
  // 建立資源時的可選屬性
  export interface ResourceCreationAttributes extends Optional<ResourceAttributes, 'id' | 'created_at' | 'updated_at' | 'deleted_at'> {}
  
  // 定義 Resource 模型
  const Resource = sequelize.define<Model<ResourceAttributes, ResourceCreationAttributes>>(
    'Resource',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      url: {
        type: DataTypes.STRING(1000),
        allowNull: false,
      },
      image_url: {
        type: DataTypes.STRING(1000),
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      // ... 其他欄位定義
    },
    {
      tableName: 'resources',
      timestamps: true,
      underscored: true,
      paranoid: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    }
  );
  
  export default Resource;
  ```

- [ ] **API 規格更新** - 支援新的心得分享機制和欄位結構

#### 3.2 ResourceReview 模型 (TypeScript)
- [ ] **建立 `models/resourceReview.ts`** - TypeScript 版本
  ```typescript
  import { DataTypes, Model, Optional } from 'sequelize';
  import sequelize from '../config/database';
  
  // 定義資料庫屬性接口
  export interface ResourceReviewAttributes {
    id: number;
    user_id: number;
    resource_id: number;
    content: string;
    score_impact: number;
    score_mindset: number;
    score_problems: number;
    score_perspectives: number;
    score_goals: number;
    
    // Boolean 欄位
    well_structured: boolean;
    practice_focused: boolean;
    well_rounded_concepts: boolean;
    thought_provoking: boolean;
    progressive_learning: boolean;
    problem_based: boolean;
    real_world_examples: boolean;
    interactive: boolean;
    visually_rich: boolean;
    
    time_usage: string;
    
    with_online_courses: boolean;
    with_books: boolean;
    with_other_tools: boolean;
    with_community: boolean;
    only_this_resource: boolean;
    not_applicable_resource: boolean;
    
    status: string;
    created_at: Date;
    updated_at: Date;
    deleted_at?: Date;
  }
  
  // 建立心得評價時的可選屬性
  export interface ResourceReviewCreationAttributes extends Optional<ResourceReviewAttributes, 'id' | 'created_at' | 'updated_at' | 'deleted_at'> {}
  
  // 定義 ResourceReview 模型
  const ResourceReview = sequelize.define<Model<ResourceReviewAttributes, ResourceReviewCreationAttributes>>(
    'ResourceReview',
    {
      // ... 欄位定義
    },
    {
      tableName: 'resource_review',
      timestamps: true,
      underscored: true,
      paranoid: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    }
  );
  
  export default ResourceReview;
  ```

- [ ] **整合新的心得評價結構** - contentFeatures 和 resourceUsage 物件化設計

#### 3.3 標籤系統模型 (TypeScript)
- [ ] **建立 `models/tag.ts`** - TypeScript 版本
- [ ] **建立 `models/entityTag.ts`** - TypeScript 版本

#### 3.4 模型關聯設定
- [ ] **更新 `models/index.ts`** - 混合 JS/TS 模型的關聯設定

### ✅ 階段四：Zod 驗證器設計 (1-2天)

#### 4.1 Resource 驗證器 (TypeScript)
- [ ] **建立 `validators/resource.validator.ts`** - 使用 Zod 和 TypeScript
  ```typescript
  import { z } from 'zod';
  import { resourceTypeSchema, costTypeSchema, levelTypeSchema } from '@/types/resource.types';
  
  // 建立資源驗證 Schema
  export const resourceSchema = z.object({
    name: z.string().min(1).max(255),
    url: z.string().url().max(1000),
    imageUrl: z.string().url().max(1000).optional(),
    description: z.string().min(1),
    videoUrl: z.string().url().max(1000).optional(),
    type: resourceTypeSchema,
    cost: costTypeSchema,
    level: levelTypeSchema.default('all_levels'),
    majorCategoryId: z.number().int().positive().optional(),
    subCategoryId: z.number().int().positive().optional(),
    tags: z.array(z.string()).optional(),
    
    // 巢狀 review 結構 (用於同時建立)
    review: z.object({
      // ... 評價欄位
    }).optional()
  });
  
  // 使用 zod 推導型別
  export type ResourceSchema = z.infer<typeof resourceSchema>;
  ```

#### 4.2 ResourceReview 驗證器 (TypeScript)
- [ ] **建立 `validators/resourceReview.validator.ts`** - 使用 Zod 和 TypeScript
  ```typescript
  import { z } from 'zod';
  import { timeUsageSchema, scoreSchema, contentFeaturesSchema, resourceUsageSchema } from '@/types/resource-review.types';
  
  // 建立心得評價驗證 Schema
  export const resourceReviewSchema = z.object({
    content: z.string().min(1),
    overallImpact: scoreSchema,
    changeMindset: scoreSchema,
    solveProblems: scoreSchema,
    gainPerspectives: scoreSchema,
    achieveGoals: scoreSchema,
    timeUsage: timeUsageSchema,
    
    // 物件化的內容特色和資源使用欄位
    contentFeatures: contentFeaturesSchema,
    resourceUsage: resourceUsageSchema,
    
    tags: z.array(z.string()).optional()
  });
  
  // 使用 zod 推導型別
  export type ResourceReviewSchema = z.infer<typeof resourceReviewSchema>;
  ```

### 🔧 階段五：服務層開發 (TypeScript) (3-4天)

#### 5.1 資料轉換服務 (TypeScript)
- [ ] **建立 `services/transformService.ts`** - 處理資料庫記錄與 API 格式的轉換
  ```typescript
  import { ResourceAttributes } from '@/models/resource';
  import { ResourceReviewAttributes } from '@/models/resourceReview';
  
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
      
      // ... 其他欄位
    };
  }
  
  /**
   * 將 API 心得評價格式轉換為資料庫格式
   * @param apiReview - API格式的心得評價
   * @returns 資料庫格式的心得評價對象
   */
  export function transformReviewToDb(apiReview: any) {
    // 實作 API 到資料庫的轉換
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
      // ... 其他內容特色
      
      // 資源使用物件拆解為 Boolean 欄位
      with_online_courses: apiReview.resourceUsage?.withOnlineCourses || false,
      with_books: apiReview.resourceUsage?.withBooks || false,
      // ... 其他資源使用欄位
    };
  }
  ```

#### 5.2 Resource Service (TypeScript)
- [ ] **建立 `services/resourceService.ts`** - 完整型別安全的服務層
  ```typescript
  import { Transaction } from 'sequelize';
  import Resource from '@/models/resource';
  import { ResourceCreationAttributes, ResourceAttributes } from '@/models/resource';
  import { transformResourceToApi } from '@/services/transformService';
  
  /**
   * 建立新資源
   * @param data - 資源建立資料
   * @param userId - 建立者 ID
   * @param transaction - 可選事務對象
   * @returns 新建立的資源
   */
  export async function createResource(
    data: any, 
    userId: number,
    transaction?: Transaction
  ) {
    // 實作建立資源邏輯
    const resource = await Resource.create(
      {
        name: data.name,
        url: data.url,
        image_url: data.imageUrl,
        description: data.description,
        video_url: data.videoUrl,
        type: data.type,
        cost: data.cost,
        level: data.level,
        major_category_id: data.majorCategoryId,
        sub_category_id: data.subCategoryId,
        created_by: userId,
        status: 'active'
      },
      { transaction }
    );
    
    return transformResourceToApi(resource);
  }
  
  /**
   * 獲取資源列表
   * @param filters - 過濾參數
   * @param pagination - 分頁參數
   * @returns 分頁資源列表和分頁元數據
   */
  export async function getResources(
    filters: any,
    pagination: any
  ) {
    // 實作分頁查詢邏輯
    // ...
  }
  
  /**
   * 獲取單個資源
   * @param id - 資源 ID
   * @returns 資源詳情
   */
  export async function getResourceById(id: number) {
    // 實作獲取單個資源邏輯
    // ...
  }
  
  /**
   * 更新資源
   * @param id - 資源 ID
   * @param data - 更新資料
   * @param userId - 更新者 ID
   * @returns 更新後的資源
   */
  export async function updateResource(
    id: number,
    data: any,
    userId: number
  ) {
    // 實作更新資源邏輯
    // ...
  }
  
  /**
   * 刪除資源
   * @param id - 資源 ID
   * @param userId - 操作者 ID
   * @returns 是否成功
   */
  export async function deleteResource(
    id: number,
    userId: number
  ) {
    // 實作刪除資源邏輯
    // ...
  }
  
  // 匯出所有函數
  export const resourceService = {
    createResource,
    getResources,
    getResourceById,
    updateResource,
    deleteResource
  };
  
  export default resourceService;
  ```

#### 5.3 ResourceReview Service (TypeScript)
- [ ] **建立 `services/resourceReviewService.ts`** - 包含 Boolean 到陣列轉換邏輯

#### 5.4 Tag Service (TypeScript)
- [ ] **建立 `services/tagService.ts`** - 標籤管理服務

### 🎮 階段六：控制器開發 (TypeScript) (3-4天)

#### 6.1 Resource Controller (TypeScript)
- [ ] **建立 `controllers/resource.ts`** - 型別安全的控制器
  ```typescript
  import { Request, Response, NextFunction } from 'express';
  import { asyncWrapper } from '@/utils/errorHandler';
  import { resourceService } from '@/services/resourceService';
  import { resourceSchema } from '@/validators/resource.validator';
  
  /**
   * 獲取資源列表
   * @param req - Express 請求對象
   * @param res - Express 回應對象
   */
  export const getResources = asyncWrapper(async (req: Request, res: Response) => {
    // 解析查詢參數
    const { cursor, limit, type, cost, level, majorCategory, subCategory, tags, sort, order, query } = req.query;
    
    // 構建過濾器
    const filters = {
      type: type as string,
      cost: cost as string,
      level: level as string,
      majorCategory: majorCategory as string,
      subCategory: subCategory as string,
      tags: tags ? (tags as string).split(',') : undefined,
      query: query as string
    };
    
    // 構建分頁參數
    const pagination = {
      cursor: cursor as string,
      limit: limit ? parseInt(limit as string) : 20,
      sort: sort as string || 'createdAt',
      order: order as 'asc' | 'desc' || 'desc'
    };
    
    // 獲取資源列表
    const result = await resourceService.getResources(filters, pagination);
    
    // 返回結果
    return res.json({
      success: true,
      data: result
    });
  });
  
  /**
   * 獲取單個資源
   * @param req - Express 請求對象
   * @param res - Express 回應對象
   */
  export const getResourceById = asyncWrapper(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    
    const resource = await resourceService.getResourceById(id);
    
    return res.json({
      success: true,
      data: resource
    });
  });
  
  /**
   * 建立新資源
   * @param req - Express 請求對象
   * @param res - Express 回應對象
   */
  export const createResource = asyncWrapper(async (req: Request, res: Response) => {
    // 驗證請求資料
    const validData = resourceSchema.parse(req.body);
    
    // 獲取當前用戶 ID
    const userId = req.user?.id;
    
    // 建立資源
    const result = await resourceService.createResource(validData, userId);
    
    // 返回結果
    return res.status(201).json({
      success: true,
      data: result
    });
  });
  
  // 匯出所有控制器函數
  export const resourceController = {
    getResources,
    getResourceById,
    createResource,
    // ... 其他控制器方法
  };
  
  export default resourceController;
  ```

#### 6.2 ResourceReview Controller (TypeScript)
- [ ] **建立 `controllers/resourceReview.ts`** - 巢狀路由控制器

### 🛣️ 階段七：路由設定 (TypeScript) (1天)

#### 7.1 Resource 路由 (TypeScript)
- [ ] **建立 `routes/resource.ts`** - RESTful 路由設計
  ```typescript
  import { Router } from 'express';
  import { resourceController } from '@/controllers/resource';
  import { authenticate } from '@/middlewares/auth';
  
  const router = Router();
  
  // 公共路由
  router.get('/', resourceController.getResources);
  router.get('/:id', resourceController.getResourceById);
  
  // 需要認證的路由
  router.post('/', authenticate, resourceController.createResource);
  router.patch('/:id', authenticate, resourceController.updateResource);
  router.delete('/:id', authenticate, resourceController.deleteResource);
  
  export default router;
  ```

#### 7.2 ResourceReview 路由 (TypeScript)
- [ ] **建立 `routes/resourceReview.ts`** - 巢狀路由實作
  ```typescript
  import { Router } from 'express';
  import { resourceReviewController } from '@/controllers/resourceReview';
  import { authenticate } from '@/middlewares/auth';
  
  const router = Router({ mergeParams: true }); // 合併參數，支援巢狀路由
  
  // 公共路由
  router.get('/', resourceReviewController.getReviews);
  
  // 需要認證的路由
  router.post('/', authenticate, resourceReviewController.createReview);
  router.patch('/:reviewId', authenticate, resourceReviewController.updateReview);
  router.delete('/:reviewId', authenticate, resourceReviewController.deleteReview);
  
  export default router;
  ```

#### 7.3 主路由整合
- [ ] **更新主應用程式路由** - 整合新的 TypeScript 路由
  ```typescript
  import { Router } from 'express';
  import resourceRoutes from '@/routes/resource';
  import resourceReviewRoutes from '@/routes/resourceReview';
  
  const router = Router();
  
  // 資源路由
  router.use('/resources', resourceRoutes);
  
  // 資源心得評價路由 (巢狀路由)
  router.use('/resources/:id/reviews', resourceReviewRoutes);
  
  export default router;
  ```

### 📚 階段八：Swagger 文件撰寫 (2-3天)

#### 8.1 TypeScript Schema 定義
- [ ] **定義 Resource Swagger Schema** - 基於 TypeScript 型別
- [ ] **定義 ResourceReview Swagger Schema** - 基於 TypeScript 型別

#### 8.2 API 端點文件
- [ ] **Resource API 完整文件** - 包含型別安全的範例
- [ ] **ResourceReview API 完整文件** - 巢狀路由文件

### 🔧 階段九：中間件與工具開發 (TypeScript) (1-2天)

#### 9.1 認證與權限中間件 (TypeScript)
- [ ] **建立 `middlewares/resourceAuth.ts`** - 型別安全的權限檢查

#### 9.2 統計更新工具 (TypeScript)
- [ ] **建立 `middlewares/resourceStats.ts`** - 自動統計更新

#### 9.3 快取中間件 (TypeScript)
- [ ] **建立 `middlewares/resourceCache.ts`** - Redis 快取實作

### 🧪 階段十：測試開發 (TypeScript) (2-3天)

#### 10.1 單元測試 (TypeScript)
- [ ] **建立 `tests/unit/resource.service.test.ts`**
- [ ] **建立 `tests/unit/resourceReview.service.test.ts`**
- [ ] **建立 `tests/unit/transformService.test.ts`**

#### 10.2 整合測試 (TypeScript)
- [ ] **建立 `tests/integration/resource.api.test.ts`**
- [ ] **建立 `tests/integration/resourceReview.api.test.ts`**

### ⚡ 階段十一：效能最佳化 (1-2天)

#### 11.1 查詢最佳化
- [ ] **TypeScript 查詢型別優化**
- [ ] **關聯查詢效能測試**

#### 11.2 快取策略
- [ ] **TypeScript Redis 快取實作**

### 🚀 階段十二：部署準備 (1天)

#### 12.1 TypeScript 編譯配置
- [ ] **生產環境編譯設定**
- [ ] **型別檢查 CI/CD 整合**

#### 12.2 文件整理
- [ ] **TypeScript API 使用指南**
- [ ] **型別定義文件**

## 🆕 修正後的專案結構規劃

基於 TypeScript 導入策略和專案規範，新增的檔案組織如下：

```
├── tsconfig.json                   # ✅ TypeScript 配置
src/
├── types/                          # TypeScript 型別定義
│   ├── common.types.ts            # 共用型別和列舉
│   ├── resource.types.ts          # Resource 型別定義
│   └── resource-review.types.ts   # ResourceReview 型別定義
models/
├── resource.ts                     # 🔄 TypeScript Sequelize 模型
├── resourceReview.ts              # ⏳ TypeScript Sequelize 模型
├── tag.ts                         # ⏳ TypeScript 模型
├── entityTag.ts                   # ⏳ TypeScript 模型
├── index.ts                       # ⏳ 混合 JS/TS 模型匯出
└── user.js                        # 🔒 現有 JavaScript 模型保持不變
validators/
├── resource.validator.ts          # ⏳ TypeScript Zod 驗證器
└── resourceReview.validator.ts    # ⏳ TypeScript Zod 驗證器
services/
├── transformService.ts            # ⏳ TypeScript 資料轉換服務
├── resourceService.ts             # ⏳ TypeScript 服務層
├── resourceReviewService.ts       # ⏳ TypeScript 服務層
└── tagService.ts                  # ⏳ TypeScript 服務層
controllers/
├── resource.ts                    # ⏳ TypeScript 控制器
└── resourceReview.ts              # ⏳ TypeScript 控制器
routes/
├── resource.ts                    # ⏳ TypeScript 路由
└── resourceReview.ts              # ⏳ TypeScript 路由
middlewares/
├── resourceAuth.ts                # ⏳ TypeScript 權限中間件
├── resourceStats.ts               # ⏳ TypeScript 統計中間件
└── resourceCache.ts               # ⏳ TypeScript 快取中間件
tests/
├── unit/
│   ├── resource.service.test.ts   # ⏳ TypeScript 測試
│   ├── resourceReview.service.test.ts
│   └── transformService.test.ts
└── integration/
    ├── resource.api.test.ts       # ⏳ TypeScript 整合測試
    └── resourceReview.api.test.ts
```

## 🔧 關鍵技術決策更新

### 📝 TypeScript 導入決策
- **漸進式遷移**：新功能全面使用 TypeScript，現有功能保持穩定
- **函數式設計**：使用函數而非類別，符合專案規範
- **Zod 型別定義**：使用 Zod schema 定義型別，通過 inference 產生 TypeScript 型別
- **開發體驗**：完整的 IDE 支援和型別檢查

### 🆕 API 規格重要更新
- **心得評價物件化**：contentFeatures 和 resourceUsage 從 Boolean 欄位改為物件結構
- **巢狀資源建立**：支援在建立/更新資源時同時處理心得評價
- **統一欄位命名**：API 層面統一使用簡化的欄位名稱（如 name, url, imageUrl）
- **timeUsage 欄位**：新增時間使用模式的追蹤機制
- **評分精度**：支援 0.5 分間距的評分系統

### 🗄️ 資料庫設計決策
- **標籤系統**：使用現有的 `entity_tags` 表實現多對多關聯
- **軟刪除**：使用 `deleted_at` 欄位實現軟刪除機制
- **統計資料**：評分統計即時計算，其他統計考慮快取機制
- **型別安全模型**：所有新模型都有完整的 TypeScript 型別定義
- **心得評價結構**：contentFeatures 和 resourceUsage 採用物件化設計提升彈性
- **巢狀操作支援**：資源 CRUD 操作同時支援關聯心得的處理

### 🔧 API 設計決策
- **巢狀路由**：
  - Resource: `/api/resources`
  - ResourceReview: `/api/resources/:id/reviews` (巢狀路由)
- **分頁機制**：使用游標分頁提升效能
- **篩選參數**：支援多維度篩選和全文搜尋
- **型別安全 API**：所有端點都有 TypeScript 型別定義

### 📝 資料轉換策略
- **欄位命名**：API 層使用駝峰命名，資料庫層保持蛇形命名
- **物件化轉換**：將 resource_review 的 boolean 欄位轉換為結構化物件
- **評分計算**：五個評分項目的平均值作為總體評分
- **型別轉換器**：使用 TypeScript 建立型別安全的轉換器
- **巢狀資料處理**：支援資源與心得的聯合建立和更新操作

### 🔐 安全性考量
- **權限控制**：資源和心得的 CRUD 權限檢查
- **輸入驗證**：使用 Zod 進行嚴格的資料驗證
- **SQL 注入防護**：使用 Sequelize ORM 的參數化查詢
- **型別安全**：TypeScript 提供編譯時期的型別檢查

## 🆕 TypeScript 開發流程

### 新功能開發流程
1. **設計 Zod Schema**：先定義資料驗證規則
2. **建立型別定義**：使用 Zod inference 生成型別
3. **實作資料模型**：使用 Sequelize 定義資料模型
4. **開發資料轉換器**：建立資料庫與 API 之間的轉換邏輯
5. **實作服務層**：開發業務邏輯函數
6. **實作控制器**：建立 API 端點處理函數
7. **設定路由**：配置 API 路由
8. **撰寫測試**：開發單元測試和整合測試
9. **更新文件**：更新 Swagger 文件和開發指南

### TypeScript 代碼審查檢查項目
- [ ] Zod Schema 定義完整且正確
- [ ] 避免使用 `any` 型別
- [ ] 資料轉換邏輯符合規範
- [ ] 錯誤處理完善
- [ ] 測試覆蓋率達標
- [ ] 文件與代碼一致

## 📊 風險評估與緩解 (更新)

### 🟡 TypeScript 相關風險
1. **學習曲線**：團隊成員對 TypeScript 和 Zod 的熟悉程度
   - **緩解措施**：提供 TypeScript 和 Zod 培訓和最佳實踐指南

2. **編譯複雜度**：JavaScript 和 TypeScript 混合專案的編譯管理
   - **緩解措施**：建立清晰的編譯配置和 CI/CD 流程

3. **資料轉換複雜性**：Boolean 欄位到物件結構的轉換邏輯
   - **緩解措施**：建立完善的轉換函數和單元測試

## 📋 階段進度追蹤

### ✅ 已完成階段
- [x] **階段一**：架構分析與準備 ✅
- [x] **階段二**：TypeScript 型別系統建立 ✅

### 🔄 進行中階段
- **階段三**：TypeScript Sequelize 模型建立 🔄
  - [ ] Resource 模型 (TypeScript)
  - [ ] ResourceReview 模型 (TypeScript) 
  - [ ] Tag, EntityTag 模型 (TypeScript)
  - [ ] 模型關聯設定更新

### ⏳ 待執行階段
- **階段四**：Zod 驗證器設計 (TypeScript)
- **階段五**：服務層開發 (TypeScript) 
- **階段六**：控制器開發 (TypeScript)
- **階段七**：路由設定 (TypeScript)
- **階段八**：Swagger 文件撰寫
- **階段九**：中間件與工具開發 (TypeScript)
- **階段十**：測試開發 (TypeScript)
- **階段十一**：效能最佳化
- **階段十二**：部署準備

## 🎯 下一步立即行動

### 優先完成項目
1. **完成階段三的 TypeScript Sequelize 模型建立**
   - [ ] 建立 `models/resource.ts` - Resource 模型
   - [ ] 建立 `models/resourceReview.ts` - ResourceReview 模型
   - [ ] 建立 `models/tag.ts` 和 `models/entityTag.ts` - 標籤相關模型
   - [ ] 更新 `models/index.ts` - 設定模型關聯

2. **準備階段四的 Zod 驗證器開發**
   - [ ] 規劃 Resource 驗證器結構
   - [ ] 規劃 ResourceReview 驗證器結構
   - [ ] 規劃驗證規則和錯誤訊息

### 環境準備檢查
- [x] ✅ TypeScript 配置完成
- [ ] ⏳ 型別定義系統修正
- [x] ✅ 專案結構規劃確認
- [ ] ⏳ 開發團隊 TypeScript 培訓
- [ ] ⏳ CI/CD TypeScript 編譯流程設定

---

## 總結

本開發計劃已更新為 **TypeScript 漸進式導入策略**，採用符合專案規範的函數式設計和 Zod 型別系統，確保在不影響現有系統穩定性的前提下，為新的 Resource API 提供完整的型別安全保障。透過階段性的 TypeScript 導入和持續的型別檢查，將大幅提升代碼品質和開發效率。

**下一步：完成階段三的 TypeScript Sequelize 模型建立，開始階段四的 Zod 驗證器開發** 🚀