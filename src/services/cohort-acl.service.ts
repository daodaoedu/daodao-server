/**
 * 燈塔場次 ACL 服務
 *
 * 燈塔場次的 cohort 實踐：privacyStatus 由場次統一設定（D7），學員不可自行修改。
 * 比照 challenge-acl.service.ts 的 assertChallengePracticeUpdatable。
 */

import { BadRequestError } from '../middleware/error.middleware';
import { getCohortContentState } from '../middleware/cohort-content-lifecycle.middleware';
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

/** cohort 是否為燈塔場次；比照 challenge-acl.service.ts 的 isChallengeCohort */
export const isLighthouseCohort = async (cohortId: number | null): Promise<boolean> => {
  if (cohortId === null) return false;
  const cohort = await prisma.cohorts.findUnique({
    where: { id: cohortId },
    select: { program: { select: { kind: true } } }
  });
  return cohort?.program.kind === PROGRAM_KINDS.LIGHTHOUSE;
};

/**
 * 私密燈塔實踐仍可由本場次已加入學員與所屬組織成員讀取。
 * 與 cohort feed 採相同成員條件；草稿與個人／共同挑戰實踐不走此橋接。
 * 場次結束後 90 天內仍可讀取；超過保留期限則不授予這個場內讀取例外。
 */
export const canReadPrivateLighthousePractice = async (
  practice: { cohort_id: number | null; status: string | null },
  requesterId: number | null | undefined
): Promise<boolean> => {
  if (requesterId == null || practice.cohort_id == null || practice.status === 'draft') return false;
  const cohort = await prisma.cohorts.findFirst({
    where: {
      id: practice.cohort_id,
      program: { kind: PROGRAM_KINDS.LIGHTHOUSE },
      OR: [
        { program: { organization: { organization_members: { some: { user_id: requesterId } } } } },
        { cohort_enrollments: { some: { user_id: requesterId, status: 'joined' } } }
      ]
    },
    select: { id: true, end_date: true }
  });
  return cohort !== null && getCohortContentState(cohort.end_date) !== 'gone';
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
  isLighthouseCohort,
  canReadPrivateLighthousePractice,
  assertCohortPracticeUpdatable
};
