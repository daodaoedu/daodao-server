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
): void => {
  req.startTime = Date.now();
  req.requestId = extractRequestId(req);
  
  // Intercept res.json method
  const originalJson = res.json;
  res.json = function(data: unknown): Response {
    // Only enhance if it's our standard response format
    if (data && typeof data === 'object' && 'success' in data) {
      const responseData = data as Record<string, unknown>;
      responseData.timestamp = new Date().toISOString();
      responseData.meta = {
        ...(responseData.meta as Record<string, unknown> || {}),
        requestId: req.requestId,
        processingTime: Date.now() - (req.startTime || 0)
      };
    }
    return originalJson.call(this, data);
  };
  
  next();
};