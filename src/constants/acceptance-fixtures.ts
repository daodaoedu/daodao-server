/**
 * 驗收 fixture（daodao#323）
 *
 * dev DB 裡給 PM／工程驗收用的固定組織，資料由 daodao-storage scripts/acceptance_fixtures 建立與重設，
 * 主鍵使用保留區段 900000–900999。停權會讓所有驗收前置條件失效（#179／#180），因此 API 一律拒絕。
 * prod 沒有這些 id，判斷不會命中。
 */
export const ACCEPTANCE_FIXTURE_ORGANIZATION_IDS: readonly number[] = [900001];

export const isAcceptanceFixtureOrganization = (organizationId: number): boolean =>
  ACCEPTANCE_FIXTURE_ORGANIZATION_IDS.includes(organizationId);
