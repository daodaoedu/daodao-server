import {
  compareTimelineEntries,
  decodeTimelineCursor,
  encodeTimelineCursor,
  isTimelineEntryAfterCursor,
  type PositionedTimelineEntry,
} from '@/utils/timeline-cursor';

function entry(key: string): PositionedTimelineEntry {
  return {
    type: 'letter',
    title: key,
    description: null,
    date: '2026-08-22T00:00:00.000Z',
    meta: {},
    cursorKey: key,
  };
}

describe('timeline composite cursor', () => {
  it('orders equal timestamps by a stable key and resumes after the exact item', () => {
    const entries = [entry('letter:c'), entry('letter:a'), entry('letter:b')].sort(compareTimelineEntries);
    const cursor = decodeTimelineCursor(encodeTimelineCursor(entries[1]));

    expect(entries.map(item => item.cursorKey)).toEqual(['letter:a', 'letter:b', 'letter:c']);
    expect(entries.filter(item => isTimelineEntryAfterCursor(item, cursor)).map(item => item.cursorKey)).toEqual(['letter:c']);
  });

  it('accepts legacy ISO cursors without replaying equal timestamps', () => {
    const cursor = decodeTimelineCursor('2026-08-22T00:00:00.000Z');
    expect(isTimelineEntryAfterCursor(entry('letter:z'), cursor)).toBe(false);
  });
});
