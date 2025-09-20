/**
 * Standard API Response Types
 * 
 * This file defines the unified response format for all API endpoints.
 * Based on the API Response Format Standardization Tasks.
 */

// Basic success response interface
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  timestamp: string;
  meta?: ResponseMeta;
}

// Basic error response interface
export interface ApiErrorResponse {
  success: false;
  data: null;
  error: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
  timestamp: string;
  meta?: ResponseMeta;
}

// Unified response type
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// Pagination info interface
export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Cursor pagination interface
export interface CursorPaginationInfo {
  cursors: {
    start: string | null;
    end: string | null;
  };
  hasMore: boolean;
  count: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
  nextCursor: string | null;
  prevCursor: string | null;
  totalEstimate: number | null;
  parentTotalEstimate: number | null;
}

// Page-based pagination response (success only)
export interface PaginatedApiResponse<T> {
  success: true;
  data: T[];
  pagination: PaginationInfo;
  timestamp: string;
  meta?: ResponseMeta;
}

// Cursor pagination response (success only)
export interface CursorPaginatedApiResponse<T> {
  success: true;
  data: T[];
  pagination: CursorPaginationInfo;
  timestamp: string;
  meta?: ResponseMeta;
}

// Pagination Union types (including error response)
export type PaginatedResponse<T> = PaginatedApiResponse<T> | ApiErrorResponse;
export type CursorPaginatedResponse<T> = CursorPaginatedApiResponse<T> | ApiErrorResponse;

// Response meta interface
export interface ResponseMeta {
  // Search related
  searchQuery?: string;
  searchTime?: number;
  filters?: Record<string, unknown>;
  
  // Statistics info
  categoryCounts?: Record<string, number>;
  aggregateData?: Record<string, unknown>;
  
  // System info
  requestId?: string;
  cacheHit?: boolean;
  processingTime?: number;
  
  // Extension fields
  [key: string]: unknown;
}