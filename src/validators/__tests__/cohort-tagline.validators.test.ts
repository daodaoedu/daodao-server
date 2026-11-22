import { createCohortSchema, updateCohortSchema } from '../cohort.validators';

const baseCreate = { slug: '2026-winter', displayName: '2026 冬季期', startDate: '2026-12-01', endDate: '2026-12-31' };

describe('場次簡介長度（daodao#543 AC-04）', () => {
  it('建立場次接受 100 字簡介並去除前後空白', () => {
    const tagline = '字'.repeat(100);
    const result = createCohortSchema.safeParse({ ...baseCreate, tagline: `  ${tagline}  ` });
    expect(result.success && result.data.tagline).toBe(tagline);
  });

  it('建立場次拒絕 101 字簡介', () => {
    expect(createCohortSchema.safeParse({ ...baseCreate, tagline: '字'.repeat(101) }).success).toBe(false);
  });

  it('更新場次接受 100 字、拒絕 101 字，且仍可清空', () => {
    expect(updateCohortSchema.safeParse({ tagline: 'a'.repeat(100) }).success).toBe(true);
    expect(updateCohortSchema.safeParse({ tagline: 'a'.repeat(101) }).success).toBe(false);
    expect(updateCohortSchema.safeParse({ tagline: null }).success).toBe(true);
  });
});
