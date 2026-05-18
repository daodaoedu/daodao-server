/**
 * withOnboardingHook
 *
 * 包裝 Express handler，在 handler 成功後呼叫 onboardingService.checkAndAdvance，
 * 並將 meta.onboardingUpdate 附帶於同一 response 的 meta 欄位。
 *
 * 使用方式：
 *   router.post('/quiz', withOnboardingHook(OnboardingTask.A, saveResult));
 *   router.post('/practices', withOnboardingHook(OnboardingTask.C, createPractice, {
 *     resolveCreationMethod: (req) => req.body.creationMethod,
 *   }));
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';
import { onboardingService } from '@/services/onboarding.service';
import { OnboardingTask, CreationMethod } from '@/types/onboarding.types';
import { loggerService } from '@/services/logging/logger.service';

export type OnboardingHookOptions = {
  /** 任務 C 時從 req.body 讀取 creationMethod */
  resolveCreationMethod?: (req: Request) => CreationMethod | undefined;
};

/**
 * 攔截 res.json，在成功回應送出前注入 meta.onboardingUpdate。
 */
export function withOnboardingHook(
  taskKey: OnboardingTask,
  handler: RequestHandler,
  options?: OnboardingHookOptions
): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?.id;

    if (!userId) {
      await Promise.resolve(handler(req, res, next));
      return;
    }

    const originalJson = res.json.bind(res);

    // 覆寫 res.json：緩衝 body → await checkAndAdvance → 注入 meta → 送出
    res.json = function (body: unknown): Response {
      if (
        body &&
        typeof body === 'object' &&
        (body as Record<string, unknown>).success === true
      ) {
        const extra = options?.resolveCreationMethod
          ? { creationMethod: options.resolveCreationMethod(req) }
          : undefined;

        onboardingService
          .checkAndAdvance(userId, taskKey, extra)
          .then((update) => {
            const mutableBody = body as Record<string, unknown>;
            if (update) {
              mutableBody.meta = {
                ...(mutableBody.meta as Record<string, unknown> | undefined),
                onboardingUpdate: update,
              };
            }
            originalJson(mutableBody);
          })
          .catch((err: unknown) => {
            loggerService.warn('withOnboardingHook: checkAndAdvance failed', {
              userId,
              taskKey,
              error: err instanceof Error ? err.message : String(err),
            });
            originalJson(body);
          });

        return res;
      }

      return originalJson(body);
    };

    await Promise.resolve(handler(req, res, next));
  };
}
