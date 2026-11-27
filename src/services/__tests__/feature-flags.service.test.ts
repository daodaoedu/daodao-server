jest.mock('../database/prisma.service', () => ({ prisma: { $queryRaw: jest.fn(), $transaction: jest.fn() } }));
import { prisma } from '../database/prisma.service';
import { getPublicFeatureFlags, listFeatureFlags } from '../feature-flags.service';
const query = jest.mocked(prisma.$queryRaw);
describe('feature registry reads', () => {
  it('reads arbitrary registered features with administrative metadata', async () => {
    const now = new Date();
    query.mockResolvedValue([{ key: 'newFeature', name: 'New', description: '', stage: 'alpha', organization_ids: [9], updated_at: now }]);
    expect(await listFeatureFlags()).toEqual([{ key: 'newFeature', name: 'New', description: '', stage: 'alpha', organizationIds: [9], updatedAt: now.toISOString() }]);
  });
  it('exposes dynamic boolean results without administrative metadata', async () => {
    query.mockResolvedValue([{ key: 'newFeature', enabled: true }, { key: 'another', enabled: false }]);
    expect(await getPublicFeatureFlags(7, 9)).toEqual({ newFeature: true, another: false });
  });
  it('does not invent registered features when the registry is empty', async () => {
    query.mockResolvedValue([]);
    expect(await getPublicFeatureFlags()).toEqual({});
  });
  it('propagates database errors', async () => {
    query.mockRejectedValue(new Error('relation missing'));
    await expect(getPublicFeatureFlags()).rejects.toThrow('relation missing');
  });
});
