# Docker OpenAPI 調試指南

## 問題背景
VPS 部署後無法讀取 OpenAPI 文檔，顯示 "API Documentation Not Available"

## 解決方案實施
已改進 `src/app.ts` 中的檔案路徑解析邏輯，增加多個備用路徑檢查。

## 生產環境驗證步驟

### 1. 進入容器
```bash
docker exec -it $(docker ps --filter "name=daodao-server-dev_app" -q | head -n 1) sh
```

### 2. 檢查檔案存在性
```bash
pwd && ls -la openapi.*
```
**預期結果：** 應該看到 `openapi.json` 和 `openapi.yaml` 檔案

### 3. 檢查應用日誌 (PM2)
```bash
pm2 logs --lines 50
```
**關鍵訊息：** 查找 "🔍 OpenAPI 路徑調試:" 相關的日誌

### 4. 或檢查容器日誌
```bash
docker logs $(docker ps --filter "name=daodao-server-dev_app" -q | head -n 1) | grep -A 10 "OpenAPI 路徑調試"
```

### 5. 測試 Swagger UI 可訪問性
```bash
# 檢查 API 文檔端點
curl -I localhost:3000/api-docs

# 檢查 OpenAPI JSON
curl -I localhost:3000/api-docs/swagger-ui-init.js
```

## 路徑解析邏輯

改進後的代碼會按順序檢查以下路徑：

1. **主要路徑**：
   - 開發環境：`../openapi.json`
   - 生產環境：`../../openapi.json`

2. **備用路徑**：
   - `process.cwd()/openapi.json` (工作目錄)
   - `path.join(process.cwd(), 'openapi.json')` (當前目錄)
   - `path.resolve(__dirname, '../../openapi.json')` (相對於 dist/src)
   - `path.resolve(__dirname, '../../../openapi.json')` (更深層結構)
   - `/app/openapi.json` (Docker 容器固定路徑)

## 預期的調試輸出

成功的情況下應該看到類似以下的日誌：

```
🔍 OpenAPI 路徑調試:
    __dirname: /app/dist/src
    process.cwd(): /app
    isDist: true
    openapiPath: /app/openapi.json
    文件存在: true
✅ 已載入 Zod v4 自動生成的 OpenAPI 文檔
📚 Swagger UI 已初始化 - 可在 /api-docs 和 /api/docs 訪問
```

## 故障排除

### 如果仍然顯示 "API Documentation Not Available"：

1. **檢查檔案權限**：
   ```bash
   ls -la /app/openapi.json
   ```

2. **手動測試路徑解析**：
   ```bash
   node -e "
   const path = require('path');
   const fs = require('fs');
   console.log('Working dir:', process.cwd());
   console.log('__dirname would be:', '/app/dist/src');
   console.log('OpenAPI exists at /app/openapi.json:', fs.existsSync('/app/openapi.json'));
   "
   ```

3. **重新生成 OpenAPI 文檔**：
   ```bash
   cd /app
   npm run swagger:generate
   ```

## 部署後驗證

部署完成後，從外部測試：

```bash
# 測試 Swagger UI
curl -I https://your-domain.com/api-docs

# 檢查 OpenAPI 規範載入
curl https://your-domain.com/api-docs/ | grep -o "\"title\":\"[^\"]*\""
```

預期回應應包含 API 標題而非 "API Documentation Not Available"。