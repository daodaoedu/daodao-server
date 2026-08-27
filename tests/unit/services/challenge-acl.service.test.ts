import { prismaMock } from '@tests/utils/prisma-mock';

jest.mock('@/services/database/prisma.service', () => ({ prisma: prismaMock }));

import {
  assertChallengeCheckinAllowed,
  assertChallengeCommentAllowed,
  assertChallengePracticeCopyable,
  assertChallengePracticeUpdatable,
  isChallengeCohort
} from '@/services/challenge-acl.service';

const challengePractice = { cohort_id: 6, cohorts: { program: { kind: 'challenge' } } };
const lighthousePractice = { cohort_id: 3, cohorts: { program: { kind: 'lighthouse' } } };

describe('isChallengeCohort', () => {
  it('cohort_id 為 null 直接回 false（不查 DB）', async () => {
    await expect(isChallengeCohort(null)).resolves.toBe(false);
    expect(prismaMock.cohorts.findUnique).not.toHaveBeenCalled();
  });

  it('challenge kind 回 true、lighthouse 回 false', async () => {
    prismaMock.cohorts.findUnique.mockResolvedValueOnce({ program: { kind: 'challenge' } } as never);
    await expect(isChallengeCohort(6)).resolves.toBe(true);
    prismaMock.cohorts.findUnique.mockResolvedValueOnce({ program: { kind: 'lighthouse' } } as never);
    await expect(isChallengeCohort(3)).resolves.toBe(false);
  });
});

describe('assertChallengeCommentAllowed', () => {
  it('非挑戰實踐放行', async () => {
    prismaMock.practices.findUnique.mockResolvedValue(lighthousePractice as never);
    await expect(assertChallengeCommentAllowed('practice', 1, 99)).resolves.toBeUndefined();
  });

  it('挑戰實踐：參與者放行', async () => {
    prismaMock.practices.findUnique.mockResolvedValue(challengePractice as never);
    prismaMock.cohort_enrollments.findFirst.mockResolvedValue({ id: 26 } as never);
    await expect(assertChallengeCommentAllowed('practice', 1, 325)).resolves.toBeUndefined();
  });

  it('挑戰實踐：非參與者 403', async () => {
    prismaMock.practices.findUnique.mockResolvedValue(challengePractice as never);
    prismaMock.cohort_enrollments.findFirst.mockResolvedValue(null);
    await expect(assertChallengeCommentAllowed('practice', 1, 99)).rejects.toThrow('僅挑戰參與者可留言');
  });

  it('挑戰打卡（checkin target）：非參與者 403', async () => {
    prismaMock.practice_checkins.findUnique.mockResolvedValue({ practices: challengePractice } as never);
    prismaMock.cohort_enrollments.findFirst.mockResolvedValue(null);
    await expect(assertChallengeCommentAllowed('checkin', 11, 99)).rejects.toThrow('僅挑戰參與者可留言');
  });

  it('不支援的 targetType 放行', async () => {
    await expect(assertChallengeCommentAllowed('resource', 1, 99)).resolves.toBeUndefined();
  });
});

describe('assertChallengePracticeUpdatable', () => {
  it('挑戰實踐修改 title 被拒', () => {
    expect(() => assertChallengePracticeUpdatable(true, { title: '改名' })).toThrow('不可修改');
  });

  it('挑戰實踐修改 startDate / durationDays / privacyStatus 被拒', () => {
    expect(() => assertChallengePracticeUpdatable(true, { startDate: '2026-09-05' })).toThrow('不可修改');
    expect(() => assertChallengePracticeUpdatable(true, { durationDays: 7 })).toThrow('不可修改');
    expect(() => assertChallengePracticeUpdatable(true, { privacyStatus: 'private' })).toThrow('不可修改');
  });

  it('挑戰實踐修改其他欄位（practiceAction）放行', () => {
    expect(() => assertChallengePracticeUpdatable(true, { practiceAction: '每天寫 20 分鐘' })).not.toThrow();
  });

  it('非挑戰實踐改 title 放行', () => {
    expect(() => assertChallengePracticeUpdatable(false, { title: '改名' })).not.toThrow();
  });
});

describe('assertChallengePracticeCopyable', () => {
  it('挑戰實踐複製被拒、一般實踐放行', () => {
    expect(() => assertChallengePracticeCopyable(true)).toThrow('不可複製');
    expect(() => assertChallengePracticeCopyable(false)).not.toThrow();
  });
});

describe('assertChallengeCheckinAllowed', () => {
  const start = new Date('2026-09-01T00:00:00.000Z');

  it('挑戰開始日前打卡被拒', () => {
    expect(() => assertChallengeCheckinAllowed(true, start, new Date('2026-08-27T00:00:00.000Z'))).toThrow('尚未開始');
  });

  it('挑戰開始日當天放行', () => {
    expect(() => assertChallengeCheckinAllowed(true, start, new Date('2026-09-01T00:00:00.000Z'))).not.toThrow();
  });

  it('一般實踐提早打卡放行（沿用日期位移）', () => {
    expect(() => assertChallengeCheckinAllowed(false, start, new Date('2026-08-27T00:00:00.000Z'))).not.toThrow();
  });
});
