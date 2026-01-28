// Express type augmentation

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