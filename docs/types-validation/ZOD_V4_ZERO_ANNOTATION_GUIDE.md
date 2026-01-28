# Zod v4 零註解 + 完整範例方案

## 概述

利用 **Zod v4 內建的 metadata 功能**，實現零註解自動生成帶完整範例的 Swagger 文檔。

**優勢**：

- ✅ **零額外依賴** - 純 Zod v4 內建功能
- ✅ 零手動註解
- ✅ 完整 Example Values
- ✅ 線上測試 API
- ✅ 產出 openapi.yaml
- ✅ 不依賴第三方維護風險

## Zod v4 內建 Metadata 功能

### 核心方法

- **`.describe(description)`** - 添加欄位描述
- **`.meta({ examples: [...] })`** - 附加範例和自訂 metadata
- **`.meta({ title: "...", examples: [...] })`** - 完整 metadata

### 自動 JSON Schema 整合

Zod v4 的 metadata 會自動整合到 JSON Schema 輸出中，無需額外處理。

## 實作步驟

### 步驟 1: 升級 Zod

```bash
pnpm add zod@^4.0.0
```

### 步驟 2: 更新 Validators 使用內建 Metadata

```typescript
// src/validators/resource.validator.ts
import { z } from 'zod';
import { 
  RESOURCE_TYPES, 
  COST_TYPES, 
  LEVEL_TYPES, 
  RESOURCE_STATUS 
} from '@/constants/mappings';

// 使用 Zod v4 內建 metadata 功能
const resourceBaseSchema = z.object({
  name: z.string()
    .min(1, { message: "資源名稱為必填" })
    .max(255, { message: "資源名稱最多 255 字符" })
    .describe("資源名稱")
    .meta({
      title: "資源名稱",
      examples: ["TypeScript 完全指南", "Vue.js 官方教程", "React 實戰指南"]
    }),
    
  url: z.string()
    .url({ message: "URL 格式不正確" })
    .describe("資源連結，必須是有效的 URL")
    .meta({
      title: "資源 URL", 
      examples: [
        "https://www.typescriptlang.org/docs/",
        "https://vuejs.org/tutorial/",
        "https://react.dev/learn"
      ]
    }),
    
  imageUrl: z.string()
    .url({ message: "URL 格式不正確" })
    .nullable()
    .optional()
    .describe("資源預覽圖片")
    .meta({
      title: "預覽圖片",
      examples: [
        "https://example.com/typescript-guide.jpg",
        "https://example.com/vue-tutorial.png"
      ]
    }),
    
  description: z.string()
    .min(1, { message: "資源描述為必填" })
    .describe("資源的詳細描述")
    .meta({
      title: "資源描述",
      examples: [
        "TypeScript 官方文檔，提供完整的語法說明和最佳實踐指南",
        "Vue.js 官方提供的互動式教程，適合初學者入門"
      ]
    }),
    
  videoUrl: z.string()
    .url({ message: "URL 格式不正確" })
    .nullable()
    .optional()
    .describe("相關教學影片連結")
    .meta({
      title: "教學影片",
      examples: [
        "https://www.youtube.com/watch?v=d56mG7DezGs",
        "https://www.youtube.com/watch?v=FXpIoQ_rT_c"
      ]
    }),
    
  type: z.enum(Object.values(RESOURCE_TYPES) as [string, ...string[]])
    .describe("資源類型")
    .meta({
      title: "資源類型",
      examples: ["article", "video", "course"],
      enum: ["article", "video", "course"],
      enumDescriptions: {
        article: "文章或部落格文章",
        video: "教學影片",
        course: "線上課程"
      }
    }),
    
  cost: z.enum(Object.values(COST_TYPES) as [string, ...string[]])
    .describe("資源費用類型")
    .meta({
      title: "費用類型",
      examples: ["free", "paid", "subscription"],
      enumDescriptions: {
        free: "免費資源",
        paid: "一次性付費",
        subscription: "訂閱制"
      }
    }),
    
  level: z.enum(Object.values(LEVEL_TYPES) as [string, ...string[]])
    .describe("資源難度等級")
    .meta({
      title: "難度等級",
      examples: ["beginner", "intermediate", "advanced"],
      enumDescriptions: {
        beginner: "初學者",
        intermediate: "中等程度",
        advanced: "進階"
      }
    }),
    
  majorCategory: z.string()
    .nullable()
    .optional()
    .describe("主要分類")
    .meta({
      title: "主分類",
      examples: ["程式語言", "前端開發", "後端開發", "資料科學"]
    }),
    
  subCategory: z.string()
    .nullable()
    .optional()
    .describe("子分類")
    .meta({
      title: "子分類",
      examples: ["TypeScript", "JavaScript", "React", "Vue.js"]
    }),
    
  tags: z.array(z.string())
    .nullable()
    .optional()
    .describe("資源標籤列表")
    .meta({
      title: "標籤",
      examples: [
        ["typescript", "javascript", "programming"],
        ["vue", "frontend", "javascript"],
        ["react", "hooks", "components"]
      ]
    })
});

// 創建資源 schema - 使用 meta 設定完整範例
export const createResourceSchema = resourceBaseSchema.extend({
  status: z.enum(Object.values(RESOURCE_STATUS) as [string, ...string[]])
    .default("active")
    .describe("資源狀態")
    .meta({
      title: "資源狀態",
      examples: ["active", "inactive", "pending"]
    })
}).meta({
  title: "創建資源請求",
  description: "創建新學習資源的請求格式",
  examples: [
    {
      name: "TypeScript 完全指南",
      url: "https://www.typescriptlang.org/docs/",
      imageUrl: "https://example.com/typescript-guide.jpg",
      description: "TypeScript 官方文檔，提供完整的語法說明和最佳實踐指南",
      videoUrl: "https://www.youtube.com/watch?v=d56mG7DezGs",
      type: "article",
      cost: "free",
      level: "intermediate",
      majorCategory: "程式語言",
      subCategory: "TypeScript",
      tags: ["typescript", "javascript", "programming", "web-development"],
      status: "active"
    },
    {
      name: "Vue.js 官方教程",
      url: "https://vuejs.org/tutorial/",
      imageUrl: "https://example.com/vue-tutorial.png",
      description: "Vue.js 官方提供的互動式教程，適合初學者入門學習",
      type: "course",
      cost: "free",
      level: "beginner",
      majorCategory: "前端開發",
      subCategory: "Vue.js",
      tags: ["vue", "javascript", "frontend", "tutorial"],
      status: "active"
    }
  ]
});

// 資源回應 schema
export const resourceResponseSchema = z.object({
  id: z.string()
    .uuid()
    .describe("資源唯一識別碼")
    .meta({
      title: "資源 ID",
      examples: [
        "123e4567-e89b-12d3-a456-426614174000",
        "456e7890-f12g-34h5-i678-901234567890"
      ]
    }),
    
  name: z.string()
    .describe("資源名稱")
    .meta({
      examples: ["TypeScript 完全指南", "Vue.js 官方教程"]
    }),
    
  url: z.string()
    .describe("資源連結")
    .meta({
      examples: [
        "https://www.typescriptlang.org/docs/",
        "https://vuejs.org/tutorial/"
      ]
    }),
    
  type: z.string()
    .describe("資源類型")
    .meta({
      examples: ["article", "video", "course"]
    }),
    
  created_by: z.number()
    .int()
    .describe("創建者 ID")
    .meta({
      title: "創建者",
      examples: [1, 2, 5]
    }),
    
  created_at: z.string()
    .datetime()
    .describe("創建時間")
    .meta({
      title: "創建時間",
      examples: [
        "2024-01-15T10:30:00.000Z",
        "2024-01-16T14:22:30.000Z"
      ]
    }),
    
  updated_at: z.string()
    .datetime()
    .describe("最後更新時間")
    .meta({
      title: "更新時間",
      examples: [
        "2024-01-15T10:30:00.000Z",
        "2024-01-16T14:22:30.000Z"
      ]
    }),
    
  tags: z.array(z.string())
    .optional()
    .describe("標籤列表")
    .meta({
      examples: [
        ["typescript", "javascript", "programming"],
        ["vue", "frontend", "javascript"]
      ]
    }),
    
  stats: z.object({
    view_count: z.number().int().meta({ examples: [1250, 890, 2340] }),
    favorite_count: z.number().int().meta({ examples: [87, 45, 123] }),
    share_count: z.number().int().meta({ examples: [23, 12, 56] }),
    review_count: z.number().int().meta({ examples: [15, 8, 31] })
  })
  .optional()
  .describe("資源統計數據")
  .meta({
    title: "統計資料",
    examples: [
      {
        view_count: 1250,
        favorite_count: 87,
        share_count: 23,
        review_count: 15
      }
    ]
  }),
  
  avgRating: z.number()
    .nullable()
    .optional()
    .describe("平均評分 (1-5)")
    .meta({
      title: "平均評分",
      examples: [4.2, 3.8, 4.7, null]
    })
}).meta({
  title: "資源回應",
  description: "資源資料的完整回應格式",
  examples: [
    {
      id: "123e4567-e89b-12d3-a456-426614174000",
      name: "TypeScript 完全指南",
      url: "https://www.typescriptlang.org/docs/",
      imageUrl: "https://example.com/typescript-guide.jpg",
      description: "TypeScript 官方文檔，提供完整的語法說明和最佳實踐指南",
      type: "article",
      cost: "free",
      level: "intermediate",
      majorCategory: "程式語言",
      subCategory: "TypeScript",
      created_by: 1,
      created_at: "2024-01-15T10:30:00.000Z",
      updated_at: "2024-01-15T10:30:00.000Z",
      tags: ["typescript", "javascript", "programming", "web-development"],
      stats: {
        view_count: 1250,
        favorite_count: 87,
        share_count: 23,
        review_count: 15
      },
      avgRating: 4.2
    }
  ]
});

// 標準 API 回應格式
export const apiSuccessResponseSchema = z.object({
  success: z.literal(true).meta({ examples: [true] }),
  data: z.any().describe("回應資料"),
  timestamp: z.string()
    .datetime()
    .describe("回應時間戳")
    .meta({ examples: ["2024-01-15T10:30:00.000Z"] }),
  meta: z.object({
    requestId: z.string().optional().meta({ examples: ["req_123456789"] }),
    processingTime: z.number().optional().meta({ examples: [45, 67, 89] })
  })
  .optional()
  .describe("附加資訊")
}).meta({
  title: "API 成功回應",
  examples: [
    {
      success: true,
      data: {
        id: "123e4567-e89b-12d3-a456-426614174000",
        name: "TypeScript 完全指南"
      },
      timestamp: "2024-01-15T10:30:00.000Z",
      meta: {
        requestId: "req_123456789",
        processingTime: 45
      }
    }
  ]
});

export const apiErrorResponseSchema = z.object({
  success: z.literal(false).meta({ examples: [false] }),
  data: z.null().meta({ examples: [null] }),
  error: z.object({
    code: z.string().meta({ 
      examples: ["VALIDATION_ERROR", "NOT_FOUND", "UNAUTHORIZED"] 
    }),
    message: z.string().meta({ 
      examples: ["請求參數錯誤", "資源不存在", "未授權"] 
    }),
    details: z.record(z.string()).optional().meta({
      examples: [
        { name: "資源名稱為必填", url: "URL 格式不正確" }
      ]
    })
  }),
  timestamp: z.string().datetime()
}).meta({
  title: "API 錯誤回應",
  examples: [
    {
      success: false,
      data: null,
      error: {
        code: "VALIDATION_ERROR",
        message: "請求參數錯誤",
        details: {
          name: "資源名稱為必填",
          url: "URL 格式不正確"
        }
      },
      timestamp: "2024-01-15T10:30:00.000Z"
    }
  ]
});

// 分頁回應 schema
export const paginatedResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(resourceResponseSchema),
  pagination: z.object({
    currentPage: z.number().int().meta({ examples: [1, 2, 3] }),
    totalPages: z.number().int().meta({ examples: [5, 10, 20] }),
    totalItems: z.number().int().meta({ examples: [50, 100, 250] }),
    itemsPerPage: z.number().int().meta({ examples: [10, 20, 25] }),
    hasNext: z.boolean().meta({ examples: [true, false] }),
    hasPrev: z.boolean().meta({ examples: [false, true] })
  }).describe("分頁資訊"),
  timestamp: z.string().datetime()
}).meta({
  title: "分頁回應",
  examples: [
    {
      success: true,
      data: [
        {
          id: "123e4567-e89b-12d3-a456-426614174000",
          name: "TypeScript 完全指南",
          url: "https://www.typescriptlang.org/docs/",
          type: "article",
          created_by: 1,
          created_at: "2024-01-15T10:30:00.000Z",
          updated_at: "2024-01-15T10:30:00.000Z",
          tags: ["typescript", "javascript"],
          avgRating: 4.2
        },
        {
          id: "456e7890-f12g-34h5-i678-901234567890",
          name: "Vue.js 官方教程",
          url: "https://vuejs.org/tutorial/",
          type: "course",
          created_by: 2,
          created_at: "2024-01-15T11:00:00.000Z",
          updated_at: "2024-01-15T11:00:00.000Z",
          tags: ["vue", "javascript"],
          avgRating: 4.5
        }
      ],
      pagination: {
        currentPage: 1,
        totalPages: 5,
        totalItems: 50,
        itemsPerPage: 10,
        hasNext: true,
        hasPrev: false
      },
      timestamp: "2024-01-15T10:30:00.000Z"
    }
  ]
});
```

### 步驟 3: 自動生成腳本（利用 Zod v4 Metadata）

```typescript
// scripts/generate-swagger.ts
#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
// Zod v4 內建 JSON Schema 生成，不需要第三方套件
// import { zodToJsonSchema } from 'zod-to-json-schema';
import glob from 'glob';

// 從 Zod v4 schema 中提取 metadata
function extractZodV4Metadata(schema: any) {
  const metadata = {
    description: null,
    examples: [],
    title: null,
    enumDescriptions: null
  };
  
  // 提取 description (從 .describe() 方法)
  if (schema.description) {
    metadata.description = schema.description;
  }
  
  // 提取 metadata (從 .meta() 方法)  
  if (schema._def?.meta) {
    const meta = schema._def.meta;
    
    if (meta.title) {
      metadata.title = meta.title;
    }
    
    if (meta.examples) {
      metadata.examples = Array.isArray(meta.examples) ? meta.examples : [meta.examples];
    }
    
    if (meta.enumDescriptions) {
      metadata.enumDescriptions = meta.enumDescriptions;
    }
  }
  
  return metadata;
}

// 載入所有 Zod v4 schemas 並提取 metadata
function loadZodV4SchemasWithMetadata(): Map<string, any> {
  const schemas = new Map();
  const validatorFiles = glob.sync('src/validators/**/*.ts');
  
  validatorFiles.forEach(file => {
    try {
      const relativePath = path.resolve(file);
      delete require.cache[relativePath];
      const module = require(relativePath);
      
      Object.entries(module).forEach(([name, exportedItem]) => {
        if (exportedItem && typeof exportedItem === 'object' && exportedItem._def) {
          const metadata = extractZodV4Metadata(exportedItem);
          
          schemas.set(name, {
            schema: exportedItem,
            metadata: metadata
          });
        }
      });
    } catch (error) {
      console.warn(`Warning: Could not load ${file}:`, error.message);
    }
  });
  
  console.log(`📚 載入了 ${schemas.size} 個 Zod v4 schemas with metadata`);
  return schemas;
}

// 自動掃描路由定義
function scanRouteDefinitions() {
  const routes = [];
  const routeFiles = glob.sync('src/routes/**/*.routes.ts');
  
  routeFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const fileName = path.basename(file, '.routes.ts');
      
      const routeMatches = content.match(/router\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/g);
      
      routeMatches?.forEach(match => {
        const [, method, routePath] = match.match(/router\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/) || [];
        
        routes.push({
          method: method.toLowerCase(),
          path: routePath,
          tags: [fileName.charAt(0).toUpperCase() + fileName.slice(1)],
          summary: `${method.toUpperCase()} ${routePath}`
        });
      });
    } catch (error) {
      console.warn(`Warning: Could not scan ${file}:`, error.message);
    }
  });
  
  return routes;
}

// 生成帶 Zod v4 metadata 的 OpenAPI 文檔
function generateOpenAPIWithZodV4(): any {
  const schemasWithMetadata = loadZodV4SchemasWithMetadata();
  const routes = scanRouteDefinitions();
  
  const openapi = {
    openapi: '3.0.0',
    info: {
      title: 'DaoDao API (Zod v4 零註解 + 完整範例)',
      version: '1.0.0',
      description: `
# 🚀 Zod v4 零註解自動生成

此文檔使用 **Zod v4 內建 metadata 功能**，零額外依賴，完全自動生成。

## 特點
- ✅ **純 Zod v4**: 使用內建 .describe() 和 .meta() 方法
- ✅ **零額外套件**: 不依賴任何第三方 metadata 套件
- ✅ **完整範例**: 每個欄位都有多個真實範例
- ✅ **線上測試**: 支援 Swagger UI 直接測試
- ✅ **自動同步**: Schema 改變自動更新
- ✅ **長期穩定**: 基於 Zod 官方 API

點擊任意端點開始測試！
      `.trim()
    },
    servers: [
      { url: 'http://localhost:4000', description: '本地開發' },
      { url: 'https://server.daoedu.tw', description: '開發環境' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {},
      responses: {}
    },
    paths: {},
    tags: []
  };
  
  // 轉換 Zod v4 schemas 為 OpenAPI schemas（帶 metadata）
  schemasWithMetadata.forEach(({ schema, metadata }, name) => {
    try {
      // 使用 Zod v4 內建的 JSON Schema 生成功能
      const jsonSchema = schema.toJSONSchema();
      
      // 移除 $schema 屬性 (如果存在)
      if (jsonSchema.$schema) {
        delete jsonSchema.$schema;
      }
      
      // Zod v4 的 metadata (.describe() 和 .meta()) 已經自動整合到 JSON Schema 中
      
      openapi.components.schemas[name] = jsonSchema;
    } catch (error) {
      console.warn(`Warning: Could not convert schema ${name}:`, error.message);
    }
  });
  
  // 生成路由文檔
  const tagsSet = new Set();
  
  routes.forEach(route => {
    const pathKey = route.path.replace(/:(\w+)/g, '{$1}');
    
    if (!openapi.paths[pathKey]) {
      openapi.paths[pathKey] = {};
    }
    
    route.tags?.forEach(tag => tagsSet.add(tag));
    
    const operation = {
      summary: route.summary,
      tags: route.tags,
      responses: {
        '200': {
          description: '成功',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/apiSuccessResponseSchema' },
              examples: {
                success: {
                  summary: "成功回應",
                  value: schemasWithMetadata.get('apiSuccessResponseSchema')?.metadata.examples[0]
                }
              }
            }
          }
        },
        '400': {
          description: '請求錯誤',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/apiErrorResponseSchema' },
              examples: {
                error: {
                  summary: "錯誤回應",
                  value: schemasWithMetadata.get('apiErrorResponseSchema')?.metadata.examples[0]
                }
              }
            }
          }
        }
      }
    };
    
    // 認證要求
    if (['post', 'put', 'patch', 'delete'].includes(route.method)) {
      operation.security = [{ bearerAuth: [] }];
    }
    
    // 請求體（帶範例）
    if (['post', 'put', 'patch'].includes(route.method)) {
      const requestSchemaData = schemasWithMetadata.get('createResourceSchema');
      
      operation.requestBody = {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/createResourceSchema' },
            examples: {
              default: {
                summary: "請求範例",
                value: requestSchemaData?.metadata.examples[0]
              },
              ...(requestSchemaData?.metadata.examples.length > 1 && {
                alternative: {
                  summary: "替代範例",
                  value: requestSchemaData.metadata.examples[1]
                }
              })
            }
          }
        }
      };
    }
    
    // 查詢參數（帶範例）
    if (route.method === 'get') {
      operation.parameters = [
        {
          name: 'page',
          in: 'query',
          schema: { type: 'integer', default: 1 },
          example: 1
        },
        {
          name: 'limit',
          in: 'query',
          schema: { type: 'integer', default: 10 },
          example: 10
        }
      ];
    }
    
    openapi.paths[pathKey][route.method] = operation;
  });
  
  // 設定標籤
  openapi.tags = Array.from(tagsSet).map(tag => ({
    name: tag,
    description: `${tag} 相關操作`
  }));
  
  return openapi;
}

// 生成文件
function generateFiles() {
  const openApiDoc = generateOpenAPIWithZodV4();
  
  // 生成 YAML
  const yamlPath = path.resolve(__dirname, '..', 'openapi.yaml');
  fs.writeFileSync(yamlPath, yaml.dump(openApiDoc, { indent: 2 }), 'utf8');
  
  // 生成 JSON
  const jsonPath = path.resolve(__dirname, '..', 'openapi.json');
  fs.writeFileSync(jsonPath, JSON.stringify(openApiDoc, null, 2), 'utf8');
  
  console.log('\n✅ Zod v4 零註解文檔生成完成:');
  console.log(`   📄 YAML: ${yamlPath}`);
  console.log(`   📄 JSON: ${jsonPath}`);
  console.log(`   🏷️  ${openApiDoc.tags.length} 個標籤`);
  console.log(`   🛣️  ${Object.keys(openApiDoc.paths).length} 個路徑`);
  console.log(`   📋 ${Object.keys(openApiDoc.components.schemas).length} 個 schemas`);
  
  return openApiDoc;
}

// 執行生成
if (require.main === module) {
  console.log('🚀 使用 Zod v4 內建功能生成 OpenAPI 文檔...\n');
  
  try {
    generateFiles();
    console.log('\n🎉 生成成功！使用 Zod v4 純內建功能，零額外依賴！');
  } catch (error) {
    console.error('❌ 生成失敗:', error);
    process.exit(1);
  }
}
```

### 步驟 4: Express 整合

```typescript
// src/app.ts
import swaggerUi from 'swagger-ui-express';
import openApiDoc from '../openapi.json';

// Zod v4 零註解版本
app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', swaggerUi.setup(openApiDoc, {
  customSiteTitle: 'DaoDao API Documentation',
  explorer: true,
  swaggerOptions: {
    persistAuthorization: true,
    tryItOutEnabled: true,
    filter: true,
    displayRequestDuration: true,
    docExpansion: 'list'
  }
}));

console.log('📚 API 文檔: http://localhost:4000/api-docs');
```

### 步驟 5: 自動化指令

```json
{
  "scripts": {
    "swagger:generate": "ts-node scripts/generate-swagger.ts",
    "swagger:watch": "nodemon --watch src/validators --exec pnpm run swagger:generate",
    "dev": "pnpm run swagger:generate && pnpm run dev:server"
  }
}
```

## Zod v4 的優勢

### 1. 內建 Metadata 支援

```typescript
z.string().describe("描述").meta({ 
  examples: ["範例1", "範例2"],
  title: "標題"
})
```

### 2. 內建 JSON Schema 生成

Zod v4 內建了 JSON Schema 生成功能，不再需要 `zod-to-json-schema` 等第三方套件。
Metadata 會自動整合到 JSON Schema 輸出中。

```typescript
// Zod v4 內庺方法
const jsonSchema = myZodSchema.toJSONSchema();
```

### 3. 性能提升

Zod v4 在處理大型 schemas 時效能大幅提升，並且內庺 JSON Schema 生成比第三方套件更快。

## 最終效果

✅ **純 Zod v4 內建功能**：不需任何第三方套件  
✅ **完整 Example Values**：每個欄位都有多個真實範例  
✅ **線上測試**：完整的 Swagger UI 支援  
✅ **產出 YAML**：標準 OpenAPI 3.0 格式  
✅ **零維護風險**：基於 Zod 官方 API  

這是最穩定、最可靠的零註解 Swagger 方案！
