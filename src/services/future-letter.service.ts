import { randomUUID } from 'crypto';
import type { future_letters, practices } from '../../generated/prisma';
import { Prisma } from '../../generated/prisma';
import { prisma } from './database/prisma.service';
import { BadRequestError, NotFoundError } from '../middleware/error.middleware';
import { FUTURE_LETTER_STATUS, FutureLetterEntity, FutureLetterPage } from '../types/future-letter.types';
import type { CreateFutureLetterInput, FutureLetterListQuery, UpdateFutureLetterInput } from '../validators/future-letter.validators';
import { removeFutureLetterJob, scheduleFutureLetterDelivery } from '../queues/future-letter.queue';
import { loggerService } from './logging/logger.service';
import { EMAIL_TYPES } from '../types/email';
import { enqueuePendingFutureLetterEmails, FUTURE_LETTER_EMAIL_CODE, FUTURE_LETTER_EMAIL_ENTITY } from './email/future-letter-email.service';
import { FUTURE_LETTER_EMAIL_SUBJECT } from './email/future-letter-template';
import {
  decryptFutureLetterContent,
  encryptFutureLetterContent,
  type FutureLetterContent,
} from './future-letter-encryption.service';

type FutureLetterWithPractice = future_letters & { practices: Pick<practices, 'external_id' | 'title'> | null };

const includePractice = { practices: { select: { external_id: true, title: true } } } as const;

function nextUpdatedAt(previous: Date): Date {
  return new Date(Math.max(Date.now(), previous.getTime() + 1));
}

function updatedAtVersionWindow(previous: Date): { gte: Date; lt: Date } {
  return { gte: previous, lt: new Date(previous.getTime() + 1) };
}

function readContent(letter: FutureLetterWithPractice): FutureLetterContent {
  if (letter.content_ciphertext) {
    return decryptFutureLetterContent(letter, letter.user_id, letter.external_id);
  }
  // Transitional compatibility for rows created before secure migration 082.
  return { currentSelf: letter.current_self ?? '', message: letter.message ?? '' };
}

function mayExposeContent(letter: FutureLetterWithPractice): boolean {
  return letter.status === FUTURE_LETTER_STATUS.DRAFT
    || (letter.status === FUTURE_LETTER_STATUS.DELIVERED && letter.opened_at !== null);
}

/** Map a database row into an owner-safe public representation. */
export function toFutureLetterEntity(letter: FutureLetterWithPractice): FutureLetterEntity {
  const livePracticeId = letter.practices?.external_id ?? null;
  const practiceTitle = letter.practice_title_snapshot ?? letter.practices?.title ?? null;
  const content = mayExposeContent(letter) ? readContent(letter) : null;
  return {
    id: letter.external_id,
    currentSelf: content?.currentSelf ?? null,
    message: content?.message ?? null,
    status: letter.status as FutureLetterEntity['status'],
    deliverAt: letter.deliver_at?.toISOString() ?? null,
    sentAt: letter.sent_at?.toISOString() ?? null,
    deliveredAt: letter.delivered_at?.toISOString() ?? null,
    openedAt: letter.opened_at?.toISOString() ?? null,
    practiceId: livePracticeId,
    practice: practiceTitle ? { id: livePracticeId, title: practiceTitle } : null,
    createdAt: letter.created_at.toISOString(),
    updatedAt: letter.updated_at.toISOString(),
  };
}

async function resolvePracticeId(userId: number, practiceId: string | null | undefined): Promise<number | null | undefined> {
  if (practiceId === undefined) return undefined;
  if (practiceId === null) return null;
  const practice = await prisma.practices.findFirst({
    where: { external_id: practiceId, user_id: userId, deleted_at: null },
    select: { id: true },
  });
  if (!practice) throw new NotFoundError('找不到指定的主題實踐');
  return practice.id;
}

function encryptedData(content: FutureLetterContent, userId: number, externalId: string): {
  current_self: null;
  message: null;
  content_ciphertext: Buffer;
  encryption_iv: Buffer;
  encryption_auth_tag: Buffer;
  encryption_version: string;
} {
  const encrypted = encryptFutureLetterContent(content, userId, externalId);
  return {
    current_self: null,
    message: null,
    content_ciphertext: encrypted.contentCiphertext,
    encryption_iv: encrypted.encryptionIv,
    encryption_auth_tag: encrypted.encryptionAuthTag,
    encryption_version: encrypted.encryptionVersion,
  };
}

async function updateDraftRecord(
  existing: FutureLetterWithPractice,
  data: CreateFutureLetterInput,
  practiceId: number | null | undefined,
): Promise<FutureLetterEntity> {
  const updated = await prisma.future_letters.updateMany({
    where: {
      id: existing.id,
      user_id: existing.user_id,
      status: FUTURE_LETTER_STATUS.DRAFT,
      updated_at: updatedAtVersionWindow(existing.updated_at),
    },
    data: {
      ...encryptedData({ currentSelf: data.currentSelf, message: data.message }, existing.user_id, existing.external_id),
      deliver_at: data.deliverAt ? new Date(data.deliverAt) : null,
      practice_id: practiceId ?? null,
      updated_at: nextUpdatedAt(existing.updated_at),
    },
  });
  if (updated.count !== 1) throw new BadRequestError('草稿狀態已變更，請重新整理後再試');
  return findById(existing.user_id, existing.external_id);
}

/** Owner-scoped single-draft upsert. The partial unique index protects concurrent creates. */
async function create(userId: number, data: CreateFutureLetterInput): Promise<FutureLetterEntity> {
  const practiceId = await resolvePracticeId(userId, data.practiceId);
  const existing = await prisma.future_letters.findFirst({
    where: { user_id: userId, status: FUTURE_LETTER_STATUS.DRAFT },
    include: includePractice,
  });
  if (existing) return updateDraftRecord(existing, data, practiceId);

  const externalId = randomUUID();
  try {
    const letter = await prisma.future_letters.create({
      data: {
        external_id: externalId,
        user_id: userId,
        ...encryptedData({ currentSelf: data.currentSelf, message: data.message }, userId, externalId),
        status: FUTURE_LETTER_STATUS.DRAFT,
        deliver_at: data.deliverAt ? new Date(data.deliverAt) : null,
        practice_id: practiceId ?? null,
      },
      include: includePractice,
    });
    return toFutureLetterEntity(letter);
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') throw error;
    const concurrentDraft = await prisma.future_letters.findFirst({
      where: { user_id: userId, status: FUTURE_LETTER_STATUS.DRAFT },
      include: includePractice,
    });
    if (!concurrentDraft) throw error;
    return updateDraftRecord(concurrentDraft, data, practiceId);
  }
}

/** List non-deleted future letters owned by a user. */
async function findAllByUser(userId: number, filters: FutureLetterListQuery): Promise<FutureLetterPage> {
  const where = { user_id: userId, status: filters.status ?? { not: FUTURE_LETTER_STATUS.DELETED } };
  const [rows, total] = await prisma.$transaction([
    prisma.future_letters.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
      include: includePractice,
    }),
    prisma.future_letters.count({ where }),
  ]);
  return { items: rows.map(toFutureLetterEntity), page: filters.page, limit: filters.limit, total };
}

/** Find one non-deleted letter, always scoped by owner. */
async function findRecord(userId: number, externalId: string): Promise<FutureLetterWithPractice> {
  const letter = await prisma.future_letters.findFirst({
    where: { user_id: userId, external_id: externalId, status: { not: FUTURE_LETTER_STATUS.DELETED } },
    include: includePractice,
  });
  if (!letter) throw new NotFoundError('找不到指定的信件');
  return letter;
}

async function findById(userId: number, externalId: string): Promise<FutureLetterEntity> {
  return toFutureLetterEntity(await findRecord(userId, externalId));
}

/** Update and re-encrypt a draft letter. */
async function update(userId: number, externalId: string, data: UpdateFutureLetterInput): Promise<FutureLetterEntity> {
  const existing = await findRecord(userId, externalId);
  if (existing.status !== FUTURE_LETTER_STATUS.DRAFT) throw new BadRequestError('只有草稿可以編輯');
  const prior = readContent(existing);
  const practiceId = await resolvePracticeId(userId, data.practiceId);
  const updated = await prisma.future_letters.updateMany({
    where: {
      id: existing.id,
      user_id: userId,
      status: FUTURE_LETTER_STATUS.DRAFT,
      updated_at: updatedAtVersionWindow(existing.updated_at),
    },
    data: {
      ...encryptedData({
        currentSelf: data.currentSelf ?? prior.currentSelf,
        message: data.message ?? prior.message,
      }, userId, externalId),
      deliver_at: data.deliverAt === undefined ? undefined : new Date(data.deliverAt),
      practice_id: practiceId,
      updated_at: nextUpdatedAt(existing.updated_at),
    },
  });
  if (updated.count !== 1) throw new BadRequestError('草稿狀態已變更，請重新整理後再試');
  return findById(userId, externalId);
}

/** Soft-delete a letter and cancel a scheduled delivery when applicable. */
async function softDelete(userId: number, externalId: string): Promise<void> {
  const existing = await findRecord(userId, externalId);
  const deleted = await prisma.future_letters.updateMany({
    where: { id: existing.id, user_id: userId, status: existing.status },
    data: { status: FUTURE_LETTER_STATUS.DELETED, updated_at: new Date() },
  });
  if (deleted.count !== 1) throw new BadRequestError('信件狀態已變更，請重新整理後再試');
  if (existing.status === FUTURE_LETTER_STATUS.SCHEDULED) await removeFutureLetterJob(existing.id);
}

/** Require a draft with at least one non-whitespace content field. */
export function assertFutureLetterCanBeSent(letter: Pick<future_letters, 'status'>, content: FutureLetterContent): void {
  if (letter.status !== FUTURE_LETTER_STATUS.DRAFT) throw new BadRequestError('只有草稿可以寄出');
  if (!content.currentSelf.trim() && !content.message.trim()) throw new BadRequestError('現在的我與信件內容不可同時為空');
}

/** Transition a draft to scheduled, re-encrypt with the active key, snapshot practice, and enqueue delivery. */
async function send(userId: number, externalId: string, deliverAt: string): Promise<FutureLetterEntity> {
  const existing = await findRecord(userId, externalId);
  const content = readContent(existing);
  assertFutureLetterCanBeSent(existing, content);
  const deliveryDate = new Date(deliverAt);
  const sentAt = new Date();
  const transitionAt = nextUpdatedAt(existing.updated_at);
  const updated = await prisma.future_letters.updateMany({
    where: {
      id: existing.id,
      user_id: userId,
      status: FUTURE_LETTER_STATUS.DRAFT,
      updated_at: updatedAtVersionWindow(existing.updated_at),
    },
    data: {
      ...encryptedData(content, userId, externalId),
      status: FUTURE_LETTER_STATUS.SCHEDULED,
      deliver_at: deliveryDate,
      sent_at: sentAt,
      practice_title_snapshot: existing.practices?.title ?? null,
      updated_at: transitionAt,
    },
  });
  if (updated.count !== 1) throw new BadRequestError('信件已被寄出或狀態已變更');
  try {
    await scheduleFutureLetterDelivery(existing.id, deliveryDate.getTime() - Date.now());
  } catch (error) {
    try {
      await removeFutureLetterJob(existing.id);
    } catch (cleanupError) {
      // The enqueue may have succeeded despite a lost response. Preserve the scheduled
      // row when Redis cannot confirm cleanup so startup recovery can reconcile it safely.
      loggerService.warn('Unable to confirm future letter job cleanup after enqueue failure', {
        letterId: existing.id,
        error: cleanupError instanceof Error ? cleanupError.message : String(cleanupError),
      });
      throw error;
    }
    await prisma.future_letters.updateMany({
      where: {
        id: existing.id,
        user_id: userId,
        status: FUTURE_LETTER_STATUS.SCHEDULED,
        updated_at: transitionAt,
      },
      data: {
        status: FUTURE_LETTER_STATUS.DRAFT,
        deliver_at: existing.deliver_at,
        sent_at: existing.sent_at,
        practice_title_snapshot: existing.practice_title_snapshot,
        updated_at: nextUpdatedAt(transitionAt),
      },
    });
    throw error;
  }
  return findById(userId, externalId);
}

/** Deliver due letters and commit the owner Email outbox atomically. */
async function deliver(letterId: number): Promise<void> {
  const now = new Date();
  await prisma.$transaction(async tx => {
    // The conditional write serializes competing workers; only its winner creates an outbox row.
    const updated = await tx.future_letters.updateMany({
      where: { id: letterId, status: FUTURE_LETTER_STATUS.SCHEDULED, deliver_at: { lte: now } },
      data: { status: FUTURE_LETTER_STATUS.DELIVERED, delivered_at: now, updated_at: now },
    });
    if (updated.count === 0) return;
    const letter = await tx.future_letters.findUnique({
      where: { id: letterId },
      select: { user_id: true, users: { select: { contacts: { select: { email: true } } } } },
    });
    if (!letter?.users.contacts?.email) return;
    await tx.email_logs.create({ data: {
      user_id: letter.user_id,
      email_type: EMAIL_TYPES.NOTIFICATION,
      entity_type: FUTURE_LETTER_EMAIL_ENTITY,
      entity_id: letterId,
      email_code: FUTURE_LETTER_EMAIL_CODE,
      subject: FUTURE_LETTER_EMAIL_SUBJECT,
      status: 'pending',
      sent_at: null,
      tracking_token: randomUUID(),
    } });
  });
  // Failed dispatch leaves the committed outbox pending; a delivery retry or startup can repair it.
  await enqueuePendingFutureLetterEmails(letterId);
}

/** Idempotently record first open and return owner-decrypted content. */
async function open(userId: number, externalId: string): Promise<FutureLetterEntity> {
  const existing = await findRecord(userId, externalId);
  if (existing.status !== FUTURE_LETTER_STATUS.DELIVERED) throw new BadRequestError('信件尚未送達');
  if (!existing.opened_at) {
    await prisma.future_letters.updateMany({
      where: { id: existing.id, status: FUTURE_LETTER_STATUS.DELIVERED, opened_at: null },
      data: { opened_at: new Date(), updated_at: new Date() },
    });
  }
  return toFutureLetterEntity(await findRecord(userId, externalId));
}

/** Ensure every scheduled letter has a delayed or immediately runnable delivery job. */
async function recoverOverdueDeliveries(): Promise<number> {
  const scheduled = await prisma.future_letters.findMany({
    where: { status: FUTURE_LETTER_STATUS.SCHEDULED, deliver_at: { not: null } },
    select: { id: true, deliver_at: true },
  });
  const now = Date.now();
  const results = await Promise.allSettled(scheduled.map(letter => (
    scheduleFutureLetterDelivery(letter.id, Math.max(0, (letter.deliver_at?.getTime() ?? now) - now))
  )));
  const failedLetterIds = results.flatMap((result, index) => (
    result.status === 'rejected' ? [scheduled[index].id] : []
  ));
  if (failedLetterIds.length > 0) {
    loggerService.warn('Future letter startup recovery partially failed', {
      scheduledCount: scheduled.length,
      recoveredCount: scheduled.length - failedLetterIds.length,
      failedCount: failedLetterIds.length,
      failedLetterIds,
    });
  }
  return scheduled.length - failedLetterIds.length;
}

export const futureLetterService = {
  create,
  findAllByUser,
  findById,
  update,
  softDelete,
  send,
  deliver,
  open,
  recoverOverdueDeliveries,
};
