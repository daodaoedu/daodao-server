/**
 * Logger 介面定義
 * 用於依賴注入的日誌服務
 */

export interface Logger {
  info(message: string): void;
  error(message: string): void;
  warn(message: string): void;
  debug?(message: string): void;
}
