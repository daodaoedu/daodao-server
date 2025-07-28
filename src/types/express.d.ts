/**
 * Express Request interface augmentation
 * Extends Express Request to include our custom user property types
 */

import { UserJwtPayload } from './auth.types';

declare global {
  namespace Express {
    interface User extends UserJwtPayload {}
    
    interface Request {
      user?: UserJwtPayload;
      isTemporary?: boolean;
    }
  }
}

export {};