import { Sequelize, QueryTypes } from 'sequelize';
import dotenv from 'dotenv';

// 載入環境變數
dotenv.config();

// 從環境變數中獲取資料庫配置
const {
  POSTGRES_HOST = process.env.APP_ENV === 'dev' ? 'postgres-dev' : 'postgres-prod',
  POSTGRES_PORT = '5432',
  POSTGRES_USER = 'daodao',
  POSTGRES_PASSWORD = 'daodao',
  POSTGRES_DB = 'daodao',
  NODE_ENV = 'dev'
} = process.env;

// 建立 Sequelize 實例
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: POSTGRES_HOST,
  port: parseInt(POSTGRES_PORT, 10),
  username: POSTGRES_USER,
  password: POSTGRES_PASSWORD,
  database: POSTGRES_DB,
  logging: NODE_ENV === 'development' ? console.log : false,
  define: {
    underscored: true,
    timestamps: true,
    paranoid: true
  },
  pool: {
    max: 5,         // 降低最大連線數以節省記憶體
    min: 1,         // 降低最小連線數
    acquire: 60000, // 增加獲取超時時間以應對慢速 Swap
    idle: 10000,
    evict: 5000
  }
});

// 測試資料庫連接
const testConnection = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL 資料庫連接成功');
  } catch (error) {
    console.error('無法連接到 PostgreSQL 資料庫:', error);
  }
};

// 僅在非測試環境中執行連接測試
if (NODE_ENV !== 'test') {
  testConnection();
}

export { sequelize as postgresClient, QueryTypes };
export default sequelize;