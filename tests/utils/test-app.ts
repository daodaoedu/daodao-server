/**
 * 測試用 App 設定
 * 提供正確初始化的 Express app 用於整合測試
 */

import express from 'express';
import session from 'express-session';

let testApp: express.Application | null = null;

/**
 * 取得測試用 app 實例
 * 會自動初始化 session 和路由
 */
export async function getTestApp(): Promise<express.Application> {
  if (testApp) {
    return testApp;
  }

  testApp = express();
  testApp.use(express.json());
  testApp.use(express.urlencoded({ extended: true }));

  // 添加 session 中間件（Passport 需要）
  testApp.use(session({
    secret: 'test-secret',
    resave: false,
    saveUninitialized: false
  }));

  // 呼叫 setupTypescriptRoutes 註冊路由
  const { setupTypescriptRoutes } = await import('@/app');
  setupTypescriptRoutes(testApp);

  return testApp;
}

/**
 * 重置測試 app（用於需要重新初始化的情況）
 */
export function resetTestApp(): void {
  testApp = null;
}
