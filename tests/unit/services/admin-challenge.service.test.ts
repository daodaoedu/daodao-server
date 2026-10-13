import { prismaMock, setupTransactionMock } from '@tests/utils/prisma-mock';

jest.mock('@/services/database/prisma.service', () => ({ prisma: prismaMock }));

const OFFICIAL_ORG_ID = 1;
const mockGetOrganizationId = jest.fn<Promise<number>, []>();
const mockGetActiveOrganizationId = jest.fn<Promise<number>, []>();
jest.mock('@/services/challenge-organization.service', () => ({
  challengeOrganizationService: {
    getOrganizationId: () => mockGetOrganizationId(),
    getActiveOrganizationId: () => mockGetActiveOrganizationId()
  }
}));

import { ConflictError } from '@/middleware/error.middleware';
import { adminChallengeService, computeEndDate } from '@/services/admin-challenge.service';

beforeEach(() => {
  mockGetOrganizationId.mockResolvedValue(OFFICIAL_ORG_ID);
  mockGetActiveOrganizationId.mockResolvedValue(OFFICIAL_ORG_ID);
});

const programRow = (overrides: Record<string, unknown> = {}) => ({
  id: 10, organization_id: 1, name: '晨間書寫', description: null,
  created_at: new Date('2026-08-01T00:00:00.000Z'), updated_at: null,
  organization: { name: '島島阿學' },
  cohorts: [],
  ...overrides
});

const cohortRow = (overrides: Record<string, unknown> = {}) => ({
  id: 6, program_id: 10, slug: 'challenge-2026-09-01-ab12', display_name: '21 天晨間書寫',
  start_date: new Date('2026-09-01T00:00:00.000Z'), end_date: new Date('2026-09-21T00:00:00.000Z'),
  join_deadline: null, capacity: null, status: 'draft',
  created_at: new Date('2026-08-01T00:00:00.000Z'), updated_at: null,
  cohort_templates: [{ template_id: 1, practice_template: { title: '晨間書寫模板', duration_days: 21 } }],
  inspiration_deck_assignments: [],
  _count: { cohort_enrollments: 0 },
  ...overrides
});

describe('computeEndDate', () => {
  it('含頭尾共 durationDays 天', () => {
    expect(computeEndDate(new Date('2026-09-01T00:00:00.000Z'), 21).toISOString()).toBe('2026-09-21T00:00:00.000Z');
  });
});

describe('adminChallengeService.listPrograms', () => {
  it('回傳主題並統計未封存與已發佈的期數', async () => {
    prismaMock.programs.findMany.mockResolvedValue([
      programRow({ cohorts: [{ status: 'draft' }, { status: 'published' }, { status: 'archived' }] })
    ] as never);
    const result = await adminChallengeService.listPrograms();
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: 10, organizationName: '島島阿學', cohortCount: 2, publishedCohortCount: 1 });
    expect(prismaMock.programs.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ kind: 'challenge', deleted_at: null }) }));
  });

  it('#179 只列島島阿學組織底下的主題，不列其他組織', async () => {
    prismaMock.programs.findMany.mockResolvedValue([] as never);
    await adminChallengeService.listPrograms();
    expect(prismaMock.programs.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ organization_id: OFFICIAL_ORG_ID }) }));
  });
});

describe('adminChallengeService.createProgram', () => {
  it('以 kind=challenge 建立在島島阿學組織底下', async () => {
    prismaMock.programs.create.mockResolvedValue(programRow() as never);
    await adminChallengeService.createProgram({ name: '晨間書寫' });
    expect(prismaMock.programs.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ kind: 'challenge', organization_id: OFFICIAL_ORG_ID })
    }));
  });

  it('#179 client 夾帶其他組織 ID 也一律建在島島阿學組織，且不查其他組織的停權狀態', async () => {
    prismaMock.programs.create.mockResolvedValue(programRow() as never);
    await adminChallengeService.createProgram({ organizationId: 3, name: 'PM 驗收 #179' } as never);
    expect(prismaMock.programs.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ organization_id: OFFICIAL_ORG_ID }) }));
    expect(prismaMock.organization.findUnique).not.toHaveBeenCalled();
  });

  it('島島阿學組織無法使用（未設定或停權）時不建立主題', async () => {
    mockGetActiveOrganizationId.mockRejectedValue(new ConflictError('島島阿學組織目前已停權，無法建立挑戰'));
    await expect(adminChallengeService.createProgram({ name: 'x' })).rejects.toMatchObject({ statusCode: 409 });
    expect(prismaMock.programs.create).not.toHaveBeenCalled();
  });
});

describe('#179 島島阿學組織停權時不可新增任何挑戰（含複製）', () => {
  beforeEach(() => {
    setupTransactionMock();
    mockGetActiveOrganizationId.mockRejectedValue(new ConflictError('島島阿學組織目前已停權，無法建立挑戰'));
    prismaMock.programs.findFirst.mockResolvedValue(programRow() as never);
    prismaMock.cohorts.findFirst.mockResolvedValue(cohortRow() as never);
  });

  it('複製主題 → 409，不建立', async () => {
    await expect(adminChallengeService.duplicateProgram(10)).rejects.toMatchObject({ statusCode: 409 });
    expect(prismaMock.programs.create).not.toHaveBeenCalled();
  });

  it('新增一期 → 409，不建立', async () => {
    await expect(adminChallengeService.createCohort(10, { displayName: 'x', startDate: '2026-09-01', endDate: '2026-09-10' })).rejects.toMatchObject({ statusCode: 409 });
    expect(prismaMock.cohorts.create).not.toHaveBeenCalled();
  });

  it('複製一期 → 409，不建立', async () => {
    await expect(adminChallengeService.duplicateCohort(10, 6)).rejects.toMatchObject({ statusCode: 409 });
    expect(prismaMock.cohorts.create).not.toHaveBeenCalled();
  });
});

describe('adminChallengeService program 範圍', () => {
  it('#179 其他組織的挑戰主題視為不存在（404），不可在其底下操作', async () => {
    prismaMock.programs.findFirst.mockResolvedValue(null as never);
    await expect(adminChallengeService.listCohorts(10)).rejects.toMatchObject({ statusCode: 404 });
    expect(prismaMock.programs.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ id: 10, organization_id: OFFICIAL_ORG_ID }) }));
  });
});

describe('adminChallengeService templates', () => {
  it('#179 列表只回島島阿學組織的模板', async () => {
    prismaMock.practice_templates.findMany.mockResolvedValue([] as never);
    await adminChallengeService.listTemplates();
    expect(prismaMock.practice_templates.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { organization_id: OFFICIAL_ORG_ID } }));
  });

  it('#179 建立模板一律落在島島阿學組織（忽略 client 夾帶的組織 ID）', async () => {
    prismaMock.practice_templates.create.mockRejectedValue(new Error('stop after create args'));
    await expect(adminChallengeService.createTemplate({ organizationId: 3, title: 't', practiceTimePeriods: [] } as never, 99)).rejects.toThrow('stop after create args');
    expect(prismaMock.practice_templates.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ organization_id: OFFICIAL_ORG_ID }) }));
  });

  it('#179 其他組織的模板不可修改（404）', async () => {
    prismaMock.practice_templates.findFirst.mockResolvedValue(null as never);
    await expect(adminChallengeService.updateTemplate(36, { title: 'x' }, 99)).rejects.toMatchObject({ statusCode: 404 });
    expect(prismaMock.practice_templates.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ id: 36, organization_id: OFFICIAL_ORG_ID }) }));
  });
});

describe('adminChallengeService.archiveProgram', () => {
  it('底下仍有未封存的期時拒絕', async () => {
    prismaMock.programs.findFirst.mockResolvedValue(programRow({ cohorts: [{ status: 'published' }] }) as never);
    await expect(adminChallengeService.archiveProgram(10)).rejects.toMatchObject({ statusCode: 409 });
  });
});

describe('adminChallengeService.createCohort', () => {
  beforeEach(() => setupTransactionMock());

  it('綁定有持續天數的模板時結束日由推算決定，並同步綁定開始日', async () => {
    prismaMock.programs.findFirst.mockResolvedValue(programRow() as never);
    prismaMock.practice_templates.findFirst.mockResolvedValue({ id: 1, duration_days: 21 } as never);
    prismaMock.cohorts.create.mockResolvedValue({ id: 6 } as never);
    prismaMock.cohort_templates.updateMany.mockResolvedValue({ count: 0 } as never);
    prismaMock.cohort_templates.upsert.mockResolvedValue({} as never);
    prismaMock.cohorts.findFirst.mockResolvedValue(cohortRow() as never);

    const result = await adminChallengeService.createCohort(10, { displayName: '21 天晨間書寫', startDate: '2026-09-01', endDate: '2026-12-31', templateId: 1 }, new Date('2026-08-28T00:00:00.000Z'));

    expect(prismaMock.cohorts.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'draft', end_date: new Date('2026-09-21T00:00:00.000Z'), join_token: null })
    }));
    expect(prismaMock.cohort_templates.upsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({ cohort_id: 6, template_id: 1, start_date: new Date('2026-09-01T00:00:00.000Z') })
    }));
    expect(result).toMatchObject({ id: 6, runStatus: 'upcoming', template: { id: 1, durationDays: 21 } });
  });

  it('模板沒有持續天數又沒給結束日 → 400', async () => {
    prismaMock.programs.findFirst.mockResolvedValue(programRow() as never);
    prismaMock.practice_templates.findFirst.mockResolvedValue({ id: 1, duration_days: null } as never);
    await expect(adminChallengeService.createCohort(10, { displayName: 'x', startDate: '2026-09-01', templateId: 1 })).rejects.toMatchObject({ statusCode: 400 });
  });

  // daodao#300 AC-01：共同挑戰 FRD FR-CC-03 期間 91 天內，91 天（含頭尾）可建立
  it('期間剛好 91 天（含頭尾）可建立', async () => {
    prismaMock.programs.findFirst.mockResolvedValue(programRow() as never);
    prismaMock.practice_templates.findFirst.mockResolvedValue({ id: 1, duration_days: null } as never);
    prismaMock.cohorts.create.mockResolvedValue({ id: 6 } as never);
    prismaMock.cohort_templates.updateMany.mockResolvedValue({ count: 0 } as never);
    prismaMock.cohort_templates.upsert.mockResolvedValue({} as never);
    prismaMock.cohorts.findFirst.mockResolvedValue(cohortRow({ end_date: new Date('2026-11-30T00:00:00.000Z') }) as never);

    await adminChallengeService.createCohort(10, { displayName: '91 天挑戰', startDate: '2026-09-01', endDate: '2026-11-30', templateId: 1 }, new Date('2026-08-28T00:00:00.000Z'));

    expect(prismaMock.cohorts.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ start_date: new Date('2026-09-01T00:00:00.000Z'), end_date: new Date('2026-11-30T00:00:00.000Z') })
    }));
  });

  // daodao#300 AC-02：92 天以上在後台建立時被擋，訊息要講清楚上限與實際天數
  it('期間 92 天（含頭尾）→ 400，訊息寫明上限 91 天與實際天數', async () => {
    prismaMock.programs.findFirst.mockResolvedValue(programRow() as never);
    prismaMock.practice_templates.findFirst.mockResolvedValue({ id: 1, duration_days: null } as never);
    await expect(adminChallengeService.createCohort(10, { displayName: '92 天挑戰', startDate: '2026-09-01', endDate: '2026-12-01', templateId: 1 }))
      .rejects.toMatchObject({ statusCode: 400, message: '挑戰期間最多 91 天（目前為 92 天），請調整開始日或結束日' });
    expect(prismaMock.cohorts.create).not.toHaveBeenCalled();
  });

  it('未綁模板、只給起訖日時同樣受 91 天上限約束', async () => {
    prismaMock.programs.findFirst.mockResolvedValue(programRow() as never);
    await expect(adminChallengeService.createCohort(10, { displayName: '半年挑戰', startDate: '2026-09-01', endDate: '2027-02-28' }))
      .rejects.toMatchObject({ statusCode: 400, message: expect.stringContaining('最多 91 天') });
  });
});

describe('adminChallengeService.updateCohort', () => {
  beforeEach(() => setupTransactionMock());

  it('已有人加入後不可改期間或模板', async () => {
    prismaMock.programs.findFirst.mockResolvedValue(programRow() as never);
    prismaMock.cohorts.findFirst.mockResolvedValue(cohortRow({ status: 'published', _count: { cohort_enrollments: 3 } }) as never);
    await expect(adminChallengeService.updateCohort(10, 6, { startDate: '2026-09-02' })).rejects.toMatchObject({ statusCode: 409 });
    await expect(adminChallengeService.updateCohort(10, 6, { templateId: 2 })).rejects.toMatchObject({ statusCode: 409 });
  });

  it('已有人加入仍可改名稱與名額；沿用既有綁定時不重新驗證模板組織（既有綁定可能是平台共用模板）', async () => {
    prismaMock.programs.findFirst.mockResolvedValue(programRow() as never);
    prismaMock.cohorts.findFirst.mockResolvedValue(cohortRow({ status: 'published', _count: { cohort_enrollments: 3 } }) as never);
    prismaMock.practice_templates.findFirst.mockResolvedValue(null as never);
    prismaMock.cohorts.update.mockResolvedValue({} as never);
    prismaMock.cohort_templates.updateMany.mockResolvedValue({ count: 0 } as never);
    prismaMock.cohort_templates.upsert.mockResolvedValue({} as never);
    await adminChallengeService.updateCohort(10, 6, { displayName: '新名稱', capacity: 50 });
    expect(prismaMock.cohorts.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ display_name: '新名稱', capacity: 50 }) }));
  });

  it('純改名稱／名額不重算結束日（即使模板天數與現有期間不一致）', async () => {
    prismaMock.programs.findFirst.mockResolvedValue(programRow() as never);
    prismaMock.cohorts.findFirst.mockResolvedValue(cohortRow({ cohort_templates: [{ template_id: 1, practice_template: { title: 't', duration_days: 7 } }] }) as never);
    prismaMock.cohorts.update.mockResolvedValue({} as never);
    prismaMock.cohort_templates.updateMany.mockResolvedValue({ count: 0 } as never);
    prismaMock.cohort_templates.upsert.mockResolvedValue({} as never);
    await adminChallengeService.updateCohort(10, 6, { capacity: 50 });
    expect(prismaMock.cohorts.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ end_date: new Date('2026-09-21T00:00:00.000Z') }) }));
  });

  it('改開始日時依模板持續天數重算結束日', async () => {
    prismaMock.programs.findFirst.mockResolvedValue(programRow() as never);
    prismaMock.cohorts.findFirst.mockResolvedValue(cohortRow() as never);
    prismaMock.cohorts.update.mockResolvedValue({} as never);
    prismaMock.cohort_templates.updateMany.mockResolvedValue({ count: 0 } as never);
    prismaMock.cohort_templates.upsert.mockResolvedValue({} as never);
    await adminChallengeService.updateCohort(10, 6, { startDate: '2026-10-01' });
    expect(prismaMock.cohorts.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ start_date: new Date('2026-10-01T00:00:00.000Z'), end_date: new Date('2026-10-21T00:00:00.000Z') }) }));
    expect(prismaMock.cohort_templates.upsert).toHaveBeenCalledWith(expect.objectContaining({ update: expect.objectContaining({ start_date: new Date('2026-10-01T00:00:00.000Z') }) }));
  });
});

describe('adminChallengeService.setCohortStatus', () => {
  it('未綁定模板不可發佈', async () => {
    prismaMock.cohorts.findFirst.mockResolvedValue(cohortRow({ cohort_templates: [] }) as never);
    await expect(adminChallengeService.setCohortStatus(10, 6, 'published')).rejects.toMatchObject({ statusCode: 409 });
  });

  it('已結束的挑戰不可發佈', async () => {
    prismaMock.cohorts.findFirst.mockResolvedValue(cohortRow() as never);
    await expect(adminChallengeService.setCohortStatus(10, 6, 'published', new Date('2026-10-01T00:00:00.000Z'))).rejects.toMatchObject({ statusCode: 409 });
  });

  it('條件齊全即可發佈', async () => {
    prismaMock.cohorts.findFirst.mockResolvedValue(cohortRow() as never);
    prismaMock.cohorts.update.mockResolvedValue({} as never);
    await adminChallengeService.setCohortStatus(10, 6, 'published', new Date('2026-08-28T00:00:00.000Z'));
    expect(prismaMock.cohorts.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: 'published' }) }));
  });
});

describe('adminChallengeService.listParticipants', () => {
  it('依加入時間排序並附上實踐與打卡數', async () => {
    prismaMock.cohorts.findFirst.mockResolvedValue(cohortRow() as never);
    prismaMock.cohort_enrollments.findMany.mockResolvedValue([
      { id: 26, user_id: 325, joined_at: new Date('2026-08-27T00:00:00.000Z'), user: { nickname: '小島' } }
    ] as never);
    prismaMock.practices.findMany.mockResolvedValue([
      { user_id: 325, external_id: 'uuid-1', _count: { practice_checkins: 2 } }
    ] as never);
    const result = await adminChallengeService.listParticipants(10, 6);
    expect(result).toEqual([{ enrollmentId: 26, userId: 325, nickname: '小島', joinedAt: new Date('2026-08-27T00:00:00.000Z'), practiceId: 'uuid-1', checkinCount: 2 }]);
    expect(prismaMock.cohort_enrollments.findMany).toHaveBeenCalledWith(expect.objectContaining({ orderBy: { joined_at: 'asc' } }));
  });
});

describe('adminChallengeService.duplicateCohort', () => {
  it('來源期間超過 91 天（#300 之前建立的舊挑戰）→ 400，不建立副本', async () => {
    // 2026-09-01～2026-12-09 含頭尾 100 天
    prismaMock.cohorts.findFirst.mockResolvedValue(cohortRow({ end_date: new Date('2026-12-09T00:00:00.000Z') }) as never);
    await expect(adminChallengeService.duplicateCohort(10, 6))
      .rejects.toMatchObject({ statusCode: 400, message: '挑戰期間最多 91 天（目前為 100 天），請調整開始日或結束日' });
    expect(prismaMock.cohorts.create).not.toHaveBeenCalled();
  });
});
