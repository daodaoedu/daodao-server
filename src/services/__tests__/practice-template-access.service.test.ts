import { Prisma } from '../../../generated/prisma';
import {
  getTemplates, getRandomTemplates, getTemplateById, getTemplateCategories,
  getPopularTemplates, getTemplateUsageStats, updateTemplate, deleteTemplate, createTemplate, batchCreateTemplates
} from '../practice-template.service';

jest.mock('../database/prisma.service', () => ({ prisma: {
  practice_templates: { findMany: jest.fn(), findFirst: jest.fn(), count: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  content_categories: { findMany: jest.fn() },
  entity_tags: { findMany: jest.fn(), deleteMany: jest.fn() },
  entity_resources: { findMany: jest.fn() },
  practice_template_categories: { deleteMany: jest.fn() },
  practices: { groupBy: jest.fn(), count: jest.fn(), findMany: jest.fn() },
  $transaction: jest.fn()
} }));
jest.mock('../logging/logger.service', () => ({ loggerService: { warn: jest.fn(), info: jest.fn(), error: jest.fn() } }));

type Row = Record<string, unknown>;
type Query = { where?: Row; skip?: number; take?: number; data?: Row };
type MockDelegate = Record<string, jest.Mock>;
const { prisma: db } = jest.requireMock<{ prisma: {
  practice_templates: MockDelegate;
  content_categories: MockDelegate;
  entity_tags: MockDelegate;
  entity_resources: MockDelegate;
  practice_template_categories: MockDelegate;
  practices: MockDelegate;
  $transaction: jest.Mock;
} }>('../database/prisma.service');
let rows: Row[];

/** Evaluate the small Prisma predicate subset used by these fixtures. */
function matches(row: Row, where: Row = {}): boolean {
  return Object.entries(where).every(([key, value]) => {
    if (key === 'AND') return (Array.isArray(value) ? value : [value]).every(w => matches(row, w as Row));
    const actual = row[key];
    if (value === null || typeof value !== 'object') return actual === value;
    const condition = value as Row;
    if ('in' in condition) return (condition.in as unknown[]).includes(actual);
    if ('not' in condition) return actual !== condition.not;
    if ('contains' in condition) return String(actual).toLowerCase().includes(String(condition.contains).toLowerCase());
    if ('some' in condition) return (actual as Row[]).some(item => matches(item, condition.some as Row));
    if ('is' in condition) return matches(actual as Row, condition.is as Row);
    return actual !== null && typeof actual === 'object' && matches(actual as Row, condition);
  });
}

/** Construct actual visibility states rather than mocking prefiltered results. */
function template(id: number, fields: Row = {}): Row {
  return {
    id, external_id: `template-${id}`, title: `Template ${id}`, organization_id: null,
    archived_at: null, deleted_at: null, practice_action: '閱讀', frequency_min_days: 1,
    frequency_max_days: 7, duration_days: 21, session_duration_minutes: 15,
    practice_time_periods: ['morning'], organization: null,
    created_at: new Date('2026-11-04T00:00:00Z'),
    practice_template_categories: [{ content_categories: { name: `category-${id}` } }],
    ...fields
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  rows = [template(1), template(2, { organization_id: 900001 }),
    template(3, { archived_at: new Date() }), template(4, { deleted_at: new Date() })];
  db.practice_templates.findMany.mockImplementation((async ({ where, skip = 0, take }: Query) => rows.filter(r => matches(r, where)).slice(skip, take === undefined ? undefined : skip + take)));
  db.practice_templates.findFirst.mockImplementation((async ({ where }: Query) => rows.find(r => matches(r, where)) ?? null));
  db.practice_templates.count.mockImplementation((async ({ where }: Query) => rows.filter(r => matches(r, where)).length));
  db.practice_templates.update.mockImplementation((async ({ where, data }: Query) => {
    const row = rows.find(r => matches(r, where));
    if (!row) throw new Prisma.PrismaClientKnownRequestError('Record not found', { code: 'P2025', clientVersion: '6.16.2' });
    Object.assign(row, data);
    return row;
  }));
  db.practice_templates.delete.mockImplementation((async ({ where }: Query) => {
    const index = rows.findIndex(r => matches(r, where));
    if (index < 0) throw new Prisma.PrismaClientKnownRequestError('Record not found', { code: 'P2025', clientVersion: '6.16.2' });
    return rows.splice(index, 1)[0];
  }));
  db.practice_templates.create.mockImplementation((async ({ data }: Query) => {
    const created = template(rows.length + 1, data);
    rows.push(created);
    return created;
  }));
  db.entity_tags.findMany.mockResolvedValue([]);
  db.entity_resources.findMany.mockResolvedValue([]);
  db.practice_template_categories.deleteMany.mockResolvedValue({ count: 0 });
  db.entity_tags.deleteMany.mockResolvedValue({ count: 0 });
  db.practices.count.mockResolvedValue(1);
  db.practices.findMany.mockResolvedValue([]);
  db.practices.groupBy.mockImplementation((async ({ where, take }: Query) => rows
    .filter(row => !where?.practice_templates || matches(row, where.practice_templates as Row))
    .map(row => ({ template_id: row.id, _count: { id: 1 } })).slice(0, take)));
  db.content_categories.findMany.mockImplementation((async ({ where }: Query) => rows.map(row => ({
    name: `category-${row.id}`, practice_template_categories: [{ practice_templates: row }]
  })).filter(row => matches(row, where))));
  db.$transaction.mockImplementation((async (action: unknown) => typeof action === 'function' ? action(db) : Promise.all(action as Promise<unknown>[])));
});

describe('public official template boundary (#464)', () => {
  it('lists and counts only active official templates, including search/category filters', async () => {
    const result = await getTemplates({ search: 'Template', category: 'category-1' });
    expect(result.data.map(t => t.id)).toEqual(['template-1']);
    expect(result.pagination.totalItems).toBe(1);
    const all = await getTemplates();
    expect(all.data.map(t => t.id)).toEqual(['template-1']);
    expect(all.pagination.totalItems).toBe(1);
  });

  it('returns an empty official list and zero total when all database templates are hidden', async () => {
    rows = rows.slice(1);
    const result = await getTemplates();
    expect(result.data).toEqual([]);
    expect(result.pagination.totalItems).toBe(0);
  });

  it('returns no random templates when the database has only hidden templates', async () => {
    rows = rows.slice(1);
    expect((await getRandomTemplates({ count: 100 })).data).toEqual([]);
  });

  it('returns no categories when every category belongs only to hidden templates', async () => {
    rows = rows.slice(1);
    expect((await getTemplateCategories()).data).toEqual([]);
  });

  it('keeps the visible database total on an empty page rather than substituting built-in templates', async () => {
    const result = await getTemplates({ page: 2, limit: 1 });
    expect(result.data).toEqual([]);
    expect(result.pagination.totalItems).toBe(1);
  });

  it('retains built-in fallback templates and categories when database reads fail', async () => {
    db.practice_templates.findMany.mockRejectedValueOnce(new Error('Database unavailable'));
    const list = await getTemplates();
    expect(list.data.map(item => item.id)).toContain('tpl-reading-daily');
    expect(list.pagination.totalItems).toBe(8);
    db.practice_templates.findMany.mockRejectedValueOnce(new Error('Database unavailable'));
    expect((await getRandomTemplates({ count: 100 })).data.map(item => item.id)).toContain('tpl-reading-daily');
    db.content_categories.findMany.mockRejectedValueOnce(new Error('Database unavailable'));
    expect((await getTemplateCategories()).data).toContain('reading');
  });

  it('random selection excludes private, archived, and deleted templates', async () => {
    expect((await getRandomTemplates({ count: 100 })).data.map(t => t.id)).toEqual(['template-1']);
  });

  it.each([2, 3, 4])('does not disclose hidden template %s details or usage', async id => {
    expect((await getTemplateById(`template-${id}`)).data).toBeNull();
    expect((await getTemplateUsageStats(`template-${id}`)).data).toBeNull();
    expect(db.entity_tags.findMany).not.toHaveBeenCalled();
    expect(db.entity_resources.findMany).not.toHaveBeenCalled();
    expect(db.practices.findMany).not.toHaveBeenCalled();
  });

  it('keeps official details available', async () => {
    expect((await getTemplateById('template-1')).data).toMatchObject({ id: 'template-1', title: 'Template 1' });
  });

  it('does not reveal categories used only by hidden templates', async () => {
    expect((await getTemplateCategories()).data).toEqual(['category-1']);
  });

  it('popular limit applies after excluding hidden templates', async () => {
    rows.reverse();
    expect((await getPopularTemplates(1)).data.map(t => t.id)).toEqual(['template-1']);
  });

  it.each([2, 3, 4])('cannot update or delete hidden template %s', async id => {
    const before = JSON.stringify(rows);
    expect((await updateTemplate(`template-${id}`, { title: '覆寫' })).data).toBeNull();
    await expect(deleteTemplate(`template-${id}`)).rejects.toMatchObject({ statusCode: 404 });
    expect(JSON.stringify(rows)).toBe(before);
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it('can still update and delete official templates', async () => {
    expect((await updateTemplate('template-1', { title: '官方模板更新' })).data?.title).toBe('官方模板更新');
    expect((await deleteTemplate('template-1')).data).toEqual({ deleted: true });
    expect(rows.map(r => r.external_id)).toEqual(['template-2', 'template-3', 'template-4']);
  });

  it('rejects update if the template becomes hidden after lookup', async () => {
    const findFirst = db.practice_templates.findFirst.getMockImplementation();
    db.practice_templates.findFirst.mockImplementationOnce((async (...args: [Query]) => {
      const result = await findFirst?.(...args);
      rows[0].organization_id = 900001;
      return result;
    }));
    await expect(updateTemplate('template-1', { title: '覆寫' })).rejects.toMatchObject({ statusCode: 404 });
    expect(rows[0].title).toBe('Template 1');
  });

  it('rejects deletion if the template becomes hidden after lookup', async () => {
    const findFirst = db.practice_templates.findFirst.getMockImplementation();
    db.practice_templates.findFirst.mockImplementationOnce((async (...args: [Query]) => {
      const result = await findFirst?.(...args);
      rows[0].deleted_at = new Date();
      return result;
    }));
    await expect(deleteTemplate('template-1')).rejects.toMatchObject({ statusCode: 404 });
    expect(rows.map(row => row.external_id)).toContain('template-1');
  });


  it('creation cannot assign an organization even if extra fields are passed', async () => {
    const input = { title: '官方新增模板', organization_id: 900001, organizationId: 900001 };
    const created = await createTemplate(input);
    expect(created.data.title).toBe('官方新增模板');
    expect(rows[4].organization_id).toBeNull();
    expect((await getTemplateById(created.data.id)).data?.title).toBe('官方新增模板');
  });

  it('batch creation keeps every template official despite extra organization fields', async () => {
    const input = { title: '官方批次模板', organization_id: 900001, organizationId: 900001 };
    const created = await batchCreateTemplates([input, { title: '第二個官方模板' }]);
    expect(created.data.templates.map(t => t.title)).toEqual(['官方批次模板', '第二個官方模板']);
    expect(rows.slice(4).map(row => row.organization_id)).toEqual([null, null]);
  });

});
