import { resolveProgressDurationDays } from '@/utils/practice-progress';

// daodao#295：共同挑戰期間 > 90 天時 practices.duration_days 留 null（CHECK 1–90），
// 進度與期間計算要改用起訖日的含頭尾天數，不可退回預設天數
describe('resolveProgressDurationDays', () => {
  const start = new Date('2026-10-09T00:00:00.000Z');

  it('有 duration_days 時直接使用', () => {
    expect(resolveProgressDurationDays({ duration_days: 21, start_date: start, end_date: new Date('2027-01-16T00:00:00.000Z') }, 14)).toBe(21);
  });

  it('duration_days 為 null 但有起訖日時用含頭尾天數（100 天）', () => {
    expect(resolveProgressDurationDays({ duration_days: null, start_date: start, end_date: new Date('2027-01-16T00:00:00.000Z') }, 14)).toBe(100);
  });

  it('起訖日同一天為 1 天', () => {
    expect(resolveProgressDurationDays({ duration_days: null, start_date: start, end_date: start }, 14)).toBe(1);
  });

  it('沒有天數也沒有完整起訖日時退回呼叫端的預設值', () => {
    expect(resolveProgressDurationDays({ duration_days: null, start_date: start, end_date: null }, 14)).toBe(14);
    expect(resolveProgressDurationDays({ duration_days: null, start_date: null, end_date: null }, 30)).toBe(30);
  });

  it('結束日早於開始日的壞資料退回預設值', () => {
    expect(resolveProgressDurationDays({ duration_days: null, start_date: start, end_date: new Date('2026-10-01T00:00:00.000Z') }, 14)).toBe(14);
  });
});
