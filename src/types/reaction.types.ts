/**
 * Reaction system type definitions
 *
 * 對應前端 PICKER_REACTIONS：['useful', 'fire', 'touched', 'curious']
 */

export const ReactionType = {
  useful:  'useful',   // 👍 加油
  fire:    'fire',     // 🔥 啟發
  touched: 'touched',  // 💓 共鳴
  curious: 'curious',  // 🧐 好奇
} as const;

export type ReactionTypeValue = (typeof ReactionType)[keyof typeof ReactionType];

export const REACTION_TYPE_VALUES = Object.values(ReactionType);

export const ReactionTargetType = {
  practice: 'practice',
  comment:  'comment',
} as const;

export type ReactionTargetTypeValue = (typeof ReactionTargetType)[keyof typeof ReactionTargetType];

// API 回應：單筆反應計數（含最新反應用戶）
export interface ReactionCount {
  type: ReactionTypeValue;
  count: number;
  latestActorName: string | null;
}

// API 回應：GET /api/v1/reactions
export interface GetReactionsResponse {
  reactions: ReactionCount[];
  currentUserReaction: ReactionTypeValue | null;
}

// Service 層參數
export interface UpsertReactionParams {
  targetType: ReactionTargetTypeValue;
  targetId: number;
  userId: number;
  reactionType: ReactionTypeValue;
}

export interface RemoveReactionParams {
  targetType: ReactionTargetTypeValue;
  targetId: number;
  userId: number;
}

export interface GetReactionsByTargetParams {
  targetType: ReactionTargetTypeValue;
  targetId: number;
  currentUserId?: number | null;
}
