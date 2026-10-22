/**
 * Readiness 檢查回歸測試（daodao#362）
 *
 * 2026-10-22 主機重開機後 pg／redis 沒起來，`/api/v1/health` 仍回 ok。
 * readiness 必須在任一依賴連不到（拋錯或卡住）時回 error。
 */

import { checkReadiness, toPublicReadiness } from '@/services/health.service';

describe('checkReadiness', () => {
  it('所有依賴正常時回 ok', async () => {
    const result = await checkReadiness({
      database: async () => 1,
      redis: async () => 'PONG',
    });

    expect(result.status).toBe('ok');
    expect(result.checks.database.status).toBe('ok');
    expect(result.checks.redis.status).toBe('ok');
  });

  it('DB 連不到時回 error（重開機後 pg 停在 Exited 的情境）', async () => {
    const result = await checkReadiness({
      database: async () => {
        throw new Error("Can't reach database server at pg-prod:5432");
      },
      redis: async () => 'PONG',
    });

    expect(result.status).toBe('error');
    expect(result.checks.database.status).toBe('error');
    expect(result.checks.database.error).toContain('pg-prod');
    expect(result.checks.redis.status).toBe('ok');
  });

  it('Redis 卡住不回應時以逾時判定為 error', async () => {
    const result = await checkReadiness(
      {
        database: async () => 1,
        redis: () => new Promise(() => undefined),
      },
      20
    );

    expect(result.status).toBe('error');
    expect(result.checks.redis.status).toBe('error');
    expect(result.checks.redis.error).toContain('timeout');
  });

  it('檢查函式同步拋錯也算 error，不會讓端點本身 500', async () => {
    const result = await checkReadiness({
      redis: () => {
        throw new Error('boom');
      },
    });

    expect(result.status).toBe('error');
    expect(result.checks.redis.status).toBe('error');
  });
});

describe('toPublicReadiness', () => {
  it('對外回應不包含錯誤細節', async () => {
    const result = await checkReadiness({
      database: async () => {
        throw new Error("Can't reach database server at pg-prod:5432");
      },
    });

    const body = toPublicReadiness(result);

    expect(body.status).toBe('error');
    expect(JSON.stringify(body)).not.toContain('pg-prod');
    expect(body.checks.database).toEqual({ status: 'error', latencyMs: expect.any(Number) });
  });
});
