/** 找出超出實踐期間的資源；null／省略代表整段期間。 */
export const outOfPeriodResourceIndexes = (
  resources: ReadonlyArray<{ dayNumber?: number | null }>,
  durationDays: number
): number[] => resources.flatMap((resource, index) =>
  resource.dayNumber != null && (!Number.isInteger(resource.dayNumber) || resource.dayNumber < 1 || resource.dayNumber > durationDays)
    ? [index]
    : []);
