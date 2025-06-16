/**
 * Express 模組的類型定義擴展
 */

import { Request as ExpressRequest, Response as ExpressResponse, NextFunction as ExpressNextFunction } from 'express-serve-static-core';

declare global {
  namespace Express {
    export interface Request extends ExpressRequest {
      user?: {
        id: number;
        username?: string;
        email?: string;
        isTemp?: boolean;
        roles?: string[];
        [key: string]: any;
      };
    }
  }
}

declare module 'express-serve-static-core' {
  export interface RequestHandler {
    (req: Request, res: Response, next: NextFunction): void | Response | Promise<void> | Promise<Response>;
  }
}

declare module 'express' {
  export interface Request {
    user?: {
      id: number;
      username?: string;
      email?: string;
      isTemp?: boolean;
      roles?: string[];
      [key: string]: any;
    };
  }
}
