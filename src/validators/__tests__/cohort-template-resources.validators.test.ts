import { cohortTemplateResourcesResponseSchema, updateCohortTemplateResourcesSchema, type CohortTemplateResourceInput } from '../cohort-template-resources.validators';

const parseResources = (resources: unknown[]): CohortTemplateResourceInput[] => updateCohortTemplateResourcesSchema.parse({ resources }).resources;
const accepts = (resources: unknown[]): boolean => updateCohortTemplateResourcesSchema.safeParse({ resources }).success;

describe('場次共用資源輸入（FRD TP-004）', () => {
  it('接受空清單，允許清空場次資源', () => {
    expect(parseResources([])).toEqual([]);
  });

  it('正規化網址與名稱並保留 stable id、清單順序和日期', () => {
    expect(parseResources([
      { id: 8, name: '  中文活動  ', url: '  HTTP://Example.COM:80/course  ', relevantDate: '2028-02-29' },
      { id: 3, name: '同名', url: 'example.com/course' },
      { name: '同名', url: 'HTTPS://OTHER.EXAMPLE/course', relevantDate: null }
    ])).toEqual([
      { id: 8, name: '中文活動', url: 'http://example.com/course', relevantDate: '2028-02-29' },
      { id: 3, name: '同名', url: 'https://example.com/course', relevantDate: null },
      { name: '同名', url: 'https://other.example/course', relevantDate: null }
    ]);
  });

  it.each([undefined, null, '', '  '])('接受無連結資源（%s），統一輸出空字串', url => {
    expect(parseResources([{ name: '講義', url }])).toEqual([{ name: '講義', url: '', relevantDate: null }]);
  });

  it.each(['javascript:alert(1)', 'javascript:123', 'ftp://example.com/file', 'mailto:teacher@example.com', 'http://', 'https://', 'not a url', 'http:example.com', 'https:/example.com', 'https://exam ple.com', 'https://example.com:99999/course', 'https://example.com\\evil'])('拒絕無效或不支援的網址 %s', url => {
    expect(accepts([{ name: '講義', url }])).toBe(false);
  });

  it('接受未填協定但有 port 的網址', () => {
    expect(parseResources([{ name: '講義', url: 'example.com:8443/course' }])[0].url).toBe('https://example.com:8443/course');
  });

  it.each(['not-a-url', 'localhost', 'localhost:3000'])('沿用原型有效hostname規則，接受單標籤網址 %s', url => {
    expect(parseResources([{ name: '內部資料', url }])[0].url).toBe(new URL(`https://${url}`).href);
  });

  it.each(['', '   ', 'x'.repeat(101)])('拒絕空白或超長名稱', name => {
    expect(accepts([{ name }])).toBe(false);
  });

  it('允許50筆並拒絕第51筆', () => {
    const resources = Array.from({ length: 51 }, (_, index) => ({ name: `資源${index}` }));
    expect(parseResources(resources.slice(0, 50))).toHaveLength(50);
    expect(accepts(resources)).toBe(false);
  });

  it.each([
    ['example.com', 'HTTPS://EXAMPLE.COM:443/'],
    ['HTTP://EXAMPLE.COM:80/course', 'http://example.com/course'],
    ['https://example.com/course/#one', 'https://example.com/course#two']
  ])('正規化後的重複網址不可加入：%s / %s', (first, second) => {
    const result = updateCohortTemplateResourcesSchema.safeParse({ resources: [{ name: '甲', url: first }, { name: '乙', url: second }] });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues).toEqual(expect.arrayContaining([expect.objectContaining({ path: ['resources', 1, 'url'] })]));
  });

  it('保留顯示網址片段及路徑大小寫，不合併HTTP與HTTPS', () => {
    expect(parseResources([{ name: '甲', url: 'HTTP://EXAMPLE.COM/Course#Lesson' }, { name: '乙', url: 'https://example.com/Course' }, { name: '丙', url: 'http://example.com/course' }]).map(resource => resource.url)).toEqual(['http://example.com/Course#Lesson', 'https://example.com/Course', 'http://example.com/course']);
  });

  it('無網址的trim後同名資源不可重複，與有網址同名資源可共存', () => {
    expect(accepts([{ name: '講義' }, { name: ' 講義 ', url: '' }])).toBe(false);
    expect(accepts([{ name: '講義' }, { name: '講義', url: 'example.com' }])).toBe(true);
    expect(accepts([{ name: '中文 Guide' }, { name: ' 中文 guide ' }])).toBe(false);
  });

  it.each(['2026-02-29', '2026-04-31', '2026-13-01', '2026-00-01', '2026-1-01', '2026-01-01T00:00:00Z', ''])('拒絕無效日期 %s', relevantDate => {
    expect(accepts([{ name: '講義', relevantDate }])).toBe(false);
  });

  it('不以日期排程：接受過去及未來有效日期，也可清除日期', () => {
    expect(parseResources([{ name: '過去', relevantDate: '2020-01-01' }, { name: '未來', relevantDate: '2099-12-31' }, { name: '清除', relevantDate: null }]).map(resource => resource.relevantDate)).toEqual(['2020-01-01', '2099-12-31', null]);
  });

  it.each([0, -1, 1.5, '1', null])('拒絕無效 stable id %s', id => {
    expect(accepts([{ id, name: '講義' }])).toBe(false);
  });

  it('拒絕重複 stable id，避免同一資源被更新兩次', () => {
    expect(accepts([{ id: 1, name: '甲' }, { id: 1, name: '乙' }])).toBe(false);
  });
});

describe('場次資源回應', () => {
  it('保留整數id、空連結、日期及伺服器清單順序', () => {
    const resources = [{ id: 9, name: '新版', url: '', relevantDate: null }, { id: 2, name: '舊版', url: 'http://example.com', relevantDate: '2026-12-01' }];
    expect(cohortTemplateResourcesResponseSchema.parse(resources)).toEqual(resources);
  });
});


describe('場次 URL 儲存長度', () => {
  it('拒絕正規化後超過資料庫 1000 字元的連結', () => {
    expect(updateCohortTemplateResourcesSchema.safeParse({ resources: [{ name: '長連結', url: 'https://example.com/' + 'a'.repeat(1000) }] }).success).toBe(false);
  });
});
