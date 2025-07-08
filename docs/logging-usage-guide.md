# 日誌使用指南

## 概述

本文檔說明 DaoDao 專案中 TypeScript 部分 (src/ 目錄) 的日誌系統使用方式。目前系統使用基於 `console` 的日誌記錄，並提供了專用的日誌中間件和工具函數。

## 日誌中間件

### 1. 請求日誌中間件 (`requestLogger`)

**位置**: `src/middleware/logging.middleware.ts:11`

記錄所有 HTTP 請求的詳細資訊，包括:
- 請求時間戳
- HTTP 方法和 URL
- 狀態碼
- 響應時間
- 用戶代理和 IP 地址
- 用戶 ID (如果已驗證)

```typescript
import { requestLogger } from '../middleware/logging.middleware';

// 在 Express 應用中使用
app.use(requestLogger);
```

**日誌級別規則**:
- 狀態碼 >= 500: `console.error`
- 狀態碼 >= 400: `console.warn`
- 其他: `console.log`

### 2. API 訪問日誌中間件 (`apiLogger`)

**位置**: `src/middleware/logging.middleware.ts:56`

簡化版本的請求日誌，僅記錄關鍵資訊:

```typescript
import { apiLogger } from '../middleware/logging.middleware';

// 簡化日誌格式: GET /api/v1/users - 200 - 45ms
app.use(apiLogger);
```

## 日誌工具函數

### 1. 錯誤日誌 (`logError`)

**位置**: `src/middleware/logging.middleware.ts:75`

記錄應用程式錯誤的詳細資訊:

```typescript
import { logError } from '../middleware/logging.middleware';

try {
  // 業務邏輯
} catch (error) {
  logError(error, { 
    userId: user.id, 
    action: 'updateProfile' 
  });
}
```

### 2. 資料庫操作日誌 (`logDatabaseOperation`)

**位置**: `src/middleware/logging.middleware.ts:90`

記錄資料庫操作的詳細資訊:

```typescript
import { logDatabaseOperation } from '../middleware/logging.middleware';

const startTime = Date.now();
try {
  await prisma.user.create(userData);
  const duration = Date.now() - startTime;
  logDatabaseOperation('CREATE', 'User', duration, true);
} catch (error) {
  logDatabaseOperation('CREATE', 'User', undefined, false);
  throw error;
}
```

## 錯誤處理中的日誌記錄

### 全域錯誤處理器

**位置**: `src/middleware/error.middleware.ts:13`

全域錯誤處理中間件會根據環境自動記錄錯誤:

- **開發環境**: 記錄完整的錯誤詳情 (包括 stack trace)
- **生產環境**: 只記錄必要資訊 (不包括 stack trace)

```typescript
// 錯誤日誌自動記錄，無需手動調用
```

## 當前使用模式

### 1. 在服務層使用

```typescript
// src/services/database/postgres.service.ts:21
console.log('✅ PostgreSQL (Prisma) 資料庫連接成功');

// src/services/database/postgres.service.ts:23
console.error('❌ 無法連接到 PostgreSQL 資料庫:', error);
```

### 2. 在應用初始化中使用

```typescript
// src/app.ts:34
console.log('🚀 初始化 TypeScript 模型和相關設定...');

// src/app.ts:39
console.log('🔐 Passport 認證系統已初始化');
```

### 3. 在控制器中使用

目前大部分控制器依賴全域錯誤處理器進行日誌記錄，很少直接使用 `console.log`。

## 日誌格式標準

### 1. 成功訊息格式

```typescript
console.log('✅ 操作成功描述');
console.log('🚀 系統初始化描述');
console.log('🔐 認證系統描述');
```

### 2. 錯誤訊息格式

```typescript
console.error('❌ 錯誤描述:', error);
console.warn('⚠️ 警告描述:', warning);
```

### 3. 結構化日誌格式

```typescript
const logData = {
  timestamp: new Date().toISOString(),
  operation: '操作類型',
  table: '資料表名稱',
  success: true,
  duration: '123ms'
};
console.log('DB Operation:', logData);
```

## 最佳實踐

### 1. 使用適當的日誌級別

- `console.log`: 一般資訊和成功操作
- `console.warn`: 警告和客戶端錯誤 (4xx)
- `console.error`: 錯誤和伺服器錯誤 (5xx)

### 2. 結構化日誌

```typescript
// 推薦：結構化日誌
const logData = {
  timestamp: new Date().toISOString(),
  userId: user.id,
  action: 'login',
  success: true
};
console.log('User Action:', logData);

// 不推薦：純文字日誌
console.log('User logged in');
```

### 3. 包含上下文資訊

```typescript
// 包含有用的上下文資訊
logError(error, {
  userId: req.user?.id,
  endpoint: req.originalUrl,
  method: req.method,
  timestamp: new Date().toISOString()
});
```

### 4. 避免記錄敏感資訊

```typescript
// 不要記錄密碼、令牌等敏感資訊
const safeUserData = {
  id: user.id,
  email: user.email,
  // 不包含 password, token 等
};
console.log('User data:', safeUserData);
```

## 注意事項

1. **環境差異**: 錯誤處理器在開發環境和生產環境中的日誌記錄方式不同
2. **性能考慮**: 大量日誌記錄可能影響性能，建議在生產環境中使用適當的日誌級別
3. **日誌輪轉**: 目前使用 `console` 輸出，建議在生產環境中配置日誌輪轉
4. **監控集成**: 考慮未來集成專業的日誌監控系統 (如 ELK Stack)

## 日誌系統升級規劃

### 1. Winston 日誌庫集成

#### 1.1 安裝依賴
```bash
npm install winston winston-daily-rotate-file
npm install --save-dev @types/winston
```

#### 1.2 Winston 配置架構
```typescript
// src/config/logger.config.ts
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // 控制台輸出
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    // 每日輪轉文件
    new DailyRotateFile({
      filename: 'logs/app-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d'
    })
  ]
});
```

#### 1.3 日誌服務封裝
```typescript
// src/services/logger.service.ts
import { logger } from '../config/logger.config';

export const loggerService = {
  info: (message: string, meta?: Record<string, unknown>) => {
    logger.info(message, meta);
  },
  error: (message: string, error?: Error, meta?: Record<string, unknown>) => {
    logger.error(message, { error: error?.stack, ...meta });
  },
  warn: (message: string, meta?: Record<string, unknown>) => {
    logger.warn(message, meta);
  },
  debug: (message: string, meta?: Record<string, unknown>) => {
    logger.debug(message, meta);
  }
};
```

### 2. 日誌分級和過濾策略

#### 2.1 日誌級別定義
```typescript
const LOG_LEVELS = {
  error: 0,    // 錯誤：系統錯誤、異常
  warn: 1,     // 警告：客戶端錯誤、潛在問題
  info: 2,     // 資訊：正常操作、系統狀態
  http: 3,     // HTTP：請求/響應日誌
  debug: 4     // 調試：詳細調試資訊
} as const;
```

#### 2.2 環境配置
```typescript
// 不同環境的日誌配置
const getLogLevel = (): string => {
  switch (process.env.NODE_ENV) {
    case 'production':
      return 'warn';
    case 'test':
      return 'error';
    case 'development':
    default:
      return 'debug';
  }
};
```

#### 2.3 日誌過濾器
```typescript
// src/config/logger.config.ts
const shouldLog = (level: string, message: string): boolean => {
  // 過濾敏感資訊
  const sensitivePatterns = [
    /password/i,
    /token/i,
    /secret/i,
    /authorization/i
  ];
  
  return !sensitivePatterns.some(pattern => 
    pattern.test(message)
  );
};
```

### 3. 日誌輪轉和歸檔功能

#### 3.1 每日輪轉配置
```typescript
// 應用程式日誌
new DailyRotateFile({
  filename: 'logs/app-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  compression: 'gzip'
});

// 錯誤日誌
new DailyRotateFile({
  filename: 'logs/error-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxSize: '10m',
  maxFiles: '30d',
  compression: 'gzip'
});

// HTTP 請求日誌
new DailyRotateFile({
  filename: 'logs/access-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  level: 'http',
  maxSize: '50m',
  maxFiles: '7d',
  compression: 'gzip'
});
```

#### 3.2 日誌歸檔策略
```typescript
// 歸檔配置
const archiveConfig = {
  daily: {
    retention: '14d',  // 保留14天
    compression: 'gzip'
  },
  error: {
    retention: '30d',  // 錯誤日誌保留30天
    compression: 'gzip'
  },
  audit: {
    retention: '90d',  // 審計日誌保留90天
    compression: 'gzip'
  }
};
```

### 4. 日誌監控和告警系統

#### 4.1 ELK Stack 集成
```typescript
// src/config/elasticsearch.config.ts
import { ElasticsearchTransport } from 'winston-elasticsearch';

const esTransport = new ElasticsearchTransport({
  client: elasticsearch.Client({
    node: process.env.ELASTICSEARCH_URL
  }),
  index: 'daodao-logs',
  typeName: 'log'
});

logger.add(esTransport);
```

#### 4.2 告警規則配置
```typescript
// src/services/alert.service.ts
const alertRules = {
  errorRate: {
    threshold: 10,        // 10個錯誤/分鐘
    window: '1m',
    action: 'email'
  },
  responseTime: {
    threshold: 5000,      // 5秒響應時間
    window: '5m',
    action: 'slack'
  },
  dbConnection: {
    threshold: 1,         // 1個資料庫連接錯誤
    window: '1m',
    action: 'urgent'
  }
};
```

#### 4.3 健康檢查集成
```typescript
// src/middleware/health.middleware.ts
export const healthCheck = async (): Promise<HealthStatus> => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: await checkDatabase(),
      redis: await checkRedis(),
      logging: await checkLogging()
    }
  };
  
  logger.info('Health check completed', health);
  return health;
};
```

### 5. 統一日誌格式標準

#### 5.1 結構化日誌格式
```typescript
interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  service: string;
  version: string;
  environment: string;
  traceId?: string;
  userId?: string;
  requestId?: string;
  metadata?: Record<string, unknown>;
}
```

#### 5.2 日誌模板
```typescript
// src/utils/log-templates.ts
export const logTemplates = {
  request: (req: Request, res: Response, duration: number) => ({
    message: 'HTTP Request',
    method: req.method,
    url: req.originalUrl,
    statusCode: res.statusCode,
    duration: `${duration}ms`,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: req.user?.id
  }),
  
  database: (operation: string, table: string, duration: number, success: boolean) => ({
    message: 'Database Operation',
    operation,
    table,
    duration: `${duration}ms`,
    success
  }),
  
  auth: (action: string, userId: string, success: boolean, details?: Record<string, unknown>) => ({
    message: 'Authentication Event',
    action,
    userId,
    success,
    ...details
  })
};
```

#### 5.3 日誌中繼資料標準
```typescript
interface LogMetadata {
  service: 'daodao-server';
  version: string;
  environment: 'development' | 'staging' | 'production';
  hostname: string;
  pid: number;
  requestId?: string;
  userId?: string;
  sessionId?: string;
  traceId?: string;
  spanId?: string;
}
```

### 6. 實施階段規劃

#### 階段 1: Winston 基礎集成 (1-2週)
- [ ] 安裝 Winston 依賴
- [ ] 建立基本配置
- [ ] 替換現有 console.log
- [ ] 基本日誌輪轉

#### 階段 2: 進階功能 (2-3週)
- [ ] 實現日誌分級
- [ ] 添加過濾器
- [ ] 完善輪轉策略
- [ ] 結構化日誌格式

#### 階段 3: 監控集成 (3-4週)
- [ ] ELK Stack 集成
- [ ] 告警規則設置
- [ ] 健康檢查集成
- [ ] 性能監控

#### 階段 4: 最佳化 (1-2週)
- [ ] 性能調優
- [ ] 文檔完善
- [ ] 測試覆蓋
- [ ] 運維培訓

### 7. 配置文件範例

#### 7.1 環境變數
```env
# 日誌配置
LOG_LEVEL=info
LOG_FILE_PATH=./logs
LOG_MAX_SIZE=20m
LOG_MAX_FILES=14d
LOG_COMPRESSION=gzip

# Elasticsearch (可選)
ELASTICSEARCH_URL=http://localhost:9200
ELASTICSEARCH_INDEX=daodao-logs

# 告警配置
ALERT_EMAIL=admin@daodao.com
ALERT_SLACK_WEBHOOK=https://hooks.slack.com/...
```

#### 7.2 Docker 配置
```dockerfile
# Dockerfile 日誌目錄
VOLUME ["/app/logs"]

# 日誌收集
RUN mkdir -p /app/logs && \
    chown -R node:node /app/logs
```

### 8. PM2 和 Docker 日誌集成

#### 8.1 PM2 日誌管理

**當前 PM2 配置** (`ecosystem.config.js`):
```javascript
module.exports = {
  apps: [
    {
      name: "node_app",
      script: "index.js",
      instances: "max",
      exec_mode: "cluster",
    }
  ]
};
```

**優化後的 PM2 配置**:
```javascript
module.exports = {
  apps: [
    {
      name: "daodao-server",
      script: "index.js",
      instances: "max",
      exec_mode: "cluster",
      // PM2 日誌配置
      log_file: "logs/pm2/combined.log",
      out_file: "logs/pm2/out.log",
      error_file: "logs/pm2/error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      // 日誌輪轉
      max_log_size: "10M",
      retain_logs: 10,
      // 環境變數
      env: {
        NODE_ENV: "production",
        LOG_LEVEL: "info"
      },
      env_development: {
        NODE_ENV: "development",
        LOG_LEVEL: "debug"
      }
    }
  ]
};
```

#### 8.2 Winston 與 PM2 協同工作

**Winston 配置調整**:
```typescript
// src/config/logger.config.ts
const isPM2 = process.env.pm_id !== undefined;

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    // PM2 環境下使用 JSON 格式
    isPM2 ? winston.format.json() : winston.format.simple()
  ),
  transports: [
    // 在 PM2 環境下，主要使用 console 輸出
    // PM2 會自動處理日誌輪轉和管理
    new winston.transports.Console({
      format: isPM2 
        ? winston.format.json()
        : winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
    }),
    // 僅在非 PM2 環境下使用文件輸出
    ...(!isPM2 ? [
      new DailyRotateFile({
        filename: 'logs/app-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d'
      })
    ] : [])
  ]
});
```

#### 8.3 Docker 日誌策略

**Docker 日誌驅動配置**:
```yaml
# docker-compose.yaml
version: '3.8'
services:
  prod_app:
    image: ${DOCKER_HUB_USERNAME}/app:prod
    container_name: prod_app
    logging:
      driver: "json-file"
      options:
        max-size: "100m"
        max-file: "5"
        labels: "service=daodao-server,environment=production"
    # 日誌卷掛載
    volumes:
      - ./logs:/app/logs
      - /var/log/daodao:/var/log/daodao
```

**進階日誌驅動選項**:
```yaml
# 使用 syslog 驅動
logging:
  driver: "syslog"
  options:
    syslog-address: "tcp://log-server:514"
    tag: "daodao-server-{{.Name}}"

# 使用 fluentd 驅動
logging:
  driver: "fluentd"
  options:
    fluentd-address: "log-server:24224"
    tag: "daodao.{{.Name}}"
```

#### 8.4 容器環境 Winston 配置

**容器環境適配**:
```typescript
// src/config/logger.config.ts
const isContainer = process.env.CONTAINER === 'true' || fs.existsSync('/.dockerenv');

const getLogTransports = () => {
  const transports: winston.transport[] = [];
  
  // 控制台輸出（Docker 會捕獲）
  transports.push(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  }));
  
  // 在容器環境下，額外添加文件輸出用於持久化
  if (isContainer) {
    transports.push(new DailyRotateFile({
      filename: '/var/log/daodao/app-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '50m',
      maxFiles: '7d',
      compression: 'gzip'
    }));
  }
  
  return transports;
};
```

#### 8.5 日誌收集和聚合

**ELK Stack 與 Docker 集成**:
```yaml
# docker-compose.yaml
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:7.15.0
    container_name: elasticsearch
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
    networks:
      - elk_network

  logstash:
    image: docker.elastic.co/logstash/logstash:7.15.0
    container_name: logstash
    volumes:
      - ./logstash/pipeline:/usr/share/logstash/pipeline
      - ./logs:/var/log/daodao
    depends_on:
      - elasticsearch
    networks:
      - elk_network

  kibana:
    image: docker.elastic.co/kibana/kibana:7.15.0
    container_name: kibana
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch
    networks:
      - elk_network
```

**Logstash 配置**:
```ruby
# logstash/pipeline/daodao.conf
input {
  file {
    path => "/var/log/daodao/*.log"
    start_position => "beginning"
    codec => "json"
  }
}

filter {
  if [level] == "error" {
    mutate {
      add_tag => ["error"]
    }
  }
  
  date {
    match => ["timestamp", "ISO8601"]
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "daodao-logs-%{+YYYY.MM.dd}"
  }
}
```

#### 8.6 日誌監控告警

**Prometheus 指標收集**:
```typescript
// src/services/metrics.service.ts
import client from 'prom-client';

const logCounter = new client.Counter({
  name: 'app_logs_total',
  help: 'Total number of log messages',
  labelNames: ['level', 'service']
});

const errorCounter = new client.Counter({
  name: 'app_errors_total',
  help: 'Total number of error log messages',
  labelNames: ['error_type', 'service']
});

// 與 Winston 集成
logger.on('data', (info) => {
  logCounter.inc({ level: info.level, service: 'daodao-server' });
  
  if (info.level === 'error') {
    errorCounter.inc({ 
      error_type: info.error?.name || 'unknown',
      service: 'daodao-server' 
    });
  }
});
```

#### 8.7 完整的 Docker 日誌配置

**Dockerfile 優化**:
```dockerfile
FROM node:20

# 建立日誌目錄
RUN mkdir -p /var/log/daodao && \
    chown -R node:node /var/log/daodao

# 設定工作目錄
WORKDIR /app

# 複製並安裝依賴
COPY package*.json ./
RUN npm ci --only=production

# 安裝 PM2
RUN npm install -g pm2

# 複製應用程式
COPY . .

# 建立日誌目錄權限
RUN chown -R node:node /app/logs

# 切換到非 root 用戶
USER node

# 暴露端口
EXPOSE 3000

# 健康檢查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/v1/health || exit 1

# 設定環境變數
ENV CONTAINER=true
ENV PM2_HOME=/app/.pm2

# 啟動應用
CMD ["pm2-runtime", "start", "ecosystem.config.js"]
```

#### 8.8 日誌管理最佳實踐

**1. 統一日誌格式**:
```typescript
// 確保所有日誌都包含標準字段
const standardFields = {
  service: 'daodao-server',
  version: process.env.npm_package_version,
  environment: process.env.NODE_ENV,
  container_id: process.env.HOSTNAME,
  pm2_instance: process.env.pm_id
};
```

**2. 日誌分離策略**:
```typescript
// 不同類型的日誌使用不同的 transport
const transports = [
  // 應用日誌
  new winston.transports.File({
    filename: 'logs/app.log',
    level: 'info'
  }),
  // 錯誤日誌
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error'
  }),
  // 審計日誌
  new winston.transports.File({
    filename: 'logs/audit.log',
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  })
];
```

**3. 性能優化**:
```typescript
// 在高負載環境下使用異步日誌
const logger = winston.createLogger({
  transports: [
    new winston.transports.File({
      filename: 'logs/app.log',
      handleExceptions: true,
      maxsize: 50 * 1024 * 1024, // 50MB
      maxFiles: 5,
      tailable: true,
      // 異步寫入
      lazy: true
    })
  ]
});
```

這個升級規劃提供了完整的 Winston 集成方案，特別考慮了 PM2 和 Docker 環境的日誌管理需求，包含日誌分級、輪轉、監控和標準化格式，可以根據專案需求逐步實施。