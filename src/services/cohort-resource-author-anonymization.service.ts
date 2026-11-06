import type { Prisma } from '../../generated/prisma';

/** Keep organization-owned copies when an author leaves; ordinary personal resources still cascade. */
export async function anonymizeCohortResourceAuthors(tx: Prisma.TransactionClient, userId: number): Promise<void> {
  await tx.resources.updateMany({
    where: { created_by: userId, cohort_template_resources: { isNot: null } },
    data: { created_by: null }
  });
}
