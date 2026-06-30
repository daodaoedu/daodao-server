const COMPLETED_CACHE_TTL_MS = 5 * 60 * 1000;

const completedUntilByUserId = new Map<number, number>();

const isCompleted = (userId: number): boolean => {
  const completedUntil = completedUntilByUserId.get(userId);
  if (!completedUntil) return false;

  if (completedUntil <= Date.now()) {
    completedUntilByUserId.delete(userId);
    return false;
  }

  return true;
};

const markCompleted = (userId: number): void => {
  completedUntilByUserId.set(userId, Date.now() + COMPLETED_CACHE_TTL_MS);
};

const clear = (): void => {
  completedUntilByUserId.clear();
};

export const onboardingCompletionCache = {
  isCompleted,
  markCompleted,
  clear,
};
