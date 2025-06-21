/**
 * TypeScript 應用程式整合
 * 負責初始化 TypeScript 模型和路由
 */

import express from 'express';
// 引入模型橋接工具
import setupModelBridge from './utils/model-bridge';
// 引入所有 TypeScript 模型，同時會執行模型之間的關聯設定
import models from './models/index';
// 引入實際的資源路由
import resourceRoutes from './routes/resource-routes';
// 引入實際的資源評價路由  
import resourceReviewRoutes from './routes/resource-review-routes';

/**
 * 設置 TypeScript 路由和模型
 * @param app - Express 應用實例
 */
export function setupTypescriptRoutes(app: express.Application) {
  console.log('🚀 初始化 TypeScript 模型和相關設定...');
  
  // 設定 JavaScript 與 TypeScript 模型之間的關聯
  setupModelBridge();
  
  // Swagger 配置已移至 index.js
  console.log('📖 Swagger 文檔已在 index.js 中配置');
  
  // 添加簡單的測試路由來確認路由工作
  app.get('/api/ts-test', (req, res) => {
    res.json({
      message: 'TypeScript routes are working!',
      timestamp: new Date().toISOString()
    });
  });
  console.log('🧪 TypeScript 測試路由已註冊 - 可在 /api/ts-test 訪問');
  
  // 註冊 v1 API 路由
  app.use('/api/v1/resources', resourceRoutes);
  // 將資源評價路由掛載到資源路由下
  app.use('/api/v1/resources', resourceReviewRoutes);
  console.log('💯 v1 資源和評價路由已註冊 - 可在 /api/v1/resources 訪問');
  
  // v1 健康檢查端點
  app.get('/api/v1/health', (req, res) => {
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  });
  console.log('✅ v1 健康檢查端點已註冊 - 可在 /api/v1/health 訪問');
  
  // 打印已加載的 TypeScript 模型
  console.log('✅ 已載入的 TypeScript 模型：', Object.keys(models).join(', '));
  
  return app;
}
