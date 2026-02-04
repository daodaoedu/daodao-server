/**
 * AI 分類服務類型定義
 */

import { CollectionPlatform } from './collection.types';

/**
 * 分類模式
 */
export const CLASSIFICATION_MODES = {
  /** 關鍵字規則分類 (快速、免費) */
  KEYWORD: 'keyword',
  /** AI 智能分類 (精確、需要 API key) */
  AI: 'ai',
  /** 自動選擇 (優先使用 AI，無 API key 時使用關鍵字) */
  AUTO: 'auto',
} as const;

export type ClassificationMode = typeof CLASSIFICATION_MODES[keyof typeof CLASSIFICATION_MODES];

/**
 * AI 提供者類型
 */
export const AI_PROVIDERS = {
  OPENAI: 'openai',
  CLAUDE: 'claude',
  GEMINI: 'gemini',
} as const;

export type AIProvider = typeof AI_PROVIDERS[keyof typeof AI_PROVIDERS];

/**
 * 分類用的內容輸入
 */
export interface ClassificationInput {
  /** 平台 */
  platform: CollectionPlatform;
  /** 標題 */
  title: string | null;
  /** 描述/內容 */
  description: string | null;
  /** 作者名稱 */
  authorName: string | null;
  /** 時長 (秒) */
  durationSeconds: number | null;
  /** 互動數 */
  engagementCount: number;
  /** 額外統計資訊 */
  stats?: Record<string, unknown>;
  /** 原始 URL */
  originalUrl: string;
}

/**
 * AI 分類結果
 */
export interface ClassificationResult {
  /** 是否為學習內容 */
  isLearningContent: boolean;
  /** 信心分數 (0.0 - 1.0) */
  confidenceScore: number;
  /** 建議的資源類型 */
  suggestedType: string;
  /** 建議的難度等級 */
  suggestedLevel: string;
  /** 建議的標籤 */
  suggestedTags: string[];
  /** 建議的分類名稱 */
  suggestedCategory: string | null;
  /** 分類理由 */
  reasoning: string;
  /** 優化後的標題 */
  optimizedTitle?: string;
  /** 優化後的描述 */
  optimizedDescription?: string;
}

/**
 * AI 分類服務設定
 */
export interface ClassifierConfig {
  /** AI 提供者 */
  provider: AIProvider;
  /** API Key */
  apiKey: string;
  /** 模型名稱 */
  model?: string;
  /** 最大 token 數 */
  maxTokens?: number;
  /** 溫度 (創意度) */
  temperature?: number;
}

/**
 * 批次分類結果
 */
export interface BatchClassificationResult {
  /** 成功數量 */
  success: number;
  /** 失敗數量 */
  failed: number;
  /** 詳細結果 */
  results: Array<{
    contentId: string;
    success: boolean;
    result?: ClassificationResult;
    error?: string;
  }>;
}

/**
 * 分類服務介面
 */
export interface ClassifierService {
  /**
   * 分類單一內容
   */
  classify(input: ClassificationInput): Promise<ClassificationResult>;

  /**
   * 批次分類
   */
  classifyBatch(inputs: Array<{ id: string; input: ClassificationInput }>): Promise<BatchClassificationResult>;

  /**
   * 檢查服務是否可用
   */
  isAvailable(): boolean;
}
