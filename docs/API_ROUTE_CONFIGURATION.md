# API 路由配置文檔

## 問題分析與解決方案

### 問題描述
`/api` 路由無法正常工作，所有 `/api/*` 請求返回 404 錯誤。

### 根本原因
Express.js 中間件和路由的**註冊順序**問題：

1. **靜態文件中間件優先級過高**：`express.static()` 被放在 TypeScript 路由註冊之前
2. **路由處理順序**：Express 按照註冊順序處理請求，靜態文件中間件會先攔截請求並返回 404

### 解決方案

#### 1. 路由註冊順序調整

**修改前的順序（錯誤）**：
```javascript
// 靜態文件中間件在前
app.use(express.static(path.join(__dirname, 'public')));

// TypeScript 路由在後
setupTypescriptRoutes(app);
```

**修改後的順序（正確）**：
```javascript
// TypeScript 路由在前
setupTypescriptRoutes(app);

// 靜態文件中間件在後
app.use(express.static(path.join(__dirname, 'public')));
```

#### 2. Swagger UI 參數顯示問題

**問題**：Swagger UI 中參數名稱顯示為 `()` 而不是實際參數名。

**原因**：`index.js` 中的 Swagger 配置缺少 `components.parameters` 定義。

**解決方案**：使用完整的 TypeScript Swagger 配置：

```javascript
// 使用 TypeScript Swagger 配置
let swaggerSpec;
try {
  require('ts-node/register');
  require('tsconfig-paths/register');
  const { swaggerSpec: tsSwaggerSpec } = require('./src/config/swagger.config.ts');
  swaggerSpec = tsSwaggerSpec;
  console.log('✅ 使用 TypeScript Swagger 配置');
} catch (error) {
  // 回退到基本配置
  const swaggerOptions = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'DaoDao API',
        version: '1.0.0',
        description: 'DaoDao Learning Platform API Documentation'
      },
      servers: [{ url: 'http://localhost:4000', description: 'Development server' }]
    },
    apis: ['./routes/*.js', './src/routes/*.ts', './src/swagger/**/*.ts']
  };
  swaggerSpec = swaggerJsdoc(swaggerOptions);
}
```

## 當前路由配置

### 主要路由結構

#### JavaScript 路由（根級別）
```
/users           - 用戶管理
/projects        - 項目管理  
/ideas           - 想法管理
/marathons       - 馬拉松活動
/mentors         - 導師管理
/tags            - 標籤管理
/emails          - 郵件服務
/images          - 圖片服務
/monitor         - 監控服務
/db-info         - 數據庫信息
```

#### TypeScript 路由（/api 前綴）
```
/api/resources                    - 資源管理
/api/resources/:resourceId/reviews - 資源評價
/api/ts-test                     - TypeScript 測試路由
/health                          - 健康檢查
```

### 路由註冊流程

1. **基礎配置**
   ```javascript
   // 基本中間件
   app.use(express.json());
   app.use(express.urlencoded({ extended: true }));
   app.use(cors());
   ```

2. **JavaScript 路由註冊**
   ```javascript
   app.use("/users", userRoutes);
   app.use("/projects", projectRoutes);
   // ... 其他 JS 路由
   ```

3. **TypeScript 路由註冊**
   ```javascript
   setupTypescriptRoutes(app);
   ```

4. **測試路由**
   ```javascript
   app.get('/api/test', (req, res) => {
     res.json({ message: 'API is working', timestamp: new Date().toISOString() });
   });
   ```

5. **靜態文件服務**
   ```javascript
   app.use(express.static(path.join(__dirname, 'public')));
   ```

## TypeScript 路由配置

### src/app.ts 配置
```typescript
export function setupTypescriptRoutes(app: express.Application) {
  // 模型橋接
  setupModelBridge();
  
  // 測試路由
  app.get('/api/ts-test', (req, res) => {
    res.json({
      message: 'TypeScript routes are working!',
      timestamp: new Date().toISOString()
    });
  });
  
  // 業務路由
  app.use('/api/resources', resourceRoutes);
  app.use('/api/resources', resourceReviewRoutes);
  
  // 健康檢查
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  });
}
```

## Swagger 文檔配置

### 組件參數定義
- `cursorParam` - 游標分頁參數
- `resourceLimitParam` - 資源分頁限制
- `sortParam` - 排序欄位
- `orderParam` - 排序方向
- `idParam` - 資源 ID 參數

### API 文檔訪問
- **主要入口**：http://localhost:4000/api-docs
- **備用入口**：http://localhost:4000/api/docs（重定向到主入口）

## 測試端點

### 路由測試
```bash
# JavaScript 路由測試
curl http://localhost:4000/users

# TypeScript 路由測試  
curl http://localhost:4000/api/ts-test
curl http://localhost:4000/api/resources
curl http://localhost:4000/health

# API 測試路由
curl http://localhost:4000/api/test
```

## 調試功能

### 請求日誌中間件
```javascript
app.use((req, res, next) => {
  console.log(`📍 ${req.method} ${req.path}`);
  next();
});
```

### 路由信息打印
在服務器啟動時會顯示：
- 已載入的 TypeScript 模型
- 路由註冊狀態
- 數據庫連接狀態
- Swagger UI 可用性

## 關鍵學習點

1. **Express 中間件順序至關重要**
2. **靜態文件中間件應該放在 API 路由之後**
3. **TypeScript 路由需要正確的編譯配置**
4. **Swagger 組件定義必須完整才能正確顯示參數**
5. **路由調試可以通過中間件日誌實現**

## 性能考量

- TypeScript 路由使用 `ts-node` 進行即時編譯
- 生產環境建議預編譯 TypeScript
- 靜態文件服務放在最後可以避免不必要的文件系統查找