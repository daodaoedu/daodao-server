/**
 * Comment Service - TypeScript implementation with Prisma integration
 * 
 * This service handles all comment-related business logic including:
 * - CRUD operations for comments
 * - Permission checking and access control
 * - Target entity resolution
 * - Comment tree building for nested replies
 * - User data attachment
 */

import { prisma } from './database/prisma.service';
import type { Prisma } from '../../generated/prisma';
import {
  CommentResponse,
  CommentUser,
  CreateCommentParams,
  UpdateCommentParams,
  DeleteCommentParams,
  GetCommentsParams,
  CommentTargetType,
  CommentVisibility,
  AuthUser,
  TargetEntity,
  MentorParticipantRelation,
  CommentServiceInterface,
  DatabaseComment
} from '../types/comment.types';
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
  InternalServerError
} from '../utils/error-handler';

/**
 * Comment Service Class
 * Implements comprehensive comment management with Prisma integration
 */
export class CommentService implements CommentServiceInterface {
  
  /**
   * Create a new comment
   * @param params - Comment creation parameters
   * @returns Promise<CommentResponse> - The created comment with user data
   */
  async createComment(params: CreateCommentParams): Promise<CommentResponse> {
    const { targetType, targetId, content, visibility = 'private', parentId, userId } = params;

    return await prisma.$transaction(async (tx) => {
      try {
        // Validate required parameters
        if (!targetType || !targetId || !content || !userId) {
          throw new BadRequestError('Missing required parameters: targetType, targetId, content, or userId');
        }

        // Validate target entity exists
        await this.getTargetEntity(targetType, targetId, tx);
        
        // Validate parent comment if provided
        if (parentId) {
          const parentComment = await tx.comments.findUnique({
            where: { id: parentId }
          });
          
          if (!parentComment) {
            throw new NotFoundError('Parent comment not found');
          }
          
          // Ensure parent comment belongs to the same target
          if (parentComment.target_type !== targetType || parentComment.target_id !== targetId) {
            throw new BadRequestError('Parent comment does not belong to the same target entity');
          }
        }

        // Create the comment using unchecked input for direct field access
        const commentData: Prisma.commentsUncheckedCreateInput = {
          target_type: targetType,
          target_id: targetId,
          content,
          visibility: visibility as string,
          parent_id: parentId || null,
          user_id: userId
        };

        const createdComment = await tx.comments.create({
          data: commentData,
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

        // Format and return the response
        return this.formatCommentResponse(createdComment);
        
      } catch (error) {
        if (error instanceof NotFoundError || error instanceof BadRequestError) {
          throw error;
        }
        throw new InternalServerError(`Failed to create comment: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
  }

  /**
   * Get comments for a specific target entity
   * @param params - Query parameters including target info and current user
   * @returns Promise<CommentResponse[]> - Array of comments in tree structure
   */
  async getComments(params: GetCommentsParams): Promise<CommentResponse[]> {
    const { targetType, targetId, currentUser } = params;

    try {
      // Validate target entity exists
      const entity = await this.getTargetEntity(targetType, targetId);

      // Get all comments for the target
      const comments = await prisma.comments.findMany({
        where: {
          target_type: targetType,
          target_id: targetId
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

      // Get mentor relations if current user is a mentor
      let mentorRelations: MentorParticipantRelation[] = [];
      if (currentUser?.role === '4') {
        const relations = await prisma.mentor_participants.findMany({
          where: { mentor_id: currentUser.id }
        });
        mentorRelations = relations.map(rel => ({
          mentor_id: rel.mentor_id,
          participant_id: rel.participant_id
        }));
      }

      // Filter comments based on visibility and permissions
      const visibleComments: CommentResponse[] = [];
      
      for (const comment of comments) {
        const canView = await this.canViewComment(
          comment,
          currentUser,
          entity,
          mentorRelations
        );
        
        if (canView) {
          visibleComments.push(this.formatCommentResponse(comment));
        }
      }

      // Build and return comment tree
      return this.buildCommentTree(visibleComments);
      
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError(`Failed to get comments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get a specific comment by ID
   * @param commentId - The comment ID
   * @param currentUser - Current user for permission checking
   * @returns Promise<CommentResponse> - The comment details
   */
  async getCommentDetail(commentId: number, currentUser?: AuthUser | null): Promise<CommentResponse> {
    try {
      const comment = await prisma.comments.findUnique({
        where: { id: commentId },
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

      if (!comment) {
        throw new NotFoundError('Comment not found');
      }

      // Get target entity for permission checking
      const entity = await this.getTargetEntity(
        comment.target_type as CommentTargetType,
        comment.target_id
      );

      // Check if user can view this comment
      const canView = await this.canViewComment(comment, currentUser, entity);
      
      if (!canView) {
        throw new ForbiddenError('You do not have permission to view this comment');
      }

      return this.formatCommentResponse(comment);
      
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ForbiddenError) {
        throw error;
      }
      throw new InternalServerError(`Failed to get comment detail: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update an existing comment
   * @param params - Update parameters including comment ID and new data
   * @returns Promise<CommentResponse> - The updated comment
   */
  async updateComment(params: UpdateCommentParams): Promise<CommentResponse> {
    const { commentId, userId, content, visibility } = params;

    return await prisma.$transaction(async (tx) => {
      try {
        const existingComment = await tx.comments.findUnique({
          where: { id: commentId },
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

        if (!existingComment) {
          throw new NotFoundError('Comment not found');
        }

        // Check ownership
        if (existingComment.user_id !== userId) {
          throw new ForbiddenError('You do not have permission to update this comment');
        }

        // Prepare update data
        const updateData: Prisma.commentsUpdateInput = {};
        if (content !== undefined) {
          updateData.content = content;
        }
        if (visibility !== undefined) {
          updateData.visibility = visibility;
        }

        // Update the comment
        const updatedComment = await tx.comments.update({
          where: { id: commentId },
          data: updateData,
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

        return this.formatCommentResponse(updatedComment);
        
      } catch (error) {
        if (error instanceof NotFoundError || error instanceof ForbiddenError) {
          throw error;
        }
        throw new InternalServerError(`Failed to update comment: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
  }

  /**
   * Delete a comment
   * @param params - Delete parameters including comment ID and user ID
   * @returns Promise<{message: string}> - Success message
   */
  async deleteComment(params: DeleteCommentParams): Promise<{ message: string }> {
    const { commentId, userId } = params;

    return await prisma.$transaction(async (tx) => {
      try {
        const existingComment = await tx.comments.findUnique({
          where: { id: commentId }
        });

        if (!existingComment) {
          throw new NotFoundError('Comment not found');
        }

        // Check ownership
        if (existingComment.user_id !== userId) {
          throw new ForbiddenError('You do not have permission to delete this comment');
        }

        // Delete the comment (cascade will handle replies)
        await tx.comments.delete({
          where: { id: commentId }
        });

        return { message: 'Comment deleted successfully' };
        
      } catch (error) {
        if (error instanceof NotFoundError || error instanceof ForbiddenError) {
          throw error;
        }
        throw new InternalServerError(`Failed to delete comment: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
  }

  /**
   * Get target entity based on target type and ID
   * @private
   * @param targetType - The type of target entity
   * @param targetId - The ID of target entity
   * @param tx - Optional transaction client
   * @returns Promise<TargetEntity> - The target entity with user_id
   */
  private async getTargetEntity(
    targetType: CommentTargetType,
    targetId: string,
    tx?: Prisma.TransactionClient
  ): Promise<TargetEntity> {
    const client = tx || prisma;
    let entity: TargetEntity | null = null;

    try {
      switch (targetType) {
        case 'post': {
          const post = await client.post.findUnique({
            where: { id: parseInt(targetId) },
            select: { id: true, user_id: true }
          });
          entity = post;
          break;
        }

        case 'circle': {
          const circle = await client.groups.findUnique({
            where: { external_id: targetId },
            select: { id: true, created_by: true }
          });
          if (circle) {
            entity = { id: circle.id, user_id: circle.created_by || 0 };
          }
          break;
        }

        case 'idea': {
          const idea = await client.ideas.findUnique({
            where: { external_id: targetId },
            select: { id: true, user_id: true }
          });
          entity = idea;
          break;
        }

        case 'note': {
          const note = await client.note.findUnique({
            where: { id: parseInt(targetId) },
            include: {
              post: {
                select: { user_id: true }
              }
            }
          });
          if (note && note.post) {
            entity = { id: note.id, user_id: note.post.user_id };
          }
          break;
        }

        case 'outcome': {
          const outcome = await client.outcome.findUnique({
            where: { id: parseInt(targetId) },
            include: {
              post: {
                select: { user_id: true }
              }
            }
          });
          if (outcome) {
            entity = { id: outcome.id, user_id: outcome.post.user_id };
          }
          break;
        }

        case 'review': {
          const review = await client.review.findUnique({
            where: { id: parseInt(targetId) },
            include: {
              post: {
                select: { user_id: true }
              }
            }
          });
          if (review) {
            entity = { id: review.id, user_id: review.post.user_id };
          }
          break;
        }

        case 'resource': {
          // Resources are linked through entity_resources table
          const resourceEntity = await client.entity_resources.findFirst({
            where: {
              entity_type: 'resource',
              entity_id: targetId
            },
            select: { id: true, created_by: true}
          });
          if (resourceEntity) {
            entity = { id: resourceEntity.id, user_id: resourceEntity.created_by };
          }
          break;
        }

        case 'portfolio':
          // Portfolio handling would go here when implemented
          throw new BadRequestError(`Target type '${targetType}' is not yet implemented`);

        default:
          throw new BadRequestError(`Invalid target type: ${targetType}`);
      }

      if (!entity) {
        throw new NotFoundError(`${targetType} with ID ${targetId} not found`);
      }

      return entity;
      
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof BadRequestError) {
        throw error;
      }
      throw new InternalServerError(`Failed to get target entity: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if a user can view a specific comment
   * @private
   * @param comment - The comment to check
   * @param currentUser - The current user
   * @param entity - The target entity
   * @param mentorRelations - Pre-fetched mentor relations (optional)
   * @returns Promise<boolean> - Whether the user can view the comment
   */
  private async canViewComment(
    comment: DatabaseComment,
    currentUser: AuthUser | null | undefined,
    entity: TargetEntity,
    mentorRelations?: MentorParticipantRelation[]
  ): Promise<boolean> {
    // Public comments are visible to everyone
    if (comment.visibility === 'public') {
      return true;
    }

    // Anonymous users cannot see private comments
    if (!currentUser || !currentUser.id) {
      return false;
    }

    const commentUserId = Number(comment.user_id);
    const currentUserId = Number(currentUser.id);
    const entityUserId = Number(entity.user_id);

    // Comment owner can always see their own comments
    if (commentUserId === currentUserId) {
      return true;
    }

    // Target entity owner can see all comments on their content
    if (entityUserId === currentUserId) {
      return true;
    }

    // Mentors can see their participants' comments
    if (currentUser.role === '4') {
      let relations = mentorRelations;
      
      if (!relations) {
        const mentorParticipants = await prisma.mentor_participants.findMany({
          where: { mentor_id: currentUserId }
        });
        relations = mentorParticipants.map(rel => ({
          mentor_id: rel.mentor_id,
          participant_id: rel.participant_id
        }));
      }

      const participantIds = new Set(relations.map(rel => Number(rel.participant_id)));
      if (participantIds.has(commentUserId)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Build a tree structure from flat comment array
   * @private
   * @param comments - Flat array of comments
   * @returns CommentResponse[] - Tree-structured comments
   */
  private buildCommentTree(comments: CommentResponse[]): CommentResponse[] {
    const commentMap = new Map<number, CommentResponse>();
    const rootComments: CommentResponse[] = [];

    // First pass: create map and initialize replies arrays
    comments.forEach(comment => {
      comment.replies = [];
      commentMap.set(comment.id, comment);
    });

    // Second pass: build tree structure
    comments.forEach(comment => {
      if (comment.parent_id) {
        const parent = commentMap.get(comment.parent_id);
        if (parent) {
          parent.replies.push(comment);
        }
      } else {
        rootComments.push(comment);
      }
    });

    return rootComments;
  }

  /**
   * Format comment data for API response
   * @private
   * @param comment - Raw comment data from database
   * @returns CommentResponse - Formatted comment response
   */
  private formatCommentResponse(comment: DatabaseComment): CommentResponse {
    const user: CommentUser = {
      id: comment.users.id,
      name: comment.users.nickname || '',
      _id: comment.users.external_id || '',
      roleList: comment.users.user_positions?.map((up) => up.position.name) || [],
      photoURL: comment.users.contacts?.photo_url || null
    };

    return {
      id: comment.id,
      userId: comment.user_id,
      content: comment.content,
      visibility: comment.visibility as CommentVisibility,
      createdAt: comment.created_at || new Date(),
      updatedAt: comment.updated_at || new Date(),
      parent_id: comment.parent_id,
      user,
      replies: []
    };
  }
}

// Create and export service instance
export const commentService = new CommentService();
export default commentService;