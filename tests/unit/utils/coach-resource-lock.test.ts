import { isCoachResourceLockActive, partitionIncomingResources } from '@/utils/coach-resource-lock';

describe('isCoachResourceLockActive', () => {
  it('本期模板草稿 → 鎖定', () => {
    expect(isCoachResourceLockActive({ cohort_id: 7, template_id: 3, creation_source: 'cohort_template' })).toBe(true);
  });

  it('已退出本期（cohort_id 清空）→ 轉個人實踐，不鎖定', () => {
    expect(isCoachResourceLockActive({ cohort_id: null, template_id: 3, creation_source: 'cohort_template' })).toBe(false);
  });

  it('個人建立的實踐 → 不鎖定', () => {
    expect(isCoachResourceLockActive({ cohort_id: null, template_id: null, creation_source: 'manual' })).toBe(false);
    expect(isCoachResourceLockActive({ cohort_id: 7, template_id: null, creation_source: 'manual' })).toBe(false);
  });
});

describe('partitionIncomingResources', () => {
  const coachVideo = { id: 'r1', name: '暖身影片', url: 'https://example.com/v', dayNumber: 2 };
  const coachBook = { id: 'r2', name: '指定讀物', url: undefined, dayNumber: null };

  it('原樣保留教練資源、加上自己的 → 沒有違規，只建立自己的', () => {
    const mine = { name: '我的筆記', url: 'https://example.com/note' };
    const result = partitionIncomingResources([coachVideo, coachBook], [
      { name: '暖身影片', url: 'https://example.com/v', dayNumber: 2 },
      { name: '指定讀物' },
      mine
    ]);
    expect(result.violated).toEqual([]);
    expect(result.rest).toEqual([mine]);
  });

  it('省略教練資源（移除）→ 列為違規', () => {
    const result = partitionIncomingResources([coachVideo, coachBook], [{ name: '指定讀物' }]);
    expect(result.violated).toEqual([coachVideo]);
  });

  it('改了教練資源的名稱或網址 → 原資源列為違規，改後那筆不算保留', () => {
    const renamed = partitionIncomingResources([coachVideo], [{ name: '暖身影片（改）', url: 'https://example.com/v', dayNumber: 2 }]);
    expect(renamed.violated).toEqual([coachVideo]);

    const relinked = partitionIncomingResources([coachVideo], [{ name: '暖身影片', url: 'https://example.com/other', dayNumber: 2 }]);
    expect(relinked.violated).toEqual([coachVideo]);
  });

  it('改了教練資源的使用天數 → 違規；沒帶 dayNumber 視為沿用', () => {
    expect(partitionIncomingResources([coachVideo], [{ name: '暖身影片', url: 'https://example.com/v', dayNumber: 5 }]).violated).toEqual([coachVideo]);
    expect(partitionIncomingResources([coachVideo], [{ name: '暖身影片', url: 'https://example.com/v' }]).violated).toEqual([]);
  });

  it('純名稱資源的空字串網址與未帶網址視為相同', () => {
    expect(partitionIncomingResources([coachBook], [{ name: '指定讀物', url: '' }]).violated).toEqual([]);
  });

  it('同一筆送出只能抵一筆鎖定資源', () => {
    const twin = { ...coachBook, id: 'r3' };
    const result = partitionIncomingResources([coachBook, twin], [{ name: '指定讀物' }]);
    expect(result.violated).toEqual([twin]);
  });

  it('沒有鎖定資源 → 全部照送出內容建立', () => {
    const incoming = [{ name: 'A' }, { name: 'B', url: 'https://b.example' }];
    expect(partitionIncomingResources([], incoming)).toEqual({ violated: [], rest: incoming });
  });
});
