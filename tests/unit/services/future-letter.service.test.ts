import { prismaMock } from '@tests/utils/prisma-mock';

jest.mock('@/services/database/prisma.service', () => ({ prisma: prismaMock }));

const scheduleFutureLetterDelivery = jest.fn();
const removeFutureLetterJob = jest.fn();
jest.mock('@/queues/future-letter.queue', () => ({
  scheduleFutureLetterDelivery: (...args: unknown[]) => scheduleFutureLetterDelivery(...args),
  removeFutureLetterJob: (...args: unknown[]) => removeFutureLetterJob(...args),
}));

import { BadRequestError, NotFoundError } from '@/middleware/error.middleware';
import { encryptFutureLetterContent } from '@/services/future-letter-encryption.service';
import { assertFutureLetterCanBeSent, futureLetterService, toFutureLetterEntity } from '@/services/future-letter.service';
import { loggerService } from '@/services/logging/logger.service';

function makeLetter(status = 'draft', openedAt: Date | null = null) {
  const id = '550e8400-e29b-41d4-a716-446655440000';
  const encrypted = encryptFutureLetterContent({ currentSelf: '正在努力學習', message: '未來的我，記得回頭看看' }, 3, id);
  return {
    id: 8,
    external_id: id,
    user_id: 3,
    current_self: null,
    message: null,
    content_ciphertext: encrypted.contentCiphertext,
    encryption_iv: encrypted.encryptionIv,
    encryption_auth_tag: encrypted.encryptionAuthTag,
    encryption_version: encrypted.encryptionVersion,
    status,
    deliver_at: new Date('2026-09-01T00:00:00.000Z'),
    sent_at: status === 'draft' ? null : new Date('2026-08-20T00:00:00.000Z'),
    delivered_at: status === 'delivered' ? new Date('2026-09-01T00:00:00.000Z') : null,
    opened_at: openedAt,
    practice_id: 12,
    practice_title_snapshot: status === 'draft' ? null : '學習 TypeScript',
    created_at: new Date('2026-08-01T00:00:00.000Z'),
    updated_at: new Date('2026-08-01T00:00:00.000Z'),
    practices: { external_id: 'f1719492-693b-4b6d-a0b7-ff62f69ce497', title: '學習 TypeScript' },
  };
}

function updatedAtWindow(updatedAt: Date) {
  return { gte: updatedAt, lt: new Date(updatedAt.getTime() + 1) };
}

describe('futureLetterService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    scheduleFutureLetterDelivery.mockResolvedValue(undefined);
    removeFutureLetterJob.mockResolvedValue(undefined);
  });

  it('accepts either content field and rejects two whitespace-only fields', () => {
    expect(() => assertFutureLetterCanBeSent({ status: 'draft' }, { currentSelf: '', message: 'hello' })).not.toThrow();
    expect(() => assertFutureLetterCanBeSent({ status: 'draft' }, { currentSelf: 'me', message: '  ' })).not.toThrow();
    expect(() => assertFutureLetterCanBeSent({ status: 'draft' }, { currentSelf: '\n', message: '  ' })).toThrow(BadRequestError);
    expect(() => assertFutureLetterCanBeSent({ status: 'scheduled' }, { currentSelf: 'me', message: '' })).toThrow(BadRequestError);
  });

  it('encrypts drafts at rest and upserts the existing owner draft', async () => {
    const draft = makeLetter();
    const updatedContent = encryptFutureLetterContent({ currentSelf: 'only this field', message: '' }, 3, draft.external_id);
    prismaMock.future_letters.findFirst.mockResolvedValueOnce(draft as never).mockResolvedValueOnce({
      ...draft,
      content_ciphertext: updatedContent.contentCiphertext,
      encryption_iv: updatedContent.encryptionIv,
      encryption_auth_tag: updatedContent.encryptionAuthTag,
      encryption_version: updatedContent.encryptionVersion,
      practice_id: null,
      practices: null,
    } as never);
    prismaMock.future_letters.updateMany.mockResolvedValue({ count: 1 });

    const result = await futureLetterService.create(3, { currentSelf: 'only this field', message: '', practiceId: null });

    expect(prismaMock.future_letters.create).not.toHaveBeenCalled();
    expect(prismaMock.future_letters.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 8, user_id: 3, status: 'draft', updated_at: updatedAtWindow(draft.updated_at) },
      data: expect.objectContaining({ current_self: null, message: null, content_ciphertext: expect.any(Buffer) }),
    }));
    expect(result.currentSelf).toBe('only this field');
    expect(result.message).toBe('');
  });

  it('redacts scheduled and delivered-unopened content', () => {
    expect(toFutureLetterEntity(makeLetter('scheduled') as never)).toEqual(expect.objectContaining({ currentSelf: null, message: null }));
    expect(toFutureLetterEntity(makeLetter('delivered') as never)).toEqual(expect.objectContaining({ currentSelf: null, message: null, openedAt: null }));
  });

  it('returns 404 semantics when the letter is not owned by the user', async () => {
    prismaMock.future_letters.findFirst.mockResolvedValue(null);
    await expect(futureLetterService.findById(9, makeLetter().external_id)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('sends one-field content, snapshots practice, and returns a redacted response', async () => {
    const draft = makeLetter();
    const scheduled = { ...draft, status: 'scheduled', sent_at: new Date(), practice_title_snapshot: draft.practices.title };
    prismaMock.future_letters.findFirst
      .mockResolvedValueOnce(draft as never)
      .mockResolvedValueOnce(scheduled as never);
    prismaMock.future_letters.updateMany.mockResolvedValue({ count: 1 });

    const result = await futureLetterService.send(3, draft.external_id, new Date(Date.now() + 4 * 86400000).toISOString());

    expect(prismaMock.future_letters.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 8, user_id: 3, status: 'draft', updated_at: updatedAtWindow(draft.updated_at) },
      data: expect.objectContaining({ sent_at: expect.any(Date), practice_title_snapshot: '學習 TypeScript', current_self: null, message: null }),
    }));
    expect(scheduleFutureLetterDelivery).toHaveBeenCalledWith(8, expect.any(Number));
    expect(result).toEqual(expect.objectContaining({ status: 'scheduled', currentSelf: null, message: null }));
  });

  it('soft-deletes a scheduled letter and removes its delayed job', async () => {
    prismaMock.future_letters.findFirst.mockResolvedValue(makeLetter('scheduled') as never);
    prismaMock.future_letters.updateMany.mockResolvedValue({ count: 1 });
    await futureLetterService.softDelete(3, makeLetter().external_id);
    expect(prismaMock.future_letters.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 8, user_id: 3, status: 'scheduled' }, data: expect.objectContaining({ status: 'deleted' }),
    }));
    expect(removeFutureLetterJob).toHaveBeenCalledWith(8);
  });

  it('marks delivery without creating a notification side channel', async () => {
    prismaMock.future_letters.updateMany.mockResolvedValue({ count: 1 });
    await futureLetterService.deliver(8);
    expect(prismaMock.future_letters.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 8, status: 'scheduled' },
      data: expect.objectContaining({ status: 'delivered', delivered_at: expect.any(Date) }),
    }));
  });

  it('opens a delivered letter idempotently and decrypts only after recording openedAt', async () => {
    const unopened = makeLetter('delivered');
    const openedAt = new Date('2026-09-02T00:00:00.000Z');
    const opened = { ...unopened, opened_at: openedAt };
    prismaMock.future_letters.findFirst.mockResolvedValueOnce(unopened as never).mockResolvedValueOnce(opened as never);
    prismaMock.future_letters.updateMany.mockResolvedValue({ count: 1 });

    const result = await futureLetterService.open(3, unopened.external_id);

    expect(prismaMock.future_letters.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 8, status: 'delivered', opened_at: null },
    }));
    expect(result).toEqual(expect.objectContaining({
      currentSelf: '正在努力學習', message: '未來的我，記得回頭看看', openedAt: openedAt.toISOString(),
    }));
  });

  it('does not replace the original openedAt on repeat reads', async () => {
    const opened = makeLetter('delivered', new Date('2026-09-02T00:00:00.000Z'));
    prismaMock.future_letters.findFirst.mockResolvedValue(opened as never);
    await futureLetterService.open(3, opened.external_id);
    expect(prismaMock.future_letters.updateMany).not.toHaveBeenCalled();
  });

  it('recovers missing jobs for overdue and future scheduled letters', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-08-22T00:00:00.000Z'));
    prismaMock.future_letters.findMany.mockResolvedValue([
      { id: 4, deliver_at: new Date('2026-08-21T00:00:00.000Z') },
      { id: 9, deliver_at: new Date('2026-08-24T00:00:00.000Z') },
    ] as never);
    await expect(futureLetterService.recoverOverdueDeliveries()).resolves.toBe(2);
    expect(scheduleFutureLetterDelivery).toHaveBeenNthCalledWith(1, 4, 0);
    expect(scheduleFutureLetterDelivery).toHaveBeenNthCalledWith(2, 9, 2 * 86400000);
    jest.useRealTimers();
  });

  it('continues startup recovery when one letter fails to enqueue', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-08-22T00:00:00.000Z'));
    prismaMock.future_letters.findMany.mockResolvedValue([
      { id: 4, deliver_at: new Date('2026-08-21T00:00:00.000Z') },
      { id: 9, deliver_at: new Date('2026-08-24T00:00:00.000Z') },
    ] as never);
    scheduleFutureLetterDelivery.mockRejectedValueOnce(new Error('redis timeout'));
    const warn = jest.spyOn(loggerService, 'warn').mockImplementation(() => loggerService);

    try {
      await expect(futureLetterService.recoverOverdueDeliveries()).resolves.toBe(1);
      expect(scheduleFutureLetterDelivery).toHaveBeenNthCalledWith(1, 4, 0);
      expect(scheduleFutureLetterDelivery).toHaveBeenNthCalledWith(2, 9, 2 * 86400000);
      expect(warn).toHaveBeenCalledWith('Future letter startup recovery partially failed', {
        scheduledCount: 2,
        recoveredCount: 1,
        failedCount: 1,
        failedLetterIds: [4],
      });
    } finally {
      warn.mockRestore();
      jest.useRealTimers();
    }
  });

  it('rejects a draft patch when send wins the status race', async () => {
    const draft = makeLetter();
    prismaMock.future_letters.findFirst.mockResolvedValue(draft as never);
    prismaMock.future_letters.updateMany.mockResolvedValue({ count: 0 });

    await expect(futureLetterService.update(3, draft.external_id, { message: 'late edit' }))
      .rejects.toThrow('草稿狀態已變更');
    expect(prismaMock.future_letters.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 8, user_id: 3, status: 'draft', updated_at: updatedAtWindow(draft.updated_at) },
    }));
  });

  it('rejects send when patch or delete wins the draft transition race', async () => {
    const draft = makeLetter();
    prismaMock.future_letters.findFirst.mockResolvedValue(draft as never);
    prismaMock.future_letters.updateMany.mockResolvedValue({ count: 0 });

    await expect(futureLetterService.send(3, draft.external_id, new Date(Date.now() + 4 * 86400000).toISOString()))
      .rejects.toThrow('信件已被寄出或狀態已變更');
    expect(prismaMock.future_letters.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 8, user_id: 3, status: 'draft', updated_at: updatedAtWindow(draft.updated_at) },
    }));
    expect(scheduleFutureLetterDelivery).not.toHaveBeenCalled();
  });

  it('advances the draft CAS timestamp even when a patch starts in the same millisecond', async () => {
    const draft = makeLetter();
    jest.useFakeTimers().setSystemTime(draft.updated_at);
    prismaMock.future_letters.findFirst.mockResolvedValue(draft as never);
    prismaMock.future_letters.updateMany.mockResolvedValue({ count: 0 });

    try {
      await expect(futureLetterService.update(3, draft.external_id, { message: 'same millisecond edit' }))
        .rejects.toThrow('草稿狀態已變更');
      const update = prismaMock.future_letters.updateMany.mock.calls[0][0] as {
        data: { updated_at: Date };
      };
      expect(update.data.updated_at.getTime()).toBe(draft.updated_at.getTime() + 1);
    } finally {
      jest.useRealTimers();
    }
  });

  it('keeps the letter scheduled when enqueue cleanup cannot be confirmed', async () => {
    const draft = makeLetter();
    prismaMock.future_letters.findFirst.mockResolvedValue(draft as never);
    prismaMock.future_letters.updateMany.mockResolvedValue({ count: 1 });
    scheduleFutureLetterDelivery.mockRejectedValueOnce(new Error('lost enqueue response'));
    removeFutureLetterJob.mockRejectedValueOnce(new Error('redis unavailable'));

    await expect(futureLetterService.send(3, draft.external_id, new Date(Date.now() + 4 * 86400000).toISOString()))
      .rejects.toThrow('lost enqueue response');

    expect(removeFutureLetterJob).toHaveBeenCalledWith(8);
    expect(prismaMock.future_letters.updateMany).toHaveBeenCalledTimes(1);
  });

  it('rolls send back only after removing an ambiguously enqueued job', async () => {
    const draft = makeLetter();
    prismaMock.future_letters.findFirst.mockResolvedValue(draft as never);
    prismaMock.future_letters.updateMany.mockResolvedValue({ count: 1 });
    scheduleFutureLetterDelivery.mockRejectedValueOnce(new Error('lost enqueue response'));

    await expect(futureLetterService.send(3, draft.external_id, new Date(Date.now() + 4 * 86400000).toISOString()))
      .rejects.toThrow('lost enqueue response');

    expect(removeFutureLetterJob).toHaveBeenCalledWith(8);
    expect(prismaMock.future_letters.updateMany).toHaveBeenCalledTimes(2);
  });

  it('rejects delete when delivery changes the scheduled state first', async () => {
    const scheduled = makeLetter('scheduled');
    prismaMock.future_letters.findFirst.mockResolvedValue(scheduled as never);
    prismaMock.future_letters.updateMany.mockResolvedValue({ count: 0 });

    await expect(futureLetterService.softDelete(3, scheduled.external_id)).rejects.toThrow('信件狀態已變更');
    expect(removeFutureLetterJob).not.toHaveBeenCalled();
  });
});
