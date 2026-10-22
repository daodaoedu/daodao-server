/**
 * 教練資源鎖定 API 測試（daodao#278）
 *
 * 燈塔本期草稿由模板產生，模板掛的資源是教練加的：
 * - PUT 省略或改動教練資源 → 403，資料不變
 * - 原樣送回教練資源 → 保留原關聯，只替換學員自己的資源
 * - GET 回應 resources[].isLocked 標出教練資源
 * - 已退出本期（cohort_id 清空）不再鎖定
 */

import { prismaMock, setupTransactionMock } from '@tests/utils/prisma-mock';
import { createAuthToken } from '@tests/utils/api-helpers';
import request from 'supertest';

jest.mock('@/services/database/prisma.service', () => ({
  prisma: prismaMock
}));

jest.mock('@/services/logging/logger.service', () => ({
  loggerService: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

jest.mock('@/queues/practice-email.queue', () => ({
  practiceEmailQueue: {
    add: jest.fn().mockResolvedValue({ id: 'job-id' })
  },
  enqueuePracticeEmail: jest.fn().mockResolvedValue({ id: 'job-id' })
}));

jest.mock('@/queues', () => ({
  enqueuePracticeEmail: jest.fn().mockResolvedValue({ id: 'job-id' })
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

describe('教練資源鎖定（daodao#278）', () => {
  const PRACTICE_URL = '/api/v1/practices/550e8400-e29b-41d4-a716-446655440002';
  const userId = 1;
  const templateId = 3;
  const coachResourceId = 100;
  const myResourceId = 200;

  let userToken: string;

  const cohortDraft = {
    id: 1,
    external_id: '550e8400-e29b-41d4-a716-446655440002',
    user_id: userId,
    cohort_id: 7,
    template_id: templateId,
    creation_source: 'cohort_template',
    title: '每日寫作',
    practice_action: '每天寫 300 字',
    start_date: new Date('2026-10-20'),
    end_date: new Date('2026-11-02'),
    duration_days: 14,
    frequency_min_days: 4,
    frequency_max_days: 7,
    session_duration_minutes: 30,
    practice_time_periods: ['morning'],
    other_context: null,
    status: 'draft',
    privacy_status: 'public',
    has_resources: true,
    progress_percentage: createDecimalMock(0),
    first_checkin_at: null,
    created_at: new Date('2026-10-12T00:00:00.000Z'),
    updated_at: new Date('2026-10-12T00:00:00.000Z'),
    deleted_at: null,
    users: {
      id: userId,
      external_id: 'user-uuid-1',
      nickname: 'Learner',
      contacts: { photo_url: null },
      user_positions: []
    }
  };

  const practiceRelations = [
    {
      id: 500, resource_id: coachResourceId, entity_type: 'practice', entity_id: 1, note: 'day:2', deleted_at: null,
      resources: { id: coachResourceId, external_id: '11111111-1111-4111-8111-111111111111', name: '暖身影片', url: 'https://example.com/warmup' }
    },
    {
      id: 501, resource_id: myResourceId, entity_type: 'practice', entity_id: 1, note: null, deleted_at: null,
      resources: { id: myResourceId, external_id: '22222222-2222-4222-8222-222222222222', name: '我的筆記', url: '' }
    }
  ];

  const mockPractice = (overrides: Partial<typeof cohortDraft> = {}) => {
    const practice = { ...cohortDraft, ...overrides };
    prismaMock.practices.findUnique.mockResolvedValue(practice as any);
    prismaMock.practices.update.mockResolvedValue(practice as any);
    prismaMock.practices.findMany.mockResolvedValue([
      { id: practice.id, cohort_id: practice.cohort_id, template_id: practice.template_id, creation_source: practice.creation_source }
    ] as any);
  };

  beforeAll(async () => {
    const { getTestApp } = await import('@tests/utils/test-app');
    app = await getTestApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    setupTransactionMock();
    userToken = createAuthToken({ id: userId, email: 'user@test.com' });

    prismaMock.follows.findMany.mockResolvedValue([] as any);
    prismaMock.practice_checkins.count.mockResolvedValue(0);
    prismaMock.practice_checkins.groupBy.mockResolvedValue([] as any);
    prismaMock.comments.groupBy.mockResolvedValue([] as any);
    prismaMock.entity_tags.findMany.mockResolvedValue([] as any);
    prismaMock.cohorts.findUnique.mockResolvedValue({ program: { kind: 'lighthouse' } } as any);
    prismaMock.cohorts.findMany.mockResolvedValue([{ id: 7 }] as any);
    prismaMock.entity_resources.findMany.mockImplementation((async (args: any) => {
      if (args?.where?.entity_type === 'practice_template') {
        return [{ entity_id: templateId, resource_id: coachResourceId, resources: { name: '暖身影片', url: 'https://example.com/warmup' } }];
      }
      return practiceRelations;
    }) as any);
    prismaMock.entity_resources.updateMany.mockResolvedValue({ count: 1 } as any);
    prismaMock.resources.create.mockImplementation((async (args: any) => ({
      id: 300, external_id: '33333333-3333-4333-8333-333333333333', name: args.data.name, url: args.data.url
    })) as any);
    prismaMock.entity_resources.create.mockResolvedValue({} as any);
  });

  const put = (body: Record<string, unknown>) =>
    request(app).put(PRACTICE_URL).set('Authorization', `Bearer ${userToken}`).send(body);

  it('省略教練資源（移除）→ 403，不動任何資源', async () => {
    mockPractice();

    const response = await put({ resources: [{ name: '我的筆記' }] });

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(JSON.stringify(response.body)).toContain('暖身影片');
    expect(prismaMock.entity_resources.updateMany).not.toHaveBeenCalled();
    expect(prismaMock.resources.create).not.toHaveBeenCalled();
    expect(prismaMock.practices.update).not.toHaveBeenCalled();
  });

  it('改了教練資源的網址 → 403', async () => {
    mockPractice();

    const response = await put({ resources: [{ name: '暖身影片', url: 'https://evil.example.com' }, { name: '我的筆記' }] });

    expect(response.status).toBe(403);
    expect(prismaMock.entity_resources.updateMany).not.toHaveBeenCalled();
  });

  it('原樣保留教練資源、換掉自己的 → 200，教練資源關聯不被軟刪也不重建', async () => {
    mockPractice();

    const response = await put({ resources: [{ name: '暖身影片', url: 'https://example.com/warmup' }, { name: '新的參考書' }] });

    expect(response.status).toBe(200);
    expect(prismaMock.entity_resources.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ entity_type: 'practice', entity_id: 1, id: { notIn: [500] } })
    }));
    expect(prismaMock.resources.create).toHaveBeenCalledTimes(1);
    expect(prismaMock.resources.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ name: '新的參考書' })
    }));
  });

  it('教練資源的 resources 列已被重建（id 不同、內容相同）→ 仍視為教練資源而擋下', async () => {
    mockPractice();
    prismaMock.entity_resources.findMany.mockImplementation((async (args: any) => {
      if (args?.where?.entity_type === 'practice_template') {
        return [{ entity_id: templateId, resource_id: 999, resources: { name: '暖身影片', url: 'https://example.com/warmup' } }];
      }
      return practiceRelations;
    }) as any);

    const response = await put({ resources: [{ name: '我的筆記' }] });

    expect(response.status).toBe(403);
  });

  it('共同挑戰的模板實踐（非燈塔）→ 資源照舊可調整，不鎖定', async () => {
    mockPractice();
    prismaMock.cohorts.findUnique.mockResolvedValue({ program: { kind: 'challenge' } } as any);
    prismaMock.cohorts.findMany.mockResolvedValue([] as any);

    const response = await put({ resources: [{ name: '我的筆記' }] });

    expect(response.status).toBe(200);
    expect(prismaMock.entity_resources.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { entity_type: 'practice', entity_id: 1, deleted_at: null }
    }));
  });

  it('已退出本期（轉個人實踐）→ 可移除原教練資源', async () => {
    mockPractice({ cohort_id: null as unknown as number });

    const response = await put({ resources: [{ name: '我的筆記' }] });

    expect(response.status).toBe(200);
    expect(prismaMock.entity_resources.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { entity_type: 'practice', entity_id: 1, deleted_at: null }
    }));
  });

  it('燈塔本期實踐：編輯頁不帶 privacyStatus 的 PUT → 200；帶了 → 400（#277 回報的存檔一律 400）', async () => {
    mockPractice();
    prismaMock.practices.findUnique.mockResolvedValue({
      ...cohortDraft,
      cohorts: { end_date: new Date('2099-12-31'), program: { kind: 'lighthouse' } }
    } as any);
    const editPagePayload = {
      title: '每日寫作', practiceAction: '每天寫 300 字', sessionDurationMinutes: 30, practiceTimePeriods: ['morning'], tags: [],
      resources: [{ name: '暖身影片', url: 'https://example.com/warmup' }, { name: '我的筆記' }]
    };

    expect((await put(editPagePayload)).status).toBe(200);
    expect((await put({ ...editPagePayload, privacyStatus: 'private' })).status).toBe(400);
  });

  it('GET 詳情：燈塔本期實踐回 isCohortPrivacyLocked=true，編輯頁據此不送隱私', async () => {
    mockPractice();

    const response = await request(app).get(PRACTICE_URL).set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.isCohortPrivacyLocked).toBe(true);
  });

  it('GET 詳情：已退出本期 → isCohortPrivacyLocked=false', async () => {
    mockPractice({ cohort_id: null as unknown as number });

    const response = await request(app).get(PRACTICE_URL).set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.isCohortPrivacyLocked).toBe(false);
  });

  it('GET 詳情：教練資源 isLocked=true，自己的 isLocked=false', async () => {
    mockPractice();

    const response = await request(app).get(PRACTICE_URL).set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    const resources = response.body.data.resources as Array<{ name: string; isLocked: boolean }>;
    expect(resources).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: '暖身影片', isLocked: true, dayNumber: 2 }),
      expect.objectContaining({ name: '我的筆記', isLocked: false })
    ]));
  });

  describe('模板在不同天放同名同網址的資源、實踐資源列已重建（daodao#355）', () => {
    const sheet = { name: '練習單', url: 'https://example.com/sheet' };
    const sheetRelation = (id: number, resourceId: number, note: string | null) => ({
      id, resource_id: resourceId, entity_type: 'practice', entity_id: 1, note, deleted_at: null,
      resources: { id: resourceId, external_id: `4444444${id}-4444-4444-8444-444444444444`, ...sheet }
    });
    // 模板關聯 id 600／601；學員實踐上的列已重建成 900／901，另有學員自己存的一份 777（沒帶天數）
    const relations = [sheetRelation(510, 900, 'day:2'), sheetRelation(511, 901, 'day:3'), sheetRelation(512, 777, null)];

    beforeEach(() => {
      prismaMock.entity_resources.findMany.mockImplementation((async (args: any) => {
        if (args?.where?.entity_type === 'practice_template') {
          return [
            { entity_id: templateId, resource_id: 600, note: 'day:2', deleted_at: null, resources: sheet },
            { entity_id: templateId, resource_id: 601, note: 'day:3', deleted_at: null, resources: sheet }
          ];
        }
        return relations;
      }) as any);
    });

    it('GET 詳情：兩天的教練資源都 isLocked=true，學員自己那份 false', async () => {
      mockPractice();

      const response = await request(app).get(PRACTICE_URL).set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      const resources = response.body.data.resources as Array<{ dayNumber: number | null; isLocked: boolean }>;
      expect(resources.map(resource => [resource.dayNumber, resource.isLocked])).toEqual([[2, true], [3, true], [null, false]]);
    });

    // 學員自己那份明確帶 dayNumber: null（不帶天數的送出會被視為沿用原天數，見 partitionIncomingResources）
    it.each([
      ['拿掉第 2 天那筆', [{ ...sheet, dayNumber: 3 }, { ...sheet, dayNumber: null }]],
      ['拿掉第 3 天那筆', [{ ...sheet, dayNumber: 2 }, { ...sheet, dayNumber: null }]]
    ])('PUT %s → 403，不動任何資源', async (_label, resources) => {
      mockPractice();

      const response = await put({ resources });

      expect(response.status).toBe(403);
      expect(prismaMock.entity_resources.updateMany).not.toHaveBeenCalled();
    });

    it('PUT 兩天原樣保留、拿掉學員自己那份 → 200（#278 既有行為：學員的同名資源可移除）', async () => {
      mockPractice();

      const response = await put({ resources: [{ ...sheet, dayNumber: 2 }, { ...sheet, dayNumber: 3 }] });

      expect(response.status).toBe(200);
      expect(prismaMock.entity_resources.updateMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ entity_type: 'practice', entity_id: 1, id: { notIn: [510, 511] } })
      }));
    });
  });
});
