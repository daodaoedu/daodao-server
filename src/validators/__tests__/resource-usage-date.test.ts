import { createPracticeSchema, practiceSegmentSchema, updatePracticeSchema } from '../practice.validators';

const practice = { title: '閱讀', durationDays: 7, resources: [{ name: '中文 Resource', dayNumber: 8 }] };

describe('resource usage dates within the practice period', () => {
  it.each([createPracticeSchema, practiceSegmentSchema])('rejects an assigned day after the final day', schema => {
    const result = schema.safeParse(practice);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.some(issue => issue.path.join('.') === 'resources.0.dayNumber')).toBe(true);
  });
  it('accepts the inclusive last day and whole-period resources', () => {
    expect(createPracticeSchema.safeParse({ ...practice, resources: [{ name: 'last', dayNumber: 7 }, { name: 'all', dayNumber: null }] }).success).toBe(true);
  });
  it('defers update period checks to the service because submitted duration can be locked', () => {
    expect(updatePracticeSchema.safeParse({ durationDays: 7, resources: practice.resources }).success).toBe(true);
  });
  it('permits partial updates so the service can validate against stored duration', () => {
    expect(updatePracticeSchema.safeParse({ resources: practice.resources }).success).toBe(true);
    expect(updatePracticeSchema.safeParse({ durationDays: 7 }).success).toBe(true);
  });
});
