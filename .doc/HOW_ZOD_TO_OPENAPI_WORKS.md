# 📚 zod-to-openapi 工作原理完整說明

## 🎯 核心概念

`@asteasolutions/zod-to-openapi` 讓你可以：
1. ✅ 使用 Zod 定義資料結構（runtime validation）
2. ✅ 自動生成 OpenAPI 文檔（API documentation）
3. ✅ 保持代碼和文檔同步（single source of truth）

**一個定義，兩種用途:**
```typescript
const UserSchema = z.object({
  name: z.string()
}).openapi('User', { description: '用戶' });

// 用途 1: Runtime validation
UserSchema.parse({ name: 'John' });  // ✅ 驗證通過

// 用途 2: OpenAPI documentation
// 自動生成 OpenAPI Schema（無需手動維護）
```

---

## 🔄 標準工作流程（5 個步驟）

### 1️⃣ 初始化

```typescript
import { extendZodWithOpenApi, OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

// 擴展 Zod（添加 .openapi() 方法）
extendZodWithOpenApi(z);

// 創建 Registry（收集所有 schemas 和 paths）
const registry = new OpenAPIRegistry();
```

**作用:**
- `extendZodWithOpenApi(z)` - 讓所有 Zod schemas 支援 `.openapi()` 方法
- `registry` - 中央註冊表，收集所有定義

---

### 2️⃣ 定義 Schemas（添加 OpenAPI metadata）

```typescript
// 基本定義
const UserSchema = z.object({
  id: z.number().openapi({       // 👈 添加 OpenAPI metadata
    description: '用戶 ID',
    example: 123
  }),
  name: z.string().openapi({
    description: '用戶名稱',
    example: 'John Doe'
  }),
  email: z.string().email().openapi({
    description: '電子郵件',
    example: 'john@example.com',
    format: 'email'            // 👈 OpenAPI format
  })
}).openapi('User', {             // 👈 註冊為 'User' component
  description: '用戶資料'
});
```

**生成的 OpenAPI:**
```json
{
  "components": {
    "schemas": {
      "User": {
        "type": "object",
        "properties": {
          "id": {
            "type": "number",
            "description": "用戶 ID",
            "example": 123
          },
          "name": {
            "type": "string",
            "description": "用戶名稱",
            "example": "John Doe"
          },
          "email": {
            "type": "string",
            "format": "email",
            "description": "電子郵件",
            "example": "john@example.com"
          }
        },
        "required": ["id", "name", "email"]
      }
    }
  }
}
```

---

### 3️⃣ 註冊 Schemas（讓其他地方可以引用）

```typescript
// 註冊到 registry
registry.register('User', UserSchema);

// 其他地方可以用 $ref 引用
// 例如: { "$ref": "#/components/schemas/User" }
```

**好處:**
- ✅ 避免重複定義
- ✅ 自動生成 `$ref` 引用
- ✅ 保持文檔一致性

---

### 4️⃣ 註冊 API 路徑

```typescript
registry.registerPath({
  method: 'get',                    // HTTP 方法
  path: '/api/users/{id}',          // API 路徑
  tags: ['Users'],                  // 分組標籤
  summary: '獲取用戶資料',           // 簡短說明
  description: '根據 ID 獲取用戶',   // 詳細說明

  // 請求參數
  request: {
    params: z.object({
      id: z.string().openapi({
        param: { name: 'id', in: 'path' },
        description: '用戶 ID',
        example: '123'
      })
    }),
    query: z.object({
      include: z.string().optional()
    }),
    body: {
      content: {
        'application/json': {
          schema: CreateUserSchema
        }
      }
    }
  },

  // 回應
  responses: {
    200: {
      description: '成功',
      content: {
        'application/json': {
          schema: UserSchema  // 引用已定義的 schema
        }
      }
    },
    404: {
      description: '找不到用戶',
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      }
    }
  },

  // 安全性
  security: [{ bearerAuth: [] }]
});
```

**生成的 OpenAPI:**
```json
{
  "paths": {
    "/api/users/{id}": {
      "get": {
        "tags": ["Users"],
        "summary": "獲取用戶資料",
        "description": "根據 ID 獲取用戶",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": { "type": "string" },
            "description": "用戶 ID",
            "example": "123"
          }
        ],
        "responses": {
          "200": {
            "description": "成功",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/User" }
              }
            }
          }
        },
        "security": [{ "bearerAuth": [] }]
      }
    }
  }
}
```

---

### 5️⃣ 生成 OpenAPI 文檔

```typescript
// 創建生成器
const generator = new OpenApiGeneratorV3(registry.definitions);

// 生成完整文檔
const openApiDocument = generator.generateDocument({
  openapi: '3.0.0',
  info: {
    title: 'My API',
    version: '1.0.0',
    description: 'API 說明'
  },
  servers: [
    { url: 'http://localhost:3000', description: '開發環境' }
  ]
});

// 輸出為 JSON
import fs from 'fs';
fs.writeFileSync('openapi.json', JSON.stringify(openApiDocument, null, 2));
```

---

## 🎨 常見模式

### 模式 1: 可重用的 Schema Components

```typescript
// ✅ 好的做法：定義一次，到處引用
const UserSchema = z.object({ ... }).openapi('User', { ... });
registry.register('User', UserSchema);

// 在多個 API 中引用
registry.registerPath({
  path: '/api/users',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.array(UserSchema)  // 引用 UserSchema
        }
      }
    }
  }
});

registry.registerPath({
  path: '/api/users/{id}',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: UserSchema  // 再次引用
        }
      }
    }
  }
});
```

**生成的 OpenAPI 會自動使用 `$ref`:**
```json
{
  "responses": {
    "200": {
      "content": {
        "application/json": {
          "schema": {
            "$ref": "#/components/schemas/User"
          }
        }
      }
    }
  }
}
```

---

### 模式 2: 標準錯誤回應

```typescript
// 定義標準錯誤 schema
const ErrorSchema = z.object({
  error: z.string(),
  code: z.string(),
  details: z.record(z.string()).optional()
}).openapi('ErrorResponse', { description: '錯誤回應' });

registry.register('ErrorResponse', ErrorSchema);

// 註冊為可重用的 response component
registry.registerComponent('responses', 'NotFoundError', {
  description: '資源不存在',
  content: {
    'application/json': {
      schema: ErrorSchema
    }
  }
});

// 在多個 API 中引用
registry.registerPath({
  path: '/api/users/{id}',
  responses: {
    200: { ... },
    404: { $ref: '#/components/responses/NotFoundError' }  // 引用
  }
});

registry.registerPath({
  path: '/api/posts/{id}',
  responses: {
    200: { ... },
    404: { $ref: '#/components/responses/NotFoundError' }  // 再次引用
  }
});
```

---

### 模式 3: Security Schemes

```typescript
// 註冊 JWT 認證
registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description: '使用 JWT Token'
});

// 在需要認證的 API 中使用
registry.registerPath({
  path: '/api/users/me',
  security: [{ bearerAuth: [] }],  // 需要 JWT 認證
  responses: { ... }
});
```

**生成的 OpenAPI:**
```json
{
  "components": {
    "securitySchemes": {
      "bearerAuth": {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT",
        "description": "使用 JWT Token"
      }
    }
  },
  "paths": {
    "/api/users/me": {
      "get": {
        "security": [{ "bearerAuth": [] }],
        ...
      }
    }
  }
}
```

---

## 🔗 與 Swagger UI 整合

### 方式 1: 直接使用生成的文檔對象

```typescript
import express from 'express';
import swaggerUi from 'swagger-ui-express';

const app = express();

// 生成 OpenAPI 文檔
const openApiDocument = generateOpenApiDocument();

// 掛載 Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiDocument, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'My API Docs'
}));

app.listen(3000, () => {
  console.log('Swagger UI: http://localhost:3000/api-docs');
});
```

### 方式 2: 讀取 JSON 文件

```typescript
import fs from 'fs';

// 從文件讀取
const openApiSpec = JSON.parse(fs.readFileSync('./openapi.json', 'utf-8'));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
```

---

## 📊 完整範例執行流程

```bash
# 1. 查看範例代碼
cat .doc/zod-to-openapi-example.ts

# 2. 執行範例生成 OpenAPI 文檔
pnpm exec ts-node .doc/zod-to-openapi-example.ts

# 輸出:
# 🚀 開始生成 OpenAPI 文檔...
# 📊 統計資訊:
#   - Schemas: 3 個
#   - Paths: 5 個
#   - Security Schemes: 1 個
# ✅ OpenAPI JSON 已生成: .doc/example-openapi.json

# 3. 查看生成的文檔
cat .doc/example-openapi.json | jq '.info'

# 4. 在 Swagger Editor 中查看
# 打開 https://editor.swagger.io/
# 導入 example-openapi.json
```

---

## 🎓 關鍵概念總結

### Registry（註冊表）
- **作用:** 收集所有 schemas、paths、security schemes
- **方法:**
  - `registry.register(name, schema)` - 註冊 schema
  - `registry.registerPath(pathConfig)` - 註冊 API 路徑
  - `registry.registerComponent(type, name, config)` - 註冊組件

### .openapi() 方法
- **作用:** 為 Zod schema 添加 OpenAPI metadata
- **兩種用法:**
  1. `.openapi(metadata)` - 添加描述、範例等
  2. `.openapi(refId, metadata)` - 註冊為可引用的 component

### Generator（生成器）
- **作用:** 將 registry 中的定義轉換為 OpenAPI JSON
- **使用:** `new OpenApiGeneratorV3(registry.definitions)`

---

## 💡 最佳實踐

### 1. 組織結構
```
src/
├── validators/
│   ├── user.validators.ts      # 定義 schemas + 註冊
│   ├── post.validators.ts
│   └── ...
├── config/
│   └── openapi-registry.ts      # Registry 配置
└── scripts/
    └── generate-swagger.ts      # 生成腳本
```

### 2. 命名規範
```typescript
// Schema 命名：PascalCase + 描述性
const UserSchema = z.object({ ... }).openapi('User', { ... });
const CreateUserRequestSchema = z.object({ ... }).openapi('CreateUserRequest', { ... });
const UserListResponseSchema = z.object({ ... }).openapi('UserListResponse', { ... });

// 註冊名稱與變數名保持一致
registry.register('User', UserSchema);
registry.register('CreateUserRequest', CreateUserRequestSchema);
```

### 3. 文檔完整性
```typescript
// ✅ 好的做法：提供完整的 metadata
z.string().email().openapi({
  description: '電子郵件地址',
  example: 'user@example.com',
  format: 'email'
})

// ❌ 避免：缺少 metadata
z.string().email()
```

---

## 🔗 相關資源

- **範例文件:** `.doc/zod-to-openapi-example.ts`
- **生成的文檔:** `.doc/example-openapi.json`
- **官方文檔:** https://github.com/asteasolutions/zod-to-openapi
- **OpenAPI 規範:** https://swagger.io/specification/
- **Swagger Editor:** https://editor.swagger.io/

---

**最後更新:** 2026-01-08
