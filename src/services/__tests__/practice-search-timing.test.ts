import { prismaMock } from '../../../tests/utils/prisma-mock';

jest.mock('../database/prisma.service', () => ({ prisma: prismaMock }));
jest.mock('../logging/logger.service', () => ({
  loggerService: { info: jest.fn(), warn: jest.fn(), error: jest.fn() }
}));
jest.mock('../../queues', () => ({ enqueuePracticeEmail: jest.fn() }));

import { findAll } from '../practice.service';

it.each([1, -1])('returns valid elapsed search time when wall clock moves by %i ms', async step => {
  prismaMock.practices.findMany.mockResolvedValue([]);
  prismaMock.practices.count.mockResolvedValue(0);
  prismaMock.entity_tags.findMany.mockResolvedValue([]);
  let wallTime = 1700000000000;
  jest.spyOn(Date, 'now').mockImplementation(() => (wallTime += step));
  jest.spyOn(process.hrtime, 'bigint')
    .mockReturnValueOnce(1000000n)
    .mockReturnValueOnce(8500000n);

  const result = await findAll({ status: 'active' });

  expect(result.success).toBe(true);
  expect(result.data).toEqual([]);
  expect(result.meta?.searchTime).toBe(7.5);
});
