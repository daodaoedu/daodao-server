# Zod Schema 加入範例完整指南 (使用 zod-to-openapi)

## 方案概述

使用 `@asteasolutions/zod-to-openapi` 套件，在現有的 Zod Schema 中加入 `.openapi()` 方法來定義範例和 OpenAPI 元資料，自動生成具有完整 Example Values 的 Swagger UI。

## 現有專案架構分析

專案目前使用：
- Zod v4 用於資料驗證
- 自訂的 `.meta()` 方法存放範例資料
- TypeScript 型別推導
- 標準化 API 回應格式

## 實作步驟

### 步驟 1: 安裝 zod-to-openapi 依賴

```bash
pnpm add @asteasolutions/zod-to-openapi
```

### 步驟 2: 建立 OpenAPI 整合工具

#### 2.1 創建 Zod OpenAPI 工具

```typescript
// src/utils/zod-openapi.ts
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

// 擴展 Zod 支援 OpenAPI
extendZodWithOpenApi(z);

export { z };
```

### 步驟 3: 遷移現有 Schema 到 zod-to-openapi

將現有使用 `.meta()` 的 Zod schemas 轉換成 `.openapi()` 格式。

#### 3.1 資源驗證器更新範例

**轉換前（專案現有的 .meta() 方式）：**
```typescript
// src/validators/resource.validator.ts (現狀)
import { z } from 'zod';

const resourceBaseSchema = z.object({
  name: z.string()
    .min(1, { message: "資源名稱為必填" })
    .max(255, { message: "資源名稱最多 255 字符" })
    .describe("資源名稱")
    .meta({
      title: "資源名稱",
      examples: ["React 官方文檔", "Vue.js 入門教學"]
    })
});
```

**轉換後（使用 zod-to-openapi 的 .openapi() 方式）：**
```typescript
// src/validators/resource.validator.ts (更新版)
import { z } from '@/utils/zod-openapi';
import { 
  RESOURCE_TYPES, 
  COST_TYPES, 
  LEVEL_TYPES, 
  RESOURCE_STATUS 
} from '@/constants/mappings';

const resourceBaseSchema = z.object({
  name: z.string()
    .min(1, { message: "資源名稱為必填" })
    .max(255, { message: "資源名稱最多 255 字符" })
    .describe("資源名稱")
    .openapi({ 
      example: "React 官方文檔",
      examples: ["React 官方文檔", "Vue.js 入門教學", "JavaScript 進階課程"]
    }),
    
  type: z.enum(Object.values(RESOURCE_TYPES) as [string, ...string[]])
    .describe("資源類型")
    .openapi({ 
      example: "learning_platform_app",
      description: "學習資源的類型分類"
    })
});

export const createResourceSchema = resourceBaseSchema.extend({
  status: z.enum(Object.values(RESOURCE_STATUS) as [string, ...string[]])
    .default("active")
    .describe("資源狀態")
    .openapi({ 
      example: "active",
      description: "資源的當前狀態"
    })
}).openapi({
  // 整個物件的完整範例
  example: {
    name: "React 官方文檔",
    url: "https://react.dev/",
    description: "React 官方文檔，提供完整的 API 參考和最新的開發指南",
    type: "learning_platform_app",
    cost: "free",
    level: "intermediate",
    majorCategory: "前端開發",
    subCategory: "React",
    tags: ["JavaScript", "React", "前端框架"],
    status: "active"
  }
});
```

### 步驟 4: 建立 OpenAPI 生成腳本

使用專案現有的腳本架構，整合 zod-to-openapi：

```typescript
// scripts/generate-openapi-zod.ts
#!/usr/bin/env ts-node

import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

// 引入專案現有的 validators
import { 
  createResourceSchema,
  updateResourceSchema,
  updateResourceStatusSchema
} from '../src/validators/resource.validator';

import {
  apiSuccessResponseExample,
  apiErrorResponseSchema,
  paginatedApiResponseExample,
  responseMetaSchema
} from '../src/validators/api-response.validators';

const registry = new OpenAPIRegistry();

// 註冊通用 schemas
registry.register('ApiSuccessResponse', apiSuccessResponseExample);
registry.register('ApiErrorResponse', apiErrorResponseSchema);
registry.register('PaginatedResponse', paginatedApiResponseExample);
registry.register('ResponseMeta', responseMetaSchema);

// 註冊資源相關 schemas
registry.register('CreateResourceRequest', createResourceSchema);
registry.register('UpdateResourceRequest', updateResourceSchema);
registry.register('UpdateResourceStatusRequest', updateResourceStatusSchema);

// 定義資源 API 路由
registry.registerPath({
  method: 'get',
  path: '/api/v1/resources',
  summary: '獲取資源列表',
  description: '支援分頁、篩選、搜尋功能的資源列表 API',
  tags: ['Resources'],
  request: {
    query: z.object({
      page: z.coerce.number().min(1).default(1)
        .openapi({ example: 1, description: '頁碼 (從 1 開始)' }),
      limit: z.coerce.number().min(1).max(100).default(10)
        .openapi({ example: 10, description: '每頁項目數量 (1-100)' }),
      type: z.enum(['learning_platform_app', 'learning_tools', 'books_articles', 'video_content'])
        .optional()
        .openapi({ example: 'learning_platform_app', description: '資源類型篩選' }),
      search: z.string().optional()
        .openapi({ example: 'React', description: '搜尋關鍵字' }),
      majorCategory: z.string().optional()
        .openapi({ example: '前端開發', description: '主分類篩選' }),
      level: z.enum(['beginner', 'intermediate', 'expert', 'all_levels'])
        .optional()
        .openapi({ example: 'intermediate', description: '難度等級篩選' })
    })
  },
  responses: {
    200: {
      description: '成功獲取資源列表',
      content: {
        'application/json': {
          schema: paginatedApiResponseExample
        }
      }
    },
    400: {
      description: '請求參數錯誤',
      content: {
        'application/json': {
          schema: apiErrorResponseSchema
        }
      }
    }
  }
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/resources',
  summary: '建立新資源',
  description: '建立新的學習資源，需要管理員權限',
  tags: ['Resources'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: createResourceSchema
        }
      },
      required: true
    }
  },
  responses: {
    201: {
      description: '資源建立成功',
      content: {
        'application/json': {
          schema: apiSuccessResponseExample
        }
      }
    },
    400: {
      description: '請求資料驗證失敗',
      content: {
        'application/json': {
          schema: apiErrorResponseSchema
        }
      }
    },
    401: {
      description: '未授權或 Token 無效',
      content: {
        'application/json': {
          schema: apiErrorResponseSchema
        }
      }
    },
    403: {
      description: '權限不足，需要管理員權限',
      content: {
        'application/json': {
          schema: apiErrorResponseSchema
        }
      }
    }
  }
});

// 生成完整的 OpenAPI 文檔
function generateDaoOpenAPISpec() {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  
  const document = generator.generateDocument({
    openapi: '3.0.3',
    info: {
      title: 'DaoDao Learning Platform API',
      version: '1.0.0',
      description: `
# 🎓 DaoDao 學習平台 API 文檔

此 API 文檔完全基於 Zod Schema 自動生成，包含完整的範例值和驗證規則。

## 特色功能
- ✅ **型別安全**: 基於 TypeScript 和 Zod 的完整型別檢查
- ✅ **實際範例**: 每個欄位都提供真實可用的範例數據
- ✅ **自動驗證**: 所有請求都經過 Zod schema 嚴格驗證
- ✅ **標準回應**: 統一的 API 回應格式，包含成功和錯誤處理
- ✅ **分頁支援**: 完整的分頁機制支援

## 認證方式
API 使用 JWT Bearer Token 進行身份驗證。請在 Authorization Header 中包含有效的 Token。

## 回應格式
所有 API 都遵循標準回應格式，包含 success、data、timestamp 等標準欄位。
      `.trim(),
      contact: {
        name: 'DaoDao API Support',
        email: 'support@daoedu.tw'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      { url: 'http://localhost:4000', description: '本地開發環境' },
      { url: 'https://server.daoedu.tw', description: 'DaoDao 開發伺服器' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: '使用 JWT Token 進行 API 認證'
        }
      }
    },
    tags: [
      {
        name: 'Resources',
        description: '學習資源管理相關 API'
      },
      {
        name: 'Auth',
        description: '使用者認證相關 API'
      }
    ]
  });

  return document;
}

// 主執行函數
async function main() {
  try {
    console.log('🚀 開始生成基於 Zod 的 OpenAPI 文檔...');
    
    const document = generateDaoOpenAPISpec();
    
    // 生成 JSON 格式
    const jsonPath = path.resolve(__dirname, '..', 'openapi.json');
    fs.writeFileSync(jsonPath, JSON.stringify(document, null, 2), 'utf8');
    
    // 生成 YAML 格式  
    const yamlPath = path.resolve(__dirname, '..', 'openapi.yaml');
    fs.writeFileSync(yamlPath, yaml.dump(document, { lineWidth: -1 }), 'utf8');
    
    console.log('✅ OpenAPI 文檔生成完成！');
    console.log(`   📄 JSON: ${jsonPath}`);
    console.log(`   📄 YAML: ${yamlPath}`);
    console.log('\n🎯 所有範例值都來自實際的 Zod Schema！');
    
    // 驗證生成的文檔
    const stats = fs.statSync(jsonPath);
    console.log(`📊 文檔大小: ${Math.round(stats.size / 1024)} KB`);
    
  } catch (error) {
    console.error('❌ 生成 OpenAPI 文檔時發生錯誤:', error);
    process.exit(1);
  }
}

// 執行主函數
if (require.main === module) {
  main();
}

export { generateDaoOpenAPISpec };
```

### 步驟 5: 整合到專案構建流程

#### 5.1 更新 package.json 腳本

```json
{
  "scripts": {
    "openapi:zod": "ts-node -r tsconfig-paths/register scripts/generate-openapi-zod.ts",
    "swagger:generate": "pnpm run openapi:zod",
    "dev": "pnpm run swagger:generate && ts-node-dev --respawn --transpile-only -r tsconfig-paths/register src/server.ts",
    "build": "pnpm run swagger:generate && tsc --skipLibCheck && tsc-alias"
  }
}
```

#### 5.2 更新現有 Swagger 設定

```typescript
// src/server.ts 或 src/app.ts
import swaggerUi from 'swagger-ui-express';
import * as fs from 'fs';
import * as path from 'path';

// 讀取生成的 OpenAPI 文檔
const openApiPath = path.resolve(__dirname, '..', 'openapi.json');
const openApiSpec = JSON.parse(fs.readFileSync(openApiPath, 'utf8'));

// 設置 Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'DaoDao API Documentation',
  explorer: true,
  swaggerOptions: {
    tryItOutEnabled: true,
    filter: true,
    displayRequestDuration: true,
    persistAuthorization: true,
    docExpansion: 'list',
    defaultModelsExpandDepth: 2,
    defaultModelExpandDepth: 2,
    // 啟用範例值顯示
    showRequestHeaders: true,
    showCommonExtensions: true
  }
}));
```

### 步驟 6: 驗證和測試

#### 6.1 生成文檔並驗證

```bash
# 安裝依賴
pnpm add @asteasolutions/zod-to-openapi

# 生成 OpenAPI 文檔
pnpm run openapi:zod

# 啟動開發伺服器
pnpm run dev
```

#### 6.2 檢查生成結果

訪問 `http://localhost:4000/api-docs` 應該會看到：

1. **完整的 Example Values**: 每個欄位都有實際範例值
2. **一鍵測試**: 點擊 "Try it out" 時會預填範例值
3. **型別安全**: 所有範例都符合 Zod schema 定義
4. **中文描述**: 保留原有的中文欄位描述

## 遷移檢查清單

### ✅ 準備工作
- [ ] 安裝 `@asteasolutions/zod-to-openapi`
- [ ] 創建 `src/utils/zod-openapi.ts` 工具檔案
- [ ] 建立新的生成腳本 `scripts/generate-openapi-zod.ts`

### ✅ Schema 更新
- [ ] 將 `import { z } from 'zod'` 改為 `import { z } from '@/utils/zod-openapi'`
- [ ] 將 `.meta()` 範例轉換為 `.openapi()` 格式
- [ ] 確認所有 enum 值都有對應的範例
- [ ] 檢查複雜物件的巢狀範例

### ✅ 構建整合
- [ ] 更新 package.json 腳本
- [ ] 整合到現有的 Swagger UI 設置
- [ ] 確認開發和生產環境都能正常生成文檔

### ✅ 驗證測試
- [ ] 檢查生成的 openapi.json 格式正確
- [ ] 確認 Swagger UI 顯示完整範例
- [ ] 驗證 API 測試功能正常運作

## 主要優勢

1. **完整型別安全**: 範例值受 TypeScript 和 Zod 雙重保護
2. **自動同步更新**: Schema 變更時範例自動更新
3. **零維護成本**: 不需要手動維護 OpenAPI 文檔
4. **開發者友善**: 提供實際可用的測試數據
5. **專業品質**: 生成的文檔符合 OpenAPI 3.0 標準

完成這些步驟後，您將擁有一個完全自動化、基於真實 Zod Schema 的專業級 API 文檔系統！