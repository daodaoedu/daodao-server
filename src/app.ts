/**
 * TypeScript 應用程式整合
 * 負責初始化 TypeScript 模型和路由
 */

import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.config';
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
// 引入 OAuth 服務初始化
import { initializePassport, initializePassportSession } from './services/auth/oauth.service';
// 引入日誌中間件
import { requestLogger, errorLogger, logApplicationEvent } from './middleware/logging.middleware';

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
    environment: process.env.NODE_ENV || 'development'
  });
  
  // 註冊日誌中間件（必須在路由之前）
  app.use(requestLogger);
  console.log('📝 Winston 日誌中間件已初始化');
  
  // 初始化 Passport 認證
  app.use(initializePassport());
  app.use(initializePassportSession());
  console.log('🔐 Passport 認證系統已初始化');
  
  // 設置 Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'DaoDao API 文檔'
  }));
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
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
  
  // 註冊郵件路由
  app.use('/api/v1/email', emailRoutes);
  console.log('📧 v1 郵件路由已註冊 - 可在 /api/v1/email 訪問');
  
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
