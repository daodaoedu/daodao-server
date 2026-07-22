import { Prisma } from '../../generated/prisma';
import { bulkEnqueueEmails, type EmailJobData } from '../queues/email.queue';
import { prisma } from './database/prisma.service';
import { generateCohortWeeklyDigestEmail } from './email/cohort-weekly-digest-template';
import { notificationEventService } from './notification-event.service';
import { NOTIFICATION_TYPES } from '../constants/notification-type';

interface CountRow { count: bigint }
interface AttentionRow { user_id: number; nickname: string | null }

export const sendWeeklyCohortDigests = async (now = new Date()): Promise<number> => {
  const periodStart = new Date(now);
  periodStart.setUTCDate(periodStart.getUTCDate() - 7);
  const interruptedBefore = new Date(now);
  interruptedBefore.setUTCDate(interruptedBefore.getUTCDate() - 3);
  const cohorts = await prisma.cohorts.findMany({
    where: { status: 'published' },
    select: {
      id: true,
      display_name: true,
      program: {
        select: {
          id: true,
          organization: {
            select: {
              name: true,
              organization_members: {
                where: { role: 'owner' },
                select: { user: { select: { id: true, contacts: { select: { email: true } } } } }
              }
            }
          }
        }
      }
    }
  });
  const jobs: EmailJobData[] = [];
  const frontendUrl = process.env.FRONTEND_URL ?? 'https://app.daodao.so';

  for (const cohort of cohorts) {
    const [checkinCount, pendingRows, attentionRows] = await Promise.all([
      prisma.practice_checkins.count({
        where: { practices: { cohort_id: cohort.id, deleted_at: null }, created_at: { gte: periodStart, lte: now } }
      }),
      prisma.$queryRaw<CountRow[]>(Prisma.sql`
        SELECT COUNT(*)::bigint AS count
        FROM practice_checkins pc
        JOIN practices p ON p.id = pc.practice_id
        WHERE p.cohort_id = ${cohort.id} AND p.deleted_at IS NULL
          AND pc.created_at >= ${periodStart} AND pc.created_at <= ${now}
          AND NOT EXISTS (SELECT 1 FROM comments c WHERE c.target_type = 'checkin' AND c.target_id = pc.id)
      `),
      prisma.$queryRaw<AttentionRow[]>(Prisma.sql`
        SELECT ce.user_id, COALESCE(u.nickname, '未命名學員') AS nickname
        FROM cohort_enrollments ce
        JOIN users u ON u.id = ce.user_id
        LEFT JOIN practices p ON p.cohort_id = ce.cohort_id AND p.user_id = ce.user_id AND p.deleted_at IS NULL
        LEFT JOIN practice_checkins pc ON pc.practice_id = p.id
        WHERE ce.cohort_id = ${cohort.id} AND ce.status = 'joined' AND ce.role = 'member'
        GROUP BY ce.user_id, u.nickname
        HAVING MAX(pc.created_at) IS NULL OR MAX(pc.created_at) < ${interruptedBefore}
        ORDER BY MAX(pc.created_at) ASC NULLS FIRST
        LIMIT 20
      `)
    ]);
    const dashboardUrl = `${frontendUrl}/lighthouse/programs/${cohort.program.id}/cohorts/${cohort.id}/focus`;
    const email = generateCohortWeeklyDigestEmail({
      organizationName: cohort.program.organization.name,
      cohortName: cohort.display_name,
      checkinCount,
      pendingResponseCount: Number(pendingRows[0]?.count ?? 0n),
      needsAttention: attentionRows.map(row => ({
        name: row.nickname ?? '未命名學員',
        url: `${dashboardUrl}?userId=${row.user_id}`
      })),
      dashboardUrl
    });
    for (const membership of cohort.program.organization.organization_members) {
      const to = membership.user.contacts?.email;
      if (!to) continue;
      jobs.push({
        to,
        subject: email.subject,
        html: email.html,
        emailType: 'cohort_weekly_digest',
        userId: membership.user.id,
        priority: 'P2'
      });
      await notificationEventService.createEvent({
        type: NOTIFICATION_TYPES.COHORT_WEEKLY_DIGEST,
        actorId: membership.user.id,
        recipientId: membership.user.id,
        entityType: 'cohort',
        entityId: cohort.id,
        payload: { checkinCount, pendingResponseCount: Number(pendingRows[0]?.count ?? 0n), needsAttentionCount: attentionRows.length, dashboardUrl },
        priority: 'P2',
        allowSelf: true,
        dedupeWindowMs: 6 * 24 * 60 * 60 * 1000
      });
    }
  }

  await bulkEnqueueEmails(jobs);
  return jobs.length;
};
