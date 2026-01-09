/**
 * Request ID Generation Utilities
 * 
 * Provides utilities for generating and extracting unique request identifiers
 */

import { randomUUID } from 'crypto';
import { Request } from 'express';

/**
 * Generate a unique request ID
 * Format: req_<12-character-alphanumeric>
 */
export const generateRequestId = (): string => {
  return `req_${randomUUID().replace(/-/g, '').substring(0, 12)}`;
};

/**
 * Extract request ID from Express request
 * Priority: req.requestId > x-request-id header > generate new
 */
export const extractRequestId = (req: Request): string => {
  return req.requestId || 
         (req.headers['x-request-id'] as string) || 
         generateRequestId();
};