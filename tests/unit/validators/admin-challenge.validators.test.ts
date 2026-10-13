import { adminCreateTemplateSchema, adminUpdateTemplateSchema } from '../../../src/validators/admin-challenge.validator';

describe('admin-challenge validators — template', () => {
  it('create 未帶 practiceTimePeriods 時預設為空陣列', () => {
    const parsed = adminCreateTemplateSchema.parse({ title: '晨間書寫' });
    expect(parsed.practiceTimePeriods).toEqual([]);
  });

  it('#179 create 不接受 client 指定組織：夾帶的 organizationId 會被略過', () => {
    const parsed = adminCreateTemplateSchema.parse({ organizationId: 3, title: '晨間書寫' });
    expect('organizationId' in parsed).toBe(false);
  });

  it('update 未帶 practiceTimePeriods 時不可注入空陣列（否則 PATCH 會清空既有時段）', () => {
    const parsed = adminUpdateTemplateSchema.parse({ title: '只改標題' });
    expect('practiceTimePeriods' in parsed).toBe(false);
    expect(parsed.practiceTimePeriods).toBeUndefined();
  });

  it('update 空物件應被拒絕', () => {
    expect(() => adminUpdateTemplateSchema.parse({})).toThrow();
  });
});
