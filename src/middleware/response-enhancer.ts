/**
 * Response Enhancer Middleware
 * 
 * Automatically injects requestId, timestamp, and processingTime into responses
 */

import { Request, Response, NextFunction } from 'express';
import { extractRequestId } from '../utils/request-id';

/**
 * Response enhancer middleware
 * Automatically adds standard response metadata
 */
export const responseEnhancerMiddleware = (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  req.startTime = Date.now();
  req.requestId = extractRequestId(req);
  
  // Intercept res.json method
  const originalJson = res.json;
  res.json = function(data: any) {
    // Only enhance if it's our standard response format
    if (data && typeof data === 'object' && 'success' in data) {
      data.timestamp = new Date().toISOString();
      data.meta = {
        ...data.meta,
        requestId: req.requestId,
        processingTime: Date.now() - req.startTime!
      };
    }
    return originalJson.call(this, data);
  };
  
  next();
};