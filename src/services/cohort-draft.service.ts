import type { PrismaClient } from '../../generated/prisma';
import { DURATION_DAYS_MAX } from '../validators/practice.validators';
import { day, today } from './cohort-run-state';

type TransactionClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

/** 由開始日與持續天數推算結束日（與 practice.service.create 一致：含頭尾共 durationDays 天） */
const addDays = (start: Date, durationDays: number): Date => {
  const end = new Date(start);
  end.setDate(end.getDate() + durationDays - 1);
  return end;
};

const MS_PER_DAY = 86_400_000;

/**
 * 推算複製實踐的期間：模板有天數 → 開始日 + 天數 − 1；
 * 模板沒有天數 → 沿用本期結束日並回推天數（daodao#295：null end_date 的 not_started／active 實踐
 * 會被 completeExpiredPractices 以 created_at + 14 天提早完成）。
 * 開始日晚於本期結束日時不硬湊期間，維持 null。
 */
const resolvePeriod = (
  startDate: Date | null,
  templateDurationDays: number | null,
  cohortEndDate: Date | null
): { endDate: Date | null; durationDays: number | null } => {
  if (!startDate) return { endDate: null, durationDays: templateDurationDays };
  if (templateDurationDays) return { endDate: addDays(startDate, templateDurationDays), durationDays: templateDurationDays };
  if (!cohortEndDate || cohortEndDate.getTime() < startDate.getTime()) return { endDate: null, durationDays: null };
  // 結束日一律沿用本期；回推天數超過 practices.duration_days CHECK（1–90，migration 083）時留 null——
  // CHECK 允許 NULL，到期判斷（checkHasPassedEndDate）以 end_date 為準，不會退回 created_at + 14 天
  const inferred = Math.round((cohortEndDate.getTime() - startDate.getTime()) / MS_PER_DAY) + 1;
  return { endDate: cohortEndDate, durationDays: inferred <= DURATION_DAYS_MAX ? inferred : null };
};

/** 把模板掛的資源複製到本次產生的草稿上（共用同一筆 resources，只加關聯） */
const copyTemplateResources = async (tx: TransactionClient, cohortId: number, userId: number, templateIds: number[]): Promise<void> => {
  const templateResources = await tx.entity_resources.findMany({
    where: { entity_type: 'practice_template', entity_id: { in: templateIds }, deleted_at: null },
    select: { entity_id: true, resource_id: true, note: true }
  });
  if (templateResources.length === 0) return;

  const drafts = await tx.practices.findMany({
    where: { user_id: userId, cohort_id: cohortId, creation_source: 'cohort_template', template_id: { in: templateIds }, deleted_at: null },
    select: { id: true, template_id: true }
  });
  // note 帶著「第幾天使用」（day:N），要跟著複製，學員端才知道資源排在哪一天
  const links = drafts.flatMap(draft => templateResources
    .filter(resource => resource.entity_id === draft.template_id)
    .map(resource => ({ resource_id: resource.resource_id, entity_type: 'practice', entity_id: draft.id, created_by: userId, note: resource.note })));
  if (links.length === 0) return;

  await tx.entity_resources.createMany({ data: links, skipDuplicates: true });
  await tx.practices.updateMany({ where: { id: { in: [...new Set(links.map(link => link.entity_id))] } }, data: { has_resources: true } });
};

/**
 * 複製出的實踐初始狀態：燈塔場次預設草稿（學員自行啟用）；
 * 共同挑戰沒有啟用步驟，用 by_period 依「每個綁定的實際開始日」給未開始／進行中（daodao#295）——
 * 綁定可釘選自己的開始日，不能用整期狀態一次決定。
 */
export type CohortPracticeInitialStatus = 'draft' | 'not_started' | 'active' | 'by_period';

const statusByStart = (startDate: Date | null, now: Date): 'not_started' | 'active' =>
  startDate && day(startDate) <= today(now) ? 'active' : 'not_started';

export const ensureCohortDrafts = async (
  tx: TransactionClient,
  cohortId: number,
  userId: number,
  options: { status?: CohortPracticeInitialStatus; now?: Date } = {}
): Promise<number> => {
  const requestedStatus = options.status ?? 'draft';
  const now = options.now ?? new Date();
  const [cohort, bindings] = await Promise.all([
    tx.cohorts.findUnique({ where: { id: cohortId }, select: { start_date: true, end_date: true, is_private: true } }),
    tx.cohort_templates.findMany({
      where: { cohort_id: cohortId, unbound_at: null },
      select: { template_id: true, start_date: true, practice_template: { select: { title: true, practice_action: true, duration_days: true, frequency_min_days: true, frequency_max_days: true, session_duration_minutes: true, practice_time_periods: true, other_context: true } } }
    })
  ]);
  if (bindings.length === 0) return 0;

  // D7：依 is_private 決定實踐的 privacy_status
  const privacyStatus = cohort?.is_private ? 'private' : 'public';

  // 開始日優先用綁定時指定的；沒指定就沿用本期的，避免學員拿到開始日空白的草稿
  const result = await tx.practices.createMany({
    data: bindings.map(binding => {
      const startDate = binding.start_date ?? cohort?.start_date ?? null;
      const period = resolvePeriod(startDate, binding.practice_template.duration_days, cohort?.end_date ?? null);
      const status = requestedStatus === 'by_period' ? statusByStart(startDate, now) : requestedStatus;
      return {
      user_id: userId, cohort_id: cohortId, template_id: binding.template_id,
      title: binding.practice_template.title, practice_action: binding.practice_template.practice_action,
      start_date: startDate,
      end_date: period.endDate,
      duration_days: period.durationDays, frequency_min_days: binding.practice_template.frequency_min_days,
      frequency_max_days: binding.practice_template.frequency_max_days, session_duration_minutes: binding.practice_template.session_duration_minutes,
      practice_time_periods: binding.practice_template.practice_time_periods, other_context: binding.practice_template.other_context,
      status, creation_source: 'cohort_template',
      privacy_status: privacyStatus
      };
    }),
    skipDuplicates: true
  });

  await copyTemplateResources(tx, cohortId, userId, bindings.map(binding => binding.template_id));
  return result.count;
};
