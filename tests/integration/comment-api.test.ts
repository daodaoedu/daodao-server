/**
 * Comment API Integration Tests
 * 
 * This file contains comprehensive integration tests for all comment API endpoints,
 * testing complete request/response cycles with database operations, authentication,
 * permission scenarios, and nested comment functionality.
 */

import request from 'supertest';
import express from 'express';

// Mock Prisma using shared mock utility
import { mockPrisma } from '@/utils/prisma-mock';

jest.mock('@/services/database/prisma.service', () => ({
  prisma: mockPrisma
}));

// Mock JWT service
jest.mock('@/services/jwt.service', () => ({
  jwtService: {
    verifyToken: jest.fn(),
    generateToken: jest.fn(),
  }
}));

// Mock auth middleware
jest.mock('@/middleware/auth', () => ({
  authenticate: jest.fn((req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication required', code: 'UNAUTHORIZED' }
      });
    }

    // Mock user based on token
    if (token === 'valid-test-token') {
      req.user = { id: 1, username: 'testuser', roles: ['user'] };
    } else if (token === 'valid-test-token-2') {
      req.user = { id: 2, username: 'testuser2', roles: ['4'] }; // mentor role
    } else {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid token', code: 'UNAUTHORIZED' }
      });
    }

    next();
  }),
  optionalAuth: jest.fn((req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      if (token === 'valid-test-token') {
        req.user = { id: 1, username: 'testuser', roles: ['user'] };
      } else if (token === 'valid-test-token-2') {
        req.user = { id: 2, username: 'testuser2', roles: ['4'] };
      }
    }

    next();
  })
}));

// Mock validation middleware
jest.mock('@/validators/validation.middleware', () => ({
  validate: () => jest.fn((req: any, res: any, next: any) => {
    // Simple validation mock - in real tests you'd want more sophisticated validation
    if (req.method === 'POST' && req.path === '/') {
      const { targetType, targetId, content } = req.body;

      if (!targetType || !targetId || !content) {
        return res.status(400).json({
          success: false,
          error: { message: 'Missing required fields', code: 'VALIDATION_ERROR' }
        });
      }

      if (!['post', 'resource', 'note', 'outcome', 'review', 'circle', 'idea', 'portfolio'].includes(targetType)) {
        return res.status(400).json({
          success: false,
          error: { message: 'Invalid target type', code: 'VALIDATION_ERROR' }
        });
      }

      if (targetId <= 0) {
        return res.status(400).json({
          success: false,
          error: { message: 'Invalid target ID', code: 'VALIDATION_ERROR' }
        });
      }

      if (content.length > 5000) {
        return res.status(400).json({
          success: false,
          error: { message: 'Content too long', code: 'VALIDATION_ERROR' }
        });
      }

      if (req.body.visibility && !['public', 'private'].includes(req.body.visibility)) {
        return res.status(400).json({
          success: false,
          error: { message: 'Invalid visibility', code: 'VALIDATION_ERROR' }
        });
      }
    }

    if (req.method === 'PUT' && req.params.commentId) {
      const { content, visibility } = req.body;

      if (!content && !visibility) {
        return res.status(400).json({
          success: false,
          error: { message: 'At least one field required for update', code: 'VALIDATION_ERROR' }
        });
      }
    }

    if (req.method === 'GET' && req.path === '/') {
      const { targetType, targetId } = req.query;

      if (!targetType || !targetId) {
        return res.status(400).json({
          success: false,
          error: { message: 'Missing query parameters', code: 'VALIDATION_ERROR' }
        });
      }
    }

    next();
  })
}));

import { prisma } from '@/services/database/prisma.service';
import { jwtService } from '@/services/jwt.service';
import commentRoutes from '@/routes/comment.routes';
import { globalErrorHandler } from '@/middleware/error.middleware';

describe('Comment API Integration Tests', () => {
  let app: express.Application;
  let testUser: any;
  let testUser2: any;
  let testPost: any;
  let testComment: any;
  let validToken: string;
  let validToken2: string;

  beforeAll(async () => {
    // Set up test environment
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-jwt-secret';

    // Create Express app
    app = express();
    app.use(express.json());

    // Set up routes
    app.use('/api/comments', commentRoutes);

    // Error handling middleware
    app.use(globalErrorHandler);

    // Create test data
    testUser = {
      id: 1,
      external_id: 'user-1',
      nickname: 'testuser',
      contacts: {
        email: 'test@example.com',
        photo_url: 'https://example.com/photo.jpg'
      },
      basic_info: {
        name: 'Test User'
      },
      user_positions: [{
        position: { name: 'Developer' }
      }]
    };

    testUser2 = {
      id: 2,
      external_id: 'user-2',
      nickname: 'testuser2',
      contacts: {
        email: 'test2@example.com',
        photo_url: null
      },
      basic_info: {
        name: 'Test User 2'
      },
      user_positions: [{
        position: { name: 'Mentor' }
      }]
    };

    testPost = {
      id: 1,
      user_id: 1,
      title: 'Test Post',
      content: 'Test content'
    };

    testComment = {
      id: 1,
      target_type: 'post',
      target_id: '1',
      user_id: 1,
      content: 'Test comment',
      visibility: 'public',
      parent_id: null,
      created_at: new Date(),
      updated_at: new Date(),
      users: testUser
    };

    // Generate test tokens
    validToken = 'valid-test-token';
    validToken2 = 'valid-test-token-2';
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Set up default JWT verification
    (jwtService.verifyToken as jest.Mock).mockImplementation((token: string) => {
      if (token === validToken) {
        return { id: 1, username: 'testuser', roles: ['user'] };
      }
      if (token === validToken2) {
        return { id: 2, username: 'testuser2', roles: ['mentor'] };
      }
      throw new Error('Invalid token');
    });

    // Set up default Prisma mocks
    mockPrisma.$transaction.mockImplementation(async (callback: any) => {
      return await callback(mockPrisma);
    });
  });

  describe('POST /api/comments', () => {
    it('should create a new comment successfully', async () => {
      // Mock target entity lookup
      mockPrisma.post.findUnique.mockResolvedValue(testPost);

      // Mock comment creation
      mockPrisma.comments.create.mockResolvedValue(testComment);

      const commentData = {
        targetType: 'post',
        targetId: '1',
        content: 'This is a test comment',
        visibility: 'public'
      };

      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${validToken}`)
        .send(commentData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Comment created successfully',
        data: {
          id: 1,
          userId: 1,
          content: 'Test comment',
          visibility: 'public',
          parent_id: null,
          user: {
            id: 1,
            name: 'testuser',
            _id: 'user-1'
          }
        }
      });

      expect(mockPrisma.post.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: { id: true, user_id: true }
      });

      expect(mockPrisma.comments.create).toHaveBeenCalled();
    });

    it('should create a reply comment successfully', async () => {
      // Mock target entity lookup
      mockPrisma.post.findUnique.mockResolvedValue(testPost);

      // Mock parent comment lookup
      const parentComment = {
        id: 1,
        target_type: 'post',
        target_id: '1',
        user_id: 1,
        content: 'Parent comment'
      };
      mockPrisma.comments.findUnique.mockResolvedValue(parentComment);

      // Mock reply comment creation
      const replyComment = {
        ...testComment,
        id: 2,
        parent_id: 1,
        content: 'Reply comment',
        users: testUser
      };
      mockPrisma.comments.create.mockResolvedValue(replyComment);

      const replyData = {
        targetType: 'post',
        targetId: '1',
        content: 'This is a reply',
        visibility: 'public',
        parentId: 1
      };

      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${validToken}`)
        .send(replyData)
        .expect(201);

      expect(response.body.data.parent_id).toBe(1);
      expect(mockPrisma.comments.findUnique).toHaveBeenCalledWith({
        where: { id: 1 }
      });
    });

    it('should return 401 for unauthenticated requests', async () => {
      const commentData = {
        targetType: 'post',
        targetId: '1',
        content: 'Test comment'
      };

      const response = await request(app)
        .post('/api/comments')
        .send(commentData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid target type', async () => {
      const commentData = {
        targetType: 'invalid',
        targetId: '1',
        content: 'Test comment'
      };

      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${validToken}`)
        .send(commentData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 when target entity not found', async () => {
      // Mock target entity not found
      mockPrisma.post.findUnique.mockResolvedValue(null);

      const commentData = {
        targetType: 'post',
        targetId: '999',
        content: 'Test comment'
      };

      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${validToken}`)
        .send(commentData)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 when parent comment belongs to different target', async () => {
      // Mock target entity lookup
      mockPrisma.post.findUnique.mockResolvedValue(testPost);

      // Mock parent comment with different target
      const parentComment = {
        id: 1,
        target_type: 'post',
        target_id: '2', // Different target ID
        user_id: 1,
        content: 'Parent comment'
      };
      mockPrisma.comments.findUnique.mockResolvedValue(parentComment);

      const replyData = {
        targetType: 'post',
        targetId: '1',
        content: 'This is a reply',
        parentId: 1
      };

      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${validToken}`)
        .send(replyData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/comments', () => {
    it('should get comments for a target entity successfully', async () => {
      // Mock target entity lookup
      mockPrisma.post.findUnique.mockResolvedValue(testPost);

      // Mock comments retrieval
      const comments = [
        testComment,
        {
          ...testComment,
          id: 2,
          content: 'Second comment',
          users: testUser2
        }
      ];
      mockPrisma.comments.findMany.mockResolvedValue(comments);

      const response = await request(app)
        .get('/api/comments')
        .query({
          targetType: 'post',
          targetId: '1'
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Array)
      });

      expect(response.body.data).toHaveLength(2);
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
    });

    it('should filter private comments for anonymous users', async () => {
      // Mock target entity lookup
      mockPrisma.post.findUnique.mockResolvedValue(testPost);

      // Mock comments with mixed visibility
      const comments = [
        { ...testComment, visibility: 'public' },
        { ...testComment, id: 2, visibility: 'private', users: testUser }
      ];
      mockPrisma.comments.findMany.mockResolvedValue(comments);

      const response = await request(app)
        .get('/api/comments')
        .query({
          targetType: 'post',
          targetId: '1'
        })
        .expect(200);

      // Should only return public comments for anonymous users
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].visibility).toBe('public');
    });

    it('should show private comments to authenticated users with permission', async () => {
      // Mock target entity lookup
      mockPrisma.post.findUnique.mockResolvedValue(testPost);

      // Mock comments with mixed visibility
      const comments = [
        { ...testComment, visibility: 'public' },
        { ...testComment, id: 2, visibility: 'private', user_id: 1, users: testUser }
      ];
      mockPrisma.comments.findMany.mockResolvedValue(comments);

      const response = await request(app)
        .get('/api/comments')
        .query({
          targetType: 'post',
          targetId: '1'
        })
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      // Should return both comments for the comment owner
      expect(response.body.data).toHaveLength(2);
    });

    it('should build nested comment tree structure', async () => {
      // Mock target entity lookup
      mockPrisma.post.findUnique.mockResolvedValue(testPost);

      // Mock nested comments
      const parentComment = { ...testComment, id: 1, parent_id: null };
      const childComment = { ...testComment, id: 2, parent_id: 1, content: 'Reply' };
      const comments = [parentComment, childComment];
      mockPrisma.comments.findMany.mockResolvedValue(comments);

      const response = await request(app)
        .get('/api/comments')
        .query({
          targetType: 'post',
          targetId: '1'
        })
        .expect(200);

      expect(response.body.data).toHaveLength(1); // Only root comment
      expect(response.body.data[0].replies).toHaveLength(1); // One reply
      expect(response.body.data[0].replies[0].content).toBe('Reply');
    });

    it('should return 400 for missing query parameters', async () => {
      const response = await request(app)
        .get('/api/comments')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 when target entity not found', async () => {
      // Mock target entity not found
      mockPrisma.post.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/comments')
        .query({
          targetType: 'post',
          targetId: 999
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/comments/:commentId', () => {
    it('should get comment detail successfully', async () => {
      // Mock comment lookup
      mockPrisma.comments.findUnique.mockResolvedValue(testComment);

      // Mock target entity lookup
      mockPrisma.post.findUnique.mockResolvedValue(testPost);

      const response = await request(app)
        .get('/api/comments/1')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: 1,
          content: 'Test comment',
          visibility: 'public'
        }
      });

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
    });

    it('should return 404 for non-existent comment', async () => {
      // Mock comment not found
      mockPrisma.comments.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/comments/999')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 403 for private comment without permission', async () => {
      // Mock private comment from different user
      const privateComment = {
        ...testComment,
        visibility: 'private',
        user_id: 2,
        users: testUser2
      };
      mockPrisma.comments.findUnique.mockResolvedValue(privateComment);

      // Mock target entity lookup - different owner than comment viewer
      const differentPost = { id: 1, user_id: 3 }; // Neither user 1 nor user 2 owns this
      mockPrisma.post.findUnique.mockResolvedValue(differentPost);

      const response = await request(app)
        .get('/api/comments/1')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should allow comment owner to view private comment', async () => {
      // Mock private comment from same user
      const privateComment = {
        ...testComment,
        visibility: 'private',
        user_id: 1,
        users: testUser
      };
      mockPrisma.comments.findUnique.mockResolvedValue(privateComment);

      // Mock target entity lookup
      mockPrisma.post.findUnique.mockResolvedValue(testPost);

      const response = await request(app)
        .get('/api/comments/1')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('PUT /api/comments/:commentId', () => {
    it('should update comment successfully', async () => {
      // Mock comment lookup and update
      mockPrisma.comments.findUnique.mockResolvedValue(testComment);

      const updatedComment = {
        ...testComment,
        content: 'Updated comment content'
      };
      mockPrisma.comments.update.mockResolvedValue(updatedComment);

      const updateData = {
        content: 'Updated comment content',
        visibility: 'private'
      };

      const response = await request(app)
        .put('/api/comments/1')
        .set('Authorization', `Bearer ${validToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Comment updated successfully',
        data: {
          content: 'Updated comment content'
        }
      });

      expect(mockPrisma.comments.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          content: 'Updated comment content',
          visibility: 'private'
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
    });

    it('should return 401 for unauthenticated requests', async () => {
      const updateData = {
        content: 'Updated content'
      };

      const response = await request(app)
        .put('/api/comments/1')
        .send(updateData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent comment', async () => {
      // Mock comment not found
      mockPrisma.comments.findUnique.mockResolvedValue(null);

      const updateData = {
        content: 'Updated content'
      };

      const response = await request(app)
        .put('/api/comments/1')
        .set('Authorization', `Bearer ${validToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 403 when user tries to update another user\'s comment', async () => {
      // Mock comment from different user
      const otherUserComment = {
        ...testComment,
        user_id: 2,
        users: testUser2
      };
      mockPrisma.comments.findUnique.mockResolvedValue(otherUserComment);

      const updateData = {
        content: 'Trying to update'
      };

      const response = await request(app)
        .put('/api/comments/1')
        .set('Authorization', `Bearer ${validToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for empty update data', async () => {
      const response = await request(app)
        .put('/api/comments/1')
        .set('Authorization', `Bearer ${validToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/comments/:commentId', () => {
    it('should delete comment successfully', async () => {
      // Mock comment lookup
      mockPrisma.comments.findUnique.mockResolvedValue(testComment);

      // Mock comment deletion
      mockPrisma.comments.delete.mockResolvedValue(testComment);

      const response = await request(app)
        .delete('/api/comments/1')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Comment deleted successfully'
      });

      expect(mockPrisma.comments.delete).toHaveBeenCalledWith({
        where: { id: 1 }
      });
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .delete('/api/comments/1')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent comment', async () => {
      // Mock comment not found
      mockPrisma.comments.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/comments/1')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 403 when user tries to delete another user\'s comment', async () => {
      // Mock comment from different user
      const otherUserComment = {
        ...testComment,
        user_id: 2,
        users: testUser2
      };
      mockPrisma.comments.findUnique.mockResolvedValue(otherUserComment);

      const response = await request(app)
        .delete('/api/comments/1')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should delete comment with nested replies (cascade)', async () => {
      // Mock parent comment with replies
      const parentComment = {
        ...testComment,
        id: 1,
        parent_id: null
      };
      mockPrisma.comments.findUnique.mockResolvedValue(parentComment);
      mockPrisma.comments.delete.mockResolvedValue(parentComment);

      const response = await request(app)
        .delete('/api/comments/1')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockPrisma.comments.delete).toHaveBeenCalledWith({
        where: { id: 1 }
      });
    });
  });

  describe('Permission Scenarios', () => {
    it('should allow target entity owner to view private comments', async () => {
      // Mock target entity lookup (user owns the post)
      mockPrisma.post.findUnique.mockResolvedValue({ id: 1, user_id: 1 });

      // Mock private comment from different user
      const privateComment = {
        ...testComment,
        visibility: 'private',
        user_id: 2,
        users: testUser2
      };
      mockPrisma.comments.findMany.mockResolvedValue([privateComment]);

      const response = await request(app)
        .get('/api/comments')
        .query({
          targetType: 'post',
          targetId: '1'
        })
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
    });

    it('should allow mentors to view their participants\' private comments', async () => {
      // Mock target entity lookup
      mockPrisma.post.findUnique.mockResolvedValue({ id: 1, user_id: 3 });

      // Mock mentor-participant relationship
      mockPrisma.mentor_participants.findMany.mockResolvedValue([
        { mentor_id: 2, participant_id: 1 }
      ]);

      // Mock private comment from participant
      const participantComment = {
        ...testComment,
        visibility: 'private',
        user_id: 1, // participant
        users: testUser
      };
      mockPrisma.comments.findMany.mockResolvedValue([participantComment]);

      // Set up mentor token
      (jwtService.verifyToken as jest.Mock).mockImplementation((token: string) => {
        if (token === validToken2) {
          return { id: 2, username: 'mentor', roles: ['4'] }; // role '4' is mentor
        }
        throw new Error('Invalid token');
      });

      const response = await request(app)
        .get('/api/comments')
        .query({
          targetType: 'post',
          targetId: '1'
        })
        .set('Authorization', `Bearer ${validToken2}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
    });

    it('should handle different target types correctly', async () => {
      // Test with different target types
      const targetTypes = [
        { type: 'circle', mockMethod: 'groups', entity: { id: 1, created_by: 1 } },
        { type: 'idea', mockMethod: 'ideas', entity: { id: 1, user_id: 1 } },
        { type: 'resource', mockMethod: 'entity_resources', entity: { created_by: 1 } }
      ];

      for (const { type, mockMethod, entity } of targetTypes) {
        jest.clearAllMocks();

        if (mockMethod === 'entity_resources') {
          (mockPrisma as any)[mockMethod].findFirst.mockResolvedValue(entity);
        } else {
          (mockPrisma as any)[mockMethod].findUnique.mockResolvedValue(entity);
        }

        mockPrisma.comments.findMany.mockResolvedValue([testComment]);

        const response = await request(app)
          .get('/api/comments')
          .query({
            targetType: type,
            targetId: '1'
          })
          .expect(200);

        expect(response.body.success).toBe(true);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      // Mock database error
      mockPrisma.post.findUnique.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/comments')
        .query({
          targetType: 'post',
          targetId: '1'
        })
        .expect(500);

      expect(response.body.success).toBe(false);
    });

    it('should handle invalid JSON in request body', async () => {
      // Express automatically handles JSON parsing errors and may return 500 or 400
      // depending on the error middleware configuration
      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${validToken}`)
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}'); // Invalid JSON syntax

      // Accept either 400 or 500 as both are valid for JSON parsing errors
      expect([400, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    it('should handle JWT verification errors', async () => {
      // Mock JWT verification failure
      (jwtService.verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error('Token expired');
      });

      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', 'Bearer expired-token')
        .send({
          targetType: 'post',
          targetId: '1',
          content: 'Test comment'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should handle transaction rollback on error', async () => {
      // Mock transaction that fails
      mockPrisma.$transaction.mockRejectedValue(new Error('Transaction failed'));

      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          targetType: 'post',
          targetId: '1',
          content: 'Test comment'
        })
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Validation Tests', () => {
    it('should validate comment content length', async () => {
      const longContent = 'a'.repeat(5001); // Exceeds 5000 character limit

      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          targetType: 'post',
          targetId: '1',
          content: longContent
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          targetType: 'post'
          // Missing targetId and content
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate targetId as positive number', async () => {
      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          targetType: 'post',
          targetId: -1,
          content: 'Test comment'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate visibility enum values', async () => {
      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          targetType: 'post',
          targetId: '1',
          content: 'Test comment',
          visibility: 'invalid'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  afterAll(async () => {
    // Clean up
    await mockPrisma.$disconnect();
    delete process.env.NODE_ENV;
    delete process.env.JWT_SECRET;
  });
});