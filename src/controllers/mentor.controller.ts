/**
 * Mentor Controller
 * 導師控制器 - 處理導師相關的 HTTP 請求
 */

import type { Request, Response } from 'express';
import { mentorService } from '../services/mentor.service';
import { asyncHandler, UnauthorizedError, BadRequestError } from '../middleware/error.middleware';
import { HTTP_STATUS } from '../constants/http-status';
import type {
  MentorMarathonAssignRequest,
  MentorMarathonUpdateRequest,
  MentorParticipantAssignRequest
} from '../types/mentor.types';
import {
  assignMentorToMarathonApiResponseSchema,
  updateMentorMarathonApiResponseSchema,
  deleteMentorFromMarathonApiResponseSchema,
  getMentorMarathonsApiResponseSchema,
  assignParticipantToMentorApiResponseSchema,
  updateMentorParticipantApiResponseSchema,
  removeMentorParticipantApiResponseSchema,
  getMentorParticipantsByMarathonApiResponseSchema,
  getReviewsForMentorParticipantsApiResponseSchema
} from '../validators/mentor.validators';
import type { UserJwtPayload } from '../types/auth.types';

/**
 * 指定導師參與馬拉松
 * 注意：此功能需要 mentor_marathon 表，目前資料庫架構中不存在
 */
export const assignMentorToMarathon = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const assignData: MentorMarathonAssignRequest = req.body;

  const result = await mentorService.assignMentorToMarathon(assignData);
  const validatedResponse = assignMentorToMarathonApiResponseSchema.parse(result);
  res.status(HTTP_STATUS.CREATED).json(validatedResponse);
});

/**
 * 更新導師馬拉松關聯
 * 注意：此功能需要 mentor_marathon 表，目前資料庫架構中不存在
 */
export const updateMentorMarathon = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const assignmentId = parseInt(req.params.assignmentId);
  const updateData: MentorMarathonUpdateRequest = req.body;

  const result = await mentorService.updateMentorMarathon(assignmentId, updateData);
  const validatedResponse = updateMentorMarathonApiResponseSchema.parse(result);
  res.json(validatedResponse);
});

/**
 * 刪除導師馬拉松關聯
 * 注意：此功能需要 mentor_marathon 表，目前資料庫架構中不存在
 */
export const deleteMentorFromMarathon = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const assignmentId = parseInt(req.params.assignmentId);

  const result = await mentorService.deleteMentorFromMarathon(assignmentId);
  const validatedResponse = deleteMentorFromMarathonApiResponseSchema.parse(result);
  res.json(validatedResponse);
});

/**
 * 獲取導師參與的馬拉松列表
 */
export const getMentorMarathons = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user as UserJwtPayload;

  if (!user || !user.id) {
    throw new UnauthorizedError('未授權的請求');
  }

  const mentorId = user.id;

  const result = await mentorService.getMentorMarathons(mentorId);
  const validatedResponse = getMentorMarathonsApiResponseSchema.parse(result);
  res.json(validatedResponse);
});

/**
 * 指定參與者給導師
 */
export const assignParticipantToMentor = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user as UserJwtPayload;
  const assignData: MentorParticipantAssignRequest = req.body;

  if (!user || !user.id) {
    throw new UnauthorizedError('未授權的請求');
  }

  const mentorId = user.id;

  const result = await mentorService.assignParticipantToMentor(mentorId, assignData);
  const validatedResponse = assignParticipantToMentorApiResponseSchema.parse(result);
  res.status(HTTP_STATUS.CREATED).json(validatedResponse);
});

/**
 * 更新導師參與者關聯
 * 注意：由於 mentor_participants 表僅為複合主鍵，通常不需要更新功能
 */
export const updateMentorParticipant = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user as UserJwtPayload;
  const participantId = parseInt(req.params.participantId);
  const updateData = req.body as { eventId?: string };

  if (!user || !user.id) {
    throw new UnauthorizedError('未授權的請求');
  }

  if (isNaN(participantId)) {
    throw new BadRequestError('無效的參與者 ID');
  }

  const mentorId = user.id;

  const result = await mentorService.updateMentorParticipant(
    mentorId,
    participantId,
    updateData
  );
  const validatedResponse = updateMentorParticipantApiResponseSchema.parse(result);
  res.json(validatedResponse);
});

/**
 * 移除導師參與者關聯
 */
export const removeMentorParticipant = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user as UserJwtPayload;
  const participantId = parseInt(req.params.participantId);

  if (!user || !user.id) {
    throw new UnauthorizedError('未授權的請求');
  }

  const mentorId = user.id;

  const result = await mentorService.removeMentorParticipant(mentorId, participantId);
  const validatedResponse = removeMentorParticipantApiResponseSchema.parse(result);
  res.json(validatedResponse);
});

/**
 * 獲取導師在某個馬拉松的參與者列表
 */
export const getMentorParticipantsByMarathon = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user as UserJwtPayload;
  const { eventId } = req.params;

  if (!user || !user.id) {
    throw new UnauthorizedError('未授權的請求');
  }

  const mentorId = user.id;

  const result = await mentorService.getMentorParticipantsByMarathon(mentorId, eventId);
  const validatedResponse = getMentorParticipantsByMarathonApiResponseSchema.parse(result);
  res.json(validatedResponse);
});

/**
 * 獲取導師參與者在某個馬拉松的覆盤資料
 */
export const getReviewsForMentorParticipants = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user as UserJwtPayload;
  const { eventId } = req.params;

  if (!user || !user.id) {
    throw new UnauthorizedError('未授權的請求');
  }

  const mentorId = user.id;

  const result = await mentorService.getReviewsForMentorParticipants(mentorId, eventId);
  const validatedResponse = getReviewsForMentorParticipantsApiResponseSchema.parse(result);
  res.json(validatedResponse);
});