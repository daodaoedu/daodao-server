import { ForbiddenError } from '../middleware/error.middleware';
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

const draft = async (
  programId: number,
  cohortId: number,
  checkinId: number,
  actorId: number
): Promise<{ checkinId: number; draft: string }> => {
  await assertCoachCheckinAccess(programId, cohortId, checkinId, actorId);
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
