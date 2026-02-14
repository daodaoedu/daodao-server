/**
 * Admin 統計相關型別定義
 */

/**
 * 實踐統計回應
 */
export interface PracticeStatsResponse {
  /** 總實踐數 */
  total: number;
  /** 進行中的實踐數 */
  active: number;
  /** 已完成的實踐數 */
  completed: number;
  /** 總簽到數 */
  totalCheckIns: number;
  /** 平均完成率 */
  averageCompletionRate: number;
  /** 依分類統計 */
  practicesByCategory: Array<{
    category: string;
    count: number;
  }>;
  /** 依狀態統計 */
  practicesByStatus: Array<{
    status: string;
    count: number;
  }>;
}

/**
 * 活躍用戶趨勢查詢參數
 */
export interface ActiveUsersTrendFilters {
  /** 查詢天數（預設 30，最大 90） */
  days?: number;
}

/**
 * 活躍用戶趨勢資料點
 */
export interface ActiveUsersTrendDataPoint {
  /** 日期 (YYYY-MM-DD) */
  date: string;
  /** 日活躍用戶數 */
  dau: number;
  /** 週活躍用戶數 */
  wau: number;
  /** 月活躍用戶數 */
  mau: number;
}

/**
 * 活躍用戶趨勢回應
 */
export interface ActiveUsersTrendResponse {
  /** 時間序列資料 */
  trend: ActiveUsersTrendDataPoint[];
  /** 元資料 */
  metadata: {
    /** 查詢的天數 */
    days: number;
    /** 開始日期 */
    startDate: string;
    /** 結束日期 */
    endDate: string;
    /** 是否因超過最大範圍而被限制 */
    isLimited: boolean;
    /** 資料生成時間 */
    generatedAt: string;
  };
}

/**
 * 實踐統計查詢參數
 */
export interface PracticeStatsFilters {
  /** 開始日期 */
  startDate?: string;
  /** 結束日期 */
  endDate?: string;
}
