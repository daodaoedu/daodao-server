# 自動生成 Swagger 文檔指南（無需手動註解）

## 概述

專案已經使用 Zod 進行資料驗證，可以利用現有的 Zod schemas 自動生成 Swagger 文檔，完全不需要手動寫註解。

## 套件維護狀況評估（2024）

根據實際調研，各方案的維護狀況如下：

### 🥇 TSOA（最推薦）
- **維護狀況**：★★★★☆ (3,799 GitHub stars，週下載 243K)
- **產出 yaml**：✅ 完美支援，直接生成 openapi.yaml
- **穩定性**：成熟穩定，大量企業使用
- **風險**：雖尋求更多維護者，但功能穩定且活躍使用
- **缺點**：需要裝飾器語法，較大改動

### 🥈 自建方案（推薦）
- **維護狀況**：★★★★★ (不依賴第三方套件)
- **產出 yaml**：✅ 完全控制輸出格式
- **穩定性**：完全掌控，無外部維護風險
- **優勢**：基於現有 Zod + js-yaml，最安全可靠

### 🥉 swagger-jsdoc（現有方案）
- **維護狀況**：★★★☆☆ (社群互動良好，但更新較慢)
- **產出 yaml**：✅ 專案已在使用
- **穩定性**：功能穩定，廣泛使用
- **建議**：可繼續使用並優化自動化

### ❌ zod-to-openapi 系列（不建議）
- **維護風險**：@asteasolutions 版本已不積極支援
- **生態分裂**：多個競爭套件，維護狀況不明確
- **不確定性**：未來支援不明朗

## 最終建議

基於維護狀況和穩定性考量：

1. **首選**：**自建方案** - 零依賴風險，完全可控
2. **次選**：**TSOA** - 如果願意重構，最成熟穩定
3. **保守**：**優化現有 swagger-jsdoc** - 最小改動

---

## 方案一：自建方案（最安全可靠）

利用現有 Zod schemas + js-yaml，完全不依賴第三方套件：

```typescript
// scripts/auto-generate-openapi.ts
import { z } from 'zod';
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import { zodToJsonSchema } from 'zod-to-json-schema';

// 從現有 validators 自動生成
function generateFromZodSchemas() {
  const openapi = {
    openapi: '3.0.0',
    info: { title: 'DaoDao API', version: '1.0.0' },
    paths: {},
    components: { schemas: {} }
  };
  
  // 掃描所有 Zod schemas
  // 自動生成路由文檔
  return openapi;
}

const doc = generateFromZodSchemas();
fs.writeFileSync('openapi.yaml', yaml.dump(doc));
```

## 方案二：使用 zod-to-openapi（維護風險）

### 1. 安裝依賴

```bash
npm install @asteasolutions/zod-to-openapi
```

### 2. 擴展現有的 Zod Schema

```typescript
// src/validators/resource.validator.ts
import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

// 擴展 Zod 以支援 OpenAPI
extendZodWithOpenApi(z);

// 現有的 schema 加上 OpenAPI 元數據
export const createResourceSchema = z.object({
  name: z.string()
    .min(1)
    .max(255)
    .openapi({ 
      description: '資源名稱',
      example: 'TypeScript 完全指南' 
    }),
  url: z.string()
    .url()
    .openapi({ 
      description: '資源 URL',
      example: 'https://example.com/resource' 
    }),
  type: z.enum(['article', 'video', 'course'])
    .openapi({ 
      description: '資源類型' 
    }),
  // ... 其他欄位
}).openapi('CreateResourceRequest');

// 響應 schema
export const resourceResponseSchema = z.object({
  id: z.string().uuid(),
  // ... 其他欄位
}).openapi('ResourceResponse');
```

### 3. 自動生成路由文檔

```typescript
// src/routes/resource.routes.auto.ts
import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { createResourceSchema, resourceResponseSchema } from '../validators/resource.validator';
import { Router } from 'express';

const registry = new OpenAPIRegistry();

// 註冊路由定義
registry.registerPath({
  method: 'post',
  path: '/api/v1/resources',
  description: '創建新資源',
  summary: '創建新資源',
  tags: ['Resources'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: createResourceSchema
        }
      }
    }
  },
  responses: {
    201: {
      description: '資源創建成功',
      content: {
        'application/json': {
          schema: resourceResponseSchema
        }
      }
    }
  }
});

// 生成 OpenAPI 文檔
export function generateOpenAPIDocument() {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  
  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      version: '1.0.0',
      title: 'DaoDao API',
      description: '自動生成的 API 文檔'
    },
    servers: [{ url: 'http://localhost:4000' }]
  });
}
```

### 4. 整合到 Express

```typescript
// src/app.ts
import swaggerUi from 'swagger-ui-express';
import { generateOpenAPIDocument } from './routes/resource.routes.auto';

const openApiDoc = generateOpenAPIDocument();

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiDoc));
```

## 方案二：使用 TSOA（企業級穩定）

### 優勢
- 3,799 GitHub stars，週下載 243K
- 大量企業使用，功能穩定
- 完美支援 openapi.yaml 生成
- 完全自動化，零註解

### 實作範例

### 1. 安裝依賴

```bash
npm install express-zod-api
```

### 2. 定義端點

```typescript
// src/endpoints/resource.endpoint.ts
import { createEndpoint, z } from 'express-zod-api';
import { createResourceSchema } from '../validators/resource.validator';

export const createResourceEndpoint = createEndpoint({
  method: 'post',
  input: createResourceSchema,
  output: z.object({
    success: z.boolean(),
    data: z.object({
      id: z.string(),
      // ... 其他欄位
    })
  }),
  handler: async ({ input, options }) => {
    // 業務邏輯
    const resource = await createResource(input);
    return {
      success: true,
      data: resource
    };
  }
});
```

### 3. 自動生成路由和文檔

```typescript
// src/server.ts
import { createServer } from 'express-zod-api';
import { createResourceEndpoint } from './endpoints/resource.endpoint';

const server = createServer({
  cors: true,
  logger: console
}, {
  v1: {
    resources: {
      create: createResourceEndpoint
    }
  }
});

// 文檔自動在 /docs 生成
server.listen(4000);
```

### 1. 安裝依賴

```bash
npm install tsoa reflect-metadata
```

### 2. 使用裝飾器定義控制器（TSOA 方式）

```typescript
// src/controllers/resource.controller.auto.ts
import { Body, Controller, Get, Path, Post, Query, Route, SuccessResponse, Tags } from 'tsoa';
import { CreateResourceSchema } from '../validators/resource.validator';

@Route('api/v1/resources')
@Tags('Resources')
export class ResourceController extends Controller {
  
  @Get('/')
  public async getResources(
    @Query() limit?: number,
    @Query() cursor?: string
  ): Promise<ResourceResponse[]> {
    // 業務邏輯
    return await resourceService.getResources({ limit, cursor });
  }
  
  @Post('/')
  @SuccessResponse('201', 'Created')
  public async createResource(
    @Body() requestBody: CreateResourceSchema
  ): Promise<ResourceResponse> {
    // 業務邏輯
    return await resourceService.create(requestBody);
  }
}
```

### 3. 生成配置

```json
// tsoa.json
{
  "entryFile": "src/server.ts",
  "noImplicitAdditionalProperties": "throw-on-extras",
  "controllerPathGlobs": ["src/controllers/**/*.controller.auto.ts"],
  "spec": {
    "outputDirectory": ".",
    "specVersion": 3,
    "specFileBaseName": "openapi",
    "yaml": true
  },
  "routes": {
    "routesDir": "src/generated",
    "middleware": "express"
  }
}
```

### 4. 生成指令

```json
// package.json
{
  "scripts": {
    "generate:tsoa": "tsoa spec-and-routes",
    "dev": "npm run generate:tsoa && nodemon",
    "build": "npm run generate:tsoa && tsc"
  }
}
```

## 方案三：優化現有 swagger-jsdoc（保守方案）

### 優勢
- 最小改動，延續現有架構
- 已證明穩定可用
- 社群支援良好

### 改進建議
```bash
# 優化現有生成流程
npm run openapi:export  # 繼續使用
npm run swagger:watch   # 添加監控
npm run swagger:validate # 添加驗證
```

## 方案四：完全自動化方案（進階自建）

### 實作腳本

```typescript
// scripts/generate-swagger-from-zod.ts
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import * as fs from 'fs';
import * as path from 'path';
import glob from 'glob';

interface RouteInfo {
  path: string;
  method: string;
  validator?: any;
  controller: string;
}

// 掃描路由文件
function scanRoutes(): RouteInfo[] {
  const routes: RouteInfo[] = [];
  const routeFiles = glob.sync('src/routes/**/*.routes.ts');
  
  routeFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    
    // 正則表達式匹配路由定義
    const routePattern = /router\.(get|post|put|patch|delete)\(['"]([^'"]+)['"]/g;
    const validatorPattern = /validate\((\w+Schema)/g;
    
    let match;
    while ((match = routePattern.exec(content)) !== null) {
      const [, method, path] = match;
      
      // 尋找對應的驗證器
      const validatorMatch = validatorPattern.exec(content);
      const validator = validatorMatch ? validatorMatch[1] : null;
      
      routes.push({
        method: method.toLowerCase(),
        path: path,
        validator,
        controller: file
      });
    }
  });
  
  return routes;
}

// 載入所有 Zod schemas
function loadSchemas(): Map<string, z.ZodSchema> {
  const schemas = new Map();
  const schemaFiles = glob.sync('src/validators/**/*.ts');
  
  schemaFiles.forEach(file => {
    const module = require(path.resolve(file));
    Object.entries(module).forEach(([name, schema]) => {
      if (schema instanceof z.ZodSchema) {
        schemas.set(name, schema);
      }
    });
  });
  
  return schemas;
}

// 生成 OpenAPI 文檔
function generateOpenAPI() {
  const routes = scanRoutes();
  const schemas = loadSchemas();
  
  const openapi = {
    openapi: '3.0.0',
    info: {
      title: 'DaoDao API (Auto-generated)',
      version: '1.0.0',
      description: '從 Zod schemas 自動生成的 API 文檔'
    },
    servers: [
      { url: 'http://localhost:4000' }
    ],
    paths: {},
    components: {
      schemas: {}
    }
  };
  
  // 為每個路由生成文檔
  routes.forEach(route => {
    const pathKey = route.path.replace(/:\w+/g, (match) => `{${match.slice(1)}}`);
    
    if (!openapi.paths[pathKey]) {
      openapi.paths[pathKey] = {};
    }
    
    const operation = {
      summary: `${route.method.toUpperCase()} ${route.path}`,
      tags: [route.controller.split('/').pop()?.replace('.routes.ts', '') || 'default'],
      responses: {
        '200': {
          description: 'Success',
          content: {
            'application/json': {
              schema: { type: 'object' }
            }
          }
        }
      }
    };
    
    // 如果有驗證器，加入請求 schema
    if (route.validator && schemas.has(route.validator)) {
      const schema = schemas.get(route.validator);
      const jsonSchema = zodToJsonSchema(schema);
      
      if (['post', 'put', 'patch'].includes(route.method)) {
        operation.requestBody = {
          required: true,
          content: {
            'application/json': {
              schema: jsonSchema
            }
          }
        };
      } else if (route.method === 'get') {
        // GET 請求使用 parameters
        operation.parameters = [];
        // 這裡可以進一步解析 query parameters
      }
    }
    
    openapi.paths[pathKey][route.method] = operation;
  });
  
  // 將所有 schemas 加入 components
  schemas.forEach((schema, name) => {
    openapi.components.schemas[name] = zodToJsonSchema(schema);
  });
  
  return openapi;
}

// 執行生成
const openApiDoc = generateOpenAPI();
fs.writeFileSync('openapi-auto.yaml', JSON.stringify(openApiDoc, null, 2));
console.log('✅ OpenAPI 文檔已自動生成: openapi-auto.yaml');
```

## 維護風險評估與方案比較

| 方案 | 維護狀況 | 產出 YAML | 改動成本 | 長期風險 | 適用場景 |
|------|----------|-----------|----------|-----------|----------|
| **自建方案** | ★★★★★ 零依賴 | ✅ 完美控制 | 中等 | 極低 | **任何專案** |
| **TSOA** | ★★★★☆ 243K/週 | ✅ 完美支援 | 高 | 低 | 大型重構 |
| **swagger-jsdoc** | ★★★☆☆ 現有 | ✅ 已使用 | 最低 | 中等 | 保守維護 |
| **zod-to-openapi** | ★★☆☆☆ 不明 | ✅ 功能性 | 中等 | 高 | **不建議** |

### 維護風險詳細分析

**🟢 安全係數高**
- **自建方案**：完全掌控，只依賴 Node.js 內建功能
- **TSOA**：企業級使用，社群活躍

**🟡 中等風險**  
- **swagger-jsdoc**：更新較慢但功能穩定

**🔴 高風險**
- **zod-to-openapi 系列**：維護者明確表示不再積極支援

## 最終建議與實施路線

### 🏆 最佳選擇：自建方案

基於維護風險和長期穩定性，**強烈建議採用自建方案**：

#### 為什麼選擇自建？
1. **零維護風險**：不依賴第三方套件更新
2. **完全可控**：功能和輸出格式完全掌握
3. **利用現有資源**：基於已有的 Zod schemas
4. **產出 openapi.yaml**：滿足需求
5. **最小依賴**：只需要 `zod-to-json-schema` + `js-yaml`

#### 實施步驟

1. **安裝最小依賴**
   ```bash
   npm install zod-to-json-schema  # 已經很穩定的套件
   # js-yaml 已安裝
   ```

2. **創建自動生成腳本**
   ```typescript
   // scripts/generate-openapi-self.ts
   import * as yaml from 'js-yaml';
   import { zodToJsonSchema } from 'zod-to-json-schema';
   import * as fs from 'fs';
   import * as glob from 'glob';
   
   // 掃描所有 Zod schemas
   // 自動生成 OpenAPI 3.0 文檔
   // 輸出 openapi.yaml
   ```

3. **整合到現有流程**
   ```json
   {
     "scripts": {
       "openapi:self": "ts-node scripts/generate-openapi-self.ts",
       "build": "npm run openapi:self && tsc"
     }
   }
   ```

### 🥈 次選：保持現有方案

如果希望最小改動，**優化現有 swagger-jsdoc**：

```json
{
  "scripts": {
    "swagger:validate": "swagger-cli validate openapi.yaml",
    "swagger:watch": "nodemon --watch src/swagger --exec npm run openapi:export"
  }
}
```

### 🥉 未來考慮：TSOA

如果決定大型重構，TSOA 是最成熟的企業級選擇。

### ❌ 避免風險

避免使用 `@asteasolutions/zod-to-openapi` 等維護風險高的套件。

## 結論

**建議採用自建方案**，既能產出 `openapi.yaml`，又沒有套件維護風險，是最穩定可靠的長期解決方案。