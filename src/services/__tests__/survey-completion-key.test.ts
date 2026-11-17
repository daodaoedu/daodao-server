import { deriveSurveyCompletionKey, parseSurveyCompletionHmacKey, requireSurveyCompletionHmacKey } from '../survey-completion-key';

const testKey = '11'.repeat(32);

describe('opaque managed survey completion identifiers', () => {
  it('matches a fixed independently computed HMAC-SHA256 vector', () => {
    expect(deriveSurveyCompletionKey(529, 42, parseSurveyCompletionHmacKey(testKey))).toBe('290d58385a77789102e2d086308991697266b36af95affd8bedbc8a97def7e20');
    expect(deriveSurveyCompletionKey(529, 42, parseSurveyCompletionHmacKey(testKey.toUpperCase()))).toBe(deriveSurveyCompletionKey(529, 42, parseSurveyCompletionHmacKey(testKey)));
  });
  it('separates survey/member domains and independent keys', () => {
    const key = parseSurveyCompletionHmacKey(testKey);
    const base = deriveSurveyCompletionKey(529, 42, key);
    expect(deriveSurveyCompletionKey(530, 42, key)).not.toBe(base);
    expect(deriveSurveyCompletionKey(529, 43, key)).not.toBe(base);
    expect(deriveSurveyCompletionKey(52, 942, key)).not.toBe(base);
    expect(deriveSurveyCompletionKey(529, 42, parseSurveyCompletionHmacKey('22'.repeat(32)))).not.toBe(base);
    expect(base).toMatch(/^[0-9a-f]{64}$/);
  });
  it.each([undefined, '', 'invalid', '1'.repeat(63), '1'.repeat(65), 'g'.repeat(64), ' ' + testKey])('fails closed for malformed configuration without echoing it', value => {
    try { parseSurveyCompletionHmacKey(value); throw new Error('configuration was accepted'); } catch (error) {
      expect(error).toMatchObject({ statusCode: 503, message: '問卷暫時無法使用，請稍後再試' });
    }
  });
  it('never substitutes JWT_SECRET when the dedicated key is missing', () => {
    const before = process.env.SURVEY_COMPLETION_HMAC_KEY;
    const jwt = process.env.JWT_SECRET;
    try {
      delete process.env.SURVEY_COMPLETION_HMAC_KEY;
      process.env.JWT_SECRET = testKey;
      expect(() => requireSurveyCompletionHmacKey()).toThrow('問卷暫時無法使用');
    } finally {
      if (before === undefined) delete process.env.SURVEY_COMPLETION_HMAC_KEY; else process.env.SURVEY_COMPLETION_HMAC_KEY = before;
      if (jwt === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = jwt;
    }
  });
  it('rejects invalid identity inputs and short binary keys', () => {
    expect(() => deriveSurveyCompletionKey(0, 42, parseSurveyCompletionHmacKey(testKey))).toThrow('無效');
    expect(() => deriveSurveyCompletionKey(529, -1, parseSurveyCompletionHmacKey(testKey))).toThrow('無效');
    expect(() => deriveSurveyCompletionKey(529, 42, Buffer.alloc(31))).toThrow('問卷暫時無法使用');
  });
});
