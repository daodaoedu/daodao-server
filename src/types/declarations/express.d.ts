/**
 * Express 模組的類型定義擴展
 */

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username?: string;
        email?: string;
        isTemp?: boolean;
        roles?: string[];
        [key: string]: unknown;
      };
    }
  }
}

export {};
