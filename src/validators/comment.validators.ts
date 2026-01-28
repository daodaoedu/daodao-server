/**
 * Comment validation schemas
 * Using Zod for comprehensive input validation with proper error messages
 * Migrated to use @asteasolutions/zod-to-openapi
 *
 * 🔄 遷移完成：
 * 1. ✅ 使用 .openapi() 替代 .meta()
 * 2. ✅ 移除 z.enum() 的錯誤訊息參數（應在驗證時處理）
 * 3. ✅ 使用 registry.register() 註冊可重用組件
 * 4. ✅ 提供完整的 OpenAPI metadata（example, examples, format, description）
 */

import { z } from 'zod';
import { registry } from '../config/openapi-registry';
import {
  apiSuccessResponseSchema
} from './api-response.validators';

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
  targetType: z.enum(COMMENT_TARGET_TYPES).openapi({
    description: "留言目標類型",
    example: "resource",
    examples: ["post", "resource", "note", "outcome"]
  }),
  targetId: z.string().trim().min(1, 'Target ID cannot be empty').openapi({
    description: "目標對象的唯一識別碼",
    example: "123e4567-e89b-12d3-a456-426614174000",
    examples: ["123e4567-e89b-12d3-a456-426614174000", "post_12345", "resource_67890"]
  }),
  content: z.string().trim().min(1, 'Comment content cannot be empty').max(5000, 'Comment content cannot exceed 5000 characters').openapi({
    description: "留言內容",
    example: "這個資源非常有用，謝謝分享！",
    examples: ["這個資源非常有用，謝謝分享！", "我也遇到了相同的問題，已經解決了", "很棒的分享，期待更多內容"],
    minLength: 1,
    maxLength: 5000
  }),
  visibility: z.enum(COMMENT_VISIBILITY_OPTIONS).optional().default('private').openapi({
    description: "留言可見性 (public: 公開, private: 私人)",
    example: "public",
    examples: ["public", "private"]
  }),
  parentId: z.coerce.number().int().positive().optional().openapi({
    description: "父留言ID（用於回覆）",
    example: 1,
    examples: [1, 25, 100]
  })
}).openapi('CreateCommentRequest', {
  description: "創建留言的請求資料"
});

/**
 * Schema for updating an existing comment
 */
export const updateCommentSchema = z.object({
  content: z.string().trim().min(1, 'Comment content cannot be empty').max(5000, 'Comment content cannot exceed 5000 characters').optional().openapi({
    description: "更新後的留言內容",
    example: "更新後的內容，增加了更多細節",
    examples: ["更新後的內容，增加了更多細節", "修正了一些錯誤資訊"],
    minLength: 1,
    maxLength: 5000
  }),
  visibility: z.enum(COMMENT_VISIBILITY_OPTIONS).optional().openapi({
    description: "更新後的可見性 (public: 公開, private: 私人)",
    example: "public",
    examples: ["public", "private"]
  })
}).openapi('UpdateCommentRequest', {
  description: "更新留言的請求資料"
}).refine(data => data.content !== undefined || data.visibility !== undefined, {
  message: 'At least one field (content or visibility) must be provided for update'
});

/**
 * Schema for comment query parameters (getting comments for a target)
 */
export const getCommentsQuerySchema = z.object({
  targetType: z.enum(COMMENT_TARGET_TYPES).openapi({
    description: "查詢的目標類型",
    example: "resource",
    examples: ["post", "resource", "note"]
  }),
  targetId: z.string().trim().min(1, 'Target ID cannot be empty').openapi({
    description: "目標對象ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
    examples: ["123e4567-e89b-12d3-a456-426614174000", "post_12345"]
  })
}).openapi('GetCommentsQuery', {
  description: "查詢留言的參數"
});

/**
 * Schema for comment URL parameters (comment ID)
 */
export const commentParamsSchema = z.object({
  commentId: z.coerce.number().int().positive().openapi({
    description: "留言唯一識別碼",
    example: 123,
    examples: [1, 25, 100, 500]
  })
}).openapi('CommentParams', {
  description: "留言路徑參數"
});

/**
 * Schema for bulk comment operations (future use)
 */
export const bulkCommentOperationSchema = z.object({
  commentIds: z.array(z.coerce.number().int().positive()).min(1, 'At least one comment ID is required').max(100, 'Cannot operate on more than 100 comments at once').openapi({
    description: "要操作的留言ID清單",
    example: [1, 2, 3],
    examples: [[1, 2, 3], [10, 25], [100]]
  }),
  operation: z.enum(['delete', 'update_visibility']).openapi({
    description: "批量操作類型 (delete: 刪除留言, update_visibility: 更新可見性)",
    example: "delete",
    examples: ['delete', 'update_visibility']
  }),
  visibility: z.enum(COMMENT_VISIBILITY_OPTIONS).optional().openapi({
    description: "新的可見性設定（僅用於 update_visibility 操作）(public: 公開, private: 私人)",
    example: "private",
    examples: ["public", "private"]
  })
}).openapi('BulkCommentOperation', {
  description: "批量留言操作的請求資料"
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
  targetType: z.enum(COMMENT_TARGET_TYPES).optional().openapi({
    description: "過濾目標類型",
    example: "resource",
    examples: ["post", "resource", "note"]
  }),
  targetId: z.string().trim().min(1).optional().openapi({
    description: "過濾目標對象ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
    examples: ["123e4567-e89b-12d3-a456-426614174000", "post_12345"]
  }),
  userId: z.coerce.number().int().positive().optional().openapi({
    description: "過濾用戶ID",
    example: 1,
    examples: [1, 25, 100]
  }),
  visibility: z.enum(COMMENT_VISIBILITY_OPTIONS).optional().openapi({
    description: "過濾可見性 (public: 公開, private: 私人)",
    example: "public",
    examples: ["public", "private"]
  }),
  hasReplies: z.coerce.boolean().optional().openapi({
    description: "是否有回復",
    example: true,
    examples: [true, false]
  }),
  createdAfter: z.string().datetime().optional().openapi({
    description: "創建時間晚於",
    example: "2024-01-01T00:00:00.000Z",
    examples: ["2024-01-01T00:00:00.000Z", "2024-03-15T10:30:00.000Z"],
    format: 'date-time'
  }),
  createdBefore: z.string().datetime().optional().openapi({
    description: "創建時間早於",
    example: "2024-12-31T23:59:59.000Z",
    examples: ["2024-12-31T23:59:59.000Z", "2024-06-30T18:00:00.000Z"],
    format: 'date-time'
  }),
  content: z.string().min(1).max(100, 'Search content cannot exceed 100 characters').optional().openapi({
    description: "搜索留言內容",
    example: "推薦",
    examples: ["很棒", "推薦", "有用"],
    minLength: 1,
    maxLength: 100
  })
}).openapi('CommentFilter', {
  description: "留言過濾參數"
});

/**
 * Schema for comment pagination parameters
 */
export const commentPaginationSchema = z.object({
  cursor: z.coerce.number().int().positive().optional().openapi({
    description: "游標，用於分頁",
    example: 10,
    examples: [1, 10, 25]
  }),
  limit: z.coerce.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').optional().default(20).openapi({
    description: "每頁項目數",
    example: 20,
    examples: [10, 20, 50, 100],
    minimum: 1,
    maximum: 100
  }),
  sort: z.enum(['created_at', 'updated_at']).optional().default('created_at').openapi({
    description: "排序欄位 (created_at: 建立時間, updated_at: 更新時間)",
    example: "created_at",
    examples: ['created_at', 'updated_at']
  }),
  order: z.enum(['asc', 'desc']).optional().default('desc').openapi({
    description: "排序方向 (asc: 升序, desc: 降序)",
    example: "desc",
    examples: ['asc', 'desc']
  })
}).openapi('CommentPagination', {
  description: "留言分頁參數"
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

// ===== RESPONSE VALIDATION SCHEMAS =====
// Based on comment.service.ts return types and comment.types.ts interfaces

// Comment user schema (nested in comment responses)
export const commentUserSchema = z.object({
  id: z.string().openapi({
    description: "用戶外部 ID",
    example: "user_123e4567"
  }),
  name: z.string().openapi({
    description: "用戶名稱",
    example: "王小明"
  }),
  roleList: z.array(z.string()).openapi({
    description: "用戶角色列表",
    example: ["USER", "EDUCATOR"]
  }),
  photoURL: z.string().url().nullable().openapi({
    description: "用戶頭像 URL",
    example: "https://example.com/avatar.jpg",
    format: 'uri'
  })
}).openapi('CommentUser', {
  description: '留言用戶資訊'
});

// Base comment schema (without recursive replies - used for OpenAPI)
const baseCommentSchema = z.object({
  id: z.number().openapi({
    description: "留言 ID",
    example: 123
  }),
  userId: z.number().openapi({
    description: "用戶 ID",
    example: 1
  }),
  targetId: z.string().openapi({
    description: "目標對象外部 ID",
    example: "123e4567-e89b-12d3-a456-426614174000"
  }),
  targetType: z.enum(COMMENT_TARGET_TYPES).openapi({
    description: "目標對象類型",
    example: "resource"
  }),
  content: z.string().openapi({
    description: "留言內容",
    example: "這個資源非常有用，謝謝分享！"
  }),
  visibility: z.enum(COMMENT_VISIBILITY_OPTIONS).openapi({
    description: "可見性",
    example: "public"
  }),
  createdAt: z.date().openapi({
    description: "創建時間",
    example: "2024-01-15T10:30:00.000Z",
    type: 'string',
    format: 'date-time'
  }),
  updatedAt: z.date().openapi({
    description: "更新時間",
    example: "2024-01-15T10:30:00.000Z",
    type: 'string',
    format: 'date-time'
  }),
  parent_id: z.number().nullable().openapi({
    description: "父留言 ID",
    example: null
  }),
  user: commentUserSchema.openapi({
    description: "用戶資訊"
  })
}).openapi('CommentBase', {
  description: '留言基本資料'
});

// Comment response schema for OpenAPI (non-recursive, indicates replies as array)
export const commentResponseSchemaForOpenAPI = baseCommentSchema.extend({
  replies: z.array(z.any()).openapi({
    description: "回覆列表（遞迴結構，子留言與父留言格式相同）",
    type: 'array',
    items: { type: 'object' }
  })
}).openapi('Comment', {
  description: '留言資料（包含回覆）'
});

// Comment response schema (recursive for runtime validation)
export const commentResponseSchema: z.ZodType<unknown> = z.lazy(() => baseCommentSchema.extend({
  replies: z.array(commentResponseSchema).openapi({
    description: "回覆列表"
  })
}));

// Delete comment response schema
export const deleteCommentResponseSchema = z.object({
  message: z.string().openapi({
    description: "刪除成功訊息",
    example: "留言已成功刪除"
  })
}).openapi('DeleteCommentResponse', {
  description: '刪除留言回應'
});

// API Response schemas based on comment service return types
// Use non-recursive schema for OpenAPI documentation to avoid stack overflow
export const createCommentApiResponseSchema = apiSuccessResponseSchema(commentResponseSchemaForOpenAPI);
export const getCommentsApiResponseSchema = apiSuccessResponseSchema(z.array(commentResponseSchemaForOpenAPI));
export const getCommentDetailApiResponseSchema = apiSuccessResponseSchema(commentResponseSchemaForOpenAPI);
export const updateCommentApiResponseSchema = apiSuccessResponseSchema(commentResponseSchemaForOpenAPI);
export const deleteCommentApiResponseSchema = apiSuccessResponseSchema(deleteCommentResponseSchema);

// Response type exports
export type CommentUser = z.infer<typeof commentUserSchema>;
export type CommentResponseType = z.infer<typeof commentResponseSchema>;
export type DeleteCommentResponse = z.infer<typeof deleteCommentResponseSchema>;

// ===== REGISTER SCHEMAS WITH OPENAPI REGISTRY =====
// Register reusable component schemas
registry.register('CommentUser', commentUserSchema);
registry.register('CommentBase', baseCommentSchema);
registry.register('Comment', commentResponseSchemaForOpenAPI);
registry.register('CreateCommentRequest', createCommentSchema);
registry.register('UpdateCommentRequest', updateCommentSchema);
registry.register('DeleteCommentResponse', deleteCommentResponseSchema);