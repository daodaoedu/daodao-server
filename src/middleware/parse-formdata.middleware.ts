import { Request, Response, NextFunction } from 'express';
import { logger } from '@/services/logging';

const JSON_FIELDS = [
  'wantToDoList',
  'tagList',
  'positionList',
  'interestList',
  'preferences',
  'contactList',
  'professionalField',
  'roleList',
  'share',
];

const BOOLEAN_FIELDS = [
  'isOpenLocation',
  'isOpenProfile',
  'isSubscribeEmail',
  'hideConnectionsCount',
];

/**
 * 將 multipart/form-data 中的 JSON 字串欄位解析為對應的 JS 型別
 * 置於 upload.single() 之後、validate() 之前使用
 */
export const parseFormData = (req: Request, _res: Response, next: NextFunction): void => {
  const contentType = req.headers['content-type'] || '';
  if (!contentType.includes('multipart/form-data') || !req.body) {
    return next();
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(req.body as Record<string, unknown>)) {
    if (value === undefined || value === null) continue;

    if (JSON_FIELDS.includes(key) && typeof value === 'string') {
      if (value === '') continue;
      try {
        const parsed = JSON.parse(value);
        // share 的 schema 僅接受 string | string[]，若 JSON.parse 得到 number/boolean 等
        // 非陣列型別（例如 "12345" -> 12345、"true" -> true），保留原始字串以免驗證失敗
        result[key] = key === 'share' && !Array.isArray(parsed) ? value : parsed;
      } catch (error) {
        // 解析失敗時保留原始字串，並記錄警告方便除錯
        logger.warn('parseFormData: 無法解析 JSON 欄位，保留原始字串', {
          field: key,
          error: error instanceof Error ? error.message : String(error),
        });
        result[key] = value;
      }
    } else if (BOOLEAN_FIELDS.includes(key)) {
      result[key] = value === 'true' || value === true;
    } else if (value === '') {
      result[key] = '';
    } else {
      result[key] = value;
    }
  }

  req.body = result;
  next();
};
