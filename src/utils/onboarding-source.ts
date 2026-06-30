import { UserSource } from '../types/onboarding.types';

/**
 * 從 referral_source 與測驗結果推導 UserSource。
 *
 * 規則：
 * - referral_source 含 quiz/test 相關值，或 hasQuizResult 為 true → S2
 * - referral_source 含 action/ai/generator 相關值 → S3
 * - 其餘 → S1（fallback）
 */
export function deriveUserSource(referralSource: string | null | undefined, hasQuizResult: boolean): UserSource {
  if (hasQuizResult) {
    return UserSource.S2;
  }

  const normalized = (referralSource ?? '').toLowerCase();

  if (/quiz|test|survey/.test(normalized)) {
    return UserSource.S2;
  }

  if (/action|ai|generator|tool/.test(normalized)) {
    return UserSource.S3;
  }

  return UserSource.S1;
}
