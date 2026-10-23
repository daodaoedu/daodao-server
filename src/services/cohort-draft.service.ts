import type { PrismaClient } from '../../generated/prisma';
import { MS_PER_DAY, inclusiveEndDate } from '../utils/date-utils';
import { sanitizePracticeTimePeriods } from '../utils/practice-time-periods';
import { DURATION_DAYS_MAX } from '../validators/practice.validators';
import { day, today } from './cohort-run-state';

type TransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

/**
 * 含頭尾的天數；超過 practices.duration_days CHECK（1–91，migration 092）時回 null（CHECK 允許 NULL）。
 * 後台建立共同挑戰已限制期間 ≤ DURATION_DAYS_MAX（daodao#300），null 只剩防禦用途（例如上限前建立的舊挑戰）。
 */
const inclusiveDays = (start: Date, end: Date): number | null => {
  const days = Math.round((end.getTime() - start.getTime()) / MS_PER_DAY) + 1;
  return days <= DURATION_DAYS_MAX ? days : null;
};

/**
 * 推算複製實踐的期間（daodao#295）：
 * - 模板有天數 → 開始日 + 天數 − 1
 *   - 共同挑戰（clampToCohort）：結束日不超出本期（FR-CC-03 固定時段），超出時截到本期結束日並重算天數；
 *     開始日晚於本期結束日 → 期間為 null（by_period 會因此保持草稿）
 *   - 燈塔場次：不截，與 organizationTemplateService.map 給教練看的「開始日 + 天數 − 1」一致
 * - 模板沒有天數 → 沿用本期結束日並回推天數（null end_date 的 not_started／active 實踐
 *   會被 completeExpiredPractices 以 created_at + 14 天提早完成）；回推超過 DURATION_DAYS_MAX（91）天時天數留 null，
 *   到期判斷（checkHasPassedEndDate）以 end_date、進度以起訖日（resolveProgressDurationDays）為準；
 *   開始日晚於本期結束日 → 期間為 null
 */
const resolvePeriod = (
  startDate: Date | null,
  templateDurationDays: number | null,
  cohortEndDate: Date | null,
  clampToCohort: boolean
): { endDate: Date | null; durationDays: number | null } => {
  if (!startDate) return { endDate: null, durationDays: templateDurationDays };
  const startsAfterCohortEnd = cohortEndDate !== null && cohortEndDate.getTime() < startDate.getTime();
  if (templateDurationDays) {
    const templatedEnd = inclusiveEndDate(startDate, templateDurationDays);
    if (!clampToCohort || !cohortEndDate) return { endDate: templatedEnd, durationDays: templateDurationDays };
    if (startsAfterCohortEnd) return { endDate: null, durationDays: null };
    if (templatedEnd.getTime() > cohortEndDate.getTime()) {
      return { endDate: cohortEndDate, durationDays: inclusiveDays(startDate, cohortEndDate) };
    }
    return { endDate: templatedEnd, durationDays: templateDurationDays };
  }
  if (!cohortEndDate || startsAfterCohortEnd) return { endDate: null, durationDays: null };
  return { endDate: cohortEndDate, durationDays: inclusiveDays(startDate, cohortEndDate) };
};

/** 把模板掛的資源複製到本次產生的草稿上（共用同一筆 resources，只加關聯） */
const copyTemplateResources = async (
  tx: TransactionClient,
  cohortId: number,
  userId: number,
  templateIds: number[]
): Promise<void> => {
  const templateResources = await tx.entity_resources.findMany({
    where: { entity_type: 'practice_template', entity_id: { in: templateIds }, deleted_at: null },
    select: { entity_id: true, resource_id: true, note: true },
  });
  if (templateResources.length === 0) return;

  const drafts = await tx.practices.findMany({
    where: {
      user_id: userId,
      cohort_id: cohortId,
      creation_source: 'cohort_template',
      template_id: { in: templateIds },
      deleted_at: null,
    },
    select: { id: true, template_id: true },
  });
  // note 帶著「第幾天使用」（day:N），要跟著複製，學員端才知道資源排在哪一天
  const links = drafts.flatMap((draft) =>
    templateResources
      .filter((resource) => resource.entity_id === draft.template_id)
      .map((resource) => ({
        resource_id: resource.resource_id,
        entity_type: 'practice',
        entity_id: draft.id,
        created_by: userId,
        note: resource.note,
      }))
  );
  if (links.length === 0) return;

  await tx.entity_resources.createMany({ data: links, skipDuplicates: true });
  await tx.practices.updateMany({
    where: { id: { in: [...new Set(links.map((link) => link.entity_id))] } },
    data: { has_resources: true },
  });
};

/**
 * 複製出的實踐初始狀態：燈塔場次預設草稿（學員自行啟用）；
 * 共同挑戰沒有啟用步驟，用 by_period 依「每個綁定的實際開始日」給未開始／進行中（daodao#295）——
 * 綁定可釘選自己的開始日，不能用整期狀態一次決定。
 */
export type CohortPracticeInitialStatus = 'draft' | 'not_started' | 'active' | 'by_period';

/**
 * 依實際期間（Asia/Taipei 日曆日，含頭尾）給共同挑戰複製實踐的初始狀態：
 * 開始日前 → not_started；期間內 → active；結束日已過 → completed，與 completeExpiredPractices
 * （checkHasPassedEndDate：今天 > 結束日）給的值相同。模板天數被事後改短時，加入當下複製出的期間可能已結束，
 * 標 active 會讓 createCheckIn 接受期外打卡（daodao#295）。
 */
const statusByPeriod = (startDate: Date, endDate: Date, now: Date): 'not_started' | 'active' | 'completed' => {
  const current = today(now);
  if (day(endDate) < current) return 'completed';
  return day(startDate) <= current ? 'active' : 'not_started';
};

export const ensureCohortDrafts = async (
  tx: TransactionClient,
  cohortId: number,
  userId: number,
  options: { status?: CohortPracticeInitialStatus; now?: Date } = {}
): Promise<number> => {
  const requestedStatus = options.status ?? 'draft';
  const now = options.now ?? new Date();
  const [cohort, bindings] = await Promise.all([
    tx.cohorts.findUnique({
      where: { id: cohortId },
      select: { start_date: true, end_date: true, is_private: true },
    }),
    tx.cohort_templates.findMany({
      where: { cohort_id: cohortId, unbound_at: null },
      select: {
        template_id: true,
        start_date: true,
        practice_template: {
          select: {
            title: true,
            practice_action: true,
            duration_days: true,
            frequency_min_days: true,
            frequency_max_days: true,
            session_duration_minutes: true,
            practice_time_periods: true,
            other_context: true,
          },
        },
      },
    }),
  ]);
  if (bindings.length === 0) return 0;

  // D7：依 is_private 決定實踐的 privacy_status
  const privacyStatus = cohort?.is_private ? 'private' : 'public';

  // 開始日優先用綁定時指定的；沒指定就沿用本期的，避免學員拿到開始日空白的草稿
  const result = await tx.practices.createMany({
    data: bindings.map((binding) => {
      const startDate = binding.start_date ?? cohort?.start_date ?? null;
      // 只有共同挑戰（by_period）把期間截在本期內；燈塔場次維持模板天數
      const period = resolvePeriod(
        startDate,
        binding.practice_template.duration_days,
        cohort?.end_date ?? null,
        requestedStatus === 'by_period'
      );
      // by_period 拿不到完整期間（開始日或結束日為 null）時保持草稿：可打卡但沒有 end_date 的實踐
      // 會被 completeExpiredPractices 以 created_at + 14 天提早完成；共同挑戰依 FR-CC-03 必有固定期間，
      // 正常資料不會走到這裡
      const status =
        requestedStatus === 'by_period'
          ? startDate && period.endDate
            ? statusByPeriod(startDate, period.endDate, now)
            : 'draft'
          : requestedStatus;
      return {
        user_id: userId,
        cohort_id: cohortId,
        template_id: binding.template_id,
        title: binding.practice_template.title,
        practice_action: binding.practice_template.practice_action,
        start_date: startDate,
        end_date: period.endDate,
        duration_days: period.durationDays,
        frequency_min_days: binding.practice_template.frequency_min_days,
        frequency_max_days: binding.practice_template.frequency_max_days,
        session_duration_minutes: binding.practice_template.session_duration_minutes,
        // 舊模板可能存著 enum 外的值（例如 "30"，daodao#382），派發時濾掉，不再複製髒資料
        practice_time_periods: sanitizePracticeTimePeriods(binding.practice_template.practice_time_periods),
        other_context: binding.practice_template.other_context,
        status,
        creation_source: 'cohort_template',
        privacy_status: privacyStatus,
      };
    }),
    skipDuplicates: true,
  });

  await copyTemplateResources(
    tx,
    cohortId,
    userId,
    bindings.map((binding) => binding.template_id)
  );
  return result.count;
};
