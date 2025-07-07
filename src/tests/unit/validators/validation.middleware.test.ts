/**
 * 通用驗證中間件單元測試
 */
import { validate } from '../../../validators/validation.middleware';
import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

// Mock Express 請求、響應和 next 函數
const mockRequest = (data = {}) => {
  return {
    body: { ...data },
    query: { ...data },
    params: { ...data }
  } as Request;
};

const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
};

const mockNext = jest.fn() as NextFunction;

describe('Validation Middleware Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validate', () => {
    const testSchema = z.object({
      name: z.string().min(1),
      age: z.number().min(18)
    });

    it('應該通過有效的資料', () => {
      const req = mockRequest({ name: 'Test User', age: 25 });
      const res = mockResponse();

      validate(testSchema)(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('應該拒絕無效的資料並返回400錯誤', () => {
      const req = mockRequest({ name: '', age: 15 });
      const res = mockResponse();

      validate(testSchema)(req, res, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: '驗證失敗',
          errors: expect.arrayContaining([
            expect.objectContaining({ path: 'name' }),
            expect.objectContaining({ path: 'age' })
          ])
        })
      );
    });

    it('應該支持不同的請求來源 (query)', () => {
      const req = mockRequest({ name: 'Test User', age: 25 });
      const res = mockResponse();

      validate(testSchema, 'query')(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('應該支持不同的請求來源 (params)', () => {
      const req = mockRequest({ name: 'Test User', age: 25 });
      const res = mockResponse();

      validate(testSchema, 'params')(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });
});
