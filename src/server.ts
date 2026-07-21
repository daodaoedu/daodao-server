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
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import session from 'express-session';
import { RedisStore } from 'connect-redis';
import passport from 'passport';
import { setupTypescriptRoutes } from './app';
import { prismaService } from './services/database/prisma.service';
import { emailService } from './services/email/email.service';
import redis from './services/database/redis.service';
import { loggerService } from './services/logging/logger.service';
// BullMQ
import {
  getRawConnection,
  closeQueueConnection,
  createPracticeEmailQueue,
  createPracticeEmailWorker,
  registerScheduledJobs,
  closePracticeEmailWorker,
  setPracticeEmailQueue,
  // Practice Status Queue
  createPracticeStatusQueue,
  createPracticeStatusWorker,
  registerPracticeStatusScheduledJobs,
  closePracticeStatusWorker,
  setPracticeStatusQueue,
  // Notification Queues
  createNotificationInAppQueue,
  createNotificationEmailQueue,
  createNotificationWeeklyQueue,
  setNotificationInAppQueue,
  setNotificationEmailQueue,
  setNotificationWeeklyQueue,
  registerNotificationScheduledJobs,
  createNotificationInAppWorker,
  createNotificationEmailWorker,
  createNotificationWeeklyWorker,
  closeNotificationInAppWorker,
  closeNotificationEmailWorker,
  closeNotificationWeeklyWorker,
  // Social Notification Queue
  createSocialNotificationQueue,
  setSocialNotificationQueue,
  createSocialNotificationWorker,
  closeSocialNotificationWorker,
  // Onboarding Email Queue
  createOnboardingEmailQueue,
  setOnboardingEmailQueue,
  createOnboardingEmailWorker,
  closeOnboardingEmailWorker,
  // Email Queue（通用郵件發送佇列）
  createEmailQueue,
  setEmailQueue,
  createEmailWorker,
  closeEmailWorker,
  registerEmailRetryScheduledJob,
  type EmailJobData,
  // Tag Rule Evaluation Queue
  createTagRuleQueue,
  setTagRuleQueue,
  createTagRuleWorker,
  closeTagRuleWorker,
  registerTagRuleScheduledJobs,
  type TagRuleJobData,
} from './queues';
import type { OnboardingEmailJobData } from './types/email/onboarding.types';
import { DEFAULT_EMAIL_SCHEDULES } from './types/email/practice.types';
import type { Queue, Worker } from 'bullmq';
import type { PracticeEmailJobData } from './types/email/practice.types';
import type { PracticeStatusJobData } from './queues';
import type { SocialNotificationJob } from './types/social.types';

// BullMQ 全域實例
let practiceEmailQueue: Queue<PracticeEmailJobData> | null = null;
let practiceEmailWorker: Worker<PracticeEmailJobData> | null = null;
let practiceStatusQueue: Queue<PracticeStatusJobData> | null = null;
let practiceStatusWorker: Worker<PracticeStatusJobData> | null = null;
let notificationInAppWorker: Worker | null = null;
let notificationEmailWorker: Worker | null = null;
let notificationWeeklyWorker: Worker | null = null;
let socialNotificationQueue: Queue<SocialNotificationJob> | null = null;
let socialNotificationWorker: Worker<SocialNotificationJob> | null = null;
let onboardingEmailQueue: Queue<OnboardingEmailJobData> | null = null;
let onboardingEmailWorker: Worker<OnboardingEmailJobData> | null = null;
let emailQueue: Queue<EmailJobData> | null = null;
let emailWorker: Worker<EmailJobData> | null = null;
let tagRuleQueue: Queue<TagRuleJobData> | null = null;
let tagRuleWorker: Worker<TagRuleJobData> | null = null;


const app = express();
const PORT = process.env.PORT || 3000;

// 安全中間件
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      scriptSrcAttr: ["'unsafe-inline'"],  // 允許內聯事件處理器 (onclick, onkeyup 等)
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// 基本中間件設置
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser()); // 解析 Cookie，用於 Cookie 認證

// 設置 trust proxy
app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal']);

// CORS 配置
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:4000',
      'https://www.daoedu.tw',
      'https://staging-daodao-f2e.daoedu.workers.dev',
      // daodao.so 域名（正式環境）
      'https://daodao.so',
      'https://app.daodao.so',
      // daodao.so 域名（測試環境）
      'https://dev.daodao.so',
      'https://app-dev.daodao.so',
      // daodao.so 域名（Feature 環境）
      'https://feat.daodao.so',
      'https://app-feat.daodao.so'
    ];
    const daodaoTestPattern = /^https:\/\/[\w-]+\.daodao-notion-test\.pages\.dev$/;
    const daodaoSoPattern = /^https:\/\/[\w-]+\.daodao\.so$/;
    const devPattern = /^https:\/\/[\w-]+\.daoedu\.workers\.dev$/;
    const localhostPattern = /^https?:\/\/localhost(:[0-9]+)?$/;
    const chromeExtensionPattern = /^chrome-extension:\/\//;

    // 允許沒有 origin 的請求（例如從同源或某些工具的請求）
    // 允許已配置的來源
    // 允許 Chrome 擴充功能
    // 允許本地開發
    // 允許所有 daodao.so 子域名
    if (!origin ||
      allowedOrigins.includes(origin) ||
      daodaoTestPattern.test(origin) ||
      daodaoSoPattern.test(origin) ||
      devPattern.test(origin) ||
      localhostPattern.test(origin) ||
      chromeExtensionPattern.test(origin)) {
      callback(null, true);
    } else {
      // 對於靜態資源（如 favicon），允許所有來源
      callback(null, false);
    }
  },
  methods: "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  credentials: true,
  optionsSuccessStatus: 204
};

// 使用 CORS 中間件
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
// 與 auth_token cookie 一致：以 COOKIE_DOMAIN 是否設定判斷是否為已部署環境
const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error('SESSION_SECRET environment variable is required');
}
if ((process.env.NODE_ENV === 'prod' || process.env.NODE_ENV === 'production') && sessionSecret.length < 32) {
  throw new Error('SESSION_SECRET must be at least 32 characters in production');
}
const hasDeployedDomain = !!process.env.COOKIE_DOMAIN;
app.use(session({
  store: new RedisStore({ client: redis, prefix: 'sess:' }),
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: hasDeployedDomain,
    httpOnly: true,
    sameSite: hasDeployedDomain ? 'none' : 'lax',
    domain: hasDeployedDomain ? process.env.COOKIE_DOMAIN : undefined,
    maxAge: 10 * 60 * 1000 // 10 分鐘，與 nonce/state 有效期一致
  }
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
    const server = app.listen(PORT, () => {
      console.log(`🚀 TypeScript Server running on port ${PORT}`);
      console.log(`📖 API docs available at http://localhost:${PORT}/api-docs`);
      console.log(`📖 API docs also available at http://localhost:${PORT}/api/docs`);
    });

    // 避免 nginx keepalive 連線池持有過期連線導致 502
    // Node.js 預設 keepAliveTimeout 為 5s，nginx 複用到已關閉的連線會 502
    server.keepAliveTimeout = 75000;  // 75s，大於 nginx 連線池回收時間
    server.headersTimeout = 76000;    // 必須大於 keepAliveTimeout

    // 初始化 BullMQ（非阻塞）
    initializeBullMQ().catch(error => {
      loggerService.warn('BullMQ 初始化失敗，郵件排程功能將不可用', { error: error.message });
    });
  } catch (error) {
    console.error('❌ 服務器啟動失敗:', error);
    process.exit(1);
  }
}

/**
 * 初始化 BullMQ 郵件隊列系統
 */
async function initializeBullMQ(): Promise<void> {
  try {
    // 連接 Redis
    const connection = getRawConnection();
    await connection.connect();
    console.log('📬 BullMQ Redis 連線已建立');

    // ===== Practice Email Queue =====
    practiceEmailQueue = createPracticeEmailQueue();
    setPracticeEmailQueue(practiceEmailQueue);
    console.log('📬 Practice Email Queue 已建立');

    practiceEmailWorker = createPracticeEmailWorker({ concurrency: 5 });
    console.log('📬 Practice Email Worker 已啟動');

    await registerScheduledJobs(practiceEmailQueue, DEFAULT_EMAIL_SCHEDULES);
    console.log('📬 郵件排程任務已註冊');

    // ===== Practice Status Queue（自動完成到期實踐）=====
    practiceStatusQueue = createPracticeStatusQueue();
    setPracticeStatusQueue(practiceStatusQueue);
    console.log('⏰ Practice Status Queue 已建立');

    practiceStatusWorker = createPracticeStatusWorker({ concurrency: 1 });
    console.log('⏰ Practice Status Worker 已啟動');

    await registerPracticeStatusScheduledJobs(practiceStatusQueue);
    console.log('⏰ 實踐狀態排程任務已註冊（每小時檢查到期實踐）');

    // ===== Notification Queues =====
    const notificationInAppQueue = createNotificationInAppQueue();
    setNotificationInAppQueue(notificationInAppQueue);
    const notificationEmailQueue = createNotificationEmailQueue();
    setNotificationEmailQueue(notificationEmailQueue);
    const notificationWeeklyQueue = createNotificationWeeklyQueue();
    setNotificationWeeklyQueue(notificationWeeklyQueue);
    console.log('🔔 Notification Queues 已建立');

    notificationInAppWorker = createNotificationInAppWorker();
    notificationEmailWorker = createNotificationEmailWorker();
    notificationWeeklyWorker = createNotificationWeeklyWorker();
    console.log('🔔 Notification Workers 已啟動');

    await registerNotificationScheduledJobs(notificationInAppQueue, notificationEmailQueue, notificationWeeklyQueue);
    console.log('🔔 通知排程任務已註冊');

    // ===== Social Notification Queue（關注/連結 fan-out）=====
    socialNotificationQueue = createSocialNotificationQueue();
    setSocialNotificationQueue(socialNotificationQueue);
    console.log('👥 Social Notification Queue 已建立');

    socialNotificationWorker = createSocialNotificationWorker({ concurrency: 5 });
    console.log('👥 Social Notification Worker 已啟動');

    // ===== Onboarding Email Queue =====
    onboardingEmailQueue = createOnboardingEmailQueue();
    setOnboardingEmailQueue(onboardingEmailQueue);
    console.log('🎯 Onboarding Email Queue 已建立');

    onboardingEmailWorker = createOnboardingEmailWorker();
    console.log('🎯 Onboarding Email Worker 已啟動');

    // ===== Email Queue（通用郵件發送佇列，含持久化重試）=====
    emailQueue = createEmailQueue();
    setEmailQueue(emailQueue);
    console.log('📧 Email Queue 已建立');

    emailWorker = createEmailWorker({ concurrency: 5 });
    console.log('📧 Email Worker 已啟動');

    await registerEmailRetryScheduledJob(emailQueue);
    console.log('📧 Email 失敗重試排程已註冊（每小時 30 分）');

    // ===== Tag Rule Evaluation Queue（自動標籤規則評估）=====
    tagRuleQueue = createTagRuleQueue();
    setTagRuleQueue(tagRuleQueue);
    console.log('🏷️ Tag Rule Queue 已建立');

    tagRuleWorker = createTagRuleWorker({ concurrency: 1 });
    console.log('🏷️ Tag Rule Worker 已啟動');

    await registerTagRuleScheduledJobs(tagRuleQueue);
    console.log('🏷️ 標籤規則排程任務已註冊（每小時檢查）');

    console.log('✅ BullMQ 系統初始化完成');
  } catch (error) {
    console.error('❌ BullMQ 初始化失敗:', error);
    throw error;
  }
}

// 優雅關閉處理
async function gracefulShutdown(signal: string) {
  console.log(`\n⏳ 收到 ${signal} 信號，正在關閉服務器...`);
  try {
    // 關閉 Practice Email Worker
    if (practiceEmailWorker) {
      await closePracticeEmailWorker(practiceEmailWorker);
      console.log('✅ Practice Email Worker 已關閉');
    }

    // 關閉 Practice Email Queue
    if (practiceEmailQueue) {
      await practiceEmailQueue.close();
      console.log('✅ Practice Email Queue 已關閉');
    }

    // 關閉 Practice Status Worker
    if (practiceStatusWorker) {
      await closePracticeStatusWorker(practiceStatusWorker);
      console.log('✅ Practice Status Worker 已關閉');
    }

    // 關閉 Practice Status Queue
    if (practiceStatusQueue) {
      await practiceStatusQueue.close();
      console.log('✅ Practice Status Queue 已關閉');
    }

    // 關閉 Notification Workers
    if (notificationInAppWorker) {
      await closeNotificationInAppWorker(notificationInAppWorker);
      console.log('✅ Notification In-App Worker 已關閉');
    }
    if (notificationEmailWorker) {
      await closeNotificationEmailWorker(notificationEmailWorker);
      console.log('✅ Notification Email Worker 已關閉');
    }
    if (notificationWeeklyWorker) {
      await closeNotificationWeeklyWorker(notificationWeeklyWorker);
      console.log('✅ Notification Weekly Worker 已關閉');
    }
    if (socialNotificationWorker) {
      await closeSocialNotificationWorker(socialNotificationWorker);
      console.log('✅ Social Notification Worker 已關閉');
    }
    if (socialNotificationQueue) {
      await socialNotificationQueue.close();
      console.log('✅ Social Notification Queue 已關閉');
    }
    if (onboardingEmailWorker) {
      await closeOnboardingEmailWorker(onboardingEmailWorker);
      console.log('✅ Onboarding Email Worker 已關閉');
    }
    if (onboardingEmailQueue) {
      await onboardingEmailQueue.close();
      console.log('✅ Onboarding Email Queue 已關閉');
    }
    if (emailWorker) {
      await closeEmailWorker(emailWorker);
      console.log('✅ Email Worker 已關閉');
    }
    if (emailQueue) {
      await emailQueue.close();
      console.log('✅ Email Queue 已關閉');
    }
    if (tagRuleWorker) {
      await closeTagRuleWorker(tagRuleWorker);
      console.log('✅ Tag Rule Worker 已關閉');
    }
    if (tagRuleQueue) {
      await tagRuleQueue.close();
      console.log('✅ Tag Rule Queue 已關閉');
    }

    // 關閉 BullMQ Redis 連線
    await closeQueueConnection();
    console.log('✅ BullMQ Redis 連線已關閉');

    // 關閉郵件服務
    await emailService.close();
    console.log('✅ 郵件服務已關閉');

    // 關閉資料庫連線
    await prismaService.disconnect();
    console.log('✅ 資料庫連線已關閉');

    process.exit(0);
  } catch (error) {
    console.error('❌ 關閉服務器時發生錯誤:', error);
    process.exit(1);
  }
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// 啟動服務器
startServer();
