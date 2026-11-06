import { outOfPeriodResourceIndexes } from '../resource-usage-date';

describe('outOfPeriodResourceIndexes', () => {
  it('accepts first day, inclusive final day, unspecified and whole-period assignments', () => {
    expect(outOfPeriodResourceIndexes([{ dayNumber: 1 }, { dayNumber: 7 }, { dayNumber: null }, {}], 7)).toEqual([]);
  });
  it('returns every affected resource without silently changing its assignment', () => {
    const resources = [{ dayNumber: 8 }, { dayNumber: 3 }, { dayNumber: 0 }, { dayNumber: 1.5 }];
    expect(outOfPeriodResourceIndexes(resources, 7)).toEqual([0, 2, 3]);
    expect(resources[0].dayNumber).toBe(8);
  });
});
