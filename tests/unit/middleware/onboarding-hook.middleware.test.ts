const mockCheckAndAdvance = jest.fn();
const mockWarn = jest.fn();

jest.mock('@/services/onboarding.service', () => ({
  onboardingService: {
    checkAndAdvance: mockCheckAndAdvance,
  },
}));

jest.mock('@/services/logging/logger.service', () => ({
  loggerService: {
    warn: mockWarn,
  },
}));

import { Request, Response } from 'express';
import { withOnboardingHook } from '@/middleware/onboarding-hook.middleware';
import { onboardingCompletionCache } from '@/services/onboarding-completion-cache.service';
import { OnboardingTask } from '@/types/onboarding.types';

const flushPromises = () => new Promise<void>((resolve) => setImmediate(resolve));

describe('withOnboardingHook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    onboardingCompletionCache.clear();
    mockCheckAndAdvance.mockResolvedValue({ taskKey: OnboardingTask.B, allCompleted: false });
  });

  it('does not advance when a successful response fails the completion condition', async () => {
    const json = jest.fn();
    const req = { user: { id: 123 } } as Request;
    const res = { json } as unknown as Response;
    const next = jest.fn();
    const handler = jest.fn((_req: Request, response: Response) => {
      response.json({ success: true });
    });

    await withOnboardingHook(OnboardingTask.B, handler, {
      shouldAdvance: () => false,
    })(req, res, next);
    await flushPromises();

    expect(mockCheckAndAdvance).not.toHaveBeenCalled();
    expect(json).toHaveBeenCalledWith({ success: true });
  });

  it('advances and injects onboarding metadata when the completion condition passes', async () => {
    const json = jest.fn();
    const req = { user: { id: 123 } } as Request;
    const res = { json } as unknown as Response;
    const next = jest.fn();
    const handler = jest.fn((_req: Request, response: Response) => {
      response.json({ success: true, data: { id: 123 } });
    });

    await withOnboardingHook(OnboardingTask.B, handler, {
      shouldAdvance: () => true,
    })(req, res, next);
    await flushPromises();

    expect(mockCheckAndAdvance).toHaveBeenCalledWith(123, OnboardingTask.B, undefined);
    expect(json).toHaveBeenCalledWith({
      success: true,
      data: { id: 123 },
      meta: {
        onboardingUpdate: { taskKey: OnboardingTask.B, allCompleted: false },
      },
    });
  });

  it('skips onboarding work for users cached as completed', async () => {
    onboardingCompletionCache.markCompleted(123);

    const body = { success: true, data: { id: 123 } };
    const json = jest.fn();
    const req = { user: { id: 123 } } as Request;
    const res = { json } as unknown as Response;
    const next = jest.fn();
    const handler = jest.fn((_req: Request, response: Response) => {
      response.json(body);
    });

    await withOnboardingHook(OnboardingTask.E, handler)(req, res, next);
    await flushPromises();

    expect(mockCheckAndAdvance).not.toHaveBeenCalled();
    expect(json).toHaveBeenCalledWith(body);
  });

  it('caches the user when a task update completes all onboarding tasks', async () => {
    mockCheckAndAdvance.mockResolvedValue({ taskKey: OnboardingTask.E, allCompleted: true });

    const json = jest.fn();
    const req = { user: { id: 123 } } as Request;
    const res = { json } as unknown as Response;
    const next = jest.fn();
    const handler = jest.fn((_req: Request, response: Response) => {
      response.json({ success: true });
    });

    await withOnboardingHook(OnboardingTask.E, handler)(req, res, next);
    await flushPromises();

    expect(onboardingCompletionCache.isCompleted(123)).toBe(true);
  });

  it('still sends the original response when no onboarding record exists', async () => {
    mockCheckAndAdvance.mockResolvedValue(null);

    const body = { success: true, data: { id: 123 } };
    const json = jest.fn();
    const req = { user: { id: 123 } } as Request;
    const res = { json } as unknown as Response;
    const next = jest.fn();
    const handler = jest.fn((_req: Request, response: Response) => {
      response.json(body);
    });

    await withOnboardingHook(OnboardingTask.B, handler)(req, res, next);
    await flushPromises();

    expect(mockCheckAndAdvance).toHaveBeenCalledWith(123, OnboardingTask.B, undefined);
    expect(json).toHaveBeenCalledWith(body);
  });
});
