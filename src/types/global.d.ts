import { Express } from 'express';

declare global {
  namespace Express {
    interface Request {
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

export {};