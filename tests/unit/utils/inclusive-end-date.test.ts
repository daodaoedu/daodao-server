import { inclusiveEndDate } from '@/utils/date-utils';
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
