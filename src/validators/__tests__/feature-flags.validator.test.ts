import { createFeatureFlagSchema, featureFlagParamsSchema, publicFeatureFlagsQuerySchema, updateFeatureFlagSchema } from '../feature-flags.validator';
const configuration = { name: 'Feature', description: '', stage: 'off', organizationIds: [] };
describe('feature release input contract', () => {
  test.each(['homeTimeline', 'newFeature_v2-test', 'a'.repeat(64)])('accepts extensible identifier %s', key => {
    expect(featureFlagParamsSchema.parse({ key })).toEqual({ key });
  });
  test.each(['', '9first', 'dot.key', '../key', 'a'.repeat(65), 'with space'])('rejects malformed identifier %s', key => {
    expect(featureFlagParamsSchema.safeParse({ key }).success).toBe(false);
  });
  it('trims metadata and registers without permitting an initial stage', () => {
    expect(createFeatureFlagSchema.parse({ key: 'newFeature', name: ' Name ', description: ' Detail ' })).toEqual({ key: 'newFeature', name: 'Name', description: 'Detail' });
    expect(createFeatureFlagSchema.safeParse({ key: 'newFeature', name: 'Name', description: '', stage: 'ga' }).success).toBe(false);
  });
  test.each(['off', 'beta', 'ga'])('permits retained organization roster at %s stage', stage => {
    expect(updateFeatureFlagSchema.parse({ ...configuration, stage, organizationIds: [1] }).stage).toBe(stage);
  });
  test.each([
    {}, { ...configuration, enabled: true }, { ...configuration, stage: 'unknown' },
    { ...configuration, stage: 'alpha' }, { ...configuration, organizationIds: [1, 1] },
    { ...configuration, organizationIds: [0] }, { ...configuration, organizationIds: ['1'] },
    { ...configuration, organizationIds: [2147483648] }, { ...configuration, name: ' ' },
    { ...configuration, name: 'a'.repeat(101) }, { ...configuration, description: 'a'.repeat(501) }
  ])('rejects malformed full configuration %j', value => {
    expect(updateFeatureFlagSchema.safeParse(value).success).toBe(false);
  });
  it('accepts alpha only with a nonempty roster', () => {
    expect(updateFeatureFlagSchema.parse({ ...configuration, stage: 'alpha', organizationIds: [1] }).organizationIds).toEqual([1]);
  });
  test.each(['0', '-1', '1.2', 'bad', '2147483648', ['1', '2']])('rejects invalid current organization %j', organizationId => {
    expect(publicFeatureFlagsQuerySchema.safeParse({ organizationId }).success).toBe(false);
  });
  it('parses optional current organization without accepting arbitrary query fields', () => {
    expect(publicFeatureFlagsQuerySchema.parse({ organizationId: '9' })).toEqual({ organizationId: 9 });
    expect(publicFeatureFlagsQuerySchema.parse({})).toEqual({});
    expect(publicFeatureFlagsQuerySchema.safeParse({ userId: '7' }).success).toBe(false);
  });
});
