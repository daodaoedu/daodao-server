import { partitionIncomingResources } from '../coach-resource-lock';

const shared = { id: 'shared-id', name: '場次講義', url: 'http://example.com/A', dayNumber: null, relevantDate: '2027-01-01' };

describe('場次來源資源學員更新契約', () => {
  it('共用來源與日期保持原樣，僅傳回個人新增內容', () => {
    const personal = { name: '我的筆記', url: 'https://example.com/mine' };
    expect(partitionIncomingResources([shared], [{ ...shared }, personal])).toEqual({ violated: [], rest: [personal] });
  });
  it('相同內容的另一個來源 id 不能代替共用來源', () => {
    expect(partitionIncomingResources([shared], [{ ...shared, id: 'foreign-id' }]).violated).toEqual([shared]);
  });
  it.each(['2027-02-01', null])('學員不能更動或清除場次日期 %s', relevantDate => {
    expect(partitionIncomingResources([shared], [{ ...shared, relevantDate }]).violated).toEqual([shared]);
  });
  it('既有客戶端未帶 id 或參考日期時，仍可保留原共用內容', () => {
    expect(partitionIncomingResources([shared], [{ name: shared.name, url: shared.url }]).violated).toEqual([]);
  });
});
