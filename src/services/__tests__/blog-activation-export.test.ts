import { exportBlogActivationEvidence } from '../blog-activation-export.service';

describe('activation export observed cutoff', () => {
  afterEach(() => jest.useRealTimers());
  it('refuses a future asOf before querying rows rather than maturing an unfinished window', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-11-13T00:00:00Z'));
    const query = jest.fn().mockResolvedValue([]);
    await expect(exportBlogActivationEvidence({ $queryRaw: query }, {
      registeredSince:'2026-11-01T00:00:00Z', asOf:'2027-01-01T00:00:00Z', instrumentedSince:'2026-11-01T00:00:00Z'
    })).rejects.toThrow(/asOf.*capture|future/i);
    expect(query).not.toHaveBeenCalled();
  });
});
