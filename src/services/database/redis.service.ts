import Redis from 'ioredis';
import dotenv from 'dotenv';

// 載入環境變數
dotenv.config();

// 從環境變數中獲取 Redis 配置
const {
  REDIS_HOST = 'localhost',
  REDIS_PORT = '6379',
  REDIS_PASSWORD,
  REDIS_DB = '0',
  NODE_ENV = 'dev'
} = process.env;

// 建立 Redis 實例
const redis = new Redis({
  host: REDIS_HOST,
  port: parseInt(REDIS_PORT, 10),
  password: REDIS_PASSWORD,
  db: parseInt(REDIS_DB, 10),
  maxRetriesPerRequest: 5,
  lazyConnect: true,
  connectTimeout: 10000,
});

// 設定 Redis 事件監聽器
redis.on('connect', () => {
  console.log('Redis 連接成功');
});

redis.on('ready', () => {
  console.log('Redis 準備就緒');
});

redis.on('error', (err) => {
  console.error('Redis 連接錯誤:', err);
});

redis.on('close', () => {
  console.log('Redis 連接已關閉');
});

// 測試 Redis 連接
const testRedisConnection = async (): Promise<void> => {
  try {
    await redis.ping();
    console.log('Redis 連接測試成功');
  } catch (error) {
    console.error('Redis 連接測試失敗:', error);
  }
};

// 僅在非測試環境中執行連接測試
if (NODE_ENV !== 'test') {
  testRedisConnection();
}

// Redis 斷開連接函數
const redisDisconnect = async (): Promise<void> => {
  await redis.disconnect();
  console.log('Redis 連接已斷開');
};

export { redis, redisDisconnect };
export default redis;