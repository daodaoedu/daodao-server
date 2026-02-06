/**
 * 資料庫配置
 * 整合所有資料庫服務 (PostgreSQL, Redis)
 */

import { postgres, redis } from '../services/database';

// 初始化所有資料庫連接
const initializeDatabases = async (): Promise<void> => {
  try {
    // PostgreSQL 和 Redis 會在各自的服務模組中自動連接
    console.log('資料庫服務已初始化');
  } catch (error) {
    console.error('資料庫初始化失敗:', error);
    console.error('⚠️  關鍵資料庫服務初始化失敗，服務無法啟動');
    process.exit(1);
  }
};

export { postgres, redis, initializeDatabases };
export default postgres;