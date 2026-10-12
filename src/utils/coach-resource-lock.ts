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

type ResourceLink = { resource_id: number; resources: { name: string; url?: string | null } };

/**
 * 從實踐目前的資源關聯中挑出教練加的那幾筆，回傳關聯 id。
 * 草稿建立時共用模板的 resources 列，resource_id 掛過模板（含已軟刪的模板關聯）就是教練加的；
 * 教練改模板、或修正前學員存檔都會重建 resources 列換掉 id，所以 id 對不上時再比名稱＋網址，
 * 但每種內容最多補鎖一筆，學員自己另存的同名資源不會被一起鎖住。
 */
export const pickCoachLockedRelationIds = <R extends ResourceLink & { id: number }>(
  templateLinks: ResourceLink[],
  relations: R[]
): Set<number> => {
  const templateResourceIds = new Set(templateLinks.map(link => link.resource_id));
  const lockedIds = new Set<number>();
  const coveredContents = new Set<string>();
  for (const relation of relations) {
    if (!templateResourceIds.has(relation.resource_id)) continue;
    lockedIds.add(relation.id);
    coveredContents.add(resourceContentKey(relation.resources));
  }

  const pendingContents = new Set(templateLinks.map(link => resourceContentKey(link.resources)).filter(key => !coveredContents.has(key)));
  for (const relation of relations) {
    const key = resourceContentKey(relation.resources);
    if (lockedIds.has(relation.id) || !pendingContents.has(key)) continue;
    lockedIds.add(relation.id);
    pendingContents.delete(key);
  }
  return lockedIds;
};

/** strict：送出時明確帶了相同天數；lenient：沒帶 dayNumber 視為沿用（編輯頁表單不帶天數） */
const sameContent = (locked: LockableResource, incoming: LockableResource, mode: 'strict' | 'lenient'): boolean =>
  resourceContentKey(locked) === resourceContentKey(incoming)
  && (mode === 'strict'
    ? incoming.dayNumber !== undefined && (incoming.dayNumber ?? null) === (locked.dayNumber ?? null)
    : incoming.dayNumber === undefined);

/**
 * 把學員送出的資源清單分成兩份：
 * - violated：沒被原樣保留的鎖定資源（被移除，或名稱／網址／天數被改）
 * - rest：扣掉原樣保留的鎖定資源後，要新建的學員資源
 * 每筆送出的資源只能抵一筆鎖定資源；先配對明確帶天數的，再用沒帶天數的補，
 * 避免同名同網址、不同天數的教練資源被沒帶天數的那筆搶先配走。
 */
export const partitionIncomingResources = <L extends LockableResource, I extends LockableResource>(
  locked: L[],
  incoming: I[]
): { violated: L[]; rest: I[] } => {
  const rest = [...incoming];
  let unmatched = [...locked];
  for (const mode of ['strict', 'lenient'] as const) {
    unmatched = unmatched.filter(resource => {
      const index = rest.findIndex(candidate => sameContent(resource, candidate, mode));
      if (index === -1) return true;
      rest.splice(index, 1);
      return false;
    });
  }
  return { violated: locked.filter(resource => unmatched.includes(resource)), rest };
};
