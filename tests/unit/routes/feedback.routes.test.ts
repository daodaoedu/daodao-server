/**
 * daodao#166 code review（Codex P2）：錯誤回報每次請求最多上傳 3 張圖到 R2、並寄一封通知信，
 * 只靠全域 1000/IP/分 的限流不夠。路由要有自己的限流（以登入使用者為 key），超過回 429，
 * 且在 multer 解析檔案之前擋下。
 */
import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import type { RateLimitRequestHandler } from 'express-rate-limit';

const mockSubmitBugReport = jest.fn();
jest.mock('@/services/feedback.service', () => ({
  __esModule: true,
  submitBugReport: (...args: unknown[]) => mockSubmitBugReport(...args),
  default: { submitBugReport: (...args: unknown[]) => mockSubmitBugReport(...args) },
}));

// Route tests isolate Redis; the shared-counter integration suite uses real Redis.
jest.mock('@/middleware/shared-rate-limit', () => ({
  createSharedRateLimiter: (_name: string, options: Record<string, unknown>): RateLimitRequestHandler => {
    const { default: rateLimit, MemoryStore } = jest.requireActual('express-rate-limit');
    return rateLimit({ ...options, store: new MemoryStore() });
  },
}));

import { globalErrorHandler } from '@/middleware/error.middleware';
import { BUG_REPORT_RATE_LIMIT } from '@/middleware/rate-limit.middleware';
import feedbackRoutes from '@/routes/feedback.routes';

const tokenFor = (id: number) =>
  jwt.sign({ id, email: `user${id}@test.local`, isTemp: false }, process.env.JWT_SECRET as string, {
    expiresIn: '1h',
  });

const buildApp = () => {
  const app = express();
  app.use('/api/v1/feedback', feedbackRoutes);
  app.use(globalErrorHandler);
  return app;
};

const submit = (app: express.Application, userId: number) =>
  request(app)
    .post('/api/v1/feedback/bug-report')
    .set('Authorization', `Bearer ${tokenFor(userId)}`)
    .field('area', 'ui')
    .field('description', '限流測試 回報');

describe('POST /api/v1/feedback/bug-report rate limit', () => {
  beforeEach(() => mockSubmitBugReport.mockReset().mockResolvedValue({ id: 1 }));

  it('allows up to the per-user limit, then returns 429 without calling the service', async () => {
    const app = buildApp();

    for (let i = 0; i < BUG_REPORT_RATE_LIMIT.max; i += 1) {
      const ok = await submit(app, 101);
      expect(ok.status).toBe(201);
    }

    const limited = await submit(app, 101);
    expect(limited.status).toBe(429);
    expect(limited.body.success).toBe(false);
    expect(mockSubmitBugReport).toHaveBeenCalledTimes(BUG_REPORT_RATE_LIMIT.max);
  });

  it('counts per user: another user is not affected by the first user hitting the limit', async () => {
    const app = buildApp();
    for (let i = 0; i <= BUG_REPORT_RATE_LIMIT.max; i += 1) {
      await submit(app, 202);
    }

    const other = await submit(app, 303);
    expect(other.status).toBe(201);
  });
});
