import {
  FUTURE_LETTER_MAX_DELAY_MS,
  FUTURE_LETTER_MIN_DELAY_MS,
  createFutureLetterSchema,
  isValidFutureLetterDeliveryDate,
  sendFutureLetterSchema,
  updateFutureLetterSchema,
} from '@/validators/future-letter.validators';

describe('future letter validators', () => {
  it('allows empty draft fields and applies empty defaults', () => {
    expect(createFutureLetterSchema.parse({})).toEqual({ currentSelf: '', message: '' });
    expect(createFutureLetterSchema.parse({ currentSelf: '', message: '' })).toEqual({ currentSelf: '', message: '' });
  });

  it('does not expose a product character limit and still rejects empty patches', () => {
    expect(createFutureLetterSchema.safeParse({ currentSelf: 'a'.repeat(2001), message: '' }).success).toBe(true);
    expect(updateFutureLetterSchema.safeParse({}).success).toBe(false);
  });

  it('accepts the exact inclusive 3-day and 90-day boundaries with an injected clock', () => {
    const now = Date.parse('2026-08-18T00:00:00.000Z');
    expect(isValidFutureLetterDeliveryDate(new Date(now + FUTURE_LETTER_MIN_DELAY_MS).toISOString(), now)).toBe(true);
    expect(isValidFutureLetterDeliveryDate(new Date(now + FUTURE_LETTER_MAX_DELAY_MS).toISOString(), now)).toBe(true);
    expect(isValidFutureLetterDeliveryDate(new Date(now + FUTURE_LETTER_MIN_DELAY_MS - 1).toISOString(), now)).toBe(false);
    expect(isValidFutureLetterDeliveryDate(new Date(now + FUTURE_LETTER_MAX_DELAY_MS + 1).toISOString(), now)).toBe(false);
  });

  it('enforces the delivery window in the send schema', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-08-18T00:00:00.000Z'));
    expect(sendFutureLetterSchema.safeParse({ deliverAt: '2026-08-21T00:00:00.000Z' }).success).toBe(true);
    expect(sendFutureLetterSchema.safeParse({ deliverAt: '2026-08-20T23:59:59.999Z' }).success).toBe(false);
    expect(sendFutureLetterSchema.safeParse({ deliverAt: '2026-11-16T00:00:00.001Z' }).success).toBe(false);
    jest.useRealTimers();
  });
});
