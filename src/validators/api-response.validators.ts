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
  requestId: z.string().optional()
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
export const apiSuccessResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T): z.ZodSchema =>
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
    code: z.enum([
      'VALIDATION_ERROR', 
      'INVALID_TOKEN', 
      'TOKEN_EXPIRED',
      'DATABASE_ERROR',
      'FILE_UPLOAD_ERROR',
      'APP_ERROR',
      'INTERNAL_SERVER_ERROR',
      'USER_NOT_FOUND',
      'RESOURCE_NOT_FOUND',
      'UNAUTHORIZED',
      'FORBIDDEN',
      'CONFLICT',
      'BAD_REQUEST'
    ])
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
 * Facet value schema for faceted search results
 */
export const facetValueSchema = z.object({
  value: z.string()
    .describe('Facet value key (used for URL path parameter)'),
  count: z.number().int().min(0)
    .describe('Number of items matching this facet value')
})
.describe('Single facet value with count')
.meta({
  title: 'Facet Value',
  examples: [
    { value: 'education_learning', count: 45 },
    { value: 'physics', count: 15 }
  ]
});

/**
 * Facets schema for faceted search aggregations
 */
export const facetsSchema = z.object({
  majorCategory: z.array(facetValueSchema).optional()
    .describe('Major category facet values (parent_id is NULL)'),
  subCategory: z.array(facetValueSchema).optional()
    .describe('Sub category facet values (parent_id is NOT NULL)')
}).catchall(z.array(facetValueSchema))
.describe('Faceted search aggregations for category filtering')
.meta({
  title: 'Facets',
  examples: [
    {
      majorCategory: [
        { value: 'education_learning', count: 45 },
        { value: 'nature_environment', count: 32 },
        { value: 'information_computer_science', count: 28 }
      ],
      subCategory: [
        { value: 'physics', count: 15 },
        { value: 'biology', count: 12 },
        { value: 'mathematics', count: 10 }
      ]
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
    .describe('Number of items in the current page'),
  limit: z.number().int().min(1)
    .describe('Maximum number of items per page'),
  hasNext: z.boolean()
    .describe('Whether there are more items in the next page'),
  hasPrev: z.boolean()
    .describe('Whether there are items in the previous page'),
  nextCursor: z.string().nullable()
    .describe('Cursor to fetch the next page'),
  prevCursor: z.string().nullable()
    .describe('Cursor to fetch the previous page'),
  totalEstimate: z.number().int().min(0).nullable()
    .describe('Estimated total number of items (may be null if unknown)'),
  parentTotalEstimate: z.number().int().min(0).nullable()
    .describe('Estimated total number of items in parent context (may be null)')
})
.describe('Pagination information for cursor-based pagination')
.meta({
  title: 'Cursor Pagination Information',
  examples: [
    {
      cursors: {
        start: 'eyJpZCI6ODUzLCJ0aW1lc3RhbXAiOiIyMDI1LTA2LTIxVDE3OjM3OjE3LjcwMFoifQ==',
        end: 'eyJpZCI6ODQ5LCJ0aW1lc3RhbXAiOiIyMDI1LTA2LTIxVDE3OjM3OjE3LjY5N1oifQ=='
      },
      hasMore: true,
      count: 5,
      limit: 5,
      hasNext: true,
      hasPrev: true,
      nextCursor: 'eyJpZCI6ODQ5LCJ0aW1lc3RhbXAiOiIyMDI1LTA2LTIxVDE3OjM3OjE3LjY5N1oifQ==',
      prevCursor: 'eyJpZCI6ODUzLCJ0aW1lc3RhbXAiOiIyMDI1LTA2LTIxVDE3OjM3OjE3LjcwMFoifQ==',
      totalEstimate: 5,
      parentTotalEstimate: null
    },
    {
      cursors: {
        start: 'eyJpZCI6MTgwLCJjcmVhdGVkQXQiOiIyMDI0LTAxLTE1VDE0OjMwOjAwWiJ9',
        end: null
      },
      hasMore: false,
      count: 8,
      limit: 10,
      hasNext: false,
      hasPrev: true,
      nextCursor: null,
      prevCursor: 'eyJpZCI6MTgwLCJjcmVhdGVkQXQiOiIyMDI0LTAxLTE1VDE0OjMwOjAwWiJ9',
      totalEstimate: 8,
      parentTotalEstimate: null
    }
  ]
});

/**
 * Paginated response schema for page-based pagination
 */
export const paginatedApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T): z.ZodSchema =>
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
export const cursorPaginatedApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T): z.ZodSchema =>
  z.object({
    success: z.literal(true)
      .describe('Indicates successful API response'),
    data: z.array(dataSchema)
      .describe('Array of paginated data items'),
    pagination: cursorPaginationInfoSchema
      .describe('Cursor-based pagination information'),
    facets: facetsSchema.optional()
      .describe('Faceted search aggregations for filtering'),
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
        facets: {
          majorCategory: [
            { value: 'education_learning', count: 45 },
            { value: 'nature_environment', count: 32 },
            { value: 'information_computer_science', count: 28 }
          ],
          subCategory: [
            { value: 'physics', count: 15 },
            { value: 'biology', count: 12 },
            { value: 'mathematics', count: 10 }
          ]
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
export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T): z.ZodSchema =>
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
export const paginatedResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T): z.ZodSchema =>
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
export const cursorPaginatedResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T): z.ZodSchema =>
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
}).strict()
.describe('Standard success response format')
.meta({
  title: 'API Success Response Example',
  examples: [{
    success: true,
    data: {
      id: 123,
      _id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Example Resource',
      title: 'Sample Title',
      description: 'Example resource description',
      status: 'active',
      createdAt: '2024-01-15T10:30:00.000Z',
      updatedAt: '2024-01-15T10:30:00.000Z'
    },
    timestamp: '2024-01-15T10:30:00.000Z',
    meta: {
      requestId: 'req-123e4567-e89b-12d3-a456-426614174000',
      processingTime: 23.1,
      cacheHit: false
    }
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
  facets: facetsSchema.optional().describe('Faceted search aggregations for filtering'),
  timestamp: z.string().datetime().describe('ISO 8601 timestamp of the response'),
  meta: responseMetaSchema.optional().describe('Optional metadata about the response')
}).describe('Cursor paginated response format')
.meta({
  title: 'Cursor Paginated API Response',
  examples: [{
    success: true,
    data: [
      { id: 853, name: 'Latest Resource', title: 'Most Recent Resource', status: 'published' },
      { id: 849, name: 'Previous Resource', title: 'Second Most Recent Resource', status: 'published' }
    ],
    pagination: {
      cursors: {
        start: 'eyJpZCI6ODUzLCJ0aW1lc3RhbXAiOiIyMDI1LTA2LTIxVDE3OjM3OjE3LjcwMFoifQ==',
        end: 'eyJpZCI6ODQ5LCJ0aW1lc3RhbXAiOiIyMDI1LTA2LTIxVDE3OjM3OjE3LjY5N1oifQ=='
      },
      hasMore: true,
      count: 5,
      limit: 5,
      hasNext: true,
      hasPrev: true,
      nextCursor: 'eyJpZCI6ODQ5LCJ0aW1lc3RhbXAiOiIyMDI1LTA2LTIxVDE3OjM3OjE3LjY5N1oifQ==',
      prevCursor: 'eyJpZCI6ODUzLCJ0aW1lc3RhbXAiOiIyMDI1LTA2LTIxVDE3OjM3OjE3LjcwMFoifQ==',
      totalEstimate: 5,
      parentTotalEstimate: null
    },
    facets: {
      majorCategory: [
        { value: 'education_learning', count: 45 },
        { value: 'nature_environment', count: 32 },
        { value: 'information_computer_science', count: 28 }
      ],
      subCategory: [
        { value: 'physics', count: 15 },
        { value: 'biology', count: 12 },
        { value: 'mathematics', count: 10 }
      ]
    },
    timestamp: '2024-01-15T10:30:00.000Z',
    meta: {
      requestId: 'req-123e4567-e89b-12d3-a456-426614174000',
      processingTime: 42.5
    }
  }]
});

/**
 * 用戶資料 schema（用於認證響應）
 */
export const authUserDataSchema = z.object({
  id: z.number().int().describe("用戶數字 ID"),
  _id: z.string().describe("用戶外部 ID (UUID)"),
  name: z.string().nullable().describe("用戶姓名"),
  email: z.string().email().nullable().describe("電子郵件地址"),
  photoUrl: z.string().url().nullable().describe("個人大頭照 URL"),
  roleId: z.number().int().nullable().describe("角色 ID"),
  gender: z.string().nullable().describe("性別"),
  birthDay: z.string().nullable().describe("生日"),
  isOpenLocation: z.boolean().nullable().describe("是否公開位置"),
  isOpenProfile: z.boolean().nullable().describe("是否公開個人資料"),
  tagList: z.array(z.string()).optional().describe("標籤列表"),
  roleList: z.array(z.string()).optional().describe("角色列表"),
  customId: z.string().nullable().describe("自訂 ID"),
  customIdVerified: z.boolean().optional().describe("自訂 ID 是否已驗證"),
  createdDate: z.string().datetime().optional().describe("建立時間"),
  updatedDate: z.string().datetime().optional().describe("更新時間")
}).describe("認證用戶資料").meta({
  title: "用戶資料",
  examples: [{
    id: 123,
    _id: "123e4567-e89b-12d3-a456-426614174000",
    name: "王小明",
    email: "wang.xiaoming@example.com",
    photoUrl: "https://example.com/avatar/wang.jpg",
    roleId: 1,
    gender: "male",
    birthDay: "1990-01-01",
    isOpenLocation: true,
    isOpenProfile: true,
    tagList: ["開發者", "學習者"],
    roleList: ["user", "mentor"],
    customId: "xiaoming_wang",
    customIdVerified: true,
    createdDate: "2024-01-15T10:30:00.000Z",
    updatedDate: "2024-01-15T10:30:00.000Z"
  }]
});

/**
 * 登入/創建用戶成功響應 schema
 */
export const authLoginResponseExample = z.object({
  success: z.literal(true).describe('Indicates successful API response'),
  data: z.object({
    user: authUserDataSchema,
    token: z.string().describe("JWT 認證 token")
  }),
  timestamp: z.string().datetime().describe('ISO 8601 timestamp of the response'),
  meta: responseMetaSchema.optional().describe('Optional metadata about the response')
}).describe('登入/創建用戶成功響應格式')
.meta({
  title: 'Authentication Login Response',
  examples: [{
    success: true,
    data: {
      user: {
        id: 123,
        _id: "123e4567-e89b-12d3-a456-426614174000",
        name: "王小明",
        email: "wang.xiaoming@example.com",
        photoUrl: "https://example.com/avatar/wang.jpg",
        roleId: 1,
        gender: "male",
        birthDay: "1990-01-01",
        isOpenLocation: true,
        isOpenProfile: true,
        tagList: ["開發者", "學習者"],
        roleList: ["user", "mentor"],
        customId: "xiaoming_wang",
        customIdVerified: true,
        createdDate: "2024-01-15T10:30:00.000Z",
        updatedDate: "2024-01-15T10:30:00.000Z"
      },
      token: "PRIVATE_RUNTIME_AUTH_TOKEN_REQUIRED"
    },
    timestamp: "2024-01-15T10:30:00.000Z"
  }]
});

/**
 * 用戶更新響應 schema
 */
export const authUserUpdateResponseExample = z.object({
  success: z.literal(true).describe('Indicates successful API response'),
  data: z.object({
    user: authUserDataSchema
  }),
  timestamp: z.string().datetime().describe('ISO 8601 timestamp of the response'),
  meta: responseMetaSchema.optional().describe('Optional metadata about the response')
}).describe('用戶更新成功響應格式').meta({
  title: 'User Update Response',
  examples: [{
    success: true,
    data: {
      user: {
        id: 123,
        _id: "123e4567-e89b-12d3-a456-426614174000",
        name: "王小明",
        email: "wang.xiaoming@example.com",
        photoUrl: "https://example.com/avatar/wang.jpg",
        roleId: 1,
        gender: "male",
        birthDay: "1990-01-01",
        isOpenLocation: true,
        isOpenProfile: true,
        tagList: ["開發者", "學習者"],
        roleList: ["user", "mentor"],
        customId: "xiaoming_wang",
        customIdVerified: true,
        createdDate: "2024-01-15T10:30:00.000Z",
        updatedDate: "2024-01-15T10:30:00.000Z"
      }
    },
    timestamp: "2024-01-15T10:30:00.000Z"
  }]
});

// Export types inferred from schemas for TypeScript usage
export type ResponseMeta = z.infer<typeof responseMetaSchema>;
export type ApiSuccessResponse<T> = z.infer<ReturnType<typeof apiSuccessResponseSchema<z.ZodSchema<T>>>>;
export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>;
export type PaginationInfo = z.infer<typeof paginationInfoSchema>;
export type CursorPaginationInfo = z.infer<typeof cursorPaginationInfoSchema>;
export type FacetValue = z.infer<typeof facetValueSchema>;
export type Facets = z.infer<typeof facetsSchema>;
export type PaginatedApiResponse<T> = z.infer<ReturnType<typeof paginatedApiResponseSchema<z.ZodSchema<T>>>>;
export type CursorPaginatedApiResponse<T> = z.infer<ReturnType<typeof cursorPaginatedApiResponseSchema<z.ZodSchema<T>>>>;
export type ApiResponse<T> = z.infer<ReturnType<typeof apiResponseSchema<z.ZodSchema<T>>>>;
export type PaginatedResponse<T> = z.infer<ReturnType<typeof paginatedResponseSchema<z.ZodSchema<T>>>>;
export type CursorPaginatedResponse<T> = z.infer<ReturnType<typeof cursorPaginatedResponseSchema<z.ZodSchema<T>>>>;