# 從現有 Swagger 配置遷移到 Zod v4 指南

## 現況分析

目前專案使用：
- `swagger-jsdoc` 方式管理 API 文檔
- `src/config/swagger.config.ts` - 基本配置
- `src/swagger/` 目錄 - schemas 和 paths 定義
- `scripts/generate-openapi.ts` - 生成腳本

## 遷移步驟

### 步驟 0: 安裝/移除套件（使用 pnpm）

```bash
# 移除不需要的套件
pnpm remove swagger-jsdoc @types/swagger-jsdoc zod-to-json-schema

# Zod v4 已經安裝，確認版本
pnpm list zod  # 應該顯示 4.1.5

# 確保必要套件已安裝（通常已有）
pnpm add -D glob  # 如果沒有的話
```

### 步驟 1: 替換 swagger.config.ts

將現有的 `src/config/swagger.config.ts` 替換為：

```typescript
/**
 * Zod v4 Swagger 配置文件
 * 使用 Zod v4 內建 JSON Schema 轉換功能
 */

import { z } from 'zod';

// 基本 OpenAPI 文檔配置
export const openApiBaseConfig = {
  openapi: '3.0.0',
  info: {
    title: 'DaoDao 資源管理 API (Zod v4 零註解)',
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
    `.trim(),
    contact: {
      name: 'DaoDao 開發團隊',
      email: 'support@daodao.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: 'http://localhost:4000',
      description: '本機開發'
    },
    {
      url: 'https://server.daoedu.tw/',
      description: '開發環境'
    },
    {
      url: 'https://dao-server.daoedu.tw/',
      description: '生產環境'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: '使用 JWT Token 進行身份驗證'
      }
    },
    schemas: {}, // 這裡會由自動生成腳本填充
    responses: {
      BadRequest: {
        description: '請求參數錯誤',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: false },
                data: { type: 'null', example: null },
                error: {
                  type: 'object',
                  properties: {
                    code: { type: 'string', example: 'VALIDATION_ERROR' },
                    message: { type: 'string', example: '請求參數錯誤' },
                    details: { 
                      type: 'object',
                      example: {
                        name: "資源名稱為必填",
                        url: "URL 格式不正確"
                      }
                    }
                  }
                },
                timestamp: { type: 'string', example: '2024-01-15T10:30:00.000Z' }
              }
            }
          }
        }
      }
    },
    parameters: {
      // 保留原有的通用參數定義
      idParam: {
        in: 'path',
        name: 'id',
        required: true,
        schema: { type: 'string', format: 'uuid' },
        description: '資源的唯一識別碼 (UUID)',
        example: '123e4567-e89b-12d3-a456-426614174000'
      }
    }
  },
  paths: {}, // 這裡會由自動生成腳本填充
  tags: []   // 這裡會由自動生成腳本填充
};

// 輔助函數：從 Zod v4 schema 提取 metadata
export function extractZodV4Metadata(schema: any) {
  const metadata = {
    description: null as string | null,
    examples: [] as any[],
    title: null as string | null,
    enumDescriptions: null as Record<string, string> | null
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
```

### 步驟 2: 替換生成腳本

將現有的 `scripts/generate-openapi.ts` 替換為：

```typescript
#!/usr/bin/env ts-node

/**
 * Zod v4 自動生成 OpenAPI 文檔腳本
 * 使用 Zod v4 內建 toJsonSchema() 方法
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import glob from 'glob';
import { z } from 'zod';
import { openApiBaseConfig, extractZodV4Metadata } from '../src/config/swagger.config';

interface RouteDefinition {
  method: string;
  path: string;
  summary?: string;
  tags?: string[];
  requestSchema?: string;
  responseSchema?: string;
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
function scanRouteDefinitions(): RouteDefinition[] {
  const routes: RouteDefinition[] = [];
  const routeFiles = glob.sync('src/routes/**/*.routes.ts');
  
  routeFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const fileName = path.basename(file, '.routes.ts');
      
      const routeMatches = content.match(/router\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/g);
      
      routeMatches?.forEach(match => {
        const [, method, routePath] = match.match(/router\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/) || [];
        
        if (method && routePath) {
          routes.push({
            method: method.toLowerCase(),
            path: routePath,
            tags: [fileName.charAt(0).toUpperCase() + fileName.slice(1)],
            summary: `${method.toUpperCase()} ${routePath}`
          });
        }
      });
    } catch (error) {
      console.warn(`Warning: Could not scan ${file}:`, error.message);
    }
  });
  
  console.log(`🛣️  掃描了 ${routes.length} 個路由`);
  return routes;
}

// 生成 OpenAPI 文檔（使用 Zod v4 內建功能）
function generateOpenAPIWithZodV4(): any {
  const schemasWithMetadata = loadZodV4SchemasWithMetadata();
  const routes = scanRouteDefinitions();
  
  // 複製基本配置
  const openapi = JSON.parse(JSON.stringify(openApiBaseConfig));
  
  // 轉換 Zod v4 schemas 為 OpenAPI schemas（使用內建 toJsonSchema）
  schemasWithMetadata.forEach(({ schema, metadata }, name) => {
    try {
      // 使用 Zod v4 內建的 toJsonSchema 方法
      const jsonSchema = z.toJsonSchema(schema, {
        target: "openapi-3.0",
        definitions: openapi.components.schemas
      });
      
      // 加入 metadata
      if (metadata.description) {
        jsonSchema.description = metadata.description;
      }
      
      if (metadata.title) {
        jsonSchema.title = metadata.title;
      }
      
      if (metadata.examples.length > 0) {
        jsonSchema.example = metadata.examples[0];
        
        if (metadata.examples.length > 1) {
          jsonSchema.examples = metadata.examples;
        }
      }
      
      openapi.components.schemas[name] = jsonSchema;
    } catch (error) {
      console.warn(`Warning: Could not convert schema ${name}:`, error.message);
    }
  });
  
  // 生成路由文檔
  const tagsSet = new Set<string>();
  
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
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { type: 'object' },
                  timestamp: { type: 'string', example: new Date().toISOString() }
                }
              }
            }
          }
        },
        '400': { $ref: '#/components/responses/BadRequest' }
      }
    };
    
    // 認證要求
    if (['post', 'put', 'patch', 'delete'].includes(route.method)) {
      operation.security = [{ bearerAuth: [] }];
    }
    
    // 請求體範例
    if (['post', 'put', 'patch'].includes(route.method)) {
      operation.requestBody = {
        required: true,
        content: {
          'application/json': {
            schema: { type: 'object' },
            example: {
              name: "範例資源名稱",
              url: "https://example.com",
              type: "article"
            }
          }
        }
      };
    }
    
    // 查詢參數
    if (route.method === 'get') {
      operation.parameters = [
        { $ref: '#/components/parameters/pageParam' },
        { $ref: '#/components/parameters/limitParam' }
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
  
  console.log('\n✅ Zod v4 OpenAPI 文檔生成完成:');
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

### 步驟 3: 更新 Express 應用配置

在 `src/app.ts` 中的變更：

```typescript
// 原本的引入
// import { swaggerSpec } from './config/swagger.config';

// 替換為
import openApiDoc from '../openapi.json'; // 使用生成的 JSON

// 更新 Swagger UI 設定
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiDoc, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'DaoDao API - Zod v4 零註解版',
  swaggerOptions: {
    persistAuthorization: true,    // 保持認證狀態
    tryItOutEnabled: true,         // 啟用線上測試
    filter: true,                  // 啟用搜尋
    displayRequestDuration: true,  // 顯示請求時間
    docExpansion: 'list'          // 預設展開列表
  }
}));
```

### 步驟 4: 更新 Validators 加入 Metadata

以 `src/validators/resource.validator.ts` 為例：

```typescript
import { z } from 'zod';

// 使用 Zod v4 內建 metadata 功能
export const createResourceSchema = z.object({
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
    
  type: z.enum(['article', 'video', 'course'])
    .describe("資源類型")
    .meta({
      title: "資源類型",
      examples: ["article", "video", "course"],
      enumDescriptions: {
        article: "文章或部落格文章",
        video: "教學影片",
        course: "線上課程"
      }
    })
    
  // ... 其他欄位
}).meta({
  title: "創建資源請求",
  description: "創建新學習資源的請求格式",
  examples: [
    {
      name: "TypeScript 完全指南",
      url: "https://www.typescriptlang.org/docs/",
      type: "article",
      description: "TypeScript 官方文檔，提供完整的語法說明"
    }
  ]
});
```

### 步驟 5: 清理不需要的文件

可以選擇性保留或移除：

```bash
# 可以移除的目錄（如果不再需要手動定義）
# src/swagger/schemas/
# src/swagger/paths/

# 或者保留作為參考，但不會被使用
```

### 步驟 6: 更新 package.json 腳本

```json
{
  "scripts": {
    "openapi:export": "ts-node -r tsconfig-paths/register scripts/generate-openapi.ts",
    "build": "tsc --skipLibCheck && tsc-alias && pnpm run openapi:export",
    "types:generate": "pnpm run prisma:generate"
  }
}
```

## 遷移優勢

### 移除前
- 依賴 `swagger-jsdoc`
- 手動維護 `src/swagger/` 目錄
- 需要寫 JSDoc 註解
- 套件維護風險

### 移除後  
- 純 Zod v4 內建功能
- 自動從 validators 生成
- 零手動註解
- 零套件維護風險

## 測試遷移

1. 執行生成腳本：`pnpm run openapi:export`
2. 啟動服務：`pnpm run dev`
3. 訪問：http://localhost:4000/api-docs
4. 檢查是否有完整的範例值和線上測試功能

## 常用 pnpm 指令

```bash
# 開發
pnpm run dev                 # 啟動開發服務器
pnpm run openapi:export     # 生成 OpenAPI 文檔
pnpm run build              # 構建專案（包含 OpenAPI 生成）

# 測試
pnpm run test               # 執行測試
pnpm run typecheck          # TypeScript 類型檢查
pnpm run lint               # 代碼檢查

# 資料庫
pnpm run prisma:generate    # 生成 Prisma 客戶端
pnpm run db:seed            # 資料庫種子數據
```

## 回滾計畫

如果需要回滾，只需：
1. 恢復 `package.json` 中的套件：`pnpm add swagger-jsdoc @types/swagger-jsdoc`
2. 恢復原本的 `src/config/swagger.config.ts`
3. 恢復原本的 `scripts/generate-openapi.ts`

這樣就完成了從傳統 swagger-jsdoc 到 Zod v4 零註解方案的遷移！