/**
 * 使用者統計相關的 TypeScript 類型定義
 */

/**
 * 總覽儀表板資料
 */
export interface OverviewStats {
  totalUsers: number;
  newUsersThisMonth: number;
  newUsersLastMonth: number;
  growthRate: number; // 百分比
  activeUsers: number; // 最近 30 天活躍
  activeRate: number; // 活躍率百分比
}

/**
 * 時間分組統計資料
 */
export interface TimeSeriesStats {
  date: string; // YYYY-MM-DD 或 ISO 8601
  count: number;
  label?: string; // 用於顯示的標籤（例如：2024-W01, 2024-01）
}

/**
 * 地區統計資料
 */
export interface LocationStats {
  locationId: number | null;
  country: string | null;
  city: string | null;
  isTaiwan: boolean | null;
  userCount: number;
}

/**
 * 角色統計資料
 */
export interface RoleStats {
  roleId: number;
  roleName: string;
  userCount: number;
}

/**
 * 教育階段統計資料
 */
export interface EducationStageStats {
  educationStage: string;
  userCount: number;
}

/**
 * 活躍度統計資料
 */
export interface ActivityStats {
  activeUsers: number;
  inactiveUsers: number;
  totalUsers: number;
  activeRate: number; // 百分比
  groups?: Array<{
    group: string;
    activeUsers: number;
    inactiveUsers: number;
  }>;
}

/**
 * 註冊統計資料（聯合類型）
 */
export type RegistrationStats =
  | TimeSeriesStats[]
  | LocationStats[]
  | RoleStats[]
  | EducationStageStats[];

/**
 * 匯出資料格式
 */
export interface ExportData {
  filePath: string;
  filename: string;
  mimeType: string;
}

/**
 * DAU/WAU/MAU 統計資料
 */
export interface ActiveUsersStats {
  dau: number;           // 日活躍用戶數
  wau: number;           // 週活躍用戶數
  mau: number;           // 月活躍用戶數
  dauRate: number;       // DAU 佔總用戶比例
  wauRate: number;       // WAU 佔總用戶比例
  mauRate: number;       // MAU 佔總用戶比例
  totalUsers: number;    // 總用戶數
  trend?: {
    dauTrend: number;    // DAU 較昨日變化百分比
    wauTrend: number;    // WAU 較上週變化百分比
    mauTrend: number;    // MAU 較上月變化百分比
  };
}

/**
 * 裝置統計資料
 */
export interface DeviceStats {
  deviceType: string | null;
  count: number;
  percentage: number;
}

/**
 * 瀏覽器統計資料
 */
export interface BrowserStats {
  browser: string | null;
  count: number;
  percentage: number;
}

/**
 * 作業系統統計資料
 */
export interface OsStats {
  os: string | null;
  count: number;
  percentage: number;
}

/**
 * 裝置分析完整資料
 */
export interface DeviceAnalytics {
  devices: DeviceStats[];
  browsers: BrowserStats[];
  operatingSystems: OsStats[];
  totalLogins: number;
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

/**
 * 用戶留存率資料
 */
export interface RetentionData {
  cohortDate: string;      // 群組日期
  size: number;            // 群組大小（當天新註冊用戶數）
  retention: Record<string, number>; // 各天留存率，例如 { day1: 84.44, day7: 55.56 }
}

/**
 * 留存率統計
 */
export interface RetentionStats {
  cohorts: RetentionData[];
  averageRetention: {
    day1: number;
    day7: number;
    day14: number;
    day30: number;
  };
}

/**
 * 熱門用戶檔案資料
 */
export interface PopularProfile {
  userId: number;
  externalId: string;
  nickname: string | null;
  photoUrl: string | null;
  profileViews: number;
  lastActiveAt: string | null;
}

/**
 * 熱門檔案排行
 */
export interface PopularProfilesStats {
  profiles: PopularProfile[];
  totalCount: number;
}

/**
 * 用戶活躍度標籤
 */
export type UserActivityLabel = 'highly_active' | 'active' | 'moderate' | 'inactive' | 'dormant';

/**
 * 用戶活躍度分類
 */
export interface UserActivitySegment {
  label: UserActivityLabel;
  displayName: string;
  description: string;
  userCount: number;
  percentage: number;
  criteria: string;
}

/**
 * 用戶活躍度分類統計
 */
export interface UserActivitySegmentation {
  segments: UserActivitySegment[];
  totalUsers: number;
  lastUpdated: string;
}
