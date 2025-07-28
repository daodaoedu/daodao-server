/**
 * 資料庫配置
 * 整合所有資料庫服務 (PostgreSQL, MongoDB, Redis)
 */

import { postgres, mongo, redis } from '../services/database';
import { mongoConnect } from '../services/database';

// 初始化所有資料庫連接
const initializeDatabases = async (): Promise<void> => {
  try {
    // 初始化 MongoDB 連接
    await mongoConnect();
    
    // PostgreSQL 和 Redis 會在各自的服務模組中自動連接
    console.log('所有資料庫服務已初始化');
  } catch (error) {
    console.error('資料庫初始化失敗:', error);
    process.exit(1);
  }
};

// 僅在非測試環境中執行初始化
if (process.env.NODE_ENV !== 'test') {
  initializeDatabases();
}

export { postgres, mongo, redis };
export default postgres;