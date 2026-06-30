import { OnboardingTask, TASK_ORDER_BY_SOURCE, UserSource } from '@/types/onboarding.types';

describe('TASK_ORDER_BY_SOURCE', () => {
  it('matches the onboarding task guide spec', () => {
    expect(TASK_ORDER_BY_SOURCE[UserSource.S1]).toEqual([
      OnboardingTask.B,
      OnboardingTask.A,
      OnboardingTask.C,
      OnboardingTask.E,
      OnboardingTask.D,
    ]);
    expect(TASK_ORDER_BY_SOURCE[UserSource.S2]).toEqual([
      OnboardingTask.B,
      OnboardingTask.C,
      OnboardingTask.E,
      OnboardingTask.D,
    ]);
    expect(TASK_ORDER_BY_SOURCE[UserSource.S3]).toEqual([
      OnboardingTask.C,
      OnboardingTask.B,
      OnboardingTask.D,
      OnboardingTask.A,
      OnboardingTask.E,
    ]);
  });
});
