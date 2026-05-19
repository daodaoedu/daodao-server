import {
  isCreatedPracticeResponse,
  isFirstCheckInResponse,
  isInspirationCommentTarget,
} from '@/utils/onboarding-task-completion';

describe('onboarding task completion predicates', () => {
  it('accepts created practices that are published or already active', () => {
    expect(isCreatedPracticeResponse({ success: true, data: { status: 'not_started' } })).toBe(true);
    expect(isCreatedPracticeResponse({ success: true, data: { status: 'active' } })).toBe(true);
    expect(isCreatedPracticeResponse({ success: true, data: { status: 'draft' } })).toBe(false);
    expect(isCreatedPracticeResponse({ success: true, data: { status: 'archived' } })).toBe(false);
  });

  it('only accepts first check-in responses', () => {
    expect(isFirstCheckInResponse({ success: true, data: { isFirstCheckIn: true } })).toBe(true);
    expect(isFirstCheckInResponse({ success: true, data: { isFirstCheckIn: false } })).toBe(false);
    expect(isFirstCheckInResponse({ success: true, data: {} })).toBe(false);
  });

  it('accepts practice and checkin comment targets only', () => {
    expect(isInspirationCommentTarget('practice')).toBe(true);
    expect(isInspirationCommentTarget('checkin')).toBe(true);
    expect(isInspirationCommentTarget('resource')).toBe(false);
    expect(isInspirationCommentTarget('post')).toBe(false);
  });
});
