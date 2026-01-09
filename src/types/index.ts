/**
 * Types Index
 * 統一匯出所有型別定義
 */

// API 回應格式類型
export type {
  ApiResponse,
  ApiSuccessResponse,
  ApiErrorResponse,
  PaginatedResponse,
  PaginatedApiResponse,
  CursorPaginatedResponse,
  CursorPaginatedApiResponse,
  PaginationInfo,
  CursorPaginationInfo,
  ResponseMeta
} from './api-response.types';

// 通用類型
export * from './common.types';

// 用戶相關類型
export * from './auth.types';
export * from './user.types';

// 專案相關類型
export * from './project.types';

// 新增的控制器類型 (避免衝突的選擇性匯出)
export type {
  // Milestone types
  MilestoneCreateRequestData,
  MilestoneUpdateRequest,
  MilestoneResponse,
  TaskResponse,
  MilestoneQueryParams,
  MilestoneServiceResult,
  MilestoneValidationError,
  MilestoneStats
} from './milestone.types';

export type {
  // Note types
  NoteCreateRequest,
  NoteUpdateRequest,
  NoteResponse,
  NoteQueryParams,
  NoteServiceResult,
  PaginatedNotesResponse,
  NoteValidationError,
  NoteStats
} from './note.types';

export type {
  // Outcome types
  OutcomeCreateRequest,
  OutcomeUpdateRequest,
  OutcomeResponse,
  OutcomeQueryParams,
  OutcomeServiceResult,
  PaginatedOutcomesResponse,
  OutcomeValidationError,
  OutcomeStats
} from './outcome.types';

export type {
  // Review types
  ReviewCreateRequest,
  ReviewUpdateRequest,
  ReviewResponse,
  ReviewQueryParams,
  ReviewServiceResult,
  ReviewValidationError,
  ReviewStats,
  MoodType,
  StressLevel,
  LearningReviewLevel
} from './review.types';

export type {
  // Mentor types
  MentorMarathonAssignRequest,
  MentorMarathonUpdateRequest,
  MentorMarathonAssignmentResponse,
  MentorParticipantAssignRequest,
  MentorParticipantResponse,
  MentorMarathonResponse,
  ParticipantDetailResponse,
  MentorMarathonParticipantsResponse,
  MentorParticipantReviewsResponse,
  MentorServiceResult,
  MentorValidationError,
  MentorStats
} from './mentor.types';

// 其他現有類型 (選擇性匯出以避免衝突)
export type { CommentTargetType } from './comment.types';
export type { TypedMulterFile, AllowedMimeType } from './image.types';
export type { LogLevel, LogContext, HttpRequestLog } from './logging.types';