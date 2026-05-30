/**
 * Comment system type definitions
 * 
 * This file contains comprehensive TypeScript interfaces and types for the comment system,
 * including core comment interfaces, request/response types, and service method parameters.
 */

import { Request, Response } from 'express';
import { ApiSuccessResponse } from './api-response.types';

// Core comment target types based on the existing system
export type CommentTargetType =
  | 'post'
  | 'resource'
  | 'note'
  | 'outcome'
  | 'review'
  | 'circle'
  | 'idea'
  | 'practice'
  | 'portfolio'
  | 'checkin'
  | 'persona_answer';

// Comment visibility options
export type CommentVisibility = 'public' | 'private';

// Core comment interface matching Prisma schema
export interface Comment {
  id: number;
  target_id: number; // Changed to number for internal ID storage
  target_type: CommentTargetType;
  user_id: number;
  content: string;
  visibility: CommentVisibility;
  parent_id: number | null;
  created_at: Date;
  updated_at: Date;
}

// User information interface for comment responses
export interface CommentUser {
  id: string; // Using external_id as string
  name: string;
  roleList: string[];
  photoURL: string | null;
  customId: string | null;
}

export interface MentionCandidate {
  userId: string;
  numericUserId: number;
  name: string;
  photoURL: string | null;
  customId: string | null;
}

// Comment response interface with user information and nested replies
export interface CommentResponse {
  id: number;
  userId: number;
  targetId: string; // External ID (UUID for circle/idea/resource, string number for others)
  targetType: CommentTargetType;
  content: string;
  visibility: CommentVisibility;
  createdAt: Date;
  updatedAt: Date;
  parent_id: number | null;
  user: CommentUser;
  replies: CommentResponse[];
}

// Request interfaces for API endpoints

// Create comment request interface
export interface CommentCreateRequest {
  targetType: CommentTargetType;
  targetId: string;
  content: string;
  visibility?: CommentVisibility;
  parentId?: number;
  mentionedUserIds?: number[];
}

// Update comment request interface
export interface CommentUpdateRequest {
  content?: string;
  visibility?: CommentVisibility;
  mentionedUserIds?: number[];
}

// Query parameters for getting comments
export interface CommentQueryParams {
  targetType: CommentTargetType;
  targetId: string;
}

// Service method parameter interfaces

// Parameters for creating a comment
export interface CreateCommentParams extends CommentCreateRequest {
  userId: number;
}

// Parameters for updating a comment
export interface UpdateCommentParams {
  commentId: number;
  userId: number;
  content?: string;
  visibility?: CommentVisibility;
  mentionedUserIds?: number[];
}

// Parameters for deleting a comment
export interface DeleteCommentParams {
  commentId: number;
  userId: number;
}

// Parameters for getting comments
export interface GetCommentsParams {
  targetType: CommentTargetType;
  targetId: string;
  currentUser?: AuthUser | null;
}

export interface GetMentionCandidatesParams {
  targetType: CommentTargetType;
  targetId: string;
  currentUser?: AuthUser | null;
  limit?: number;
}

// Parameters for getting comment detail
export interface GetCommentDetailParams {
  commentId: number;
  currentUser?: AuthUser | null;
}

// Authentication and permission interfaces

// Authenticated user interface for permission checking
export interface AuthUser {
  id: number;
  role: string;
}

// Target entity interface for permission checking
export interface TargetEntity {
  id: number;
  user_id: number;
}

// Mentor-participant relationship interface
export interface MentorParticipantRelation {
  mentor_id: number;
  participant_id: number;
}

// Comment with user data interface (internal use)
export interface CommentWithUser extends Comment {
  User: CommentUser;
}

// Database operation result interfaces

// Result interface for comment creation
export interface CreateCommentResult {
  success: boolean;
  data?: CommentResponse;
  error?: string;
}

// Result interface for comment update
export interface UpdateCommentResult {
  success: boolean;
  data?: CommentResponse;
  error?: string;
}

// Result interface for comment deletion
export interface DeleteCommentResult {
  success: boolean;
  message?: string;
  error?: string;
}

// Result interface for getting comments
export interface GetCommentsResult {
  success: boolean;
  data?: CommentResponse[];
  error?: string;
}

// Result interface for getting comment detail
export interface GetCommentDetailResult {
  success: boolean;
  data?: CommentResponse;
  error?: string;
}

// Validation schema types (for Zod integration)

// Create comment validation schema type
export interface CreateCommentSchema {
  targetType: CommentTargetType;
  targetId: string;
  content: string;
  visibility?: CommentVisibility;
  parentId?: number;
}

// Update comment validation schema type
export interface UpdateCommentSchema {
  content?: string;
  visibility?: CommentVisibility;
}

// Get comments query validation schema type
export interface GetCommentsQuerySchema {
  targetType: CommentTargetType;
  targetId: string;
}

// Comment params validation schema type
export interface CommentParamsSchema {
  commentId: number;
}

// Service interface definition
export interface CommentServiceInterface {
  createComment(params: CreateCommentParams): Promise<ApiSuccessResponse<CommentResponse>>;
  getComments(params: GetCommentsParams): Promise<ApiSuccessResponse<CommentResponse[]>>;
  getMentionCandidates(params: GetMentionCandidatesParams): Promise<ApiSuccessResponse<MentionCandidate[]>>;
  getCommentDetail(commentId: number, currentUser?: AuthUser | null): Promise<ApiSuccessResponse<CommentResponse>>;
  updateComment(params: UpdateCommentParams): Promise<ApiSuccessResponse<CommentResponse>>;
  deleteComment(params: DeleteCommentParams): Promise<ApiSuccessResponse<{ message: string }>>;
}

// Database comment type with relations
export interface DatabaseComment {
  id: number;
  target_id: number; // Changed to number for internal ID storage
  target_type: string;
  user_id: number;
  content: string;
  visibility: string | null;
  parent_id: number | null;
  created_at: Date | null;
  updated_at: Date | null;
  users: {
    id: number;
    nickname: string | null;
    external_id: string | null;
    custom_id: string | null;
    user_positions?: Array<{
      position: {
        name: string;
      };
    }>;
    contacts?: {
      photo_url: string | null;
    } | null;
  };
}

// Express Request and Response types

// Controller interface definition
export interface CommentControllerInterface {
  createComment(req: Request, res: Response): Promise<void>;
  getComments(req: Request, res: Response): Promise<void>;
  getMentionCandidates(req: Request, res: Response): Promise<void>;
  getCommentDetail(req: Request, res: Response): Promise<void>;
  updateComment(req: Request, res: Response): Promise<void>;
  deleteComment(req: Request, res: Response): Promise<void>;
}

// Error types specific to comment operations
export type CommentErrorType = 
  | 'COMMENT_NOT_FOUND'
  | 'TARGET_NOT_FOUND'
  | 'INVALID_TARGET_TYPE'
  | 'PERMISSION_DENIED'
  | 'INVALID_PARENT_COMMENT'
  | 'VALIDATION_ERROR'
  | 'DATABASE_ERROR';

// Comment error interface
export interface CommentError {
  type: CommentErrorType;
  message: string;
  details?: Record<string, unknown>;
}

// Permission checking result interface
export interface PermissionCheckResult {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  reason?: string;
}

// Comment tree building options
export interface CommentTreeOptions {
  includeReplies: boolean;
  maxDepth?: number;
  sortOrder?: 'asc' | 'desc';
}

// Comment statistics interface
export interface CommentStatistics {
  totalComments: number;
  publicComments: number;
  privateComments: number;
  repliesCount: number;
  uniqueUsers: number;
}

// Bulk operations interfaces
export interface BulkDeleteCommentsParams {
  commentIds: number[];
  userId: number;
}

export interface BulkUpdateCommentsParams {
  commentIds: number[];
  userId: number;
  updates: Partial<CommentUpdateRequest>;
}

// Export all types - no default export needed as per codebase patterns
