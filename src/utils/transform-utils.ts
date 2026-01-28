/**
 * 轉換工具
 * 用於處理分頁、游標等功能
 */

// 定義支持 Prisma 結果的類型
type DatabaseRecord = Record<string, unknown>;

// 輔助函數：從資料庫記錄中獲取欄位值
function getFieldValue(record: DatabaseRecord, fieldName: string): unknown {
  return record?.[fieldName];
}



/**
 * 解碼游標
 * @param cursor - 加密的游標字符串
 * @returns 解碼後的游標數據
 */
export function decodeCursor(cursor: string): { id: number; timestamp: Date } | null {
  try {
    // 游標格式：BASE64(JSON({ id: number, timestamp: string/number }))
    const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
    const parsed = JSON.parse(decoded);
    
    // 確保 timestamp 格式一致，轉換為 Date 對象
    if (parsed.timestamp) {
      parsed.timestamp = new Date(parsed.timestamp);
    }
    
    return parsed;
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
export function generateCursor(id: number, timestamp: string | number | Date): string {
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
 * @param parentCount - 父分類總記錄數（可選）
 * @returns 分頁元數據
 */
export function generatePaginationMetadata(
  rows: DatabaseRecord[],
  count: number,
  limit: number,
  sortField: string,
  hasMore: boolean,
  parentCount?: number
): {
  cursors: { start: string | null; end: string | null };
  hasMore: boolean;
  count: number;
  parentCount?: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
  nextCursor: string | null;
  prevCursor: string | null;
  totalEstimate: number;
  parentTotalEstimate: number | null;
} {
  // 如果結果為空，返回空的分頁數據
  if (rows.length === 0) {
    return {
      cursors: { start: null, end: null },
      hasMore: false,
      count,
      parentCount,
      limit,
      hasNext: false,
      hasPrev: false,
      nextCursor: null,
      prevCursor: null,
      totalEstimate: count,
      parentTotalEstimate: parentCount || null
    };
  }
  
  // 獲取第一條和最後一條記錄
  const firstItem = rows[0];
  const lastItem = rows[rows.length - 1];
  
  // 取得記錄的 ID 和排序欄位值
  const firstId = getFieldValue(firstItem, 'id') as number;
  const firstTimestamp = getFieldValue(firstItem, sortField) as string | number | Date;
  const lastId = getFieldValue(lastItem, 'id') as number;
  const lastTimestamp = getFieldValue(lastItem, sortField) as string | number | Date;
  
  // 生成游標
  const nextCursor = hasMore ? generateCursor(lastId, lastTimestamp) : null;
  const prevCursor = generateCursor(firstId, firstTimestamp);
  
  return {
    cursors: { start: prevCursor, end: nextCursor },
    hasMore,
    count,
    parentCount,
    limit,
    hasNext: hasMore,
    hasPrev: true, // 如果有數據，表示可能有上一頁
    nextCursor,
    prevCursor,
    totalEstimate: count,
    parentTotalEstimate: parentCount || null
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
export function objectToBooleanFields(apiObject: Record<string, boolean>, mapping: Record<string, string>): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  
  Object.entries(mapping).forEach(([apiField, dbField]) => {
    result[dbField] = Boolean(apiObject?.[apiField] || false);
  });
  
  return result;
}
