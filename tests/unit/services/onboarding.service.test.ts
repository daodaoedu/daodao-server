import { prismaMock } from '@tests/utils/prisma-mock';

const mockLoggerService = {
  info: jest.fn(),
  warn: jest.fn(),
};

jest.mock('@/services/database/prisma.service', () => ({
  prisma: prismaMock,
}));

jest.mock('@/services/logging/logger.service', () => ({
  loggerService: mockLoggerService,
}));

import { onboardingService } from '@/services/onboarding.service';
import { OnboardingTask, UserSource } from '@/types/onboarding.types';

const onboardingRow = {
  id: 1,
  user_id: 123,
  user_source: UserSource.S1,
  task_states: { [OnboardingTask.B]: 'done' },
  email_states: {},
  creation_method: null,
  badge_granted: false,
  badge_granted_at: null,
  completed_at: null,
  days_to_complete: null,
  created_at: new Date('2026-01-01T00:00:00Z'),
  updated_at: new Date('2026-01-01T00:00:00Z'),
};

describe('onboardingService.getStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.practices.findFirst.mockResolvedValue(null);
  });

  it('does not count stale profile task state when required profile sections are incomplete', async () => {
    prismaMock.$queryRaw.mockResolvedValueOnce([onboardingRow]);
    prismaMock.users.findUnique.mockResolvedValueOnce({
      nickname: 'nobody',
      custom_id: 'noboddddd',
      personal_slogan: 'dooooo',
      education_stage: 'other',
      user_preferences: [],
      user_positions: [],
    } as never);

    const status = await onboardingService.getStatus(123);

    expect(status?.completedTasks).toBe(0);
    expect(status?.taskList.find((task) => task.taskKey === OnboardingTask.B)?.done).toBe(false);
  });

  it('counts profile task state when all required profile sections are complete', async () => {
    prismaMock.$queryRaw.mockResolvedValueOnce([onboardingRow]);
    prismaMock.users.findUnique.mockResolvedValueOnce({
      nickname: 'nobody',
      custom_id: 'noboddddd',
      personal_slogan: 'dooooo',
      education_stage: 'other',
      user_preferences: [{ id: 1 }],
      user_positions: [{ id: 1 }],
    } as never);

    const status = await onboardingService.getStatus(123);

    expect(status?.completedTasks).toBe(1);
    expect(status?.taskList.find((task) => task.taskKey === OnboardingTask.B)?.done).toBe(true);
  });
});
