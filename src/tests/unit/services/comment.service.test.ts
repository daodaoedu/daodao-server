/**
 * Comment Service Unit Tests
 * 
 * Comprehensive unit tests for the CommentService class including:
 * - CRUD operations with Prisma mocks
 * - Permission checking logic with various user scenarios
 * - Comment tree building and formatting functionality
 * - Error handling and edge cases
 * - Mock external dependencies and database operations
 */

import { CommentService } from '../../../services/comment.service';
import { prisma } from '../../../services/database/prisma.service';
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
  InternalServerError
} from '../../../utils/error-handler';
import {
  CommentTargetType,
  CommentVisibility,
  CreateCommentParams,
  UpdateCommentParams,
  DeleteCommentParams,
  GetCommentsParams,
  AuthUser,
  CommentResponse,
  TargetEntity,
  MentorParticipantRelation
} from '../../../types/comment.types';

// Mock Prisma service
jest.mock('../../../services/database/prisma.service', () => ({
  prisma: {
    $transaction: jest.fn(),
    comments: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    post: {
      findUnique: jest.fn(),
    },
    groups: {
      findUnique: jest.fn(),
    },
    ideas: {
      findUnique: jest.fn(),
    },
    note: {
      findUnique: jest.fn(),
    },
    outcome: {
      findUnique: jest.fn(),
    },
    review: {
      findUnique: jest.fn(),
    },
    entity_resources: {
      findFirst: jest.fn(),
    },
    mentor_participants: {
      findMany: jest.fn(),
    },
  }
}));

describe('CommentService', () => {
  let commentService: CommentService;
  let mockPrisma: any;

  beforeEach(() => {
    jest.clearAllMocks();
    commentService = new CommentService();
    mockPrisma = prisma as any;
    
    // Default transaction mock that executes the callback immediately
    mockPrisma.$transaction.mockImplementation((callback: any) => callback(mockPrisma));
  });

  describe('createComment', () => {
    const validCreateParams: CreateCommentParams = {
      targetType: 'post',
      targetId: '1',
      content: 'Test comment content',
      visibility: 'public',
      userId: 1
    };

    const mockTargetEntity: TargetEntity = {
      id: 1,
      user_id: 2
    };

    const mockCreatedComment = {
      id: 1,
      target_type: 'post',
      target_id: '1',
      content: 'Test comment content',
      visibility: 'public',
      parent_id: null,
      user_id: 1,
      created_at: new Date('2024-01-01T00:00:00Z'),
      updated_at: new Date('2024-01-01T00:00:00Z'),
      users: {
        id: 1,
        nickname: 'testuser',
        external_id: 'user-123',
        contacts: {
          photo_url: 'https://example.com/photo.jpg'
        },
        basic_info: {},
        user_positions: [
          {
            position: {
              name: 'Developer'
            }
          }
        ]
      }
    };

    beforeEach(() => {
      // Mock target entity resolution
      mockPrisma.post.findUnique.mockResolvedValue(mockTargetEntity);
    });

    it('should create a comment successfully', async () => {
      mockPrisma.comments.create.mockResolvedValue(mockCreatedComment);

      const result = await commentService.createComment(validCreateParams);

      expect(mockPrisma.post.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: { id: true, user_id: true }
      });

      expect(mockPrisma.comments.create).toHaveBeenCalledWith({
        data: {
          target_type: 'post',
          target_id: '1',
          content: 'Test comment content',
          visibility: 'public',
          parent_id: null,
          user_id: 1
        },
        include: {
          users: {
            include: {
              contacts: true,
              basic_info: true,
              user_positions: {
                include: {
                  position: true
                }
              }
            }
          }
        }
      });

      expect(result).toEqual({
        id: 1,
        userId: 1,
        content: 'Test comment content',
        visibility: 'public',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
        parent_id: null,
        user: {
          id: 1,
          name: 'testuser',
          _id: 'user-123',
          roleList: ['Developer'],
          photoURL: 'https://example.com/photo.jpg'
        },
        replies: []
      });
    });

    it('should create a comment with parent successfully', async () => {
      const paramsWithParent = { ...validCreateParams, parentId: 5 };
      const mockParentComment = {
        id: 5,
        target_type: 'post',
        target_id: '1'
      };

      mockPrisma.comments.findUnique.mockResolvedValue(mockParentComment);
      mockPrisma.comments.create.mockResolvedValue({
        ...mockCreatedComment,
        parent_id: 5
      });

      const result = await commentService.createComment(paramsWithParent);

      expect(mockPrisma.comments.findUnique).toHaveBeenCalledWith({
        where: { id: 5 }
      });

      expect(mockPrisma.comments.create).toHaveBeenCalledWith({
        data: {
          target_type: 'post',
          target_id: '1',
          content: 'Test comment content',
          visibility: 'public',
          parent_id: 5,
          user_id: 1
        },
        include: expect.any(Object)
      });

      expect(result.parent_id).toBe(5);
    });

    it('should throw BadRequestError for missing required parameters', async () => {
      const invalidParams = { ...validCreateParams, content: '' };

      await expect(commentService.createComment(invalidParams))
        .rejects.toThrow(BadRequestError);
      await expect(commentService.createComment(invalidParams))
        .rejects.toThrow('Missing required parameters: targetType, targetId, content, or userId');
    });

    it('should throw NotFoundError when target entity not found', async () => {
      mockPrisma.post.findUnique.mockResolvedValue(null);

      await expect(commentService.createComment(validCreateParams))
        .rejects.toThrow(NotFoundError);
      await expect(commentService.createComment(validCreateParams))
        .rejects.toThrow('post with ID 1 not found');
    });

    it('should throw NotFoundError when parent comment not found', async () => {
      const paramsWithParent = { ...validCreateParams, parentId: 999 };
      mockPrisma.comments.findUnique.mockResolvedValue(null);

      await expect(commentService.createComment(paramsWithParent))
        .rejects.toThrow(NotFoundError);
      await expect(commentService.createComment(paramsWithParent))
        .rejects.toThrow('Parent comment not found');
    });

    it('should throw BadRequestError when parent comment belongs to different target', async () => {
      const paramsWithParent = { ...validCreateParams, parentId: 5 };
      const mockParentComment = {
        id: 5,
        target_type: 'idea', // Different target type
        target_id: '2' // Different target ID
      };

      mockPrisma.comments.findUnique.mockResolvedValue(mockParentComment);

      await expect(commentService.createComment(paramsWithParent))
        .rejects.toThrow(BadRequestError);
      await expect(commentService.createComment(paramsWithParent))
        .rejects.toThrow('Parent comment does not belong to the same target entity');
    });

    it('should default visibility to private when not specified', async () => {
      const paramsWithoutVisibility = { ...validCreateParams };
      delete paramsWithoutVisibility.visibility;

      mockPrisma.comments.create.mockResolvedValue({
        ...mockCreatedComment,
        visibility: 'private'
      });

      await commentService.createComment(paramsWithoutVisibility);

      expect(mockPrisma.comments.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          visibility: 'private'
        }),
        include: expect.any(Object)
      });
    });

    it('should handle database errors during creation', async () => {
      mockPrisma.comments.create.mockRejectedValue(new Error('Database connection failed'));

      await expect(commentService.createComment(validCreateParams))
        .rejects.toThrow(InternalServerError);
      await expect(commentService.createComment(validCreateParams))
        .rejects.toThrow('Failed to create comment: Database connection failed');
    });
  });

  describe('getComments', () => {
    const validGetParams: GetCommentsParams = {
      targetType: 'post',
      targetId: '1',
      currentUser: { id: 1, role: '1' }
    };

    const mockTargetEntity: TargetEntity = {
      id: 1,
      user_id: 2
    };

    const mockComments = [
      {
        id: 1,
        target_type: 'post',
        target_id: '1',
        content: 'Root comment',
        visibility: 'public',
        parent_id: null,
        user_id: 1,
        created_at: new Date('2024-01-01T00:00:00Z'),
        updated_at: new Date('2024-01-01T00:00:00Z'),
        users: {
          id: 1,
          nickname: 'user1',
          external_id: 'user-1',
          contacts: { photo_url: null },
          basic_info: {},
          user_positions: []
        }
      },
      {
        id: 2,
        target_type: 'post',
        target_id: '1',
        content: 'Reply comment',
        visibility: 'private',
        parent_id: 1,
        user_id: 2,
        created_at: new Date('2024-01-01T01:00:00Z'),
        updated_at: new Date('2024-01-01T01:00:00Z'),
        users: {
          id: 2,
          nickname: 'user2',
          external_id: 'user-2',
          contacts: { photo_url: null },
          basic_info: {},
          user_positions: []
        }
      }
    ];

    beforeEach(() => {
      mockPrisma.post.findUnique.mockResolvedValue(mockTargetEntity);
      mockPrisma.comments.findMany.mockResolvedValue(mockComments);
      mockPrisma.mentor_participants.findMany.mockResolvedValue([]);
    });

    it('should get comments and build tree structure', async () => {
      const result = await commentService.getComments(validGetParams);

      expect(mockPrisma.post.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: { id: true, user_id: true }
      });

      expect(mockPrisma.comments.findMany).toHaveBeenCalledWith({
        where: {
          target_type: 'post',
          target_id: '1'
        },
        include: {
          users: {
            include: {
              contacts: true,
              basic_info: true,
              user_positions: {
                include: {
                  position: true
                }
              }
            }
          }
        },
        orderBy: {
          created_at: 'asc'
        }
      });

      expect(result).toHaveLength(1); // Only root comment visible
      expect(result[0].id).toBe(1);
      expect(result[0].replies).toHaveLength(0); // Private reply not visible to user 1
    });

    it('should return comments visible to target entity owner', async () => {
      const ownerParams = { ...validGetParams, currentUser: { id: 2, role: '1' } };

      const result = await commentService.getComments(ownerParams);

      expect(result).toHaveLength(1);
      expect(result[0].replies).toHaveLength(1); // Private reply visible to owner
    });

    it('should return comments visible to comment author', async () => {
      const authorParams = { ...validGetParams, currentUser: { id: 2, role: '1' } };

      const result = await commentService.getComments(authorParams);

      expect(result).toHaveLength(1);
      expect(result[0].replies).toHaveLength(1); // Author can see their own private comment
    });

    it('should return comments visible to mentor of participant', async () => {
      const mentorParams = { ...validGetParams, currentUser: { id: 3, role: '4' } };
      const mockMentorRelations = [
        { mentor_id: 3, participant_id: 2 }
      ];

      mockPrisma.mentor_participants.findMany.mockResolvedValue(mockMentorRelations);

      const result = await commentService.getComments(mentorParams);

      expect(mockPrisma.mentor_participants.findMany).toHaveBeenCalledWith({
        where: { mentor_id: 3 }
      });

      expect(result).toHaveLength(1);
      expect(result[0].replies).toHaveLength(1); // Mentor can see participant's private comment
    });

    it('should handle anonymous user (only public comments)', async () => {
      const anonymousParams = { ...validGetParams, currentUser: null };

      const result = await commentService.getComments(anonymousParams);

      expect(result).toHaveLength(1); // Only public comment visible
      expect(result[0].replies).toHaveLength(0); // Private reply not visible
    });

    it('should throw NotFoundError when target entity not found', async () => {
      mockPrisma.post.findUnique.mockResolvedValue(null);

      await expect(commentService.getComments(validGetParams))
        .rejects.toThrow(NotFoundError);
    });

    it('should handle database errors during retrieval', async () => {
      mockPrisma.comments.findMany.mockRejectedValue(new Error('Database error'));

      await expect(commentService.getComments(validGetParams))
        .rejects.toThrow(InternalServerError);
      await expect(commentService.getComments(validGetParams))
        .rejects.toThrow('Failed to get comments: Database error');
    });
  });

  describe('getCommentDetail', () => {
    const mockComment = {
      id: 1,
      target_type: 'post',
      target_id: '1',
      content: 'Test comment',
      visibility: 'private',
      parent_id: null,
      user_id: 1,
      created_at: new Date('2024-01-01T00:00:00Z'),
      updated_at: new Date('2024-01-01T00:00:00Z'),
      users: {
        id: 1,
        nickname: 'testuser',
        external_id: 'user-123',
        contacts: { photo_url: null },
        basic_info: {},
        user_positions: []
      }
    };

    const mockTargetEntity: TargetEntity = {
      id: 1,
      user_id: 2
    };

    beforeEach(() => {
      mockPrisma.comments.findUnique.mockResolvedValue(mockComment);
      mockPrisma.post.findUnique.mockResolvedValue(mockTargetEntity);
    });

    it('should get comment detail for authorized user', async () => {
      const currentUser: AuthUser = { id: 1, role: '1' }; // Comment author

      const result = await commentService.getCommentDetail(1, currentUser);

      expect(mockPrisma.comments.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          users: {
            include: {
              contacts: true,
              basic_info: true,
              user_positions: {
                include: {
                  position: true
                }
              }
            }
          }
        }
      });

      expect(result).toEqual({
        id: 1,
        userId: 1,
        content: 'Test comment',
        visibility: 'private',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
        parent_id: null,
        user: {
          id: 1,
          name: 'testuser',
          _id: 'user-123',
          roleList: [],
          photoURL: null
        },
        replies: []
      });
    });

    it('should throw NotFoundError when comment not found', async () => {
      mockPrisma.comments.findUnique.mockResolvedValue(null);

      await expect(commentService.getCommentDetail(999))
        .rejects.toThrow(NotFoundError);
      await expect(commentService.getCommentDetail(999))
        .rejects.toThrow('Comment not found');
    });

    it('should throw ForbiddenError when user cannot view comment', async () => {
      const unauthorizedUser: AuthUser = { id: 3, role: '1' }; // Different user

      await expect(commentService.getCommentDetail(1, unauthorizedUser))
        .rejects.toThrow(ForbiddenError);
      await expect(commentService.getCommentDetail(1, unauthorizedUser))
        .rejects.toThrow('You do not have permission to view this comment');
    });

    it('should handle database errors', async () => {
      mockPrisma.comments.findUnique.mockRejectedValue(new Error('Database error'));

      await expect(commentService.getCommentDetail(1))
        .rejects.toThrow(InternalServerError);
      await expect(commentService.getCommentDetail(1))
        .rejects.toThrow('Failed to get comment detail: Database error');
    });
  });

  describe('updateComment', () => {
    const validUpdateParams: UpdateCommentParams = {
      commentId: 1,
      userId: 1,
      content: 'Updated content',
      visibility: 'public'
    };

    const mockExistingComment = {
      id: 1,
      user_id: 1,
      content: 'Original content',
      visibility: 'private',
      users: {
        id: 1,
        nickname: 'testuser',
        external_id: 'user-123',
        contacts: { photo_url: null },
        basic_info: {},
        user_positions: []
      }
    };

    beforeEach(() => {
      mockPrisma.comments.findUnique.mockResolvedValue(mockExistingComment);
      mockPrisma.comments.update.mockResolvedValue({
        ...mockExistingComment,
        content: 'Updated content',
        visibility: 'public'
      });
    });

    it('should update comment successfully', async () => {
      const result = await commentService.updateComment(validUpdateParams);

      expect(mockPrisma.comments.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          users: {
            include: {
              contacts: true,
              basic_info: true,
              user_positions: {
                include: {
                  position: true
                }
              }
            }
          }
        }
      });

      expect(mockPrisma.comments.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          content: 'Updated content',
          visibility: 'public'
        },
        include: {
          users: {
            include: {
              contacts: true,
              basic_info: true,
              user_positions: {
                include: {
                  position: true
                }
              }
            }
          }
        }
      });

      expect(result.content).toBe('Updated content');
      expect(result.visibility).toBe('public');
    });

    it('should update only content when visibility not provided', async () => {
      const partialUpdateParams = {
        commentId: 1,
        userId: 1,
        content: 'Only content updated'
      };

      await commentService.updateComment(partialUpdateParams);

      expect(mockPrisma.comments.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          content: 'Only content updated'
        },
        include: expect.any(Object)
      });
    });

    it('should update only visibility when content not provided', async () => {
      const partialUpdateParams = {
        commentId: 1,
        userId: 1,
        visibility: 'public' as CommentVisibility
      };

      await commentService.updateComment(partialUpdateParams);

      expect(mockPrisma.comments.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          visibility: 'public'
        },
        include: expect.any(Object)
      });
    });

    it('should throw NotFoundError when comment not found', async () => {
      mockPrisma.comments.findUnique.mockResolvedValue(null);

      await expect(commentService.updateComment(validUpdateParams))
        .rejects.toThrow(NotFoundError);
      await expect(commentService.updateComment(validUpdateParams))
        .rejects.toThrow('Comment not found');
    });

    it('should throw ForbiddenError when user is not comment owner', async () => {
      const unauthorizedParams = { ...validUpdateParams, userId: 2 };

      await expect(commentService.updateComment(unauthorizedParams))
        .rejects.toThrow(ForbiddenError);
      await expect(commentService.updateComment(unauthorizedParams))
        .rejects.toThrow('You do not have permission to update this comment');
    });

    it('should handle database errors during update', async () => {
      mockPrisma.comments.update.mockRejectedValue(new Error('Update failed'));

      await expect(commentService.updateComment(validUpdateParams))
        .rejects.toThrow(InternalServerError);
      await expect(commentService.updateComment(validUpdateParams))
        .rejects.toThrow('Failed to update comment: Update failed');
    });
  });

  describe('deleteComment', () => {
    const validDeleteParams: DeleteCommentParams = {
      commentId: 1,
      userId: 1
    };

    const mockExistingComment = {
      id: 1,
      user_id: 1,
      content: 'Comment to delete'
    };

    beforeEach(() => {
      mockPrisma.comments.findUnique.mockResolvedValue(mockExistingComment);
      mockPrisma.comments.delete.mockResolvedValue(mockExistingComment);
    });

    it('should delete comment successfully', async () => {
      const result = await commentService.deleteComment(validDeleteParams);

      expect(mockPrisma.comments.findUnique).toHaveBeenCalledWith({
        where: { id: 1 }
      });

      expect(mockPrisma.comments.delete).toHaveBeenCalledWith({
        where: { id: 1 }
      });

      expect(result).toEqual({
        message: 'Comment deleted successfully'
      });
    });

    it('should throw NotFoundError when comment not found', async () => {
      mockPrisma.comments.findUnique.mockResolvedValue(null);

      await expect(commentService.deleteComment(validDeleteParams))
        .rejects.toThrow(NotFoundError);
      await expect(commentService.deleteComment(validDeleteParams))
        .rejects.toThrow('Comment not found');
    });

    it('should throw ForbiddenError when user is not comment owner', async () => {
      const unauthorizedParams = { ...validDeleteParams, userId: 2 };

      await expect(commentService.deleteComment(unauthorizedParams))
        .rejects.toThrow(ForbiddenError);
      await expect(commentService.deleteComment(unauthorizedParams))
        .rejects.toThrow('You do not have permission to delete this comment');
    });

    it('should handle database errors during deletion', async () => {
      mockPrisma.comments.delete.mockRejectedValue(new Error('Delete failed'));

      await expect(commentService.deleteComment(validDeleteParams))
        .rejects.toThrow(InternalServerError);
      await expect(commentService.deleteComment(validDeleteParams))
        .rejects.toThrow('Failed to delete comment: Delete failed');
    });
  });

  describe('getTargetEntity (private method testing through public methods)', () => {
    it('should resolve post target entity', async () => {
      const mockPost = { id: 1, user_id: 2 };
      mockPrisma.post.findUnique.mockResolvedValue(mockPost);
      mockPrisma.comments.create.mockResolvedValue({
        id: 1,
        users: { id: 1, nickname: 'test', external_id: 'test', contacts: {}, basic_info: {}, user_positions: [] }
      });

      await commentService.createComment({
        targetType: 'post',
        targetId: '1',
        content: 'test',
        userId: 1
      });

      expect(mockPrisma.post.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: { id: true, user_id: true }
      });
    });

    it('should resolve circle target entity', async () => {
      const mockCircle = { id: 1, created_by: 2 };
      mockPrisma.groups.findUnique.mockResolvedValue(mockCircle);
      mockPrisma.comments.create.mockResolvedValue({
        id: 1,
        users: { id: 1, nickname: 'test', external_id: 'test', contacts: {}, basic_info: {}, user_positions: [] }
      });

      await commentService.createComment({
        targetType: 'circle',
        targetId: '1',
        content: 'test',
        userId: 1
      });

      expect(mockPrisma.groups.findUnique).toHaveBeenCalledWith({
        where: { external_id: "1" },
        select: { id: true, created_by: true }
      });
    });

    it('should resolve idea target entity', async () => {
      const mockIdea = { id: 1, user_id: 2 };
      mockPrisma.ideas.findUnique.mockResolvedValue(mockIdea);
      mockPrisma.comments.create.mockResolvedValue({
        id: 1,
        users: { id: 1, nickname: 'test', external_id: 'test', contacts: {}, basic_info: {}, user_positions: [] }
      });

      await commentService.createComment({
        targetType: 'idea',
        targetId: '1',
        content: 'test',
        userId: 1
      });

      expect(mockPrisma.ideas.findUnique).toHaveBeenCalledWith({
        where: { external_id: "1" },
        select: { id: true, user_id: true }
      });
    });

    it('should resolve note target entity through post relationship', async () => {
      const mockNote = {
        id: 1,
        post: { user_id: 2 }
      };
      mockPrisma.note.findUnique.mockResolvedValue(mockNote);
      mockPrisma.comments.create.mockResolvedValue({
        id: 1,
        users: { id: 1, nickname: 'test', external_id: 'test', contacts: {}, basic_info: {}, user_positions: [] }
      });

      await commentService.createComment({
        targetType: 'note',
        targetId: '1',
        content: 'test',
        userId: 1
      });

      expect(mockPrisma.note.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          post: {
            select: { user_id: true }
          }
        }
      });
    });

    it('should resolve resource target entity through entity_resources', async () => {
      const mockResourceEntity = { created_by: 2 };
      mockPrisma.entity_resources.findFirst.mockResolvedValue(mockResourceEntity);
      mockPrisma.comments.create.mockResolvedValue({
        id: 1,
        users: { id: 1, nickname: 'test', external_id: 'test', contacts: {}, basic_info: {}, user_positions: [] }
      });

      await commentService.createComment({
        targetType: 'resource',
        targetId: '1',
        content: 'test',
        userId: 1
      });

      expect(mockPrisma.entity_resources.findFirst).toHaveBeenCalledWith({
        where: {
          entity_type: 'resource',
          entity_id: '1'
        },
        select: { id: true, created_by: true }
      });
    });

    it('should throw BadRequestError for unsupported target type', async () => {
      await expect(commentService.createComment({
        targetType: 'portfolio',
        targetId: '1',
        content: 'test',
        userId: 1
      })).rejects.toThrow(BadRequestError);
      await expect(commentService.createComment({
        targetType: 'portfolio',
        targetId: '1',
        content: 'test',
        userId: 1
      })).rejects.toThrow("Target type 'portfolio' is not yet implemented");
    });
  });

  describe('buildCommentTree (private method testing through getComments)', () => {
    const mockFlatComments = [
      {
        id: 1,
        target_type: 'post',
        target_id: '1',
        content: 'Root comment 1',
        visibility: 'public',
        parent_id: null,
        user_id: 1,
        created_at: new Date('2024-01-01T00:00:00Z'),
        updated_at: new Date('2024-01-01T00:00:00Z'),
        users: {
          id: 1,
          nickname: 'user1',
          external_id: 'user-1',
          contacts: { photo_url: null },
          basic_info: {},
          user_positions: []
        }
      },
      {
        id: 2,
        target_type: 'post',
        target_id: '1',
        content: 'Reply to 1',
        visibility: 'public',
        parent_id: 1,
        user_id: 2,
        created_at: new Date('2024-01-01T01:00:00Z'),
        updated_at: new Date('2024-01-01T01:00:00Z'),
        users: {
          id: 2,
          nickname: 'user2',
          external_id: 'user-2',
          contacts: { photo_url: null },
          basic_info: {},
          user_positions: []
        }
      },
      {
        id: 3,
        target_type: 'post',
        target_id: '1',
        content: 'Root comment 2',
        visibility: 'public',
        parent_id: null,
        user_id: 3,
        created_at: new Date('2024-01-01T02:00:00Z'),
        updated_at: new Date('2024-01-01T02:00:00Z'),
        users: {
          id: 3,
          nickname: 'user3',
          external_id: 'user-3',
          contacts: { photo_url: null },
          basic_info: {},
          user_positions: []
        }
      },
      {
        id: 4,
        target_type: 'post',
        target_id: '1',
        content: 'Reply to reply',
        visibility: 'public',
        parent_id: 2,
        user_id: 4,
        created_at: new Date('2024-01-01T03:00:00Z'),
        updated_at: new Date('2024-01-01T03:00:00Z'),
        users: {
          id: 4,
          nickname: 'user4',
          external_id: 'user-4',
          contacts: { photo_url: null },
          basic_info: {},
          user_positions: []
        }
      }
    ];

    beforeEach(() => {
      mockPrisma.post.findUnique.mockResolvedValue({ id: 1, user_id: 1 });
      mockPrisma.comments.findMany.mockResolvedValue(mockFlatComments);
      mockPrisma.mentor_participants.findMany.mockResolvedValue([]);
    });

    it('should build correct tree structure with nested replies', async () => {
      const result = await commentService.getComments({
        targetType: 'post',
        targetId: '1',
        currentUser: { id: 1, role: '1' }
      });

      expect(result).toHaveLength(2); // Two root comments

      // First root comment with nested replies
      expect(result[0].id).toBe(1);
      expect(result[0].replies).toHaveLength(1);
      expect(result[0].replies[0].id).toBe(2);
      expect(result[0].replies[0].replies).toHaveLength(1);
      expect(result[0].replies[0].replies[0].id).toBe(4);

      // Second root comment with no replies
      expect(result[1].id).toBe(3);
      expect(result[1].replies).toHaveLength(0);
    });

    it('should handle orphaned comments gracefully', async () => {
      const commentsWithOrphan = [
        ...mockFlatComments,
        {
          id: 5,
          target_type: 'post',
          target_id: '1',
          content: 'Orphaned reply',
          visibility: 'public',
          parent_id: 999, // Non-existent parent
          user_id: 5,
          created_at: new Date('2024-01-01T04:00:00Z'),
          updated_at: new Date('2024-01-01T04:00:00Z'),
          users: {
            id: 5,
            nickname: 'user5',
            external_id: 'user-5',
            contacts: { photo_url: null },
            basic_info: {},
            user_positions: []
          }
        }
      ];

      mockPrisma.comments.findMany.mockResolvedValue(commentsWithOrphan);

      const result = await commentService.getComments({
        targetType: 'post',
        targetId: '1',
        currentUser: { id: 1, role: '1' }
      });

      // Orphaned comment should not appear in the tree
      expect(result).toHaveLength(2);
      expect(result.find(c => c.id === 5)).toBeUndefined();
    });
  });

  describe('canViewComment (permission checking)', () => {
    const mockTargetEntity: TargetEntity = { id: 1, user_id: 2 };

    beforeEach(() => {
      mockPrisma.post.findUnique.mockResolvedValue(mockTargetEntity);
      mockPrisma.mentor_participants.findMany.mockResolvedValue([]);
    });

    it('should allow viewing public comments by anyone', async () => {
      const publicComment = {
        id: 1,
        visibility: 'public',
        user_id: 3,
        target_type: 'post',
        target_id: '1',
        content: 'Public comment',
        users: {
          id: 3,
          nickname: 'user3',
          external_id: 'user-3',
          contacts: { photo_url: null },
          basic_info: {},
          user_positions: []
        }
      };

      mockPrisma.comments.findMany.mockResolvedValue([publicComment]);

      const result = await commentService.getComments({
        targetType: 'post',
        targetId: '1',
        currentUser: null // Anonymous user
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    it('should deny private comments to anonymous users', async () => {
      const privateComment = {
        id: 1,
        visibility: 'private',
        user_id: 3,
        target_type: 'post',
        target_id: '1',
        content: 'Private comment',
        users: {
          id: 3,
          nickname: 'user3',
          external_id: 'user-3',
          contacts: { photo_url: null },
          basic_info: {},
          user_positions: []
        }
      };

      mockPrisma.comments.findMany.mockResolvedValue([privateComment]);

      const result = await commentService.getComments({
        targetType: 'post',
        targetId: '1',
        currentUser: null
      });

      expect(result).toHaveLength(0);
    });

    it('should allow comment authors to view their own private comments', async () => {
      const privateComment = {
        id: 1,
        visibility: 'private',
        user_id: 3,
        target_type: 'post',
        target_id: '1',
        content: 'Private comment',
        users: {
          id: 3,
          nickname: 'user3',
          external_id: 'user-3',
          contacts: { photo_url: null },
          basic_info: {},
          user_positions: []
        }
      };

      mockPrisma.comments.findMany.mockResolvedValue([privateComment]);

      const result = await commentService.getComments({
        targetType: 'post',
        targetId: '1',
        currentUser: { id: 3, role: '1' } // Comment author
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    it('should allow target entity owners to view all comments', async () => {
      const privateComment = {
        id: 1,
        visibility: 'private',
        user_id: 3,
        target_type: 'post',
        target_id: '1',
        content: 'Private comment',
        users: {
          id: 3,
          nickname: 'user3',
          external_id: 'user-3',
          contacts: { photo_url: null },
          basic_info: {},
          user_positions: []
        }
      };

      mockPrisma.comments.findMany.mockResolvedValue([privateComment]);

      const result = await commentService.getComments({
        targetType: 'post',
        targetId: '1',
        currentUser: { id: 2, role: '1' } // Target entity owner
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    it('should allow mentors to view their participants private comments', async () => {
      const privateComment = {
        id: 1,
        visibility: 'private',
        user_id: 3, // Participant
        target_type: 'post',
        target_id: '1',
        content: 'Private comment',
        users: {
          id: 3,
          nickname: 'user3',
          external_id: 'user-3',
          contacts: { photo_url: null },
          basic_info: {},
          user_positions: []
        }
      };

      const mentorRelations = [
        { mentor_id: 4, participant_id: 3 }
      ];

      mockPrisma.comments.findMany.mockResolvedValue([privateComment]);
      mockPrisma.mentor_participants.findMany.mockResolvedValue(mentorRelations);

      const result = await commentService.getComments({
        targetType: 'post',
        targetId: '1',
        currentUser: { id: 4, role: '4' } // Mentor
      });

      expect(mockPrisma.mentor_participants.findMany).toHaveBeenCalledWith({
        where: { mentor_id: 4 }
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    it('should deny private comments to unauthorized users', async () => {
      const privateComment = {
        id: 1,
        visibility: 'private',
        user_id: 3,
        target_type: 'post',
        target_id: '1',
        content: 'Private comment',
        users: {
          id: 3,
          nickname: 'user3',
          external_id: 'user-3',
          contacts: { photo_url: null },
          basic_info: {},
          user_positions: []
        }
      };

      mockPrisma.comments.findMany.mockResolvedValue([privateComment]);

      const result = await commentService.getComments({
        targetType: 'post',
        targetId: '1',
        currentUser: { id: 5, role: '1' } // Unauthorized user
      });

      expect(result).toHaveLength(0);
    });
  });

  describe('formatCommentResponse (private method testing through public methods)', () => {
    it('should format comment response with complete user data', async () => {
      const mockComment = {
        id: 1,
        target_type: 'post',
        target_id: '1',
        content: 'Test comment',
        visibility: 'public',
        parent_id: null,
        user_id: 1,
        created_at: new Date('2024-01-01T00:00:00Z'),
        updated_at: new Date('2024-01-01T00:00:00Z'),
        users: {
          id: 1,
          nickname: 'John Doe',
          external_id: 'user-123',
          contacts: {
            photo_url: 'https://example.com/photo.jpg'
          },
          basic_info: {},
          user_positions: [
            {
              position: {
                name: 'Developer'
              }
            },
            {
              position: {
                name: 'Admin'
              }
            }
          ]
        }
      };

      mockPrisma.post.findUnique.mockResolvedValue({ id: 1, user_id: 1 });
      mockPrisma.comments.findUnique.mockResolvedValue(mockComment);

      const result = await commentService.getCommentDetail(1, { id: 1, role: '1' });

      expect(result).toEqual({
        id: 1,
        userId: 1,
        content: 'Test comment',
        visibility: 'public',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
        parent_id: null,
        user: {
          id: 1,
          name: 'John Doe',
          _id: 'user-123',
          roleList: ['Developer', 'Admin'],
          photoURL: 'https://example.com/photo.jpg'
        },
        replies: []
      });
    });

    it('should handle missing user data gracefully', async () => {
      const mockComment = {
        id: 1,
        target_type: 'post',
        target_id: '1',
        content: 'Test comment',
        visibility: 'public',
        parent_id: null,
        user_id: 1,
        created_at: new Date('2024-01-01T00:00:00Z'),
        updated_at: new Date('2024-01-01T00:00:00Z'),
        users: {
          id: 1,
          nickname: null,
          external_id: null,
          contacts: null,
          basic_info: {},
          user_positions: null
        }
      };

      mockPrisma.post.findUnique.mockResolvedValue({ id: 1, user_id: 1 });
      mockPrisma.comments.findUnique.mockResolvedValue(mockComment);

      const result = await commentService.getCommentDetail(1, { id: 1, role: '1' });

      expect(result.user).toEqual({
        id: 1,
        name: '',
        _id: '',
        roleList: [],
        photoURL: null
      });
    });

    it('should handle missing created_at/updated_at dates', async () => {
      const mockComment = {
        id: 1,
        target_type: 'post',
        target_id: '1',
        content: 'Test comment',
        visibility: 'public',
        parent_id: null,
        user_id: 1,
        created_at: null,
        updated_at: null,
        users: {
          id: 1,
          nickname: 'testuser',
          external_id: 'user-123',
          contacts: { photo_url: null },
          basic_info: {},
          user_positions: []
        }
      };

      mockPrisma.post.findUnique.mockResolvedValue({ id: 1, user_id: 1 });
      mockPrisma.comments.findUnique.mockResolvedValue(mockComment);

      const result = await commentService.getCommentDetail(1, { id: 1, role: '1' });

      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('Error handling edge cases', () => {
    it('should handle transaction rollback on create comment failure', async () => {
      const mockTransactionError = new Error('Transaction failed');
      mockPrisma.$transaction.mockRejectedValue(mockTransactionError);

      await expect(commentService.createComment({
        targetType: 'post',
        targetId: '1',
        content: 'test',
        userId: 1
      })).rejects.toThrow('Transaction failed');
    });

    it('should handle transaction rollback on update comment failure', async () => {
      const mockTransactionError = new Error('Transaction failed');
      mockPrisma.$transaction.mockRejectedValue(mockTransactionError);

      await expect(commentService.updateComment({
        commentId: 1,
        userId: 1,
        content: 'updated'
      })).rejects.toThrow('Transaction failed');
    });

    it('should handle transaction rollback on delete comment failure', async () => {
      const mockTransactionError = new Error('Transaction failed');
      mockPrisma.$transaction.mockRejectedValue(mockTransactionError);

      await expect(commentService.deleteComment({
        commentId: 1,
        userId: 1
      })).rejects.toThrow('Transaction failed');
    });

    it('should handle invalid target type gracefully', async () => {
      await expect(commentService.createComment({
        targetType: 'invalid' as CommentTargetType,
        targetId: '1',
        content: 'test',
        userId: 1
      })).rejects.toThrow(BadRequestError);
    });

    it('should handle database connection errors', async () => {
      mockPrisma.post.findUnique.mockRejectedValue(new Error('Connection timeout'));

      await expect(commentService.createComment({
        targetType: 'post',
        targetId: '1',
        content: 'test',
        userId: 1
      })).rejects.toThrow(InternalServerError);
    });
  });
});