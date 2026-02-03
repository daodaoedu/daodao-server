/**
 * Response Helper Utilities
 * 
 * Provides standardized functions for creating API responses
 * Based on the unified API response format specification
 */

import {
  ApiSuccessResponse,
  ApiErrorResponse,
  PaginatedApiResponse,
  CursorPaginatedApiResponse,
  PaginationInfo,
  CursorPaginationInfo,
  ResponseMeta,
  Facets
} from '../types/api-response.types';

/**
 * Create a successful API response
 */
export const createSuccessResponse = <T>(
  data: T,
  meta?: Partial<ResponseMeta>
): ApiSuccessResponse<T> => ({
  success: true,
  data,
  timestamp: new Date().toISOString(),
  meta
});

/**
 * Create a paginated API response
 */
export const createPaginatedResponse = <T>(
  data: T[],
  pagination: PaginationInfo,
  meta?: Partial<ResponseMeta>
): PaginatedApiResponse<T> => ({
  success: true,
  data,
  pagination,
  timestamp: new Date().toISOString(),
  meta
});

/**
 * Create a cursor paginated API response
 */
export const createCursorPaginatedResponse = <T>(
  data: T[],
  pagination: CursorPaginationInfo,
  meta?: Partial<ResponseMeta>,
  facets?: Facets
): CursorPaginatedApiResponse<T> => ({
  success: true,
  data,
  pagination,
  ...(facets && { facets }),
  timestamp: new Date().toISOString(),
  meta
});

/**
 * Create an error API response
 */
export const createErrorResponse = (
  code: string,
  message: string,
  details?: Record<string, string>,
  meta?: Partial<ResponseMeta>
): ApiErrorResponse => ({
  success: false,
  data: null,
  error: {
    code,
    message,
    details
  },
  timestamp: new Date().toISOString(),
  meta
});

/**
 * Create error response from AppError
 */
export const createErrorFromAppError = (
  error: unknown,
  requestId?: string
): ApiErrorResponse => {
  // Map AppError class names to standard error codes
  const errorCodeMap: Record<string, string> = {
    'BadRequestError': 'BAD_REQUEST',
    'UnauthorizedError': 'UNAUTHORIZED',
    'ForbiddenError': 'FORBIDDEN',
    'NotFoundError': 'NOT_FOUND',
    'ConflictError': 'CONFLICT',
    'UnprocessableEntityError': 'UNPROCESSABLE_ENTITY',
    'TooManyRequestsError': 'TOO_MANY_REQUESTS',
    'InternalServerError': 'INTERNAL_SERVER_ERROR'
  };
  
  const errorData = error as Record<string, unknown>;
  return {
    success: false,
    data: null,
    error: {
      code: errorCodeMap[errorData.name as string] || 'INTERNAL_SERVER_ERROR',
      message: (errorData.message as string) || 'Unknown error',
      details: errorData.errors as Record<string, string> || undefined
    },
    timestamp: new Date().toISOString(),
    meta: requestId ? { requestId } : undefined
  };
};