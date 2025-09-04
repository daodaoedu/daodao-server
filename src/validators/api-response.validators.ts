/**
 * API Response Validators with Zod v4 Metadata
 * 
 * Standardized response schemas for all API endpoints with comprehensive
 * metadata for automatic Swagger documentation generation.
 */

import { z } from 'zod';

/**
 * Response metadata schema for optional response information
 */
export const responseMetaSchema = z.object({
  // Search related metadata
  searchQuery: z.string().optional()
    .describe('Search query used for filtering results'),
  searchTime: z.number().min(0).optional()
    .describe('Time taken to execute the search query in milliseconds'),
  filters: z.record(z.string(), z.unknown()).optional()
    .describe('Applied filters for the request'),
  
  // Statistics metadata
  categoryCounts: z.record(z.string(), z.number().int().min(0)).optional()
    .describe('Count of items per category'),
  aggregateData: z.record(z.string(), z.unknown()).optional()
    .describe('Aggregated statistical data'),
  
  // System metadata
  requestId: z.string().uuid('請提供有效的請求ID').optional()
    .describe('Unique identifier for request tracking'),
  cacheHit: z.boolean().optional()
    .describe('Whether the response was served from cache'),
  processingTime: z.number().min(0).optional()
    .describe('Total processing time in milliseconds')
}).catchall(z.unknown())
.describe('Response metadata containing additional information')
.meta({
  title: 'Response Metadata',
  examples: [
    {
      searchQuery: 'JavaScript教程',
      searchTime: 45,
      cacheHit: false,
      processingTime: 123.5,
      requestId: 'req-123e4567-e89b-12d3-a456-426614174000'
    },
    {
      categoryCounts: {
        '前端開發': 25,
        '後端開發': 18,
        '資料科學': 12
      },
      filters: {
        difficulty: 'intermediate',
        language: 'zh-TW'
      }
    }
  ]
});

/**
 * Success response schema for single data items
 */
export const apiSuccessResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true)
      .describe('Indicates successful API response'),
    data: dataSchema
      .describe('The main response data'),
    timestamp: z.string().datetime('時間戳格式不正確')
      .describe('ISO 8601 timestamp of the response'),
    meta: responseMetaSchema.optional()
      .describe('Optional metadata about the response')
  })
  .describe('Standard success response format')
  .meta({
    title: 'API Success Response',
    examples: [
      {
        success: true,
        data: {
          id: 123,
          _id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'JavaScript 基礎教程',
          description: '從零開始學習 JavaScript 程式設計',
          status: 'published'
        },
        timestamp: '2024-01-15T10:30:00.000Z'
      },
      {
        success: true,
        data: {
          userId: 456,
          username: 'john_doe',
          email: 'john@example.com',
          role: 'student'
        },
        timestamp: '2024-01-15T10:30:00.000Z',
        meta: {
          cacheHit: true,
          processingTime: 23.1
        }
      }
    ]
  });

/**
 * Error response schema for failed requests
 */
export const apiErrorResponseSchema = z.object({
  success: z.literal(false)
    .describe('Indicates failed API response'),
  data: z.literal(null)
    .describe('Null data for error responses'),
  error: z.object({
    code: z.string()
      .describe('Error code for programmatic handling'),
    message: z.string()
      .describe('Human-readable error message'),
    details: z.record(z.string(), z.string()).optional()
      .describe('Additional error details')
  }).describe('Error information object'),
  timestamp: z.string().datetime('時間戳格式不正確')
    .describe('ISO 8601 timestamp of the response'),
  meta: responseMetaSchema.optional()
    .describe('Optional metadata about the response')
})
.describe('Standard error response format')
.meta({
  title: 'API Error Response',
  examples: [
    {
      success: false,
      data: null,
      error: {
        code: 'USER_NOT_FOUND',
        message: '用戶不存在',
        details: {
          userId: '123',
          reason: '資料庫中找不到指定的用戶'
        }
      },
      timestamp: '2024-01-15T10:30:00.000Z'
    },
    {
      success: false,
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: '輸入資料驗證失敗',
        details: {
          email: '電子郵件格式無效',
          password: '密碼長度至少需要 8 個字元'
        }
      },
      timestamp: '2024-01-15T10:30:00.000Z',
      meta: {
        requestId: 'req-123e4567-e89b-12d3-a456-426614174001',
        processingTime: 15.3
      }
    }
  ]
});

/**
 * Pagination information schema for page-based pagination
 */
export const paginationInfoSchema = z.object({
  currentPage: z.number().int().min(1)
    .describe('Current page number (1-based)'),
  totalPages: z.number().int().min(0)
    .describe('Total number of pages'),
  totalItems: z.number().int().min(0)
    .describe('Total number of items across all pages'),
  itemsPerPage: z.number().int().min(1)
    .describe('Number of items per page'),
  hasNext: z.boolean()
    .describe('Whether there are more pages after current page'),
  hasPrev: z.boolean()
    .describe('Whether there are pages before current page')
})
.describe('Pagination information for page-based pagination')
.meta({
  title: 'Pagination Information',
  examples: [
    {
      currentPage: 1,
      totalPages: 5,
      totalItems: 50,
      itemsPerPage: 10,
      hasNext: true,
      hasPrev: false
    },
    {
      currentPage: 3,
      totalPages: 8,
      totalItems: 156,
      itemsPerPage: 20,
      hasNext: true,
      hasPrev: true
    }
  ]
});

/**
 * Cursor pagination information schema
 */
export const cursorPaginationInfoSchema = z.object({
  cursors: z.object({
    start: z.string().nullable()
      .describe('Start cursor for the current page'),
    end: z.string().nullable()
      .describe('End cursor for the current page')
  }).describe('Cursor boundaries for the current page'),
  hasMore: z.boolean()
    .describe('Whether there are more items after the current page'),
  count: z.number().int().min(0)
    .describe('Number of items in the current page')
})
.describe('Pagination information for cursor-based pagination')
.meta({
  title: 'Cursor Pagination Information',
  examples: [
    {
      cursors: {
        start: 'eyJpZCI6MTIzLCJjcmVhdGVkQXQiOiIyMDI0LTAxLTE1VDEwOjMwOjAwWiJ9',
        end: 'eyJpZCI6MTQyLCJjcmVhdGVkQXQiOiIyMDI0LTAxLTE1VDExOjMwOjAwWiJ9'
      },
      hasMore: true,
      count: 20
    },
    {
      cursors: {
        start: 'eyJpZCI6MTgwLCJjcmVhdGVkQXQiOiIyMDI0LTAxLTE1VDE0OjMwOjAwWiJ9',
        end: null
      },
      hasMore: false,
      count: 8
    }
  ]
});

/**
 * Paginated response schema for page-based pagination
 */
export const paginatedApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true)
      .describe('Indicates successful API response'),
    data: z.array(dataSchema)
      .describe('Array of paginated data items'),
    pagination: paginationInfoSchema
      .describe('Pagination information'),
    timestamp: z.string().datetime('時間戳格式不正確')
      .describe('ISO 8601 timestamp of the response'),
    meta: responseMetaSchema.optional()
      .describe('Optional metadata about the response')
  })
  .describe('Paginated response format for page-based pagination')
  .meta({
    title: 'Paginated API Response',
    examples: [
      {
        success: true,
        data: [
          {
            id: 1,
            title: 'React 入門教程',
            category: '前端開發',
            createdAt: '2024-01-10T10:00:00Z'
          },
          {
            id: 2,
            title: 'Vue.js 進階指南',
            category: '前端開發',
            createdAt: '2024-01-11T10:00:00Z'
          }
        ],
        pagination: {
          currentPage: 1,
          totalPages: 5,
          totalItems: 50,
          itemsPerPage: 10,
          hasNext: true,
          hasPrev: false
        },
        timestamp: '2024-01-15T10:30:00.000Z',
        meta: {
          searchTime: 45,
          cacheHit: false,
          categoryCounts: {
            '前端開發': 25,
            '後端開發': 18,
            '資料科學': 7
          }
        }
      }
    ]
  });

/**
 * Cursor-based paginated response schema
 */
export const cursorPaginatedApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true)
      .describe('Indicates successful API response'),
    data: z.array(dataSchema)
      .describe('Array of paginated data items'),
    pagination: cursorPaginationInfoSchema
      .describe('Cursor-based pagination information'),
    timestamp: z.string().datetime('時間戳格式不正確')
      .describe('ISO 8601 timestamp of the response'),
    meta: responseMetaSchema.optional()
      .describe('Optional metadata about the response')
  })
  .describe('Paginated response format for cursor-based pagination')
  .meta({
    title: 'Cursor Paginated API Response',
    examples: [
      {
        success: true,
        data: [
          {
            id: 123,
            title: 'Node.js 實戰開發',
            category: '後端開發',
            createdAt: '2024-01-12T14:30:00Z'
          },
          {
            id: 124,
            title: 'Express.js 框架學習',
            category: '後端開發',
            createdAt: '2024-01-13T09:15:00Z'
          }
        ],
        pagination: {
          cursors: {
            start: 'eyJpZCI6MTIzLCJjcmVhdGVkQXQiOiIyMDI0LTAxLTEyVDE0OjMwOjAwWiJ9',
            end: 'eyJpZCI6MTI0LCJjcmVhdGVkQXQiOiIyMDI0LTAxLTEzVDA5OjE1OjAwWiJ9'
          },
          hasMore: true,
          count: 20
        },
        timestamp: '2024-01-15T10:30:00.000Z',
        meta: {
          processingTime: 67.2,
          requestId: 'req-456e7890-e89b-12d3-a456-426614174000'
        }
      }
    ]
  });

/**
 * Generic API response union type (success or error)
 */
export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.union([
    apiSuccessResponseSchema(dataSchema),
    apiErrorResponseSchema
  ])
  .describe('Generic API response that can be either success or error')
  .meta({
    title: 'API Response',
    examples: [
      // Success example
      {
        success: true,
        data: {
          id: 789,
          name: '範例資源',
          status: 'active'
        },
        timestamp: '2024-01-15T10:30:00.000Z'
      },
      // Error example
      {
        success: false,
        data: null,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: '找不到指定的資源'
        },
        timestamp: '2024-01-15T10:30:00.000Z'
      }
    ]
  });

/**
 * Paginated response union type (success or error)
 */
export const paginatedResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.union([
    paginatedApiResponseSchema(dataSchema),
    apiErrorResponseSchema
  ])
  .describe('Paginated response that can be either success with data array or error')
  .meta({
    title: 'Paginated Response',
    examples: [
      // Success example with pagination
      {
        success: true,
        data: [
          { id: 1, name: '項目 1' },
          { id: 2, name: '項目 2' }
        ],
        pagination: {
          currentPage: 1,
          totalPages: 3,
          totalItems: 25,
          itemsPerPage: 10,
          hasNext: true,
          hasPrev: false
        },
        timestamp: '2024-01-15T10:30:00.000Z'
      },
      // Error example
      {
        success: false,
        data: null,
        error: {
          code: 'INVALID_PAGE_NUMBER',
          message: '頁碼超出範圍'
        },
        timestamp: '2024-01-15T10:30:00.000Z'
      }
    ]
  });

/**
 * Cursor paginated response union type (success or error)
 */
export const cursorPaginatedResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.union([
    cursorPaginatedApiResponseSchema(dataSchema),
    apiErrorResponseSchema
  ])
  .describe('Cursor paginated response that can be either success with data array or error')
  .meta({
    title: 'Cursor Paginated Response',
    examples: [
      // Success example with cursor pagination
      {
        success: true,
        data: [
          { id: 15, title: '最新文章' },
          { id: 14, title: '熱門教程' }
        ],
        pagination: {
          cursors: {
            start: 'eyJpZCI6MTUsImNyZWF0ZWRBdCI6IjIwMjQtMDEtMTVUMTA6MDA6MDBaIn0=',
            end: 'eyJpZCI6MTQsImNyZWF0ZWRBdCI6IjIwMjQtMDEtMTRUMTA6MDA6MDBaIn0='
          },
          hasMore: true,
          count: 10
        },
        timestamp: '2024-01-15T10:30:00.000Z'
      },
      // Error example
      {
        success: false,
        data: null,
        error: {
          code: 'INVALID_CURSOR',
          message: '無效的分頁游標'
        },
        timestamp: '2024-01-15T10:30:00.000Z'
      }
    ]
  });

/**
 * Concrete schema instances for Swagger generation
 * These are created with generic object schemas for documentation purposes
 */
const genericDataSchema = z.object({
  id: z.number().int().optional().describe('Unique identifier'),
  _id: z.string().optional().describe('MongoDB Object ID'),
  name: z.string().optional().describe('Resource name'),
  title: z.string().optional().describe('Resource title'),
  description: z.string().optional().describe('Resource description'),
  status: z.string().optional().describe('Resource status'),
  createdAt: z.string().datetime().optional().describe('Creation timestamp'),
  updatedAt: z.string().datetime().optional().describe('Update timestamp')
}).describe('Generic data object for API responses');

/**
 * Simple success response schema example for Swagger
 */
export const apiSuccessResponseExample = z.object({
  success: z.literal(true).describe('Indicates successful API response'),
  data: genericDataSchema.describe('The main response data'),
  timestamp: z.string().datetime().describe('ISO 8601 timestamp of the response'),
  meta: responseMetaSchema.optional().describe('Optional metadata about the response')
}).describe('Standard success response format')
.meta({
  title: 'API Success Response',
  examples: [{
    success: true,
    data: {
      id: 123,
      name: 'Example Resource',
      title: 'Sample Title',
      status: 'active'
    },
    timestamp: '2024-01-15T10:30:00.000Z'
  }]
});

/**
 * Simple paginated response schema example for Swagger
 */
export const paginatedApiResponseExample = z.object({
  success: z.literal(true).describe('Indicates successful API response'),
  data: z.array(genericDataSchema).describe('Array of paginated data items'),
  pagination: paginationInfoSchema.describe('Pagination information'),
  timestamp: z.string().datetime().describe('ISO 8601 timestamp of the response'),
  meta: responseMetaSchema.optional().describe('Optional metadata about the response')
}).describe('Paginated response format')
.meta({
  title: 'Paginated API Response',
  examples: [{
    success: true,
    data: [
      { id: 1, name: 'Item 1', title: 'First Item' },
      { id: 2, name: 'Item 2', title: 'Second Item' }
    ],
    pagination: {
      currentPage: 1,
      totalPages: 5,
      totalItems: 50,
      itemsPerPage: 10,
      hasNext: true,
      hasPrev: false
    },
    timestamp: '2024-01-15T10:30:00.000Z'
  }]
});

/**
 * Simple cursor paginated response schema example for Swagger  
 */
export const cursorPaginatedApiResponseExample = z.object({
  success: z.literal(true).describe('Indicates successful API response'),
  data: z.array(genericDataSchema).describe('Array of paginated data items'),
  pagination: cursorPaginationInfoSchema.describe('Cursor-based pagination information'),
  timestamp: z.string().datetime().describe('ISO 8601 timestamp of the response'),
  meta: responseMetaSchema.optional().describe('Optional metadata about the response')
}).describe('Cursor paginated response format')
.meta({
  title: 'Cursor Paginated API Response',
  examples: [{
    success: true,
    data: [
      { id: 123, name: 'Latest Item', title: 'Most Recent' },
      { id: 122, name: 'Previous Item', title: 'Second Most Recent' }
    ],
    pagination: {
      cursors: {
        start: 'eyJpZCI6MTIzfQ==',
        end: 'eyJpZCI6MTIyfQ=='
      },
      hasMore: true,
      count: 20
    },
    timestamp: '2024-01-15T10:30:00.000Z'
  }]
});

// Export types inferred from schemas for TypeScript usage
export type ResponseMeta = z.infer<typeof responseMetaSchema>;
export type ApiSuccessResponse<T> = z.infer<ReturnType<typeof apiSuccessResponseSchema<z.ZodSchema<T>>>>;
export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>;
export type PaginationInfo = z.infer<typeof paginationInfoSchema>;
export type CursorPaginationInfo = z.infer<typeof cursorPaginationInfoSchema>;
export type PaginatedApiResponse<T> = z.infer<ReturnType<typeof paginatedApiResponseSchema<z.ZodSchema<T>>>>;
export type CursorPaginatedApiResponse<T> = z.infer<ReturnType<typeof cursorPaginatedApiResponseSchema<z.ZodSchema<T>>>>;
export type ApiResponse<T> = z.infer<ReturnType<typeof apiResponseSchema<z.ZodSchema<T>>>>;
export type PaginatedResponse<T> = z.infer<ReturnType<typeof paginatedResponseSchema<z.ZodSchema<T>>>>;
export type CursorPaginatedResponse<T> = z.infer<ReturnType<typeof cursorPaginatedResponseSchema<z.ZodSchema<T>>>>;