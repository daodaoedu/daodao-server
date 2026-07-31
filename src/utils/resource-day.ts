/**
 * 資源「第幾天使用」的載體是 entity_resources.note（格式 `day:N`）。
 * DB 沒有專用欄位；note 目前無其他用途，用固定前綴避免與未來的自由文字備註混淆。
 */
export const encodeResourceDay = (dayNumber: number | null | undefined): string | null =>
  dayNumber != null ? `day:${dayNumber}` : null;

export const parseResourceDay = (note: string | null | undefined): number | null => {
  const match = note?.match(/^day:(\d+)$/);
  return match ? Number(match[1]) : null;
};
