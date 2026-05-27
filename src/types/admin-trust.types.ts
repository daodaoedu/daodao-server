/**
 * Admin 信任等級相關型別定義
 */

/** 信任等級晉升條件 */
export interface PromotionCriteria {
  /** 閱讀文章數 */
  readCount: number;
  /** 發文數 */
  postCount: number;
  /** 造訪天數 */
  daysVisited: number;
  /** 送出的讚數 */
  likesGiven: number;
  /** 收到的讚數 */
  likesReceived: number;
}

/** 信任等級設定 */
export interface TrustLevelConfig {
  /** 信任等級 (0-3) */
  level: number;
  /** 等級名稱 */
  name: string;
  /** 晉升條件 */
  promotionCriteria: PromotionCriteria;
  /** 解鎖的能力列表 */
  unlockedAbilities: string[];
}

/** 信任等級分布統計 */
export interface TrustLevelDistribution {
  /** 信任等級 */
  level: number;
  /** 等級名稱 */
  name: string;
  /** 用戶數量 */
  userCount: number;
}

/** 信任等級變更紀錄 */
export interface TrustLevelChange {
  /** 變更 ID */
  id: number;
  /** 用戶 ID */
  userId: number;
  /** 用戶名稱 */
  userName: string;
  /** 變更前等級 */
  fromLevel: number;
  /** 變更後等級 */
  toLevel: number;
  /** 變更原因 */
  reason: 'auto' | 'manual';
  /** 建立時間 */
  createdAt: string;
}

/** 用戶群組 */
export interface UserGroup {
  /** 群組 ID */
  id: number;
  /** 群組名稱 */
  name: string;
  /** 成員數量 */
  memberCount: number;
  /** 權限列表 */
  permissions: string[];
  /** 建立時間 */
  createdAt: string;
}

/** 更新信任等級設定輸入 */
export interface UpdateTrustConfigInput {
  /** 等級名稱 */
  name?: string;
  /** 晉升條件 */
  promotionCriteria?: Partial<PromotionCriteria>;
  /** 解鎖的能力列表 */
  unlockedAbilities?: string[];
}

/** 建立用戶群組輸入 */
export interface CreateUserGroupInput {
  /** 群組名稱 */
  name: string;
  /** 權限列表 */
  permissions?: string[];
}

/** 更新用戶群組輸入 */
export interface UpdateUserGroupInput {
  /** 群組名稱 */
  name?: string;
  /** 權限列表 */
  permissions?: string[];
}
