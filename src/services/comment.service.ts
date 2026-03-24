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
import idConverter, { EntityType } from './id-converter.service';
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
} from '../middleware/error.middleware';
import {
  ApiSuccessResponse
} from '../types/api-response.types';
import { createSuccessResponse } from '../utils/response-helper';
import { interactionCountService } from './interaction-count.service';
import { notificationEventService } from './notification-event.service';
import { loggerService } from './logging/logger.service';

/**
 * Comment Service Class
 * Implements comprehensive comment management with Prisma integration
 */
export class CommentService implements CommentServiceInterface {
  
  /**
   * Create a new comment
   * @param params - Comment creation parameters
   * @returns Promise<ApiSuccessResponse<CommentResponse>> - The created comment with user data
   */
  async createComment(params: CreateCommentParams): Promise<ApiSuccessResponse<CommentResponse>> {
    const { targetType, targetId, content, visibility = 'private', parentId, userId } = params;

    return await prisma.$transaction(async (tx) => {
      try {
        // Validate required parameters
        if (!targetType || !targetId || !content || !userId) {
          throw new BadRequestError('Missing required parameters: targetType, targetId, content, or userId');
        }

        // Validate target entity exists and get internal ID
        const targetEntity = await idConverter.getTargetEntity(targetType as EntityType, targetId);
        const internalTargetId = targetEntity.id;
        
        // Validate parent comment if provided
        if (parentId) {
          const parentComment = await tx.comments.findUnique({
            where: { id: parentId }
          });
          
          if (!parentComment) {
            throw new NotFoundError('Parent comment not found');
          }

          // Enforce two-level limit: replies cannot have their own replies
          if (parentComment.parent_id) {
            throw new BadRequestError('Replies cannot have their own replies');
          }
          
          // Ensure parent comment belongs to the same target (using internal ID)
          if (parentComment.target_type !== targetType || parentComment.target_id !== internalTargetId) {
            throw new BadRequestError('Parent comment does not belong to the same target entity');
          }
        }

        // Create the comment using unchecked input for direct field access
        // IMPORTANT: Use internal ID for target_id field
        const commentData: Prisma.commentsUncheckedCreateInput = {
          target_type: targetType,
          target_id: internalTargetId, // Use internal int ID, not external UUID
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

        // 更新互動計數（留言者與內容擁有者不同時）
        if (userId !== targetEntity.user_id && targetEntity.user_id) {
          interactionCountService.increment(userId, targetEntity.user_id).catch(() => undefined);
        }

        // Fire-and-forget: Comment 通知給內容擁有者
        if (targetEntity.user_id) {
          let practiceTitle: string | undefined;
          if (targetType === 'practice') {
            const practice = await tx.practices.findUnique({
              where:  { id: targetEntity.id },
              select: { title: true },
            });
            practiceTitle = practice?.title ?? undefined;
          }
          notificationEventService.createEvent({
            type:        'comment',
            actorId:     userId,
            recipientId: targetEntity.user_id,
            entityType:  'comment',
            entityId:    createdComment.id,
            payload: {
              content,
              ...(practiceTitle !== undefined && { practice_title: practiceTitle }),
            },
            priority: 'P2',
          }).catch(() => {});
        }

        // Fire-and-forget: mention 通知給被 @mention 的使用者
        const mentionedUserIds = params.mentionedUserIds;
        if (mentionedUserIds && mentionedUserIds.length > 0) {
          // Security: only allow as many mentionedUserIds as @mention patterns in content
          const mentionPatterns = content.match(/@[\w]+/g) ?? [];
          if (mentionPatterns.length < mentionedUserIds.length) {
            loggerService.warn('[CommentService] mentionedUserIds count exceeds @mentions in content', {
              mentionedCount: mentionedUserIds.length,
              contentMentions: mentionPatterns.length,
              userId,
            });
          }
          const safeUserIds = mentionedUserIds.slice(0, Math.max(mentionPatterns.length, 0));
          const ownerId = targetEntity.user_id ?? null;
          const uniqueIds = [...new Set(safeUserIds)].filter(
            (id) => id !== userId && id !== ownerId
          );

          if (uniqueIds.length > 0) {
            try {
              const foundUsers = await tx.users.findMany({
                where: { id: { in: uniqueIds } },
                select: { id: true },
              });
              const validIds = foundUsers.map((u) => u.id);

              // targetType → URL path mapping
              const pathSegmentMap: Record<string, string> = {
                check_in: 'check-ins',
                practice:  'practices',
                post:      'posts',
                resource:  'resources',
                note:      'notes',
                outcome:   'outcomes',
                review:    'reviews',
                circle:    'circles',
                idea:      'ideas',
                portfolio: 'portfolios',
              };
              const frontendUrl = process.env.FRONTEND_URL ?? '';
              const segment = pathSegmentMap[targetType];
              if (!segment) {
                loggerService.warn(`[CommentService] Missing URL path segment for targetType: "${targetType}"`);
              }
              const url = segment
                ? `${frontendUrl}/${segment}/${targetId}`
                : frontendUrl;
              const actorName = createdComment.users.nickname ?? undefined;

              for (const recipientId of validIds) {
                notificationEventService.createEvent({
                  type:        'mention',
                  actorId:     userId,
                  recipientId,
                  entityType:  'comment',
                  entityId:    createdComment.id,
                  priority:    'P1',
                  payload:     { content, actorName, url },
                });
              }
            } catch (error) {
              loggerService.error('[CommentService] Failed to create mention notification events', {
                error,
                commentId: createdComment.id,
              });
            }
          }
        }

        // Format and return the response
        const formattedComment = await this.formatCommentResponse(createdComment);
        return createSuccessResponse(formattedComment);
        
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
   * @returns Promise<ApiSuccessResponse<CommentResponse[]>> - Array of comments in tree structure
   */
  async getComments(params: GetCommentsParams): Promise<ApiSuccessResponse<CommentResponse[]>> {
    const { targetType, targetId, currentUser } = params;

    try {
      // Validate target entity exists and get internal ID
      const entity = await idConverter.getTargetEntity(targetType as EntityType, targetId);
      const internalTargetId = entity.id;

      // Get all comments for the target using internal ID
      const comments = await prisma.comments.findMany({
        where: {
          target_type: targetType,
          target_id: internalTargetId // Use internal int ID, not external UUID
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
          created_at: 'desc'
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
          visibleComments.push(await this.formatCommentResponse(comment));
        }
      }

      // Build and return comment tree
      const commentTree = this.buildCommentTree(visibleComments);
      return createSuccessResponse(commentTree, {
        searchQuery: `${targetType}:${targetId}`,
        filters: { targetType, targetId }
      });
      
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
   * @returns Promise<ApiSuccessResponse<CommentResponse>> - The comment details
   */
  async getCommentDetail(commentId: number, currentUser?: AuthUser | null): Promise<ApiSuccessResponse<CommentResponse>> {
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
      // target_id is stored as an internal integer — query the correct table directly
      // instead of calling getTargetEntity (which expects an external UUID for most types)
      const entity = await this.getTargetEntityByInternalId(
        comment.target_type as EntityType,
        comment.target_id
      );

      // Check if user can view this comment
      const canView = await this.canViewComment(comment, currentUser, entity);
      
      if (!canView) {
        throw new ForbiddenError('You do not have permission to view this comment');
      }

      const formattedComment = await this.formatCommentResponse(comment);
      return createSuccessResponse(formattedComment);
      
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
   * @returns Promise<ApiSuccessResponse<CommentResponse>> - The updated comment
   */
  async updateComment(params: UpdateCommentParams): Promise<ApiSuccessResponse<CommentResponse>> {
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

        const formattedComment = await this.formatCommentResponse(updatedComment);
        return createSuccessResponse(formattedComment);
        
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
   * @returns Promise<ApiSuccessResponse<{ message: string }>> - Success message
   */
  async deleteComment(params: DeleteCommentParams): Promise<ApiSuccessResponse<{ message: string }>> {
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

        return createSuccessResponse({ message: 'Comment deleted successfully' });
        
      } catch (error) {
        if (error instanceof NotFoundError || error instanceof ForbiddenError) {
          throw error;
        }
        throw new InternalServerError(`Failed to delete comment: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
  }


  /**
   * Fetch target entity info by internal integer ID (for permission checking)
   * @private
   * @param targetType - The entity type
   * @param internalId - The internal integer ID stored in comments.target_id
   * @returns Promise<TargetEntity> - Entity with id and user_id
   */
  private async getTargetEntityByInternalId(
    targetType: EntityType,
    internalId: number
  ): Promise<TargetEntity> {
    let entity: TargetEntity | null = null;

    switch (targetType) {
      case 'post': {
        const post = await prisma.post.findUnique({
          where: { id: internalId },
          select: { id: true, user_id: true }
        });
        if (post) {
          entity = { id: post.id, user_id: post.user_id || 0 };
        }
        break;
      }

      case 'circle': {
        const circle = await prisma.groups.findUnique({
          where: { id: internalId },
          select: { id: true, created_by: true }
        });
        if (circle) {
          entity = { id: circle.id, user_id: circle.created_by || 0 };
        }
        break;
      }

      case 'idea': {
        const idea = await prisma.ideas.findUnique({
          where: { id: internalId },
          select: { id: true, user_id: true }
        });
        if (idea) {
          entity = { id: idea.id, user_id: idea.user_id || 0 };
        }
        break;
      }

      case 'note': {
        const note = await prisma.note.findUnique({
          where: { id: internalId },
          include: { post: { select: { user_id: true } } }
        });
        if (note && note.post) {
          entity = { id: note.id, user_id: note.post.user_id };
        }
        break;
      }

      case 'outcome': {
        const outcome = await prisma.outcome.findUnique({
          where: { id: internalId },
          include: { post: { select: { user_id: true } } }
        });
        if (outcome && outcome.post) {
          entity = { id: outcome.id, user_id: outcome.post.user_id };
        }
        break;
      }

      case 'review': {
        const review = await prisma.review.findUnique({
          where: { id: internalId },
          include: { post: { select: { user_id: true } } }
        });
        if (review && review.post) {
          entity = { id: review.id, user_id: review.post.user_id };
        }
        break;
      }

      case 'resource': {
        const resource = await prisma.resources.findUnique({
          where: { id: internalId },
          select: { id: true, created_by: true }
        });
        if (resource) {
          entity = { id: resource.id, user_id: resource.created_by };
        }
        break;
      }

      case 'practice': {
        const practice = await prisma.practices.findUnique({
          where: { id: internalId },
          select: { id: true, user_id: true }
        });
        if (practice) {
          entity = { id: practice.id, user_id: practice.user_id };
        }
        break;
      }

      default:
        throw new InternalServerError(`Unsupported target type: ${targetType}`);
    }

    if (!entity) {
      throw new NotFoundError(`${targetType} not found for internal id: ${internalId}`);
    }

    return entity;
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

    // Replies keep chronological order (oldest first) for conversation context
    rootComments.forEach(comment => {
      if (comment.replies && comment.replies.length > 1) {
        comment.replies.sort((a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      }
    });

    return rootComments;
  }

  /**
   * Convert internal ID back to external ID for API response
   * @private
   * @param targetType - The type of target entity
   * @param internalId - The internal integer ID
   * @returns Promise<string> - The external ID (UUID or string number)
   */
  private async convertToExternalId(targetType: CommentTargetType, internalId: number): Promise<string> {
    try {
      switch (targetType) {
        case 'post': {
          // Post uses internal ID directly
          return internalId.toString();
        }

        case 'note': {
          // Note uses internal ID directly
          return internalId.toString();
        }

        case 'outcome': {
          // Outcome uses internal ID directly
          return internalId.toString();
        }

        case 'review': {
          // Review uses internal ID directly
          return internalId.toString();
        }

        case 'circle': {
          // Circle uses external_id (UUID)
          const circle = await prisma.groups.findUnique({
            where: { id: internalId },
            select: { external_id: true }
          });
          return circle?.external_id || internalId.toString();
        }

        case 'idea': {
          // Idea uses external_id (UUID)
          const idea = await prisma.ideas.findUnique({
            where: { id: internalId },
            select: { external_id: true }
          });
          return idea?.external_id || internalId.toString();
        }

        case 'resource': {
          // Resource uses external_id (UUID)
          const resource = await prisma.resources.findUnique({
            where: { id: internalId },
            select: { external_id: true }
          });
          return resource?.external_id || internalId.toString();
        }

        case 'practice': {
          // Practice uses external_id (UUID)
          const practice = await prisma.practices.findUnique({
            where: { id: internalId },
            select: { external_id: true }
          });
          return practice?.external_id || internalId.toString();
        }

        case 'portfolio':
          // Portfolio handling would go here when implemented
          return internalId.toString();

        default:
          return internalId.toString();
      }
    } catch (error) {
      // Fallback to string number if conversion fails
      console.warn(`Failed to convert internal ID ${internalId} for ${targetType}:`, error);
      return internalId.toString();
    }
  }

  /**
   * Format comment data for API response
   * @private
   * @param comment - Raw comment data from database
   * @returns Promise<CommentResponse> - Formatted comment response
   */
  private async formatCommentResponse(comment: DatabaseComment): Promise<CommentResponse> {
    const user: CommentUser = {
      id: comment.users.external_id || '',
      name: comment.users.nickname || '',
      roleList: comment.users.user_positions?.map((up) => up.position.name) || [],
      photoURL: comment.users.contacts?.photo_url || null,
      customId: comment.users.custom_id ?? null
    };

    // Convert internal target_id back to external ID for frontend
    const externalTargetId = await this.convertToExternalId(
      comment.target_type as CommentTargetType, 
      comment.target_id
    );

    return {
      id: comment.id,
      userId: comment.user_id,
      targetId: externalTargetId, // Return external ID as string
      targetType: comment.target_type as CommentTargetType,
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
