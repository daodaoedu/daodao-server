const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const { mongoConnect } = require('./services/mongo');
const cors = require("cors");
const dotenv = require('dotenv');
dotenv.config();
const dashboardRoutes = require('./routes/dashboard'); 
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const projectRoutes = require('./routes/project');
const mentorRoutes = require('./routes/mentor');
const circleRoutes = require('./routes/circle');
const commentRoutes = require('./routes/comment');
const emailRoutes = require('./routes/email');
const imageRoutes = require('./routes/image');
const projectListRoutes = require('./routes/projectList');
const session = require("express-session");
const rateLimit = require("express-rate-limit");
const passport = require("passport");
require("./services/passport");
const monitorRoutes = require('./routes/monitor');
const dbInfoRoutes = require('./routes/dbInfo');
const path = require('path');
const PORT = process.env.PORT || 3000;

// 引入資料庫重啟工具
const { startPeriodicRestart, checkPoolHealth, manualRestart } = require('./utils/dbRestart');

// 記憶體監控：啟動時記錄
const startMemUsage = process.memoryUsage();
console.log(`🧠 啟動記憶體使用: ${Math.round(startMemUsage.heapUsed / 1024 / 1024)}MB`);

const app = express();
app.use(express.json());

// 設置 trust proxy 以正確處理來自反向代理的請求
// 限制為特定的代理配置，提高安全性
app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal']);

const corsOptions = {
  origin: (origin, callback) => {
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

  // Rate limiter configuration
const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minutes
  max: 1000, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  headers: true,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  trustProxy: true, 
});

const strictLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minutes
  max: 60, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  headers: true,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  trustProxy: true, 
});

app.use(globalLimiter);
app.use((req, res, next) => {
  console.log(`IP: ${req.ip}, URL: ${req.originalUrl}`);
  next();
});
app.use(session({
    secret: process.env.SESSION_SEVRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: true },
}))
app.use(passport.initialize());
app.use(passport.session());

app.use('/',dashboardRoutes);
app.use('/list',projectListRoutes);
app.use('/auth', authRoutes);
app.use('/projects', projectRoutes);
app.use('/users', userRoutes);
app.use('/circles', circleRoutes);
app.use('/comments', commentRoutes);
app.use("/mentors", mentorRoutes);
app.use('/emails',strictLimiter, emailRoutes);
app.use('/images',strictLimiter, imageRoutes);
app.use('/monitor', monitorRoutes);
app.use('/db-info', dbInfoRoutes);

// Swagger 配置 - 使用 TypeScript 配置
let swaggerSpec;
try {
  // 嘗試載入 TypeScript Swagger 配置
  require('ts-node/register');
  require('tsconfig-paths/register');
  const { swaggerSpec: tsSwaggerSpec } = require('./src/config/swagger.config.ts');
  swaggerSpec = tsSwaggerSpec;
  console.log('✅ 使用 TypeScript Swagger 配置');
} catch (error) {
  console.warn('⚠️ 無法載入 TypeScript Swagger 配置，使用基本配置');
  // 回退到基本配置
  const swaggerOptions = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'DaoDao API',
        version: '1.0.0',
        description: 'DaoDao Learning Platform API Documentation'
      },
      servers: [
        {
          url: 'https://server.daoedu.tw/',
          description: '開發環境'
        },
        {
          url: 'https://dao-server.daoedu.tw/',
          description: '生產環境'
        }
      ]
    },
    apis: ['./routes/*.js', './src/routes/*.ts', './src/swagger/**/*.ts']
  };
  swaggerSpec = swaggerJsdoc(swaggerOptions);
}

// 設置 Swagger UI
app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'DaoDao API Documentation'
}));

// 同時支持 /api/docs 路徑
app.get('/api/docs', (req, res) => {
  res.redirect('/api-docs');
});

console.log('📚 Swagger UI available at http://localhost:4000/api-docs');

// 記憶體優化：強制使用編譯後的 TypeScript 文件
const fs = require('fs');
const compiledPath = './dist/src/app.js';

console.log('🧠 記憶體優化模式：優先使用編譯後的 TypeScript 文件');

if (fs.existsSync(compiledPath)) {
  try {
    console.log('🚀 使用編譯後的 TypeScript 路由（記憶體節省 ~150MB）...');
    const { setupTypescriptRoutes } = require(compiledPath);
    setupTypescriptRoutes(app);
    console.log('✅ TypeScript 路由設置完成（記憶體優化模式）');
  } catch (error) {
    console.error('❌ 編譯後的 TypeScript 路由載入失敗:', error.message);
    console.warn('🔧 建議執行 npm run build 重新編譯');
  }
} else {
  console.error('❌ 未找到編譯後的 TypeScript 文件');
  console.warn('⚠️ 為了節省記憶體，請先執行以下命令：');
  console.warn('   npm run build');
  console.warn('   然後重新啟動服務器');
  console.warn('💡 這將節省約 150MB 記憶體使用');
  
  // 不要讓服務器完全崩潰，但記錄嚴重警告
  console.log('⚠️ 服務器將以降級模式運行（僅 JavaScript 路由）');
}

// 添加調試中間件來查看所有請求
app.use((req, res, next) => {
  console.log(`📍 ${req.method} ${req.path}`);
  next();
});

// 添加調試路由來確認基本路由功能正常
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API is working',
    timestamp: new Date().toISOString()
  });
});

// 在服務器啟動前打印路由信息
const printRoutes = () => {
  console.log('\n📋 已註冊的路由：');
  if (app._router && app._router.stack) {
    app._router.stack.forEach((middleware) => {
      if (middleware.route) {
        // 直接註冊的路由
        console.log(`  ${Object.keys(middleware.route.methods).join(', ').toUpperCase()} ${middleware.route.path}`);
      } else if (middleware.name === 'router') {
        // 子路由器
        console.log(`  Router at ${middleware.regexp}`);
      }
    });
  }
};

// 把靜態文件處理移到這裡，在所有 API 路由之後
app.use(express.static(path.join(__dirname, 'public')));

// app.get('/', (req, res) => {
//     res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });



async function startServer() {
  try {
    // 嘗試連接 MongoDB，但即使失敗也繼續啟動服務器
    try {
      await mongoConnect();
    } catch (mongoError) {
      console.error('⚠️ MongoDB connection failed, but server will continue:', mongoError.message);
    }

    // 打印路由信息
    printRoutes();

    app.listen(PORT, () => {
      // 記憶體監控：服務器啟動後記錄
      const currentMemUsage = process.memoryUsage();
      const memUsedMB = Math.round(currentMemUsage.heapUsed / 1024 / 1024);
      const memDiffMB = Math.round((currentMemUsage.heapUsed - startMemUsage.heapUsed) / 1024 / 1024);

      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🧠 當前記憶體使用: ${memUsedMB}MB (+${memDiffMB}MB)`);


      // 設置定期記憶體監控
      setInterval(() => {
        const usage = process.memoryUsage();
        const heapMB = Math.round(usage.heapUsed / 1024 / 1024);
        if (heapMB > 200) {
          console.log(`⚠️ 記憶體使用偏高: ${heapMB}MB`);
        }
      }, 600000); // 每分鐘檢查一次

    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
