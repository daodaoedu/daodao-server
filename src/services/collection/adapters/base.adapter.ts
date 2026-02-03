/**
 * Platform Adapter 基礎類別
 * 提供通用的工具方法和錯誤處理
 */

import {
  CollectionPlatform,
  CollectionSourceType,
  CollectionSourceDbModel,
  RawCollectedContent,
  PlatformAdapter,
  FetchOptions,
} from '@/types/collection.types';

/**
 * Adapter 錯誤類別
 */
export class AdapterError extends Error {
  constructor(
    message: string,
    public readonly platform: CollectionPlatform,
    public readonly code: string,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'AdapterError';
  }
}

/**
 * 基礎 Adapter 抽象類別
 * 所有平台 Adapter 應繼承此類別
 */
export abstract class BaseAdapter implements PlatformAdapter {
  abstract platform: CollectionPlatform;

  /**
   * 根據來源設定抓取內容 (子類別必須實作)
   */
  abstract fetchContents(
    source: CollectionSourceDbModel,
    options?: FetchOptions
  ): Promise<RawCollectedContent[]>;

  /**
   * 驗證來源設定是否有效 (子類別必須實作)
   */
  abstract validateSource(
    sourceType: CollectionSourceType,
    sourceValue: string
  ): Promise<boolean>;

  /**
   * 取得單一內容的詳細資訊 (選用)
   */
  async getContentDetails(
    _platformContentId: string
  ): Promise<RawCollectedContent | null> {
    // 預設不實作，子類別可以覆寫
    return null;
  }

  /**
   * 建立 Adapter 錯誤
   */
  protected createError(
    message: string,
    code: string,
    originalError?: unknown
  ): AdapterError {
    return new AdapterError(message, this.platform, code, originalError);
  }

  /**
   * 安全地執行 API 請求，包含重試邏輯
   */
  protected async withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        if (attempt < maxRetries) {
          // 指數退避
          const delay = delayMs * Math.pow(2, attempt - 1);
          await this.sleep(delay);
        }
      }
    }

    throw this.createError(
      `Failed after ${maxRetries} retries`,
      'RETRY_EXHAUSTED',
      lastError
    );
  }

  /**
   * 延遲執行
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 清理 HTML 標籤
   */
  protected stripHtml(html: string | null | undefined): string | null {
    if (!html) return null;
    return html.replace(/<[^>]*>/g, '').trim();
  }

  /**
   * 截斷文字
   */
  protected truncate(
    text: string | null | undefined,
    maxLength: number
  ): string | null {
    if (!text) return null;
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * 解析 ISO 8601 持續時間為秒數 (用於 YouTube)
   * 例如: PT1H30M15S -> 5415
   */
  protected parseIsoDuration(duration: string | null | undefined): number | null {
    if (!duration) return null;

    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return null;

    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    const seconds = parseInt(match[3] || '0', 10);

    return hours * 3600 + minutes * 60 + seconds;
  }

  /**
   * 偵測語言 (簡單版本)
   */
  protected detectLanguage(text: string | null | undefined): string | null {
    if (!text) return null;

    // 簡單的中文偵測
    const chineseRegex = /[\u4e00-\u9fff]/;
    const japaneseRegex = /[\u3040-\u309f\u30a0-\u30ff]/;

    if (chineseRegex.test(text)) {
      return 'zh';
    }
    if (japaneseRegex.test(text)) {
      return 'ja';
    }

    // 預設為英文
    return 'en';
  }
}
