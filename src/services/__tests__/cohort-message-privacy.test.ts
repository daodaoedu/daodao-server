import { prismaMock } from '../../../tests/utils/prisma-mock';

jest.mock('../database/prisma.service', () => ({ prisma: prismaMock }));
jest.mock('../logging/logger.service', () => ({
  loggerService: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
jest.mock('../id-converter.service', () => ({
  __esModule: true,
  default: { getTargetEntity: jest.fn().mockResolvedValue({ id: 10, user_id: 2, cohort_id: 57 }) },
}));
jest.mock('../notification-event.service', () => ({
  notificationEventService: { createEvent: jest.fn() },
}));

import { commentService } from '../comment.service';

/** Exercise the serialized response, including a public reply to a private message. */
describe('#344 cohort access must not grant private message access', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const base = {
      target_type: 'practice', target_id: 10, parent_id: null,
      created_at: new Date('2026-10-23T00:00:00Z'), updated_at: null,
      users: { id: 1, nickname: 'Coach', external_id: 'coach', custom_id: null, user_positions: [], contacts: null },
    };
    const comments = [
      { ...base, id: 100, user_id: 1, visibility: 'private', content: 'PRIVATE_COACH_MESSAGE_344' },
      { ...base, id: 101, user_id: 2, visibility: 'public', content: 'PUBLIC_REPLY_TO_PRIVATE_344', parent_id: 100 },
      { ...base, id: 102, user_id: 2, visibility: 'public', content: 'Public discussion' },
    ];
    prismaMock.comments.findMany.mockResolvedValue(comments as never);
    prismaMock.practices.findUnique.mockResolvedValue({ external_id: 'practice-10' } as never);
  });

  it.each([null, { id: 3, role: '1' }])('does not expose private messages to a peer or anonymous user (%j)', async currentUser => {
    const result = await commentService.getComments({ targetType: 'practice', targetId: 'practice-10', currentUser });
    expect(result.success).toBe(true);
    expect(JSON.stringify(result)).not.toContain('PRIVATE_COACH_MESSAGE_344');
    expect(JSON.stringify(result)).not.toContain('PUBLIC_REPLY_TO_PRIVATE_344');
    expect(result.data.map(comment => comment.id)).toEqual([102]);
  });

  it.each([1, 2])('keeps the private message visible to its author and recipient (%i)', async id => {
    const result = await commentService.getComments({ targetType: 'practice', targetId: 'practice-10', currentUser: { id, role: '1' } });
    expect(JSON.stringify(result)).toContain('PRIVATE_COACH_MESSAGE_344');
    expect(JSON.stringify(result)).toContain('PUBLIC_REPLY_TO_PRIVATE_344');
  });
});
