import type { TimelineEntry } from '../types/future-letter.types';

export interface TimelineCursorPayload {
  date: string;
  key: string;
}

export interface PositionedTimelineEntry extends TimelineEntry {
  cursorKey: string;
}

export function encodeTimelineCursor(entry: Pick<PositionedTimelineEntry, 'date' | 'cursorKey'>): string {
  return Buffer.from(JSON.stringify({ date: entry.date, key: entry.cursorKey }), 'utf8').toString('base64url');
}

export function decodeTimelineCursor(value: string): TimelineCursorPayload {
  try {
    const parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as Partial<TimelineCursorPayload>;
    if (typeof parsed.date === 'string' && Number.isFinite(Date.parse(parsed.date)) && typeof parsed.key === 'string' && parsed.key) {
      return { date: new Date(parsed.date).toISOString(), key: parsed.key };
    }
  } catch {
    // Fall through to the legacy ISO cursor parser.
  }
  const legacyDate = Date.parse(value);
  if (Number.isFinite(legacyDate)) {
    return { date: new Date(legacyDate).toISOString(), key: '\uffff' };
  }
  throw new Error('Invalid timeline cursor');
}

export function isValidTimelineCursor(value: string): boolean {
  try {
    decodeTimelineCursor(value);
    return true;
  } catch {
    return false;
  }
}

export function compareTimelineEntries(a: PositionedTimelineEntry, b: PositionedTimelineEntry): number {
  return b.date.localeCompare(a.date) || a.cursorKey.localeCompare(b.cursorKey);
}

export function isTimelineEntryAfterCursor(entry: PositionedTimelineEntry, cursor: TimelineCursorPayload): boolean {
  return entry.date < cursor.date || (entry.date === cursor.date && entry.cursorKey > cursor.key);
}
