/** daodao#382：practice_time_periods 讀取端容錯 */
import { PRACTICE_TIME_PERIODS, sanitizePracticeTimePeriods } from '../utils/practice-time-periods';
import { practiceTimePeriodSchema } from '../validators/practice.validators';

describe('sanitizePracticeTimePeriods', () => {
  it('drops legacy "30" written by lighthouse templates before enum validation', () => {
    expect(sanitizePracticeTimePeriods(['30'])).toEqual([]);
  });

  it('keeps allowed values in order and drops unknown ones', () => {
    expect(sanitizePracticeTimePeriods(['30', 'evening', 'anytime', 'morning'])).toEqual(['evening', 'morning']);
  });

  it('removes duplicates', () => {
    expect(sanitizePracticeTimePeriods(['night', 'night', 'commute'])).toEqual(['night', 'commute']);
  });

  it('returns [] for null / undefined / non-array input', () => {
    expect(sanitizePracticeTimePeriods(null)).toEqual([]);
    expect(sanitizePracticeTimePeriods(undefined)).toEqual([]);
    expect(sanitizePracticeTimePeriods('morning')).toEqual([]);
  });

  it('shares the allowed list with the write-side enum schema', () => {
    expect([...practiceTimePeriodSchema.options]).toEqual([...PRACTICE_TIME_PERIODS]);
  });
});
