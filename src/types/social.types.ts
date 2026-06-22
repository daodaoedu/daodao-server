/**
 * Social interaction type definitions
 *
 * Covers follow, connect, and social notification event types
 * used across the social-interactions feature.
 */

export const FollowType = {
  USER: 'user',
  PRACTICE: 'practice',
} as const;
export type FollowTypeType = typeof FollowType[keyof typeof FollowType];

export const ConnectStatus = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
} as const;
export type ConnectStatusType = typeof ConnectStatus[keyof typeof ConnectStatus];

export const ConnectSource = {
  USER_PAGE: 'user_page',
  PRACTICE_PAGE: 'practice_page',
} as const;
export type ConnectSourceType = typeof ConnectSource[keyof typeof ConnectSource];

export const SocialNotificationEvent = {
  FOLLOW_PRACTICE_CHECKIN: 'follow.practice_checkin',
  FOLLOW_PRACTICE_UPDATE: 'follow.practice_update',
  CONNECT_PARTNER_CHECKIN: 'connect.partner_checkin',
  CONNECT_PARTNER_UPDATE: 'connect.partner_update',
  MENTION: 'mention',
} as const;
export type SocialNotificationEventType = typeof SocialNotificationEvent[keyof typeof SocialNotificationEvent];

export interface SocialNotificationJob {
  event: SocialNotificationEventType;
  actorId: number;
  recipientId: number;
  payload?: Record<string, unknown>;
}
