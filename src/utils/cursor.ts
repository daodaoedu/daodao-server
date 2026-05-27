/**
 * 不透明 offset 游標編碼工具
 *
 * 以 base64 包裝整數 offset，作為對外不透明的分頁游標。
 */

export function encodeOffsetCursor(offset: number): string {
  return Buffer.from(String(offset), 'utf8').toString('base64');
}

export function decodeOffsetCursor(cursor?: string): number {
  if (!cursor) return 0;
  try {
    const decoded = Number.parseInt(Buffer.from(cursor, 'base64').toString('utf8'), 10);
    return Number.isFinite(decoded) && decoded >= 0 ? decoded : 0;
  } catch {
    return 0;
  }
}
