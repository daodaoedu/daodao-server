/**
 * id-converter Unit Tests — daodao#250
 *
 * 非 UUID 的 external_id 走進 UUID 欄位查詢時，Prisma 會丟「Inconsistent column data」，
 * 舊實作把 Prisma 原始訊息（含 invocation 片段與 /app/dist 絕對路徑）串進一般 Error 回給客戶端，變成 500。
 */

import { prismaMock } from '@tests/utils/prisma-mock';

jest.mock('@/services/database/prisma.service', () => ({
  prisma: prismaMock,
}));

jest.mock('@/services/logging/logger.service', () => ({
  loggerService: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

import { externalToInternalId, internalToExternalId } from '@/services/id-converter.service';
import { AppError, BadRequestError, NotFoundError } from '@/middleware/error.middleware';

const LEAKY_PRISMA_MESSAGE =
  '\nInvalid `prisma_service_1.prisma.users.findUnique()` invocation in\n' +
  '/app/dist/src/services/id-converter.service.js:69:62\n\n' +
  '→ 69     result = await prisma_service_1.prisma.users.findUnique(\n' +
  'Inconsistent column data: Error creating UUID, invalid character';

const INTERNAL_DETAIL = /prisma|invocation|\/app\/|\.js:\d|Inconsistent column data/i;

describe('externalToInternalId — daodao#250', () => {
  it.each(['user', 'practice', 'resource', 'idea', 'group', 'circle'] as const)(
    '%s：非 UUID 格式直接回 400，不碰 DB',
    async (entityType) => {
      const error = await externalToInternalId(entityType, 'no-such-user').catch(e => e);

      expect(error).toBeInstanceOf(BadRequestError);
      expect((error as AppError).statusCode).toBe(400);
      expect((error as Error).message).not.toMatch(INTERNAL_DETAIL);
      expect(prismaMock.users.findUnique).not.toHaveBeenCalled();
      expect(prismaMock.practices.findUnique).not.toHaveBeenCalled();
    }
  );

  it('合法 UUID 但不存在 → 維持 404 NotFoundError（不回歸）', async () => {
    prismaMock.users.findUnique.mockResolvedValue(null);

    const error = await externalToInternalId('user', '00000000-0000-4000-8000-000000000000').catch(e => e);

    expect(error).toBeInstanceOf(NotFoundError);
    expect((error as AppError).statusCode).toBe(404);
  });

  it('合法 UUID 且存在 → 回內部 id（不回歸）', async () => {
    prismaMock.users.findUnique.mockResolvedValue({ id: 42 } as never);

    await expect(externalToInternalId('user', '3F2504E0-4F89-41D3-9A0C-0305E82C3301')).resolves.toBe(42);
  });

  it('底層 DB 錯誤不得把 Prisma 訊息、檔案路徑帶給呼叫端', async () => {
    prismaMock.users.findUnique.mockRejectedValue(new Error(LEAKY_PRISMA_MESSAGE));

    const error = await externalToInternalId('user', '00000000-0000-4000-8000-000000000000').catch(e => e);

    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).statusCode).toBe(500);
    expect((error as Error).message).not.toMatch(INTERNAL_DETAIL);
  });

  it('整數型實體收到非整數 → 400，不是 500', async () => {
    const error = await externalToInternalId('post', 'abc').catch(e => e);

    expect(error).toBeInstanceOf(BadRequestError);
    expect((error as AppError).statusCode).toBe(400);
  });
});

describe('internalToExternalId — daodao#250', () => {
  it('底層 DB 錯誤不得把 Prisma 訊息、檔案路徑帶給呼叫端', async () => {
    prismaMock.users.findUnique.mockRejectedValue(new Error(LEAKY_PRISMA_MESSAGE));

    const error = await internalToExternalId('user', 1).catch(e => e);

    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).statusCode).toBe(500);
    expect((error as Error).message).not.toMatch(INTERNAL_DETAIL);
  });
});
