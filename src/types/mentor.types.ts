/**
 * Mentor Type Definitions
 * 導師相關型別定義
 */

// 直接使用 Prisma 生成的類型
export type { 
  marathon,
  mentor_participants,
  users,
  project,
  review
} from '../../generated/prisma';

import type { UserBasicInfo } from './common.types';
import type { ReviewResponse } from './review.types';

// 導師馬拉松指派相關類型
export interface MentorMarathonAssignRequest {
  mentorId: number;
  eventId: string;
}

export interface MentorMarathonUpdateRequest {
  marathonId?: string;
}

export interface MentorMarathonAssignmentResponse {
  id: number;
  mentorId: number;
  marathonId: number;
  eventId: string;
  assignedAt: string;
}

// 導師參與者指派相關類型
export interface MentorParticipantAssignRequest {
  participantId: number;
}

export interface MentorParticipantResponse {
  mentorId: number;
  participantId: number;
  assignedAt: string;
}

// 導師馬拉松回應類型
export interface MentorMarathonResponse {
  id: number;
  eventId: string;
  title: string;
  startDate: string;
  endDate: string;
  participantCount: number;
}

// 參與者詳細資訊類型
export interface ParticipantDetailResponse extends UserBasicInfo {
  location: string;
  wantToDoList: string[];
  share: string | string[];
  updatedDate: string;
  projectId: string;
  projectTitle: string;
}

// 導師馬拉松參與者回應類型
export interface MentorMarathonParticipantsResponse {
  id: number;
  eventId: string;
  title: string;
  startDate: string;
  endDate: string;
  participants: ParticipantDetailResponse[];
}

// 導師參與者覆盤回應類型
export interface MentorParticipantReviewsResponse {
  marathon: {
    id: number;
    eventId: string;
    title: string;
    startDate: string;
    endDate: string;
  };
  reviews: ReviewResponse[];
}

export interface MentorServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 導師驗證相關類型
export interface MentorValidationError {
  field: string;
  message: string;
}

// 導師統計類型
export interface MentorStats {
  totalMarathons: number;
  totalParticipants: number;
  activeMarathons: number;
  completedMarathons: number;
  averageParticipantsPerMarathon: number;
}