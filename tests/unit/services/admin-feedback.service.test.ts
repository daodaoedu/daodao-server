import { prismaMock, setupTransactionMock } from '@tests/utils/prisma-mock';
jest.mock('@/services/database/prisma.service', () => ({ prisma: prismaMock }));
import adminFeedbackService from '@/services/admin-feedback.service';
import { NotFoundError } from '@/middleware/error.middleware';
import { feedbackReplySchema } from '@/validators/admin-feedback.validator';

/**
 * feedback / feedback_replies 不在 prisma/schema.prisma，欄位以 daodao-storage 為準：
 * migrate/sql/043_create_support_audit_tables.sql + 088_add_feedback_source_meta.sql
 * （feedback 沒有 replied_at；回覆時間存在 feedback_replies.created_at）
 */
const FEEDBACK_COLUMNS = new Set(['id', 'user_id', 'content', 'category', 'status', 'created_at', 'updated_at', 'source', 'meta']);
const FEEDBACK_REPLY_COLUMNS = new Set(['id', 'feedback_id', 'admin_id', 'content', 'created_at']);

/** 取出 $queryRaw / $executeRaw 收到的 SQL 文字（Prisma.Sql 物件或 tagged template 的 strings） */
const sqlText = (arg: unknown): string => {
  if (Array.isArray(arg)) return arg.join('?');
  return (arg as { sql: string }).sql;
};

const columnsOf = (sql: string, alias: string): string[] =>
  Array.from(sql.matchAll(new RegExp(`\\b${alias}\\.([a-z_]+)`, 'g')), (m) => m[1]);

describe('adminFeedbackService.listFeedback', () => {
  const mockRows = () => prismaMock.$queryRaw
    .mockResolvedValueOnce([{ total: 2n }] as never)
    .mockResolvedValueOnce([{ total: 5n, pending: 3n, this_month: 1n }] as never)
    .mockResolvedValueOnce([
      {
        id: 7, user_id: 12, user_name: '小島', content: '送出按鈕沒反應', category: 'bug', status: 'replied',
        created_at: new Date('2026-10-10T03:00:00Z'), replied_at: new Date('2026-10-10T05:00:00Z'),
        meta: {
          area: 'ui',
          screenshots: ['https://storage-dev.daodao.so/bug-reports/1791698535059-fd8570e1.png'],
        },
      },
      {
        id: 6, user_id: null, user_name: null, content: '希望有深色模式', category: 'feature', status: 'pending',
        created_at: new Date('2026-10-09T03:00:00Z'), replied_at: null, meta: null,
      },
    ] as never);

  it('只查 feedback／users／feedback_replies 真的存在的欄位（users 沒有 name、feedback 沒有 replied_at）', async () => {
    mockRows();
    await adminFeedbackService.listFeedback({ limit: 20, offset: 0 });

    const sqls = prismaMock.$queryRaw.mock.calls.map(([arg]) => sqlText(arg));
    const listSql = sqls.find((s) => /FROM feedback f\s+LEFT JOIN users u/.test(s));
    expect(listSql).toBeDefined();

    for (const sql of sqls) {
      for (const col of columnsOf(sql, 'f')) expect(FEEDBACK_COLUMNS).toContain(col);
      for (const col of columnsOf(sql, 'fr')) expect(FEEDBACK_REPLY_COLUMNS).toContain(col);
    }
    expect(listSql).toMatch(/\bu\.nickname\b/);
    expect(listSql).not.toMatch(/\bu\.name\b/);
  });

  it('把查詢結果轉成 API 回應：使用者名稱可為 null、回覆時間取最後一則回覆、附上統計', async () => {
    mockRows();
    const result = await adminFeedbackService.listFeedback({ limit: 20, offset: 0 });

    expect(result).toEqual({
      total: 2,
      stats: { total: 5, pending: 3, thisMonth: 1 },
      items: [
        {
          id: 7, userId: 12, userName: '小島', content: '送出按鈕沒反應', category: 'bug', status: 'replied',
          createdAt: '2026-10-10T03:00:00.000Z', repliedAt: '2026-10-10T05:00:00.000Z',
          screenshots: ['https://storage-dev.daodao.so/bug-reports/1791698535059-fd8570e1.png'],
          replies: [],
        },
        {
          id: 6, userId: null, userName: null, content: '希望有深色模式', category: 'feature', status: 'pending',
          createdAt: '2026-10-09T03:00:00.000Z', repliedAt: null, screenshots: [], replies: [],
        },
      ],
    });
  });

  it('列表 SQL 帶出 meta，錯誤回報的截圖網址才能交給後台顯示（daodao#166）', async () => {
    mockRows();
    await adminFeedbackService.listFeedback({ limit: 20, offset: 0 });

    const listSql = prismaMock.$queryRaw.mock.calls
      .map(([arg]) => sqlText(arg))
      .find((s) => /LEFT JOIN users u/.test(s));
    expect(listSql).toMatch(/\bf\.meta\b/);
  });

  it('截圖只回傳可直接載入的 http(s) 網址，略過相對路徑與非字串（R2_PUBLIC_URL 未設時會存成 /bug-reports/...）', async () => {
    prismaMock.$queryRaw
      .mockResolvedValueOnce([{ total: 1n }] as never)
      .mockResolvedValueOnce([{ total: 1n, pending: 1n, this_month: 1n }] as never)
      .mockResolvedValueOnce([
        {
          id: 8, user_id: 12, user_name: '小島', content: '圖', category: 'bug', status: 'pending',
          created_at: new Date('2026-10-11T03:00:00Z'), replied_at: null,
          meta: {
            screenshots: [
              'https://storage.daodao.so/bug-reports/a.png',
              '/bug-reports/b.png',
              'javascript:alert(1)',
              42,
            ],
          },
        },
      ] as never);

    const result = await adminFeedbackService.listFeedback({ limit: 20, offset: 0 });
    expect(result.items[0].screenshots).toEqual(['https://storage.daodao.so/bug-reports/a.png']);
  });

  it('篩選值以參數綁定傳入，不拼進 SQL', async () => {
    mockRows();
    await adminFeedbackService.listFeedback({ status: 'pending', category: 'bug', limit: 20, offset: 0 });

    const listCall = prismaMock.$queryRaw.mock.calls.find(([arg]) => /LEFT JOIN users u/.test(sqlText(arg)));
    const sql = listCall?.[0] as unknown as { text: string; values: unknown[] };
    expect(sql.text).toMatch(/f\.status = \$\d+/);
    expect(sql.text).toMatch(/f\.category = \$\d+/);
    expect(sql.values).toEqual(expect.arrayContaining(['pending', 'bug', 20, 0]));
  });
});

describe('adminFeedbackService.listFeedback 回覆內容（daodao#313）', () => {
  it('每則回饋帶出回覆內容（依時間排序），後台重新整理後才看得到已送出的回覆', async () => {
    prismaMock.$queryRaw
      .mockResolvedValueOnce([{ total: 1n }] as never)
      .mockResolvedValueOnce([{ total: 1n, pending: 0n, this_month: 1n }] as never)
      .mockResolvedValueOnce([
        {
          id: 9, user_id: 12, user_name: '小島', content: '找不到設定', category: 'question', status: 'replied',
          created_at: new Date('2026-10-20T03:00:00Z'), replied_at: new Date('2026-10-21T05:00:00Z'), meta: null,
          // json_agg 回來的 created_at 是字串（Postgres 時區格式）
          replies: [
            { id: 3, content: '在右上角頭像選單', createdAt: '2026-10-21T13:00:00.123456+08:00' },
          ],
        },
      ] as never);

    const result = await adminFeedbackService.listFeedback({ limit: 20, offset: 0 });
    expect(result.items[0].replies).toEqual([
      { id: 3, content: '在右上角頭像選單', createdAt: '2026-10-21T05:00:00.123Z' },
    ]);

    const listSql = prismaMock.$queryRaw.mock.calls
      .map(([arg]) => sqlText(arg))
      .find((s) => /LEFT JOIN users u/.test(s));
    expect(listSql).toMatch(/fr\.content/);
    expect(listSql).toMatch(/ORDER BY fr\.created_at/);
  });
});

describe('adminFeedbackService.replyToFeedback', () => {
  beforeEach(() => setupTransactionMock());

  it('寫回覆後更新 feedback 時不碰不存在的 replied_at 欄位', async () => {
    prismaMock.$executeRaw.mockResolvedValue(1 as never);
    await expect(adminFeedbackService.replyToFeedback(7, '已修正，謝謝回報', 99)).resolves.toEqual({ sent: true });

    const sqls = prismaMock.$executeRaw.mock.calls.map(([arg]) => sqlText(arg));
    const update = sqls.find((s) => /UPDATE feedback SET/.test(s));
    expect(update).toBeDefined();
    expect(update).not.toMatch(/replied_at/);
    expect(update).toMatch(/status = 'replied'/);
  });

  it('回覆記下是哪位管理者回的（feedback_replies.admin_id）', async () => {
    prismaMock.$executeRaw.mockResolvedValue(1 as never);
    await adminFeedbackService.replyToFeedback(7, '已修正', 99);

    const insert = prismaMock.$executeRaw.mock.calls.find(([arg]) => /INSERT INTO feedback_replies/.test(sqlText(arg)));
    expect(sqlText(insert?.[0])).toMatch(/admin_id/);
    expect(insert?.slice(1)).toEqual(expect.arrayContaining([7, 99, '已修正']));
  });

  it('回饋不存在時回 404，不寫入回覆（原本撞 FK 變 500）', async () => {
    prismaMock.$executeRaw.mockResolvedValue(0 as never);
    await expect(adminFeedbackService.replyToFeedback(404404, '已修正', 99)).rejects.toBeInstanceOf(NotFoundError);

    const insert = prismaMock.$executeRaw.mock.calls.find(([arg]) => /INSERT INTO feedback_replies/.test(sqlText(arg)));
    expect(insert).toBeUndefined();
  });
});

describe('adminFeedbackService.updateFeedbackStatus', () => {
  it('回饋不存在時回 404，不再假裝更新成功', async () => {
    prismaMock.$executeRaw.mockResolvedValue(0 as never);
    await expect(adminFeedbackService.updateFeedbackStatus(404404, 'closed')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('更新成功回 updated: true', async () => {
    prismaMock.$executeRaw.mockResolvedValue(1 as never);
    await expect(adminFeedbackService.updateFeedbackStatus(7, 'closed')).resolves.toEqual({ updated: true });
  });
});

describe('feedbackReplySchema', () => {
  it('回覆內容去頭尾空白；只有空白視為空白回覆', () => {
    expect(feedbackReplySchema.parse({ content: '  謝謝回報  ' })).toEqual({ content: '謝謝回報' });
    expect(feedbackReplySchema.safeParse({ content: '   ' }).success).toBe(false);
  });
});
