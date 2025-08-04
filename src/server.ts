/**
 * TypeScript 服務器入口文件
 */

// 只在本機環境載入 tsconfig-paths
if (process.env.NODE_ENV === 'local') {
  require('tsconfig-paths/register');
}
import dotenv from 'dotenv';
// 載入環境變數
dotenv.config();
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import session from 'express-session';
import passport from 'passport';
import { setupTypescriptRoutes } from './app';
import { prismaService } from './services/database/prisma.service';


const app = express();
const PORT = process.env.PORT || 3000;

// 安全中間件
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// 基本中間件設置
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 設置 trust proxy
app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal']);

// CORS 配置
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:4000',
      'https://www.daoedu.tw'
    ];
    const daodaoTestPattern = /^https:\/\/[\w-]+\.daodao-notion-test\.pages\.dev$/;
    const localhostPattern = /^https?:\/\/localhost(:[0-9]+)?$/;

    if (!origin || 
        allowedOrigins.includes(origin) || 
        daodaoTestPattern.test(origin) ||
        localhostPattern.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: "GET,POST,PUT,DELETE,OPTIONS",
  credentials: true,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// Rate limiting
const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1000,
  message: "Too many requests from this IP, please try again later.",
  headers: true,
  standardHeaders: true,
  legacyHeaders: false,
});

// Slow down repeated requests
const speedLimiter = slowDown({
  windowMs: 1 * 60 * 1000, // 1 minute
  delayAfter: 100, // 允許前100個請求正常速度
  delayMs: () => 500, // 每超過一個請求增加500ms延遲
  maxDelayMs: 20000, // 最大延遲20秒
});

app.use(globalLimiter);
app.use(speedLimiter);

// Session 配置
app.use(session({
  secret: process.env.SESSION_SECRET || 'default-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }, // 開發環境設為 false
}));

// Passport 初始化
app.use(passport.initialize());
app.use(passport.session());

// 啟動服務器函數
async function startServer() {
  try {
    // 初始化資料庫連線
    await prismaService.connect();
    console.log('🗄️ 資料庫連線已建立');
    
    // 設置 TypeScript 路由
    setupTypescriptRoutes(app);
    
    // 404 處理 (必須在路由設置之後)
    app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    });

    // 錯誤處理
    app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error(err.stack);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    });
    
    // 啟動服務器
    app.listen(PORT, () => {
      console.log(`🚀 TypeScript Server running on port ${PORT}`);
      console.log(`📖 API docs available at http://localhost:${PORT}/api-docs`);
      console.log(`📖 API docs also available at http://localhost:${PORT}/api/docs`);
    });
  } catch (error) {
    console.error('❌ 服務器啟動失敗:', error);
    process.exit(1);
  }
}

// 優雅關閉處理
process.on('SIGINT', async () => {
  console.log('\n⏳ 正在關閉服務器...');
  try {
    await prismaService.disconnect();
    console.log('✅ 資料庫連線已關閉');
    process.exit(0);
  } catch (error) {
    console.error('❌ 關閉服務器時發生錯誤:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('\n⏳ 正在關閉服務器...');
  try {
    await prismaService.disconnect();
    console.log('✅ 資料庫連線已關閉');
    process.exit(0);
  } catch (error) {
    console.error('❌ 關閉服務器時發生錯誤:', error);
    process.exit(1);
  }
});

// 啟動服務器
startServer();