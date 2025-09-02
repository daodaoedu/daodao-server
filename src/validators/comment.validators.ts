/**
 * Comment validation schemas
 * Using Zod for comprehensive input validation with proper error messages
 */

import { z } from 'zod';

// Comment target type enum values for validation
const COMMENT_TARGET_TYPES = [
  'post',
  'resource', 
  'note',
  'outcome',
  'review',
  'circle',
  'idea',
  'portfolio'
] as const;

// Comment visibility enum values for validation
const COMMENT_VISIBILITY_OPTIONS = ['public', 'private'] as const;

/**
 * Schema for creating a new comment
 */
export const createCommentSchema = z.object({
  targetType: z.enum(COMMENT_TARGET_TYPES, 'Invalid target type. Must be one of: post, resource, note, outcome, review, circle, idea, portfolio')
    .describe("留言目標類型")
    .meta({
      title: "目標類型",
      examples: ["post", "resource", "note", "outcome"],
      enumDescriptions: {
        "post": "記事",
        "resource": "資源", 
        "note": "筆記",
        "outcome": "成果",
        "review": "評論",
        "circle": "圈子",
        "idea": "想法",
        "portfolio": "作品集"
      }
    }),
  targetId: z.string().trim().min(1, 'Target ID cannot be empty')
    .describe("目標對象的唯一識別碼")
    .meta({
      title: "目標ID",
      examples: ["123e4567-e89b-12d3-a456-426614174000", "post_12345", "resource_67890"]
    }),
  content: z.string().trim().min(1, 'Comment content cannot be empty').max(5000, 'Comment content cannot exceed 5000 characters')
    .describe("留言內容")
    .meta({
      title: "留言內容",
      examples: ["這個資源非常有用，謝謝分享！", "我也遇到了相同的問題，已經解決了", "很棒的分享，期待更多內容"]
    }),
  visibility: z.enum(COMMENT_VISIBILITY_OPTIONS, 'Visibility must be either public or private').optional().default('private')
    .describe("留言可見性")
    .meta({
      title: "可見性",
      examples: ["public", "private"],
      enumDescriptions: {
        "public": "公開",
        "private": "私人"
      }
    }),
  parentId: z.coerce.number({
    message: 'Parent ID must be a number'
  }).int('Parent ID must be an integer').positive('Parent ID must be positive').optional()
    .describe("父留言ID（用於回覆）")
    .meta({
      title: "父留言ID",
      examples: [1, 25, 100]
    })
}).describe("創建留言的請求資料").meta({
  title: "創建留言",
  examples: [{
    targetType: "resource",
    targetId: "123e4567-e89b-12d3-a456-426614174000",
    content: "這個資源非常有用，謝謝分享！",
    visibility: "public"
  }]
});

/**
 * Schema for updating an existing comment
 */
export const updateCommentSchema = z.object({
  content: z.string().trim().min(1, 'Comment content cannot be empty').max(5000, 'Comment content cannot exceed 5000 characters').optional()
    .describe("更新後的留言內容")
    .meta({
      title: "留言內容",
      examples: ["更新後的內容，增加了更多細節", "修正了一些錯誤資訊"]
    }),
  visibility: z.enum(COMMENT_VISIBILITY_OPTIONS, 'Visibility must be either public or private').optional()
    .describe("更新後的可見性")
    .meta({
      title: "可見性",
      examples: ["public", "private"],
      enumDescriptions: {
        "public": "公開",
        "private": "私人"
      }
    })
}).describe("更新留言的請求資料").meta({
  title: "更新留言",
  examples: [{
    content: "更新後的留言內容",
    visibility: "public"
  }]
}).refine(data => data.content !== undefined || data.visibility !== undefined, {
  message: 'At least one field (content or visibility) must be provided for update'
});

/**
 * Schema for comment query parameters (getting comments for a target)
 */
export const getCommentsQuerySchema = z.object({
  targetType: z.enum(COMMENT_TARGET_TYPES, 'Invalid target type. Must be one of: post, resource, note, outcome, review, circle, idea, portfolio')
    .describe("查詢的目標類型")
    .meta({
      title: "目標類型",
      examples: ["post", "resource", "note"],
      enumDescriptions: {
        "post": "記事",
        "resource": "資源",
        "note": "筆記",
        "outcome": "成果",
        "review": "評論",
        "circle": "圈子",
        "idea": "想法",
        "portfolio": "作品集"
      }
    }),
  targetId: z.string().trim().min(1, 'Target ID cannot be empty')
    .describe("目標對象ID")
    .meta({
      title: "目標ID",
      examples: ["123e4567-e89b-12d3-a456-426614174000", "post_12345"]
    })
}).describe("查詢留言的參數").meta({
  title: "查詢留言參數",
  examples: [{
    targetType: "resource",
    targetId: "123e4567-e89b-12d3-a456-426614174000"
  }]
});

/**
 * Schema for comment URL parameters (comment ID)
 */
export const commentParamsSchema = z.object({
  commentId: z.coerce.number({
    message: 'Comment ID must be a number'
  }).int('Comment ID must be an integer').positive('Comment ID must be positive')
    .describe("留言唯一識別碼")
    .meta({
      title: "留言ID",
      examples: [1, 25, 100, 500]
    })
}).describe("留言路徑參數").meta({
  title: "留言參數",
  examples: [{
    commentId: 123
  }]
});

/**
 * Schema for bulk comment operations (future use)
 */
export const bulkCommentOperationSchema = z.object({
  commentIds: z.array(z.coerce.number().int().positive()).min(1, 'At least one comment ID is required').max(100, 'Cannot operate on more than 100 comments at once')
    .describe("要操作的留言ID清單")
    .meta({
      title: "留言ID清單",
      examples: [[1, 2, 3], [10, 25], [100]]
    }),
  operation: z.enum(['delete', 'update_visibility'], 'Operation must be either delete or update_visibility')
    .describe("批量操作類型")
    .meta({
      title: "操作類型",
      examples: ['delete', 'update_visibility'],
      enumDescriptions: {
        "delete": "刪除留言",
        "update_visibility": "更新可見性"
      }
    }),
  visibility: z.enum(COMMENT_VISIBILITY_OPTIONS).optional()
    .describe("新的可見性設定（僅用於 update_visibility 操作）")
    .meta({
      title: "可見性",
      examples: ["public", "private"],
      enumDescriptions: {
        "public": "公開",
        "private": "私人"
      }
    })
}).describe("批量留言操作的請求資料").meta({
  title: "批量留言操作",
  examples: [{
    commentIds: [1, 2, 3],
    operation: "delete"
  }, {
    commentIds: [10, 25],
    operation: "update_visibility",
    visibility: "private"
  }]
}).refine(data => {
  if (data.operation === 'update_visibility' && !data.visibility) {
    return false;
  }
  return true;
}, {
  message: 'Visibility is required when operation is update_visibility',
  path: ['visibility']
});

/**
 * Schema for comment search/filter parameters
 */
export const commentFilterSchema = z.object({
  targetType: z.enum(COMMENT_TARGET_TYPES).optional()
    .describe("過濾目標類型")
    .meta({
      title: "目標類型過濾",
      examples: ["post", "resource", "note"],
      enumDescriptions: {
        "post": "記事",
        "resource": "資源",
        "note": "筆記",
        "outcome": "成果",
        "review": "評論",
        "circle": "圈子",
        "idea": "想法",
        "portfolio": "作品集"
      }
    }),
  targetId: z.string().trim().min(1).optional()
    .describe("過濾目標對象ID")
    .meta({
      title: "目標ID過濾",
      examples: ["123e4567-e89b-12d3-a456-426614174000", "post_12345"]
    }),
  userId: z.coerce.number().int().positive().optional()
    .describe("過濾用戶ID")
    .meta({
      title: "用戶ID過濾",
      examples: [1, 25, 100]
    }),
  visibility: z.enum(COMMENT_VISIBILITY_OPTIONS).optional()
    .describe("過濾可見性")
    .meta({
      title: "可見性過濾",
      examples: ["public", "private"],
      enumDescriptions: {
        "public": "公開",
        "private": "私人"
      }
    }),
  hasReplies: z.coerce.boolean().optional()
    .describe("是否有回復")
    .meta({
      title: "有回復過濾",
      examples: [true, false]
    }),
  createdAfter: z.string().datetime('Invalid datetime format').optional()
    .describe("創建時間晚於")
    .meta({
      title: "創建時間起始",
      examples: ["2024-01-01T00:00:00.000Z", "2024-03-15T10:30:00.000Z"]
    }),
  createdBefore: z.string().datetime('Invalid datetime format').optional()
    .describe("創建時間早於")
    .meta({
      title: "創建時間結束",
      examples: ["2024-12-31T23:59:59.000Z", "2024-06-30T18:00:00.000Z"]
    }),
  content: z.string().min(1).max(100, 'Search content cannot exceed 100 characters').optional()
    .describe("搜索留言內容")
    .meta({
      title: "內容搜索",
      examples: ["很棒", "推薦", "有用"]
    })
}).describe("留言過濾參數").meta({
  title: "留言過濾",
  examples: [{
    targetType: "resource",
    visibility: "public",
    hasReplies: true,
    content: "推薦"
  }]
});

/**
 * Schema for comment pagination parameters
 */
export const commentPaginationSchema = z.object({
  cursor: z.coerce.number().int().positive().optional()
    .describe("游標，用於分頁")
    .meta({
      title: "游標",
      examples: [1, 10, 25]
    }),
  limit: z.coerce.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').optional().default(20)
    .describe("每頁項目數")
    .meta({
      title: "每頁數量",
      examples: [10, 20, 50, 100]
    }),
  sort: z.enum(['created_at', 'updated_at'], 'Sort field must be either created_at or updated_at').optional().default('created_at')
    .describe("排序欄位")
    .meta({
      title: "排序欄位",
      examples: ['created_at', 'updated_at'],
      enumDescriptions: {
        "created_at": "建立時間",
        "updated_at": "更新時間"
      }
    }),
  order: z.enum(['asc', 'desc'], 'Order must be either asc or desc').optional().default('desc')
    .describe("排序方向")
    .meta({
      title: "排序方向",
      examples: ['asc', 'desc'],
      enumDescriptions: {
        "asc": "升序",
        "desc": "降序"
      }
    })
}).describe("留言分頁參數").meta({
  title: "分頁參數",
  examples: [{
    cursor: 10,
    limit: 20,
    sort: "created_at",
    order: "desc"
  }]
});

// Type inference from schemas
export type CreateCommentSchema = z.infer<typeof createCommentSchema>;
export type UpdateCommentSchema = z.infer<typeof updateCommentSchema>;
export type GetCommentsQuerySchema = z.infer<typeof getCommentsQuerySchema>;
export type CommentParamsSchema = z.infer<typeof commentParamsSchema>;
export type BulkCommentOperationSchema = z.infer<typeof bulkCommentOperationSchema>;
export type CommentFilterSchema = z.infer<typeof commentFilterSchema>;
export type CommentPaginationSchema = z.infer<typeof commentPaginationSchema>;

// Validation functions for direct use
export const validateCreateComment = (data: unknown): CreateCommentSchema => createCommentSchema.parse(data);
export const validateUpdateComment = (data: unknown): UpdateCommentSchema => updateCommentSchema.parse(data);
export const validateGetCommentsQuery = (data: unknown): GetCommentsQuerySchema => getCommentsQuerySchema.parse(data);
export const validateCommentParams = (data: unknown): CommentParamsSchema => commentParamsSchema.parse(data);
export const validateBulkCommentOperation = (data: unknown): BulkCommentOperationSchema => bulkCommentOperationSchema.parse(data);
export const validateCommentFilter = (data: unknown): CommentFilterSchema => commentFilterSchema.parse(data);
export const validateCommentPagination = (data: unknown): CommentPaginationSchema => commentPaginationSchema.parse(data);

// Unified export object following codebase patterns
export const commentValidators = {
  createCommentSchema,
  updateCommentSchema,
  getCommentsQuerySchema,
  commentParamsSchema,
  bulkCommentOperationSchema,
  commentFilterSchema,
  commentPaginationSchema
};

export default commentValidators;