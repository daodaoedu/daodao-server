/**
 * 教練資源鎖定：資源端點不可繞過（daodao#331）
 *
 * #278 修正前學員存檔過的燈塔本期實踐，教練資源列已被重建成學員所有（created_by = 學員）。
 * 學員若能先 PATCH /resources/:id 改名，內容就對不上模板、鎖定判定失效，再 PUT 實踐即可移除。
 * - 鎖定中的教練資源：學員 PATCH／DELETE /resources/:id → 403，資料不變
 * - 學員自己加的資源、已退出本期的實踐、共同挑戰：照舊可改可刪
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

jest.mock('@/queues', () => ({
  enqueuePracticeEmail: jest.fn().mockResolvedValue({ id: 'job-id' })
}));

const COACH_RESOURCE_EXTERNAL_ID = '11111111-1111-4111-8111-111111111111';
const MY_RESOURCE_EXTERNAL_ID = '22222222-2222-4222-8222-222222222222';
const coachResourceId = 996;
const myResourceId = 200;

jest.mock('@/services/id-converter.service', () => ({
  externalToInternalId: jest.fn(async (_type: string, externalId: string) =>
    externalId === '11111111-1111-4111-8111-111111111111' ? 996 : 200
  ),
  internalToExternalId: jest.fn().mockResolvedValue('550e8400-e29b-41d4-a716-446655440002')
}));

let app: any;

describe('教練資源鎖定：PATCH／DELETE /resources/:id 不可繞過（daodao#331）', () => {
  const userId = 1;
  const templateId = 3;
  let userToken: string;

  const resourceRow = (id: number, externalId: string, name: string, url: string) => ({
    id,
    external_id: externalId,
    name,
    url,
    image_url: null,
    description: null,
    video_url: null,
    type: 'other',
    cost: 'free',
    level: 'all_levels',
    status: 'active',
    major_category_id: null,
    sub_category_id: null,
    created_by: userId,
    created_at: new Date('2026-10-01T00:00:00.000Z'),
    updated_at: new Date('2026-10-01T00:00:00.000Z'),
    deleted_at: null,
    users: { id: userId, nickname: 'Learner', contacts: { photo_url: null } },
    categories_resources_major_category_idTocategories: null,
    categories_resources_sub_category_idTocategories: null
  });

  // 修正前存檔過：教練資源列已重建（id 996 ≠ 模板的 854），created_by = 學員
  const coachRow = resourceRow(coachResourceId, COACH_RESOURCE_EXTERNAL_ID, '暖身影片', 'https://example.com/warmup');
  const myRow = resourceRow(myResourceId, MY_RESOURCE_EXTERNAL_ID, '我的筆記', 'https://example.com/my-notes');

  const practiceRelations = [
    { id: 500, resource_id: coachResourceId, entity_type: 'practice', entity_id: 1, note: 'day:2', deleted_at: null, resources: { name: '暖身影片', url: 'https://example.com/warmup' } },
    { id: 501, resource_id: myResourceId, entity_type: 'practice', entity_id: 1, note: null, deleted_at: null, resources: { name: '我的筆記', url: 'https://example.com/my-notes' } }
  ];

  const lighthouseDraft = { id: 1, user_id: userId, cohort_id: 7, template_id: templateId, creation_source: 'cohort_template' };

  const mockPractice = (overrides: Partial<typeof lighthouseDraft> = {}) => {
    const practices = [{ ...lighthouseDraft, ...overrides }];
    prismaMock.practices.findMany.mockImplementation((async (args: any) =>
      practices.filter(practice => args?.where?.user_id === undefined || practice.user_id === args.where.user_id)
    ) as any);
  };

  beforeAll(async () => {
    const { getTestApp } = await import('@tests/utils/test-app');
    app = await getTestApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    setupTransactionMock();
    userToken = createAuthToken({ id: userId, email: 'user@test.com' });

    prismaMock.resources.findFirst.mockImplementation((async (args: any) => {
      const where = args?.where ?? {};
      if (where.id === coachResourceId || where.external_id === COACH_RESOURCE_EXTERNAL_ID) return coachRow;
      if (where.id === myResourceId || where.external_id === MY_RESOURCE_EXTERNAL_ID) return myRow;
      return null;
    }) as any);
    prismaMock.resources.update.mockResolvedValue({} as any);
    prismaMock.$queryRaw.mockResolvedValue([] as any);
    prismaMock.entity_tags.findMany.mockResolvedValue([] as any);
    prismaMock.cohorts.findMany.mockResolvedValue([{ id: 7 }] as any);
    prismaMock.entity_resources.findMany.mockImplementation((async (args: any) => {
      const where = args?.where ?? {};
      if (where.entity_type === 'practice_template') {
        return [{ entity_id: templateId, resource_id: 854, resources: { name: '暖身影片', url: 'https://example.com/warmup' } }];
      }
      if (where.resource_id !== undefined) {
        return practiceRelations.filter(relation => relation.resource_id === where.resource_id);
      }
      return practiceRelations;
    }) as any);
    mockPractice();
  });

  const patch = (externalId: string, body: Record<string, unknown>) =>
    request(app).patch(`/api/v1/resources/${externalId}`).set('Authorization', `Bearer ${userToken}`).send(body);
  const del = (externalId: string) =>
    request(app).delete(`/api/v1/resources/${externalId}`).set('Authorization', `Bearer ${userToken}`);

  it('PATCH 改名舊資料的教練資源（created_by = 學員）→ 403，資源不變', async () => {
    const response = await patch(COACH_RESOURCE_EXTERNAL_ID, { name: '改掉的名字' });

    expect(response.status).toBe(403);
    expect(JSON.stringify(response.body)).toContain('暖身影片');
    expect(prismaMock.resources.update).not.toHaveBeenCalled();
  });

  it('PATCH 改網址 → 403', async () => {
    const response = await patch(COACH_RESOURCE_EXTERNAL_ID, { url: 'https://evil.example.com' });

    expect(response.status).toBe(403);
    expect(prismaMock.resources.update).not.toHaveBeenCalled();
  });

  it('DELETE 教練資源 → 403，資源不被軟刪', async () => {
    const response = await del(COACH_RESOURCE_EXTERNAL_ID);

    expect(response.status).toBe(403);
    expect(prismaMock.resources.update).not.toHaveBeenCalled();
  });

  it('學員自己加的資源 → PATCH 200、DELETE 200', async () => {
    const patched = await patch(MY_RESOURCE_EXTERNAL_ID, { name: '我的新筆記' });
    expect(patched.status).toBe(200);
    expect(prismaMock.resources.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: myResourceId },
      data: expect.objectContaining({ name: '我的新筆記' })
    }));

    const deleted = await del(MY_RESOURCE_EXTERNAL_ID);
    expect(deleted.status).toBe(200);
  });

  it('已退出本期（cohort_id 清空）→ 原教練資源可 PATCH', async () => {
    mockPractice({ cohort_id: null as unknown as number });

    const response = await patch(COACH_RESOURCE_EXTERNAL_ID, { name: '改掉的名字' });

    expect(response.status).toBe(200);
  });

  it('共同挑戰（非燈塔）→ 模板帶入的資源可 PATCH', async () => {
    prismaMock.cohorts.findMany.mockResolvedValue([] as any);

    const response = await patch(COACH_RESOURCE_EXTERNAL_ID, { name: '改掉的名字' });

    expect(response.status).toBe(200);
  });

  it('教練改自己建立、掛在學員草稿上的模板資源列 → 200（只鎖學員）', async () => {
    const coachId = 9;
    prismaMock.resources.findFirst.mockResolvedValue({ ...coachRow, created_by: coachId } as any);
    userToken = createAuthToken({ id: coachId, email: 'coach@test.com' });

    const response = await patch(COACH_RESOURCE_EXTERNAL_ID, { name: '教練更新的名稱' });

    expect(response.status).toBe(200);
    expect(prismaMock.resources.update).toHaveBeenCalled();
  });

  it('user 2 改學員的鎖定資源 → 403', async () => {
    userToken = createAuthToken({ id: 2, email: 'tester@test.com' });

    const response = await patch(COACH_RESOURCE_EXTERNAL_ID, { name: '改掉的名字' });

    expect(response.status).toBe(403);
    expect(prismaMock.resources.update).not.toHaveBeenCalled();
  });

  describe('PATCH 的擁有者檢查不再有 user 2 例外（daodao#355）', () => {
    it('user 2 改別人一般的資源（不在任何實踐上）→ 403，訊息不含任何 user id', async () => {
      prismaMock.entity_resources.findMany.mockResolvedValue([] as any);
      userToken = createAuthToken({ id: 2, email: 'tester@test.com' });

      const response = await patch(MY_RESOURCE_EXTERNAL_ID, { name: '改掉的名字' });

      expect(response.status).toBe(403);
      expect(response.body.error?.message ?? response.body.message).toBe('無權限修改此資源');
      expect(JSON.stringify(response.body)).not.toMatch(/資源所有者|當前用戶/);
      expect(prismaMock.resources.update).not.toHaveBeenCalled();
    });

    it('user 2 改自己建立的資源 → 200', async () => {
      prismaMock.entity_resources.findMany.mockResolvedValue([] as any);
      prismaMock.resources.findFirst.mockResolvedValue({ ...myRow, created_by: 2 } as any);
      userToken = createAuthToken({ id: 2, email: 'tester@test.com' });

      const response = await patch(MY_RESOURCE_EXTERNAL_ID, { name: '改掉的名字' });

      expect(response.status).toBe(200);
      expect(prismaMock.resources.update).toHaveBeenCalled();
    });
  });
});
