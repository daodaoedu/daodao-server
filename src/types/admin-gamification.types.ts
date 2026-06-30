/**
 * Admin 遊戲化相關型別定義
 */

/** 徽章 */
export interface Badge {
  /** 徽章 ID */
  id: number;
  /** 徽章名稱 */
  name: string;
  /** 徽章描述 */
  description: string;
  /** 圖標 URL */
  iconUrl: string;
  /** 觸發條件 */
  triggerCondition: string;
  /** 已頒發數量 */
  awardedCount: number;
  /** 建立時間 */
  createdAt: string;
}

/** 挑戰 */
export interface Challenge {
  /** 挑戰 ID */
  id: number;
  /** 挑戰名稱 */
  name: string;
  /** 挑戰描述 */
  description: string;
  /** 開始日期 */
  startDate: string;
  /** 結束日期 */
  endDate: string;
  /** 必要動作 */
  requiredAction: string;
  /** 獎勵 */
  reward: string;
  /** 參與人數 */
  participantCount: number;
  /** 完成率 */
  completionRate: number;
  /** 挑戰狀態 */
  status: 'active' | 'upcoming' | 'completed';
}

/** 排行榜設定 */
export interface LeaderboardConfig {
  /** 活動權重 */
  activityWeights: {
    post: number;
    comment: number;
    likeReceived: number;
    courseCompleted: number;
  };
  /** 計算週期 */
  period: 'weekly' | 'monthly' | 'alltime';
}

/** 排行榜條目 */
export interface LeaderboardEntry {
  /** 排名 */
  rank: number;
  /** 用戶 ID */
  userId: number;
  /** 用戶名稱 */
  userName: string;
  /** 頭像 URL */
  avatarUrl: string;
  /** 總積分 */
  totalPoints: number;
  /** 積分明細 */
  breakdown: {
    posts: number;
    comments: number;
    likes: number;
    courses: number;
  };
}

/** 連續學習天數分佈 */
export interface StreakDistribution {
  /** 天數區間 */
  range: string;
  /** 人數 */
  count: number;
}

/** 建立徽章輸入 */
export interface CreateBadgeInput {
  name: string;
  description: string;
  iconUrl: string;
  triggerCondition: string;
}

/** 建立挑戰輸入 */
export interface CreateChallengeInput {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  requiredAction: string;
  reward: string;
}
