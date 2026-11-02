import {
  canJoinCohort,
  getCohortUnavailableReasons,
  getInvitationBlockReason,
  type CohortJoinEligibilityInput
} from '../cohort.rules';

const open: CohortJoinEligibilityInput = {
  status: 'published',
  endDate: new Date('2026-12-31T00:00:00.000Z'),
  joinDeadline: null,
  capacity: null,
  participantCount: 0,
  joinPaused: false,
  hasInvitation: false
};

describe.each(['joinDeadline', 'endDate'] as const)('%s uses the Taipei calendar', (field) => {
  it.each([
    ['2026-11-01', '2026-11-01T15:59:59.999Z', true],
    ['2026-11-01', '2026-11-01T16:00:00.000Z', false],
    ['2026-11-01', '2026-11-01T23:59:59.999Z', false],
    ['2026-11-01', '2026-11-02T00:00:00.000Z', false],
    ['2026-11-30', '2026-11-30T16:00:00.000Z', false],
    ['2026-12-31', '2026-12-31T16:00:00.000Z', false],
    ['2028-02-29', '2028-02-29T16:00:00.000Z', false]
  ])('deadline %s at %s allows joining: %s', (deadline, instant, allowed) => {
    const input = { ...open, [field]: new Date(`${deadline}T00:00:00.000Z`), now: new Date(instant) };
    expect(canJoinCohort(input)).toBe(allowed);
    expect(getCohortUnavailableReasons(input)).toEqual(allowed ? [] : ['expired']);
    expect(getInvitationBlockReason(input)).toBe(allowed ? null : 'expired');
  });
});

it('reports expiry before paused/full reasons after Taipei midnight, including personal invitations', () => {
  const input = {
    ...open,
    joinDeadline: new Date('2026-11-01T00:00:00.000Z'),
    now: new Date('2026-11-01T16:02:00.000Z'),
    capacity: 1,
    participantCount: 1,
    joinPaused: true
  };
  expect(getCohortUnavailableReasons(input)).toEqual(['expired', 'full', 'paused']);
  expect(getCohortUnavailableReasons({ ...input, hasInvitation: true })).toEqual(['expired', 'full']);
});
