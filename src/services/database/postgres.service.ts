/**
 * PostgreSQL 資料庫服務 (使用 Prisma)
 * 提供統一的資料庫連接和健康檢查功能
 */

import dotenv from 'dotenv';
import { prismaService } from './prisma.service';

// 載入環境變數
dotenv.config();

// 資料庫配置
const {
  NODE_ENV = 'dev'
} = process.env;

// 測試資料庫連接
const testConnection = async (): Promise<void> => {
  try {
    await prismaService.connect();
    console.log('✅ PostgreSQL (Prisma) 資料庫連接成功');
  } catch (error) {
    console.error('❌ 無法連接到 PostgreSQL 資料庫:', error);
    throw error;
  }
};

// 資料庫健康檢查
const healthCheck = async (): Promise<{
  postgresql: boolean;
  prisma: boolean;
}> => {
  const results = {
    postgresql: false,
    prisma: false
  };

  try {
    const isHealthy = await prismaService.healthCheck();
    results.prisma = isHealthy;
    results.postgresql = isHealthy; // Prisma 健康就代表 PostgreSQL 健康
  } catch (error) {
    console.error('❌ 資料庫健康檢查失敗:', error);
  }

  return results;
};

// 優雅關閉資料庫連接
const gracefulShutdown = async (): Promise<void> => {
  try {
    await prismaService.disconnect();
    console.log('✅ 資料庫連接已優雅關閉');
  } catch (error) {
    console.error('❌ 資料庫關閉過程中發生錯誤:', error);
  }
};

// 僅在非測試環境中執行連接測試
if (NODE_ENV !== 'test') {
  testConnection();
  
  // 註冊優雅關閉處理器
  process.on('SIGINT', gracefulShutdown);
  process.on('SIGTERM', gracefulShutdown);
}

// 導出 Prisma 服務作為主要資料庫客戶端
export { 
  prismaService as postgresClient,
  prismaService,
  healthCheck, 
  gracefulShutdown,
  testConnection
};

// 預設導出 Prisma 服務
export default prismaService;