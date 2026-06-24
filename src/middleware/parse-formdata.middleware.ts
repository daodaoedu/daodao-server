import { Request, Response, NextFunction } from 'express';

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
        result[key] = JSON.parse(value);
      } catch {
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
