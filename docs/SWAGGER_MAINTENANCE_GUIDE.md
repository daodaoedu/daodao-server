# Swagger 文檔維護最佳實踐指南

## 專案現有實作分析

### 當前架構
本專案使用 **swagger-jsdoc** 來管理 API 文檔，採用分散式註解模式：

1. **配置檔案**: `src/config/swagger.config.ts` - 定義基本設定和全域參數
2. **Schema 定義**: `src/swagger/schemas/*.ts` - 資料模型定義
3. **Path 定義**: `src/swagger/paths/*.ts` - API 路徑和操作定義
4. **自動生成**: `npm run openapi:export` - 生成靜態 `openapi.yaml` 文件

### 優點
- TypeScript 支援，提供型別檢查
- 模組化設計，易於維護
- 自動生成靜態文檔，方便部署和分享

## Swagger 維護最佳實踐

### 1. 程式碼優先 (Code-First) vs 設計優先 (Design-First)

#### 程式碼優先方案（當前使用）
```typescript
// 在程式碼中使用 JSDoc 註解
/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: 取得用戶列表
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: 成功
 */
```

**優點**：
- 程式碼和文檔同步更新
- 減少維護成本
- 適合快速迭代

**缺點**：
- 註解可能污染程式碼
- 大型 API 難以管理

#### 設計優先方案
先寫 OpenAPI 規範，再生成程式碼框架

**優點**：
- 更好的 API 設計
- 前後端可並行開發
- 文檔更完整

**缺點**：
- 需要額外同步工作
- 可能與實際程式碼脫節

### 2. 建議的混合方案

結合兩種方法的優點：

```bash
# 專案結構
src/
├── swagger/
│   ├── schemas/      # 資料模型（可重用）
│   ├── paths/        # API 路徑定義
│   └── components/   # 可重用組件
├── routes/           # 實際路由實作
└── controllers/      # 業務邏輯

docs/
├── openapi.yaml      # 生成的完整規範
└── api-docs/         # 生成的靜態 HTML 文檔
```

### 3. 自動化工具鏈

#### A. 即時文檔生成
```json
// package.json
{
  "scripts": {
    "swagger:generate": "ts-node scripts/generate-openapi.ts",
    "swagger:watch": "nodemon --watch src/swagger --exec npm run swagger:generate",
    "swagger:validate": "swagger-cli validate openapi.yaml",
    "swagger:bundle": "swagger-cli bundle openapi.yaml -o docs/openapi-bundled.yaml",
    "swagger:html": "redoc-cli build openapi.yaml -o docs/api-docs.html",
    "swagger:all": "npm run swagger:generate && npm run swagger:validate && npm run swagger:html"
  }
}
```

#### B. TypeScript 型別生成
```bash
# 從 OpenAPI 生成 TypeScript 型別
npm install --save-dev openapi-typescript

# 生成型別
npx openapi-typescript openapi.yaml -o generated/openapi-types.ts
```

#### C. 自動驗證中間件
```typescript
// 使用 express-openapi-validator
import OpenApiValidator from 'express-openapi-validator';

app.use(
  OpenApiValidator.middleware({
    apiSpec: './openapi.yaml',
    validateRequests: true,
    validateResponses: true,
  })
);
```

### 4. 文檔組織最佳實踐

#### A. 模組化組織
```typescript
// src/swagger/schemas/user.schemas.ts
export const UserSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    email: { type: 'string', format: 'email' },
    name: { type: 'string' }
  },
  required: ['email', 'name']
};

// src/swagger/paths/user.paths.ts
export const userPaths = {
  '/users': {
    get: {
      summary: '取得用戶列表',
      tags: ['Users'],
      parameters: [
        { $ref: '#/components/parameters/limitParam' },
        { $ref: '#/components/parameters/cursorParam' }
      ],
      responses: {
        200: {
          description: '成功',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/UserListResponse'
              }
            }
          }
        }
      }
    }
  }
};
```

#### B. 共用組件重用
```typescript
// src/swagger/components/index.ts
export const components = {
  parameters: {
    idParam: {
      in: 'path',
      name: 'id',
      required: true,
      schema: { type: 'string', format: 'uuid' }
    },
    // ... 其他共用參數
  },
  responses: {
    NotFound: {
      description: '資源不存在',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/ApiErrorResponse' }
        }
      }
    },
    // ... 其他共用回應
  },
  schemas: {
    // ... 共用 schemas
  }
};
```

### 5. 版本控制策略

#### A. URL 版本控制（推薦）
```typescript
// 當前使用的方式
/api/v1/users
/api/v2/users  // 新版本
```

#### B. 文檔版本管理
```typescript
// swagger.config.ts
const versions = {
  v1: {
    openapi: '3.0.0',
    info: {
      title: 'DaoDao API v1',
      version: '1.0.0'
    },
    servers: [{ url: '/api/v1' }]
  },
  v2: {
    openapi: '3.0.0',
    info: {
      title: 'DaoDao API v2',
      version: '2.0.0'
    },
    servers: [{ url: '/api/v2' }]
  }
};
```

### 6. CI/CD 整合

#### A. 自動化測試
```yaml
# .github/workflows/api-docs.yml
name: API Documentation
on:
  push:
    paths:
      - 'src/swagger/**'
      - 'src/routes/**'
      
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node
        uses: actions/setup-node@v2
      - name: Install dependencies
        run: npm ci
      - name: Generate OpenAPI
        run: npm run swagger:generate
      - name: Validate OpenAPI
        run: npm run swagger:validate
      - name: Test API Contract
        run: npm run test:contract
```

#### B. 自動部署文檔
```yaml
      - name: Generate HTML Docs
        run: npm run swagger:html
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./docs
```

### 7. 實用工具推薦

#### 開發階段
- **swagger-jsdoc**: 從程式碼註解生成 OpenAPI
- **swagger-ui-express**: 嵌入式 Swagger UI
- **openapi-typescript**: 生成 TypeScript 型別
- **express-openapi-validator**: 請求/回應驗證

#### 文檔生成
- **redoc-cli**: 生成美觀的靜態 HTML 文檔
- **swagger-cli**: OpenAPI 文件驗證和打包
- **@apidevtools/swagger-parser**: 解析和驗證 OpenAPI

#### 測試工具
- **dredd**: API 契約測試
- **newman**: Postman 集合測試
- **schemathesis**: 基於 OpenAPI 的屬性測試

### 8. 維護檢查清單

- [ ] 每個 API 端點都有完整的文檔
- [ ] 所有請求/回應都有 schema 定義
- [ ] 使用共用組件避免重複
- [ ] 文檔包含完整的錯誤回應
- [ ] 提供請求範例和回應範例
- [ ] 定期驗證 OpenAPI 規範
- [ ] 自動生成客戶端 SDK
- [ ] 版本更新有明確的遷移指南

### 9. 專案特定建議

基於當前專案結構，建議：

1. **保持現有架構**：swagger-jsdoc 方案運作良好
2. **增強自動化**：
   ```bash
   npm run swagger:watch  # 開發時自動更新
   npm run swagger:all    # 構建時生成所有文檔
   ```
3. **改善組織結構**：
   - 將重複的 schema 抽取到 `components`
   - 統一錯誤回應格式
   - 建立參數驗證規則庫
4. **加入契約測試**：確保實作符合文檔
5. **版本策略**：為 v2 API 準備獨立的 swagger 配置

## 實施步驟

### Phase 1: 優化現有結構（1-2 週）
1. 重構 swagger 文件結構
2. 抽取共用組件
3. 統一回應格式

### Phase 2: 自動化增強（1 週）
1. 設置文檔自動生成
2. 加入 OpenAPI 驗證
3. 生成靜態 HTML 文檔

### Phase 3: 測試整合（2 週）
1. 加入契約測試
2. 設置 CI/CD pipeline
3. 自動部署文檔

### Phase 4: 進階功能（持續）
1. 生成客戶端 SDK
2. API 版本管理
3. 效能監控整合

## 總結

當前專案的 Swagger 實作已經相當完善，建議：
1. **維持 Code-First 方案**，因為適合快速迭代
2. **增強自動化工具鏈**，減少手動維護成本
3. **改善文檔組織**，提高可維護性
4. **加入驗證和測試**，確保文檔準確性

透過這些最佳實踐，可以確保 API 文檔始終與程式碼同步，提供良好的開發者體驗。