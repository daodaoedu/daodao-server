/**
 * Admin 活動相關型別定義
 */

/** 管理端活動 */
export interface AdminEvent {
  /** 活動 ID */
  id: number;
  /** 活動標題 */
  title: string;
  /** 活動描述 */
  description: string;
  /** 開始時間 */
  startAt: string;
  /** 結束時間 */
  endAt: string;
  /** 地點 */
  location: string;
  /** 最大人數 */
  maxCapacity: number;
  /** 報名人數 */
  rsvpCount: number;
  /** 候補人數 */
  waitlistCount: number;
  /** 實際出席人數 */
  attendedCount: number;
  /** 活動狀態 */
  status: 'upcoming' | 'past';
  /** 是否為週期性活動 */
  isRecurring: boolean;
}

/** 活動報名 */
export interface EventRsvp {
  /** 報名 ID */
  id: number;
  /** 用戶 ID */
  userId: number;
  /** 用戶名稱 */
  userName: string;
  /** 報名狀態 */
  status: 'registered' | 'waitlist' | 'attended' | 'no_show';
  /** 報名時間 */
  registeredAt: string;
}

/** 活動範本 */
export interface EventTemplate {
  /** 範本 ID */
  id: number;
  /** 範本名稱 */
  name: string;
  /** 週期頻率 */
  frequency: 'weekly' | 'biweekly' | 'monthly';
  /** 下次發生時間 */
  nextOccurrence: string;
  /** 已產生活動數 */
  generatedCount: number;
}

/** 活動錄影 */
export interface EventRecording {
  /** 錄影 ID */
  id: number;
  /** 活動 ID */
  eventId: number;
  /** 檔案名稱 */
  fileName: string;
  /** 檔案大小（bytes） */
  fileSize: number;
  /** 存取等級 */
  accessLevel: 'public' | 'members' | 'roles';
  /** 上傳時間 */
  uploadedAt: string;
}

/** 建立活動輸入 */
export interface CreateEventInput {
  title: string;
  description: string;
  startAt: string;
  endAt: string;
  location: string;
  maxCapacity: number;
  isRecurring?: boolean;
}

/** 建立活動範本輸入 */
export interface CreateTemplateInput {
  name: string;
  frequency: 'weekly' | 'biweekly' | 'monthly';
}
