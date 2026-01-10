/**
 * Pagination Helper Utilities
 * 
 * Provides utilities for calculating pagination information
 */

import { PaginationInfo, CursorPaginationInfo } from '../types/api-response.types';

/**
 * Calculate pagination information for page-based pagination
 */
export const calculatePagination = (
  page: number,
  limit: number,
  totalItems: number
): PaginationInfo => {
  const totalPages = Math.ceil(totalItems / limit);
  return {
    currentPage: page,
    totalPages,
    totalItems,
    itemsPerPage: limit,
    hasNext: page < totalPages,
    hasPrev: page > 1
  };
};

/**
 * Create cursor pagination information
 */
export const createCursorInfo = (
  data: Record<string, unknown>[],
  hasMore: boolean,
  cursorField = 'id'
): CursorPaginationInfo => {
  const start = data.length > 0 ? data[0][cursorField] : null;
  const end = data.length > 0 ? data[data.length - 1][cursorField] : null;
  
  return {
    cursors: {
      start: start ? btoa(start.toString()) : null,
      end: end ? btoa(end.toString()) : null
    },
    hasMore,
    count: data.length,
    limit: data.length, // Use actual data length as limit fallback
    hasNext: hasMore,
    hasPrev: false, // Simple fallback, would need more context for accurate value
    nextCursor: end ? btoa(end.toString()) : null,
    prevCursor: start ? btoa(start.toString()) : null,
    totalEstimate: data.length,
    parentTotalEstimate: null
  };
};