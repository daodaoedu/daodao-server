import { createHmac } from 'crypto';
import { BadRequestError, ServiceUnavailableError } from '@/middleware/error.middleware';

const DOMAIN = 'daodao:managed-survey-completion:v1\0';

/** An independent, stable secret keeps transaction metadata from identifying the completing member. */
export function parseSurveyCompletionHmacKey(value: string | undefined): Buffer {
  if (!value || !/^[0-9a-fA-F]{64}$/.test(value)) throw new ServiceUnavailableError('問卷暫時無法使用，請稍後再試');
  return Buffer.from(value, 'hex');
}

/** Never fall back to JWT keys: rotating auth credentials must not change the completion set. */
export function requireSurveyCompletionHmacKey(): Buffer {
  return parseSurveyCompletionHmacKey(process.env.SURVEY_COMPLETION_HMAC_KEY);
}

/** Survey and member boundaries are encoded unambiguously; no raw identity is persisted with the answer transaction. */
export function deriveSurveyCompletionKey(surveyId: number, userId: number, key: Buffer): string {
  if (key.length !== 32) throw new ServiceUnavailableError('問卷暫時無法使用，請稍後再試');
  if (!Number.isSafeInteger(surveyId) || surveyId <= 0 || !Number.isSafeInteger(userId) || userId <= 0) throw new BadRequestError('無效的問卷完成識別');
  return createHmac('sha256', key).update(DOMAIN).update(`${surveyId}\0${userId}`).digest('hex');
}
