import mongoose from 'mongoose';
import dotenv from 'dotenv';

// 載入環境變數
dotenv.config();

const MONGO_URL = process.env.MONGO_URL;

if (!MONGO_URL) {
  console.error('MONGO_URL 環境變數未設定');
  process.exit(1);
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
  try {
    await mongoose.connect(MONGO_URL);
  } catch (error) {
    if (retries > 0) {
      console.log(`MongoDB 連接失敗，正在重試... (剩餘 ${retries} 次嘗試)`);
      await new Promise(resolve => setTimeout(resolve, 5000)); // 等待 5 秒
      return mongoConnect(retries - 1);
    }
    console.error('無法連接到 MongoDB:', error);
    process.exit(1);
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