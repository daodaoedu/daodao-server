/**
 * 通知類型常量定義（single source of truth）
 *
 * 所有 notification writer / reader 一律 import 本檔，禁止散落字面量，
 * 以杜絕過去 casing 漂移（如 `mention` vs `Mention`、`connect-agree` 等）。
 * 值一律使用 PascalCase canonical 命名，與 daodao-f2e 的 BACKEND_TYPE_MAP
 * 及 daodao-storage migration 070 同步。
 */

export const NOTIFICATION_TYPES = {
  // 互動
  REACTION:      'Reaction',
  COMMENT:       'Comment',
  COMMENT_REPLY: 'CommentReply',
  MENTION:       'Mention',

  // 追蹤
  USER_FOLLOWED:     'UserFollowed',
  PRACTICE_FOLLOWED: 'PracticeFollowed',

  // 連結（connection）
  CONNECT:          'Connect',           // 收到連結請求（待處理卡）
  CONNECT_ACCEPTED: 'ConnectAccepted',   // 請求者收到「對方已接受」
  CONNECT_AGREED:   'ConnectAgreed',     // 接受者原卡改寫的終態
  CONNECT_REJECTED: 'ConnectRejected',   // 接受者原卡改寫的終態

  // 夥伴（buddy）
  BUDDY_REQUEST:          'BuddyRequest',
  BUDDY_REQUEST_FOLLOWER: 'BuddyRequestFollower',
  BUDDY_ACCEPTED:         'BuddyAccepted',

  // 主題實踐
  PRACTICE_CREATED:  'PracticeCreated',
  PRACTICE_FINISHED: 'PracticeFinished',

  // 社群動態（activity）
  PRACTICE_CHECKIN_ACTIVITY: 'PracticeCheckinActivity',
  PRACTICE_UPDATE_ACTIVITY:  'PracticeUpdateActivity',
  PARTNER_CHECKIN_ACTIVITY:  'PartnerCheckinActivity',
  PARTNER_UPDATE_ACTIVITY:   'PartnerUpdateActivity',

  // 願望池 / 路線圖
  WISH_LINKED:     'WishLinked',
  ROADMAP_SHIPPED: 'RoadmapShipped',

  // 週報（僅 email，無 InApp/Push）
  WEEKLY_DIGEST: 'WeeklyDigest',
} as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

/** 所有 canonical 通知類型值 */
export const ALL_NOTIFICATION_TYPE_VALUES = Object.values(NOTIFICATION_TYPES) as NotificationType[];
