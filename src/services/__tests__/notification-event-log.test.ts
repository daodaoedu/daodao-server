import { prismaMock } from '@tests/utils/prisma-mock';
import type { CreateEventParams } from '../notification-event.service';

jest.mock('../database/prisma.service', () => ({ prisma: prismaMock }));

const mockLogger = {
  error: jest.fn(),
  debug: jest.fn(),
};
jest.mock('../logging/logger.service', () => ({ loggerService: mockLogger }));

import { notificationEventService } from '../notification-event.service';

const syntheticToken = 'SYNTHETIC_INVITE_TOKEN_342_NEVER_LOG';
const params: CreateEventParams = {
  type: 'CohortInvitation',
  actorId: 17,
  recipientId: 29,
  entityType: 'cohort',
  entityId: 8,
  priority: 'P1',
  payload: { url: `https://app-dev.daodao.so/cohorts/join/${syntheticToken}` },
};

describe('notification event failure logging', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.notification_events.findFirst.mockResolvedValue(null);
  });

  it('keeps invitation payload and database error details out of serialized logs', async () => {
    const failure = new Error(`Database rejected invitation ${syntheticToken}`);
    failure.name = syntheticToken;
    failure.stack = `Error: ${syntheticToken}\n    at database-write`;
    prismaMock.notification_events.create.mockRejectedValue(failure);

    await expect(notificationEventService.createEvent(params)).resolves.toBeUndefined();

    expect(mockLogger.error).toHaveBeenCalledTimes(1);
    const serializedLogs = JSON.stringify({ error: mockLogger.error.mock.calls, debug: mockLogger.debug.mock.calls }, (_key, value: unknown) =>
      value instanceof Error ? { message: value.message, name: value.name, stack: value.stack } : value
    );
    expect(serializedLogs).not.toContain(syntheticToken);
    expect(mockLogger.error).toHaveBeenCalledWith('notification-event: failed to create event', {
      type: 'CohortInvitation',
      actorId: 17,
      recipientId: 29,
      entityType: 'cohort',
      entityId: 8,
      priority: 'P1',
    });
  });

  it('still swallows lookup errors without exposing their message or stack', async () => {
    prismaMock.notification_events.findFirst.mockRejectedValue(new Error(`Query failed ${syntheticToken}`));

    await expect(notificationEventService.createEvent(params)).resolves.toBeUndefined();

    const serializedLogs = JSON.stringify({ error: mockLogger.error.mock.calls, debug: mockLogger.debug.mock.calls }, (_key, value: unknown) =>
      value instanceof Error ? { message: value.message, name: value.name, stack: value.stack } : value
    );
    expect(serializedLogs).not.toContain(syntheticToken);
    expect(prismaMock.notification_events.create).not.toHaveBeenCalled();
  });
});
