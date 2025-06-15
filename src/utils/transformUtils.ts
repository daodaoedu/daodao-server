/**
 * 資料轉換工具函數
 */

import { MappingConfig } from '@/constants/mappings';

/**
 * 將單獨的 Boolean 欄位轉換為物件結構
 * @param dbRecord - 資料庫記錄
 * @param mappings - 欄位映射配置
 * @returns 轉換後的物件
 */
export function booleanFieldsToObject<M extends MappingConfig>(
  dbRecord: Record<string, any>,
  mappings: M
): Record<keyof M, boolean> {
  const result = {} as Record<keyof M, boolean>;
  
  Object.entries(mappings).forEach(([apiField, dbField]) => {
    result[apiField as keyof M] = Boolean(dbRecord[dbField]);
  });
  
  return result;
}

/**
 * 將物件結構轉換為單獨的 Boolean 欄位
 * @param obj - 來源物件
 * @param mappings - 欄位映射配置
 * @returns 轉換後的物件
 */
export function objectToBooleanFields<T extends Record<string, boolean> | undefined, M extends MappingConfig>(
  obj: T | undefined,
  mappings: M
): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  
  // 設定所有可能的欄位為 false (預設值)
  Object.values(mappings).forEach(dbField => {
    result[dbField] = false;
  });
  
  // 如果來源物件存在，則根據映射設定值
  if (obj) {
    Object.entries(mappings).forEach(([apiField, dbField]) => {
      if (apiField in obj) {
        result[dbField] = Boolean((obj as any)[apiField]);
      }
    });
  }
  
  return result;
}

/**
 * 將數據庫日期格式轉換為 ISO 字符串
 * @param date - 數據庫日期
 * @returns ISO 字符串
 */
export function formatDate(date: Date | null | undefined): string | null {
  if (!date) return null;
  return date.toISOString();
}

/**
 * 生成游標分頁的游標值
 * @param id - 記錄 ID
 * @param timestamp - 時間戳 (通常是 createdAt 或 updatedAt)
 * @returns 編碼後的游標
 */
export function generateCursor(id: number, timestamp: Date | string): string {
  const ts = typeof timestamp === 'string' ? timestamp : timestamp.toISOString();
  const cursorData = `${ts}:${id}`;
  return Buffer.from(cursorData).toString('base64');
}

/**
 * 解析游標值
 * @param cursor - 游標字符串
 * @returns 解析後的 ID 和時間戳
 */
export function decodeCursor(cursor: string): { id: number; timestamp: string } | null {
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
    const [timestamp, idStr] = decoded.split(':');
    const id = parseInt(idStr, 10);
    
    if (isNaN(id)) return null;
    
    return { id, timestamp };
  } catch (error) {
    return null;
  }
}

/**
 * 為查詢結果生成分頁元數據
 * @param rows - 當前頁的記錄
 * @param count - 總記錄數 (或估計值)
 * @param limit - 頁面大小
 * @param sortField - 排序欄位
 * @param hasMore - 是否有更多記錄
 * @returns 分頁元數據
 */
export function generatePaginationMetadata(
  rows: any[],
  count: number,
  limit: number,
  sortField: string = 'createdAt',
  hasMore: boolean = false
) {
  // 檢查是否有記錄
  if (rows.length === 0) {
    return {
      limit,
      hasNext: false,
      hasPrev: false,
      nextCursor: null,
      prevCursor: null,
      totalEstimate: count
    };
  }

  // 獲取第一條和最後一條記錄
  const firstRow = rows[0];
  const lastRow = rows[rows.length - 1];

  // 生成游標
  const fieldName = sortField === 'createdAt' ? 'created_at' : 
                    sortField === 'updatedAt' ? 'updated_at' : 'created_at';
  
  const nextCursor = hasMore ? generateCursor(lastRow.id, lastRow[fieldName]) : null;
  const prevCursor = rows.length > 0 ? generateCursor(firstRow.id, firstRow[fieldName]) : null;

  return {
    limit,
    hasNext: hasMore,
    hasPrev: rows.length > 0,
    nextCursor,
    prevCursor,
    totalEstimate: count
  };
}
