import type { Prisma } from '../../../generated/prisma';
import { prismaMock } from '@tests/utils/prisma-mock';
jest.mock('../database/prisma.service', () => ({ prisma: prismaMock }));
jest.mock('../practice.service', () => ({ assertResourceNotCoachLocked: jest.fn() }));
jest.mock('../transform.service', () => ({ transformResourceToApi: jest.fn(async value => value), transformResourceToDb: jest.fn() }));
import { getResourceById, getResources, getResourceStats } from '../resource.service';
const excluded = (where: Prisma.resourcesWhereInput = {}) => where.cohort_template_resources !== null && where.cohort_template_resources?.is === null && where.users !== null && 'isNot' in (where.users ?? {}) && (where.users as { isNot?: unknown })?.isNot === null;
beforeEach(() => {
  prismaMock.resources.findFirst.mockImplementation((async (args: { where?: Prisma.resourcesWhereInput }) => {
    if (excluded(args.where)) return null;
    throw new Error('Private snapshot reached public detail');
  }) as never);
  prismaMock.resources.findMany.mockImplementation((async (args: { where?: Prisma.resourcesWhereInput }) => {
    if (excluded(args.where)) return [];
    throw new Error('Private snapshot reached public list/search');
  }) as never);
  prismaMock.resources.count.mockImplementation((async (args: { where?: Prisma.resourcesWhereInput }) => {
    if (excluded(args.where)) return 0;
    throw new Error('Private snapshot included in public statistics');
  }) as never);
  prismaMock.resources.groupBy.mockResolvedValue([]);
  prismaMock.resource_review.groupBy.mockResolvedValue([]);
  prismaMock.categories.findMany.mockResolvedValue([]);
});
test('public detail excludes snapshot bodies regardless of provenance soft deletion', async () => {
  await expect(getResourceById('snapshot-uuid')).rejects.toThrow('資源不存在');
});
test.each([{}, { query: 'private cohort marker' }, { createdBy: 12 }])('public list/search excludes snapshots: %j', async filters => {
  await expect(getResources(filters, {})).resolves.toBeDefined();
});
test('public statistics exclude snapshots', async () => {
  await expect(getResourceStats()).resolves.toBeDefined();
});

test('ordinary authored resource remains readable without a fabricated author', async () => {
  prismaMock.resources.findFirst.mockResolvedValue({ id: 7, users: { id: 12, nickname: 'Real author' }, name: 'Public resource' } as never);
  prismaMock.$queryRaw.mockResolvedValue([]);
  const result = await getResourceById('ordinary-uuid');
  expect(result.data).toMatchObject({ name: 'Public resource', User: { id: 12 } });
});
test('missing author returns not found even if database unexpectedly returns the row', async () => {
  prismaMock.resources.findFirst.mockResolvedValue({ id: 7, users: null } as never);
  await expect(getResourceById('orphan-uuid')).rejects.toThrow('資源不存在');
});
