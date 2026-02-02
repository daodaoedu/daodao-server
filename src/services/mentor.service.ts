/**
 * Mentor Service
 * 導師服務層 - 處理導師相關的業務邏輯
 */

import { prisma } from './database/prisma.service';
import type {
  MentorMarathonAssignRequest,
  MentorMarathonUpdateRequest,
  MentorMarathonAssignmentResponse,
  MentorParticipantAssignRequest,
  MentorParticipantResponse,
  MentorMarathonResponse,
  MentorMarathonParticipantsResponse,
  MentorParticipantReviewsResponse,
  ParticipantDetailResponse
} from '../types/mentor.types';
import { ApiSuccessResponse } from '../types/api-response.types';
import { createSuccessResponse } from '../utils/response-helper';
import { NotFoundError, ConflictError, BadRequestError } from '../middleware/error.middleware';
import tagService from './tag.service';

/**
 * 格式化導師馬拉松回應
 */
const formatMentorMarathonResponse = (marathon: Record<string, unknown>, participantCount: number): MentorMarathonResponse => {
  const startDate = marathon.start_date as Date | null;
  const endDate = marathon.end_date as Date | null;
  return {
    id: marathon.id as number,
    eventId: String(marathon.event_id),
    title: marathon.title as string,
    startDate: startDate ? startDate.toISOString().split('T')[0] : '',
    endDate: endDate ? endDate.toISOString().split('T')[0] : '',
    participantCount
  };
};

/**
 * 獲取用戶標籤
 */
const getUserTagsFromMentor = async (userId: number): Promise<string[]> => {
  const tags = await tagService.getEntityTags('user', userId);
  return tags.map(tag => tag.name);
};

/**
 * 格式化參與者詳細資訊
 */
const formatParticipantDetail = async (participant: Record<string, unknown>): Promise<ParticipantDetailResponse> => {
  const userPositions = participant.user_positions as Array<Record<string, unknown>> | undefined;
  const contacts = participant.contacts as Record<string, unknown> | undefined;
  const basicInfo = participant.basic_info as Record<string, unknown> | undefined;
  const location = participant.location as Record<string, unknown> | undefined;
  const city = location?.city as Record<string, unknown> | undefined;
  const updatedAt = participant.updated_at as Date | null;
  const wantToDoList = basicInfo?.want_to_do_list as unknown[] | undefined;
  
  return {
    id: String(participant.id),
    name: participant.nickname as string,
    _id: participant.external_id as string,
    roleList: userPositions?.map(up => {
      const position = up.position as Record<string, unknown> | undefined;
      return position?.name as string;
    }).filter(Boolean) || [],
    photoURL: contacts?.photo_url as string | null || null,
    educationStage: participant.education_stage as string | null || null,
    tagList: await getUserTagsFromMentor(participant.id as number),
    selfIntroduction: basicInfo?.self_introduction as string | null || null,
    location: city?.name as string || '',
    wantToDoList: wantToDoList?.map(item => String(item)) || [],
    share: basicInfo?.share_list as string || '',
    updatedDate: updatedAt ? updatedAt.toISOString() : '',
    projectId: participant.projectId as string || '',
    projectTitle: participant.projectTitle as string || ''
  };
};

/**
 * 指定導師參與馬拉松
 * 注意：根據現有架構，這個功能可能需要通過其他方式實現
 * 目前返回未實現狀態
 */
const assignMentorToMarathon = async (
  _assignData: MentorMarathonAssignRequest
): Promise<ApiSuccessResponse<MentorMarathonAssignmentResponse>> => {
  // 由於 Prisma schema 中沒有 mentor_marathon 表
  // 這個功能需要根據實際的資料庫架構來實現
  throw new BadRequestError('此功能尚未實現 - 需要確認資料庫架構中的 mentor_marathon 關係表');
};

/**
 * 更新導師馬拉松關聯
 * 注意：根據現有架構，這個功能可能需要通過其他方式實現
 */
const updateMentorMarathon = async (
  _assignmentId: number,
  _updateData: MentorMarathonUpdateRequest
): Promise<ApiSuccessResponse<MentorMarathonAssignmentResponse>> => {
  throw new BadRequestError('此功能尚未實現 - 需要確認資料庫架構中的 mentor_marathon 關係表');
};

/**
 * 刪除導師馬拉松關聯
 * 注意：根據現有架構，這個功能可能需要通過其他方式實現
 */
const deleteMentorFromMarathon = async (
  _assignmentId: number
): Promise<ApiSuccessResponse<void>> => {
  throw new BadRequestError('此功能尚未實現 - 需要確認資料庫架構中的 mentor_marathon 關係表');
};

/**
 * 獲取導師參與的馬拉松列表
 * 注意：由於沒有 mentor_marathon 表，這裡提供基於 mentor_participants 的實現
 */
const getMentorMarathons = async (
  mentorId: number
): Promise<ApiSuccessResponse<MentorMarathonResponse[]>> => {
  // 獲取該導師指定的所有參與者 ID
  const mentorParticipants = await prisma.mentor_participants.findMany({
    where: { mentor_id: mentorId }
  });

  const participantIds = mentorParticipants.map(mp => mp.participant_id);

  if (participantIds.length === 0) {
    return createSuccessResponse<MentorMarathonResponse[]>([]);
  }

  // 獲取這些參與者參與的所有馬拉松
  const projectMarathons = await prisma.project_marathon.findMany({
    where: {
      project: {
        user_id: { in: participantIds },
        version: 2
      }
    },
    include: {
      marathon: true
    },
    distinct: ['marathon_id']
  });

  // 計算每個馬拉松的參與者數量
  const results = await Promise.all(projectMarathons.map(async (pm) => {
    if (!pm.marathon) {
      return formatMentorMarathonResponse({ id: 0, event_id: '', title: '', start_date: null, end_date: null }, 0);
    }

    const count = await prisma.project_marathon.count({
      where: { 
        marathon_id: pm.marathon.id,
        project: {
          user_id: { in: participantIds },
          version: 2
        }
      }
    });

    return formatMentorMarathonResponse(pm.marathon, count);
  }));

  return createSuccessResponse(results, {
    totalCount: results.length
  });
};

/**
 * 指定參與者給導師
 */
const assignParticipantToMentor = async (
  mentorId: number,
  assignData: MentorParticipantAssignRequest
): Promise<ApiSuccessResponse<MentorParticipantResponse>> => {
  return await prisma.$transaction(async (tx) => {
    const { participantId } = assignData;

    // 檢查是否已指定
    const existing = await tx.mentor_participants.findFirst({
      where: { 
        mentor_id: mentorId, 
        participant_id: participantId 
      }
    });

    if (existing) {
      throw new ConflictError('該 participant 已指派給 mentor');
    }

    const record = await tx.mentor_participants.create({
      data: {
        mentor_id: mentorId,
        participant_id: participantId
      }
    });

    const response: MentorParticipantResponse = {
      mentorId: record.mentor_id,
      participantId: record.participant_id,
      assignedAt: new Date().toISOString()
    };

    return createSuccessResponse(response, {
      message: '成功指派 participant'
    });
  });
};

/**
 * 更新導師與參與者的關聯
 * 注意：根據目前的資料表結構，mentor_participants 只包含 mentor_id 和 participant_id
 * 不支持直接綁定到特定馬拉松，因為表中沒有 event_id 欄位
 */
const updateMentorParticipant = async (
  mentorId: number,
  participantId: number,
  updateData: { eventId?: string }
): Promise<ApiSuccessResponse<void>> => {
  return await prisma.$transaction(async (tx) => {
    // 檢查關聯記錄是否存在
    const record = await tx.mentor_participants.findFirst({
      where: { 
        mentor_id: mentorId, 
        participant_id: participantId 
      }
    });

    if (!record) {
      throw new NotFoundError('該指派記錄不存在');
    }

    // 目前的資料表結構不支持更新 event_id，因為 mentor_participants 表中沒有此欄位
    // 如果需要此功能，需要修改資料表結構或改變業務邏輯
    if (updateData.eventId) {
      throw new BadRequestError('目前的資料表結構不支援更新馬拉松關聯，需要修改資料庫 schema');
    }

    // 由於 mentor_participants 表只有 mentor_id 和 participant_id，
    // 實際上沒有其他欄位可以更新
    return createSuccessResponse(undefined, {
      message: '導師參與者關聯已存在，無需更新'
    });
  });
};

/**
 * 移除導師與參與者的關聯
 */
const removeMentorParticipant = async (
  mentorId: number,
  participantId: number
): Promise<ApiSuccessResponse<void>> => {
  return await prisma.$transaction(async (tx) => {
    const record = await tx.mentor_participants.findFirst({
      where: { 
        mentor_id: mentorId, 
        participant_id: participantId 
      }
    });

    if (!record) {
      throw new NotFoundError('該指派記錄不存在');
    }

    await tx.mentor_participants.delete({
      where: {
        mentor_id_participant_id: {
          mentor_id: mentorId,
          participant_id: participantId
        }
      }
    });

    return createSuccessResponse(undefined, {
      message: '成功移除該 participant'
    });
  });
};

/**
 * 獲取導師在某個馬拉松的參與者列表
 */
const getMentorParticipantsByMarathon = async (
  mentorId: number,
  eventId: string
): Promise<ApiSuccessResponse<MentorMarathonParticipantsResponse>> => {
  // 查找馬拉松
  const marathon = await prisma.marathon.findUnique({
    where: { event_id: eventId }
  });

  if (!marathon) {
    throw new NotFoundError('找不到該 marathon');
  }

    // 獲取該導師底下所有參與者 ID
    const mentorParticipants = await prisma.mentor_participants.findMany({
      where: { mentor_id: mentorId }
    });

    const participantIds = mentorParticipants.map(mp => mp.participant_id);

    // 從 project_marathon 找出這些參與者有報名此馬拉松的記錄
    const registrations = await prisma.project_marathon.findMany({
      where: { marathon_id: marathon.id },
      include: {
        project: {
          where: { 
            user_id: { in: participantIds },
            version: 2 
          }
        }
      }
    });

    // 整理參與者資訊
    const participantMap: Record<number, { externalId: string; title: string }> = {};
    registrations.forEach(reg => {
      if (reg.project) {
        const userId = reg.project.user_id;
        if (!participantMap[userId]) {
          participantMap[userId] = {
            externalId: reg.project.external_id || '',
            title: reg.project.title
          };
        }
      }
    });

    const participantIdsFromRegistration = Object.keys(participantMap).map(id => parseInt(id));

    // 獲取參與者詳細資訊
    const users = await prisma.users.findMany({
      where: { id: { in: participantIdsFromRegistration } },
      include: {
        roles: true,
        location: {
          include: {
            city: true
          }
        },
        contacts: true,
        basic_info: true,
        user_positions: {
          include: {
            position: true
          }
        }
      }
    });

    // 將專案資訊與用戶資料結合
    const participants = await Promise.all(users.map(async (user) => {
      const projectInfo = participantMap[user.id];
      return await formatParticipantDetail({
        ...user,
        projectId: projectInfo?.externalId || '',
        projectTitle: projectInfo?.title || ''
      });
    }));

    const response: MentorMarathonParticipantsResponse = {
      id: marathon.id,
      eventId: marathon.event_id,
      title: marathon.title,
      startDate: marathon.start_date ? marathon.start_date.toISOString().split('T')[0] : '',
      endDate: marathon.end_date ? marathon.end_date.toISOString().split('T')[0] : '',
      participants
    };

  return createSuccessResponse(response, {
    participantCount: participants.length
  });
};

/**
 * 獲取導師參與者在某個馬拉松的覆盤資料
 */
const getReviewsForMentorParticipants = async (
  mentorId: number,
  eventId: string
): Promise<ApiSuccessResponse<MentorParticipantReviewsResponse>> => {
  // 查找馬拉松
  const marathon = await prisma.marathon.findUnique({
    where: { event_id: eventId }
  });

  if (!marathon) {
    throw new NotFoundError('找不到該 marathon');
  }

    // 獲取該導師底下所有參與者 ID
    const mentorParticipants = await prisma.mentor_participants.findMany({
      where: { mentor_id: mentorId }
    });

    const participantIds = mentorParticipants.map(mp => mp.participant_id);

    // 獲取這些參與者所擁有且有報名該馬拉松的專案記錄
    const projectRegistrations = await prisma.project_marathon.findMany({
      where: { marathon_id: marathon.id },
      include: {
        project: {
          where: { user_id: { in: participantIds } }
        }
      }
    });

    const projectIds = projectRegistrations
      .filter(pr => pr.project)
      .map(pr => pr.project?.id)
      .filter((id): id is number => id !== undefined);

    // 從 Review 獲取這些專案的覆盤資料
    const reviews = await prisma.review.findMany({
      where: {
        post: {
          project_id: { in: projectIds }
        }
      },
      include: {
        post: true
      }
    });

    const validReviews = reviews
      .filter(review => review.post)
      .map(review => {
        const post = review.post;
        if (!post) return null;
        return {
          id: review.id,
          week: post.week || 0,
          title: post.title,
          mood: review.mood,
          stressLevel: review.stress_level,
          moodDescription: review.mood_description || undefined,
          learningReview: review.learning_review?.toString(),
          learningFeedback: review.learning_feedback || undefined,
          adjustmentPlan: review.adjustment_plan || undefined,
          createdAt: review.created_at ? review.created_at.toISOString().split('T')[0] : '',
          updatedAt: review.updated_at ? review.updated_at.toISOString().split('T')[0] : undefined
        };
      })
      .filter((review): review is NonNullable<typeof review> => review !== null);

    const response: MentorParticipantReviewsResponse = {
      marathon: {
        id: marathon.id,
        eventId: marathon.event_id,
        title: marathon.title,
        startDate: marathon.start_date ? marathon.start_date.toISOString().split('T')[0] : '',
        endDate: marathon.end_date ? marathon.end_date.toISOString().split('T')[0] : ''
      },
      reviews: validReviews
    };

  return createSuccessResponse(response, {
    reviewCount: validReviews.length
  });
};

// 匯出服務函數
export const mentorService = {
  assignMentorToMarathon,
  updateMentorMarathon,
  deleteMentorFromMarathon,
  getMentorMarathons,
  assignParticipantToMentor,
  updateMentorParticipant,
  removeMentorParticipant,
  getMentorParticipantsByMarathon,
  getReviewsForMentorParticipants
} as const;