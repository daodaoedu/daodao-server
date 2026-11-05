import { prismaMock } from '@tests/utils/prisma-mock';
jest.mock('../database/prisma.service', () => ({ prisma: prismaMock }));
jest.mock('../practice.service', () => ({ assertResourceNotCoachLocked: jest.fn() }));
import { getReviewById, getReviews, createReview, updateReview, updateReviewStatus, deleteReview, toggleLikeReview } from '../resource-review.service';
type PublicResourceFilter = { cohort_template_resources?: { is?: unknown } | null; users?: { isNot?: unknown } | null };
const safe = (where?: { resources?: PublicResourceFilter }) => where?.resources?.cohort_template_resources?.is === null && where?.resources?.users?.isNot === null;
beforeEach(() => {
  prismaMock.entity_tags.findMany.mockResolvedValue([]);
  const read = async (args: { where?: { resources?: PublicResourceFilter } & PublicResourceFilter }) => {
    if (!safe(args.where)) throw new Error('Snapshot review leaked');
    return null;
  };
  prismaMock.resource_review.findFirst.mockImplementation(read as never);
  prismaMock.resource_review.findUnique.mockImplementation(read as never);
  prismaMock.resource_review.findMany.mockImplementation((async (args: { where?: { resources?: PublicResourceFilter } & PublicResourceFilter }) => {
    if (!safe(args.where)) throw new Error('Snapshot review leaked');
    return [];
  }) as never);
  prismaMock.$transaction.mockImplementation((async (callback: (tx: typeof prismaMock) => Promise<unknown>) => callback(prismaMock)) as never);
});
test.each([
  ['detail', () => getReviewById(1)],
  ['update', () => updateReview(1, {} as never, 12)],
  ['status', () => updateReviewStatus(1, 'published', 12)],
  ['delete', () => deleteReview(1, 12)],
  ['like', () => toggleLikeReview(1)]
])('%s hides reviews of all snapshot bodies', async (_name, invoke) => {
  await expect((invoke as () => Promise<unknown>)()).rejects.toThrow('找不到');
});
test('global reviews list excludes snapshots', async () => {
  await expect(getReviews()).resolves.toBeDefined();
});
test('review creation rejects snapshot resource', async () => {
  prismaMock.resources.findUnique.mockImplementation((async (args: { where?: { resources?: PublicResourceFilter } & PublicResourceFilter }) => {
    if (args.where?.cohort_template_resources?.is !== null || args.where?.users?.isNot !== null) throw new Error('Snapshot writable through reviews');
    return null;
  }) as never);
  await expect(createReview('123e4567-e89b-42d3-a456-426614174000', {} as never, 12)).rejects.toThrow('找不到');
});
