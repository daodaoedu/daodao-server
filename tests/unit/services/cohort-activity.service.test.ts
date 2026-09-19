import { prismaMock } from '@tests/utils/prisma-mock';
jest.mock('@/services/database/prisma.service', () => ({ prisma: prismaMock }));
import { cohortActivityService } from '@/services/cohort-activity.service';
import { ForbiddenError, NotFoundError } from '@/middleware/error.middleware';

const now = new Date('2026-09-11T12:00:00.000Z'); // 台北 2026-09-11 20:00
const allow = () => prismaMock.cohorts.findFirst.mockResolvedValue({ id: 2, program: { organization: { timezone: 'Asia/Taipei', organization_members: [{ id: 1 }] } } } as never);
const baseQuery = { hasText: false, limit: 50, offset: 0 };
const rows = [
  { type: 'checkin', id: '10', occurred_at: new Date('2026-09-11T01:00:00.000Z'), user_id: 5, nickname: '小明', avatar: null, practice_id: 7, practice_title: '晨間書寫', summary: '今天寫了三行', has_text: true, detail: '今天寫了三行', meta: { mood: 'good', imageCount: 0, commentCount: 1 } },
  { type: 'checkin', id: '9', occurred_at: new Date('2026-09-10T01:00:00.000Z'), user_id: 5, nickname: '小明', avatar: null, practice_id: 7, practice_title: '晨間書寫', summary: null, has_text: false, detail: null, meta: { mood: 'happy', imageCount: 2, commentCount: 0 } },
  { type: 'comment', id: '3', occurred_at: new Date('2026-09-11T02:00:00.000Z'), user_id: 2, nickname: '帶領人', avatar: null, practice_id: 7, practice_title: '晨間書寫', summary: '寫得真好', has_text: true, detail: '寫得真好', meta: { isReply: true, targetCheckinId: 10, visibility: 'private' } },
  { type: 'rhythm', id: 'return_after_break:7:20260910', occurred_at: new Date('2026-09-10T01:00:00.000Z'), user_id: 5, nickname: '小明', avatar: null, practice_id: 7, practice_title: '晨間書寫', summary: null, has_text: false, detail: null, meta: { eventType: 'return_after_break', basisMetrics: { quiet_days: 4 } } }
];

describe('cohortActivityService', () => {
  it('clamps the range to the last 7 days in the organization timezone and swaps reversed dates', () => {
    expect(cohortActivityService.resolveRange({}, 'Asia/Taipei', now)).toEqual({ from: '2026-09-05', to: '2026-09-11', min: '2026-09-05', max: '2026-09-11' });
    expect(cohortActivityService.resolveRange({ from: '2026-08-01', to: '2026-12-31' }, 'Asia/Taipei', now)).toEqual(expect.objectContaining({ from: '2026-09-05', to: '2026-09-11' }));
    expect(cohortActivityService.resolveRange({ from: '2026-09-10', to: '2026-09-07' }, 'Asia/Taipei', now)).toEqual(expect.objectContaining({ from: '2026-09-07', to: '2026-09-10' }));
    // UTC 2026-09-11 17:00 已是台北 9/12
    expect(cohortActivityService.resolveRange({}, 'Asia/Taipei', new Date('2026-09-11T17:00:00.000Z')).max).toBe('2026-09-12');
  });

  it('404s on an unknown cohort and 403s on a non-member', async () => {
    prismaMock.cohorts.findFirst.mockResolvedValue(null);
    await expect(cohortActivityService.list(1, 99, 42, baseQuery, now)).rejects.toBeInstanceOf(NotFoundError);
    prismaMock.cohorts.findFirst.mockResolvedValue({ id: 2, program: { organization: { timezone: 'Asia/Taipei', organization_members: [] } } } as never);
    await expect(cohortActivityService.list(1, 2, 42, baseQuery, now)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('builds stats from the same rows as the list and renders type / mood / rhythm copy', async () => {
    allow();
    prismaMock.$queryRaw.mockResolvedValueOnce(rows as never).mockResolvedValueOnce([{ title: '晨間書寫' }] as never);
    const result = await cohortActivityService.list(1, 2, 42, baseQuery, now);
    expect(result.stats).toEqual({ checkins: 2, comments: 1, rhythm: 1, total: 4 });
    expect(result.total).toBe(4);
    expect(result.practices).toEqual([{ title: '晨間書寫' }]);
    const byId = Object.fromEntries(result.items.map(item => [item.id, item]));
    expect(byId['9']).toEqual(expect.objectContaining({ typeLabel: '打卡', summary: '（未寫筆記，心情：很開心，2 張圖片）', hasText: false }));
    expect(byId['3']).toEqual(expect.objectContaining({ typeLabel: '回應', summary: '寫得真好' }));
    expect(byId['return_after_break:7:20260910']).toEqual(expect.objectContaining({ typeLabel: '節奏變化', summary: '暫停 4 天後又回來了' }));
  });

  it('applies the keyword to member / practice / summary / meta / type but not to detail, and keeps stats in sync', async () => {
    allow();
    prismaMock.$queryRaw.mockResolvedValue(rows as never);
    const byMood = await cohortActivityService.list(1, 2, 42, { ...baseQuery, q: '很開心' }, now);
    expect(byMood.items.map(item => item.id)).toEqual(['9']);
    expect(byMood.stats).toEqual({ checkins: 1, comments: 0, rhythm: 0, total: 1 });
    const byType = await cohortActivityService.list(1, 2, 42, { ...baseQuery, q: '回應' }, now);
    expect(byType.items.map(item => item.id)).toEqual(['3']);
    const byMember = await cohortActivityService.list(1, 2, 42, { ...baseQuery, q: '小明' }, now);
    expect(byMember.total).toBe(3);
    const none = await cohortActivityService.list(1, 2, 42, { ...baseQuery, q: '不存在的字' }, now);
    expect(none.items).toEqual([]);
    expect(none.stats.total).toBe(0);
  });

  it('paginates the filtered list', async () => {
    allow();
    prismaMock.$queryRaw.mockResolvedValue(rows as never);
    const page = await cohortActivityService.list(1, 2, 42, { ...baseQuery, limit: 2, offset: 2 }, now);
    expect(page.total).toBe(4);
    expect(page.items).toHaveLength(2);
  });
});
