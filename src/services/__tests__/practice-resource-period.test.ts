import { prismaMock, setupTransactionMock } from '@tests/utils/prisma-mock';
jest.mock('../database/prisma.service', () => ({ prisma: prismaMock }));
jest.mock('../logging/logger.service', () => ({ loggerService: { info: jest.fn(), warn: jest.fn(), error: jest.fn() } }));
jest.mock('../../queues', () => ({ enqueuePracticeEmail: jest.fn() }));
import { findById, update } from '../practice.service';
import { updatePracticeSchema } from '../../validators/practice.validators';

const storedPractice = { id: 1, user_id: 42, status: 'draft', deleted_at: null, duration_days: 14, cohort_id: null, template_id: null, creation_source: 'manual' };

describe('practice resource period update', () => {
  beforeEach(() => {
    setupTransactionMock();
    prismaMock.practices.findUnique.mockResolvedValue(storedPractice as never);
    prismaMock.practice_checkins.count.mockResolvedValue(0);
    prismaMock.entity_resources.findMany.mockResolvedValue([{ dayNumber: 10 }] as never);
  });
  it('rejects shortening without a resource payload when an existing date is now outside the period', async () => {
    await expect(update(1, { durationDays: 7 }, 42)).rejects.toMatchObject({ statusCode: 400, errors: { 'resources.0.dayNumber': '請重新選擇實踐期間內的日期' } });
    expect(prismaMock.practices.update).not.toHaveBeenCalled();
    expect(prismaMock.entity_resources.updateMany).not.toHaveBeenCalled();
  });
  it('rejects a new date beyond the stored period when duration is omitted', async () => {
    await expect(update(1, { resources: [{ name: '中文 Resource', dayNumber: 15 }] }, 42)).rejects.toMatchObject({ statusCode: 400 });
    expect(prismaMock.practices.update).not.toHaveBeenCalled();
  });
  it('uses the latest saved period when another edit shortened it after the initial read', async () => {
    prismaMock.practices.findUnique
      .mockResolvedValueOnce(storedPractice as never)
      .mockResolvedValue({ ...storedPractice, duration_days: 7 } as never);
    await expect(update(1, { resources: [{ name: '第十四天', dayNumber: 14 }] }, 42)).rejects.toMatchObject({ statusCode: 400 });
    expect(prismaMock.practices.update).not.toHaveBeenCalled();
    expect(prismaMock.entity_resources.create).not.toHaveBeenCalled();
  });
});


describe('personal resource assigned-day readback', () => {
  const practice = { ...storedPractice, external_id: 'practice-id', title: '閱讀 中文', status: 'not_started', start_date: new Date('2026-11-01'), end_date: new Date('2026-11-14'), practice_time_periods: [], users: { external_id: 'user-id', nickname: '學員', user_positions: [] } };
  const relations = [
    { id: 10, entity_id: 1, resource_id: 20, dayNumber: 2, resources: { id: 20, external_id: 'resource-id', name: '中文 Book', url: '' } },
    { id: 11, entity_id: 1, resource_id: 21, dayNumber: null, resources: { id: 21, external_id: 'all-id', name: '整段', url: '' } }
  ];
  beforeEach(() => {
    setupTransactionMock();
    prismaMock.practices.findUnique.mockResolvedValue(practice as never);
    prismaMock.practices.findMany.mockResolvedValue([practice] as never);
    prismaMock.practices.update.mockResolvedValue(practice as never);
    prismaMock.practice_checkins.count.mockResolvedValue(0);
    prismaMock.practice_checkins.groupBy.mockResolvedValue([]);
    prismaMock.comments.groupBy.mockResolvedValue([]);
    prismaMock.entity_tags.findMany.mockResolvedValue([]);
    prismaMock.entity_resources.findMany.mockResolvedValue(relations as never);
  });
  it('keeps the original 14-day fallback when moving an unknown-duration practice', async () => {
    const unknownPeriod = { ...practice, status: 'active', duration_days: null, end_date: null };
    prismaMock.practices.findUnique.mockResolvedValue(unknownPeriod as never);
    await update(1, { startDate: '2026-11-01' }, 42);
    expect(prismaMock.practices.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ end_date: new Date('2026-11-14') })
    }));
  });
  it.each([false, true])('rejects moving an unknown period when day 30 falls outside the final 14-day period (resources submitted: %s)', async submitResources => {
    prismaMock.practices.findUnique.mockResolvedValue({ ...practice, status: 'active', duration_days: null, end_date: null } as never);
    prismaMock.entity_resources.findMany.mockResolvedValue([{ ...relations[0], dayNumber: 30 }] as never);
    prismaMock.resources.create.mockResolvedValue({ id: 22, external_id: 'day30-resource', name: '第30天資源', url: '' } as never);
    const resources = submitResources ? { resources: [{ name: '第30天資源', dayNumber: 30 }] } : {};
    await expect(update(1, { startDate: '2026-11-01', ...resources }, 42)).rejects.toMatchObject({
      statusCode: 400, errors: { 'resources.0.dayNumber': '請重新選擇實踐期間內的日期' }
    });
    expect(prismaMock.practices.update).not.toHaveBeenCalled();
    expect(prismaMock.entity_resources.updateMany).not.toHaveBeenCalled();
  });
  it('preserves day 30 on metadata edits when the period remains unknown', async () => {
    prismaMock.practices.findUnique.mockResolvedValue({ ...practice, duration_days: null, end_date: null } as never);
    prismaMock.entity_resources.findMany.mockResolvedValue([{ ...relations[0], dayNumber: 30 }] as never);
    const result = await update(1, { title: '只改標題' }, 42);
    expect(result.data.resources?.map(resource => resource.dayNumber)).toEqual([30]);
    expect(prismaMock.entity_resources.updateMany).not.toHaveBeenCalled();
  });
  it('calculates status from the same latest duration as the saved end date', async () => {
    jest.useFakeTimers({ now: new Date('2026-11-15T04:00:00Z') });
    try {
      const oldPeriod = { ...practice, status: 'active', duration_days: 7, end_date: new Date('2026-11-07') };
      prismaMock.practices.findUnique
        .mockResolvedValueOnce(oldPeriod as never)
        .mockResolvedValue({ ...oldPeriod, duration_days: 20, end_date: new Date('2026-11-20') } as never);
      await update(1, { startDate: '2026-11-05' }, 42);
      expect(prismaMock.practices.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ end_date: new Date('2026-11-24'), status: 'active' })
      }));
    } finally {
      jest.useRealTimers();
    }
  });
  it('accepts a resource within the stored period when check-ins make the submitted shorter duration ineffective', async () => {
    prismaMock.practice_checkins.count.mockResolvedValue(1);
    prismaMock.entity_resources.findMany.mockResolvedValue([{ ...relations[0], dayNumber: 10 }] as never);
    prismaMock.resources.create.mockResolvedValue({ id: 22, external_id: 'day10-resource', name: '第10天資源', url: '' } as never);
    const input = { durationDays: 7, resources: [{ name: '第10天資源', dayNumber: 10 }] };
    expect(updatePracticeSchema.safeParse(input).success).toBe(true);
    const result = await update(1, input, 42);
    expect(prismaMock.practices.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.not.objectContaining({ duration_days: expect.anything() })
    }));
    expect(result.data.resources?.map(resource => resource.dayNumber)).toEqual([10]);
  });
  it('GET returns the stored assigned day and whole-period null', async () => {
    const result = await findById(1, 42);
    expect(result.data.resources?.map(resource => ({ name: resource.name, dayNumber: resource.dayNumber }))).toEqual([
      { name: '中文 Book', dayNumber: 2 }, { name: '整段', dayNumber: null }
    ]);
  });
  it('changing only the title preserves both resource dates without rewriting relations', async () => {
    const result = await update(1, { title: '換個標題' }, 42);
    expect(result.data.resources?.map(resource => resource.dayNumber)).toEqual([2, null]);
    expect(prismaMock.entity_resources.updateMany).not.toHaveBeenCalled();
    expect(prismaMock.entity_resources.create).not.toHaveBeenCalled();
  });
  it('rejects a failed date write instead of reporting a successful edit', async () => {
    prismaMock.resources.create.mockResolvedValue({ id: 22, external_id: 'new-id', name: '中文 Book', url: '' } as never);
    prismaMock.entity_resources.create.mockRejectedValue(new Error('relation write failed'));
    await expect(update(1, { resources: [{ name: '中文 Book', dayNumber: 7 }] }, 42)).rejects.toThrow('relation write failed');
  });
  it('explicit date edits persist as a formal field while whole-period clears it', async () => {
    prismaMock.resources.create.mockResolvedValue({ id: 22, external_id: 'new-id', name: '中文 Book', url: '' } as never);
    await update(1, { resources: [{ name: '中文 Book', dayNumber: 7 }, { name: '整段', dayNumber: null }] }, 42);
    expect(prismaMock.entity_resources.create).toHaveBeenCalledWith({ data: { resource_id: 22, entity_type: 'practice', entity_id: 1, created_by: 42, dayNumber: 7 } });
    expect(prismaMock.entity_resources.create).toHaveBeenCalledWith({ data: { resource_id: 22, entity_type: 'practice', entity_id: 1, created_by: 42, dayNumber: null } });
  });
});
