import { timelineQuerySchema } from '@/validators/timeline.validators';
import { encodeTimelineCursor } from '@/utils/timeline-cursor';

describe('timeline query validator', () => {
  it('accepts opaque composite and legacy ISO cursors, and rejects invalid values', () => {
    const cursor = encodeTimelineCursor({ date: '2026-08-22T00:00:00.000Z', cursorKey: 'letter:abc' });
    expect(timelineQuerySchema.safeParse({ cursor }).success).toBe(true);
    expect(timelineQuerySchema.safeParse({ cursor: '2026-08-22T00:00:00.000Z' }).success).toBe(true);
    expect(timelineQuerySchema.safeParse({ cursor: 'not-a-cursor' }).success).toBe(false);
  });
});
