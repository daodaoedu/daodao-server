import mongoose from 'mongoose';
import dotenv from 'dotenv';

// 載入環境變數
dotenv.config();

const MONGO_URL = process.env.MONGO_URL;

if (!MONGO_URL) {
  console.warn('⚠️  MONGO_URL 環境變數未設定，MongoDB 功能將不可用（僅影響監控功能）');
}

// 設定 MongoDB 連接事件監聽器
mongoose.connection.once('open', () => {
  console.log('MongoDB 資料庫連接成功');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB 連接錯誤:', err);
});

// MongoDB 連接函數
const mongoConnect = async (retries = 5): Promise<void> => {
  // 如果沒有配置 MONGO_URL，直接跳過連接
  if (!MONGO_URL) {
    console.warn('⚠️  跳過 MongoDB 連接（未配置 MONGO_URL）');
    return;
  }

  try {
    await mongoose.connect(MONGO_URL, {
      // 連接池配置
      maxPoolSize: 50, // 最大連接數
      minPoolSize: 5,  // 最小連接數
      maxIdleTimeMS: 30000, // 連接空閒超時
      serverSelectionTimeoutMS: 5000, // 服務器選擇超時
      socketTimeoutMS: 45000, // Socket 超時
    });
  } catch (error) {
    if (retries > 0) {
      console.log(`MongoDB 連接失敗，正在重試... (剩餘 ${retries} 次嘗試)`);
      await new Promise(resolve => setTimeout(resolve, 5000)); // 等待 5 秒
      return mongoConnect(retries - 1);
    }
    // 改為警告而非致命錯誤，允許服務繼續運行
    console.warn('⚠️  無法連接到 MongoDB - 監控功能將不可用，但核心服務正常運行');
    console.error('MongoDB 連接錯誤詳情:', error);
  }
};

// MongoDB 斷開連接函數
const mongoDisconnect = async (): Promise<void> => {
  await mongoose.disconnect();
  console.log('MongoDB 連接已斷開');
};

// 將 mongoose.connection 作為 mongoClient 匯出
const mongoClient = mongoose.connection;

export {
  mongoConnect,
  mongoDisconnect,
  mongoClient
};

export default mongoose;