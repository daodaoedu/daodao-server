import type { PrismaClient } from '../../generated/prisma';

type TransactionClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

/** 由開始日與持續天數推算結束日（與 practice.service.create 一致：含頭尾共 durationDays 天） */
const addDays = (start: Date, durationDays: number): Date => {
  const end = new Date(start);
  end.setDate(end.getDate() + durationDays - 1);
  return end;
};

/** 把模板掛的資源複製到本次產生的草稿上（共用同一筆 resources，只加關聯） */
const copyTemplateResources = async (tx: TransactionClient, cohortId: number, userId: number, templateIds: number[]): Promise<void> => {
  const templateResources = await tx.entity_resources.findMany({
    where: { entity_type: 'practice_template', entity_id: { in: templateIds }, deleted_at: null },
    select: { entity_id: true, resource_id: true }
  });
  if (templateResources.length === 0) return;

  const drafts = await tx.practices.findMany({
    where: { user_id: userId, cohort_id: cohortId, creation_source: 'cohort_template', template_id: { in: templateIds }, deleted_at: null },
    select: { id: true, template_id: true }
  });
  const links = drafts.flatMap(draft => templateResources
    .filter(resource => resource.entity_id === draft.template_id)
    .map(resource => ({ resource_id: resource.resource_id, entity_type: 'practice', entity_id: draft.id, created_by: userId })));
  if (links.length === 0) return;

  await tx.entity_resources.createMany({ data: links, skipDuplicates: true });
  await tx.practices.updateMany({ where: { id: { in: [...new Set(links.map(link => link.entity_id))] } }, data: { has_resources: true } });
};

export const ensureCohortDrafts = async (tx: TransactionClient, cohortId: number, userId: number): Promise<number> => {
  const [cohort, bindings] = await Promise.all([
    tx.cohorts.findUnique({ where: { id: cohortId }, select: { start_date: true } }),
    tx.cohort_templates.findMany({
      where: { cohort_id: cohortId, unbound_at: null },
      select: { template_id: true, practice_template: { select: { title: true, practice_action: true, duration_days: true, frequency_min_days: true, frequency_max_days: true, session_duration_minutes: true, practice_time_periods: true, other_context: true } } }
    })
  ]);
  if (bindings.length === 0) return 0;

  // 模板本身沒有開始日；沿用本期的開始日，避免學員拿到開始日空白的草稿
  const startDate = cohort?.start_date ?? null;
  const result = await tx.practices.createMany({
    data: bindings.map(binding => ({
      user_id: userId, cohort_id: cohortId, template_id: binding.template_id,
      title: binding.practice_template.title, practice_action: binding.practice_template.practice_action,
      start_date: startDate,
      end_date: startDate && binding.practice_template.duration_days ? addDays(startDate, binding.practice_template.duration_days) : null,
      duration_days: binding.practice_template.duration_days, frequency_min_days: binding.practice_template.frequency_min_days,
      frequency_max_days: binding.practice_template.frequency_max_days, session_duration_minutes: binding.practice_template.session_duration_minutes,
      practice_time_periods: binding.practice_template.practice_time_periods, other_context: binding.practice_template.other_context,
      status: 'draft', creation_source: 'cohort_template'
    })),
    skipDuplicates: true
  });

  await copyTemplateResources(tx, cohortId, userId, bindings.map(binding => binding.template_id));
  return result.count;
};
