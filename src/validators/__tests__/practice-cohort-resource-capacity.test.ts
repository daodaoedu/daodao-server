import { createPracticeSchema, updatePracticeSchema } from '../practice.validators';

/** Resource count at the HTTP boundary must allow shared rows without expanding personal creation. */
describe('practice cohort resource request capacity (#401)', () => {
  const resources = (count: number) => Array.from({ length: count }, (_, i) => ({ name: `資源 ${i}`, url: `https://example.com/${i}` }));

  it('accepts 50 shared plus 10 personal rows for updates', () => {
    const parsed = updatePracticeSchema.parse({ resources: resources(60) });
    expect(parsed.resources).toHaveLength(60);
  });

  it('rejects more than 60 total rows before the service handles provenance', () => {
    const parsed = updatePracticeSchema.safeParse({ resources: resources(61) });
    expect(parsed.success).toBe(false);
    if (!parsed.success) expect(parsed.error.issues).toEqual(expect.arrayContaining([expect.objectContaining({ path: ['resources'], code: 'too_big' })]));
  });

  it('keeps personal practice creation limited to 10 resources', () => {
    expect(createPracticeSchema.safeParse({ title: '閱讀練習', resources: resources(10) }).success).toBe(true);
    const parsed = createPracticeSchema.safeParse({ title: '閱讀練習', resources: resources(11) });
    expect(parsed.success).toBe(false);
    if (!parsed.success) expect(parsed.error.issues).toEqual(expect.arrayContaining([expect.objectContaining({ path: ['resources'], code: 'too_big' })]));
  });
});
