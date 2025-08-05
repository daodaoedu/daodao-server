
import { Router, Request, Response } from 'express';
import os from 'os';
import { prismaService } from '../services/database/prisma.service';
import { mongoClient } from '../services/database/mongo.service';

const router = Router();

interface SystemInfo {
  hostname: string;
  platform: string;
  arch: string;
  uptime: number;
  loadAverage: number[];
  totalMemory: number;
  freeMemory: number;
  release: string;
  type: string;
  userInfo: os.UserInfo<string>;
  cpus: os.CpuInfo[];
  networkInterfaces: NodeJS.Dict<os.NetworkInterfaceInfo[]>;
  processMemory: NodeJS.MemoryUsage;
  processId: number;
  processTitle: string;
  processArgs: string[];
}

interface MongoInfo {
  status?: string;
  database?: string;
  collections?: Array<{
    name: string;
    type?: string;
    options?: Record<string, unknown>;
    info?: {
      readOnly?: boolean;
      uuid?: unknown;
    };
    idIndex?: Record<string, unknown>;
  }>;
  error?: string;
  details?: string;
}

interface PostgresInfo {
  version?: string;
  current_connections?: number;
  max_connections?: number;
  database_size?: string;
  start_time?: Date;
  config?: Record<string, string>;
  tables?: Array<{
    table_name: string;
    size: string;
    row_count: number;
  }>;
  error?: string;
  details?: string;
}

interface DiskInfo {
  filesystem: string;
  type: string;
  size: number;
  used: number;
  available: number;
  use: number;
  mount: string;
}

interface MonitorResponse {
  system: SystemInfo;
  mongo: MongoInfo;
  postgres: PostgresInfo;
  disk: DiskInfo[];
}

router.get('/', async (req: Request, res: Response) => {
  try {
    // 取得系統基本資訊
    const systemInfo: SystemInfo = {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      uptime: os.uptime(),
      loadAverage: os.loadavg(),
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      release: os.release(),
      type: os.type(),
      userInfo: os.userInfo(),
      cpus: os.cpus(),
      networkInterfaces: os.networkInterfaces(),
      processMemory: process.memoryUsage(),
      processId: process.pid,
      processTitle: process.title,
      processArgs: process.argv,
    };

    // 取得 MongoDB 伺服器資訊
    let mongoInfo: MongoInfo = {};
    try {
      if (mongoClient.readyState === 1) {
        const db = mongoClient.db;
        mongoInfo = {
          status: 'MongoDB 已連線',
          database: db.databaseName,
          collections: await db.listCollections().toArray()
        };
      } else {
        mongoInfo = { 
          error: 'MongoDB 連線不可用', 
          details: `readyState: ${mongoClient.readyState}` 
        };
      }
    } catch (err) {
      mongoInfo = { 
        error: 'MongoDB 連線不可用', 
        details: err instanceof Error ? err.message : '未知錯誤'
      };
    }

    // 取得 PostgreSQL 版本資訊
    let postgresInfo: PostgresInfo = {};
    try {
      const prisma = prismaService.getClient();

      // 1. 伺服器版本
      const versionResult = await prisma.$queryRaw<Array<{ version: string }>>`SELECT version()`;
      const version = versionResult[0]?.version;

      // 2. 連線數與最大連線數
      const connectionResult = await prisma.$queryRaw<Array<{
        current_connections: number;
        max_connections: number;
      }>>`
        SELECT 
          numbackends AS current_connections, 
          max_connections 
        FROM pg_stat_database, 
        (SELECT setting::int AS max_connections FROM pg_settings WHERE name = 'max_connections') AS max_conn 
        WHERE datname = current_database()
      `;

      // 3. 資料庫大小
      const sizeResult = await prisma.$queryRaw<Array<{ size: string }>>`
        SELECT pg_size_pretty(pg_database_size(current_database())) AS size
      `;

      // 4. 伺服器啟動時間
      const uptimeResult = await prisma.$queryRaw<Array<{ start_time: Date }>>`
        SELECT pg_postmaster_start_time() AS start_time
      `;

      // 5. 配置參數
      const configResult = await prisma.$queryRaw<Array<{ name: string; setting: string }>>`
        SELECT name, setting 
        FROM pg_settings 
        WHERE name IN ('work_mem', 'shared_buffers')
      `;

      // 6. 表資訊
      const tableResults = await prisma.$queryRaw<Array<{
        table_name: string;
        size: string;
        row_count: number;
      }>>`
        SELECT 
          t.tablename AS table_name,
          pg_size_pretty(pg_total_relation_size('"' || t.tablename || '"')) AS size,
          (SELECT reltuples::int AS row_count FROM pg_class WHERE relname = t.tablename) AS row_count
        FROM pg_tables t
        WHERE t.schemaname = 'public'
      `;

      // 組合結果
      postgresInfo = {
        version: version || '未知版本',
        current_connections: connectionResult[0]?.current_connections || 0,
        max_connections: connectionResult[0]?.max_connections || 0,
        database_size: sizeResult[0]?.size,
        start_time: uptimeResult[0]?.start_time,
        config: {},
        tables: tableResults.map(table => ({
          table_name: table.table_name,
          size: table.size,
          row_count: table.row_count || 0,
        }))
      };

      // 處理配置參數
      if (configResult && Array.isArray(configResult)) {
        configResult.forEach(conf => {
          if (postgresInfo.config) {
            postgresInfo.config[conf.name] = conf.setting;
          }
        });
      }

    } catch (err) {
      postgresInfo = { 
        error: 'PostgreSQL 連線不可用', 
        details: err instanceof Error ? err.message : '未知錯誤'
      };
    }

    // 取得磁碟資訊 (基本版本，不使用 systeminformation)
    // 由於 systeminformation 需要額外安裝，這裡提供基本的磁碟資訊
    const diskInfo: DiskInfo[] = [{
      filesystem: 'N/A',
      type: 'N/A',
      size: 0,
      used: 0,
      available: 0,
      use: 0,
      mount: 'N/A'
    }];

    const response: MonitorResponse = {
      system: systemInfo,
      mongo: mongoInfo,
      postgres: postgresInfo,
      disk: diskInfo,
    };

    res.json(response);
  } catch (error) {
    console.error('Monitor error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : '未知錯誤' 
    });
  }
});

export default router;