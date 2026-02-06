/**
 * 資料庫服務模組導出
 * 主要使用 Prisma ORM 進行 PostgreSQL 操作
 */

// PostgreSQL 服務 (使用 Prisma)
export { 
  default as postgres, 
  postgresClient, 
  healthCheck as postgresHealthCheck,
  gracefulShutdown as postgresGracefulShutdown,
  prismaService,
  testConnection as postgresTestConnection
} from './postgres.service';

// Redis 服務
export { default as redis, redisDisconnect } from './redis.service';

// Prisma 服務直接導出（主要資料庫客戶端）
export { 
  default as prisma, 
  prismaService as prismaServiceInstance, 
  prisma as prismaClient 
} from './prisma.service';

// 統一的資料庫健康檢查
export const healthCheckAll = async () => {
  const { healthCheck } = await import('./postgres.service');
  // 可以添加其他資料庫的健康檢查
  
  return {
    ...(await healthCheck()),
    // 其他資料庫狀態...
  };
};