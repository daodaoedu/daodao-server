/**
 * TypeScript 應用程式整合
 * 負責初始化 TypeScript 模型和路由
 */

import express from 'express';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
// Prisma 不需要手動引入模型，在服務層中直接使用
// 引入實際的資源路由
import resourceRoutes from './routes/resource.routes';
// 引入實際的資源評價路由  
import resourceReviewRoutes from './routes/resource-review.routes';
// 引入想法路由
import ideaRoutes from './routes/idea.routes';
// 引入我的想法路由
import meRoutes from './routes/me.routes';
// 引入標籤路由
import tagRoutes from './routes/tag.routes';
// 引入認證路由
import authRoutes from './routes/auth.routes';
// 引入專案路由
import projectRoutes from './routes/project.routes';
// 引入用戶路由
import userRoutes from './routes/user.routes';
// 引入郵件路由
import emailRoutes from './routes/email.routes';
// 引入留言路由
import commentRoutes from './routes/comment.routes';
// 引入圖片路由
import imageRoutes from './routes/image.routes';
// 引入導師路由
import mentorRoutes from './routes/mentor.routes';
// 引入實踐路由
import practiceRoutes from './routes/practice.routes';
// 引入 OAuth 服務初始化
import { initializePassport, initializePassportSession } from './services/auth/oauth.service';
// 引入日誌中間件
import { requestLogger, errorLogger, logApplicationEvent } from './middleware/logging.middleware';
// 引入回應增強中間件
import { responseEnhancerMiddleware } from './middleware/response-enhancer';
// 引入資料庫資訊和監控路由
import dbInfoRoutes from './routes/db-info.routes';
import monitorRoutes from './routes/monitor.routes';

/**
 * 設置 TypeScript 路由和模型
 * @param app - Express 應用實例
 */
export function setupTypescriptRoutes(app: express.Application) {
  console.log('🚀 初始化 TypeScript 模型和相關設定...');

  // 記錄應用程式啟動
  logApplicationEvent('startup', {
    nodeVersion: process.version,
    platform: process.platform,
    environment: process.env.NODE_ENV || 'dev'
  });

  // 註冊日誌中間件（必須在路由之前）
  app.use(requestLogger);
  console.log('📝 Winston 日誌中間件已初始化');

  // 註冊回應增強中間件
  app.use(responseEnhancerMiddleware);
  console.log('🔄 Response Enhancer Middleware 已初始化');

  // 初始化 Passport 認證
  app.use(initializePassport());
  app.use(initializePassportSession());
  console.log('🔐 Passport 認證系統已初始化');

  // 為 Swagger UI 路徑添加特殊的 CORS 處理中間件
  // 這允許 Chrome 擴充功能和其他工具訪問 Swagger UI 的靜態資源
  app.use(['/api-docs', '/api/docs'], (req, res, next) => {
    // 允許所有來源訪問 Swagger UI 的靜態資源
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
    } else {
      next();
    }
  });

  // 載入 Zod v4 自動生成的 OpenAPI 規範
  let swaggerDocument;
  // 在開發環境中，__dirname 是 src/，查找 ../openapi.json
  // 在生產環境中，__dirname 是 dist/src/，需要查找 ../../openapi.json
  const isDist = __dirname.includes('/dist/src');
  let openapiPath = isDist 
    ? path.join(__dirname, '../../openapi.json')  // 生產環境: /app/dist/src -> /app/openapi.json
    : path.join(__dirname, '../openapi.json');    // 開發環境: /src -> /openapi.json
  
  // 額外的備用路徑檢查 - 適應不同的部署環境
  const fallbackPaths = [
    path.resolve(process.cwd(), 'openapi.json'),           // 工作目錄
    path.join(process.cwd(), 'openapi.json'),             // 當前目錄
    path.resolve(__dirname, '../../openapi.json'),        // 相對於 dist/src
    path.resolve(__dirname, '../../../openapi.json'),     // 適應更深層的結構
    '/app/openapi.json'                                   // Docker 容器固定路徑
  ];
  
  // 如果主要路徑不存在，嘗試備用路徑
  if (!fs.existsSync(openapiPath)) {
    for (const fallbackPath of fallbackPaths) {
      if (fs.existsSync(fallbackPath)) {
        openapiPath = fallbackPath;
        break;
      }
    }
  }
  
  // 調試日誌
  console.log(`🔍 OpenAPI 路徑調試:
    __dirname: ${__dirname}
    process.cwd(): ${process.cwd()}
    isDist: ${isDist}
    openapiPath: ${openapiPath}
    文件存在: ${fs.existsSync(openapiPath)}`);
  
  if (!fs.existsSync(openapiPath)) {
    console.error('❌ OpenAPI 文檔不存在，請先執行 pnpm run openapi:generate 生成文檔');
    console.warn('⚠️  Swagger UI 將無法正常顯示');
    swaggerDocument = {
      openapi: '3.0.0',
      info: {
        title: 'API Documentation Not Available',
        version: '1.0.0',
        description: '請執行 pnpm run types:generate 生成 API 文檔'
      },
      paths: {}
    };
  } else {
    try {
      swaggerDocument = JSON.parse(fs.readFileSync(openapiPath, 'utf-8'));
      console.log('✅ 已載入 Zod v4 自動生成的 OpenAPI 文檔');
    } catch (error) {
      console.error('❌ 載入 OpenAPI 文檔失敗:', error);
      swaggerDocument = {
        openapi: '3.0.0',
        info: {
          title: 'API Documentation Error',
          version: '1.0.0',
          description: 'OpenAPI 文檔載入失敗，請檢查 openapi.json 格式'
        },
        paths: {}
      };
    }
  }

  // 設置 Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'DaoDao API 文檔'
  }));
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'DaoDao API 文檔'
  }));
  console.log('📚 Swagger UI 已初始化 - 可在 /api-docs 和 /api/docs 訪問');

  // 添加簡單的測試路由來確認路由工作
  app.get('/api/ts-test', (req, res) => {
    res.json({
      message: 'TypeScript routes are working!',
      timestamp: new Date().toISOString()
    });
  });
  console.log('🧪 TypeScript 測試路由已註冊 - 可在 /api/ts-test 訪問');

  // 註冊認證路由
  app.use('/api/v1/auth', authRoutes);
  console.log('🔑 v1 認證路由已註冊 - 可在 /api/v1/auth 訪問');

  // 註冊資源路由
  app.use('/api/v1/resources', resourceRoutes);
  console.log('💯 v1 資源路由已註冊 - 可在 /api/v1/resources 訪問');
  // 註冊資源評價路由
  app.use('/api/v1/resources/:resourceId/reviews', resourceReviewRoutes);
  console.log('💯 v1 資源和評價路由已註冊 - 可在 /api/v1/resources 訪問');

  // 註冊想法路由
  app.use('/api/v1/ideas', ideaRoutes);
  console.log('💡 v1 想法路由已註冊 - 可在 /api/v1/ideas 訪問');

  // 註冊我的想法路由
  app.use('/api/v1/me', meRoutes);
  console.log('👤 v1 個人路由已註冊 - 可在 /api/v1/me 訪問');

  // 註冊標籤路由
  app.use('/api/v1/tags', tagRoutes);
  console.log('🏷️ v1 標籤路由已註冊 - 可在 /api/v1/tags 訪問');

  // 註冊專案路由
  app.use('/api/v1/projects', projectRoutes);
  console.log('📁 v1 專案路由已註冊 - 可在 /api/v1/projects 訪問');

  // 註冊用戶路由
  app.use('/api/v1/users', userRoutes);
  console.log('👥 v1 用戶路由已註冊 - 可在 /api/v1/users 訪問');

  // 註冊留言路由
  app.use('/api/v1/comments', commentRoutes);
  console.log('💬 v1 留言路由已註冊 - 可在 /api/v1/comments 訪問');

  // 註冊圖片路由
  app.use('/api/v1/images', imageRoutes);
  console.log('🖼️ v1 圖片路由已註冊 - 可在 /api/v1/images 訪問');

  // 註冊郵件路由
  app.use('/api/v1/email', emailRoutes);
  console.log('📧 v1 郵件路由已註冊 - 可在 /api/v1/email 訪問');


  // 註冊導師路由
  app.use('/api/v1/mentor', mentorRoutes);
  console.log('👨‍🏫 v1 導師路由已註冊 - 可在 /api/v1/mentor 訪問');


  // 註冊實踐路由
  app.use('/api/v1/practices', practiceRoutes);
  console.log('⚡ v1 實踐路由已註冊 - 可在 /api/v1/practices 訪問');

  // 註冊資料庫資訊路由
  app.use('/api/v1/db-info', dbInfoRoutes);
  console.log('🗃️ v1 資料庫資訊路由已註冊 - 可在 /api/v1/db-info 訪問');

  // 註冊系統監控路由
  app.use('/api/v1/monitor', monitorRoutes);
  console.log('📊 v1 系統監控路由已註冊 - 可在 /api/v1/monitor 訪問');

  // 監控 HTML 頁面的直接路由
  app.get('/api/v1/monitor.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/monitor.html'));
  });
  console.log('📄 監控頁面路由已註冊 - 可在 /api/v1/monitor.html 訪問');

  // 資料庫資訊 HTML 頁面的直接路由
  app.get('/api/v1/db-info.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/db-info.html'));
  });
  console.log('🗃️ 資料庫資訊頁面路由已註冊 - 可在 /api/v1/db-info.html 訪問');

  // v1 健康檢查端點
  app.get('/api/v1/health', (req, res) => {
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  });
  console.log('✅ v1 健康檢查端點已註冊 - 可在 /api/v1/health 訪問');

  // 使用 Prisma 架構，不需要手動加載模型
  console.log('✅ 已啟用 Prisma 資料庫架構');

  // 靜態文件服務（必須在錯誤處理之前）
  app.use(express.static(path.join(__dirname, '../public')));
  console.log('📁 靜態文件服務已初始化');

  // 註冊錯誤日誌中間件（必須在所有路由之後）
  app.use(errorLogger);
  console.log('🚨 錯誤日誌中間件已初始化');

  // 添加全域錯誤處理中間件（必須在最後）
  const { globalErrorHandler, notFoundHandler } = require('./middleware/error.middleware');
  app.use(notFoundHandler);
  app.use(globalErrorHandler);
  console.log('🚨 全域錯誤處理中間件已初始化');

  return app;
}

// Export app for testing
export const app = express();
