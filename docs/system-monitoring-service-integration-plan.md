# 系統監控服務整合規劃文件

## 概述
本文件規劃將現有的 `monitor.js` 和 `dbInfo.js` 服務整合成一個統一的 TypeScript 系統監控服務。

## 現況分析

### 現有服務分析

#### 1. `routes/monitor.js`
- **功能**: 系統與基礎設施監控
- **特色**:
  - 系統資訊（作業系統、硬體、記憶體、CPU、網路）
  - MongoDB 連線狀態和資料庫資訊
  - PostgreSQL 伺服器指標（版本、連線數、大小、運行時間、配置、資料表）
  - 磁碟使用資訊（使用 `systeminformation` 套件）
- **端點**: `GET /monitor`
- **回應**: 完整系統監控資料

#### 2. `routes/dbInfo.js`
- **功能**: 資料庫結構檢查
- **特色**:
  - MongoDB 集合欄位分析（透過文件取樣）
  - PostgreSQL 資料表結構檢查（欄位、資料型別）
- **端點**: `GET /dbInfo`
- **回應**: 資料庫結構資訊

### 依賴套件分析
- `systeminformation` - 系統資訊收集
- `os` - Node.js 作業系統工具
- `../services/mongo` - MongoDB 客戶端
- `../services/postgres` - PostgreSQL 客戶端與 QueryTypes

## 整合策略

### 1. 服務合併
將兩個服務合併成統一的監控服務，提供多個端點：

```
/api/monitoring/
├── /system          # 系統資訊（來自 monitor.js）
├── /databases       # 資料庫狀態和指標（來自 monitor.js）
├── /schema          # 資料庫結構資訊（來自 dbInfo.js）
├── /health          # 綜合健康檢查端點
└── /                # 完整監控儀表板
```

### 2. TypeScript 遷移計劃

#### 階段一：核心結構建置
- 在 `src/services/monitoring/` 建立 TypeScript 服務
- 定義完整的型別定義
- 建立模組化架構，分離關注點

#### 階段二：功能實作
- 實作系統監控功能
- 實作資料庫狀態監控
- 實作結構檢查功能
- 新增健康檢查端點

#### 階段三：強化與優化
- 為耗時操作新增快取
- 實作錯誤處理和重試邏輯
- 新增監控指標和警示
- 效能優化

## 建議檔案結構

參考現有專案架構，按照已建立的模式組織檔案：

```
src/
├── services/
│   └── monitoring/
│       ├── index.ts                    # 主要服務入口點，匯出所有服務
│       ├── system-monitor.service.ts   # 系統資訊收集服務
│       ├── database-monitor.service.ts # 資料庫狀態監控服務
│       ├── schema-inspector.service.ts # 資料庫結構檢查服務
│       └── health-checker.service.ts   # 健康檢查服務
├── types/
│   └── monitoring.types.ts            # 監控相關型別定義
├── controllers/
│   └── monitoring.controller.ts       # HTTP 處理器（使用 asyncWrapper）
├── routes/
│   └── monitoring.routes.ts           # 路由定義（使用 Router）
├── validators/
│   └── monitoring.validators.ts       # Zod 驗證結構
├── swagger/
│   ├── schemas/
│   │   └── monitoring.schemas.ts      # Swagger 結構定義
│   └── paths/
│       └── monitoring.paths.ts        # Swagger 路徑定義
└── tests/
    └── unit/
        ├── controllers/
        │   └── monitoring.controller.test.ts
        └── services/
            └── monitoring.service.test.ts
```

## 型別定義

參考現有專案的型別定義模式，建立完整的監控型別系統：

### 核心型別（`src/types/monitoring.types.ts`）
```typescript
import { SuccessResponse, ErrorResponse } from './common.types';

// 系統資訊型別
export interface SystemInfo {
  hostname: string;
  platform: NodeJS.Platform;
  arch: string;
  uptime: number;
  loadAverage: number[];
  memory: MemoryInfo;
  cpu: CPUInfo[];
  network: NetworkInfo;
  process: ProcessInfo;
  disk: DiskInfo[];
}

export interface MemoryInfo {
  total: number;
  free: number;
  used: number;
  usage: number;
}

export interface CPUInfo {
  model: string;
  speed: number;
  times: {
    user: number;
    nice: number;
    sys: number;
    idle: number;
    irq: number;
  };
}

export interface DiskInfo {
  filesystem: string;
  type: string;
  size: number;
  used: number;
  available: number;
  use: number;
  mount: string;
}

export interface ProcessInfo {
  pid: number;
  title: string;
  args: string[];
  memory: NodeJS.MemoryUsage;
}

export interface NetworkInfo {
  [key: string]: {
    address: string;
    netmask: string;
    family: string;
    mac: string;
    internal: boolean;
  }[];
}

// 資料庫資訊型別
export interface DatabaseStatus {
  mongo: MongoStatus;
  postgres: PostgresStatus;
}

export interface MongoStatus {
  status: 'connected' | 'disconnected' | 'error';
  database?: string;
  collections?: CollectionInfo[];
  error?: string;
}

export interface PostgresStatus {
  status: 'connected' | 'disconnected' | 'error';
  version?: string;
  connections?: ConnectionInfo;
  size?: string;
  uptime?: Date;
  config?: Record<string, string>;
  tables?: TableInfo[];
  error?: string;
}

export interface ConnectionInfo {
  current: number;
  max: number;
}

export interface TableInfo {
  name: string;
  size: string;
  rowCount: number;
}

export interface CollectionInfo {
  name: string;
  type: string;
  options: Record<string, unknown>;
}

// 結構資訊型別
export interface DatabaseSchema {
  mongo: Record<string, MongoCollectionSchema>;
  postgres: Record<string, PostgresTableSchema>;
}

export interface MongoCollectionSchema {
  fields: string[];
  sampleDocument?: Record<string, unknown>;
}

export interface PostgresTableSchema {
  columns: ColumnInfo[];
  indexes?: IndexInfo[];
  constraints?: ConstraintInfo[];
}

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string;
}

export interface IndexInfo {
  name: string;
  unique: boolean;
  columns: string[];
}

export interface ConstraintInfo {
  name: string;
  type: string;
  columns: string[];
}

// 健康檢查型別
export interface HealthStatus {
  status: 'healthy' | 'warning' | 'critical';
  checks: HealthCheck[];
  uptime: number;
  timestamp: string;
}

export interface HealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message?: string;
  duration?: number;
}

// API 回應型別
export interface MonitoringDashboard {
  system: SystemInfo;
  databases: DatabaseStatus;
  schema: DatabaseSchema;
  health: HealthStatus;
}

// 使用通用回應型別
export type SystemResponse = SuccessResponse<SystemInfo> | ErrorResponse;
export type DatabaseResponse = SuccessResponse<DatabaseStatus> | ErrorResponse;
export type SchemaResponse = SuccessResponse<DatabaseSchema> | ErrorResponse;
export type HealthResponse = SuccessResponse<HealthStatus> | ErrorResponse;
export type DashboardResponse = SuccessResponse<MonitoringDashboard> | ErrorResponse;
```

## 實作細節

### 1. 系統監控服務（`src/services/monitoring/system-monitor.service.ts`）
參考現有服務模式，使用工廠函數和物件字面量：

```typescript
import os from 'os';
import * as si from 'systeminformation';
import { SystemInfo } from '../../types/monitoring.types';

export const systemMonitorService = {
  /**
   * 獲取系統資訊
   */
  async getSystemInfo(): Promise<SystemInfo> {
    const [disks] = await Promise.all([
      si.fsSize()
    ]);

    return {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      uptime: os.uptime(),
      loadAverage: os.loadavg(),
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
        usage: ((os.totalmem() - os.freemem()) / os.totalmem()) * 100
      },
      cpu: os.cpus(),
      network: os.networkInterfaces(),
      process: {
        pid: process.pid,
        title: process.title,
        args: process.argv,
        memory: process.memoryUsage()
      },
      disk: disks.map(disk => ({
        filesystem: disk.fs,
        type: disk.type,
        size: disk.size,
        used: disk.used,
        available: disk.size - disk.used,
        use: disk.use,
        mount: disk.mount
      }))
    };
  }
} as const;
```

### 2. 資料庫監控服務（`src/services/monitoring/database-monitor.service.ts`）
使用現有的資料庫服務：

```typescript
import { mongoClient } from '../database/mongo.service';
import { postgresClient } from '../database/postgres.service';
import { QueryTypes } from 'sequelize';
import { DatabaseStatus } from '../../types/monitoring.types';

export const databaseMonitorService = {
  /**
   * 獲取資料庫狀態
   */
  async getDatabaseStatus(): Promise<DatabaseStatus> {
    const [mongoStatus, postgresStatus] = await Promise.all([
      this.getMongoStatus(),
      this.getPostgresStatus()
    ]);

    return {
      mongo: mongoStatus,
      postgres: postgresStatus
    };
  },

  /**
   * 獲取 MongoDB 狀態
   */
  async getMongoStatus() {
    try {
      if (mongoClient.readyState === 1) {
        const db = mongoClient.db;
        const collections = await db.listCollections().toArray();
        
        return {
          status: 'connected' as const,
          database: db.databaseName,
          collections: collections.map(coll => ({
            name: coll.name,
            type: coll.type,
            options: coll.options || {}
          }))
        };
      } else {
        return {
          status: 'disconnected' as const,
          error: `readyState: ${mongoClient.readyState}`
        };
      }
    } catch (error) {
      return {
        status: 'error' as const,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  /**
   * 獲取 PostgreSQL 狀態
   */
  async getPostgresStatus() {
    try {
      const queries = await Promise.all([
        postgresClient.query('SELECT version()', { type: QueryTypes.SELECT }),
        postgresClient.query(
          'SELECT numbackends AS current_connections, max_connections FROM pg_stat_database, (SELECT setting::int AS max_connections FROM pg_settings WHERE name = \'max_connections\') AS max_conn WHERE datname = current_database()',
          { type: QueryTypes.SELECT }
        ),
        postgresClient.query(
          'SELECT pg_size_pretty(pg_database_size(current_database())) AS size',
          { type: QueryTypes.SELECT }
        ),
        postgresClient.query(
          'SELECT pg_postmaster_start_time() AS start_time',
          { type: QueryTypes.SELECT }
        ),
        postgresClient.query(`
          SELECT 
            t.tablename AS table_name,
            pg_size_pretty(pg_total_relation_size('"' || t.tablename || '"')) AS size,
            (SELECT reltuples::bigint AS row_count FROM pg_class WHERE relname = t.tablename) AS row_count
          FROM pg_tables t
          WHERE t.schemaname = 'public'
        `, { type: QueryTypes.SELECT })
      ]);

      const [versionResult, connectionResult, sizeResult, uptimeResult, tableResults] = queries;

      return {
        status: 'connected' as const,
        version: versionResult[0]?.version || 'Unknown',
        connections: {
          current: connectionResult[0]?.current_connections || 0,
          max: connectionResult[0]?.max_connections || 0
        },
        size: sizeResult[0]?.size || 'Unknown',
        uptime: uptimeResult[0]?.start_time || new Date(),
        tables: tableResults.map(table => ({
          name: table.table_name,
          size: table.size,
          rowCount: table.row_count || 0
        }))
      };
    } catch (error) {
      return {
        status: 'error' as const,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
} as const;
```

### 3. 結構檢查服務（`src/services/monitoring/schema-inspector.service.ts`）
```typescript
import { mongoClient } from '../database/mongo.service';
import { postgresClient } from '../database/postgres.service';
import { QueryTypes } from 'sequelize';
import { DatabaseSchema } from '../../types/monitoring.types';

export const schemaInspectorService = {
  /**
   * 獲取資料庫結構
   */
  async getDatabaseSchema(): Promise<DatabaseSchema> {
    const [mongoSchema, postgresSchema] = await Promise.all([
      this.getMongoSchema(),
      this.getPostgresSchema()
    ]);

    return {
      mongo: mongoSchema,
      postgres: postgresSchema
    };
  },

  /**
   * 獲取 MongoDB 結構
   */
  async getMongoSchema() {
    const schema: Record<string, any> = {};
    
    try {
      if (mongoClient.readyState === 1) {
        const collections = await mongoClient.db.listCollections().toArray();
        
        for (const coll of collections) {
          const sampleDoc = await mongoClient.db.collection(coll.name).findOne();
          schema[coll.name] = {
            fields: sampleDoc ? Object.keys(sampleDoc) : [],
            sampleDocument: sampleDoc || undefined
          };
        }
      }
    } catch (error) {
      console.error('Error getting MongoDB schema:', error);
    }

    return schema;
  },

  /**
   * 獲取 PostgreSQL 結構
   */
  async getPostgresSchema() {
    const schema: Record<string, any> = {};
    
    try {
      const tableResult = await postgresClient.query(
        "SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname NOT IN ('pg_catalog', 'information_schema')",
        { type: QueryTypes.SELECT }
      );

      for (const table of tableResult) {
        const colResult = await postgresClient.query(
          "SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = ? ORDER BY ordinal_position",
          { replacements: [table.tablename], type: QueryTypes.SELECT }
        );

        schema[table.tablename] = {
          columns: colResult.map(col => ({
            name: col.column_name,
            type: col.data_type,
            nullable: col.is_nullable === 'YES',
            defaultValue: col.column_default
          }))
        };
      }
    } catch (error) {
      console.error('Error getting PostgreSQL schema:', error);
    }

    return schema;
  }
} as const;
```

### 4. 健康檢查服務（`src/services/monitoring/health-checker.service.ts`）
```typescript
import { HealthStatus } from '../../types/monitoring.types';
import { databaseMonitorService } from './database-monitor.service';
import { systemMonitorService } from './system-monitor.service';

export const healthCheckerService = {
  /**
   * 執行健康檢查
   */
  async checkHealth(): Promise<HealthStatus> {
    const checks = await Promise.all([
      this.checkDatabaseHealth(),
      this.checkSystemHealth(),
      this.checkMemoryHealth()
    ]);

    const failedChecks = checks.filter(check => check.status === 'fail');
    const warnChecks = checks.filter(check => check.status === 'warn');

    let overallStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (failedChecks.length > 0) {
      overallStatus = 'critical';
    } else if (warnChecks.length > 0) {
      overallStatus = 'warning';
    }

    return {
      status: overallStatus,
      checks: checks.flat(),
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };
  },

  /**
   * 檢查資料庫健康狀態
   */
  async checkDatabaseHealth() {
    const start = Date.now();
    try {
      const dbStatus = await databaseMonitorService.getDatabaseStatus();
      const duration = Date.now() - start;

      const checks = [];
      
      // MongoDB 檢查
      checks.push({
        name: 'MongoDB Connection',
        status: dbStatus.mongo.status === 'connected' ? 'pass' : 'fail',
        message: dbStatus.mongo.error || 'Connected successfully',
        duration
      });

      // PostgreSQL 檢查
      checks.push({
        name: 'PostgreSQL Connection',
        status: dbStatus.postgres.status === 'connected' ? 'pass' : 'fail',
        message: dbStatus.postgres.error || 'Connected successfully',
        duration
      });

      return checks;
    } catch (error) {
      return [{
        name: 'Database Health Check',
        status: 'fail' as const,
        message: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - start
      }];
    }
  },

  /**
   * 檢查系統健康狀態
   */
  async checkSystemHealth() {
    const start = Date.now();
    try {
      const systemInfo = await systemMonitorService.getSystemInfo();
      const duration = Date.now() - start;

      return [{
        name: 'System Status',
        status: 'pass' as const,
        message: `System running on ${systemInfo.platform} ${systemInfo.arch}`,
        duration
      }];
    } catch (error) {
      return [{
        name: 'System Health Check',
        status: 'fail' as const,
        message: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - start
      }];
    }
  },

  /**
   * 檢查記憶體健康狀態
   */
  async checkMemoryHealth() {
    const start = Date.now();
    try {
      const systemInfo = await systemMonitorService.getSystemInfo();
      const memoryUsage = systemInfo.memory.usage;
      const duration = Date.now() - start;

      let status: 'pass' | 'warn' | 'fail' = 'pass';
      let message = `Memory usage: ${memoryUsage.toFixed(2)}%`;

      if (memoryUsage > 90) {
        status = 'fail';
        message = `Critical memory usage: ${memoryUsage.toFixed(2)}%`;
      } else if (memoryUsage > 80) {
        status = 'warn';
        message = `High memory usage: ${memoryUsage.toFixed(2)}%`;
      }

      return [{
        name: 'Memory Usage',
        status,
        message,
        duration
      }];
    } catch (error) {
      return [{
        name: 'Memory Health Check',
        status: 'fail' as const,
        message: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - start
      }];
    }
  }
} as const;
```

## API 端點設計

### 1. `GET /api/monitoring/system`
```typescript
interface SystemResponse {
  success: boolean;
  data: SystemInfo;
  timestamp: string;
}
```

### 2. `GET /api/monitoring/databases`
```typescript
interface DatabaseResponse {
  success: boolean;
  data: DatabaseStatus;
  timestamp: string;
}
```

### 3. `GET /api/monitoring/schema`
```typescript
interface SchemaResponse {
  success: boolean;
  data: DatabaseSchema;
  timestamp: string;
}
```

### 4. `GET /api/monitoring/health`
```typescript
interface HealthResponse {
  success: boolean;
  data: {
    status: 'healthy' | 'warning' | 'critical';
    checks: HealthCheck[];
    uptime: number;
    timestamp: string;
  };
}
```

### 控制器實作（`src/controllers/monitoring.controller.ts`）
參考現有控制器模式，使用 `asyncWrapper` 和標準回應格式：

```typescript
import { Request, Response } from 'express';
import { asyncWrapper } from '../utils/error-handler';
import { systemMonitorService } from '../services/monitoring/system-monitor.service';
import { databaseMonitorService } from '../services/monitoring/database-monitor.service';
import { schemaInspectorService } from '../services/monitoring/schema-inspector.service';
import { healthCheckerService } from '../services/monitoring/health-checker.service';

/**
 * 獲取系統資訊
 * GET /api/monitoring/system
 */
export const getSystemInfo = asyncWrapper(async (req: Request, res: Response) => {
  const systemInfo = await systemMonitorService.getSystemInfo();
  
  res.status(200).json({
    success: true,
    data: systemInfo,
    timestamp: new Date().toISOString()
  });
});

/**
 * 獲取資料庫狀態
 * GET /api/monitoring/databases
 */
export const getDatabaseStatus = asyncWrapper(async (req: Request, res: Response) => {
  const databaseStatus = await databaseMonitorService.getDatabaseStatus();
  
  res.status(200).json({
    success: true,
    data: databaseStatus,
    timestamp: new Date().toISOString()
  });
});

/**
 * 獲取資料庫結構
 * GET /api/monitoring/schema
 */
export const getDatabaseSchema = asyncWrapper(async (req: Request, res: Response) => {
  const schema = await schemaInspectorService.getDatabaseSchema();
  
  res.status(200).json({
    success: true,
    data: schema,
    timestamp: new Date().toISOString()
  });
});

/**
 * 獲取健康狀態
 * GET /api/monitoring/health
 */
export const getHealthStatus = asyncWrapper(async (req: Request, res: Response) => {
  const healthStatus = await healthCheckerService.checkHealth();
  
  res.status(200).json({
    success: true,
    data: healthStatus,
    timestamp: new Date().toISOString()
  });
});

/**
 * 獲取完整監控儀表板
 * GET /api/monitoring/
 */
export const getMonitoringDashboard = asyncWrapper(async (req: Request, res: Response) => {
  const [systemInfo, databaseStatus, schema, healthStatus] = await Promise.all([
    systemMonitorService.getSystemInfo(),
    databaseMonitorService.getDatabaseStatus(),
    schemaInspectorService.getDatabaseSchema(),
    healthCheckerService.checkHealth()
  ]);

  res.status(200).json({
    success: true,
    data: {
      system: systemInfo,
      databases: databaseStatus,
      schema: schema,
      health: healthStatus
    },
    timestamp: new Date().toISOString()
  });
});
```

### 路由設定（`src/routes/monitoring.routes.ts`）
```typescript
import { Router } from 'express';
import * as monitoringController from '../controllers/monitoring.controller';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/permission.middleware';

const router = Router();

/**
 * 監控路由 - 需要管理員權限
 */
router.use(authenticate, requireAdmin);

/**
 * @swagger
 * /api/monitoring/system:
 *   get:
 *     summary: 獲取系統資訊
 *     tags: [Monitoring]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 系統資訊
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SystemResponse'
 */
router.get('/system', monitoringController.getSystemInfo);

/**
 * @swagger
 * /api/monitoring/databases:
 *   get:
 *     summary: 獲取資料庫狀態
 *     tags: [Monitoring]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 資料庫狀態
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DatabaseResponse'
 */
router.get('/databases', monitoringController.getDatabaseStatus);

/**
 * @swagger
 * /api/monitoring/schema:
 *   get:
 *     summary: 獲取資料庫結構
 *     tags: [Monitoring]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 資料庫結構
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SchemaResponse'
 */
router.get('/schema', monitoringController.getDatabaseSchema);

/**
 * @swagger
 * /api/monitoring/health:
 *   get:
 *     summary: 獲取健康狀態
 *     tags: [Monitoring]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 健康狀態
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 */
router.get('/health', monitoringController.getHealthStatus);

/**
 * @swagger
 * /api/monitoring:
 *   get:
 *     summary: 獲取完整監控儀表板
 *     tags: [Monitoring]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 完整監控資訊
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DashboardResponse'
 */
router.get('/', monitoringController.getMonitoringDashboard);

export default router;
```

### 服務導出（`src/services/monitoring/index.ts`）
```typescript
/**
 * 監控服務模組導出
 */

export { systemMonitorService } from './system-monitor.service';
export { databaseMonitorService } from './database-monitor.service';
export { schemaInspectorService } from './schema-inspector.service';
export { healthCheckerService } from './health-checker.service';

// 統一的監控服務
export const monitoringService = {
  system: systemMonitorService,
  database: databaseMonitorService,
  schema: schemaInspectorService,
  health: healthCheckerService
} as const;
```

### Swagger 結構定義（`src/swagger/schemas/monitoring.schemas.ts`）
```typescript
/**
 * @swagger
 * components:
 *   schemas:
 *     SystemInfo:
 *       type: object
 *       properties:
 *         hostname:
 *           type: string
 *           description: 主機名稱
 *         platform:
 *           type: string
 *           description: 作業系統平台
 *         arch:
 *           type: string
 *           description: 系統架構
 *         uptime:
 *           type: number
 *           description: 系統運行時間（秒）
 *         memory:
 *           type: object
 *           properties:
 *             total:
 *               type: number
 *               description: 總記憶體
 *             free:
 *               type: number
 *               description: 可用記憶體
 *             used:
 *               type: number
 *               description: 已使用記憶體
 *             usage:
 *               type: number
 *               description: 記憶體使用率
 *         disk:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               filesystem:
 *                 type: string
 *               size:
 *                 type: number
 *               used:
 *                 type: number
 *               available:
 *                 type: number
 *               use:
 *                 type: number
 *               mount:
 *                 type: string
 *     
 *     DatabaseStatus:
 *       type: object
 *       properties:
 *         mongo:
 *           type: object
 *           properties:
 *             status:
 *               type: string
 *               enum: [connected, disconnected, error]
 *             database:
 *               type: string
 *             collections:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   type:
 *                     type: string
 *         postgres:
 *           type: object
 *           properties:
 *             status:
 *               type: string
 *               enum: [connected, disconnected, error]
 *             version:
 *               type: string
 *             connections:
 *               type: object
 *               properties:
 *                 current:
 *                   type: number
 *                 max:
 *                   type: number
 *             size:
 *               type: string
 *             tables:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   size:
 *                     type: string
 *                   rowCount:
 *                     type: number
 *     
 *     HealthStatus:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           enum: [healthy, warning, critical]
 *         checks:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [pass, fail, warn]
 *               message:
 *                 type: string
 *               duration:
 *                 type: number
 *         uptime:
 *           type: number
 *         timestamp:
 *           type: string
 *           format: date-time
 *     
 *     SystemResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           $ref: '#/components/schemas/SystemInfo'
 *         timestamp:
 *           type: string
 *           format: date-time
 *     
 *     DatabaseResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           $ref: '#/components/schemas/DatabaseStatus'
 *         timestamp:
 *           type: string
 *           format: date-time
 *     
 *     HealthResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           $ref: '#/components/schemas/HealthStatus'
 *         timestamp:
 *           type: string
 *           format: date-time
 *     
 *     DashboardResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           properties:
 *             system:
 *               $ref: '#/components/schemas/SystemInfo'
 *             databases:
 *               $ref: '#/components/schemas/DatabaseStatus'
 *             health:
 *               $ref: '#/components/schemas/HealthStatus'
 *         timestamp:
 *           type: string
 *           format: date-time
 */
```

### 驗證器實作（`src/validators/monitoring.validators.ts`）
```typescript
import { z } from 'zod';

// 監控端點通常不需要複雜的驗證，但可以加入基本的查詢參數驗證
export const monitoringQuerySchema = z.object({
  detailed: z.string().optional().transform(val => val === 'true'),
  format: z.enum(['json', 'prometheus']).optional().default('json')
});

export type MonitoringQuery = z.infer<typeof monitoringQuerySchema>;
```

## 錯誤處理策略

### 1. 服務層錯誤處理
- 對個別服務失敗進行優雅降級
- 包含上下文的完整錯誤記錄
- 對暫時性失敗的重試邏輯

### 2. HTTP 錯誤回應
- 標準化錯誤回應格式
- 適當的 HTTP 狀態碼
- 開發模式下的詳細錯誤訊息

### 3. 監控和警示
- 錯誤率監控
- 效能閾值警示
- 健康檢查失敗通知

## 效能考量

### 1. 快取策略
- 快取耗時的系統資訊查詢
- 實作時間型快取失效
- 必要時使用 Redis 進行分散式快取

### 2. 非同步操作
- 使用 Promise.all 進行並行資料收集
- 實作超時機制
- 非阻塞資料庫查詢

### 3. 限流
- 實作端點特定限流
- 防止昂貴監控操作的濫用
- 考慮 IP 和使用者限制

## 資安考量

### 1. 資訊暴露
- 清理敏感系統資訊
- 實作角色型存取控制
- 對未授權使用者隱藏內部系統細節

### 2. 認證與授權
- 監控端點需要認證
- 實作適當的授權檢查
- 記錄所有監控存取嘗試

## 測試策略

### 1. 單元測試
- 測試個別服務功能
- 模擬外部依賴
- 測試錯誤處理情境

### 2. 整合測試
- 測試資料庫連線
- 測試系統資訊收集
- 測試 API 端點回應

### 3. 效能測試
- 監控端點負載測試
- 記憶體使用監控
- 回應時間基準測試

## 遷移步驟

### 步驟一：建立 TypeScript 基礎架構
1. 建立新的 TypeScript 服務結構
2. 定義完整的型別定義
3. 設定 Jest 測試配置

### 步驟二：實作核心服務
1. 實作系統監控服務
2. 實作資料庫監控服務
3. 實作結構檢查服務
4. 新增完整錯誤處理

### 步驟三：建立 HTTP 層
1. 實作 TypeScript 控制器（使用 `asyncWrapper`）
2. 設定 Express 路由與適當驗證（使用 `authenticate` 和 `requireAdmin`）
3. 新增 Swagger 文件（按照現有模式）
4. 實作完整記錄功能（使用現有 logging middleware）

### 步驟四：測試與驗證
1. 撰寫完整單元測試（使用現有 Jest 配置）
2. 進行整合測試（使用現有測試工具）
3. 負載測試和效能驗證
4. 安全性測試（驗證權限控制）

### 步驟五：部署與遷移
1. 在 `src/routes/index.ts` 中新增監控路由
2. 在 `src/controllers/index.ts` 中匯出監控控制器
3. 更新 `src/app.ts` 中的路由設定
4. 移除 `routes/monitor.js` 和 `routes/dbInfo.js`
5. 更新 `index.js` 中的路由引用
6. 執行 `npm run typecheck` 和 `npm run lint` 確保無錯誤

## 成功指標

### 1. 效能指標
- 回應時間改善
- 記憶體使用優化
- 錯誤率降低

### 2. 程式碼品質指標
- 型別安全覆蓋率
- 測試覆蓋率 > 90%
- ESLint/TypeScript 合規性

### 3. 營運指標
- 監控準確性
- 警示可靠性
- 系統健康可見性

## 時程估算

- **階段一**（建置）：2-3 天
- **階段二**（實作）：5-7 天
- **階段三**（測試與優化）：3-4 天
- **階段四**（部署與遷移）：1-2 天

**總估算時間**：11-16 天

## 風險與緩解措施

### 1. 效能影響
- **風險**：監控服務消耗過多資源
- **緩解**：實作快取和限流

### 2. 資料準確性
- **風險**：監控資料不一致
- **緩解**：實作資料驗證和一致性檢查

### 3. 服務可用性
- **風險**：監控服務成為單點故障
- **緩解**：實作斷路器和備援機制

## 未來強化

### 1. 即時監控
- WebSocket 支援即時更新
- 即時指標儀表板
- 警示通知

### 2. 歷史資料
- 時間序列資料儲存
- 趨勢分析
- 效能歷史追蹤

### 3. 進階分析
- 預測性監控
- 異常偵測
- 自動擴展建議

## 結論

此整合計劃提供了現代化監控基礎設施的完整方法，同時保持向後相容性並改善可維護性。TypeScript 遷移將提供更好的型別安全性、改善開發者體驗，以及更健全的錯誤處理。

模組化設計允許增量實作和測試，降低在遷移過程中引入錯誤的風險。