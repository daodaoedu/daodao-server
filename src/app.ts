/**
 * TypeScript 應用程式整合
 * 負責初始化 TypeScript 模型和路由
 */

import express from 'express';
import swaggerUi from 'swagger-ui-express';
// 引入模型橋接工具
import setupModelBridge from './utils/modelBridge';
// 引入所有 TypeScript 模型，同時會執行模型之間的關聯設定
import models from './models/index';
// 引入 Swagger 規範
import { swaggerSpec } from './config/swagger.config';
// 引入資源路由
import resourcesRoutes from './routes/resources';
// 引入資源評價路由
import resourceReviewsRoutes from './routes/resource-reviews';

/**
 * 設置 TypeScript 路由和模型
 * @param app - Express 應用實例
 */
export function setupTypescriptRoutes(app: express.Application) {
  console.log('🚀 初始化 TypeScript 模型和相關設定...');
  
  // 設定 JavaScript 與 TypeScript 模型之間的關聯
  setupModelBridge();
  
  // 直接註冊 Swagger 路由
  app.use('/api-docs', swaggerUi.serve);
  app.get('/api-docs', swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'DaoDao API 文檔',
    customfavIcon: '/favicon.ico',
    swaggerOptions: {
      persistAuthorization: true,
      // 使用自定義排序函數，按照標籤的 x-order 屬性排序
      tagsSorter: (a: string, b: string) => {
        const tagsOrder: Record<string, number> = {
          'System': 1,
          'Resources': 2,
          'Tags': 3
        };
        return (tagsOrder[a] || 100) - (tagsOrder[b] || 100);
      },
      // 按照方法的優先級排序：GET > POST > PUT > DELETE
      operationsSorter: (a: any, b: any) => {
        const methodsOrder: Record<string, number> = {
          'get': 1,
          'post': 2,
          'put': 3,
          'patch': 4,
          'delete': 5
        };
        return (methodsOrder[a.get('method')] || 100) - (methodsOrder[b.get('method')] || 100);
      }
    }
  }));
  
  // 同時支持 /api/docs 路徑
  app.use('/api/docs', swaggerUi.serve);
  app.get('/api/docs', swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'DaoDao API 文檔',
    customfavIcon: '/favicon.ico',
    swaggerOptions: {
      persistAuthorization: true,
      // 使用自定義排序函數，按照標籤的 x-order 屬性排序
      tagsSorter: (a: string, b: string) => {
        const tagsOrder: Record<string, number> = {
          'System': 1,
          'Resources': 2,
          'Tags': 3
        };
        return (tagsOrder[a] || 100) - (tagsOrder[b] || 100);
      },
      // 按照方法的優先級排序：GET > POST > PUT > DELETE
      operationsSorter: (a: any, b: any) => {
        const methodsOrder: Record<string, number> = {
          'get': 1,
          'post': 2,
          'put': 3,
          'patch': 4,
          'delete': 5
        };
        return (methodsOrder[a.get('method')] || 100) - (methodsOrder[b.get('method')] || 100);
      }
    }
  }));
  
  // 提供 Swagger 規範的 JSON 端點
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
  
  console.log('📖 Swagger 文檔路由已註冊 - 可在 /api-docs 或 /api/docs 訪問');
  
  // 註冊 TypeScript 路由
  app.use('/resources', resourcesRoutes);
  // 將資源評價路由掛載到資源路由下
  app.use('/resources', resourceReviewsRoutes);
  console.log('💯 資源和評價路由已註冊 - 可在 /resources 訪問');
  
  // 加入測試端點
  /**
   * @swagger
   * /health:
   *   get:
   *     summary: 健康檢查端點
   *     tags: [System]
   *     description: 檢查系統健康狀態。
   *     x-order: 1
   *     responses:
   *       200:
   *         description: 伺服器運行正常
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: "ok"
   *                 uptime:
   *                   type: number
   *                   example: 12345.67
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   *                   example: "2025-06-17T10:30:00Z"
   */
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  });
  console.log('✅ 健康檢查端點已註冊 - 可在 /health 訪問');
  
  // 打印已加載的 TypeScript 模型
  console.log('✅ 已載入的 TypeScript 模型：', Object.keys(models).join(', '));
  
  return app;
}
