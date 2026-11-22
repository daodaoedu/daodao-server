/** f2e#1194：打卡端點不得信任前端傳入的 practice ID，需在伺服器端驗證所有權與期成員資格。 */
import { prisma } from '../database/prisma.service';
import { createCheckIn } from '../practice-checkin.service';

jest.mock('../database/prisma.service', () => ({ prisma: {
  practices: { findUnique: jest.fn() },
  $transaction: jest.fn()
} }));
jest.mock('../../queues', () => ({ enqueuePracticeEmail: jest.fn() }));
jest.mock('../notification-event.service', () => ({ notificationEventService: {} }));
jest.mock('../challenge-acl.service', () => ({ assertChallengeCheckinAllowed: jest.fn(), isChallengeCohort: jest.fn().mockResolvedValue(false) }));
jest.mock('../cohort-acl.service', () => ({
  assertLighthouseCheckinAllowed: jest.fn(), isLighthouseCohort: jest.fn().mockResolvedValue(false),
  canReadPrivateLighthousePractice: jest.fn(), canReadLighthouseDraftPractice: jest.fn()
}));

const db = jest.mocked(prisma);
/** 通過授權檢查後第一個寫入前的查詢；用它拋出的錯誤斷言「沒有被擋下」。 */
const PASSED_GUARD = new Error('passed authorization guard');
const tx = {
  $queryRaw: jest.fn(),
  practice_checkins: { count: jest.fn() }
};
const practice = (overrides: Record<string, unknown> = {}) => ({
  id: 900, user_id: 42, cohort_id: 8, status: 'active', deleted_at: null,
  start_date: new Date('2026-01-01'), end_date: new Date('2099-01-01'), duration_days: 14, ...overrides
});

beforeEach(() => {
  jest.clearAllMocks();
  db.$transaction.mockImplementation(((callback: (client: typeof tx) => unknown) => callback(tx)) as never);
  tx.practice_checkins.count.mockRejectedValue(PASSED_GUARD);
});

it('只查詢登入者本人的實踐；他人的實踐回 404 且不開啟寫入交易', async () => {
  db.practices.findUnique.mockResolvedValue(null);
  await expect(createCheckIn(900, { note: '今天完成' } as never, 7)).rejects.toMatchObject({ statusCode: 404 });
  expect(db.practices.findUnique).toHaveBeenCalledWith({ where: { id: 900, user_id: 7 } });
  expect(db.$transaction).not.toHaveBeenCalled();
});

it('期內實踐的擁有者已不是 joined 成員時，在寫入交易內回 403 且不寫入', async () => {
  db.practices.findUnique.mockResolvedValue(practice() as never);
  tx.$queryRaw.mockResolvedValue([]);
  await expect(createCheckIn(900, { note: '今天完成' } as never, 42)).rejects.toMatchObject({ statusCode: 403 });
  expect(tx.practice_checkins.count).not.toHaveBeenCalled();
});

it('仍在期內的成員可以對自己的期內實踐打卡', async () => {
  db.practices.findUnique.mockResolvedValue(practice() as never);
  tx.$queryRaw.mockResolvedValue([{ id: 99 }]);
  await expect(createCheckIn(900, { note: '今天完成' } as never, 42)).rejects.toBe(PASSED_GUARD);
});

it('個人實踐（不屬於任何期）不需要期成員資格', async () => {
  db.practices.findUnique.mockResolvedValue(practice({ cohort_id: null }) as never);
  await expect(createCheckIn(900, { note: '今天完成' } as never, 42)).rejects.toBe(PASSED_GUARD);
  expect(tx.$queryRaw).not.toHaveBeenCalled();
});
