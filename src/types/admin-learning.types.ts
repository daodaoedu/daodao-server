/**
 * Admin 學習管理相關型別定義
 * 課程進度、滴灌內容、測驗、證書、學習路徑
 */

// ============================================================================
// Course Progress
// ============================================================================

/** 課程進度摘要 */
export interface CourseProgress {
  /** 課程 ID */
  id: number;
  /** 課程名稱 */
  title: string;
  /** 報名人數 */
  enrollmentCount: number;
  /** 完成率 (0-100) */
  completionRate: number;
  /** 平均進度 (0-100) */
  avgProgress: number;
  /** 平均完成時間 */
  avgCompletionTime: string;
  /** 流失課堂（最多人放棄的課堂） */
  dropOffLesson: string | null;
}

/** 停滯用戶 */
export interface StalledUser {
  /** 用戶 ID */
  userId: number;
  /** 用戶名稱 */
  userName: string;
  /** 課程名稱 */
  courseName: string;
  /** 進度 (0-100) */
  progress: number;
  /** 停滯天數 */
  stalledDays: number;
}

// ============================================================================
// Drip Content
// ============================================================================

/** 滴灌排程 */
export interface DripSchedule {
  /** 排程 ID */
  id: number;
  /** 課程 ID */
  courseId: number;
  /** 課程名稱 */
  courseName: string;
  /** 模組名稱 */
  moduleName: string;
  /** 解鎖類型 */
  unlockType: 'days_after_enrollment' | 'specific_date';
  /** 解鎖值（天數或日期） */
  unlockValue: string;
  /** 已解鎖用戶數 */
  unlockedUsers: number;
  /** 等待中用戶數 */
  waitingUsers: number;
}

/** 建立滴灌排程輸入 */
export interface CreateDripScheduleInput {
  /** 課程 ID */
  courseId: number;
  /** 模組名稱 */
  moduleName: string;
  /** 解鎖類型 */
  unlockType: 'days_after_enrollment' | 'specific_date';
  /** 解鎖值 */
  unlockValue: string;
}

// ============================================================================
// Quiz
// ============================================================================

/** 測驗 */
export interface Quiz {
  /** 測驗 ID */
  id: number;
  /** 測驗名稱 */
  name: string;
  /** 課程名稱 */
  courseName: string;
  /** 題目數量 */
  questionCount: number;
  /** 及格門檻 (0-100) */
  passThreshold: number;
  /** 平均分數 */
  avgScore: number;
  /** 及格率 (0-100) */
  passRate: number;
}

/** 測驗題目 */
export interface QuizQuestion {
  /** 題目 ID */
  id: number;
  /** 測驗 ID */
  quizId: number;
  /** 題目內容 */
  questionText: string;
  /** 題目類型 */
  questionType: 'multiple_choice' | 'true_false' | 'short_answer';
  /** 正確率 (0-100) */
  correctRate: number;
}

/** 建立測驗輸入 */
export interface CreateQuizInput {
  /** 測驗名稱 */
  name: string;
  /** 課程 ID */
  courseId: number;
  /** 及格門檻 */
  passThreshold: number;
}

/** 建立測驗題目輸入 */
export interface CreateQuizQuestionInput {
  /** 測驗 ID */
  quizId: number;
  /** 題目內容 */
  questionText: string;
  /** 題目類型 */
  questionType: 'multiple_choice' | 'true_false' | 'short_answer';
  /** 選項（多選題適用） */
  options?: string[];
  /** 正確答案 */
  correctAnswer: string;
}

// ============================================================================
// Certificate
// ============================================================================

/** 已發行證書 */
export interface Certificate {
  /** 證書 ID */
  id: number;
  /** 範本名稱 */
  templateName: string;
  /** 用戶名稱 */
  userName: string;
  /** 發行時間 */
  issuedAt: string;
  /** 驗證連結 */
  verifyUrl: string;
  /** 狀態 */
  status: 'valid' | 'revoked';
}

/** 證書範本 */
export interface CertificateTemplate {
  /** 範本 ID */
  id: number;
  /** 範本名稱 */
  name: string;
  /** 發行條件 */
  criteria: string;
  /** 已發行數量 */
  issuedCount: number;
  /** 建立時間 */
  createdAt: string;
}

/** 建立證書範本輸入 */
export interface CreateCertificateTemplateInput {
  /** 範本名稱 */
  name: string;
  /** 發行條件 */
  criteria: string;
}

// ============================================================================
// Learning Path
// ============================================================================

/** 學習路徑 */
export interface LearningPath {
  /** 路徑 ID */
  id: number;
  /** 路徑名稱 */
  name: string;
  /** 路徑描述 */
  description: string;
  /** 包含課程數 */
  courseCount: number;
  /** 已報名用戶數 */
  enrolledUsers: number;
  /** 完成率 (0-100) */
  completionRate: number;
  /** 課程列表 */
  courses: Array<{ id: number; name: string; order: number }>;
}

/** 建立學習路徑輸入 */
export interface CreateLearningPathInput {
  /** 路徑名稱 */
  name: string;
  /** 路徑描述 */
  description: string;
  /** 課程 ID 列表 */
  courseIds: number[];
}
