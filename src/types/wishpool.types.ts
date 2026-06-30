/**
 * Wishpool / Roadmap 型別定義
 *
 * 許願池兩層模型：
 * - wishes：原始許願（僅後台可見）
 * - roadmap_items：對外公開卡片（以 external_id 暴露）
 * - roadmap_item_supports：投票／支持（一人一項目一票）
 */

// ─── 分類 ──────────────────────────────────────────────────────────────────────

export const WISH_CATEGORY_VALUES = [
  'operation',
  'practice',
  'social',
  'explore',
  'challenge',
  'ai',
  'profile',
  'other',
] as const;

export type WishCategory = (typeof WISH_CATEGORY_VALUES)[number];

// ─── 狀態 ──────────────────────────────────────────────────────────────────────

export const WISH_STATUS_VALUES = ['pending', 'linked', 'archived'] as const;
export type WishStatus = (typeof WISH_STATUS_VALUES)[number];

export const ROADMAP_STATUS_VALUES = [
  'collected',
  'discussing',
  'planned',
  'in_progress',
  'done',
  'parked',
] as const;
export type RoadmapStatus = (typeof ROADMAP_STATUS_VALUES)[number];

export const SUPPORT_ORIGIN_VALUES = ['vote', 'wish_link'] as const;
export type SupportOrigin = (typeof SUPPORT_ORIGIN_VALUES)[number];

export const WISH_SOURCE_VALUES = ['web', 'app'] as const;
export type WishSource = (typeof WISH_SOURCE_VALUES)[number];

/** 公開看板分頁；scheduled = planned + in_progress */
export const BOARD_TAB_VALUES = ['all', 'scheduled', 'discussing', 'done'] as const;
export type BoardTab = (typeof BOARD_TAB_VALUES)[number];

// ─── API 回應型別 ────────────────────────────────────────────────────────────────

/** 公開看板項目（不暴露序號 id） */
export interface RoadmapItemPublic {
  external_id: string;
  title: string;
  description: string;
  category: WishCategory;
  status: RoadmapStatus;
  support_count: number;
  voted: boolean;
}

/** Hero 統計 */
export interface RoadmapStats {
  /** 平台註冊使用者總數 */
  partners: number;
  /** 許願總則數 */
  feedback: number;
}

/** 投票／取消投票回應 */
export interface ToggleSupportResult {
  support_count: number;
  voted: boolean;
}

/** 後台許願列表項目 */
export interface AdminWishItem {
  id: number;
  category: WishCategory;
  situation: string;
  desire: string;
  status: WishStatus;
  contact_email: string | null;
  internal_module_tag: string | null;
  source: WishSource;
  linked_roadmap_item_id: number | null;
  created_at: string;
  submitter: {
    external_id: string | null;
    nickname: string | null;
    email: string | null;
  };
}

/** 後台路線圖項目（含內部 id） */
export interface AdminRoadmapItem {
  id: number;
  external_id: string;
  title: string;
  description: string;
  category: WishCategory;
  status: RoadmapStatus;
  support_count: number;
  is_public: boolean;
  pinned: boolean;
  sort_order: number;
  shipped_at: string | null;
  created_at: string;
  updated_at: string;
}

/** 趨勢報表四指標 */
export interface RoadmapReport {
  /** 熱門分類：期間內各分類許願量排行 */
  popularCategories: Array<{ category: WishCategory; count: number }>;
  /** 熱門項目：依 support_count 排行（可篩 status） */
  popularItems: Array<{
    external_id: string;
    title: string;
    status: RoadmapStatus;
    support_count: number;
  }>;
  /** 許願量趨勢：依期間分桶 */
  wishTrend: Array<{ period: string; count: number }>;
  /** 待處理積壓 */
  backlog: {
    pendingCount: number;
    oldestPendingWaitingHours: number | null;
  };
}
