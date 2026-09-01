import type { PrismaClient } from '../../generated/prisma';

type TransactionClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

export const anonymizeCohortEnrollments = async (tx: TransactionClient, userId: number): Promise<number> => {
  const result = await tx.cohort_enrollments.updateMany({
    where: { user_id: userId },
    data: { user_id: null, email: null, invite_token: null }
  });
  return result.count;
};

