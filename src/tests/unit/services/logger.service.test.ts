/**
 * Logger Service 測試
 */

import { loggerService, LOG_LEVELS } from '@/services/logging';

describe('LoggerService', () => {
  beforeEach(() => {
    // 重置環境變數
    delete process.env.NODE_ENV;
  });

  afterEach(() => {
    // 清理
    jest.clearAllMocks();
  });

  describe('基本日誌功能', () => {
    it('應該能夠記錄 info 級別日誌', () => {
      // 測試方法存在且可調用
      expect(() => {
        loggerService.info('測試訊息', { test: true });
      }).not.toThrow();
    });

    it('應該能夠記錄 error 級別日誌', () => {
      expect(() => {
        loggerService.error('錯誤訊息', { error: true });
      }).not.toThrow();
    });

    it('應該能夠記錄 warn 級別日誌', () => {
      expect(() => {
        loggerService.warn('警告訊息', { warning: true });
      }).not.toThrow();
    });

    it('應該能夠記錄 debug 級別日誌', () => {
      expect(() => {
        loggerService.debug('調試訊息', { debug: true });
      }).not.toThrow();
    });

    it('應該能夠記錄 http 級別日誌', () => {
      expect(() => {
        loggerService.http('HTTP 訊息', { request: true });
      }).not.toThrow();
    });
  });

  describe('特殊日誌方法', () => {
    it('應該能夠記錄錯誤對象', () => {
      const testError = new Error('測試錯誤');
      
      expect(() => {
        loggerService.logError(testError, { context: 'test' });
      }).not.toThrow();
    });

    it('應該能夠記錄 HTTP 請求', () => {
      expect(() => {
        loggerService.logRequest({
          method: 'GET',
          url: '/api/test',
          statusCode: 200,
          duration: 100,
        });
      }).not.toThrow();
    });

    it('應該能夠記錄資料庫操作', () => {
      expect(() => {
        loggerService.logDatabaseOperation('SELECT', 'users', 50, true);
      }).not.toThrow();
    });

    it('應該能夠記錄失敗的資料庫操作', () => {
      const testError = new Error('資料庫連接失敗');
      
      expect(() => {
        loggerService.logDatabaseOperation('INSERT', 'users', 200, false, testError);
      }).not.toThrow();
    });

    it('應該能夠記錄業務邏輯', () => {
      expect(() => {
        loggerService.logBusinessLogic('用戶註冊', { userId: 123, email: 'test@example.com' });
      }).not.toThrow();
    });
  });

  describe('Winston Logger 訪問', () => {
    it('應該能夠獲取底層 Winston Logger', () => {
      const winstonLogger = loggerService.getWinstonLogger();
      
      expect(winstonLogger).toBeDefined();
      expect(typeof winstonLogger.info).toBe('function');
      expect(typeof winstonLogger.error).toBe('function');
      expect(typeof winstonLogger.warn).toBe('function');
      expect(typeof winstonLogger.debug).toBe('function');
    });
  });

  describe('日誌級別', () => {
    it('應該定義正確的日誌級別', () => {
      expect(LOG_LEVELS).toEqual({
        error: 0,
        warn: 1,
        info: 2,
        http: 3,
        debug: 4,
      });
    });
  });

  describe('服務可用性', () => {
    it('應該可以作為單例使用', () => {
      expect(loggerService).toBeDefined();
      expect(typeof loggerService.info).toBe('function');
      expect(typeof loggerService.error).toBe('function');
      expect(typeof loggerService.warn).toBe('function');
      expect(typeof loggerService.debug).toBe('function');
      expect(typeof loggerService.http).toBe('function');
    });
  });
});