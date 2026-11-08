import {
  createOrganizationTemplateSchema,
  updateOrganizationTemplateSchema,
} from '../organization-template.validators';

describe('organization template partial updates', () => {
  it('changes only the requested title without inserting timing or publication defaults', () => {
    expect(updateOrganizationTemplateSchema.parse({ title: '  新名稱 📚  ' })).toEqual({
      title: '新名稱 📚',
    });
  });

  it.each([{}, { unknownField: 'ignored' }])('rejects an update without recognized fields: %j', (input) => {
    const result = updateOrganizationTemplateSchema.safeParse(input);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(expect.arrayContaining([
        expect.objectContaining({ message: '至少提供一個欄位' }),
      ]));
    }
  });

  it('keeps an explicit empty timing array so a caller can clear the saved timing', () => {
    expect(updateOrganizationTemplateSchema.parse({ practiceTimePeriods: [] })).toEqual({
      practiceTimePeriods: [],
    });
  });

  it.each(['draft', 'ready'] as const)('keeps an explicitly requested %s status', (status) => {
    expect(updateOrganizationTemplateSchema.parse({ status })).toEqual({ status });
  });

  it('keeps creation defaults for a new complete template', () => {
    const result = createOrganizationTemplateSchema.parse({
      practiceAction: '每天閱讀十分鐘',
      durationDays: 21,
      frequencyMinDays: 3,
      frequencyMaxDays: 5,
    });

    expect(result.status).toBe('ready');
    expect(result.practiceTimePeriods).toEqual([]);
  });

  it('keeps a newly created draft as a draft when timing is omitted', () => {
    const result = createOrganizationTemplateSchema.parse({
      title: '尚在規劃',
      status: 'draft',
    });

    expect(result.status).toBe('draft');
    expect(result.practiceTimePeriods).toEqual([]);
  });
});
