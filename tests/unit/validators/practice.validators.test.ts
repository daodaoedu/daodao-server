import { createPracticeSchema, updatePracticeSchema } from '@/validators/practice.validators';

describe('practice validators', () => {
  describe('createPracticeSchema durationDays', () => {
    it.each([7, 14, 21, 30])('accepts %i days', (days) => {
      const result = createPracticeSchema.safeParse({
        title: '每日閱讀',
        durationDays: days
      });

      expect(result.success).toBe(true);
    });

    it.each([1, 10, 15, 20, 45, 90])('rejects %i days (only 7/14/21/30 allowed)', (days) => {
      const result = createPracticeSchema.safeParse({
        title: '每日閱讀',
        durationDays: days
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.path.join('.') === 'durationDays')).toBe(true);
      }
    });
  });

  describe('updatePracticeSchema durationDays', () => {
    it.each([7, 14, 21, 30])('accepts %i days', (days) => {
      const result = updatePracticeSchema.safeParse({ durationDays: days });
      expect(result.success).toBe(true);
    });

    it('rejects a value outside 7/14/21/30', () => {
      const result = updatePracticeSchema.safeParse({ durationDays: 20 });
      expect(result.success).toBe(false);
    });
  });
});
