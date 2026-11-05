import '../../config/openapi-registry';
import { createCohortSchema, updateCohortSchema } from '../cohort.validators';

const groupId = 'd8892fa5-7f59-4d38-9dc9-c1f77b0f5e22';
const rule = { startDate: '2026-11-10', weeks: 4, weekdays: [2, 4] };
const session = { sessionDate: '2026-11-10', startTime: '19:00', endTime: '20:00', recurrenceGroupId: groupId, recurrenceRule: rule };
const create = { slug: 'schedule', displayName: '聚會', startDate: '2026-11-01', endDate: '2026-12-31' };

describe('cohort schedule request contract', () => {
  it('keeps timezone and recurrence metadata while accepting legacy manual sessions', () => {
    const parsed = createCohortSchema.parse({ ...create, timezone: 'America/Los_Angeles', sessions: [session] });
    expect(parsed).toMatchObject({ timezone: 'America/Los_Angeles', sessions: [session] });
    expect(createCohortSchema.parse(create).timezone).toBeUndefined();
    expect(updateCohortSchema.safeParse({ timezone: 'UTC' }).success).toBe(true);
    expect(updateCohortSchema.parse({ timezone: 'Asia/Tokyo' })).toEqual({ timezone: 'Asia/Tokyo' });
    expect(createCohortSchema.parse({ ...create, sessions: [{ sessionDate: '2026-11-10', startTime: null, endTime: null }] }).sessions).toHaveLength(1);
  });
  it.each(['Not/AZone', '', 'a'.repeat(65), '+01:00', '-08:00'])('rejects invalid timezone %s', timezone => {
    expect(updateCohortSchema.safeParse({ timezone }).success).toBe(false);
  });
  it.each([
    { sessionDate: '2026-02-30' }, { startTime: '25:00' }, { endTime: '12:60' },
    { recurrenceGroupId: null }, { recurrenceRule: null }, { recurrenceGroupId: 'bad-id' },
    { recurrenceRule: { ...rule, weeks: 53 } }, { recurrenceRule: { ...rule, weekdays: [] } },
    { recurrenceRule: { ...rule, weekdays: [2, 2] } }, { recurrenceRule: { ...rule, weekdays: [0] } }
  ])('rejects malformed schedule metadata %j', change => {
    expect(updateCohortSchema.safeParse({ sessions: [{ ...session, ...change }] }).success).toBe(false);
  });
  it('rejects conflicting rules for one group without rejecting individually changed occurrences', () => {
    expect(updateCohortSchema.safeParse({ sessions: [session, { ...session, sessionDate: '2026-11-12', recurrenceRule: { ...rule, weeks: 3 } }] }).success).toBe(false);
    expect(updateCohortSchema.safeParse({ sessions: [session, { ...session, sessionDate: '2026-11-13', startTime: '21:00' }] }).success).toBe(true);
  });
  it('rejects more than 50 sessions as one request', () => {
    expect(updateCohortSchema.safeParse({ sessions: Array.from({ length: 51 }, () => session) }).success).toBe(false);
  });
});
