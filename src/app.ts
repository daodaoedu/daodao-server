/**
 * TypeScript 應用程式路由整合
 * 提供 TypeScript 路由的整合和導出
 */

import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.config';
import apiRoutes from './routes/index';

/**
 * 設定 TypeScript API 路由
 * @param app - Express 應用程式實例
 */
export function setupTypescriptRoutes(app: Express): void {
  console.log('🔧 Starting TypeScript routes setup...');
  console.log('🔧 Express app type:', typeof app);
  console.log('🔧 Express app._router exists:', !!app._router);
  
  // 測試路由
  app.get('/api/docs-test', (req, res) => {
    res.json({ message: 'TypeScript routes are working!' });
  });
  console.log('🔧 Added test route: /api/docs-test');
  
  // 簡單測試路由確認 Express 應用程式正常
  app.get('/typescript-test', (req, res) => {
    res.json({ status: 'TypeScript integration working', timestamp: new Date().toISOString() });
  });
  console.log('🔧 Added simple test route: /typescript-test');
  
  // 設定 Swagger UI 路由
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'DaoDao API Documentation'
  }));
  console.log('🔧 Added Swagger routes: /api/docs');
  
  // 設定 API v1 路由前綴
  app.use('/api/v1', apiRoutes);
  console.log('🔧 Added API v1 routes: /api/v1/*');
  
  console.log('✅ TypeScript API routes setup completed');
  console.log('📚 Swagger documentation available at /api/docs');
  console.log('📍 Available endpoints:');
  console.log('   - GET    /api/v1/health');
  console.log('   - GET    /api/v1/info');
  console.log('   - GET    /api/v1/resources');
  console.log('   - POST   /api/v1/resources');
  console.log('   - GET    /api/v1/resources/:id');
  console.log('   - PATCH  /api/v1/resources/:id');
  console.log('   - DELETE /api/v1/resources/:id');
  console.log('   - GET    /api/v1/resources/:id/tags');
  console.log('   - GET    /api/v1/resources/:resourceId/reviews');
  console.log('   - POST   /api/v1/resources/:resourceId/reviews');
  console.log('   - GET    /api/v1/reviews');
  console.log('   - POST   /api/v1/reviews');
  console.log('   - GET    /api/v1/reviews/:id');
  console.log('   - PATCH  /api/v1/reviews/:id');
  console.log('   - DELETE /api/v1/reviews/:id');
  console.log('   - POST   /api/v1/reviews/:id/like');
  console.log('   - DELETE /api/v1/reviews/:id/like');
  console.log('   - GET    /api/v1/tags/popular');
  console.log('   - GET    /api/v1/tags/search');
  console.log('   - GET    /api/v1/tags/stats');
  console.log('   - POST   /api/v1/tags/entities');
  console.log('   - DELETE /api/v1/tags/entities');
  console.log('   - GET    /api/v1/tags/entities');
}

/**
 * 導出 API 路由供 JavaScript 代碼使用
 */
export { default as apiRoutes } from './routes/index';