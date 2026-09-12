/**
 * Email Type Sync Integration Test
 *
 * 驗證程式碼中的 EMAIL_TYPES 與 DB email_logs_email_type_check constraint 一致。
 * 需要真實 DB 連線，適合在 CI 或本地開發環境中執行。
 */

import { PrismaClient } from '../../../generated/prisma';
import { EMAIL_TYPES } from '@/types/email/base.types';

const prisma = new PrismaClient();

/** Parse PostgreSQL's rendered email-type CHECK constraint without losing digits. */
function constraintValues(definition: string): Set<string> {
  const arrayMatch = definition.match(/ARRAY\[([^\]]+)\]/);
  const matches = (arrayMatch ? arrayMatch[1] : definition).match(/'([a-z0-9_]+)'/g) || [];
  return new Set(matches.map(value => value.replace(/'/g, '')));
}

describe('email constraint value parsing', () => {
  it.each([
    "CHECK (email_type = ANY (ARRAY['onboarding_l0'::text, 'challenge_t48h'::text, 'challenge_day1'::text]))",
    "CHECK (email_type IN ('onboarding_l0', 'challenge_t48h', 'challenge_day1'))",
  ])('preserves digit-bearing values in %s', definition => {
    expect([...constraintValues(definition)]).toEqual(['onboarding_l0', 'challenge_t48h', 'challenge_day1']);
    expect(constraintValues(definition).has('not_present')).toBe(false);
  });
});

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

    // 從 CHECK constraint 的 ANY(ARRAY[...]) 或 IN (...) 語法中精確解析值
    // 只匹配 ::character varying 或逗號/括號分隔的單引號字串
    const dbValues = constraintValues(def);

    const codeValues = Object.values(EMAIL_TYPES);

    // 程式碼有但 DB 沒有 → INSERT 會失敗
    const missingInDb = codeValues.filter((v) => !dbValues.has(v));

    // DB 有但程式碼沒有 → 可能是殘留
    const missingInCode = Array.from(dbValues).filter(
      (v) => !codeValues.includes(v as typeof codeValues[number])
    );

    if (missingInCode.length > 0) {
      expect(missingInCode).toEqual(
        expect.arrayContaining([])
      );
      // eslint-disable-next-line no-console
      console.warn(
        `[email-type-sync] DB constraint 有但 EMAIL_TYPES 沒有（可能是殘留）: ${missingInCode.join(', ')}`
      );
    }

    expect(missingInDb).toEqual([]);
  });
});
