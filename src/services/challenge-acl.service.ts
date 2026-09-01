import { BadRequestError, ConflictError, ForbiddenError } from '../middleware/error.middleware';
import { prisma } from './database/prisma.service';
import { PROGRAM_KINDS } from '../constants/program-kind';

/**
 * 共同挑戰分層互動 ACL（openspec: challenge-witnessing / challenge-participation）。
 * 打卡全公開；僅參與者可留言；名稱與期間鎖定；挑戰實踐不可複製；開始日前不可打卡。
 * 「挑戰實踐」的判定：practices.cohort_id → cohorts.program.kind === 'challenge'。
 */

/** 取得 practice 所屬的挑戰 cohort id；非挑戰實踐回傳 null */
export const getChallengeCohortIdByPracticeId = async (practiceId: number): Promise<number | null> => {
  const practice = await prisma.practices.findUnique({
    where: { id: practiceId },
    select: { cohort_id: true, cohorts: { select: { program: { select: { kind: true } } } } }
  });
  if (!practice?.cohort_id || practice.cohorts?.program.kind !== PROGRAM_KINDS.CHALLENGE) return null;
  return practice.cohort_id;
};

/** 取得打卡所屬的挑戰 cohort id；非挑戰打卡回傳 null */
export const getChallengeCohortIdByCheckinId = async (checkinId: number): Promise<number | null> => {
  const checkin = await prisma.practice_checkins.findUnique({
    where: { id: checkinId },
    select: { practices: { select: { cohort_id: true, cohorts: { select: { program: { select: { kind: true } } } } } } }
  });
  const practice = checkin?.practices;
  if (!practice?.cohort_id || practice.cohorts?.program.kind !== PROGRAM_KINDS.CHALLENGE) return null;
  return practice.cohort_id;
};

/** cohort 是否屬於共同挑戰（program.kind === 'challenge'）；cohortId 為 null 直接回 false */
export const isChallengeCohort = async (cohortId: number | null): Promise<boolean> => {
  if (cohortId === null) return false;
  const cohort = await prisma.cohorts.findUnique({
    where: { id: cohortId },
    select: { program: { select: { kind: true } } }
  });
  return cohort?.program.kind === PROGRAM_KINDS.CHALLENGE;
};

/** 使用者是否為該挑戰的參與者（enrollment status='joined'） */
export const isChallengeParticipant = async (cohortId: number, userId: number): Promise<boolean> => {
  const enrollment = await prisma.cohort_enrollments.findFirst({
    where: { cohort_id: cohortId, user_id: userId, status: 'joined' },
    select: { id: true }
  });
  return enrollment !== null;
};

/**
 * 留言 guard：留言目標屬於共同挑戰內容時，僅參與者可留言（FR-CC-05/13）。
 * 非挑戰內容或不支援的 targetType 一律放行，維持既有行為。
 */
export const assertChallengeCommentAllowed = async (targetType: string, internalTargetId: number, userId: number): Promise<void> => {
  let cohortId: number | null = null;
  if (targetType === 'practice') cohortId = await getChallengeCohortIdByPracticeId(internalTargetId);
  else if (targetType === 'checkin') cohortId = await getChallengeCohortIdByCheckinId(internalTargetId);
  if (cohortId === null) return;
  if (!(await isChallengeParticipant(cohortId, userId))) {
    throw new ForbiddenError('僅挑戰參與者可留言，加入挑戰後即可與大家交流');
  }
};

/** 挑戰實踐的鎖定欄位：名稱與期間不可編輯（FR-CC-10），隱私不可另外設定（FR-CC-05） */
const CHALLENGE_LOCKED_UPDATE_FIELDS = ['title', 'startDate', 'durationDays', 'privacyStatus'] as const;

/** 更新 guard：挑戰實踐嘗試修改鎖定欄位時拒絕 */
export const assertChallengePracticeUpdatable = (isChallenge: boolean, data: Record<string, unknown>): void => {
  if (!isChallenge) return;
  const attempted = CHALLENGE_LOCKED_UPDATE_FIELDS.filter(field => data[field] !== undefined);
  if (attempted.length > 0) {
    throw new BadRequestError(`共同挑戰實踐的名稱、期間與隱私由挑戰統一設定，不可修改（${attempted.join(', ')}）`);
  }
};

/** 複製 guard：共同挑戰實踐不可被複製，加入挑戰是唯一途徑（FR-CC-09） */
export const assertChallengePracticeCopyable = (isChallenge: boolean): void => {
  if (isChallenge) {
    throw new ForbiddenError('共同挑戰實踐不可複製，請由挑戰頁面加入');
  }
};

/**
 * 打卡 guard：挑戰為固定時段，開始日前不可打卡（FR-CC-11），
 * 亦藉此阻斷一般實踐「提早打卡日期位移」邏輯改動挑戰起訖日。
 */
export const assertChallengeCheckinAllowed = (isChallenge: boolean, startDate: Date | null, today: Date): void => {
  if (!isChallenge || startDate === null) return;
  if (today.getTime() < new Date(startDate).getTime()) {
    throw new ConflictError('挑戰尚未開始，開始日起才能打卡');
  }
};

export const challengeAclService = {
  getChallengeCohortIdByPracticeId,
  getChallengeCohortIdByCheckinId,
  isChallengeCohort,
  isChallengeParticipant,
  assertChallengeCommentAllowed,
  assertChallengePracticeUpdatable,
  assertChallengePracticeCopyable,
  assertChallengeCheckinAllowed
};
