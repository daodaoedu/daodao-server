import { prismaMock } from '@tests/utils/prisma-mock';

jest.mock('@/services/database/prisma.service', () => ({ prisma: prismaMock }));

import { cohortFeedService } from '@/services/cohort-feed.service';

describe('cohortFeedService', () => {
  const checkin = {
    id: 11,
    practice_id: 21,
    user_id: 31,
    checkin_date: new Date('2026-07-21T00:00:00.000Z'),
    mood: 'good',
    note: '今天有往前一步',
    image_urls: ['https://example.com/checkin.png'],
    created_at: new Date('2026-07-21T08:00:00.000Z'),
    practices: { external_id: 'practice-21', title: '每日行動' },
    users: {
      external_id: 'user-31',
      custom_id: null,
      nickname: '小島',
      contacts: { photo_url: 'https://example.com/avatar.png' }
    }
  };

  it('returns a cohort-scoped coach feed without selecting or serializing email', async () => {
    prismaMock.cohorts.findFirst.mockResolvedValue({
      program: { organization: { status: 'active', organization_members: [{ id: 9 }] } }
    } as never);
    prismaMock.practice_checkins.findMany.mockResolvedValue([checkin] as never);
    prismaMock.practice_checkins.count.mockResolvedValue(1);
    prismaMock.$queryRaw.mockResolvedValue([{ count: 1n }] as never);
    prismaMock.comments.groupBy.mockResolvedValue([]);
    prismaMock.comments.findMany.mockResolvedValue([]);

    const result = await cohortFeedService.get(8, 42, 20, 0, 2);

    expect(result).toEqual({
      perspective: 'coach',
      total: 1,
      pendingResponseCount: 1,
      items: [{
        id: '11',
        practice: { id: 'practice-21', title: '每日行動' },
        user: { id: 'user-31', name: '小島', photoUrl: 'https://example.com/avatar.png', customId: null },
        checkinDate: '2026-07-21',
        mood: 'good',
        note: '今天有往前一步',
        imageUrls: ['https://example.com/checkin.png'],
        createdAt: '2026-07-21T08:00:00.000Z',
        tags: [],
        commentCount: 0,
        commentPreview: []
      }]
    });
    expect(prismaMock.practice_checkins.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { practices: { cohort_id: 8, deleted_at: null }, created_at: { not: null } },
      take: 20,
      skip: 0,
      select: expect.objectContaining({
        users: { select: { external_id: true, nickname: true, custom_id: true, contacts: { select: { photo_url: true } } } }
      })
    }));
    expect(JSON.stringify(prismaMock.practice_checkins.findMany.mock.calls[0])).not.toContain('email');
    expect(JSON.stringify(result)).not.toContain('email');
    expect(prismaMock.cohorts.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: 8, program_id: 2 })
    }));
  });

  it('allows a joined learner and marks the learner perspective', async () => {
    prismaMock.cohorts.findFirst.mockResolvedValue({
      program: { organization: { status: 'active', organization_members: [] } }
    } as never);
    prismaMock.practice_checkins.findMany.mockResolvedValue([]);
    prismaMock.practice_checkins.count.mockResolvedValue(0);
    prismaMock.$queryRaw.mockResolvedValue([{ count: 0n }] as never);

    await expect(cohortFeedService.get(8, 42, 30, 0)).resolves.toEqual({
      perspective: 'learner',
      total: 0,
      pendingResponseCount: 0,
      items: []
    });
    expect(prismaMock.cohorts.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        id: 8,
        OR: expect.arrayContaining([
          { cohort_enrollments: { some: { user_id: 42, status: 'joined' } } }
        ])
      })
    }));
  });

  it('rejects an actor outside the organization and cohort before reading check-ins', async () => {
    prismaMock.cohorts.findFirst.mockResolvedValue(null);

    await expect(cohortFeedService.get(8, 999, 30, 0)).rejects.toMatchObject({ statusCode: 403 });
    expect(prismaMock.practice_checkins.findMany).not.toHaveBeenCalled();
    expect(prismaMock.practice_checkins.count).not.toHaveBeenCalled();
  });

  it('includes programId in the coach object chain so swapped route IDs are rejected', async () => {
    prismaMock.cohorts.findFirst.mockResolvedValue(null);

    await expect(cohortFeedService.get(8, 42, 30, 0, 999)).rejects.toMatchObject({ statusCode: 403 });
    expect(prismaMock.cohorts.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: 8, program_id: 999 })
    }));
  });
});
