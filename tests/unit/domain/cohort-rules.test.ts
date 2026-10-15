import {
  getCohortContentState,
  getCohortUnavailableReason,
  getCohortUnavailableReasons,
  canJoinCohort,
  getInvitationBlockReason,
  isInvitationSendable,
  type CohortJoinEligibilityInput
} from '@/domain/cohort.rules';

// === getCohortContentState ===

describe('getCohortContentState', () => {
  const makeDate = (iso: string) => new Date(iso);

  it('returns writable when now is before endDate', () => {
    expect(getCohortContentState(makeDate('2026-12-31'), makeDate('2026-06-15'))).toBe('writable');
  });

  it('returns writable on the last day (endDate itself)', () => {
    expect(getCohortContentState(makeDate('2026-06-15'), makeDate('2026-06-15'))).toBe('writable');
  });

  it('returns read_only the day after endDate', () => {
    expect(getCohortContentState(makeDate('2026-06-15'), makeDate('2026-06-16'))).toBe('read_only');
  });

  it('returns read_only 89 days after endDate (still within 90-day window)', () => {
    expect(getCohortContentState(makeDate('2026-01-01'), makeDate('2026-03-31'))).toBe('read_only');
  });

  it('returns read_only exactly 90 days after endDate', () => {
    expect(getCohortContentState(makeDate('2026-01-01'), makeDate('2026-04-01'))).toBe('read_only');
  });

  it('returns gone 91 days after endDate', () => {
    expect(getCohortContentState(makeDate('2026-01-01'), makeDate('2026-04-02'))).toBe('gone');
  });

  it('returns gone well past the 90-day window', () => {
    expect(getCohortContentState(makeDate('2025-01-01'), makeDate('2026-06-15'))).toBe('gone');
  });
});

// === getCohortUnavailableReason ===

describe('getCohortUnavailableReason', () => {
  const base: CohortJoinEligibilityInput = {
    status: 'published',
    endDate: new Date('2026-12-31'),
    joinDeadline: null,
    capacity: null,
    participantCount: 0,
    joinPaused: false,
    hasInvitation: false,
    now: new Date('2026-06-15')
  };

  it('returns null when cohort is open and all conditions met', () => {
    expect(getCohortUnavailableReason(base)).toBeNull();
  });

  it('returns not_published for draft cohort', () => {
    expect(getCohortUnavailableReason({ ...base, status: 'draft' })).toBe('not_published');
  });

  it('returns expired when now is past joinDeadline', () => {
    expect(getCohortUnavailableReason({
      ...base,
      joinDeadline: new Date('2026-06-01'),
      now: new Date('2026-06-15')
    })).toBe('expired');
  });

  it('returns expired when no joinDeadline and now is past endDate', () => {
    expect(getCohortUnavailableReason({
      ...base,
      endDate: new Date('2026-06-01'),
      now: new Date('2026-06-15')
    })).toBe('expired');
  });

  it('allows joining on the deadline day itself', () => {
    expect(getCohortUnavailableReason({
      ...base,
      joinDeadline: new Date('2026-06-15'),
      now: new Date('2026-06-15')
    })).toBeNull();
  });

  it('returns full when at capacity', () => {
    expect(getCohortUnavailableReason({
      ...base,
      capacity: 10,
      participantCount: 10
    })).toBe('full');
  });

  it('returns full when over capacity', () => {
    expect(getCohortUnavailableReason({
      ...base,
      capacity: 5,
      participantCount: 7
    })).toBe('full');
  });

  it('allows joining when under capacity', () => {
    expect(getCohortUnavailableReason({
      ...base,
      capacity: 10,
      participantCount: 9
    })).toBeNull();
  });

  it('allows joining when capacity is null (unlimited)', () => {
    expect(getCohortUnavailableReason({
      ...base,
      capacity: null,
      participantCount: 999
    })).toBeNull();
  });

  it('returns paused when joinPaused and no invitation', () => {
    expect(getCohortUnavailableReason({
      ...base,
      joinPaused: true,
      hasInvitation: false
    })).toBe('paused');
  });

  it('allows invited users to join even when paused', () => {
    expect(getCohortUnavailableReason({
      ...base,
      joinPaused: true,
      hasInvitation: true
    })).toBeNull();
  });

  it('checks not_published before expired (priority order)', () => {
    expect(getCohortUnavailableReason({
      ...base,
      status: 'draft',
      endDate: new Date('2020-01-01'),
      now: new Date('2026-06-15')
    })).toBe('not_published');
  });

  it('checks expired before full (priority order)', () => {
    expect(getCohortUnavailableReason({
      ...base,
      endDate: new Date('2020-01-01'),
      capacity: 1,
      participantCount: 1,
      now: new Date('2026-06-15')
    })).toBe('expired');
  });
});

// === getCohortUnavailableReasons ===

describe('getCohortUnavailableReasons', () => {
  const base: CohortJoinEligibilityInput = {
    status: 'published',
    endDate: new Date('2026-12-31'),
    joinDeadline: null,
    capacity: null,
    participantCount: 0,
    joinPaused: false,
    hasInvitation: false,
    now: new Date('2026-10-14')
  };
  const deadlinePassed = { joinDeadline: new Date('2026-10-13') };

  // daodao#281：截止＋暫停同時成立時，加入頁要兩個原因都看得到
  it.each([
    ['neither', {}, []],
    ['deadline only', deadlinePassed, ['expired']],
    ['paused only', { joinPaused: true }, ['paused']],
    ['deadline and paused', { ...deadlinePassed, joinPaused: true }, ['expired', 'paused']]
  ] as const)('lists every reason (%s)', (_label, override, expected) => {
    expect(getCohortUnavailableReasons({ ...base, ...override })).toEqual(expected);
  });

  it('keeps the primary reason equal to getCohortUnavailableReason', () => {
    const input = { ...base, ...deadlinePassed, joinPaused: true };
    expect(getCohortUnavailableReasons(input)[0]).toBe(getCohortUnavailableReason(input));
  });

  it('does not list paused for invited users', () => {
    expect(getCohortUnavailableReasons({ ...base, ...deadlinePassed, joinPaused: true, hasInvitation: true })).toEqual(['expired']);
  });
});

// === canJoinCohort ===

describe('canJoinCohort', () => {
  const open: CohortJoinEligibilityInput = {
    status: 'published',
    endDate: new Date('2026-12-31'),
    joinDeadline: null,
    capacity: null,
    participantCount: 0,
    joinPaused: false,
    hasInvitation: false,
    now: new Date('2026-06-15')
  };

  it('returns true when eligible', () => {
    expect(canJoinCohort(open)).toBe(true);
  });

  it('returns false when any condition fails', () => {
    expect(canJoinCohort({ ...open, status: 'draft' })).toBe(false);
    expect(canJoinCohort({ ...open, capacity: 0, participantCount: 0 })).toBe(false);
  });
});

// === 邀請寄送資格（daodao#281 / #282） ===

describe('getInvitationBlockReason', () => {
  const open = {
    status: 'published',
    endDate: new Date('2026-12-31'),
    joinDeadline: new Date('2026-10-01'),
    capacity: 10,
    participantCount: 3,
    now: new Date('2026-09-30T12:00:00Z')
  };

  it('allows sending while the cohort is joinable', () => {
    expect(getInvitationBlockReason(open)).toBeNull();
  });

  it('blocks sending after the join deadline even though the cohort has not ended', () => {
    expect(getInvitationBlockReason({ ...open, now: new Date('2026-10-02T00:00:00Z') })).toBe('expired');
  });

  it('falls back to endDate when joinDeadline is null', () => {
    expect(getInvitationBlockReason({ ...open, joinDeadline: null, now: new Date('2027-01-01T00:00:00Z') })).toBe('expired');
  });

  it('blocks sending for unpublished or full cohorts', () => {
    expect(getInvitationBlockReason({ ...open, status: 'draft' })).toBe('not_published');
    expect(getInvitationBlockReason({ ...open, participantCount: 10 })).toBe('full');
  });
});

describe('isInvitationSendable', () => {
  it('sends to new, already-invited and previously-exited emails', () => {
    expect(isInvitationSendable('new')).toBe(true);
    expect(isInvitationSendable('invited')).toBe(true);
    expect(isInvitationSendable('rejoin')).toBe(true);
  });

  it('skips already-joined members and invalid emails', () => {
    expect(isInvitationSendable('joined')).toBe(false);
    expect(isInvitationSendable('invalid')).toBe(false);
  });
});
