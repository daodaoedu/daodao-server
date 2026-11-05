import type { Prisma } from '../../generated/prisma';

/** Cohort copies are available only through the authorized cohort/practice APIs, including deleted snapshots. */
export const PUBLIC_RESOURCE_WHERE = {
  cohort_template_resources: { is: null },
  users: { isNot: null }
} satisfies Prisma.resourcesWhereInput;
