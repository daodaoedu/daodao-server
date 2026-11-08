/**
 * daodao#451 AC-08／AC-09：GET /api/v1/feedback/mine 只回登入者自己的錯誤回報
 * 真實 route／controller／service，mock 認證與資料庫。
 */
import '../config/openapi-registry';
import express, { type Request, type Response, type NextFunction } from 'express';
import request from 'supertest';
import { prismaMock } from '../../tests/utils/prisma-mock';

jest.mock('../services/database/prisma.service', () => ({ prisma: prismaMock }));
jest.mock('../middleware/auth', () => ({
  authenticateAny: (req: Request, _res: Response, next: NextFunction): void => {
    if (req.headers['x-test-user']) req.user = { id: Number(req.headers['x-test-user']) } as never;
    if (req.headers['x-test-temp']) (req as Request & { isTemporary?: boolean }).isTemporary = true;
    next();
  },
}));
jest.mock('../services/r2.service', () => ({ uploadToR2: jest.fn() }));
jest.mock('../services/email/email.service', () => ({ emailService: { sendEmail: jest.fn() } }));

import router from '../routes/feedback.routes';
import { globalErrorHandler } from '../middleware/error.middleware';

const app = express();
app.use(express.json());
app.use('/api/v1/feedback', router);
app.use(globalErrorHandler);

/** $queryRaw 收到的 Prisma.Sql 綁定值 */
const boundValues = (): unknown[] => (prismaMock.$queryRaw.mock.calls[0][0] as unknown as { values: unknown[] }).values;

describe('GET /api/v1/feedback/mine', () => {
  it('AC-08：回傳自己的回報，含區域、連結、截圖、狀態與團隊回覆', async () => {
    prismaMock.$queryRaw.mockResolvedValue([{
      id: 8, content: '按下送出後畫面沒有反應', status: 'replied', created_at: new Date('2026-11-08T02:00:00Z'),
      meta: { area: 'ui', link: 'https://app-dev.daodao.so/x', screenshots: ['https://storage-dev.daodao.so/bug-reports/a.png', 'bug-reports/relative.png'] },
      replies: [{ id: 12, content: '已修正', createdAt: '2026-11-08T03:00:00+00:00' }],
    }] as never);

    const response = await request(app).get('/api/v1/feedback/mine').set('x-test-user', '71');

    expect(response.status).toBe(200);
    expect(response.body.data.items).toEqual([{
      id: 8,
      content: '按下送出後畫面沒有反應',
      area: 'ui',
      link: 'https://app-dev.daodao.so/x',
      screenshots: ['https://storage-dev.daodao.so/bug-reports/a.png'],
      status: 'replied',
      createdAt: '2026-11-08T02:00:00.000Z',
      replies: [{ id: 12, content: '已修正', createdAt: '2026-11-08T03:00:00.000Z' }],
    }]);
  });

  it('AC-08：沒有回報時回空陣列', async () => {
    prismaMock.$queryRaw.mockResolvedValue([] as never);
    const response = await request(app).get('/api/v1/feedback/mine').set('x-test-user', '71');
    expect(response.status).toBe(200);
    expect(response.body.data.items).toEqual([]);
  });

  it('AC-09：查詢只綁定登入者 id，query 帶別人的 userId 也不會被採用', async () => {
    prismaMock.$queryRaw.mockResolvedValue([] as never);
    await request(app).get('/api/v1/feedback/mine?userId=72&user_id=72').set('x-test-user', '71');
    expect(boundValues()).toEqual([71]);
  });

  it('AC-09：未登入回 401，不查資料庫', async () => {
    const response = await request(app).get('/api/v1/feedback/mine');
    expect(response.status).toBe(401);
    expect(prismaMock.$queryRaw).not.toHaveBeenCalled();
  });

  it('臨時用戶回 403，不查資料庫', async () => {
    const response = await request(app).get('/api/v1/feedback/mine').set('x-test-user', '71').set('x-test-temp', '1');
    expect(response.status).toBe(403);
    expect(prismaMock.$queryRaw).not.toHaveBeenCalled();
  });
});
