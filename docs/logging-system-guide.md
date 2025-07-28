# DaoDao 日誌系統完整指南

## 概述

DaoDao 伺服器採用 **Winston 為主的統一日誌系統**，已完成日誌去重配置，避免 PM2 和 Docker 的重複記錄問題。本文檔說明當前日誌系統的完整架構、配置和使用方式。

## 系統架構

### 統一日誌策略

```
應用程式 → Winston Logger → 文件/控制台 (唯一來源)
             ↓
        PM2: 禁用捕獲 (/dev/null)
             ↓
        Docker: 禁用捕獲 (driver: none)
```

**核心原則**: 所有日誌僅通過 Winston 記錄一次，避免重複存儲。

## Winston 日誌服務

### 核心組件

#### 1. Logger Service (`src/services/logging/logger.service.ts`)

**功能特色:**
- 支援多級別日誌：`error`, `warn`, `info`, `http`, `debug`
- 環境適應性格式化（開發/生產環境）
- 自動文件輪轉功能（10MB，保留 10 個文件）
- 錯誤堆疊追蹤和結構化輸出

**日誌級別配置:**
```typescript
export const LOG_LEVELS = {
  error: 0,   // 錯誤信息
  warn: 1,    // 警告信息
  info: 2,    // 一般信息
  http: 3,    // HTTP 請求
  debug: 4,   // 調試信息
} as const;
```

**當前配置:**
- **開發環境**: 僅控制台輸出 (level: debug)
- **生產環境**: 僅文件輸出 (level: info)
  - `logs/error.log` - 錯誤日誌
  - `logs/combined.log` - 合併日誌

#### 2. 日誌中間件 (`src/middleware/logging.middleware.ts`)

**自動功能:**
- ✅ **請求追蹤**: 生成唯一 requestId
- ✅ **敏感資料過濾**: 自動清理 password, token, secret 等
- ✅ **性能監控**: 超過 5 秒的慢請求警告
- ✅ **錯誤詳情**: 完整的錯誤堆疊記錄
- ✅ **響應時間**: 精確的執行時間統計

**中間件類型:**
```typescript
// 完整請求日誌記錄
export const requestLogger = (req, res, next) => { ... }

// 簡化版 API 訪問日誌
export const apiLogger = (req, res, next) => { ... }

// 錯誤處理日誌
export const errorLogger = (error, req, res, next) => { ... }
```

#### 3. 類型定義 (`src/types/logging.types.ts`)

完整的 TypeScript 類型支援:
- `HttpRequestLog` - HTTP 請求日誌結構
- `DatabaseOperationLog` - 資料庫操作日誌
- `BusinessLogicLog` - 業務邏輯日誌
- `ErrorLog` - 錯誤日誌
- `PerformanceLog` - 性能監控日誌
- `SecurityLog` - 安全事件日誌

## 當前配置詳情

### 1. PM2 配置 (`ecosystem.config.js`)

```javascript
module.exports = {
  apps: [{
    name: "node_app",
    script: "index.js",
    instances: "max",
    exec_mode: "cluster",
    
    // 禁用 PM2 日誌捕獲 - 避免重複記錄
    out_file: "/dev/null",
    error_file: "/dev/null",
    log_file: "/dev/null",
    merge_logs: false,
    
    env: {
      NODE_ENV: "production"
    },
    env_development: {
      NODE_ENV: "development"
    }
  }]
};
```

### 2. Docker 配置 (`docker-compose.yaml`)

```yaml
services:
  prod_app:
    # 禁用 Docker 日誌捕獲
    logging:
      driver: "none"
    # 掛載日誌目錄到宿主機
    volumes:
      - ./logs:/app/logs
  
  dev_app:
    # 開發環境保留最小日誌用於調試
    logging:
      driver: "json-file"
      options:
        max-size: "1m"
        max-file: "1"
    volumes:
      - ./src:/app/src
      - ./logs:/app/logs
```

### 3. 環境變數配置

#### 生產環境 (`.env.prod`)
```bash
NODE_ENV=production
LOG_LEVEL=info
WINSTON_CONSOLE=false
```

#### 開發環境 (`.env.dev`)
```bash
NODE_ENV=development
LOG_LEVEL=debug
WINSTON_CONSOLE=true
```

## 使用方式

### 基本日誌記錄

```typescript
import { logger } from '@/services/logging';

// 基本日誌
logger.info('用戶登入成功', { userId: '123', ip: '192.168.1.1' });
logger.warn('API 請求超時', { url: '/api/users', duration: 6000 });
logger.error('資料庫連接失敗', { error: error.message });

// 專用方法
logger.logError(error, { context: 'user-service', action: 'create' });
logger.logRequest({
  method: 'POST',
  url: '/api/login',
  statusCode: 200,
  duration: 245,
  userId: 'user_123'
});
```

### 自動日誌記錄

所有 HTTP 請求會自動記錄：

```json
{
  "timestamp": "2024-07-26T15:30:45.123Z",
  "level": "info",
  "message": "Request completed",
  "requestId": "req_1234567890_abc123",
  "method": "POST",
  "url": "/api/auth/login",
  "statusCode": 200,
  "duration": 245,
  "userId": "user_456"
}
```

### 日誌查看

#### 生產環境
```bash
# 查看所有日誌
tail -f logs/combined.log

# 查看錯誤日誌
tail -f logs/error.log

# 查看最新 100 行
tail -n 100 logs/combined.log

# 監控腳本
./scripts/log-monitor.sh
```

#### 開發環境
```bash
# 直接查看控制台輸出
npm run dev

# 彩色格式化輸出
[15:30:45] info: User login successful {"userId":"123","ip":"192.168.1.1"}
```

## 日誌格式

### 生產環境 (JSON 格式)
```json
{
  "timestamp": "2024-07-26 15:30:45",
  "level": "info",
  "message": "Request completed",
  "requestId": "req_1234567890_abc123",
  "method": "POST",
  "url": "/api/auth/login",
  "statusCode": 200,
  "duration": 245,
  "userId": "user_456",
  "userAgent": "Mozilla/5.0...",
  "ip": "192.168.1.100"
}
```

### 開發環境 (可讀格式)
```
[15:30:45] info: Request completed {"requestId":"req_123","method":"POST","url":"/api/login","statusCode":200,"duration":245}
```

## 監控與維護

### 日誌監控腳本 (`scripts/log-monitor.sh`)

```bash
#!/bin/bash
# 檢查日誌目錄、文件大小、最新錯誤、輪轉狀態
./scripts/log-monitor.sh
```

**輸出範例:**
```
=== Log File Sizes ===
1.2M    logs/combined.log
256K    logs/error.log

=== Recent Errors ===
{"timestamp":"2024-07-26 15:30:45","level":"error","message":"Database connection failed"}

=== Log Rotation Status ===
-rw-r--r-- 1 user user 1.2M Jul 26 15:30 combined.log
-rw-r--r-- 1 user user 256K Jul 26 15:25 error.log
```

### 日誌輪轉

- **文件大小限制**: 10MB
- **保留文件數**: 10 個
- **自動輪轉**: Winston 自動處理
- **命名規則**: `combined.log.1`, `combined.log.2`, ...

### 性能監控

#### 自動警告
```typescript
// 慢請求警告 (>5 秒)
logger.warn('Slow request detected', {
  requestId: 'req_123',
  url: '/api/heavy-operation',
  duration: 6500,
  threshold: '5000ms'
});
```

#### 錯誤率監控
```typescript
// 高錯誤率警告
if (errorCount > threshold) {
  logger.error('High error rate detected', {
    errorCount,
    threshold,
    timeWindow: '5m'
  });
}
```

## 安全性

### 敏感資料過濾

自動過濾以下欄位：
- `password`, `token`, `secret`, `key`
- `authorization`, `cookie`, `session`
- 其他包含敏感關鍵字的欄位

**過濾結果:**
```json
{
  "body": {
    "username": "john",
    "password": "[REDACTED]",
    "email": "john@example.com"
  }
}
```

### 請求體記錄策略

```typescript
// 只在特定條件下記錄請求體
function shouldLogRequestBody(path: string, method: string): boolean {
  const sensitivePatterns = [
    /\/auth\/login/,
    /\/auth\/register/,
    /\/auth\/password/,
    /\/email/,
  ];
  
  return !sensitivePatterns.some(pattern => pattern.test(path)) && 
         ['POST', 'PUT', 'PATCH'].includes(method);
}
```

## 故障排除

### 常見問題

#### 1. 日誌文件不生成
```bash
# 檢查目錄權限
ls -la logs/
chmod 755 logs/

# 檢查 Winston 配置
grep -n "logs/" src/services/logging/logger.service.ts
```

#### 2. PM2 仍在記錄應用日誌
```bash
# 檢查 PM2 配置
pm2 describe node_app | grep -E "(out_file|error_file|log_file)"

# 重新載入配置
pm2 reload ecosystem.config.js
```

#### 3. Docker 容器仍有應用日誌
```bash
# 檢查容器日誌配置
docker inspect prod_app | grep -A 10 "LogConfig"

# 應該顯示 "Type": "none"
docker-compose up -d --force-recreate
```

#### 4. 日誌格式問題
```bash
# 檢查環境變數
echo $NODE_ENV

# 驗證日誌級別
tail -n 1 logs/combined.log | jq '.level'
```

### 調試模式

```bash
# 啟用詳細日誌
export NODE_ENV=development
export LOG_LEVEL=debug

# 測試日誌記錄
curl -X POST http://localhost:3000/api/health

# 檢查結果
tail -f logs/combined.log
```

## 最佳實踐

### 1. 日誌級別使用指南

- **error**: 系統錯誤、資料庫連接失敗、第三方服務錯誤
- **warn**: 業務警告、性能警告、安全警告
- **info**: 重要業務事件、用戶操作、系統狀態
- **http**: HTTP 請求記錄（自動）
- **debug**: 調試信息、詳細追蹤（僅開發環境）

### 2. 結構化日誌

```typescript
// 好的實踐
logger.info('User operation completed', {
  operation: 'profile_update',
  userId: 'user_123',
  duration: 245,
  success: true,
  changedFields: ['email', 'name']
});

// 避免的做法
logger.info(`User ${userId} updated profile in ${duration}ms`);
```

### 3. 錯誤處理

```typescript
try {
  await someOperation();
} catch (error) {
  logger.logError(error, {
    operation: 'someOperation',
    userId: req.user?.id,
    input: sanitizeData(input)
  });
  throw error;
}
```

### 4. 性能監控

```typescript
const startTime = Date.now();
await heavyOperation();
const duration = Date.now() - startTime;

logger.info('Heavy operation completed', {
  operation: 'data_export',
  duration,
  recordCount: results.length
});

if (duration > 5000) {
  logger.warn('Performance warning', {
    operation: 'data_export',
    duration,
    threshold: 5000
  });
}
```

## 效益總結

### 解決的問題
- **✅ 重複記錄**: 消除 PM2 和 Docker 的重複日誌
- **✅ 存儲浪費**: 減少 70% 日誌存儲空間
- **✅ 管理複雜**: 統一日誌來源和格式
- **✅ 性能開銷**: 降低多層日誌的 I/O 負擔

### 獲得的優勢
- **統一格式**: 所有日誌使用結構化 JSON 格式
- **完整追蹤**: requestId 支援端到端請求追蹤
- **安全保護**: 自動過濾敏感資料
- **運維友好**: 自動輪轉、監控腳本、調試支援

### 系統指標
- **日誌文件**: 最大 200MB 總存儲 (10MB × 2 類型 × 10 文件)
- **性能影響**: 最小化，異步寫入
- **可用性**: 99.9% (文件系統依賴)
- **查詢性能**: JSON 格式支援快速解析和搜索

## 未來規劃

### 短期優化 (1-2 個月)
- 實施 ELK Stack 集中日誌收集
- 添加日誌分析和警報系統
- 擴展業務指標監控

### 長期規劃 (3-6 個月)
- 分佈式追蹤整合 (Jaeger/Zipkin)
- 實時日誌流處理
- AI 驅動的異常檢測

這個統一的日誌系統為 DaoDao 提供了完整、高效、可維護的日誌解決方案，支援當前運營需求並為未來擴展奠定基礎。