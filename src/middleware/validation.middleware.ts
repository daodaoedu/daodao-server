/**
 * 通用驗證中間件
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';
import { z, ZodError, ZodSchema } from 'zod';

/**
 * 創建驗證中間件
 * @param schema Zod 驗證模式
 * @param source 要驗證的請求源 ('body' | 'query' | 'params')
 * @returns Express 中間件
 */
export const validate = (schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body'): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const data = schema.parse(req[source]);
      
      // 使用 Object.assign 來安全地更新請求對象
      if (source === 'query') {
        Object.assign(req.query, data);
      } else if (source === 'params') {
        Object.assign(req.params, data);
      } else {
        (req as unknown as Record<string, unknown>)[source] = data;
      }
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: {
            type: 'bad_request',
            message: '驗證失敗',
            details: formatZodErrors(error)
          }
        });
        return;
      }
      next(error);
    }
  };
};

/**
 * 格式化 Zod 錯誤為更友好的格式
 * @param error Zod 錯誤
 * @returns 格式化的錯誤信息
 */
function formatZodErrors(error: ZodError): Array<{ path: string; message: string }> {
  return error.issues.map((err: z.ZodIssue) => ({
    path: err.path.join('.'),
    message: err.message
  }));
}

export default validate;
