/**
 * 資料庫配置
 * 整合所有資料庫服務 (PostgreSQL, MongoDB, Redis)
 */

import { postgres, mongo, redis } from '../services/database';
import { mongoConnect } from '../services/database';

// 初始化所有資料庫連接
const initializeDatabases = async (): Promise<void> => {
  try {
    // 初始化 MongoDB 連接（現在是可選的）
    try {
      await mongoConnect();
    } catch (mongoError) {
      console.warn('⚠️  MongoDB 連接失敗，服務將繼續啟動（監控功能將不可用）');
      console.error('MongoDB 錯誤:', mongoError);
    }

    // PostgreSQL 和 Redis 會在各自的服務模組中自動連接
    console.log('資料庫服務已初始化');
  } catch (error) {
    console.error('資料庫初始化失敗:', error);
    // MongoDB 失敗不應該阻止服務啟動，只有 PostgreSQL 或 Redis 失敗才應該退出
    // 因為核心業務邏輯依賴 PostgreSQL
    console.error('⚠️  關鍵資料庫服務初始化失敗，服務無法啟動');
    process.exit(1);
  }
};

// 注意：不再自動執行初始化
// 如果需要使用 MongoDB，請在 server.ts 中手動調用 mongoConnect()
// 目前 MongoDB 只用於監控端點，會在路由被訪問時檢查連接狀態

export { postgres, mongo, redis, initializeDatabases };
export default postgres;