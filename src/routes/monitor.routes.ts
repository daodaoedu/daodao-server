import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { registry } from '../config/openapi-registry';
import os from 'os';
import { prismaService } from '../services/database/prisma.service';
import { authenticateAny } from '../middleware/auth';
import { UnauthorizedError, ForbiddenError } from '../middleware/error.middleware';
import { createErrorResponse } from '../utils/response-helper';
import { requireAdmin } from '../middleware/permission.middleware';

const router = Router();

const systemSchema = z.object({
  uptime: z.number(),
  loadAverage: z.array(z.number()),
  totalMemory: z.number(),
  freeMemory: z.number(),
  processMemory: z.object({
    rss: z.number(), heapTotal: z.number(), heapUsed: z.number(),
    external: z.number(), arrayBuffers: z.number(),
  }),
});
const postgresSchema = z.union([
  z.object({ current_connections: z.number(), max_connections: z.number() }),
  z.object({ error: z.literal('PostgreSQL 連線不可用') }),
]);
const diskSchema = z.object({
  size: z.number(), used: z.number(), available: z.number(), use: z.number(),
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/monitor',
  security: [{ bearerAuth: [] }],
  tags: ['System Monitor'],
  summary: '取得系統健康統計',
  description: '僅管理員可讀取 CPU 負載、記憶體、磁碟用量及 PostgreSQL 連線統計，不包含主機或資料庫識別資訊。',
  responses: {
    200: {
      description: '系統健康統計；資料庫不可用時保留其他健康資訊',
      content: { 'application/json': { schema: z.object({
        system: systemSchema, postgres: postgresSchema, disk: z.array(diskSchema),
      }) } },
    },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    403: { $ref: '#/components/responses/ForbiddenError' },
    500: { $ref: '#/components/responses/InternalServerError' },
  },
});

router.get('/', authenticateAny, requireAdmin, async (_req: Request, res: Response) => {
  try {
    const memory = process.memoryUsage();
    const system = {
      uptime: os.uptime(),
      loadAverage: os.loadavg(),
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      processMemory: {
        rss: memory.rss, heapTotal: memory.heapTotal, heapUsed: memory.heapUsed,
        external: memory.external, arrayBuffers: memory.arrayBuffers,
      },
    };
    let postgres: z.infer<typeof postgresSchema>;
    try {
      const prisma = prismaService.getClient();
      const connections = await prisma.$queryRaw<Array<{
        current_connections: number;
        max_connections: number;
      }>>`
        SELECT sum(numbackends)::int as current_connections,
               current_setting('max_connections')::int as max_connections
        FROM pg_stat_database
      `;
      postgres = {
        current_connections: connections[0]?.current_connections ?? 0,
        max_connections: connections[0]?.max_connections ?? 0,
      };
    } catch {
      postgres = { error: 'PostgreSQL 連線不可用' };
    }
    // Disk collection is not currently available; retain its existing zero-usage placeholder.
    const disk = [{ size: 0, used: 0, available: 0, use: 0 }];
    res.json({ system, postgres, disk });
  } catch {
    res.status(500).json(createErrorResponse('INTERNAL_SERVER_ERROR', '系統監控暫不可用'));
  }
});

// Keep authorization failures inside this privacy boundary; the shared dev handler adds stacks.
router.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof UnauthorizedError) {
    res.status(401).json(createErrorResponse('UNAUTHORIZED', '請先登入'));
    return;
  }
  if (error instanceof ForbiddenError) {
    res.status(403).json(createErrorResponse('FORBIDDEN', '需要管理員權限'));
    return;
  }
  res.status(500).json(createErrorResponse('INTERNAL_SERVER_ERROR', '系統監控暫不可用'));
});

export default router;
