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
const ideaRoutes = require('./routes/idea');
const mentorRoutes = require('./routes/mentor');
const circleRoutes = require('./routes/circle');
const commentRoutes = require('./routes/comment');
const marathonRoutes = require('./routes/marathon');
const tagRoutes = require('./routes/tag');
const emailRoutes = require('./routes/email');
const imageRoutes = require('./routes/image');
const projectListRoutes = require('./routes/projectList');
const session = require("express-session");
const rateLimit = require("express-rate-limit");
const passport = require("passport");
require("./services/passport");
const monitorRoutes = require('./routes/monitor');
const dbInfoRoutes = require('./routes/dbInfo');
const User = require("./models/user.model");
const Activity = require("./models/activity.model");
const Marathon = require("./models/marathon.model");
const path = require('path');
const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json());

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
app.use('/ideas', ideaRoutes);
app.use('/circles', circleRoutes);
app.use('/comments', commentRoutes);
app.use("/marathons", marathonRoutes);
app.use("/mentors", mentorRoutes);
app.use('/tags', tagRoutes);
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
          url: 'http://localhost:4000',
          description: 'Development server'
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

// TypeScript 路由整合 - 必須在靜態文件處理之前
try {
  // 使用 ts-node 和 tsconfig-paths 動態編譯和載入 TypeScript 路由
  require('ts-node/register');
  require('tsconfig-paths/register');
  
  // 這裡打印日訊，協助追蹤問題
  console.log('🔍 正在載入 TypeScript 路由...');
  
  const { setupTypescriptRoutes } = require('./src/app.ts');
  console.log('✅ TypeScript 路由模塊已載入，正在設置路由...');
  
  setupTypescriptRoutes(app);
  console.log('✅ TypeScript 路由設置完成');
} catch (error) {
  console.error('❌ TypeScript 路由加載失敗:', error);
  console.warn('⚠️ 請確保已安裝 ts-node 和 tsconfig-paths 套件');
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
    await mongoConnect();
    
    // 打印路由信息
    printRoutes();
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
