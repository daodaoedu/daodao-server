import { createCohortFeedbackSurvey, isCohortFeedbackEnabled, hasCohortFeedbackSchema } from './cohort-feedback.service';
import { enqueueCohortFeedbackSurvey } from './cohort-feedback-delivery.service';
import { Prisma } from '../../generated/prisma';
import { bulkEnqueueEmails, type EmailJobData } from '../queues/email.queue';
import { prisma } from './database/prisma.service';
import { generateCohortFeedbackSurveyEmail } from './email/cohort-feedback-survey-template';

const taipeiDate = (now: Date): Date => {
  const taipei = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  return new Date(Date.UTC(taipei.getUTCFullYear(), taipei.getUTCMonth(), taipei.getUTCDate()));
};

const uniqueFeedbackTag = (cohortId: number): string => `lighthouse:cohort-feedback:${cohortId}`;

export const sendCohortFeedbackSurveys = async (now = new Date()): Promise<number> => {
  if (isCohortFeedbackEnabled() && !await hasCohortFeedbackSchema()) return 0;
  const today = taipeiDate(now);
  const cohorts = await prisma.cohorts.findMany({
    where: { end_date: isCohortFeedbackEnabled() ? { lt: today } : { lte: today }, status: 'published', ...(isCohortFeedbackEnabled() ? { deleted_at: null } : {}) },
    select: {
      id: true,
      display_name: true,
      program: {
        select: {
          organization: {
            select: {
              name: true,
              organization_members: {
                where: { role: 'owner' },
                orderBy: { created_at: 'asc' },
                take: 1,
                select: { user_id: true }
              }
            }
          }
        }
      },
      cohort_enrollments: {
        where: isCohortFeedbackEnabled() ? { status: 'joined', user_id: { not: null } } : { status: 'joined', role: 'member' },
        select: {
          email: true,
          user_id: true,
          user: { select: { contacts: { select: { email: true } } } }
        }
      }
    }
  });
  const frontendUrl = process.env.FRONTEND_URL ?? 'https://app.daodao.so';
  let createdCount = 0;

  for (const cohort of cohorts) {
    if (isCohortFeedbackEnabled()) {
      const mapping = await prisma.cohort_feedback_surveys.findUnique({ where: { cohort_id: cohort.id } });
      if (mapping) {
        if (mapping.delivery_state !== 'sent') await enqueueCohortFeedbackSurvey(cohort.id);
        continue;
      }
      const legacy = await prisma.surveys.findFirst({ where: { tags: { has: uniqueFeedbackTag(cohort.id) } }, select: { id: true } });
      if (legacy) continue; // Never relabel or replace an existing non-anonymous survey.
      const creatorId = cohort.program.organization.organization_members[0]?.user_id;
      if (!creatorId) continue;
      try {
        await createCohortFeedbackSurvey(cohort.id, creatorId, now);
        createdCount += 1;
      } catch (error) {
        // A concurrent scheduler created this cohort's unique mapping first.
        if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')) throw error;
      }
      await enqueueCohortFeedbackSurvey(cohort.id);
      continue;
    }
    const tag = uniqueFeedbackTag(cohort.id);
    const existing = await prisma.surveys.findFirst({ where: { tags: { has: tag } }, select: { id: true } });
    if (existing) continue;

    const creatorId = cohort.program.organization.organization_members[0]?.user_id;
    if (!creatorId) continue;
    const survey = await prisma.surveys.create({
      data: {
        title: `${cohort.display_name} 期末回饋`,
        description: '謝謝你走完這一期。你的回饋會幫助帶領者理解陪伴經驗，並改善下一期。',
        status: 'active',
        is_public: true,
        is_anonymous: false,
        tags: ['lighthouse', 'cohort-feedback', tag],
        created_by: creatorId,
        start_time: now,
        questions: {
          create: [
            {
              question_text: '打卡被看見的感受',
              question_type: 'scale',
              is_required: true,
              position: 0,
              conditions: []
            },
            {
              question_text: '這一期，哪一個陪伴或回應對你最有幫助？',
              question_type: 'text',
              is_required: false,
              position: 1,
              conditions: []
            },
            {
              question_text: '如果下一期只能改善一件事，你最希望是什麼？',
              question_type: 'text',
              is_required: false,
              position: 2,
              conditions: []
            }
          ]
        }
      },
      select: { external_id: true }
    });
    const surveyUrl = `${frontendUrl}/survey/r/${survey.external_id}`;
    const email = generateCohortFeedbackSurveyEmail({
      organizationName: cohort.program.organization.name,
      cohortName: cohort.display_name,
      surveyUrl
    });
    const recipients = new Map<string, number | undefined>();
    for (const enrollment of cohort.cohort_enrollments) {
      const recipient = enrollment.email ?? enrollment.user?.contacts?.email;
      if (recipient) recipients.set(recipient.toLowerCase(), enrollment.user_id ?? undefined);
    }
    const jobs: EmailJobData[] = [...recipients.entries()].map(([to, userId]) => ({
      to,
      subject: email.subject,
      html: email.html,
      emailType: 'cohort_feedback_survey',
      userId,
      priority: 'P2'
    }));
    await bulkEnqueueEmails(jobs);
    createdCount += 1;
  }
  return createdCount;
};
