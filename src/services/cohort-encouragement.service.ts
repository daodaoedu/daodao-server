import { ForbiddenError } from '../middleware/error.middleware';
import { aiBackendClient } from './ai-backend.client';
import { commentService } from './comment.service';
import { prisma } from './database/prisma.service';
import { getRandomEncouragement } from './encouragement.service';

const assertCoachCheckinAccess = async (
  programId: number,
  cohortId: number,
  checkinId: number,
  actorId: number
): Promise<void> => {
  const checkin = await prisma.practice_checkins.findFirst({
    where: {
      id: checkinId,
      practices: {
        cohort_id: cohortId,
        deleted_at: null,
        cohorts: {
          id: cohortId,
          program_id: programId,
          program: {
            organization: {
              organization_members: { some: { user_id: actorId, role: 'owner' } }
            }
          }
        }
      }
    },
    select: { id: true }
  });
  if (!checkin) throw new ForbiddenError('無權限回應此期打卡');
};

const fetchCheckinContext = async (checkinId: number): Promise<{
  mood: string | null;
  note: string | null;
  practiceTitle: string;
  learnerNickname: string | null;
}> => {
  const checkin = await prisma.practice_checkins.findUnique({
    where: { id: checkinId },
    select: {
      mood: true,
      note: true,
      practices: {
        select: {
          title: true,
          users: { select: { nickname: true } }
        }
      }
    }
  });
  return {
    mood: checkin?.mood ?? null,
    note: checkin?.note ?? null,
    practiceTitle: checkin?.practices?.title ?? '',
    learnerNickname: checkin?.practices?.users?.nickname ?? null,
  };
};

/** 走 ai-backend 產草稿；轉發使用者 JWT（ai-backend 沒 token 會 401，之前一律 fallback 到句庫） */
const generateAiDraft = async (context: {
  mood: string | null;
  note: string | null;
  practiceTitle: string;
  learnerNickname: string | null;
}, userToken: string | null): Promise<string | null> => {
  if (!aiBackendClient.isConfigured()) return null;
  try {
    const data = await aiBackendClient.post<{ draft?: string }>('/api/v1/encouragement/generate', context, { userToken, timeoutMs: 15000 });
    return data.draft?.trim() || null;
  } catch {
    return null;
  }
};

const draft = async (
  programId: number,
  cohortId: number,
  checkinId: number,
  actorId: number,
  userToken: string | null = null
): Promise<{ checkinId: number; draft: string }> => {
  await assertCoachCheckinAccess(programId, cohortId, checkinId, actorId);

  const context = await fetchCheckinContext(checkinId);
  const aiDraft = await generateAiDraft(context, userToken);
  if (aiDraft) return { checkinId, draft: aiDraft };

  const encouragement = await getRandomEncouragement();
  return { checkinId, draft: encouragement.data.message };
};

const submit = async (
  programId: number,
  cohortId: number,
  checkinId: number,
  actorId: number,
  content: string
): Promise<{ commentId: number; checkinId: number; content: string; userId: number }> => {
  await assertCoachCheckinAccess(programId, cohortId, checkinId, actorId);
  const result = await commentService.createComment({
    targetType: 'checkin',
    targetId: String(checkinId),
    content,
    visibility: 'private',
    userId: actorId
  });
  return { commentId: result.data.id, checkinId, content: result.data.content, userId: result.data.userId };
};

export const cohortEncouragementService = { draft, submit };
