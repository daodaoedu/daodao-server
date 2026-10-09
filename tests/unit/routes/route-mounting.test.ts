/**
 * Regression（daodao#166 dev 冒煙 J-07）：feedback.routes 只登記在從未被掛載的
 * src/routes/index.ts，app.ts 沒有 app.use 它，server-dev 的
 * POST /api/v1/feedback/bug-report 因此回 404「找不到路由」。
 *
 * 1. 行為測試：用正式的 setupTypescriptRoutes 建 app，未登入送出要得到 401（路由存在、被驗證擋下），不能是 404。
 * 2. 結構測試：src/routes 底下每個 *.routes.ts 都必須被 app.ts 掛載，或被其他 route 檔引入；
 *    目前已知沒掛載的死檔列在 KNOWN_UNMOUNTED，新增的 route 檔漏掛會直接 fail。
 */
import fs from 'fs';
import path from 'path';
import express from 'express';
import request from 'supertest';
import { prismaMock } from '@tests/utils/prisma-mock';

jest.mock('@/services/database/prisma.service', () => ({ prisma: prismaMock }));

const ROUTES_DIR = path.resolve(__dirname, '../../../src/routes');
const APP_FILE = path.resolve(__dirname, '../../../src/app.ts');

/**
 * 已知未掛載、且本次不處理的 route 檔（各自待開卡確認是要掛載還是刪除）。
 * 不要把新的 route 檔加進來規避這個測試——該做的是在 app.ts 掛載它。
 */
const KNOWN_UNMOUNTED = new Set([
  'index.ts', // 舊的彙整 router，從未被 app.ts 使用
  'health.routes.ts', // app.ts 直接定義 GET /api/v1/health，這個 router 只被 index.ts 引用
  'outcome.routes.ts', // 沒有任何檔案 import（/api/v1/outcomes 不存在）
  'proxy.routes.ts', // 沒有任何檔案 import（圖片代理 /api/v1/proxy/* 不存在）
]);

describe('route mounting', () => {
  it('POST /api/v1/feedback/bug-report is mounted: unauthenticated request gets 401, not 404', async () => {
    const app = express();
    app.use(express.json());
    const { setupTypescriptRoutes } = await import('@/app');
    setupTypescriptRoutes(app);

    const res = await request(app)
      .post('/api/v1/feedback/bug-report')
      .field('area', 'ui')
      .field('description', '按鈕沒反應');

    expect(res.status).toBe(401);
  });

  it('every src/routes/*.routes.ts is mounted in app.ts or imported by another route file', () => {
    const appSource = fs.readFileSync(APP_FILE, 'utf8');
    const routeFiles = fs.readdirSync(ROUTES_DIR).filter(f => f.endsWith('.ts'));
    const otherRouteSources = routeFiles
      .filter(f => f !== 'index.ts')
      .map(f => ({ file: f, source: fs.readFileSync(path.join(ROUTES_DIR, f), 'utf8') }));

    const unmounted = routeFiles.filter(file => {
      if (KNOWN_UNMOUNTED.has(file)) return false;
      const base = file.replace(/\.ts$/, '');
      const importedByApp = appSource.includes(`'./routes/${base}'`);
      const importedByRoute = otherRouteSources.some(
        r => r.file !== file && r.source.includes(`'./${base}'`)
      );
      return !importedByApp && !importedByRoute;
    });

    expect(unmounted).toEqual([]);
  });
});
