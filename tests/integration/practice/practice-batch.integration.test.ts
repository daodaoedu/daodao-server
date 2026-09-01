/**
 * Practice Batch Create Integration Tests（daodaoedu/daodao#141 拆段）
 *
 * 涵蓋範圍：
 * - B-1: POST /api/v1/practices/batch 3 段成功、順序一致、主題色連續
 * - B-2: 任一段驗證失敗 → 400、零寫入
 * - B-3: 段數 1 / 4 → 400
 * - B-4: 日期不接續 → 400 並指向該段
 * - B-5: 交易內任一 create 失敗 → 500 且副作用不觸發
 * - R-1: templateId 不再被 zod 靜默丟棄（regression）
 */

import { prismaMock, setupTransactionMock } from '@tests/utils/prisma-mock';
import { createAuthToken } from '@tests/utils/api-helpers';
import request from 'supertest';

jest.mock('@/services/database/prisma.service', () => ({
  prisma: prismaMock
}));

jest.mock('@/services/logging/logger.service', () => ({
  loggerService: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() }
}));

const enqueuePracticeEmailMock = jest.fn().mockResolvedValue({ id: 'job-id' });
jest.mock('@/queues/practice-email.queue', () => ({
  practiceEmailQueue: { add: jest.fn().mockResolvedValue({ id: 'job-id' }) },
  enqueuePracticeEmail: (...args: unknown[]) => enqueuePracticeEmailMock(...args)
}));
jest.mock('@/queues', () => ({
  enqueuePracticeEmail: (...args: unknown[]) => enqueuePracticeEmailMock(...args)
}));

jest.mock('@/services/id-converter.service', () => ({
  externalToInternalId: jest.fn().mockResolvedValue(1),
  internalToExternalId: jest.fn().mockResolvedValue('550e8400-e29b-41d4-a716-446655440002')
}));

let app: any;

const createDecimalMock = (value: number) => ({
  valueOf: () => value,
  toString: () => value.toString(),
  toNumber: () => value,
  toFixed: (digits?: number) => value.toFixed(digits)
});

const today = (): string => new Date().toISOString().split('T')[0];
const addDays = (dateStr: string, days: number): string => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d) + days * 86400000).toISOString().slice(0, 10);
};

describe('POST /api/v1/practices/batch — 拆段批次建立', () => {
  const API = '/api/v1/practices/batch';
  const userId = 1;
  let userToken: string;

  const segment = (startDate: string, durationDays: number, extra: Record<string, unknown> = {}) => ({
    title: `閱讀原子習慣 (${startDate})`,
    practiceAction: '每天閱讀 30 頁',
    startDate,
    durationDays,
    frequencyMinDays: 3,
    frequencyMaxDays: 5,
    ...extra
  });

  const threeSegments = () => {
    const s = today();
    return [segment(s, 30), segment(addDays(s, 30), 30), segment(addDays(s, 60), 30)];
  };

  const mockCreated = (id: number, title: string, themeColor: string) => ({
    id,
    external_id: `550e8400-e29b-41d4-a716-44665544000${id}`,
    user_id: userId,
    title,
    practice_action: '每天閱讀 30 頁',
    start_date: new Date(),
    end_date: new Date(),
    duration_days: 30,
    frequency_min_days: 3,
    frequency_max_days: 5,
    session_duration_minutes: null,
    practice_time_periods: [],
    other_context: null,
    status: 'not_started',
    has_resources: false,
    progress_percentage: createDecimalMock(20),
    first_checkin_at: null,
    privacy_status: 'public',
    theme_color: themeColor,
    created_at: new Date(),
    updated_at: new Date(),
    users: { id: userId, external_id: 'user-uuid', nickname: 'Test User', custom_id: null, contacts: { photo_url: null }, user_positions: [] }
  });

  beforeAll(async () => {
    const { getTestApp } = await import('@tests/utils/test-app');
    app = await getTestApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    setupTransactionMock();
    userToken = createAuthToken({ id: userId, email: 'user@test.com' });
    prismaMock.follows.findMany.mockResolvedValue([] as any);
    // 使用者最後一筆實踐是第 0 色 → 批次應從第 1 色開始連續取
    prismaMock.practices.findFirst.mockResolvedValue({ theme_color: '#FCDD84' } as any);
  });

  const post = (body: object, token?: string) => {
    const req = request(app).post(API).send(body);
    if (token) req.set('Authorization', `Bearer ${token}`);
    return req;
  };

  it('B-1: 3 段皆合法 → 201、回傳順序與送出一致、主題色連續不重複', async () => {
    const segments = threeSegments();
    prismaMock.practices.create
      .mockImplementationOnce((async (args: any) => mockCreated(1, args.data.title, args.data.theme_color)) as any)
      .mockImplementationOnce((async (args: any) => mockCreated(2, args.data.title, args.data.theme_color)) as any)
      .mockImplementationOnce((async (args: any) => mockCreated(3, args.data.title, args.data.theme_color)) as any);

    const res = await post({ segments }, userToken);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.practices).toHaveLength(3);
    expect(res.body.data.practices.map((p: any) => p.title)).toEqual(segments.map(s => s.title));

    // 交易只開一次，create 三次
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(prismaMock.practices.create).toHaveBeenCalledTimes(3);

    const colors = prismaMock.practices.create.mock.calls.map((c: any) => c[0].data.theme_color);
    expect(new Set(colors).size).toBe(3);
    expect(colors[0]).not.toBe('#FCDD84');

    // 副作用只觸發一次（第一段）
    expect(enqueuePracticeEmailMock).toHaveBeenCalledTimes(1);
    expect(enqueuePracticeEmailMock).toHaveBeenCalledWith('PE01', 1, userId);
  });

  it('B-2: 第 2 段 durationDays = 0 → 400、零寫入、錯誤 path 指向 segments.1', async () => {
    const [s1, s2, s3] = threeSegments();
    const res = await post({ segments: [s1, { ...s2, durationDays: 0 }, s3] }, userToken);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(prismaMock.practices.create).not.toHaveBeenCalled();
    const paths: string[] = (res.body.error?.details ?? []).map((d: any) => String(d.path));
    expect(paths.some(p => p.includes('segments') && p.includes('1') && p.includes('durationDays'))).toBe(true);
  });

  it('B-3: 段數 1 與 4 皆 → 400', async () => {
    const s = today();
    const one = await post({ segments: [segment(s, 10)] }, userToken);
    expect(one.status).toBe(400);

    const four = await post({ segments: [0, 10, 20, 30].map(o => segment(addDays(s, o), 10)) }, userToken);
    expect(four.status).toBe(400);
    expect(prismaMock.practices.create).not.toHaveBeenCalled();
  });

  it('B-4: 日期不接續 → 400 並指向該段 startDate', async () => {
    const s = today();
    const res = await post({ segments: [segment(s, 30), segment(addDays(s, 31), 30)] }, userToken);

    expect(res.status).toBe(400);
    const paths: string[] = (res.body.error?.details ?? []).map((d: any) => String(d.path));
    expect(paths.some(p => p.includes('segments') && p.includes('1') && p.includes('startDate'))).toBe(true);
  });

  it('B-5: 交易內第 2 筆 create 失敗 → 500、不觸發副作用', async () => {
    const segments = threeSegments();
    prismaMock.practices.create
      .mockImplementationOnce((async (args: any) => mockCreated(1, args.data.title, args.data.theme_color)) as any)
      .mockRejectedValueOnce(new Error('db down'));

    const res = await post({ segments }, userToken);

    expect(res.status).toBe(500);
    expect(enqueuePracticeEmailMock).not.toHaveBeenCalled();
  });

  it('未登入 → 401', async () => {
    const res = await post({ segments: threeSegments() });
    expect(res.status).toBe(401);
  });
});

describe('POST /api/v1/practices — templateId regression（#141 順帶修正）', () => {
  const userId = 1;
  const TEMPLATE_EXTERNAL_ID = '123e4567-e89b-12d3-a456-426614174000';

  beforeAll(async () => {
    const { getTestApp } = await import('@tests/utils/test-app');
    app = await getTestApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    setupTransactionMock();
    prismaMock.follows.findMany.mockResolvedValue([] as any);
    prismaMock.practices.findFirst.mockResolvedValue(null as any);
  });

  it('R-1: 帶 templateId 建立 → practices.create 收到解析後的 template_id（不再是 null）', async () => {
    prismaMock.practice_templates.findFirst.mockResolvedValue({ id: 42 } as any);
    prismaMock.practices.create.mockImplementation((async (args: any) => ({
      id: 9,
      external_id: '550e8400-e29b-41d4-a716-446655440009',
      user_id: userId,
      title: args.data.title,
      practice_action: null,
      start_date: new Date(),
      end_date: new Date(),
      duration_days: 45,
      frequency_min_days: 3,
      frequency_max_days: 5,
      session_duration_minutes: 90,
      practice_time_periods: [],
      other_context: null,
      status: 'not_started',
      has_resources: false,
      progress_percentage: { toNumber: () => 20, valueOf: () => 20, toString: () => '20', toFixed: () => '20' },
      first_checkin_at: null,
      privacy_status: 'public',
      theme_color: '#FCDD84',
      created_at: new Date(),
      updated_at: new Date(),
      users: { id: userId, external_id: 'user-uuid', nickname: 'Test User', custom_id: null, contacts: { photo_url: null }, user_positions: [] }
    })) as any);

    const res = await request(app)
      .post('/api/v1/practices')
      .set('Authorization', `Bearer ${createAuthToken({ id: userId, email: 'user@test.com' })}`)
      .send({
        title: '從模版建立',
        startDate: today(),
        durationDays: 45,
        sessionDurationMinutes: 90,
        frequencyMinDays: 3,
        frequencyMaxDays: 5,
        templateId: TEMPLATE_EXTERNAL_ID
      });

    expect(res.status).toBe(201);
    expect(prismaMock.practice_templates.findFirst).toHaveBeenCalled();
    const createArgs = prismaMock.practices.create.mock.calls[0][0] as any;
    expect(createArgs.data.template_id).toBe(42);
    expect(createArgs.data.duration_days).toBe(45);
    expect(createArgs.data.session_duration_minutes).toBe(90);
  });
});
