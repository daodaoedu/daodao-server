import { prismaMock, setupTransactionMock } from '@tests/utils/prisma-mock';
jest.mock('@/services/database/prisma.service', () => ({ prisma: prismaMock }));
const createEvent = jest.fn().mockResolvedValue(undefined);
jest.mock('@/services/notification-event.service', () => ({ notificationEventService: { createEvent: (...args: unknown[]): unknown => createEvent(...args) } }));
import { cohortMessageService } from '@/services/cohort-message.service';
import { ForbiddenError, NotFoundError } from '@/middleware/error.middleware';

const cohort = { id: 8, display_name: '2026 春季共學期', program: { organization_id: 1 } };
const enrollment = { user: { id: 77, nickname: '小島', contacts: { photo_url: 'a.png' } } };
const messageRow = { id: 5, cohort_id: 8, recipient_user_id: 77, sender_user_id: 42, practice_id: 31, template_id: null, category: 'encourage', body: '加油', sent_at: new Date('2026-07-22T00:00:00Z'), sender: { nickname: '帶領人' }, practice: { title: '自訂', practice_templates: { title: '每天寫下一件小事' } } };

describe('cohortMessageService', () => {
  beforeEach(() => { setupTransactionMock(); createEvent.mockClear(); });

  it('lists a participant practice check-ins newest first for the drawer', async () => {
    prismaMock.cohorts.findFirst.mockResolvedValue(cohort as never);
    prismaMock.cohort_enrollments.findFirst.mockResolvedValue(enrollment as never);
    prismaMock.practices.findFirst.mockResolvedValue({ id: 31, title: '自訂', start_date: null, end_date: null, practice_templates: { title: '每天寫下一件小事' } } as never);
    prismaMock.practice_checkins.findMany.mockResolvedValue([{ id: 9, checkin_date: new Date('2026-02-24T00:00:00Z'), mood: 'good', note: '只寫了兩行', image_urls: [], created_at: new Date('2026-02-24T10:00:00Z') }] as never);
    const result = await cohortMessageService.listCheckins(2, 8, 42, 77, 31);
    expect(result.participant).toEqual({ userId: 77, nickname: '小島', avatar: 'a.png' });
    expect(result.practice.title).toBe('每天寫下一件小事');
    expect(result.items[0]).toEqual(expect.objectContaining({ id: 9, note: '只寫了兩行', mood: 'good' }));
    expect(prismaMock.practices.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 31, cohort_id: 8, user_id: 77, deleted_at: null } }));
    expect(prismaMock.practice_checkins.findMany).toHaveBeenCalledWith(expect.objectContaining({ orderBy: [{ checkin_date: 'desc' }, { created_at: 'desc' }] }));
  });

  it('404s when the practice does not belong to that participant in this cohort', async () => {
    prismaMock.cohorts.findFirst.mockResolvedValue(cohort as never);
    prismaMock.cohort_enrollments.findFirst.mockResolvedValue(enrollment as never);
    prismaMock.practices.findFirst.mockResolvedValue(null);
    await expect(cohortMessageService.listCheckins(2, 8, 42, 77, 999)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('refuses non-coaches and unknown participants', async () => {
    prismaMock.cohorts.findFirst.mockResolvedValue(null);
    await expect(cohortMessageService.listMessages(2, 8, 42, 77)).rejects.toBeInstanceOf(ForbiddenError);
    prismaMock.cohorts.findFirst.mockResolvedValue(cohort as never);
    prismaMock.cohort_enrollments.findFirst.mockResolvedValue(null);
    await expect(cohortMessageService.listMessages(2, 8, 42, 77)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('sends a message: stores it, audits it and notifies the participant in-app', async () => {
    prismaMock.cohorts.findFirst.mockResolvedValue(cohort as never);
    prismaMock.cohort_enrollments.findFirst.mockResolvedValue(enrollment as never);
    prismaMock.practices.findFirst.mockResolvedValue({ id: 31 } as never);
    prismaMock.cohort_messages.create.mockResolvedValue(messageRow as never);
    const result = await cohortMessageService.sendMessage(2, 8, 42, 77, { category: 'encourage', body: '加油', practiceId: 31 });
    expect(result).toEqual(expect.objectContaining({ id: 5, category: 'encourage', practiceTitle: '每天寫下一件小事', senderNickname: '帶領人' }));
    expect(prismaMock.cohort_messages.create).toHaveBeenCalledWith(expect.objectContaining({ data: { cohort_id: 8, sender_user_id: 42, recipient_user_id: 77, practice_id: 31, template_id: null, category: 'encourage', body: '加油' } }));
    expect(prismaMock.$executeRaw.mock.calls.flat()).toEqual(expect.arrayContaining(['lighthouse.cohort_message_sent', '8']));
    expect(createEvent).toHaveBeenCalledWith(expect.objectContaining({ type: 'CohortMessage', actorId: 42, recipientId: 77, entityType: 'cohort', entityId: 8, priority: 'P1' }));
  });

  it('rejects a template from another organization', async () => {
    prismaMock.cohorts.findFirst.mockResolvedValue(cohort as never);
    prismaMock.cohort_enrollments.findFirst.mockResolvedValue(enrollment as never);
    prismaMock.cohort_message_templates.findFirst.mockResolvedValue(null);
    await expect(cohortMessageService.sendMessage(2, 8, 42, 77, { category: 'celebrate', body: '恭喜', templateId: 3 })).rejects.toBeInstanceOf(NotFoundError);
    expect(prismaMock.cohort_messages.create).not.toHaveBeenCalled();
  });

  it('lists the conversation with a participant newest first', async () => {
    prismaMock.cohorts.findFirst.mockResolvedValue(cohort as never);
    prismaMock.cohort_enrollments.findFirst.mockResolvedValue(enrollment as never);
    prismaMock.cohort_messages.findMany.mockResolvedValue([messageRow] as never);
    const result = await cohortMessageService.listMessages(2, 8, 42, 77);
    expect(result.total).toBe(1);
    expect(prismaMock.cohort_messages.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { cohort_id: 8, recipient_user_id: 77 }, orderBy: { sent_at: 'desc' } }));
  });

  it('manages organization templates: list by category, create, soft delete', async () => {
    prismaMock.organization.findFirst.mockResolvedValue({ status: 'active' } as never);
    const template = { id: 3, organization_id: 1, created_by: 42, category: 'encourage', title: '節奏很穩', body: '繼續加油', created_at: new Date('2026-07-22T00:00:00Z'), updated_at: null };
    prismaMock.cohort_message_templates.findMany.mockResolvedValue([template] as never);
    await expect(cohortMessageService.listTemplates(1, 42, 'encourage')).resolves.toEqual([expect.objectContaining({ id: 3, category: 'encourage', title: '節奏很穩' })]);
    expect(prismaMock.cohort_message_templates.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { organization_id: 1, deleted_at: null, category: 'encourage' } }));
    prismaMock.cohort_message_templates.create.mockResolvedValue(template as never);
    await expect(cohortMessageService.createTemplate(1, 42, { category: 'encourage', title: '節奏很穩', body: '繼續加油' })).resolves.toEqual(expect.objectContaining({ id: 3 }));
    prismaMock.cohort_message_templates.findFirst.mockResolvedValue({ id: 3 } as never);
    prismaMock.cohort_message_templates.update.mockResolvedValue(template as never);
    await cohortMessageService.deleteTemplate(1, 42, 3);
    expect(prismaMock.cohort_message_templates.update).toHaveBeenCalledWith({ where: { id: 3 }, data: { deleted_at: expect.any(Date), updated_at: expect.any(Date) } });
  });

  it('refuses template access for non-members and suspended organizations', async () => {
    prismaMock.organization.findFirst.mockResolvedValue(null);
    await expect(cohortMessageService.listTemplates(1, 42)).rejects.toBeInstanceOf(ForbiddenError);
    prismaMock.organization.findFirst.mockResolvedValue({ status: 'suspended' } as never);
    await expect(cohortMessageService.createTemplate(1, 42, { category: 'celebrate', body: 'x', title: 'y' })).rejects.toBeInstanceOf(ForbiddenError);
  });
});
