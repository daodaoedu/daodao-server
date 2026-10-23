import { ForbiddenError, NotFoundError } from '../middleware/error.middleware';
import type { LighthousePreferenceResponse } from '../validators/lighthouse-preference.validators';
import { prisma } from './database/prisma.service';

/** Read an account preference, revalidating membership and organization status. */
const get = async (userId: number): Promise<LighthousePreferenceResponse> => {
  const user = await prisma.users.findUnique({
    where: { id: userId }, select: { last_lighthouse_organization_id: true }
  });
  if (!user) throw new NotFoundError('找不到使用者');
  if (user.last_lighthouse_organization_id === null) return { organizationId: null };
  const organization = await prisma.organization.findFirst({
    where: {
      id: user.last_lighthouse_organization_id,
      status: 'active', organization_members: { some: { user_id: userId } }
    },
    select: { id: true }
  });
  return { organizationId: organization?.id ?? null };
};

/** Atomically scope the account write to a currently active membership. */
const update = async (userId: number, organizationId: number): Promise<LighthousePreferenceResponse> => {
  const result = await prisma.users.updateMany({
    where: {
      id: userId,
      organization_members: { some: { organization_id: organizationId, organization: { status: 'active' } } }
    },
    data: { last_lighthouse_organization_id: organizationId }
  });
  if (result.count !== 1) throw new ForbiddenError('無權限管理此組織，或組織已停權');
  return { organizationId };
};

export const lighthousePreferenceService = { get, update };
