/**
 * 測驗結果類型定義
 * 用於測驗結果儲存和查詢功能
 */

/**
 * 測驗結果請求數據
 * 前端提交測驗完成後的結果
 */
export interface QuizResultData {
  /** 測驗結果類型（得分最高的維度）：L, C, A, D, O */
  resultType: string;

  /** 五個維度完整分數 */
  scores: Record<string, number>;

  /** 原始答題記錄（選用），用於數據分析 */
  answers?: Record<string, { selectedAnswer: string }>;
}

/**
 * 測驗結果響應數據
 * 後端返回給前端的測驗結果
 */
export interface QuizResultResponse {
  /** 結果 ID */
  id: number;

  /** 測驗結果類型 */
  resultType: string;

  /** 五個維度完整分數 */
  scores: Record<string, number>;

  /** 測驗完成時間 */
  completedAt: Date;
}
