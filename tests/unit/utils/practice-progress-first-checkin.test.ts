import {
  calculateProgress,
  COMPLETED_PROGRESS,
  FIRST_CHECKIN_PROGRESS,
  INITIAL_PROGRESS,
} from '@/utils/practice-progress';

// daodao#378：最低目標只有 1 次的實踐，第 1 次打卡就已達標，
// 規格「達成最低目標時強制為 100%」，但原本「首次打卡 50%」排在達標判斷之前，
// 結果是 50% → 150%（第 2 次直接多 100 個百分點）。
describe('calculateProgress 第 1 次打卡已達最低目標（daodao#378）', () => {
  // 7 天、每週 1 次 → 最低目標 1 次
  const weeklyOnce7Days = { frequencyMinDays: 1, frequencyMaxDays: 1, durationDays: 7 };
  // 14 天、每週 4 次 → 最低目標 8 次
  const fourPerWeek14Days = { frequencyMinDays: 4, frequencyMaxDays: 7, durationDays: 14 };

  it('最低目標 1 次：第 1 次打卡為 100%', () => {
    const result = calculateProgress(weeklyOnce7Days, 1);
    expect(result.minTargetCheckIns).toBe(1);
    expect(result.percentage).toBe(COMPLETED_PROGRESS);
    expect(result.hasReachedMinTarget).toBe(true);
    expect(result.isFirstCheckIn).toBe(true);
  });

  it('最低目標 1 次：之後每次 +50%（100 → 150 → 200 → 250）', () => {
    expect([1, 2, 3, 4].map((n) => calculateProgress(weeklyOnce7Days, n).percentage)).toEqual([
      100, 150, 200, 250,
    ]);
  });

  it('0 筆打卡仍為規格起點 20%（不在本卡範圍，維持不變）', () => {
    expect(calculateProgress(weeklyOnce7Days, 0).percentage).toBe(INITIAL_PROGRESS);
  });

  it('最低目標 8 次：第 1 次打卡仍為 50%、第 8 次 100%', () => {
    expect(calculateProgress(fourPerWeek14Days, 1).percentage).toBe(FIRST_CHECKIN_PROGRESS);
    expect(calculateProgress(fourPerWeek14Days, 8).percentage).toBe(COMPLETED_PROGRESS);
  });
});
