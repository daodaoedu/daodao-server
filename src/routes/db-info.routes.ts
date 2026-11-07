import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticateAny } from '../middleware/auth';
import { requireAdmin } from '../middleware/permission.middleware';
import { registry } from '../config/openapi-registry';
import { prismaService } from '../services/database/prisma.service';
import { redis as redisClient } from '../services/database/redis.service';

const router = Router();

router.use(authenticateAny, requireAdmin);

interface DatabaseColumn {
  column_name: string;
  data_type: string;
  udt_name: string;
  character_maximum_length: number | null;
  numeric_precision: number | null;
  numeric_scale: number | null;
  is_nullable: string;
  column_default: string | null;
  is_identity: string;
  identity_generation: string | null;
  is_updatable: string;
  ordinal_position: number;
  comment: string | null;
}

interface TableConstraint {
  constraint_name: string;
  constraint_type: string;
  column_name: string;
  foreign_table_name: string | null;
  foreign_column_name: string | null;
}

interface TableIndex {
  index_name: string;
  index_type: string;
  is_unique: boolean;
  is_primary: boolean;
  column_names: string[];
}

interface PostgresTableInfo {
  columns: DatabaseColumn[];
  constraints: TableConstraint[];
  indexes: TableIndex[];
  comment: string | null;
  row_count: number;
}

interface RedisInfo {
  version: string;
  uptime_in_seconds: number;
  connected_clients: number;
  used_memory_human: string;
  total_commands_processed: number;
}

interface DatabaseInfoResponse {
  postgres: Record<string, PostgresTableInfo> | { error: string };
  redis: RedisInfo | { error: string };
}

// ============================================================================
// OpenAPI 路由定義
// ============================================================================

/**
 * GET /api/v1/db-info - 取得資料庫資訊
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/db-info',
  tags: ['Database Info'],
  summary: '取得資料庫資訊',
  description: '僅管理員可取得 PostgreSQL 和 Redis 的詳細資訊，包括欄位、索引、約束等',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: '成功獲取資料庫資訊',
      content: {
        'application/json': {
          schema: z.object({
            postgres: z.record(z.string(), z.object({
              columns: z.array(z.any()),
              constraints: z.array(z.any()),
              indexes: z.array(z.any()),
              comment: z.string().nullable(),
              row_count: z.number()
            })).or(z.object({ error: z.string() })),
            redis: z.object({
              version: z.string(),
              uptime_in_seconds: z.number(),
              connected_clients: z.number(),
              used_memory_human: z.string(),
              total_commands_processed: z.number()
            }).or(z.object({ error: z.string() }))
          }).openapi({
            description: '資料庫資訊響應'
          })
        }
      }
    },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    403: { $ref: '#/components/responses/ForbiddenError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const response: DatabaseInfoResponse = {
      postgres: {},
      redis: { error: 'Redis 連線不可用' }
    };

    // 取得 PostgreSQL 各 table 的欄位資訊
    try {
      const prisma = prismaService.getClient();
      
      // 取得所有表格名稱
      const tableResult = await prisma.$queryRaw<Array<{ tablename: string }>>`
        SELECT tablename 
        FROM pg_catalog.pg_tables 
        WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
      `;
      
      // 對每個表格取得詳細資訊
      const postgresData: Record<string, PostgresTableInfo> = {};
      for (const table of tableResult) {
        // 取得完整的欄位資訊
        const columnResult = await prisma.$queryRaw<DatabaseColumn[]>`
          SELECT 
            c.column_name,
            c.data_type,
            c.udt_name,
            c.character_maximum_length,
            c.numeric_precision,
            c.numeric_scale,
            c.is_nullable,
            c.column_default,
            c.is_identity,
            c.identity_generation,
            c.is_updatable,
            c.ordinal_position,
            pgd.description as comment
          FROM information_schema.columns c
          LEFT JOIN pg_catalog.pg_class pc ON pc.relname = c.table_name
          LEFT JOIN pg_catalog.pg_description pgd ON pgd.objoid = pc.oid AND pgd.objsubid = c.ordinal_position
          WHERE c.table_name = ${table.tablename}
          AND c.table_schema = 'public'
          ORDER BY c.ordinal_position
        `;
        
        // 取得約束資訊（主鍵、外鍵、唯一約束）
        const constraintResult = await prisma.$queryRaw<TableConstraint[]>`
          SELECT DISTINCT
            tc.constraint_name,
            tc.constraint_type,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          LEFT JOIN information_schema.constraint_column_usage ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
          WHERE tc.table_name = ${table.tablename}
          AND tc.table_schema = 'public'
          ORDER BY tc.constraint_type, tc.constraint_name
        `;
        
        // 取得索引資訊
        const indexResult = await prisma.$queryRaw<Array<{
          indexname: string;
          indexdef: string;
          tablename: string;
        }>>`
          SELECT indexname, indexdef, tablename
          FROM pg_indexes
          WHERE tablename = ${table.tablename}
          AND schemaname = 'public'
        `;
        
        // 解析索引資訊
        const indexes: TableIndex[] = indexResult.map(idx => {
          const isPrimary = idx.indexname.includes('_pkey');
          const isUnique = idx.indexdef.includes('UNIQUE') || isPrimary;
          const columnMatch = idx.indexdef.match(/\(([^)]+)\)/);
          const columnNames = columnMatch 
            ? columnMatch[1].split(',').map(c => c.trim().replace(/"/g, ''))
            : [];
          
          return {
            index_name: idx.indexname,
            index_type: idx.indexdef.includes('btree') ? 'btree' : 'other',
            is_unique: isUnique,
            is_primary: isPrimary,
            column_names: columnNames
          };
        });
        
        // 取得表格註解
        const tableCommentResult = await prisma.$queryRaw<Array<{ description: string | null }>>`
          SELECT obj_description(pc.oid) as description
          FROM pg_catalog.pg_class pc
          WHERE pc.relname = ${table.tablename}
          AND pc.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        `;
        
        // 取得表格行數
        const countResult = await prisma.$queryRawUnsafe<Array<{ count: number }>>(
          `SELECT COUNT(*)::int as count FROM "${table.tablename}"`
        );
        
        postgresData[table.tablename] = {
          columns: columnResult,
          constraints: constraintResult,
          indexes: indexes,
          comment: tableCommentResult[0]?.description || null,
          row_count: Number(countResult[0]?.count || 0)
        };
      }
      response.postgres = postgresData;
    } catch (postgresError) {
      console.error('PostgreSQL info error:', postgresError);
      response.postgres = { error: 'PostgreSQL 查詢失敗' };
    }

    // 取得 Redis 伺服器資訊
    try {
      if (redisClient && redisClient.status === 'ready') {
        const info = await redisClient.info('server');
        const stats = await redisClient.info('stats');
        const memory = await redisClient.info('memory');
        const clients = await redisClient.info('clients');

        // 解析 INFO 命令返回的字符串
        const parseInfo = (infoStr: string): Record<string, string> => {
          const result: Record<string, string> = {};
          const lines = infoStr.split('\r\n');
          for (const line of lines) {
            if (line && !line.startsWith('#')) {
              const [key, value] = line.split(':');
              if (key && value) {
                result[key] = value;
              }
            }
          }
          return result;
        };

        const serverInfo = parseInfo(info);
        const statsInfo = parseInfo(stats);
        const memoryInfo = parseInfo(memory);
        const clientsInfo = parseInfo(clients);

        response.redis = {
          version: serverInfo.redis_version || 'unknown',
          uptime_in_seconds: parseInt(serverInfo.uptime_in_seconds || '0', 10),
          connected_clients: parseInt(clientsInfo.connected_clients || '0', 10),
          used_memory_human: memoryInfo.used_memory_human || '0B',
          total_commands_processed: parseInt(statsInfo.total_commands_processed || '0', 10)
        };
      } else {
        response.redis = { error: 'Redis 連線不可用' };
      }
    } catch (redisError) {
      console.error('Redis info error:', redisError);
      response.redis = { error: 'Redis 查詢失敗' };
    }

    res.json(response);
  } catch (error) {
    console.error('Database info error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : '未知錯誤' 
    });
  }
});

export default router;