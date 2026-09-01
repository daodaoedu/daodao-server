import {
  BATCH_SEGMENTS_MAX,
  DURATION_DAYS_MAX,
  DURATION_DAYS_MIN,
  PRACTICE_ACTION_MAX_LENGTH,
  SESSION_MINUTES_MAX,
  SESSION_MINUTES_MIN,
  addDaysToDateString,
  batchCreatePracticeSchema,
  batchCreatePracticeTemplateSchema,
  createPracticeSchema,
  createPracticeTemplateSchema,
  updatePracticeSchema,
} from '@/validators/practice.validators';

const TEMPLATE_ID = '123e4567-e89b-12d3-a456-426614174000';

const today = (): string => new Date().toISOString().slice(0, 10);

const validPractice = (overrides: Record<string, unknown> = {}) => ({
  title: '閱讀原子習慣',
  practiceAction: '每天閱讀 30 頁',
  startDate: today(),
  durationDays: 14,
  frequencyMinDays: 3,
  frequencyMaxDays: 5,
  ...overrides,
});

describe('practice validators (#141 實踐建立流程優化)', () => {
  describe('createPracticeSchema — durationDays 1–90', () => {
    it.each([DURATION_DAYS_MIN, 7, 45, DURATION_DAYS_MAX])('accepts %i days', (days) => {
      expect(createPracticeSchema.safeParse(validPractice({ durationDays: days })).success).toBe(true);
    });

    it.each([0, DURATION_DAYS_MAX + 1, 14.5])('rejects %s days', (days) => {
      expect(createPracticeSchema.safeParse(validPractice({ durationDays: days })).success).toBe(false);
    });
  });

  describe('createPracticeSchema — sessionDurationMinutes 1–999', () => {
    it.each([SESSION_MINUTES_MIN, 15, 90, SESSION_MINUTES_MAX])('accepts %i minutes', (m) => {
      expect(createPracticeSchema.safeParse(validPractice({ sessionDurationMinutes: m })).success).toBe(true);
    });

    it.each([0, SESSION_MINUTES_MAX + 1])('rejects %i minutes', (m) => {
      expect(createPracticeSchema.safeParse(validPractice({ sessionDurationMinutes: m })).success).toBe(false);
    });
  });

  describe('createPracticeSchema — practiceAction 50 字', () => {
    it('accepts exactly 50 characters', () => {
      expect(createPracticeSchema.safeParse(validPractice({ practiceAction: '字'.repeat(PRACTICE_ACTION_MAX_LENGTH) })).success).toBe(true);
    });

    it('rejects 51 characters', () => {
      const result = createPracticeSchema.safeParse(validPractice({ practiceAction: '字'.repeat(PRACTICE_ACTION_MAX_LENGTH + 1) }));
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['practiceAction']);
      }
    });

    it('update schema keeps the legacy 200 limit so existing practices stay editable', () => {
      expect(updatePracticeSchema.safeParse({ practiceAction: '字'.repeat(200) }).success).toBe(true);
      expect(updatePracticeSchema.safeParse({ practiceAction: '字'.repeat(201) }).success).toBe(false);
    });
  });

  describe('createPracticeSchema — templateId is preserved (regression: was silently stripped)', () => {
    it('keeps templateId after parse', () => {
      const parsed = createPracticeSchema.parse(validPractice({ templateId: TEMPLATE_ID }));
      expect(parsed.templateId).toBe(TEMPLATE_ID);
    });

    it('rejects a non-uuid templateId', () => {
      expect(createPracticeSchema.safeParse(validPractice({ templateId: 'tpl-1' })).success).toBe(false);
    });
  });

  describe('createPracticeSchema — resources', () => {
    it('accepts a name-only resource (url empty string)', () => {
      const parsed = createPracticeSchema.parse(validPractice({ resources: [{ name: '圖書館的書', url: '' }] }));
      expect(parsed.resources).toEqual([{ name: '圖書館的書', url: '' }]);
    });

    it('accepts up to 10 resources and rejects 11', () => {
      const res = (n: number) => Array.from({ length: n }, (_, i) => ({ name: `r${i}` }));
      expect(createPracticeSchema.safeParse(validPractice({ resources: res(10) })).success).toBe(true);
      expect(createPracticeSchema.safeParse(validPractice({ resources: res(11) })).success).toBe(false);
    });

    it('allows dayNumber up to the 90-day ceiling', () => {
      expect(createPracticeSchema.safeParse(validPractice({ durationDays: 90, resources: [{ name: 'r', dayNumber: 90 }] })).success).toBe(true);
      expect(createPracticeSchema.safeParse(validPractice({ resources: [{ name: 'r', dayNumber: 91 }] })).success).toBe(false);
    });
  });

  describe('createPracticeTemplateSchema — aligned with practices', () => {
    it('accepts 90 days and rejects 91 (was 365)', () => {
      expect(createPracticeTemplateSchema.safeParse({ title: 't', durationDays: 90 }).success).toBe(true);
      expect(createPracticeTemplateSchema.safeParse({ title: 't', durationDays: 91 }).success).toBe(false);
    });

    it('accepts 999 minutes and rejects 1000 (was 480)', () => {
      expect(createPracticeTemplateSchema.safeParse({ title: 't', sessionDurationMinutes: 999 }).success).toBe(true);
      expect(createPracticeTemplateSchema.safeParse({ title: 't', sessionDurationMinutes: 1000 }).success).toBe(false);
    });

    it('caps practiceAction at 50', () => {
      expect(createPracticeTemplateSchema.safeParse({ title: 't', practiceAction: '字'.repeat(51) }).success).toBe(false);
    });
  });

  describe('addDaysToDateString', () => {
    it('adds days in UTC without drift', () => {
      expect(addDaysToDateString('2026-08-20', 7)).toBe('2026-08-27');
      expect(addDaysToDateString('2026-12-28', 14)).toBe('2027-01-11');
    });
  });

  describe('batchCreatePracticeSchema — 拆段', () => {
    const start = today();
    const seg = (startDate: string, durationDays: number, overrides: Record<string, unknown> = {}) =>
      validPractice({ startDate, durationDays, ...overrides });

    it('accepts 3 contiguous segments in order', () => {
      const s1 = seg(start, 30);
      const s2 = seg(addDaysToDateString(start, 30), 30);
      const s3 = seg(addDaysToDateString(start, 60), 30);
      const result = batchCreatePracticeSchema.safeParse({ segments: [s1, s2, s3] });
      expect(result.success).toBe(true);
    });

    it('applies the 14-day start limit only to the first segment', () => {
      const lateFirst = seg(addDaysToDateString(start, 15), 20);
      const second = seg(addDaysToDateString(start, 35), 20);
      const result = batchCreatePracticeSchema.safeParse({ segments: [lateFirst, second] });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.join('.') === 'segments.0.startDate')).toBe(true);
      }
    });

    it('single-practice schema still enforces the 14-day start limit', () => {
      expect(createPracticeSchema.safeParse(validPractice({ startDate: addDaysToDateString(start, 14) })).success).toBe(true);
      expect(createPracticeSchema.safeParse(validPractice({ startDate: addDaysToDateString(start, 15) })).success).toBe(false);
    });

    it('rejects a single segment and rejects 4 segments', () => {
      const s = seg(start, 10);
      expect(batchCreatePracticeSchema.safeParse({ segments: [s] }).success).toBe(false);
      const four = [0, 10, 20, 30].map((offset) => seg(addDaysToDateString(start, offset), 10));
      expect(four).toHaveLength(BATCH_SEGMENTS_MAX + 1);
      expect(batchCreatePracticeSchema.safeParse({ segments: four }).success).toBe(false);
    });

    it('rejects non-contiguous dates and points at the offending segment', () => {
      const s1 = seg(start, 30);
      const s2 = seg(addDaysToDateString(start, 31), 30); // gap of one day
      const result = batchCreatePracticeSchema.safeParse({ segments: [s1, s2] });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.join('.') === 'segments.1.startDate')).toBe(true);
      }
    });

    it('requires frequency on every segment', () => {
      const s1 = seg(start, 20);
      const s2 = seg(addDaysToDateString(start, 20), 20, { frequencyMinDays: undefined, frequencyMaxDays: undefined });
      const result = batchCreatePracticeSchema.safeParse({ segments: [s1, s2] });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.join('.') === 'segments.1.frequencyMinDays')).toBe(true);
      }
    });

    it('propagates per-segment field errors with segment index in the path', () => {
      const s1 = seg(start, 20);
      const s2 = seg(addDaysToDateString(start, 20), 0);
      const result = batchCreatePracticeSchema.safeParse({ segments: [s1, s2] });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.join('.') === 'segments.1.durationDays')).toBe(true);
      }
    });
  });

  describe('batchCreatePracticeTemplateSchema', () => {
    it('accepts 2 template segments without startDate', () => {
      const result = batchCreatePracticeTemplateSchema.safeParse({
        segments: [{ title: 't1', durationDays: 30 }, { title: 't2', durationDays: 30 }],
      });
      expect(result.success).toBe(true);
    });

    it('requires durationDays on each segment', () => {
      const result = batchCreatePracticeTemplateSchema.safeParse({ segments: [{ title: 't1', durationDays: 30 }, { title: 't2' }] });
      expect(result.success).toBe(false);
    });
  });
});
