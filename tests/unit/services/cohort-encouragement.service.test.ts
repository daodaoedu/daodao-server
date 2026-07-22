import { prismaMock } from '@tests/utils/prisma-mock';

jest.mock('@/services/database/prisma.service', () => ({ prisma: prismaMock }));

const getRandomEncouragement = jest.fn();
const createComment = jest.fn();

jest.mock('@/services/encouragement.service', () => ({
  getRandomEncouragement: (...args: unknown[]): unknown => getRandomEncouragement(...args)
}));
jest.mock('@/services/comment.service', () => ({
  commentService: { createComment: (...args: unknown[]): unknown => createComment(...args) }
}));

import { cohortEncouragementService } from '@/services/cohort-encouragement.service';

describe('cohortEncouragementService', () => {
  beforeEach(() => {
    prismaMock.practice_checkins.findFirst.mockResolvedValue({ id: 11 } as never);
  });

  it('returns an editable draft from checkin_encouragements without creating a comment', async () => {
    getRandomEncouragement.mockResolvedValue({
      success: true,
      data: { id: 3, message: '你今天跨出的這一步很珍貴！' },
      timestamp: '2026-07-22T00:00:00.000Z'
    });

    await expect(cohortEncouragementService.draft(2, 8, 11, 42)).resolves.toEqual({
      checkinId: 11,
      draft: '你今天跨出的這一步很珍貴！'
    });
    expect(getRandomEncouragement).toHaveBeenCalledTimes(1);
    expect(createComment).not.toHaveBeenCalled();
    expect(prismaMock.practice_checkins.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        id: 11,
        practices: expect.objectContaining({
          cohort_id: 8,
          cohorts: expect.objectContaining({ id: 8, program_id: 2 })
        })
      })
    }));
  });

  it('creates the confirmed edited text as a private checkin comment owned by the coach', async () => {
    createComment.mockResolvedValue({
      success: true,
      data: { id: 91, userId: 42, content: '教練編輯後的鼓勵', targetType: 'checkin' },
      timestamp: '2026-07-22T00:00:00.000Z'
    });

    await expect(cohortEncouragementService.submit(2, 8, 11, 42, '教練編輯後的鼓勵')).resolves.toEqual({
      commentId: 91,
      checkinId: 11,
      content: '教練編輯後的鼓勵',
      userId: 42
    });
    expect(createComment).toHaveBeenCalledWith({
      targetType: 'checkin',
      targetId: '11',
      content: '教練編輯後的鼓勵',
      visibility: 'private',
      userId: 42
    });
  });

  it('rejects a swapped program/cohort/checkin chain before draft generation or submission', async () => {
    prismaMock.practice_checkins.findFirst.mockResolvedValue(null);

    await expect(cohortEncouragementService.draft(999, 8, 11, 42)).rejects.toMatchObject({ statusCode: 403 });
    expect(getRandomEncouragement).not.toHaveBeenCalled();
    expect(createComment).not.toHaveBeenCalled();
  });
});
