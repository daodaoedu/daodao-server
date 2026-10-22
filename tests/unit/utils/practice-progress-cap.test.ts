import { calculateProgress, MAX_PROGRESS } from '@/utils/practice-progress';

// daodao#372：practices.progress_percentage 是 DECIMAL(5,2)（最大 999.99）。
// 超過最低目標後進度無上限累加，算出 ≥ 1000 時寫入觸發 Postgres 22003，打卡 POST 回 500。
describe('calculateProgress 進度封頂（daodao#372）', () => {
  // 7 天、每週 1 次 → 最低目標 1 次，之後每次 +50
  const weeklyOnce7Days = { frequencyMinDays: 1, frequencyMaxDays: 1, durationDays: 7 };
  // 14 天、每週 1 次 → 最低目標 2 次，之後每次 +50
  const weeklyOnce14Days = { frequencyMinDays: 1, frequencyMaxDays: 1, durationDays: 14 };

  it('封頂值是整數且小於欄位上限 999.99', () => {
    expect(MAX_PROGRESS).toBe(999);
    expect(Number.isInteger(MAX_PROGRESS)).toBe(true);
    expect(MAX_PROGRESS).toBeLessThanOrEqual(999.99);
  });

  it('7 天／每週 1 次：第 18 次仍照公式累加為 950%', () => {
    expect(calculateProgress(weeklyOnce7Days, 18).percentage).toBe(950);
  });

  it('7 天／每週 1 次：第 19 次（原本 1000% 溢位）封頂在 999%', () => {
    expect(calculateProgress(weeklyOnce7Days, 19).percentage).toBe(MAX_PROGRESS);
  });

  it('14 天／每週 1 次：第 20 次（原本 1000% 溢位）封頂在 999%', () => {
    expect(calculateProgress(weeklyOnce14Days, 20).percentage).toBe(MAX_PROGRESS);
  });

  it.each([19, 25, 100, 1000])('目標 ≤ 1 次時打卡 %i 次不超過欄位上限', (count) => {
    const { percentage } = calculateProgress(weeklyOnce7Days, count);
    expect(percentage).toBeLessThanOrEqual(999.99);
    expect(percentage).toBe(MAX_PROGRESS);
  });

  it('封頂不影響未達上限的進度與其他欄位', () => {
    const result = calculateProgress(weeklyOnce7Days, 25);
    expect(result.hasReachedMinTarget).toBe(true);
    expect(result.minTargetCheckIns).toBe(1);
    expect(result.currentCheckIns).toBe(25);
    expect(calculateProgress(weeklyOnce7Days, 2).percentage).toBe(150);
  });
});
