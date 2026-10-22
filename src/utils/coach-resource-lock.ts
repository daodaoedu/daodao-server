/**
 * 教練資源鎖定：燈塔本期草稿由模板產生，模板掛的資源是教練加的，學員不可移除或修改。
 * 退出本期後實踐轉為個人實踐（cohort_id 清空），鎖定隨之解除。
 * 這裡只看實踐本身；是否為燈塔場次（共同挑戰不鎖）由呼叫端查 cohorts.program.kind。
 */

import { parseResourceDay } from './resource-day';

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

type ResourceLink = {
  resource_id: number;
  /** entity_resources.note，存 dayNumber（day:N） */
  note?: string | null;
  deleted_at?: Date | null;
  resources: { name: string; url?: string | null };
};

/** 模板上一個教練資源的位置；day 為 undefined 表示教練已從模板拿掉（只剩軟刪關聯），不限天數 */
type ContentSlot = { day: number | null | undefined };

/**
 * 每種內容在模板上佔幾個位置：現存關聯依天數去重（同天的重複關聯是舊 seed 殘留，算一筆）；
 * 只剩軟刪關聯的內容（教練事後拿掉）保留一個不限天數的位置。
 */
const buildContentSlots = (templateLinks: ResourceLink[]): Map<string, ContentSlot[]> => {
  const liveDays = new Map<string, Set<number | null>>();
  const allContents = new Set<string>();
  for (const link of templateLinks) {
    const key = resourceContentKey(link.resources);
    allContents.add(key);
    if (link.deleted_at) continue;
    const days = liveDays.get(key) ?? new Set<number | null>();
    days.add(parseResourceDay(link.note));
    liveDays.set(key, days);
  }
  const slots = new Map<string, ContentSlot[]>();
  for (const key of allContents) {
    const days = liveDays.get(key);
    slots.set(key, days ? [...days].map(day => ({ day })) : [{ day: undefined }]);
  }
  return slots;
};

/** 從內容的剩餘位置拿一個：sameDayOnly 只拿天數相同的，否則天數相同優先、沒有就拿第一個 */
const takeSlot = (slots: ContentSlot[] | undefined, day: number | null, sameDayOnly: boolean): boolean => {
  if (!slots || slots.length === 0) return false;
  let index = slots.findIndex(slot => slot.day === day);
  if (index === -1 && !sameDayOnly) index = 0;
  if (index === -1) return false;
  slots.splice(index, 1);
  return true;
};

/**
 * 從實踐目前的資源關聯中挑出教練加的那幾筆，回傳關聯 id。
 * 草稿建立時共用模板的 resources 列，resource_id 掛過模板（含已軟刪的模板關聯）就是教練加的；
 * 教練改模板、或修正前學員存檔都會重建 resources 列換掉 id，所以 id 對不上時再比名稱＋網址，
 * 補鎖的筆數以模板上該內容的位置數為上限（見 buildContentSlots），天數相同的關聯優先，
 * 學員自己另存的同名資源不會被一起鎖住；模板在不同天放同名同網址的資源則每一天各鎖一筆（daodao#355）。
 */
export const pickCoachLockedRelationIds = <R extends ResourceLink & { id: number }>(
  templateLinks: ResourceLink[],
  relations: R[]
): Set<number> => {
  const templateResourceIds = new Set(templateLinks.map(link => link.resource_id));
  const slots = buildContentSlots(templateLinks);
  const lockedIds = new Set<number>();
  for (const relation of relations) {
    if (!templateResourceIds.has(relation.resource_id)) continue;
    lockedIds.add(relation.id);
    takeSlot(slots.get(resourceContentKey(relation.resources)), parseResourceDay(relation.note), false);
  }

  for (const sameDayOnly of [true, false]) {
    for (const relation of relations) {
      if (lockedIds.has(relation.id)) continue;
      if (takeSlot(slots.get(resourceContentKey(relation.resources)), parseResourceDay(relation.note), sameDayOnly)) {
        lockedIds.add(relation.id);
      }
    }
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
