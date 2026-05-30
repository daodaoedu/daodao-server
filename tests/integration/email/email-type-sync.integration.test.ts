/**
 * Email Type Sync Integration Test
 *
 * 驗證程式碼中的 EMAIL_TYPES 與 DB email_logs_email_type_check constraint 一致。
 * 需要真實 DB 連線，適合在 CI 或本地開發環境中執行。
 */

import { PrismaClient } from '../../../generated/prisma';
import { EMAIL_TYPES } from '@/types/email/base.types';

const prisma = new PrismaClient();

afterAll(async () => {
  await prisma.$disconnect();
});

describe('EMAIL_TYPES vs DB constraint sync', () => {
  it('should have all EMAIL_TYPES values allowed by the DB check constraint', async () => {
    const rows = await prisma.$queryRaw<Array<{ constraint_def: string }>>`
      SELECT pg_get_constraintdef(oid) AS constraint_def
      FROM pg_constraint
      WHERE conrelid = 'email_logs'::regclass
        AND conname = 'email_logs_email_type_check'
    `;

    expect(rows.length).toBe(1);

    const def = rows[0].constraint_def;

    // 從 constraint 定義中解析出所有允許的值
    const matches = def.match(/'([^']+)'/g) || [];
    const dbValues = new Set(matches.map((m: string) => m.replace(/'/g, '')));

    const codeValues = Object.values(EMAIL_TYPES);

    // 程式碼有但 DB 沒有 → INSERT 會失敗
    const missingInDb = codeValues.filter((v) => !dbValues.has(v));

    // DB 有但程式碼沒有 → 可能是殘留，警告即可
    const missingInCode = Array.from(dbValues).filter(
      (v) => !codeValues.includes(v as typeof codeValues[number])
    );

    if (missingInCode.length > 0) {
      console.warn(
        `DB constraint 有但 EMAIL_TYPES 沒有（可能是殘留）: ${missingInCode.join(', ')}`
      );
    }

    expect(missingInDb).toEqual([]);
  });
});
