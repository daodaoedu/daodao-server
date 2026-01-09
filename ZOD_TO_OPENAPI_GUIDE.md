# Zod-to-OpenAPI 官方推薦用法指南

## 官方標準做法

根據 [@asteasolutions/zod-to-openapi](https://github.com/asteasolutions/zod-to-openapi) 官方文檔，推薦的做法是：

### 1. 在路由文件中使用 `registry.registerPath()`

每個路由需要兩部分定義：

1. **OpenAPI 定義**（使用 `registry.registerPath()`）
2. **Express 路由**（實際的 HTTP 處理）

```typescript
// ✅ OpenAPI 定義
registry.registerPath({
  method: 'get',
  path: '/api/v1/users',
  tags: ['Users'],
  summary: '獲取用戶列表',
  request: {
    query: getUserQuerySchema
  },
  responses: {
    200: {
      description: '成功獲取用戶列表',
      content: {
        'application/json': {
          schema: usersListResponseSchema
        }
      }
    }
  }
});

// ✅ Express 路由（保持不變）
router.get('/', userController.getAllUsers);
```

## 關鍵概念

### 1. Request 結構

```typescript
request: {
  params: z.object({...}),   // 路徑參數 (e.g., /users/{id})
  query: z.object({...}),    // 查詢參數 (e.g., ?page=1&size=10)
  body: {                    // 請求體
    content: {
      'application/json': {
        schema: yourSchema
      }
    }
  }
}
```

### 2. Responses 結構

```typescript
responses: {
  200: {
    description: '成功描述',
    content: {
      'application/json': {
        schema: responseSchema  // 引用 validator 中的 schema
      }
    }
  },
  // 使用預定義的錯誤回應
  400: { $ref: '#/components/responses/BadRequestError' },
  401: { $ref: '#/components/responses/UnauthorizedError' }
}
```

### 3. Security（認證要求）

```typescript
security: [{ bearerAuth: [] }]  // 需要 JWT 認證
```

## 完整範例

查看 `src/routes/user.routes.openapi-example.ts` 了解完整實現。

## 在你的專案中實現的步驟

### 步驟 1：在每個路由文件頂部導入 registry

```typescript
import { registry } from '../config/openapi-registry';
```

### 步驟 2：為每個路由添加 OpenAPI 定義

在 Express 路由定義**之前**，添加對應的 `registry.registerPath()` 調用：

```typescript
// ✅ 1. OpenAPI 定義
registry.registerPath({
  method: 'post',
  path: '/api/v1/users',
  tags: ['Users'],
  summary: '創建新用戶',
  request: {
    body: {
      content: {
        'application/json': {
          schema: createUserSchema
        }
      }
    }
  },
  responses: {
    201: {
      description: '用戶創建成功',
      content: {
        'application/json': {
          schema: createUserResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' }
  },
  security: [{ bearerAuth: [] }]
});

// ✅ 2. Express 路由（保持原樣）
router.post('/', authenticate, validate(createUserSchema, 'body'), userController.createUser);
```

### 步驟 3：運行應用並驗證

```bash
pnpm run dev
```

訪問 http://localhost:4000/api-docs 查看生成的 Swagger UI。

## 路徑參數的特殊處理

Express 使用 `:id`，OpenAPI 使用 `{id}`：

```typescript
// OpenAPI
registry.registerPath({
  method: 'get',
  path: '/api/v1/users/{id}',  // ✅ 使用 {id}
  request: {
    params: z.object({
      id: z.string().uuid()
    })
  }
});

// Express
router.get('/:id', controller.getUser);  // ✅ 使用 :id
```

## 常見模式

### GET 請求（帶查詢參數）

```typescript
registry.registerPath({
  method: 'get',
  path: '/api/v1/users',
  request: {
    query: z.object({
      page: z.string().optional(),
      pageSize: z.string().optional()
    })
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: paginatedResponseSchema
        }
      }
    }
  }
});
```

### POST 請求（帶請求體）

```typescript
registry.registerPath({
  method: 'post',
  path: '/api/v1/users',
  request: {
    body: {
      content: {
        'application/json': {
          schema: createUserSchema
        }
      }
    }
  },
  responses: {
    201: {
      content: {
        'application/json': {
          schema: createUserResponseSchema
        }
      }
    }
  },
  security: [{ bearerAuth: [] }]
});
```

### PUT/PATCH 請求（帶參數和請求體）

```typescript
registry.registerPath({
  method: 'put',
  path: '/api/v1/users/{id}',
  request: {
    params: z.object({
      id: z.string().uuid()
    }),
    body: {
      content: {
        'application/json': {
          schema: updateUserSchema
        }
      }
    }
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: updateUserResponseSchema
        }
      }
    }
  },
  security: [{ bearerAuth: [] }]
});
```

### DELETE 請求

```typescript
registry.registerPath({
  method: 'delete',
  path: '/api/v1/users/{id}',
  request: {
    params: z.object({
      id: z.string()
    })
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: deleteUserResponseSchema
        }
      }
    }
  },
  security: [{ bearerAuth: [] }]
});
```

## 優勢

### ✅ 符合官方推薦

- 使用 `registry.registerPath()` API
- 與 schemas 定義分離
- 類型安全的路由定義

### ✅ 完全控制

- 可以自定義每個路由的文檔
- 支持複雜的請求/回應結構
- 可以添加詳細的描述和範例

### ✅ 運行時生成

- 不需要構建時腳本
- 文檔與代碼同步更新
- 開發體驗更好

## 參考資料

- [Official Documentation](https://github.com/asteasolutions/zod-to-openapi)
- [Official Example](https://github.com/asteasolutions/zod-to-openapi/blob/master/example/index.ts)
- [Hono Integration](https://hono.dev/examples/zod-openapi)

## 下一步

1. 參考 `src/routes/user.routes.openapi-example.ts` 範例
2. 逐步為每個路由文件添加 OpenAPI 定義
3. 測試生成的文檔
4. 根據需要調整描述和範例

建議從最重要的 API 開始（如 user、auth 路由），逐步遷移其他路由。
