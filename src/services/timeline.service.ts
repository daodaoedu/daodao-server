import { prisma } from './database/prisma.service';
import { Prisma } from '../../generated/prisma';
import type { TimelineEntry, TimelinePage } from '../types/future-letter.types';
import {
  compareTimelineEntries,
  decodeTimelineCursor,
  encodeTimelineCursor,
  isTimelineEntryAfterCursor,
  type PositionedTimelineEntry,
  type TimelineCursorPayload,
} from '../utils/timeline-cursor';

const STREAK_MILESTONES = new Set([7, 14, 30, 60, 90]);
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_STREAK_CHECKIN_DATES = 500;

function paddedId(id: number): string {
  return id.toString().padStart(20, '0');
}

function cursorPrefix(cursor: TimelineCursorPayload): string {
  return cursor.key.split(':', 1)[0];
}

function dateRelation(sourcePrefix: string, cursor: TimelineCursorPayload): 'before' | 'same' | 'after' {
  return sourcePrefix.localeCompare(cursorPrefix(cursor)) < 0
    ? 'before'
    : sourcePrefix === cursorPrefix(cursor) ? 'same' : 'after';
}

/** Generate streak milestone entries from unique, ascending check-in dates. */
export function buildStreakMilestones(checkinDates: Date[]): TimelineEntry[] {
  const uniqueDays = [...new Set(checkinDates.map(date => date.toISOString().slice(0, 10)))].sort();
  const entries: TimelineEntry[] = [];
  let streak = 0;
  let previousDayMs: number | null = null;

  for (const day of uniqueDays) {
    const dayMs = Date.parse(`${day}T00:00:00.000Z`);
    streak = previousDayMs !== null && dayMs - previousDayMs === DAY_MS ? streak + 1 : 1;
    previousDayMs = dayMs;
    if (STREAK_MILESTONES.has(streak)) {
      entries.push({
        type: 'milestone',
        title: `連續打卡 ${streak} 天`,
        description: `你已經持續學習 ${streak} 天，繼續保持！`,
        date: new Date(dayMs).toISOString(),
        meta: { streak },
      });
    }
  }
  return entries;
}

/** Fetch and merge a user's learning events in reverse chronological order. */
async function getTimeline(userId: number, cursor: string | undefined, limit: number): Promise<TimelinePage> {
  const decodedCursor = cursor ? decodeTimelineCursor(cursor) : undefined;
  const before = decodedCursor ? new Date(decodedCursor.date) : undefined;
  const eventLimit = limit + 1;
  const letterRelation = decodedCursor ? dateRelation('letter', decodedCursor) : undefined;
  const checkinRelation = decodedCursor ? dateRelation('check-in', decodedCursor) : undefined;
  const quizRelation = decodedCursor ? dateRelation('learning-dna', decodedCursor) : undefined;
  const letterIdCursor = decodedCursor?.key.startsWith('letter:') ? decodedCursor.key.slice('letter:'.length) : '';
  const checkinIdCursor = decodedCursor?.key.startsWith('check-in:') ? Number(decodedCursor.key.slice('check-in:'.length)) : 0;
  const quizIdCursor = decodedCursor?.key.startsWith('learning-dna:') ? Number(decodedCursor.key.slice('learning-dna:'.length)) : 0;
  const streakDateBoundary = before
    ? Prisma.sql`AND checkin_date <= ${before}`
    : Prisma.empty;
  const [letters, checkins, allCheckinDates, quizResults] = await Promise.all([
    prisma.future_letters.findMany({
      where: {
        user_id: userId,
        status: { in: ['scheduled', 'delivered'] },
        ...(before && letterRelation === 'same' ? {
          OR: [
            { deliver_at: { lt: before } },
            { deliver_at: before, external_id: { gt: letterIdCursor } },
          ],
        } : {
          deliver_at: {
            not: null,
            ...(before ? (letterRelation === 'after' ? { lte: before } : { lt: before }) : {}),
          },
        }),
      },
      orderBy: [{ deliver_at: 'desc' }, { external_id: 'asc' }],
      take: eventLimit,
      select: {
        external_id: true,
        status: true,
        deliver_at: true,
        sent_at: true,
        delivered_at: true,
        opened_at: true,
      },
    }),
    prisma.practice_checkins.findMany({
      where: {
        user_id: userId,
        ...(before && checkinRelation === 'same' ? {
          OR: [
            { checkin_date: { lt: before } },
            { checkin_date: before, id: { gt: checkinIdCursor } },
          ],
        } : before ? {
          checkin_date: checkinRelation === 'after' ? { lte: before } : { lt: before },
        } : {}),
      },
      orderBy: [{ checkin_date: 'desc' }, { id: 'asc' }],
      take: eventLimit,
      select: {
        id: true,
        note: true,
        checkin_date: true,
        created_at: true,
        practices: { select: { external_id: true, title: true } },
      },
    }),
    prisma.$queryRaw<Array<{ checkin_date: Date }>>(Prisma.sql`
      SELECT DISTINCT checkin_date
      FROM practice_checkins
      WHERE user_id = ${userId}
      ${streakDateBoundary}
      ORDER BY checkin_date DESC
      LIMIT ${MAX_STREAK_CHECKIN_DATES}
    `),
    prisma.quiz_results.findMany({
      where: {
        user_id: userId,
        ...(before && quizRelation === 'same' ? {
          OR: [
            { completed_at: { lt: before } },
            { completed_at: before, id: { gt: quizIdCursor } },
          ],
        } : before ? {
          completed_at: quizRelation === 'after' ? { lte: before } : { lt: before },
        } : {}),
      },
      orderBy: [{ completed_at: 'desc' }, { id: 'asc' }],
      take: eventLimit,
      select: { id: true, result_type: true, completed_at: true },
    }),
  ]);

  const entries: PositionedTimelineEntry[] = [
    ...letters.flatMap(letter => letter.deliver_at ? [{
      type: 'letter' as const,
      title: letter.status === 'scheduled' ? '寫給未來的信' : '寫給未來的信已送達',
      description: null,
      date: letter.deliver_at.toISOString(),
      cursorKey: `letter:${letter.external_id}`,
      meta: {
        letterId: letter.external_id,
        status: letter.status,
        deliverAt: letter.deliver_at.toISOString(),
        sentAt: letter.sent_at?.toISOString() ?? null,
        deliveredAt: letter.delivered_at?.toISOString() ?? null,
        openedAt: letter.opened_at?.toISOString() ?? null,
      },
    }] : []),
    ...checkins.map(checkin => ({
      type: 'check-in' as const,
      title: `完成「${checkin.practices.title}」打卡`,
      description: checkin.note ?? null,
      date: checkin.checkin_date.toISOString(),
      cursorKey: `check-in:${paddedId(checkin.id)}`,
      meta: {
        checkinId: checkin.id,
        ...(checkin.practices.external_id ? { practiceId: checkin.practices.external_id } : {}),
      },
    })),
    ...buildStreakMilestones(allCheckinDates.map(item => item.checkin_date)).map(entry => ({
      ...entry,
      cursorKey: `milestone:${paddedId(Number(entry.meta.streak))}`,
    })),
    ...quizResults.map(result => ({
      type: 'learning-dna' as const,
      title: '完成學習 DNA 測驗',
      description: `學習類型：${result.result_type}`,
      date: result.completed_at.toISOString(),
      cursorKey: `learning-dna:${paddedId(result.id)}`,
      meta: { quizResultId: result.id, quizType: result.result_type },
    })),
  ].filter(entry => !decodedCursor || isTimelineEntryAfterCursor(entry, decodedCursor)).sort(compareTimelineEntries);

  const hasMore = entries.length > limit;
  const positionedItems = entries.slice(0, limit);
  const items: TimelineEntry[] = positionedItems.map(({ cursorKey: _cursorKey, ...entry }) => entry);
  return {
    items,
    nextCursor: hasMore && positionedItems.length > 0 ? encodeTimelineCursor(positionedItems[positionedItems.length - 1]) : null,
  };
}

export const timelineService = { getTimeline };
