import { ForbiddenError, NotFoundError } from '../middleware/error.middleware';
import { prisma } from './database/prisma.service';
import { LIGHTHOUSE_AUDIT_ACTIONS } from '../constants/audit-action';

const setConsent = async (cohortId: number, userId: number, consent: boolean, now = new Date()) => {
  const enrollment = await prisma.cohort_enrollments.findFirst({ where: { cohort_id: cohortId, user_id: userId, status: 'joined' }, select: { id: true } });
  if (!enrollment) throw new NotFoundError('找不到可設定的本期參與紀錄');
  await prisma.cohort_enrollments.update({ where: { id: enrollment.id }, data: { export_opt_in: consent, export_opted_in_at: consent ? now : null } });
  return { cohortId, consent, optedInAt: consent ? now : null };
};

const exportOutcome = async (programId: number, cohortId: number, actorId: number, now = new Date()) => {
  const cohort = await prisma.cohorts.findFirst({ where: { id: cohortId, program_id: programId, program: { organization: { organization_members: { some: { user_id: actorId } } } } }, select: { id: true } });
  if (!cohort) throw new ForbiddenError('無權限匯出此期成果');
  const enrollments = await prisma.cohort_enrollments.findMany({
    where: { cohort_id: cohortId, export_opt_in: true, user_id: { not: null } },
    select: {
      user: { select: { nickname: true, practices: { where: { cohort_id: cohortId, deleted_at: null }, select: { title: true, reflection: true, practice_checkins: { orderBy: { created_at: 'desc' }, take: 10, select: { note: true } } } } } }
    }
  });
  const learners = enrollments.flatMap(item => item.user ? [{
    nickname: item.user.nickname,
    practices: item.user.practices.map(practice => ({ title: practice.title, checkinSummary: practice.practice_checkins.flatMap(checkin => checkin.note ? [checkin.note] : []), reflectionExcerpt: practice.reflection?.slice(0, 300) ?? null }))
  }] : []);
  await prisma.$executeRaw`
    INSERT INTO audit_logs (admin_id, action_type, target_resource, target_id, new_value)
    VALUES (${actorId}, ${LIGHTHOUSE_AUDIT_ACTIONS.COHORT_OUTCOME_EXPORTED}, 'cohort', ${String(cohortId)},
            ${JSON.stringify({ scope: 'opt_in_learners', optInCount: learners.length })}::jsonb)
  `;
  return { cohortId, exportedAt: now, learners };
};
export const cohortExportService = { setConsent, exportOutcome };
