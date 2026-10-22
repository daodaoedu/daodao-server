import { isCoachResourceLockActive, partitionIncomingResources, pickCoachLockedRelationIds } from '@/utils/coach-resource-lock';

describe('pickCoachLockedRelationIds', () => {
  const template = [
    { resource_id: 100, resources: { name: '暖身影片', url: 'https://example.com/v' } },
    { resource_id: 101, resources: { name: '指定讀物', url: '' } }
  ];
  const relation = (id: number, resourceId: number, name: string, url = '') => ({ id, resource_id: resourceId, resources: { name, url } });

  it('resource_id 掛過模板 → 鎖定', () => {
    expect(pickCoachLockedRelationIds(template, [relation(1, 100, '暖身影片', 'https://example.com/v'), relation(2, 900, '我的筆記')])).toEqual(new Set([1]));
  });

  it('教練資源被重建（id 不同、內容相同）→ 以內容補鎖一筆', () => {
    expect(pickCoachLockedRelationIds(template, [relation(1, 555, '指定讀物')])).toEqual(new Set([1]));
  });

  it('學員自己另存一份同名同網址 → 只鎖教練那筆，學員那份可移除', () => {
    expect(pickCoachLockedRelationIds(template, [
      relation(1, 100, '暖身影片', 'https://example.com/v'),
      relation(2, 777, '暖身影片', 'https://example.com/v')
    ])).toEqual(new Set([1]));
  });

  it('同內容在模板歷史出現多次（教練改過模板）→ 內容比對仍只鎖一筆', () => {
    const history = [...template, { resource_id: 200, resources: { name: '指定讀物', url: '' } }];
    expect(pickCoachLockedRelationIds(history, [relation(1, 555, '指定讀物'), relation(2, 556, '指定讀物')])).toEqual(new Set([1]));
  });

  describe('同名同網址的教練資源放在不同天（daodao#355）', () => {
    const sheet = { name: '練習單', url: 'https://example.com/sheet' };
    const dayTemplate = [
      { resource_id: 300, note: 'day:2', deleted_at: null, resources: sheet },
      { resource_id: 301, note: 'day:3', deleted_at: null, resources: sheet }
    ];
    const dayRelation = (id: number, resourceId: number, note: string | null) => ({ id, resource_id: resourceId, note, resources: sheet });

    it('實踐資源列已重建（id 都對不上）→ 兩筆都鎖', () => {
      expect(pickCoachLockedRelationIds(dayTemplate, [dayRelation(1, 900, 'day:2'), dayRelation(2, 901, 'day:3')])).toEqual(new Set([1, 2]));
    });

    it('一筆 id 對得上、另一筆已重建 → 兩筆都鎖', () => {
      expect(pickCoachLockedRelationIds(dayTemplate, [dayRelation(1, 300, 'day:2'), dayRelation(2, 901, 'day:3')])).toEqual(new Set([1, 2]));
    });

    it('學員另存一份同內容（沒帶天數）→ 只鎖天數對得上的兩筆，學員那份不鎖', () => {
      expect(pickCoachLockedRelationIds(dayTemplate, [
        dayRelation(1, 777, null),
        dayRelation(2, 900, 'day:2'),
        dayRelation(3, 901, 'day:3')
      ])).toEqual(new Set([2, 3]));
    });

    it('教練改過模板：舊關聯軟刪、新關聯現存 → 只依現存關聯計數，不因歷史多鎖', () => {
      const edited = [
        { resource_id: 290, note: 'day:2', deleted_at: new Date('2026-10-01'), resources: sheet },
        { resource_id: 291, note: 'day:3', deleted_at: new Date('2026-10-01'), resources: sheet },
        { resource_id: 300, note: 'day:2', deleted_at: null, resources: sheet }
      ];
      expect(pickCoachLockedRelationIds(edited, [dayRelation(1, 900, 'day:2'), dayRelation(2, 777, null)])).toEqual(new Set([1]));
    });

    it('模板現存關聯是同天重複的舊 seed（天數相同）→ 視為一筆，學員自己的同名資源不鎖', () => {
      const seeded = [
        { resource_id: 310, note: null, deleted_at: null, resources: sheet },
        { resource_id: 311, note: null, deleted_at: null, resources: sheet },
        { resource_id: 312, note: null, deleted_at: null, resources: sheet }
      ];
      expect(pickCoachLockedRelationIds(seeded, [dayRelation(1, 310, null), dayRelation(2, 777, null)])).toEqual(new Set([1]));
      expect(pickCoachLockedRelationIds(seeded, [dayRelation(1, 900, null), dayRelation(2, 777, null)])).toEqual(new Set([1]));
    });

    it('教練已從模板拿掉（只剩軟刪關聯）→ 照舊以內容補鎖一筆', () => {
      const removed = dayTemplate.map(link => ({ ...link, deleted_at: new Date('2026-10-01') }));
      expect(pickCoachLockedRelationIds(removed, [dayRelation(1, 900, 'day:2'), dayRelation(2, 901, 'day:3')])).toEqual(new Set([1]));
    });
  });
});

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

  it('同名同網址、不同天數的教練資源：明確帶天數的先配對，沒帶天數的再補', () => {
    const day2 = { id: 'd2', name: '練習單', url: 'https://example.com/sheet', dayNumber: 2 };
    const day3 = { id: 'd3', name: '練習單', url: 'https://example.com/sheet', dayNumber: 3 };
    const result = partitionIncomingResources([day2, day3], [
      { name: '練習單', url: 'https://example.com/sheet' },
      { name: '練習單', url: 'https://example.com/sheet', dayNumber: 2 }
    ]);
    expect(result.violated).toEqual([]);
    expect(result.rest).toEqual([]);
  });

  it('沒有鎖定資源 → 全部照送出內容建立', () => {
    const incoming = [{ name: 'A' }, { name: 'B', url: 'https://b.example' }];
    expect(partitionIncomingResources([], incoming)).toEqual({ violated: [], rest: incoming });
  });
});
