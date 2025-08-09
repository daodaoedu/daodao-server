/**
 * Comment validation schemas unit tests
 * Testing Zod validation schemas for comprehensive input validation
 */

import {
  createCommentSchema,
  updateCommentSchema,
  getCommentsQuerySchema,
  commentParamsSchema,
  bulkCommentOperationSchema,
  commentFilterSchema,
  commentPaginationSchema,
  validateCreateComment,
  validateUpdateComment,
  validateGetCommentsQuery,
  validateCommentParams,
  validateBulkCommentOperation,
  validateCommentFilter,
  validateCommentPagination
} from '@/validators/comment.validators';

describe('Comment Validators Tests', () => {
  describe('createCommentSchema', () => {
    describe('valid inputs', () => {
      it('should validate a basic comment creation', () => {
        const validComment = {
          targetType: 'post',
          targetId: '123',
          content: 'This is a valid comment'
        };

        const result = createCommentSchema.safeParse(validComment);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.visibility).toBe('private'); // default value
        }
      });

      it('should validate comment with all optional fields', () => {
        const validComment = {
          targetType: 'resource',
          targetId: '456',
          content: 'This is a comment with all fields',
          visibility: 'public',
          parentId: 789
        };

        const result = createCommentSchema.safeParse(validComment);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual(validComment);
        }
      });

      it('should validate all target types', () => {
        const targetTypes = ['post', 'resource', 'note', 'outcome', 'review', 'circle', 'idea', 'portfolio'];
        
        targetTypes.forEach(targetType => {
          const validComment = {
            targetType,
            targetId: '123',
            content: 'Valid comment'
          };

          const result = createCommentSchema.safeParse(validComment);
          expect(result.success).toBe(true);
        });
      });

      it('should validate both visibility options', () => {
        const visibilityOptions = ['public', 'private'];
        
        visibilityOptions.forEach(visibility => {
          const validComment = {
            targetType: 'post',
            targetId: '123',
            content: 'Valid comment',
            visibility
          };

          const result = createCommentSchema.safeParse(validComment);
          expect(result.success).toBe(true);
        });
      });

      it('should coerce string numbers to integers', () => {
        const validComment = {
          targetType: 'post',
          targetId: '123',
          content: 'Valid comment',
          parentId: '456'
        };

        const result = createCommentSchema.safeParse(validComment);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.targetId).toBe('123'); // targetId remains string
          expect(result.data.parentId).toBe(456); // parentId is coerced to number
        }
      });

      it('should trim whitespace from content', () => {
        const validComment = {
          targetType: 'post',
          targetId: '123',
          content: '  This content has whitespace  '
        };

        const result = createCommentSchema.safeParse(validComment);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.content).toBe('This content has whitespace');
        }
      });

      it('should validate maximum content length', () => {
        const validComment = {
          targetType: 'post',
          targetId: '123',
          content: 'a'.repeat(5000) // exactly 5000 characters
        };

        const result = createCommentSchema.safeParse(validComment);
        expect(result.success).toBe(true);
      });
    });

    describe('invalid inputs', () => {
      it('should reject invalid target type', () => {
        const invalidComment = {
          targetType: 'invalid_type',
          targetId: '123',
          content: 'Valid content'
        };

        const result = createCommentSchema.safeParse(invalidComment);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('targetType');
          expect(result.error.issues[0].message).toContain('Invalid target type');
        }
      });

      it('should reject missing required fields', () => {
        const incompleteComment = {
          targetType: 'post'
          // missing targetId and content
        };

        const result = createCommentSchema.safeParse(incompleteComment);
        expect(result.success).toBe(false);
        if (!result.success) {
          const paths = result.error.issues.map(issue => issue.path[0]);
          expect(paths).toContain('targetId');
          expect(paths).toContain('content');
        }
      });

      it('should reject empty content', () => {
        const invalidComment = {
          targetType: 'post',
          targetId: '123',
          content: ''
        };

        const result = createCommentSchema.safeParse(invalidComment);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('content');
          expect(result.error.issues[0].message).toContain('cannot be empty');
        }
      });

      it('should reject content that is too long', () => {
        const invalidComment = {
          targetType: 'post',
          targetId: '123',
          content: 'a'.repeat(5001) // exceeds 5000 character limit
        };

        const result = createCommentSchema.safeParse(invalidComment);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('content');
          expect(result.error.issues[0].message).toContain('cannot exceed 5000 characters');
        }
      });

      it('should reject invalid targetId values', () => {
        const invalidTargetIds = ['', '   ', null, undefined]; // targetId as string, so only empty strings, null, undefined are invalid
        
        invalidTargetIds.forEach(targetId => {
          const invalidComment = {
            targetType: 'post',
            targetId,
            content: 'Valid content'
          };

          const result = createCommentSchema.safeParse(invalidComment);
          expect(result.success).toBe(false);
        });
      });

      it('should reject invalid parentId values', () => {
        const invalidParentIds = [0, -1, 'not-a-number'];
        
        invalidParentIds.forEach(parentId => {
          const invalidComment = {
            targetType: 'post',
            targetId: '123',
            content: 'Valid content',
            parentId
          };

          const result = createCommentSchema.safeParse(invalidComment);
          expect(result.success).toBe(false);
        });
      });

      it('should reject invalid visibility values', () => {
        const invalidComment = {
          targetType: 'post',
          targetId: '123',
          content: 'Valid content',
          visibility: 'invalid_visibility'
        };

        const result = createCommentSchema.safeParse(invalidComment);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('visibility');
          expect(result.error.issues[0].message).toContain('must be either public or private');
        }
      });

      it('should trim and reject whitespace-only content', () => {
        const invalidComment = {
          targetType: 'post',
          targetId: '123',
          content: '   \n\t   ' // only whitespace
        };

        const result = createCommentSchema.safeParse(invalidComment);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('content');
          expect(result.error.issues[0].message).toContain('cannot be empty');
        }
      });
    });
  });

  describe('updateCommentSchema', () => {
    describe('valid inputs', () => {
      it('should validate content-only update', () => {
        const validUpdate = {
          content: 'Updated comment content'
        };

        const result = updateCommentSchema.safeParse(validUpdate);
        expect(result.success).toBe(true);
      });

      it('should validate visibility-only update', () => {
        const validUpdate = {
          visibility: 'public'
        };

        const result = updateCommentSchema.safeParse(validUpdate);
        expect(result.success).toBe(true);
      });

      it('should validate both content and visibility update', () => {
        const validUpdate = {
          content: 'Updated content',
          visibility: 'private'
        };

        const result = updateCommentSchema.safeParse(validUpdate);
        expect(result.success).toBe(true);
      });

      it('should trim whitespace from content', () => {
        const validUpdate = {
          content: '  Updated content with whitespace  '
        };

        const result = updateCommentSchema.safeParse(validUpdate);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.content).toBe('Updated content with whitespace');
        }
      });
    });

    describe('invalid inputs', () => {
      it('should reject empty object (no fields provided)', () => {
        const invalidUpdate = {};

        const result = updateCommentSchema.safeParse(invalidUpdate);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('At least one field');
        }
      });

      it('should reject empty content', () => {
        const invalidUpdate = {
          content: ''
        };

        const result = updateCommentSchema.safeParse(invalidUpdate);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('content');
          expect(result.error.issues[0].message).toContain('cannot be empty');
        }
      });

      it('should reject content that is too long', () => {
        const invalidUpdate = {
          content: 'a'.repeat(5001)
        };

        const result = updateCommentSchema.safeParse(invalidUpdate);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('content');
          expect(result.error.issues[0].message).toContain('cannot exceed 5000 characters');
        }
      });

      it('should reject invalid visibility values', () => {
        const invalidUpdate = {
          visibility: 'invalid_visibility'
        };

        const result = updateCommentSchema.safeParse(invalidUpdate);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('visibility');
          expect(result.error.issues[0].message).toContain('must be either public or private');
        }
      });

      it('should trim and reject whitespace-only content', () => {
        const invalidUpdate = {
          content: '   \n\t   '
        };

        const result = updateCommentSchema.safeParse(invalidUpdate);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('content');
          expect(result.error.issues[0].message).toContain('cannot be empty');
        }
      });
    });
  });

  describe('getCommentsQuerySchema', () => {
    describe('valid inputs', () => {
      it('should validate basic query parameters', () => {
        const validQuery = {
          targetType: 'post',
          targetId: '123'
        };

        const result = getCommentsQuerySchema.safeParse(validQuery);
        expect(result.success).toBe(true);
      });

      it('should coerce string numbers to integers', () => {
        const validQuery = {
          targetType: 'resource',
          targetId: '456'
        };

        const result = getCommentsQuerySchema.safeParse(validQuery);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.targetId).toBe('456'); // targetId remains string
        }
      });

      it('should validate all target types', () => {
        const targetTypes = ['post', 'resource', 'note', 'outcome', 'review', 'circle', 'idea', 'portfolio'];
        
        targetTypes.forEach(targetType => {
          const validQuery = {
            targetType,
            targetId: '123'
          };

          const result = getCommentsQuerySchema.safeParse(validQuery);
          expect(result.success).toBe(true);
        });
      });
    });

    describe('invalid inputs', () => {
      it('should reject missing required fields', () => {
        const incompleteQuery = {
          targetType: 'post'
          // missing targetId
        };

        const result = getCommentsQuerySchema.safeParse(incompleteQuery);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('targetId');
        }
      });

      it('should reject invalid target type', () => {
        const invalidQuery = {
          targetType: 'invalid_type',
          targetId: '123'
        };

        const result = getCommentsQuerySchema.safeParse(invalidQuery);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('targetType');
          expect(result.error.issues[0].message).toContain('Invalid target type');
        }
      });

      it('should reject invalid targetId values', () => {
        const invalidTargetIds = ['', '   ', null, undefined]; // targetId as string, so only empty strings, null, undefined are invalid
        
        invalidTargetIds.forEach(targetId => {
          const invalidQuery = {
            targetType: 'post',
            targetId
          };

          const result = getCommentsQuerySchema.safeParse(invalidQuery);
          expect(result.success).toBe(false);
        });
      });
    });
  });

  describe('commentParamsSchema', () => {
    describe('valid inputs', () => {
      it('should validate positive integer comment ID', () => {
        const validParams = {
          commentId: 123
        };

        const result = commentParamsSchema.safeParse(validParams);
        expect(result.success).toBe(true);
      });

      it('should coerce string numbers to integers', () => {
        const validParams = {
          commentId: '456'
        };

        const result = commentParamsSchema.safeParse(validParams);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.commentId).toBe(456);
        }
      });
    });

    describe('invalid inputs', () => {
      it('should reject invalid commentId values', () => {
        const invalidCommentIds = [0, -1, 'not-a-number', null, undefined];
        
        invalidCommentIds.forEach(commentId => {
          const invalidParams = { commentId };

          const result = commentParamsSchema.safeParse(invalidParams);
          expect(result.success).toBe(false);
        });
      });

      it('should reject missing commentId', () => {
        const invalidParams = {};

        const result = commentParamsSchema.safeParse(invalidParams);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('commentId');
        }
      });
    });
  });

  describe('bulkCommentOperationSchema', () => {
    describe('valid inputs', () => {
      it('should validate delete operation', () => {
        const validOperation = {
          commentIds: [1, 2, 3],
          operation: 'delete'
        };

        const result = bulkCommentOperationSchema.safeParse(validOperation);
        expect(result.success).toBe(true);
      });

      it('should validate update_visibility operation with visibility', () => {
        const validOperation = {
          commentIds: [1, 2, 3],
          operation: 'update_visibility',
          visibility: 'public'
        };

        const result = bulkCommentOperationSchema.safeParse(validOperation);
        expect(result.success).toBe(true);
      });

      it('should coerce string numbers in commentIds array', () => {
        const validOperation = {
          commentIds: ['1', '2', '3'],
          operation: 'delete'
        };

        const result = bulkCommentOperationSchema.safeParse(validOperation);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.commentIds).toEqual([1, 2, 3]);
        }
      });

      it('should validate maximum array length', () => {
        const validOperation = {
          commentIds: Array.from({ length: 100 }, (_, i) => i + 1),
          operation: 'delete'
        };

        const result = bulkCommentOperationSchema.safeParse(validOperation);
        expect(result.success).toBe(true);
      });
    });

    describe('invalid inputs', () => {
      it('should reject empty commentIds array', () => {
        const invalidOperation = {
          commentIds: [],
          operation: 'delete'
        };

        const result = bulkCommentOperationSchema.safeParse(invalidOperation);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('commentIds');
          expect(result.error.issues[0].message).toContain('At least one comment ID is required');
        }
      });

      it('should reject commentIds array that is too large', () => {
        const invalidOperation = {
          commentIds: Array.from({ length: 101 }, (_, i) => i + 1),
          operation: 'delete'
        };

        const result = bulkCommentOperationSchema.safeParse(invalidOperation);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('commentIds');
          expect(result.error.issues[0].message).toContain('Cannot operate on more than 100 comments');
        }
      });

      it('should reject invalid operation type', () => {
        const invalidOperation = {
          commentIds: [1, 2, 3],
          operation: 'invalid_operation'
        };

        const result = bulkCommentOperationSchema.safeParse(invalidOperation);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('operation');
          expect(result.error.issues[0].message).toContain('must be either delete or update_visibility');
        }
      });

      it('should reject update_visibility operation without visibility', () => {
        const invalidOperation = {
          commentIds: [1, 2, 3],
          operation: 'update_visibility'
          // missing visibility
        };

        const result = bulkCommentOperationSchema.safeParse(invalidOperation);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('visibility');
          expect(result.error.issues[0].message).toContain('Visibility is required when operation is update_visibility');
        }
      });

      it('should reject invalid commentId values in array', () => {
        const invalidOperation = {
          commentIds: [1, 0, -1, 'invalid'],
          operation: 'delete'
        };

        const result = bulkCommentOperationSchema.safeParse(invalidOperation);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('commentFilterSchema', () => {
    describe('valid inputs', () => {
      it('should validate empty filter (all optional)', () => {
        const validFilter = {};

        const result = commentFilterSchema.safeParse(validFilter);
        expect(result.success).toBe(true);
      });

      it('should validate filter with all fields', () => {
        const validFilter = {
          targetType: 'post',
          targetId: '123',
          userId: 456,
          visibility: 'public',
          hasReplies: true,
          createdAfter: '2024-01-01T00:00:00Z',
          createdBefore: '2024-12-31T23:59:59Z',
          content: 'search term'
        };

        const result = commentFilterSchema.safeParse(validFilter);
        expect(result.success).toBe(true);
      });

      it('should coerce boolean values', () => {
        const validFilter = {
          hasReplies: 'true'
        };

        const result = commentFilterSchema.safeParse(validFilter);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.hasReplies).toBe(true);
        }
      });
    });

    describe('invalid inputs', () => {
      it('should reject invalid datetime format', () => {
        const invalidFilter = {
          createdAfter: 'not-a-datetime'
        };

        const result = commentFilterSchema.safeParse(invalidFilter);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('createdAfter');
          expect(result.error.issues[0].message).toContain('Invalid datetime format');
        }
      });

      it('should reject content that is too long', () => {
        const invalidFilter = {
          content: 'a'.repeat(101)
        };

        const result = commentFilterSchema.safeParse(invalidFilter);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('content');
          expect(result.error.issues[0].message).toContain('cannot exceed 100 characters');
        }
      });

      it('should reject empty content string', () => {
        const invalidFilter = {
          content: ''
        };

        const result = commentFilterSchema.safeParse(invalidFilter);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('content');
        }
      });
    });
  });

  describe('commentPaginationSchema', () => {
    describe('valid inputs', () => {
      it('should validate with default values', () => {
        const validPagination = {};

        const result = commentPaginationSchema.safeParse(validPagination);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.limit).toBe(20);
          expect(result.data.sort).toBe('created_at');
          expect(result.data.order).toBe('desc');
        }
      });

      it('should validate with all custom values', () => {
        const validPagination = {
          cursor: 123,
          limit: 50,
          sort: 'updated_at',
          order: 'asc'
        };

        const result = commentPaginationSchema.safeParse(validPagination);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual(validPagination);
        }
      });

      it('should coerce string numbers', () => {
        const validPagination = {
          cursor: '123',
          limit: '25'
        };

        const result = commentPaginationSchema.safeParse(validPagination);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.cursor).toBe(123);
          expect(result.data.limit).toBe(25);
        }
      });
    });

    describe('invalid inputs', () => {
      it('should reject limit that is too small', () => {
        const invalidPagination = {
          limit: 0
        };

        const result = commentPaginationSchema.safeParse(invalidPagination);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('limit');
          expect(result.error.issues[0].message).toContain('must be at least 1');
        }
      });

      it('should reject limit that is too large', () => {
        const invalidPagination = {
          limit: 101
        };

        const result = commentPaginationSchema.safeParse(invalidPagination);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('limit');
          expect(result.error.issues[0].message).toContain('cannot exceed 100');
        }
      });

      it('should reject invalid sort field', () => {
        const invalidPagination = {
          sort: 'invalid_field'
        };

        const result = commentPaginationSchema.safeParse(invalidPagination);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('sort');
          expect(result.error.issues[0].message).toContain('must be either created_at or updated_at');
        }
      });

      it('should reject invalid order value', () => {
        const invalidPagination = {
          order: 'invalid_order'
        };

        const result = commentPaginationSchema.safeParse(invalidPagination);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('order');
          expect(result.error.issues[0].message).toContain('must be either asc or desc');
        }
      });

      it('should reject invalid cursor values', () => {
        const invalidCursors = [0, -1, 'not-a-number'];
        
        invalidCursors.forEach(cursor => {
          const invalidPagination = { cursor };

          const result = commentPaginationSchema.safeParse(invalidPagination);
          expect(result.success).toBe(false);
        });
      });
    });
  });

  describe('validation functions', () => {
    describe('validateCreateComment', () => {
      it('should return parsed data for valid input', () => {
        const validComment = {
          targetType: 'post',
          targetId: '123',
          content: 'Valid comment'
        };

        const result = validateCreateComment(validComment);
        expect(result).toEqual(expect.objectContaining(validComment));
        expect(result.visibility).toBe('private'); // default value
      });

      it('should throw error for invalid input', () => {
        const invalidComment = {
          targetType: 'invalid_type',
          targetId: '123',
          content: 'Valid content'
        };

        expect(() => validateCreateComment(invalidComment)).toThrow();
      });
    });

    describe('validateUpdateComment', () => {
      it('should return parsed data for valid input', () => {
        const validUpdate = {
          content: 'Updated content',
          visibility: 'public'
        };

        const result = validateUpdateComment(validUpdate);
        expect(result).toEqual(validUpdate);
      });

      it('should throw error for invalid input', () => {
        const invalidUpdate = {};

        expect(() => validateUpdateComment(invalidUpdate)).toThrow();
      });
    });

    describe('validateGetCommentsQuery', () => {
      it('should return parsed data for valid input', () => {
        const validQuery = {
          targetType: 'post',
          targetId: '123'
        };

        const result = validateGetCommentsQuery(validQuery);
        expect(result.targetType).toBe('post');
        expect(result.targetId).toBe('123'); // targetId remains string
      });

      it('should throw error for invalid input', () => {
        const invalidQuery = {
          targetType: 'invalid_type',
          targetId: '123'
        };

        expect(() => validateGetCommentsQuery(invalidQuery)).toThrow();
      });
    });

    describe('validateCommentParams', () => {
      it('should return parsed data for valid input', () => {
        const validParams = {
          commentId: '123'
        };

        const result = validateCommentParams(validParams);
        expect(result.commentId).toBe(123);
      });

      it('should throw error for invalid input', () => {
        const invalidParams = {
          commentId: 'not-a-number'
        };

        expect(() => validateCommentParams(invalidParams)).toThrow();
      });
    });

    describe('validateBulkCommentOperation', () => {
      it('should return parsed data for valid input', () => {
        const validOperation = {
          commentIds: ['1', '2', '3'],
          operation: 'delete'
        };

        const result = validateBulkCommentOperation(validOperation);
        expect(result.commentIds).toEqual([1, 2, 3]);
        expect(result.operation).toBe('delete');
      });

      it('should throw error for invalid input', () => {
        const invalidOperation = {
          commentIds: [],
          operation: 'delete'
        };

        expect(() => validateBulkCommentOperation(invalidOperation)).toThrow();
      });
    });

    describe('validateCommentFilter', () => {
      it('should return parsed data for valid input', () => {
        const validFilter = {
          targetType: 'post',
          hasReplies: 'true'
        };

        const result = validateCommentFilter(validFilter);
        expect(result.targetType).toBe('post');
        expect(result.hasReplies).toBe(true);
      });

      it('should throw error for invalid input', () => {
        const invalidFilter = {
          createdAfter: 'invalid-date'
        };

        expect(() => validateCommentFilter(invalidFilter)).toThrow();
      });
    });

    describe('validateCommentPagination', () => {
      it('should return parsed data with defaults for empty input', () => {
        const result = validateCommentPagination({});
        expect(result.limit).toBe(20);
        expect(result.sort).toBe('created_at');
        expect(result.order).toBe('desc');
      });

      it('should return parsed data for valid input', () => {
        const validPagination = {
          cursor: '123',
          limit: '50',
          sort: 'updated_at',
          order: 'asc'
        };

        const result = validateCommentPagination(validPagination);
        expect(result.cursor).toBe(123);
        expect(result.limit).toBe(50);
        expect(result.sort).toBe('updated_at');
        expect(result.order).toBe('asc');
      });

      it('should throw error for invalid input', () => {
        const invalidPagination = {
          limit: 0
        };

        expect(() => validateCommentPagination(invalidPagination)).toThrow();
      });
    });
  });

  describe('edge cases and boundary conditions', () => {
    it('should handle null and undefined values appropriately', () => {
      const testCases = [
        { schema: createCommentSchema, data: null },
        { schema: createCommentSchema, data: undefined },
        { schema: updateCommentSchema, data: null },
        { schema: getCommentsQuerySchema, data: undefined }
      ];

      testCases.forEach(({ schema, data }) => {
        const result = schema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    it('should handle arrays and objects in wrong places', () => {
      const invalidInputs = [
        { schema: createCommentSchema, data: [] },
        { schema: createCommentSchema, data: 'string' },
        { schema: updateCommentSchema, data: 123 },
        { schema: getCommentsQuerySchema, data: true }
      ];

      invalidInputs.forEach(({ schema, data }) => {
        const result = schema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    it('should handle very large numbers', () => {
      const largeNumber = (Number.MAX_SAFE_INTEGER + 1).toString();
      const validComment = {
        targetType: 'post',
        targetId: largeNumber, // targetId should be string
        content: 'Valid content'
      };

      const result = createCommentSchema.safeParse(validComment);
      // Should pass as targetId accepts any non-empty string
      expect(result.success).toBe(true);
    });

    it('should handle special characters in content', () => {
      const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?`~"\'\\';
      const validComment = {
        targetType: 'post',
        targetId: '123', // targetId should be string
        content: `Content with special chars: ${specialChars}`
      };

      const result = createCommentSchema.safeParse(validComment);
      expect(result.success).toBe(true);
    });

    it('should handle unicode characters in content', () => {
      const unicodeContent = '这是中文内容 🚀 émojis and ñoñó characters';
      const validComment = {
        targetType: 'post',
        targetId: '123', // targetId should be string
        content: unicodeContent
      };

      const result = createCommentSchema.safeParse(validComment);
      expect(result.success).toBe(true);
    });

    it('should handle floating point numbers for IDs', () => {
      const invalidComment = {
        targetType: 'post',
        targetId: 123.45, // passing number instead of string should fail
        content: 'Valid content'
      };

      const result = createCommentSchema.safeParse(invalidComment);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Expected string, received number');
      }
    });
  });

  describe('error message formatting', () => {
    it('should provide clear error messages for enum violations', () => {
      const invalidComment = {
        targetType: 'invalid_type',
        targetId: 123,
        content: 'Valid content'
      };

      const result = createCommentSchema.safeParse(invalidComment);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid target type');
        expect(result.error.issues[0].message).toContain('post, resource, note, outcome, review, circle, idea, portfolio');
      }
    });

    it('should provide clear error messages for required fields', () => {
      const incompleteComment = {};

      const result = createCommentSchema.safeParse(incompleteComment);
      expect(result.success).toBe(false);
      if (!result.success) {
        const contentError = result.error.issues.find(issue => issue.path.includes('content'));
        expect(contentError?.message).toContain('Comment content is required');
      }
    });

    it('should provide clear error messages for length violations', () => {
      const longContent = 'a'.repeat(5001);
      const invalidComment = {
        targetType: 'post',
        targetId: '123', // targetId should be string
        content: longContent
      };

      const result = createCommentSchema.safeParse(invalidComment);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('cannot exceed 5000 characters');
      }
    });

    it('should provide clear error messages for number validation', () => {
      const invalidComment = {
        targetType: 'post',
        targetId: 123, // passing number instead of string should fail
        content: 'Valid content'
      };

      const result = createCommentSchema.safeParse(invalidComment);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Expected string, received number');
      }
    });

    it('should provide clear error messages for custom refinements', () => {
      const invalidUpdate = {};

      const result = updateCommentSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('At least one field (content or visibility) must be provided');
      }
    });
  });
});