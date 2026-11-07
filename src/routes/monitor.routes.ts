import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { registry } from '../config/openapi-registry';
import os from 'os';
import { prismaService } from '../services/database/prisma.service';
import { authenticateAny } from '../middleware/auth';
import { requireAdmin } from '../middleware/permission.middleware';

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
  postgres: PostgresInfo;
  disk: DiskInfo[];
}

// ============================================================================
// OpenAPI 路由定義
// ============================================================================

/**
 * GET /api/v1/monitor - 取得系統監控資訊
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/monitor',
  security: [{ bearerAuth: [] }],
  tags: ['System Monitor'],
  summary: '取得系統監控資訊',
  description: '取得系統資源使用情況，包括 CPU、記憶體、磁碟和 PostgreSQL 狀態',
  responses: {
    200: {
      description: '成功獲取系統監控資訊',
      content: {
        'application/json': {
          schema: z.object({
            system: z.object({
              hostname: z.string(),
              platform: z.string(),
              arch: z.string(),
              uptime: z.number(),
              loadAverage: z.array(z.number()),
              totalMemory: z.number(),
              freeMemory: z.number(),
              release: z.string(),
              type: z.string(),
              userInfo: z.any(),
              cpus: z.array(z.any()),
              networkInterfaces: z.any(),
              processMemory: z.any(),
              processId: z.number(),
              processTitle: z.string()
            }),
            postgres: z.object({
              version: z.string().optional(),
              current_connections: z.number().optional(),
              max_connections: z.number().optional(),
              database_size: z.string().optional(),
              start_time: z.string().optional(),
              config: z.record(z.string(), z.string()).optional(),
              tables: z.array(z.object({
                table_name: z.string(),
                size: z.string(),
                row_count: z.number()
              })).optional(),
              error: z.string().optional(),
              details: z.string().optional()
            }),
            disk: z.array(z.object({
              filesystem: z.string(),
              type: z.string(),
              size: z.number(),
              used: z.number(),
              available: z.number(),
              use: z.number(),
              mount: z.string()
            }))
          }).openapi({
            description: '系統監控資訊響應'
          })
        }
      }
    },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    403: { $ref: '#/components/responses/ForbiddenError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  }
});

router.get('/', authenticateAny, requireAdmin, async (req: Request, res: Response) => {
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
    };

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