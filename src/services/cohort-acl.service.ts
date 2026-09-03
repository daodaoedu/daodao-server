/**
 * 燈塔場次 ACL 服務
 *
 * 燈塔場次的 cohort 實踐：privacyStatus 由場次統一設定（D7），學員不可自行修改。
 * 比照 challenge-acl.service.ts 的 assertChallengePracticeUpdatable。
 */

import { BadRequestError } from '../middleware/error.middleware';
import { prisma } from './database/prisma.service';
import { PROGRAM_KINDS } from '../constants/program-kind';

/**
 * 取得 practice 所屬的燈塔 cohort id；非燈塔實踐回傳 null。
 * 判斷條件：practices.cohort_id → cohorts.program.kind === 'lighthouse'
 */
export const getLighthouseCohortIdByPracticeId = async (practiceId: number): Promise<number | null> => {
  const practice = await prisma.practices.findUnique({
    where: { id: practiceId },
    select: { cohort_id: true, cohorts: { select: { program: { select: { kind: true } } } } }
  });
  if (!practice?.cohort_id || practice.cohorts?.program.kind !== PROGRAM_KINDS.LIGHTHOUSE) return null;
  return practice.cohort_id;
};

/**
 * 更新 guard：燈塔場次實踐嘗試修改 privacyStatus 時拒絕。
 * 隱私由場次的 is_private 統一設定，學員不可自行修改。
 */
export const assertCohortPracticeUpdatable = async (practiceId: number, data: Record<string, unknown>): Promise<void> => {
  if (data.privacyStatus === undefined) return;
  const cohortId = await getLighthouseCohortIdByPracticeId(practiceId);
  if (cohortId === null) return;
  throw new BadRequestError('此場次的打卡隱私由帶領人統一設定，不可自行修改');
};

export const cohortAclService = {
  getLighthouseCohortIdByPracticeId,
  assertCohortPracticeUpdatable
};
