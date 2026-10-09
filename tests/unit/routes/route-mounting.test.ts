/**
 * Regression（daodao#166 dev 冒煙 J-07）：feedback.routes 只登記在從未被掛載的
 * src/routes/index.ts，app.ts 沒有 app.use 它，server-dev 的
 * POST /api/v1/feedback/bug-report 因此回 404「找不到路由」。
 *
 * 1. 行為測試（正式 setupTypescriptRoutes 建的 app）：
 *    - 未登入送出要得到 401（路由存在、被驗證擋下），不能是 404
 *    - 已完成 onboarding 的使用者 201；臨時用戶（尚未完成 onboarding）403——
 *      feedback.user_id 是 users(id) 的 FK，臨時用戶的 id 屬於 temp_users，寫進去會掛錯人或違反 FK，
 *      所以 /api/v1/feedback 掛 requireOnboardingComplete
 * 2. 結構測試：檢查 Express router stack（不是 import 字串）——src/routes 底下每個 route 檔匯出的
 *    Router 都必須真的被 app.use 掛進 app（直接或巢狀）；只匯出 factory 的 route 檔（dev-login）
 *    必須被一個已掛載的 route 檔引入。已知未掛載的死檔列在 KNOWN_UNMOUNTED（daodao#298）。
 */

import { prismaMock } from '@tests/utils/prisma-mock';
import type express from 'express';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import path from 'path';
import request from 'supertest';

jest.mock('@/services/database/prisma.service', () => ({ prisma: prismaMock }));

const mockSubmitBugReport = jest.fn();
jest.mock('@/services/feedback.service', () => ({
  __esModule: true,
  submitBugReport: (...args: unknown[]) => mockSubmitBugReport(...args),
  default: { submitBugReport: (...args: unknown[]) => mockSubmitBugReport(...args) },
}));

import { getTestApp } from '@tests/utils/test-app';
import { authenticateAny } from '@/middleware/auth';
import { requireOnboardingComplete } from '@/middleware/onboarding-gate.middleware';
import { bugReportLimiter } from '@/middleware/rate-limit.middleware';
import feedbackRoutes from '@/routes/feedback.routes';

const ROUTES_DIR = path.resolve(__dirname, '../../../src/routes');

/**
 * 已知未掛載、且本次不處理的 route 檔，追蹤於 daodao#298（決定掛載或刪除）。
 * 不要把新的 route 檔加進來規避這個測試——該做的是在 app.ts 掛載它。
 */
const KNOWN_UNMOUNTED = new Set([
  'index.ts', // 舊的彙整 router，從未被 app.ts 使用（daodao#298）
  'health.routes.ts', // app.ts 直接定義 GET /api/v1/health，這個 router 只被 index.ts 引用（daodao#298）
  'outcome.routes.ts', // 沒有任何檔案 import（/api/v1/outcomes 不存在）（daodao#298）
  'proxy.routes.ts', // 沒有任何檔案 import（圖片代理 /api/v1/proxy/* 不存在）（daodao#298）
]);

interface Layer {
  handle: unknown;
  regexp?: RegExp;
}

const isRouter = (value: unknown): value is { stack: Layer[] } =>
  typeof value === 'function' && Array.isArray((value as { stack?: unknown }).stack);

const appStack = (app: express.Application): Layer[] => {
  const internal = app as unknown as { _router?: { stack: Layer[] }; router?: { stack: Layer[] } };
  const stack = internal._router?.stack ?? internal.router?.stack;
  if (!stack) throw new Error('找不到 Express app 的 router stack');
  return stack;
};

/** 收集 app 內所有被掛載的 handle（含 router 內巢狀 router.use 的子 router） */
const collectMountedHandles = (stack: Layer[], seen = new Set<unknown>()): Set<unknown> => {
  for (const layer of stack) {
    if (seen.has(layer.handle)) continue;
    seen.add(layer.handle);
    if (isRouter(layer.handle)) collectMountedHandles(layer.handle.stack, seen);
  }
  return seen;
};

const tokenFor = (payload: Record<string, unknown>) =>
  jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: '1h' });

const submit = (app: express.Application, token?: string) => {
  const req = request(app).post('/api/v1/feedback/bug-report');
  if (token) req.set('Authorization', `Bearer ${token}`);
  return req.field('area', 'ui').field('description', '按鈕沒反應');
};

describe('route mounting', () => {
  let app: express.Application;

  beforeAll(async () => {
    app = await getTestApp();
  });

  beforeEach(() => mockSubmitBugReport.mockReset().mockResolvedValue({ id: 1 }));

  it('POST /api/v1/feedback/bug-report is mounted: unauthenticated request gets 401, not 404', async () => {
    const res = await submit(app);
    expect(res.status).toBe(401);
  });

  it('an onboarded user can submit a bug report (201)', async () => {
    const res = await submit(app, tokenFor({ id: 501, email: 'u501@test.local', isTemp: false }));
    expect(res.status).toBe(201);
    expect(mockSubmitBugReport).toHaveBeenCalledWith(expect.objectContaining({ userId: 501 }));
  });

  it('a temp (not yet onboarded) user is rejected with 403 before anything is written', async () => {
    const res = await submit(app, tokenFor({ id: 502, email: 'u502@test.local', isTemp: true }));
    expect(res.status).toBe(403);
    expect(mockSubmitBugReport).not.toHaveBeenCalled();
  });

  it('POST /bug-report runs authenticateAny → requireOnboardingComplete → bugReportLimiter before multer', () => {
    const routeLayer = (
      feedbackRoutes as unknown as { stack: Array<{ route?: { path: string; stack: Layer[] } }> }
    ).stack.find((layer) => layer.route?.path === '/bug-report');
    const handles = routeLayer?.route?.stack.map((layer) => layer.handle) ?? [];
    expect(handles.slice(0, 3)).toEqual([
      authenticateAny,
      requireOnboardingComplete,
      bugReportLimiter,
    ]);
    // 這個 router 本身也必須真的掛在 app 上
    expect(collectMountedHandles(appStack(app)).has(feedbackRoutes)).toBe(true);
  });

  it('every router exported from src/routes is actually mounted in the app (router stack, not import text)', () => {
    const mounted = collectMountedHandles(appStack(app));
    const routeFiles = fs
      .readdirSync(ROUTES_DIR)
      .filter((f) => f.endsWith('.ts') && !KNOWN_UNMOUNTED.has(f));

    const loaded = routeFiles.map((file) => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = require(path.join(ROUTES_DIR, file)) as Record<string, unknown>;
      return { file, routers: Object.values(mod).filter(isRouter) };
    });

    const unmountedRouters = loaded.flatMap(({ file, routers }) =>
      routers.filter((router) => !mounted.has(router)).map(() => file)
    );

    // 只匯出 factory（不匯出 Router 實例）的 route 檔：必須被某個「已掛載」的 route 檔引入
    const mountedFiles = loaded.filter(
      (l) => l.routers.length > 0 && l.routers.every((r) => mounted.has(r))
    );
    const factoryOnlyOrphans = loaded
      .filter((l) => l.routers.length === 0)
      .filter(({ file }) => {
        const base = file.replace(/\.ts$/, '');
        return !mountedFiles.some((m) =>
          fs.readFileSync(path.join(ROUTES_DIR, m.file), 'utf8').includes(`'./${base}'`)
        );
      })
      .map((l) => l.file);

    expect({ unmountedRouters, factoryOnlyOrphans }).toEqual({
      unmountedRouters: [],
      factoryOnlyOrphans: [],
    });
  });

  it('KNOWN_UNMOUNTED entries are really unmounted (drop them from the allowlist once daodao#298 mounts or deletes them)', () => {
    const mounted = collectMountedHandles(appStack(app));
    const nowMounted = [...KNOWN_UNMOUNTED].filter((file) => {
      const full = path.join(ROUTES_DIR, file);
      if (!fs.existsSync(full)) return false;
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = require(full) as Record<string, unknown>;
      return Object.values(mod)
        .filter(isRouter)
        .some((router) => mounted.has(router));
    });
    expect(nowMounted).toEqual([]);
  });
});
