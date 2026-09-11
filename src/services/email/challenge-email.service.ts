/**
 * 共同挑戰信件服務（openspec: challenge-emails）
 *
 * 五個 email 節點（Weekly Summary 併入既有週報）：
 * - welcome（CE01）：加入後立即，由 join 流程 enqueue
 * - t48h（CE02）：開始前 48 小時
 * - day1（CE03）：開始日 06:00
 * - first_checkin（CE04）：首次打卡隔日 08:00
 * - end（CE05）：結束日隔日 06:00
 *
 * 排程節點由每小時掃描（challenge-email queue repeatable job）比對觸發時點後補寄，
 * 冪等由 email_logs（user + email_type + cohort entity）查重保證：不重寄、可重試。
 * 時區一律 Asia/Taipei（UTC+8）。
 */

import { prisma } from '../database/prisma.service';
import { loggerService } from '../logging/logger.service';
import { EMAIL_TYPES, type EmailTypeValue } from '../../types/email/base.types';
import { EMAIL_STATUS } from '../../types/email/base.types';
import { createEmailLog, hasEmailBeenSent, updateEmailLogStatus } from './email-log.service';
import { PROGRAM_KINDS } from '../../constants/program-kind';
import {
  generateChallengeDay1Email,
  generateChallengeEndEmail,
  generateChallengeFirstCheckinEmail,
  generateChallengeT48hEmail,
  generateChallengeWelcomeEmail,
  type ChallengeEmailVariables
} from './challenge-email-template';

export type ChallengeEmailNode = 'welcome' | 't48h' | 'day1' | 'first_checkin' | 'end';

const NODE_CONFIG: Record<ChallengeEmailNode, { code: string; emailType: EmailTypeValue; generate: (v: ChallengeEmailVariables) => { subject: string; html: string } }> = {
  welcome: { code: 'CE01', emailType: EMAIL_TYPES.CHALLENGE_WELCOME, generate: generateChallengeWelcomeEmail },
  t48h: { code: 'CE02', emailType: EMAIL_TYPES.CHALLENGE_T48H, generate: generateChallengeT48hEmail },
  day1: { code: 'CE03', emailType: EMAIL_TYPES.CHALLENGE_DAY1, generate: generateChallengeDay1Email },
  first_checkin: { code: 'CE04', emailType: EMAIL_TYPES.CHALLENGE_FIRST_CHECKIN, generate: generateChallengeFirstCheckinEmail },
  end: { code: 'CE05', emailType: EMAIL_TYPES.CHALLENGE_END, generate: generateChallengeEndEmail }
};

const TAIPEI_OFFSET_MS = 8 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** 取 Date 的日曆日字串（UTC 讀法；cohorts.start_date 為 @db.Date，UTC 零點即日曆日） */
const dateStr = (value: Date): string => value.toISOString().slice(0, 10);

/** 某日曆日在 Asia/Taipei 的指定小時，對應的 UTC 時刻 */
const taipeiTime = (isoDate: string, hour: number): Date =>
  new Date(new Date(`${isoDate}T00:00:00Z`).getTime() + hour * 60 * 60 * 1000 - TAIPEI_OFFSET_MS);

/** 挑戰天數（含頭尾） */
const durationDaysOf = (startDate: Date, endDate: Date): number =>
  Math.round((endDate.getTime() - startDate.getTime()) / DAY_MS) + 1;

/**
 * 寄送單一節點信件給單一參與者；已寄過（email_logs 查重）則跳過。
 * @returns 是否實際寄出
 */
export const sendChallengeNodeEmail = async (node: ChallengeEmailNode, cohortId: number, userId: number): Promise<boolean> => {
  const config = NODE_CONFIG[node];
  const [cohort, user] = await Promise.all([
    prisma.cohorts.findUnique({
      where: { id: cohortId },
      select: { id: true, display_name: true, start_date: true, end_date: true, program: { select: { kind: true } } }
    }),
    prisma.users.findUnique({ where: { id: userId }, select: { nickname: true, contacts: { select: { email: true } } } })
  ]);
  if (!cohort || cohort.program.kind !== PROGRAM_KINDS.CHALLENGE || !user) {
    loggerService.warn('Challenge email target not found', { node, cohortId, userId });
    return false;
  }
  const email = user.contacts?.email;
  if (!email) {
    loggerService.warn('User has no email for challenge email', { node, cohortId, userId });
    return false;
  }

  const alreadySent = await hasEmailBeenSent({
    userId,
    emailType: config.emailType,
    entityType: 'cohort',
    entityId: cohortId,
    emailCode: config.code
  });
  if (alreadySent) return false;

  const practice = await prisma.practices.findFirst({
    where: { cohort_id: cohortId, user_id: userId, deleted_at: null },
    select: { external_id: true },
    orderBy: { created_at: 'asc' }
  });
  const frontendUrl = process.env.FRONTEND_URL ?? 'https://www.daodao.so';
  const variables: ChallengeEmailVariables = {
    userName: user.nickname || '學習者',
    challengeName: cohort.display_name,
    startDate: dateStr(cohort.start_date),
    endDate: dateStr(cohort.end_date),
    durationDays: durationDaysOf(cohort.start_date, cohort.end_date),
    challengeUrl: `${frontendUrl}/challenges/${cohortId}`,
    practiceUrl: practice?.external_id ? `${frontendUrl}/practices/${practice.external_id}` : `${frontendUrl}/challenges/${cohortId}`
  };
  const content = config.generate(variables);

  const logRecord = await createEmailLog({
    userId,
    emailType: config.emailType,
    entityType: 'cohort',
    entityId: cohortId,
    emailCode: config.code,
    subject: content.subject,
    status: EMAIL_STATUS.PENDING
  });

  const { emailService } = await import('./email.service');
  const result = await emailService.sendEmail({
    to: email,
    subject: content.subject,
    html: content.html,
    trackingToken: logRecord.tracking_token ?? undefined
  });
  if (!result.success) {
    await updateEmailLogStatus(logRecord.id, EMAIL_STATUS.FAILED);
    throw new Error(result.error || 'Failed to send challenge email');
  }
  await updateEmailLogStatus(logRecord.id, EMAIL_STATUS.SENT);
  loggerService.info('Challenge email sent', { node, code: config.code, cohortId, userId });
  return true;
};

/** 對一個 cohort 的所有參與者補寄某節點（逐一寄送，單人失敗不中斷整批） */
const sendNodeToParticipants = async (node: ChallengeEmailNode, cohortId: number): Promise<number> => {
  const participants = await prisma.cohort_enrollments.findMany({
    where: { cohort_id: cohortId, status: 'joined', user_id: { not: null } },
    select: { user_id: true }
  });
  let sent = 0;
  for (const participant of participants) {
    if (participant.user_id === null) continue;
    try {
      if (await sendChallengeNodeEmail(node, cohortId, participant.user_id)) sent += 1;
    } catch (error) {
      loggerService.error('Challenge node email failed for participant', {
        node, cohortId, userId: participant.user_id,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  return sent;
};

/**
 * 每小時掃描：找出已到觸發時點的排程節點並補寄。
 * 掃描範圍：published 且 program.kind='challenge'、結束未超過 7 天的 cohort（END 信結束隔日寄，7 天緩衝容錯）。
 */
export const sendPendingChallengeEmails = async (now = new Date()): Promise<void> => {
  const cohorts = await prisma.cohorts.findMany({
    where: {
      status: 'published',
      program: { kind: PROGRAM_KINDS.CHALLENGE, archived_at: null, deleted_at: null },
      end_date: { gte: new Date(now.getTime() - 7 * DAY_MS) }
    },
    select: { id: true, start_date: true, end_date: true }
  });

  for (const cohort of cohorts) {
    const start = dateStr(cohort.start_date);
    const end = dateStr(cohort.end_date);
    const startAt = taipeiTime(start, 0);

    // t48h：開始前 48 小時起、開始前有效（開始後才加入者不補寄過期提醒）
    if (now.getTime() >= startAt.getTime() - 48 * 60 * 60 * 1000 && now.getTime() < startAt.getTime()) {
      await sendNodeToParticipants('t48h', cohort.id);
    }
    // day1：開始日 06:00（Asia/Taipei）起、當日有效
    if (now.getTime() >= taipeiTime(start, 6).getTime() && now.getTime() < taipeiTime(start, 24).getTime()) {
      await sendNodeToParticipants('day1', cohort.id);
    }
    // end：結束日隔日 06:00（Asia/Taipei）起
    if (now.getTime() >= taipeiTime(end, 24 + 6).getTime()) {
      await sendNodeToParticipants('end', cohort.id);
    }
    // first_checkin：首次打卡隔日 08:00（Asia/Taipei）起，逐參與者判斷
    await sendPendingFirstCheckinEmails(cohort.id, now);
  }
};

/** 首次打卡隔日 08:00 節點：依 practices.first_checkin_at 判斷觸發時點 */
const sendPendingFirstCheckinEmails = async (cohortId: number, now: Date): Promise<void> => {
  const practices = await prisma.practices.findMany({
    where: { cohort_id: cohortId, deleted_at: null, first_checkin_at: { not: null } },
    select: { user_id: true, first_checkin_at: true }
  });
  for (const practice of practices) {
    if (practice.first_checkin_at === null) continue;
    // 首次打卡的台北日曆日 → 隔日 08:00
    const checkinTaipeiDate = dateStr(new Date(practice.first_checkin_at.getTime() + TAIPEI_OFFSET_MS));
    const dueAt = taipeiTime(checkinTaipeiDate, 24 + 8);
    if (now.getTime() < dueAt.getTime()) continue;
    try {
      await sendChallengeNodeEmail('first_checkin', cohortId, practice.user_id);
    } catch (error) {
      loggerService.error('Challenge first-checkin email failed', {
        cohortId, userId: practice.user_id,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
};

export const challengeEmailService = { sendChallengeNodeEmail, sendPendingChallengeEmails };
