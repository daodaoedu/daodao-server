import { prismaMock, setupTransactionMock } from '@tests/utils/prisma-mock';
jest.mock('../database/prisma.service', () => ({ prisma: prismaMock }));
import { cohortService } from '../cohort.service';
import { createCohortSchema } from '../../validators/cohort.validators';

const groupId = 'd8892fa5-7f59-4d38-9dc9-c1f77b0f5e22';
const rule = { startDate: '2026-11-10', weeks: 4, weekdays: [2, 4] };
const occurrence = {
  id: 11, session_date: new Date('2026-11-10T00:00:00Z'), start_time: new Date('1970-01-01T19:00:00Z'),
  end_time: new Date('1970-01-01T20:00:00Z'), position: 0, recurrence_group_id: groupId, recurrence_rule: rule
};
const row = {
  id: 8, program_id: 2, slug: 'autumn', display_name: '秋季期', timezone: 'America/Los_Angeles',
  start_date: new Date('2026-11-01T00:00:00Z'), end_date: new Date('2026-12-31T00:00:00Z'),
  join_token: null, join_paused: false, join_deadline: null, capacity: null, invite_message: null, tagline: null,
  status: 'draft', visibility: 'private', created_at: new Date('2026-11-01'), updated_at: null,
  interaction_modes: ['sync'], meeting_url: null, location: null, cohort_sessions: [occurrence],
  fee_type: 'free', fee_amount: null, signup_method: 'island_form', external_signup_url: null,
  is_private: false, checkin_default_private: false, host_comment_default_private: false,
  show_invite_message_on_signup: false, program: { organization: { status: 'active' } }
};
const expectedSession = { id: 11, sessionDate: '2026-11-10', startTime: '19:00', endTime: '20:00', recurrenceGroupId: groupId, recurrenceRule: rule };

beforeEach(() => {
  setupTransactionMock();
  prismaMock.programs.findFirst.mockResolvedValue({ id: 2, organization: { status: 'active' } } as never);
  prismaMock.cohorts.findFirst.mockResolvedValue(row as never);
  prismaMock.cohorts.create.mockResolvedValue(row as never);
  prismaMock.cohorts.findUniqueOrThrow.mockResolvedValue(row as never);
  prismaMock.cohort_sessions.findMany.mockResolvedValue([occurrence] as never);
  prismaMock.cohort_templates.findMany.mockResolvedValue([]);
});

describe('cohort schedule persistence behavior', () => {
  it('creates the cohort timezone and stores explicit rules together with local occurrence times', async () => {
    const result = await cohortService.create(2, createCohortSchema.parse({
      slug: 'autumn', displayName: '秋季期', startDate: '2026-11-01', endDate: '2026-12-31',
      timezone: 'America/Los_Angeles', interactionModes: ['sync'], sessions: [expectedSession]
    }), 42);
    expect(prismaMock.cohorts.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ timezone: 'America/Los_Angeles' }) }));
    expect(prismaMock.cohort_sessions.createMany).toHaveBeenCalledWith({ data: [{
      cohort_id: 8, session_date: new Date('2026-11-10T00:00:00Z'), start_time: new Date('1970-01-01T19:00:00Z'),
      end_time: new Date('1970-01-01T20:00:00Z'), position: 0, recurrence_group_id: groupId, recurrence_rule: rule
    }] });
    expect(result).toMatchObject({ timezone: 'America/Los_Angeles', sessions: [expectedSession] });
  });
  it('defaults old create callers to Taipei without inventing recurrence', async () => {
    prismaMock.cohorts.create.mockResolvedValue({ ...row, timezone: 'Asia/Taipei', cohort_sessions: [] } as never);
    const result = await cohortService.create(2, createCohortSchema.parse({ slug: 'autumn', displayName: '秋季期', startDate: '2026-11-01', endDate: '2026-12-31' }), 42);
    expect(prismaMock.cohorts.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ timezone: 'Asia/Taipei' }) }));
    expect(result.timezone).toBe('Asia/Taipei');
    expect(result.sessions).toEqual([]);
  });
  it('changes timezone without rewriting or converting stored wall-clock occurrences', async () => {
    prismaMock.cohorts.findUniqueOrThrow.mockResolvedValue({ ...row, timezone: 'Asia/Tokyo' } as never);
    const result = await cohortService.update(2, 8, { timezone: 'Asia/Tokyo' }, 42);
    expect(result).toMatchObject({ timezone: 'Asia/Tokyo', sessions: [expectedSession] });
    expect(prismaMock.cohort_sessions.deleteMany).not.toHaveBeenCalled();
    expect(prismaMock.cohort_sessions.createMany).not.toHaveBeenCalled();
    expect(prismaMock.cohorts.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ timezone: 'Asia/Tokyo' }) }));
  });
  it('retains explicit recurrence when replacing sessions and keeps manual rows independent', async () => {
    await cohortService.update(2, 8, { sessions: [expectedSession, { sessionDate: '2026-11-17', startTime: '19:00', endTime: '20:00', recurrenceGroupId: null, recurrenceRule: null }] }, 42);
    expect(prismaMock.cohort_sessions.createMany).toHaveBeenCalledWith({ data: [
      expect.objectContaining({ recurrence_group_id: groupId, recurrence_rule: rule }),
      expect.objectContaining({ recurrence_group_id: null, session_date: new Date('2026-11-17T00:00:00Z') })
    ] });
    const write = prismaMock.cohort_sessions.createMany.mock.calls[0]?.[0];
    if (!write) throw new Error('Expected sessions write');
    const manualRow = write.data;
    expect(Array.isArray(manualRow) && manualRow[1]).not.toHaveProperty('recurrence_rule');
  });
  it('duplicates timezone, occurrence values and original recurrence group/rule', async () => {
    const result = await cohortService.duplicate(2, 8, 42);
    expect(prismaMock.cohorts.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ timezone: 'America/Los_Angeles' }) }));
    expect(prismaMock.cohort_sessions.createMany).toHaveBeenCalledWith({ data: [expect.objectContaining({ recurrence_group_id: groupId, recurrence_rule: rule, session_date: occurrence.session_date, start_time: occurrence.start_time, end_time: occurrence.end_time })] });
    expect(result.sessions).toEqual([expectedSession]);
  });
});
