/**
 * Practice domain rules — unit tests
 *
 * Tests pure business rule functions re-exported from src/domain/practice.rules.ts.
 * Covers status transitions, permission checks, expiry detection, and progress calculation.
 */

import {
  // Status
  type PracticeStatusType,
  type StatusTransitionContext,
  VALID_TRANSITIONS,
  isValidTransition,
  determineNewStatus,
  getStatusDisplayName,
  isTerminalStatus,
  canCheckIn,
  canEdit,
  canDelete,
  isValidStatus,
  initialStatusForStartDate,
  StatusTransitionError,
  // Progress
  type PracticeProgressConfig,
  INITIAL_PROGRESS,
  FIRST_CHECKIN_PROGRESS,
  COMPLETED_PROGRESS,
  calculateMinTargetCheckIns,
  calculateProgress,
  calculateRemainingCheckIns,
  isValidProgress,
  formatProgress,
} from '@/domain/practice.rules';

// ── Status transitions ──────────────────────────────────────────────

describe('isValidTransition', () => {
  it('allows all declared transitions in VALID_TRANSITIONS', () => {
    for (const [from, targets] of Object.entries(VALID_TRANSITIONS)) {
      for (const to of targets) {
        expect(isValidTransition(from as PracticeStatusType, to)).toBe(true);
      }
    }
  });

  it('allows same-state transitions (no-op)', () => {
    const statuses: PracticeStatusType[] = ['draft', 'not_started', 'active', 'completed', 'archived'];
    for (const s of statuses) {
      expect(isValidTransition(s, s)).toBe(true);
    }
  });

  it('rejects invalid transitions', () => {
    expect(isValidTransition('completed', 'draft')).toBe(false);
    expect(isValidTransition('completed', 'not_started')).toBe(false);
    expect(isValidTransition('completed', 'active')).toBe(false);
    expect(isValidTransition('not_started', 'completed')).toBe(false);
    expect(isValidTransition('draft', 'completed')).toBe(false);
  });
});

describe('determineNewStatus', () => {
  const base: StatusTransitionContext = {
    currentStatus: 'not_started',
    hasCheckIns: false,
  };

  it('transitions not_started → active on first check-in', () => {
    expect(determineNewStatus({ ...base, hasCheckIns: true })).toBe('active');
  });

  it('keeps not_started when no check-ins', () => {
    expect(determineNewStatus(base)).toBe('not_started');
  });

  it('archives any non-archived status when isArchiving=true', () => {
    for (const s of ['draft', 'not_started', 'active', 'completed'] as PracticeStatusType[]) {
      expect(determineNewStatus({ ...base, currentStatus: s, isArchiving: true })).toBe('archived');
    }
  });

  it('transitions to completed when past end date', () => {
    expect(determineNewStatus({ ...base, currentStatus: 'active', hasPassedEndDate: true }))
      .toBe('completed');
  });

  it('unarchives to previous status when not past end date', () => {
    expect(determineNewStatus({
      currentStatus: 'archived', hasCheckIns: false,
      isUnarchiving: true, previousStatus: 'active',
    })).toBe('active');
  });

  it('unarchives to completed when past end date regardless of previousStatus', () => {
    expect(determineNewStatus({
      currentStatus: 'archived', hasCheckIns: true,
      isUnarchiving: true, previousStatus: 'active', hasPassedEndDate: true,
    })).toBe('completed');
  });

  it('infers unarchive target from hasCheckIns when previousStatus absent', () => {
    expect(determineNewStatus({
      currentStatus: 'archived', hasCheckIns: true, isUnarchiving: true,
    })).toBe('active');
    expect(determineNewStatus({
      currentStatus: 'archived', hasCheckIns: false, isUnarchiving: true,
    })).toBe('not_started');
  });

  it('preserves current status when no conditions match', () => {
    expect(determineNewStatus({ ...base, currentStatus: 'active', hasCheckIns: true }))
      .toBe('active');
  });
});

// ── Permission checks ───────────────────────────────────────────────

describe('canCheckIn', () => {
  it('allows check-in for not_started and active', () => {
    expect(canCheckIn('not_started')).toBe(true);
    expect(canCheckIn('active')).toBe(true);
  });

  it('denies check-in for draft, completed, archived', () => {
    expect(canCheckIn('draft')).toBe(false);
    expect(canCheckIn('completed')).toBe(false);
    expect(canCheckIn('archived')).toBe(false);
  });
});

describe('canEdit', () => {
  it('allows edit for all except archived', () => {
    expect(canEdit('draft')).toBe(true);
    expect(canEdit('not_started')).toBe(true);
    expect(canEdit('active')).toBe(true);
    expect(canEdit('completed')).toBe(true);
    expect(canEdit('archived')).toBe(false);
  });
});

describe('canDelete', () => {
  it('allows delete for all except archived', () => {
    expect(canDelete('draft')).toBe(true);
    expect(canDelete('active')).toBe(true);
    expect(canDelete('archived')).toBe(false);
  });
});

describe('isTerminalStatus', () => {
  it('identifies completed and archived as terminal', () => {
    expect(isTerminalStatus('completed')).toBe(true);
    expect(isTerminalStatus('archived')).toBe(true);
  });

  it('identifies non-terminal statuses', () => {
    expect(isTerminalStatus('draft')).toBe(false);
    expect(isTerminalStatus('not_started')).toBe(false);
    expect(isTerminalStatus('active')).toBe(false);
  });
});

describe('isValidStatus', () => {
  it('accepts all defined statuses', () => {
    for (const s of ['draft', 'not_started', 'active', 'completed', 'archived']) {
      expect(isValidStatus(s)).toBe(true);
    }
  });

  it('rejects invalid values', () => {
    expect(isValidStatus('pending')).toBe(false);
    expect(isValidStatus('')).toBe(false);
    expect(isValidStatus('ACTIVE')).toBe(false);
  });
});

describe('determineNewStatus — unarchive without check-ins (daodao#212)', () => {
  // 2026-10-12 10:00 Asia/Taipei
  const now = new Date('2026-10-12T02:00:00.000Z');

  it('restores to active when the start date has arrived', () => {
    expect(determineNewStatus({
      currentStatus: 'archived',
      hasCheckIns: false,
      isUnarchiving: true,
      startDate: new Date('2026-10-12'),
      now,
    })).toBe('active');
  });

  it('restores to not_started when the start date is in the future', () => {
    expect(determineNewStatus({
      currentStatus: 'archived',
      hasCheckIns: false,
      isUnarchiving: true,
      startDate: new Date('2026-10-13'),
      now,
    })).toBe('not_started');
  });
});

describe('VALID_TRANSITIONS — date-based initial status (daodao#212)', () => {
  it('allows publishing a draft straight to active and moving active back to not_started before any check-in', () => {
    expect(isValidTransition('draft', 'active')).toBe(true);
    expect(isValidTransition('active', 'not_started')).toBe(true);
  });
});

describe('initialStatusForStartDate', () => {
  // 2026-10-12 10:00 Asia/Taipei
  const now = new Date('2026-10-12T02:00:00.000Z');

  it('returns active when the practice starts today (daodao#212)', () => {
    expect(initialStatusForStartDate(new Date('2026-10-12'), now)).toBe('active');
  });

  it('returns not_started when the start date is in the future', () => {
    expect(initialStatusForStartDate(new Date('2026-10-13'), now)).toBe('not_started');
  });

  it('returns active when the start date has already passed', () => {
    expect(initialStatusForStartDate(new Date('2026-10-11'), now)).toBe('active');
  });

  it('compares calendar days in Asia/Taipei, not UTC', () => {
    // UTC 2026-10-11 16:00 = Taipei 2026-10-12 00:00
    const taipeiMidnight = new Date('2026-10-11T16:00:00.000Z');
    expect(initialStatusForStartDate(new Date('2026-10-12'), taipeiMidnight)).toBe('active');
    // UTC 2026-10-11 15:59 = Taipei 2026-10-11 23:59
    const beforeMidnight = new Date('2026-10-11T15:59:00.000Z');
    expect(initialStatusForStartDate(new Date('2026-10-12'), beforeMidnight)).toBe('not_started');
  });
});

describe('getStatusDisplayName', () => {
  it('returns zh-TW names by default', () => {
    expect(getStatusDisplayName('active')).toBe('進行中');
    expect(getStatusDisplayName('completed')).toBe('已完成');
  });

  it('returns English names when requested', () => {
    expect(getStatusDisplayName('active', 'en')).toBe('Active');
    expect(getStatusDisplayName('draft', 'en')).toBe('Draft');
  });
});

describe('StatusTransitionError', () => {
  it('captures from/to states and generates message', () => {
    const err = new StatusTransitionError('completed', 'draft');
    expect(err.from).toBe('completed');
    expect(err.to).toBe('draft');
    expect(err.message).toContain('completed');
    expect(err.message).toContain('draft');
    expect(err.name).toBe('StatusTransitionError');
  });

  it('uses custom message when provided', () => {
    const err = new StatusTransitionError('active', 'draft', 'custom msg');
    expect(err.message).toBe('custom msg');
  });
});

// ── Progress calculation ────────────────────────────────────────────

const config14d: PracticeProgressConfig = {
  frequencyMinDays: 4,
  frequencyMaxDays: 7,
  durationDays: 14,
};

describe('calculateMinTargetCheckIns', () => {
  it('calculates for a 14-day / 4-per-week practice', () => {
    // 14/7 = 2 weeks × 4 = 8
    expect(calculateMinTargetCheckIns(config14d)).toBe(8);
  });

  it('rounds up partial weeks', () => {
    // 10/7 ≈ 1.43 weeks × 3 = 4.29 → ceil → 5
    expect(calculateMinTargetCheckIns({ frequencyMinDays: 3, frequencyMaxDays: 7, durationDays: 10 })).toBe(5);
  });

  it('returns 1 as minimum even for edge cases', () => {
    expect(calculateMinTargetCheckIns({ frequencyMinDays: 0, frequencyMaxDays: 7, durationDays: 14 })).toBe(1);
    expect(calculateMinTargetCheckIns({ frequencyMinDays: 1, frequencyMaxDays: 7, durationDays: 0 })).toBe(1);
  });
});

describe('calculateProgress', () => {
  it('starts at INITIAL_PROGRESS (20%) with zero check-ins', () => {
    const result = calculateProgress(config14d, 0);
    expect(result.percentage).toBe(INITIAL_PROGRESS);
    expect(result.isFirstCheckIn).toBe(false);
    expect(result.hasReachedMinTarget).toBe(false);
  });

  it('jumps to FIRST_CHECKIN_PROGRESS (50%) on first check-in', () => {
    const result = calculateProgress(config14d, 1);
    expect(result.percentage).toBe(FIRST_CHECKIN_PROGRESS);
    expect(result.isFirstCheckIn).toBe(true);
  });

  it('increments proportionally on subsequent check-ins', () => {
    // minTarget=8, step=50/(8-1)≈7.14; 2 check-ins = 50 + 7.14 ≈ 57.14
    const result = calculateProgress(config14d, 2);
    expect(result.percentage).toBeCloseTo(57.14, 1);
    expect(result.isFirstCheckIn).toBe(false);
    expect(result.hasReachedMinTarget).toBe(false);
  });

  it('reaches exactly COMPLETED_PROGRESS (100%) at min target', () => {
    const result = calculateProgress(config14d, 8);
    expect(result.percentage).toBe(COMPLETED_PROGRESS);
    expect(result.hasReachedMinTarget).toBe(true);
  });

  it('exceeds 100% beyond min target', () => {
    const result = calculateProgress(config14d, 9);
    expect(result.percentage).toBeGreaterThan(COMPLETED_PROGRESS);
    expect(result.hasReachedMinTarget).toBe(true);
  });

  it('returns FIRST_CHECKIN_PROGRESS even when minTarget=1 (first-checkin branch takes priority)', () => {
    const shortConfig: PracticeProgressConfig = { frequencyMinDays: 1, frequencyMaxDays: 1, durationDays: 1 };
    const r1 = calculateProgress(shortConfig, 1);
    expect(r1.percentage).toBe(FIRST_CHECKIN_PROGRESS);
    expect(r1.isFirstCheckIn).toBe(true);
    expect(r1.hasReachedMinTarget).toBe(true);
  });
});

describe('calculateRemainingCheckIns', () => {
  it('returns correct remaining for partial completion', () => {
    expect(calculateRemainingCheckIns(config14d, 3)).toBe(5); // 8-3
  });

  it('returns 0 when target met or exceeded', () => {
    expect(calculateRemainingCheckIns(config14d, 8)).toBe(0);
    expect(calculateRemainingCheckIns(config14d, 10)).toBe(0);
  });

  it('returns full target when no check-ins', () => {
    expect(calculateRemainingCheckIns(config14d, 0)).toBe(8);
  });
});

describe('isValidProgress', () => {
  it('accepts valid percentages', () => {
    expect(isValidProgress(0)).toBe(true);
    expect(isValidProgress(50)).toBe(true);
    expect(isValidProgress(150)).toBe(true);
  });

  it('rejects invalid values', () => {
    expect(isValidProgress(-1)).toBe(false);
    expect(isValidProgress(NaN)).toBe(false);
  });
});

describe('formatProgress', () => {
  it('formats with two decimal places', () => {
    expect(formatProgress(50)).toBe('50.00%');
    expect(formatProgress(100)).toBe('100.00%');
    expect(formatProgress(57.142857)).toBe('57.14%');
  });
});
