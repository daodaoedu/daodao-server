/**
 * 燈塔場次 ACL 服務
 *
 * 燈塔場次的 cohort 實踐：privacyStatus 由場次統一設定（D7），學員不可自行修改。
 * 比照 challenge-acl.service.ts 的 assertChallengePracticeUpdatable。
 */

import { BadRequestError, ConflictError } from '../middleware/error.middleware';
import { getCohortContentState } from '../middleware/cohort-content-lifecycle.middleware';
import { prisma } from './database/prisma.service';
import { PROGRAM_KINDS } from '../constants/program-kind';
import { isCoachResourceLockActive } from '../utils/coach-resource-lock';
import { day } from './cohort-run-state';

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

/** YYYY-MM-DD of a stored @db.Date value. */
const dateKey = (value: Date | null): string | null => (value ? value.toISOString().slice(0, 10) : null);

/**
 * 燈塔場次實踐的期間由場次統一設定（daodao#544）：回傳請求中與現值不同的期間欄位。
 * 原樣送回的值不算修改，讓舊版前端整包存檔仍可更新其他欄位。
 */
export const changedLighthouseScheduleFields = (
  current: { start_date: Date | null; duration_days: number | null },
  data: Record<string, unknown>
): Array<'startDate' | 'durationDays'> => {
  const changed: Array<'startDate' | 'durationDays'> = [];
  if (data.startDate !== undefined && data.startDate !== dateKey(current.start_date)) changed.push('startDate');
  if (data.durationDays !== undefined && data.durationDays !== current.duration_days) changed.push('durationDays');
  return changed;
};

/**
 * 更新 guard：燈塔場次實踐嘗試修改 privacyStatus、開始日或持續天數時拒絕。
 * 隱私由場次的 is_private、期間由場次指派統一設定，學員不可自行修改。
 */
export const assertCohortPracticeUpdatable = async (practiceId: number, data: Record<string, unknown>): Promise<void> => {
  if (data.privacyStatus === undefined && data.startDate === undefined && data.durationDays === undefined) return;
  const practice = await prisma.practices.findUnique({
    where: { id: practiceId },
    select: { start_date: true, duration_days: true, cohort_id: true, template_id: true, creation_source: true, cohorts: { select: { program: { select: { kind: true } } } } }
  });
  if (!practice?.cohort_id || practice.cohorts?.program.kind !== PROGRAM_KINDS.LIGHTHOUSE) return;
  if (data.privacyStatus !== undefined) throw new BadRequestError('此場次的打卡隱私由帶領人統一設定，不可自行修改');
  // 期間只鎖由場次模板指派的實踐，與前端 isCohortPractice（isCoachResourceLockActive）同一範圍
  if (isCoachResourceLockActive(practice) && changedLighthouseScheduleFields(practice, data).length > 0) {
    throw new BadRequestError('此場次實踐的開始日與持續天數由帶領人統一設定，不可自行修改');
  }
};

/**
 * 打卡 guard：場次指派的燈塔實踐開始日前不可打卡，也不做提早打卡的日期位移（daodao#544）。
 * 以 Asia/Taipei 日曆日比較（cohort-run-state.today），避免台灣凌晨 0–8 點被 UTC 日期誤判為開始前。
 */
export const assertLighthouseCheckinAllowed = (isLockedCohortPractice: boolean, startDate: Date | null, currentDay: string): void => {
  if (!isLockedCohortPractice || startDate === null) return;
  if (day(new Date(startDate)) > currentDay) {
    throw new ConflictError('場次實踐尚未開始，開始日起才能打卡');
  }
};

export const cohortAclService = {
  getLighthouseCohortIdByPracticeId,
  isLighthouseCohort,
  canReadPrivateLighthousePractice,
  assertCohortPracticeUpdatable,
  assertLighthouseCheckinAllowed
};
