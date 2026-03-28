import { prisma } from './database/prisma.service';

const prismaClient = prisma;

export type SocialProofType = 'insightful' | 'referenced' | 'witnessed';

/**
 * Toggle social proof：同一使用者同一類型只能標記一次（再次呼叫則取消）
 */
export async function toggleSocialProof(
  practiceId: number,
  actorId: number,
  type: SocialProofType
): Promise<{ action: 'added' | 'removed' }> {
  const existing = await prismaClient.practice_social_proofs.findUnique({
    where: {
      practice_id_actor_id_type: {
        practice_id: practiceId,
        actor_id: actorId,
        type
      }
    }
  });

  if (existing) {
    await prismaClient.practice_social_proofs.delete({
      where: { id: existing.id }
    });
    return { action: 'removed' };
  } else {
    await prismaClient.practice_social_proofs.create({
      data: { practice_id: practiceId, actor_id: actorId, type }
    });
    return { action: 'added' };
  }
}

/**
 * 取得當前使用者對某實踐的三項見證狀態
 */
export async function getSocialProofStatus(
  practiceId: number,
  actorId: number
): Promise<{ insightful: boolean; referenced: boolean; witnessed: boolean }> {
  const records = await prismaClient.practice_social_proofs.findMany({
    where: { practice_id: practiceId, actor_id: actorId }
  });

  const types = new Set(records.map(r => r.type));
  return {
    insightful: types.has('insightful'),
    referenced: types.has('referenced'),
    witnessed: types.has('witnessed')
  };
}

/**
 * 取得實踐的見證計數
 */
export async function getSocialProofCounts(
  practiceId: number
): Promise<{ insightfulCount: number; referencedCount: number; witnessedCount: number }> {
  const counts = await prismaClient.practice_social_proofs.groupBy({
    by: ['type'],
    where: { practice_id: practiceId },
    _count: { type: true }
  });

  return {
    insightfulCount: counts.find(r => r.type === 'insightful')?._count.type ?? 0,
    referencedCount: counts.find(r => r.type === 'referenced')?._count.type ?? 0,
    witnessedCount: counts.find(r => r.type === 'witnessed')?._count.type ?? 0
  };
}
