/**
 * 轉換工具
 * 用於處理分頁、游標等功能
 */

import { Model } from 'sequelize';



/**
 * 解碼游標
 * @param cursor - 加密的游標字符串
 * @returns 解碼後的游標數據
 */
export function decodeCursor(cursor: string) {
  try {
    // 游標格式：BASE64(JSON({ id: number, timestamp: string/number }))
    const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch (error) {
    // 游標解碼失敗
    return null;
  }
}

/**
 * 生成游標
 * @param id - 記錄 ID
 * @param timestamp - 時間戳（通常是排序欄位的值）
 * @returns 加密的游標字符串
 */
export function generateCursor(id: number, timestamp: string | number | Date) {
  // 創建游標數據對象
  const cursorData = { id, timestamp };
  
  // 轉換為 JSON 並編碼為 BASE64
  return Buffer.from(JSON.stringify(cursorData)).toString('base64');
}

/**
 * 生成分頁元數據
 * @param rows - 查詢結果行
 * @param count - 總記錄數
 * @param limit - 每頁限制
 * @param sortField - 排序欄位
 * @param hasMore - 是否有更多記錄
 * @returns 分頁元數據
 */
export function generatePaginationMetadata(
  rows: Model[],
  count: number,
  limit: number,
  sortField: string,
  hasMore: boolean
) {
  // 如果結果為空，返回空的分頁數據
  if (rows.length === 0) {
    return {
      next_cursor: null,
      has_more: false
    };
  }
  
  // 獲取最後一條記錄
  const lastItem = rows[rows.length - 1];
  
  // 取得最後一條記錄的 ID 和排序欄位值
  const lastId = lastItem.get('id') as number;
  const lastTimestamp = lastItem.get(sortField) as string | number | Date;
  
  // 生成下一頁游標
  const nextCursor = hasMore ? generateCursor(lastId, lastTimestamp) : null;
  
  return {
    next_cursor: nextCursor,
    has_more: hasMore
  };
}

/**
 * 將資料庫的布爾欄位轉換為API的對象結構
 * @param dbRecord - 資料庫記錄
 * @param mapping - 欄位映射關係
 * @returns 轉換後的對象
 */
export function booleanFieldsToObject<T extends Record<string, boolean>>(
  dbRecord: Record<string, unknown>, 
  mapping: Record<string, string>
): T {
  const result: Record<string, boolean> = {};
  
  Object.entries(mapping).forEach(([apiField, dbField]) => {
    result[apiField] = Boolean(dbRecord[dbField]);
  });
  
  return result as T;
}

/**
 * 將API的對象結構轉換為資料庫的布爾欄位
 * @param apiObject - API對象
 * @param mapping - 欄位映射關係
 * @returns 轉換後的資料庫欄位對象
 */
export function objectToBooleanFields(apiObject: Record<string, boolean>, mapping: Record<string, string>) {
  const result: Record<string, boolean> = {};
  
  Object.entries(mapping).forEach(([apiField, dbField]) => {
    result[dbField] = Boolean(apiObject?.[apiField] || false);
  });
  
  return result;
}
