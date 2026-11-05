import { sanitizeRequestBodyForLogging, shouldLogRequestBody } from '../logging.middleware';

describe('feedback answer logging privacy', () => {
  const body = { answers: [{ question_id: 3, answer_text: '不可與身分一起記錄的答案' }], session_key: 'correlation-key' };
  it.each(['/api/v1/surveys/public/uuid/responses', '/api/v1/surveys/public/uuid/responses?retry=1', '/surveys/public/uuid/responses'])('omits answers from request and error logs for %s', path => {
    expect(shouldLogRequestBody(path, 'POST')).toBe(false);
    expect(sanitizeRequestBodyForLogging(path, body)).toBe('[REDACTED]');
  });
  it('retains unrelated request logging', () => {
    expect(shouldLogRequestBody('/api/v1/resources', 'POST')).toBe(true);
    expect(sanitizeRequestBodyForLogging('/api/v1/resources', { title: '資源' })).toEqual({ title: '資源' });
  });
});
