/**
 * BullMQ Redis 連線配置
 *
 * 使用獨立連線配置，避免與其他 Redis 使用衝突
 * 設定 maxRetriesPerRequest: null 以符合 BullMQ 要求
 *
 * @see docs/practice-mvp/backend-implementation-plan.md
 */

import IORedis from 'ioredis';
import type { ConnectionOptions } from 'bullmq';
import { loggerService } from '../services/logging/logger.service';

/**
 * BullMQ 連線配置
 */
export interface QueueConnectionConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  maxRetriesPerRequest: null; // BullMQ 要求
  enableReadyCheck: boolean;
  retryStrategy?: (times: number) => number | null;
}

/**
 * 預設連線配置
 */
const defaultConfig: QueueConnectionConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_QUEUE_DB || '1', 10), // 使用不同的 DB
  maxRetriesPerRequest: null, // BullMQ 要求必須為 null
  enableReadyCheck: false,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 1000, 30000);
    loggerService.warn('Redis connection retry', { attempt: times, delay });
    return delay;
  }
};

/**
 * 建立 BullMQ 專用的 Redis 連線
 */
export function createQueueConnection(config?: Partial<QueueConnectionConfig>): IORedis {
  const finalConfig = { ...defaultConfig, ...config };

  const connection = new IORedis({
    host: finalConfig.host,
    port: finalConfig.port,
    password: finalConfig.password,
    db: finalConfig.db,
    maxRetriesPerRequest: finalConfig.maxRetriesPerRequest,
    enableReadyCheck: finalConfig.enableReadyCheck,
    retryStrategy: finalConfig.retryStrategy,
    lazyConnect: true
  });

  connection.on('connect', () => {
    loggerService.info('BullMQ Redis connected', {
      host: finalConfig.host,
      port: finalConfig.port,
      db: finalConfig.db
    });
  });

  connection.on('error', (error) => {
    loggerService.error('BullMQ Redis error', { error: error.message });
  });

  connection.on('close', () => {
    loggerService.warn('BullMQ Redis connection closed');
  });

  return connection;
}

/**
 * 共享的 Queue 連線實例
 */
let sharedConnection: IORedis | null = null;

/**
 * 取得共享的 Queue 連線
 * 返回 BullMQ 需要的 ConnectionOptions 類型
 */
export function getQueueConnection(): ConnectionOptions {
  if (!sharedConnection) {
    sharedConnection = createQueueConnection();
  }
  // 使用 as unknown as 轉型以解決 ioredis 版本差異
  return sharedConnection as unknown as ConnectionOptions;
}

/**
 * 取得原始的 Redis 連線實例
 * 用於需要直接操作 Redis 連線的場景（如 connect, disconnect）
 */
export function getRawConnection(): IORedis {
  if (!sharedConnection) {
    sharedConnection = createQueueConnection();
  }
  return sharedConnection;
}

/**
 * 關閉共享連線
 */
export async function closeQueueConnection(): Promise<void> {
  if (sharedConnection) {
    await sharedConnection.quit();
    sharedConnection = null;
    loggerService.info('BullMQ Redis connection closed gracefully');
  }
}

/**
 * 檢查連線狀態
 */
export function isQueueConnectionReady(): boolean {
  return sharedConnection?.status === 'ready';
}
