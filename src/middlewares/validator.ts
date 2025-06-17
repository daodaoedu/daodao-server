/**
 * 驗證中間件
 * 負責驗證請求資料是否符合規範
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { BadRequestError } from '../utils/errorHandler';

/**
 * 格式化 Zod 錯誤
 * @param error - Zod 錯誤
 * @returns 格式化後的錯誤對象
 */
function formatZodErrors(error: ZodError) {
  const errors: Record<string, string> = {};
  
  for (const issue of error.errors) {
    // 使用路徑作為錯誤鍵
    const path = issue.path.join('.');
    errors[path] = issue.message;
  }
  
  return errors;
}

/**
 * 驗證請求資料
 * @param schema - Zod 驗證模式
 * @param source - 要驗證的請求來源 (body, query, params)
 * @returns Express 中間件
 */
export const validateRequest = (schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // 驗證請求資料
      const data = schema.parse(req[source]);
      
      // 將驗證後的資料替換原始資料
      req[source] = data;
      
      next();
    } catch (error) {
      // 處理 Zod 驗證錯誤
      if (error instanceof ZodError) {
        const formattedErrors = formatZodErrors(error);
        
        next(new BadRequestError('驗證失敗', formattedErrors));
        return;
      }
      
      next(error);
    }
  };
};

/**
 * 組合多個驗證中間件
 * @param validators - 驗證中間件數組
 * @returns 組合後的驗證中間件
 */
export const combineValidators = (...validators: Array<(req: Request, res: Response, next: NextFunction) => void>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const runValidators = async (index: number): Promise<void> => {
      if (index >= validators.length) {
        next();
        return;
      }
      
      const validator = validators[index];
      
      try {
        const nextCalled = { value: false };
        const nextProxy = () => {
          nextCalled.value = true;
          runValidators(index + 1);
        };
        
        validator(req, res, nextProxy);
        
        // 如果 validator 沒有調用 next，可能是非同步操作或已經回傳了響應
        if (!nextCalled.value) {
          return;
        }
      } catch (error) {
        next(error);
      }
    };
    
    runValidators(0);
  };
};
