/**
 * Admin 社群相關型別定義
 * 包含 Onboarding、會員目錄、AI 助手
 */

/** Onboarding 步驟 */
export interface OnboardingStep {
  /** 步驟 ID */
  id: number;
  /** 問題文字 */
  questionText: string;
  /** 問題類型 */
  questionType: 'single' | 'multi' | 'text';
  /** 選項（僅 single/multi 類型） */
  options?: string[];
  /** 完成率 */
  completionRate: number;
}

/** Onboarding 流程 */
export interface OnboardingFlow {
  /** 流程 ID */
  id: number;
  /** 流程名稱 */
  name: string;
  /** 是否啟用 */
  isEnabled: boolean;
  /** 步驟列表 */
  steps: OnboardingStep[];
  /** 完成率 */
  completionRate: number;
  /** 建立時間 */
  createdAt: string;
}

/** 會員資料欄位 */
export interface MemberProfileField {
  /** 欄位 ID */
  id: number;
  /** 欄位名稱 */
  name: string;
  /** 欄位類型 */
  fieldType: 'text' | 'dropdown' | 'multi_select' | 'url';
  /** 是否必填 */
  isRequired: boolean;
  /** 可見性 */
  visibility: 'public' | 'members' | 'admin';
  /** 填寫率 */
  fillRate: number;
  /** 排序順序 */
  sortOrder: number;
}

/** AI 知識庫條目 */
export interface AIKnowledgeEntry {
  /** 條目 ID */
  id: number;
  /** 檔案名稱 */
  fileName: string;
  /** 檔案類型 */
  fileType: string;
  /** 檔案大小（bytes） */
  fileSize: number;
  /** 上傳時間 */
  uploadedAt: string;
}

/** AI 對話 */
export interface AIConversation {
  /** 對話 ID */
  id: number;
  /** 用戶 ID */
  userId: number;
  /** 用戶名稱 */
  userName: string;
  /** 最後一則訊息 */
  lastMessage: string;
  /** 對話狀態 */
  status: 'resolved' | 'escalated' | 'needs_human';
  /** 更新時間 */
  updatedAt: string;
}

/** AI 助手設定 */
export interface AIAssistantConfig {
  /** 個性描述 */
  personality: string;
  /** 語氣 */
  tone: string;
  /** 無法回答時的回覆 */
  fallbackMessage: string;
}
