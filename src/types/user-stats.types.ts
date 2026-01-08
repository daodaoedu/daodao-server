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
  breakdown?: {
    role?: RoleStats[];
    location?: LocationStats[];
    educationStage?: EducationStageStats[];
  };
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
