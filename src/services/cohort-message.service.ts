import { LIGHTHOUSE_AUDIT_ACTIONS } from '../constants/audit-action';
import { NOTIFICATION_TYPES } from '../constants/notification-type';
import { ForbiddenError, NotFoundError } from '../middleware/error.middleware';
import type { CohortMessageCategory, CreateCohortMessageTemplateInput, SendCohortMessageInput } from '../validators/cohort-message.validators';
import { prisma } from './database/prisma.service';
import { notificationEventService } from './notification-event.service';

/**
 * 今日焦點的三個互動（FRD 3.5）：
 * - 打卡紀錄抽屜：帶領人看「某參與者 × 某實踐」的所有打卡（FR-TF-04）
 * - 訊息紀錄／送出訊息：以參與者為軸的 cohort_messages（FR-TF-05/06），不綁單則打卡
 * - 訊息範本：組織共享的 cohort_message_templates（FR-TF-06）
 */

const personSelect = { id: true, nickname: true, contacts: { select: { photo_url: true } } } as const;
const mapPerson = (user: { id: number; nickname: string | null; contacts: { photo_url: string | null } | null }) => ({ userId: user.id, nickname: user.nickname, avatar: user.contacts?.photo_url ?? null });
const messageSelect = {
  id: true, cohort_id: true, recipient_user_id: true, sender_user_id: true, practice_id: true, template_id: true, category: true, body: true, sent_at: true,
  sender: { select: { nickname: true } }, practice: { select: { title: true, practice_templates: { select: { title: true } } } }
} as const;
type MessageRow = { id: number; cohort_id: number; recipient_user_id: number | null; sender_user_id: number | null; practice_id: number | null; template_id: number | null; category: string; body: string; sent_at: Date; sender: { nickname: string | null } | null; practice: { title: string; practice_templates: { title: string } | null } | null };
const asCategory = (value: string): CohortMessageCategory => {
  if (value === 'encourage' || value === 'celebrate') return value;
  throw new Error(`Invalid cohort message category: ${value}`);
};
const mapMessage = (row: MessageRow) => ({
  id: row.id, cohortId: row.cohort_id, recipientUserId: row.recipient_user_id,
  senderUserId: row.sender_user_id, senderNickname: row.sender?.nickname ?? null,
  practiceId: row.practice_id, practiceTitle: row.practice?.practice_templates?.title ?? row.practice?.title ?? null, templateId: row.template_id,
  category: asCategory(row.category), body: row.body, sentAt: row.sent_at
});

const assertCoach = async (programId: number, cohortId: number, actorId: number) => {
  const cohort = await prisma.cohorts.findFirst({
    where: { id: cohortId, program_id: programId, program: { organization: { status: 'active', organization_members: { some: { user_id: actorId } } } } },
    select: { id: true, display_name: true, program: { select: { organization_id: true } } }
  });
  if (!cohort) throw new ForbiddenError('無權限操作此場次');
  return cohort;
};
/** 參與者必須是本場次已加入的成員（曾退出／被移除的看不到內容層） */
const assertParticipant = async (cohortId: number, userId: number) => {
  const enrollment = await prisma.cohort_enrollments.findFirst({
    where: { cohort_id: cohortId, user_id: userId, status: 'joined' },
    select: { user: { select: personSelect } }
  });
  if (!enrollment?.user) throw new NotFoundError('找不到此參與者');
  return mapPerson(enrollment.user);
};
const assertOrganization = async (organizationId: number, actorId: number): Promise<void> => {
  const organization = await prisma.organization.findFirst({ where: { id: organizationId, organization_members: { some: { user_id: actorId } } }, select: { status: true } });
  if (!organization) throw new ForbiddenError('無權限存取此組織');
  if (organization.status !== 'active') throw new ForbiddenError('此組織目前已停權');
};

/** 打卡紀錄抽屜（FR-TF-04）：依日期由新到舊 */
const listCheckins = async (programId: number, cohortId: number, actorId: number, userId: number, practiceId: number) => {
  await assertCoach(programId, cohortId, actorId);
  const participant = await assertParticipant(cohortId, userId);
  const practice = await prisma.practices.findFirst({
    where: { id: practiceId, cohort_id: cohortId, user_id: userId, deleted_at: null },
    select: { id: true, external_id: true, title: true, start_date: true, end_date: true, practice_templates: { select: { title: true } } }
  });
  if (!practice) throw new NotFoundError('找不到此參與者的實踐');
  const items = await prisma.practice_checkins.findMany({
    where: { practice_id: practiceId },
    orderBy: [{ checkin_date: 'desc' }, { created_at: 'desc' }],
    select: { id: true, checkin_date: true, mood: true, note: true, image_urls: true, created_at: true }
  });
  return {
    participant,
    practice: { id: practice.id, externalId: practice.external_id ?? null, title: practice.practice_templates?.title ?? practice.title, startDate: practice.start_date, endDate: practice.end_date },
    total: items.length,
    items: items.map(item => ({ id: item.id, checkinDate: item.checkin_date, mood: item.mood, note: item.note, imageUrls: item.image_urls, createdAt: item.created_at }))
  };
};

/** 訊息紀錄 modal（FR-TF-05）：與某參與者的往來，由新到舊 */
const listMessages = async (programId: number, cohortId: number, actorId: number, userId: number) => {
  await assertCoach(programId, cohortId, actorId);
  const participant = await assertParticipant(cohortId, userId);
  const rows = await prisma.cohort_messages.findMany({ where: { cohort_id: cohortId, recipient_user_id: userId }, orderBy: { sent_at: 'desc' }, select: messageSelect });
  return { participant, total: rows.length, items: rows.map(mapMessage) };
};

/** 送出鼓勵／訊息（FR-TF-06）：存 cohort_messages（帶 practiceId 時同步寫成該實踐的留言）、發 in-app 通知、寫審計 */
const sendMessage = async (programId: number, cohortId: number, actorId: number, userId: number, input: SendCohortMessageInput) => {
  const cohort = await assertCoach(programId, cohortId, actorId);
  await assertParticipant(cohortId, userId);
  if (input.practiceId) {
    const practice = await prisma.practices.findFirst({ where: { id: input.practiceId, cohort_id: cohortId, user_id: userId, deleted_at: null }, select: { id: true } });
    if (!practice) throw new NotFoundError('找不到此參與者的實踐');
  }
  if (input.templateId) {
    const template = await prisma.cohort_message_templates.findFirst({ where: { id: input.templateId, organization_id: cohort.program.organization_id, deleted_at: null }, select: { id: true } });
    if (!template) throw new NotFoundError('找不到此訊息範本');
  }
  const created = await prisma.$transaction(async tx => {
    const row = await tx.cohort_messages.create({
      data: { cohort_id: cohortId, sender_user_id: actorId, recipient_user_id: userId, practice_id: input.practiceId ?? null, template_id: input.templateId ?? null, category: input.category, body: input.body },
      select: messageSelect
    });
    // 選了實踐就同時留在該實踐的留言串（daodao#344），學員在實踐頁就看得到；
    // 與打卡鼓勵（cohort-encouragement）一樣是私密留言：只有實踐擁有者（學員）與帶領人可見
    if (input.practiceId) {
      await tx.comments.create({
        data: { target_type: 'practice', target_id: input.practiceId, user_id: actorId, content: input.body, visibility: 'private', parent_id: null }
      });
    }
    await tx.$executeRaw`
      INSERT INTO audit_logs (admin_id, action_type, target_resource, target_id, new_value)
      VALUES (${actorId}, ${LIGHTHOUSE_AUDIT_ACTIONS.COHORT_MESSAGE_SENT}, 'cohort', ${String(cohortId)},
              ${JSON.stringify({ messageId: row.id, recipientUserId: userId, category: input.category, practiceId: input.practiceId ?? null })}::jsonb)
    `;
    return row;
  });
  await notificationEventService.createEvent({
    type: NOTIFICATION_TYPES.COHORT_MESSAGE,
    actorId,
    recipientId: userId,
    entityType: 'cohort',
    entityId: cohortId,
    payload: { message: `帶領人在「${cohort.display_name}」給你留了一則${input.category === 'celebrate' ? '慶祝' : '鼓勵'}訊息。`, messageId: created.id, category: input.category, preview: input.body.slice(0, 80) },
    priority: 'P1'
  });
  return mapMessage(created);
};

const templateSelect = { id: true, organization_id: true, created_by: true, category: true, title: true, body: true, created_at: true, updated_at: true } as const;
const mapTemplate = (row: { id: number; organization_id: number; created_by: number | null; category: string; title: string; body: string; created_at: Date; updated_at: Date | null }) => ({
  id: row.id, organizationId: row.organization_id, createdBy: row.created_by, category: asCategory(row.category), title: row.title, body: row.body, createdAt: row.created_at, updatedAt: row.updated_at
});
const listTemplates = async (organizationId: number, actorId: number, category?: CohortMessageCategory) => {
  await assertOrganization(organizationId, actorId);
  const rows = await prisma.cohort_message_templates.findMany({ where: { organization_id: organizationId, deleted_at: null, ...(category && { category }) }, orderBy: [{ category: 'asc' }, { created_at: 'asc' }], select: templateSelect });
  return rows.map(mapTemplate);
};
const createTemplate = async (organizationId: number, actorId: number, input: CreateCohortMessageTemplateInput) => {
  await assertOrganization(organizationId, actorId);
  return mapTemplate(await prisma.cohort_message_templates.create({ data: { organization_id: organizationId, created_by: actorId, category: input.category, title: input.title, body: input.body }, select: templateSelect }));
};
/** 刪除範本＝軟刪；已送出訊息的 template_id 仍可回溯 */
const deleteTemplate = async (organizationId: number, actorId: number, templateId: number): Promise<void> => {
  await assertOrganization(organizationId, actorId);
  const existing = await prisma.cohort_message_templates.findFirst({ where: { id: templateId, organization_id: organizationId, deleted_at: null }, select: { id: true } });
  if (!existing) throw new NotFoundError('找不到此訊息範本');
  await prisma.cohort_message_templates.update({ where: { id: templateId }, data: { deleted_at: new Date(), updated_at: new Date() } });
};
export const cohortMessageService = { listCheckins, listMessages, sendMessage, listTemplates, createTemplate, deleteTemplate };
