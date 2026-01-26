/**
 * 安全性工具函數
 * 提供輸入清理和驗證功能，防止 XSS、注入等攻擊
 */

/**
 * HTML 跳脫函數，防止 XSS 攻擊
 * @param unsafe 未經處理的字串
 * @returns 安全的 HTML 字串
 */
export function escapeHtml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * URL 驗證和清理，防止 javascript: 等惡意協議
 * @param url 待驗證的 URL
 * @param fallback 驗證失敗時的回退值
 * @returns 安全的 URL 或回退值
 */
export function sanitizeUrl(url: string, fallback = '#'): string {
  if (!url) return fallback;

  try {
    const parsed = new URL(url);
    // 只允許 http/https 協議
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return fallback;
    }
    return url;
  } catch {
    // URL 解析失敗，可能是相對路徑
    // 檢查是否以 / 開頭（相對路徑）
    if (url.startsWith('/')) {
      return url;
    }
    return fallback;
  }
}

/**
 * 驗證 Email 地址格式（RFC 5322 標準）
 * @param email 待驗證的 email 地址
 * @returns 是否有效
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false;

  // RFC 5322 相容的正則表達式
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!emailRegex.test(email)) {
    return false;
  }

  // 長度檢查（RFC 5321）
  if (email.length > 254) {
    return false;
  }

  // 域名部分檢查
  const [localPart, domain] = email.split('@');
  if (!localPart || !domain) {
    return false;
  }

  if (localPart.length > 64) {
    return false;
  }

  if (domain.length > 253) {
    return false;
  }

  // 檢查是否有連續的點
  if (email.includes('..')) {
    return false;
  }

  // 檢查是否以點開頭或結尾
  if (localPart.startsWith('.') || localPart.endsWith('.')) {
    return false;
  }

  return true;
}

/**
 * 清理字串中的控制字元
 * @param input 輸入字串
 * @returns 清理後的字串
 */
export function stripControlCharacters(input: string): string {
  if (!input) return '';
  // 移除 ASCII 控制字元 (0x00-0x1F, 0x7F)，保留換行和 Tab
  return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

/**
 * 截斷字串到指定長度
 * @param input 輸入字串
 * @param maxLength 最大長度
 * @param suffix 截斷後的後綴（預設 '...'）
 * @returns 截斷後的字串
 */
export function truncate(input: string, maxLength: number, suffix = '...'): string {
  if (!input || input.length <= maxLength) return input || '';
  return input.slice(0, maxLength - suffix.length) + suffix;
}
