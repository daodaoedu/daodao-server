import { prismaMock, setupTransactionMock } from '@tests/utils/prisma-mock';
jest.mock('@/services/database/prisma.service', () => ({ prisma: prismaMock }));
const aiPost = jest.fn();
let aiConfigured = true;
jest.mock('@/services/ai-backend.client', () => {
  class AiBackendError extends Error { constructor(public readonly code: string, message: string, public readonly status: number | null = null) { super(message); } }
  return { AiBackendError, aiBackendClient: { post: (...args: unknown[]): unknown => aiPost(...args), isConfigured: (): boolean => aiConfigured } };
});
const resolveApiKey = jest.fn();
jest.mock('@/services/organization-ai-credential.service', () => ({ organizationAiCredentialService: { resolveApiKey: (...args: unknown[]): unknown => resolveApiKey(...args) } }));
import { cohortOutcomeService } from '@/services/cohort-outcome.service';
import { ConflictError, NotFoundError, TooManyRequestsError } from '@/middleware/error.middleware';

const now = new Date('2026-09-11T12:00:00.000Z');
const cohort = { id: 8, display_name: '夏季團', start_date: new Date('2026-07-01T00:00:00.000Z'), end_date: new Date('2026-08-31T00:00:00.000Z'), program: { name: '自主學習', organization_id: 1, organization: { timezone: 'Asia/Taipei', organization_members: [{ id: 1 }] } } };
const allow = (override: Partial<typeof cohort> = {}) => prismaMock.cohorts.findFirst.mockResolvedValue({ ...cohort, ...override } as never);
const summaryRow = (version: number, source = 'manual') => ({ id: version, version, source, content: `v${version}`, provider: null, model_name: null, generated_at: null, is_current: true, created_at: now, creator: { id: 42, nickname: '帶領人' } });

describe('cohortOutcomeService', () => {
  beforeEach(() => { setupTransactionMock(); aiPost.mockReset(); resolveApiKey.mockReset(); aiConfigured = true; });

  it('derives the phase from the cohort dates in the organization timezone', () => {
    expect(cohortOutcomeService.resolvePhase(cohort, 'Asia/Taipei', now)).toBe('ended');
    expect(cohortOutcomeService.resolvePhase({ ...cohort, end_date: new Date('2026-09-30T00:00:00.000Z') }, 'Asia/Taipei', now)).toBe('in_progress');
    expect(cohortOutcomeService.resolvePhase({ ...cohort, start_date: new Date('2026-10-01T00:00:00.000Z') }, 'Asia/Taipei', now)).toBe('not_started');
  });

  it('assembles overview, practice outcomes, participant progress, summary versions and AI availability from live queries', async () => {
    allow();
    prismaMock.$queryRaw
      .mockResolvedValueOnce([{ participants: 12n, activated: 9n, checkins: 40n, comments: 7n }] as never)
      .mockResolvedValueOnce([{ title: '晨間書寫', participants: 10n, started: 9n, completed: 3n, checkins: 40n, comments: 7n }] as never)
      .mockResolvedValueOnce([{ user_id: 5, nickname: '小明', avatar: null, practice_id: 7, practice_title: '晨間書寫', practice_status: 'in_progress', checkin_count: 9n, response_count: 2n, target_count: 12, progress: 75.5, last_checkin_at: new Date('2026-08-20T00:00:00.000Z'), last_response_at: new Date('2026-08-21T00:00:00.000Z') }] as never);
    prismaMock.cohort_outcome_summaries.findMany.mockResolvedValue([summaryRow(2, 'platform_ai'), { ...summaryRow(1), is_current: false }] as never);
    prismaMock.organization_ai_credentials.findUnique.mockResolvedValue({ status: 'verified', provider: 'openai', key_last4: 'ABCD' } as never);
    prismaMock.cohort_stat_snapshots.findFirst.mockResolvedValue({ computed_at: new Date('2026-09-01T00:00:00.000Z') } as never);
    prismaMock.cohort_outcome_summaries.count.mockResolvedValue(1);
    const result = await cohortOutcomeService.get(2, 8, 42, now);
    expect(result.phase).toBe('ended');
    expect(result.finalizedAt).toEqual(new Date('2026-09-01T00:00:00.000Z'));
    expect(result.overview).toEqual({ participants: 12, activatedPractices: 9, checkins: 40, comments: 7 });
    expect(result.practiceOutcomes).toEqual([{ title: '晨間書寫', participants: 10, started: 9, completed: 3, checkins: 40, comments: 7 }]);
    expect(result.participantProgress[0]).toEqual(expect.objectContaining({ nickname: '小明', completedCount: 9, targetCount: 12, progressPercentage: 76, responseCount: 2, lastActivityAt: new Date('2026-08-21T00:00:00.000Z') }));
    expect(result.summary.current).toEqual(expect.objectContaining({ version: 2, source: 'platform_ai' }));
    expect(result.summary.versions).toHaveLength(2);
    expect(result.ai).toEqual({ platformAvailable: true, ownKey: { status: 'verified', provider: 'openai', keyLast4: 'ABCD' }, platformDailyLimit: 5, platformUsedToday: 1 });
    expect(JSON.stringify(result)).not.toMatch(/absent|ranking|rank/);
  });

  it('404s on unknown cohorts', async () => {
    prismaMock.cohorts.findFirst.mockResolvedValue(null);
    await expect(cohortOutcomeService.get(2, 99, 42, now)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('blocks own-key mode until the organization key is set, and invalid keys with a clear message', async () => {
    allow();
    prismaMock.organization_ai_credentials.findUnique.mockResolvedValue(null);
    await expect(cohortOutcomeService.generateSummary(2, 8, 42, { mode: 'own' }, 'jwt', now)).rejects.toThrow('請先到組織設定完成 AI API key 設定');
    prismaMock.organization_ai_credentials.findUnique.mockResolvedValue({ status: 'invalid' } as never);
    await expect(cohortOutcomeService.generateSummary(2, 8, 42, { mode: 'own' }, 'jwt', now)).rejects.toBeInstanceOf(ConflictError);
    expect(aiPost).not.toHaveBeenCalled();
  });

  it('enforces the platform daily limit per cohort', async () => {
    allow();
    prismaMock.cohort_outcome_summaries.count.mockResolvedValue(5);
    await expect(cohortOutcomeService.generateSummary(2, 8, 42, { mode: 'platform' }, 'jwt', now)).rejects.toBeInstanceOf(TooManyRequestsError);
    expect(aiPost).not.toHaveBeenCalled();
  });

  it('sends anonymised checkins and public comments to ai-backend with the own key, then stores a new current version', async () => {
    allow();
    prismaMock.organization_ai_credentials.findUnique.mockResolvedValue({ status: 'set' } as never);
    resolveApiKey.mockResolvedValue({ provider: 'openai', apiKey: 'sk-own-key' });
    prismaMock.practice_checkins.findMany
      .mockResolvedValueOnce([{ user_id: 5, note: '今天讀了兩頁', mood: 'good', created_at: new Date('2026-08-02T00:00:00.000Z'), practices: { title: '個人標題', practice_templates: { title: '晨間書寫' } } }, { user_id: 6, note: '寫了三行', mood: null, created_at: new Date('2026-08-01T00:00:00.000Z'), practices: { title: '晨間書寫', practice_templates: null } }] as never)
      .mockResolvedValueOnce([{ id: 100, practices: { title: '晨間書寫', practice_templates: null } }] as never);
    prismaMock.comments.findMany.mockResolvedValue([{ user_id: 2, content: '寫得很好', created_at: new Date('2026-08-03T00:00:00.000Z'), target_id: 100 }, { user_id: 2, content: '不在本場次', created_at: now, target_id: 999 }] as never);
    prismaMock.$queryRaw.mockResolvedValueOnce([{ participants: 2n, checkins: 2n }] as never);
    aiPost.mockResolvedValue({ summary: '  這一期大家很投入。  ', provider: 'openai', model: 'gpt-4o-mini', usage: { tokens: 321 } });
    prismaMock.cohort_outcome_summaries.findFirst.mockResolvedValue({ version: 3 } as never);
    prismaMock.cohort_outcome_summaries.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.cohort_outcome_summaries.create.mockImplementation((async (args: { data: Record<string, unknown> }) => ({ ...summaryRow(4, 'own_ai'), content: args.data.content, provider: args.data.provider, model_name: args.data.model_name, generated_at: args.data.generated_at })) as never);

    const version = await cohortOutcomeService.generateSummary(2, 8, 42, { mode: 'own' }, 'jwt-token', now);
    const [path, body, options] = aiPost.mock.calls[0] as [string, { entries: Array<Record<string, unknown>>; apiKey?: string; provider?: string; cohort: Record<string, unknown> }, { userToken: string }];
    expect(path).toBe('/api/v1/cohort-summary/generate');
    expect(options.userToken).toBe('jwt-token');
    expect(body.apiKey).toBe('sk-own-key');
    expect(body.cohort).toEqual(expect.objectContaining({ name: '夏季團', phase: 'ended', participants: 2 }));
    expect(body.entries.map(entry => entry.participant)).toEqual(['參與者 2', '參與者 1', '參與者 3']);
    expect(body.entries.some(entry => entry.text === '不在本場次')).toBe(false);
    expect(JSON.stringify(body)).not.toContain('小明');
    expect(prismaMock.cohort_outcome_summaries.updateMany).toHaveBeenCalledWith({ where: { cohort_id: 8, is_current: true }, data: { is_current: false } });
    expect(prismaMock.cohort_outcome_summaries.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ version: 4, source: 'own_ai', content: '這一期大家很投入。', provider: 'openai', model_name: 'gpt-4o-mini', created_by: 42 }) }));
    expect(version).toEqual(expect.objectContaining({ version: 4, source: 'own_ai', content: '這一期大家很投入。', isCurrent: true }));
  });

  it('turns ai-backend failures into 409 / 429 instead of 500', async () => {
    allow();
    prismaMock.cohort_outcome_summaries.count.mockResolvedValue(0);
    // collectSummaryInput 每次呼叫會打兩次 findMany（筆記、對照表）；兩輪嘗試共四次
    prismaMock.practice_checkins.findMany.mockImplementation((async (args: { select?: { note?: boolean } }) => (args.select?.note ? [{ user_id: 5, note: 'x', mood: null, created_at: now, practices: { title: 't', practice_templates: null } }] : [])) as never);
    prismaMock.comments.findMany.mockResolvedValue([] as never);
    prismaMock.$queryRaw.mockResolvedValue([{ participants: 1n, checkins: 1n }] as never);
    const { AiBackendError } = jest.requireMock('@/services/ai-backend.client') as { AiBackendError: new (code: string, message: string) => Error };
    aiPost.mockRejectedValueOnce(new AiBackendError('rate_limited', '太頻繁'));
    await expect(cohortOutcomeService.generateSummary(2, 8, 42, { mode: 'platform' }, null, now)).rejects.toBeInstanceOf(TooManyRequestsError);
    aiPost.mockRejectedValueOnce(new AiBackendError('timeout', '逾時'));
    await expect(cohortOutcomeService.generateSummary(2, 8, 42, { mode: 'platform' }, null, now)).rejects.toBeInstanceOf(ConflictError);
  });

  it('stores a manual edit as a new version and rejects blank content', async () => {
    allow();
    prismaMock.cohort_outcome_summaries.findFirst.mockResolvedValue({ version: 1 } as never);
    prismaMock.cohort_outcome_summaries.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.cohort_outcome_summaries.create.mockResolvedValue({ ...summaryRow(2), content: '人工修訂' } as never);
    const version = await cohortOutcomeService.editSummary(2, 8, 42, { content: '  人工修訂  ' });
    expect(version).toEqual(expect.objectContaining({ version: 2, source: 'manual', content: '人工修訂' }));
    expect(prismaMock.cohort_outcome_summaries.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ version: 2, source: 'manual', content: '人工修訂', prompt_version: null }) }));
    await expect(cohortOutcomeService.editSummary(2, 8, 42, { content: '   ' })).rejects.toBeInstanceOf(ConflictError);
  });

  it('records a PDF export with the FRD filename rule', async () => {
    allow();
    const result = await cohortOutcomeService.recordReportExport(2, 8, 42, undefined, now);
    expect(result.filename).toBe('夏季團_成果報告_20260911.pdf');
    expect(prismaMock.$executeRaw).toHaveBeenCalled();
  });
});
