import type { PrismaClient } from '../../generated/prisma';

type TransactionClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

export const ensureCohortDrafts = async (tx: TransactionClient, cohortId: number, userId: number): Promise<number> => {
  const bindings = await tx.cohort_templates.findMany({
    where: { cohort_id: cohortId, unbound_at: null },
    select: { template_id: true, practice_template: { select: { title: true, practice_action: true, duration_days: true, frequency_min_days: true, frequency_max_days: true, session_duration_minutes: true, practice_time_periods: true, other_context: true } } }
  });
  if (bindings.length === 0) return 0;
  const result = await tx.practices.createMany({
    data: bindings.map(binding => ({
      user_id: userId, cohort_id: cohortId, template_id: binding.template_id,
      title: binding.practice_template.title, practice_action: binding.practice_template.practice_action,
      duration_days: binding.practice_template.duration_days, frequency_min_days: binding.practice_template.frequency_min_days,
      frequency_max_days: binding.practice_template.frequency_max_days, session_duration_minutes: binding.practice_template.session_duration_minutes,
      practice_time_periods: binding.practice_template.practice_time_periods, other_context: binding.practice_template.other_context,
      status: 'draft', creation_source: 'cohort_template'
    })),
    skipDuplicates: true
  });
  return result.count;
};

