import type { Prisma } from '../../generated/prisma';
import { ACTIVE_PROGRAM_WHERE } from '../constants/archive-state';
import { PROGRAM_KINDS } from '../constants/program-kind';
import { ForbiddenError, NotFoundError } from '../middleware/error.middleware';
import { prisma } from './database/prisma.service';

/** Authorize an organization owner or joined leader of this exact Lighthouse binding. */
export async function assertCohortTemplateResourceAccess(
  organizationId: number,
  templateId: number,
  cohortId: number,
  userId: number,
  db: Prisma.TransactionClient = prisma
): Promise<void> {
  const binding = await db.cohort_templates.findFirst({
    where: {
      cohort_id: cohortId,
      template_id: templateId,
      unbound_at: null,
      practice_template: { organization_id: organizationId, deleted_at: null },
      cohort: {
        deleted_at: null,
        program: { organization_id: organizationId, kind: PROGRAM_KINDS.LIGHTHOUSE, ...ACTIVE_PROGRAM_WHERE }
      }
    },
    select: { cohort: { select: { program: { select: { organization: { select: { status: true } } } } } } }
  });
  if (!binding) throw new NotFoundError('找不到有效的場次模板綁定');
  if (binding.cohort.program.organization.status !== 'active') throw new ForbiddenError('此組織目前已停權');

  const [owner, leader] = await Promise.all([
    db.organization_members.findFirst({
      where: { organization_id: organizationId, user_id: userId, role: 'owner' },
      select: { id: true }
    }),
    db.cohort_enrollments.findFirst({
      where: { cohort_id: cohortId, user_id: userId, status: 'joined', role: { in: ['owner', 'assistant'] } },
      select: { id: true }
    })
  ]);
  if (!owner && !leader) throw new ForbiddenError('無權限編輯此場次資源');
}
