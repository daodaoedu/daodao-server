const sequelize = require('../config/db');

const restartDatabaseConnection = async () => {
  try {
    console.log('🔄 開始重啟資料庫連線...');
    
    // 記錄重啟前的連線池狀態
    const poolBefore = sequelize.connectionManager.pool;
    if (poolBefore) {
      console.log('重啟前連線池狀態:', {
        size: poolBefore.size || 0,
        available: poolBefore.available || 0,
        using: poolBefore.using || 0,
        waiting: poolBefore.waiting || 0
      });
    }
    
    // 1. 關閉現有連線池
    await sequelize.connectionManager.close();
    console.log('✅ 已關閉舊連線池');
    
    // 2. 重新初始化連線池
    await sequelize.connectionManager.initPools();
    console.log('✅ 已建立新連線池');
    
    // 3. 測試新連線
    await sequelize.authenticate();
    console.log('✅ 資料庫連線重啟成功');
    
    // 記錄重啟後的連線池狀態
    const poolAfter = sequelize.connectionManager.pool;
    if (poolAfter) {
      console.log('重啟後連線池狀態:', {
        size: poolAfter.size || 0,
        available: poolAfter.available || 0,
        using: poolAfter.using || 0,
        waiting: poolAfter.waiting || 0
      });
    }
    
    return { success: true, timestamp: new Date().toISOString() };
  } catch (error) {
    console.error('❌ 資料庫連線重啟失敗:', error);
    return { success: false, error: error.message, timestamp: new Date().toISOString() };
  }
};

// 定期重啟（每 2 小時）
const startPeriodicRestart = () => {
  const interval = 2 * 60 * 60 * 1000; // 2 小時 = 7200000 毫秒
  
  console.log('📅 已啟動定期資料庫連線重啟（每 2 小時）');
  
  const restartInterval = setInterval(async () => {
    console.log('\n⏰ 定期重啟時間到，執行資料庫連線重啟...');
    const result = await restartDatabaseConnection();
    
    if (!result.success) {
      console.error('❌ 定期重啟失敗，可能需要重啟應用');
      // 這裡可以加入告警通知
    } else {
      console.log('✅ 定期重啟完成');
    }
  }, interval);
  
  // 返回停止函數，方便在應用關閉時清理
  return () => {
    clearInterval(restartInterval);
    console.log('🛑 已停止定期資料庫連線重啟');
  };
};

// 手動重啟函數（可用於 API 或緊急情況）
const manualRestart = async () => {
  console.log('\n🔧 手動觸發資料庫連線重啟...');
  return await restartDatabaseConnection();
};

// 檢查連線池健康狀況
const checkPoolHealth = () => {
  try {
    const pool = sequelize.connectionManager.pool;
    
    if (!pool) {
      return { healthy: false, reason: '連線池不存在' };
    }
    
    const status = {
      size: pool.size || 0,
      available: pool.available || 0,
      using: pool.using || 0,
      waiting: pool.waiting || 0
    };
    
    // 判斷是否健康
    const isHealthy = status.waiting <= 3 && status.available > 0;
    
    return {
      healthy: isHealthy,
      status: status,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      healthy: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

module.exports = {
  restartDatabaseConnection,
  startPeriodicRestart,
  manualRestart,
  checkPoolHealth
};