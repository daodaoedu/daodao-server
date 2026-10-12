/**
 * 教練資源鎖定：燈塔本期草稿由模板產生，模板掛的資源是教練加的，學員不可移除或修改。
 * 退出本期後實踐轉為個人實踐（cohort_id 清空），鎖定隨之解除。
 * 這裡只看實踐本身；是否為燈塔場次（共同挑戰不鎖）由呼叫端查 cohorts.program.kind。
 */

export interface LockableResource {
  name: string;
  url?: string | null;
  dayNumber?: number | null;
}

export const isCoachResourceLockActive = (practice: {
  cohort_id: number | null;
  template_id: number | null;
  creation_source: string | null;
}): boolean => practice.cohort_id != null && practice.template_id != null && practice.creation_source === 'cohort_template';

/** 純名稱資源在 DB 存 url: ''，與未帶網址視為相同 */
export const resourceContentKey = (resource: { name: string; url?: string | null }): string =>
  `${resource.name}\u0000${resource.url || ''}`;

const sameContent = (locked: LockableResource, incoming: LockableResource): boolean =>
  resourceContentKey(locked) === resourceContentKey(incoming)
  // 沒帶 dayNumber 視為沿用（編輯頁表單不帶天數）
  && (incoming.dayNumber === undefined || (incoming.dayNumber ?? null) === (locked.dayNumber ?? null));

/**
 * 把學員送出的資源清單分成兩份：
 * - violated：沒被原樣保留的鎖定資源（被移除，或名稱／網址／天數被改）
 * - rest：扣掉原樣保留的鎖定資源後，要新建的學員資源
 * 每筆送出的資源只能抵一筆鎖定資源。
 */
export const partitionIncomingResources = <L extends LockableResource, I extends LockableResource>(
  locked: L[],
  incoming: I[]
): { violated: L[]; rest: I[] } => {
  const rest = [...incoming];
  const violated: L[] = [];
  for (const resource of locked) {
    const index = rest.findIndex(candidate => sameContent(resource, candidate));
    if (index === -1) violated.push(resource);
    else rest.splice(index, 1);
  }
  return { violated, rest };
};
