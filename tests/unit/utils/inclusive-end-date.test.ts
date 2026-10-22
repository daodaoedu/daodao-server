import { inclusiveEndDate, taipeiToday } from '@/utils/date-utils';
import { calculateDateShift, calculateEndDate } from '@/validators/practice-business.validators';

// daodao#277：範本、梯次指派與學員實踐共用同一條結束日規則（含開始日當天，結束日 = 開始日 + 天數 − 1）
describe('inclusiveEndDate', () => {
  const utc = (day: string) => new Date(`${day}T00:00:00.000Z`);

  it('7 天範本從 10/20 開始，結束日是 10/26（開始日 + 6）', () => {
    expect(inclusiveEndDate(utc('2026-10-20'), 7).toISOString()).toBe('2026-10-26T00:00:00.000Z');
  });

  it('1 天的實踐開始日即結束日', () => {
    expect(inclusiveEndDate(utc('2026-10-20'), 1).toISOString()).toBe('2026-10-20T00:00:00.000Z');
  });

  it('跨月、跨年照日曆日進位', () => {
    expect(inclusiveEndDate(utc('2026-10-28'), 7).toISOString()).toBe('2026-11-03T00:00:00.000Z');
    expect(inclusiveEndDate(utc('2026-12-30'), 91).toISOString()).toBe('2027-03-30T00:00:00.000Z');
  });

  it('不修改傳入的開始日', () => {
    const start = utc('2026-10-20');
    inclusiveEndDate(start, 7);
    expect(start.toISOString()).toBe('2026-10-20T00:00:00.000Z');
  });
});

// daodao#336：「今天」取台北日曆日，存成 UTC 零點，不受程序時區影響
describe('taipeiToday', () => {
  it.each([
    ['台北 00:00（UTC 前一天 16:00）', '2026-10-21T16:00:00.000Z', '2026-10-22'],
    ['台北 07:59（UTC 前一天 23:59）', '2026-10-21T23:59:00.000Z', '2026-10-22'],
    ['台北 08:00（UTC 00:00）', '2026-10-22T00:00:00.000Z', '2026-10-22'],
    ['台北 23:59（UTC 15:59）', '2026-10-22T15:59:00.000Z', '2026-10-22'],
    ['台北跨年 00:30', '2026-12-31T16:30:00.000Z', '2027-01-01'],
  ])('%s → %s', (_label, now, expected) => {
    expect(taipeiToday(new Date(now)).toISOString()).toBe(`${expected}T00:00:00.000Z`);
  });
});

describe('calculateEndDate 與同一條結束日規則', () => {
  it('Asia/Taipei 的 10/20 開始 7 天，結束日是台北 10/26', () => {
    // 台北 10/26 00:00 = UTC 10/25 16:00
    expect(calculateEndDate('2026-10-20', 7).toISOString()).toBe('2026-10-25T16:00:00.000Z');
  });
});

describe('calculateDateShift 與同一條結束日規則', () => {
  it('不需位移時，結束日 = 原開始日 + 天數 − 1', () => {
    const result = calculateDateShift('2026-10-20', '2026-10-21', 7);
    expect(result.needsShift).toBe(false);
    expect(result.newEndDate.getTime() - result.newStartDate.getTime()).toBe(6 * 86_400_000);
  });

  it('提早打卡位移時，結束日 = 打卡日 + 天數 − 1', () => {
    const result = calculateDateShift('2026-10-20', '2026-10-18', 7);
    expect(result.needsShift).toBe(true);
    expect(result.newEndDate.getTime() - result.newStartDate.getTime()).toBe(6 * 86_400_000);
  });
});
