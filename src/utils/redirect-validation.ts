/**
 * Redirect URI 驗證工具
 * 防止 Open Redirect 攻擊
 */

/**
 * 允許的 custom schemes（可從環境變數設定）
 */
const getAllowedCustomSchemes = (): string[] => {
  const schemes = process.env.ALLOWED_CUSTOM_SCHEMES || 'daodao://';
  return schemes.split(',').map(s => s.trim());
};

/**
 * 驗證 redirect URI 是否安全
 * @param redirectUri - 要驗證的 URI
 * @returns 是否為有效的重定向 URI
 */
export const isValidRedirectUri = (redirectUri: string): boolean => {
  if (!redirectUri || typeof redirectUri !== 'string') {
    return false;
  }

  const trimmed = redirectUri.trim();

  // 長度檢查（防止 DOS）
  if (trimmed.length > 2048) {
    return false;
  }

  // 允許相對路徑（只能以 / 開頭，不能有 //）
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    // 驗證相對路徑格式
    return /^\/[a-zA-Z0-9\-_./]*(\?[a-zA-Z0-9\-_=&%.]*)?$/.test(trimmed);
  }

  // 允許 custom schemes
  const allowedSchemes = getAllowedCustomSchemes();
  return allowedSchemes.some(scheme => trimmed.startsWith(scheme));
};

/**
 * 檢查是否為 custom scheme URL
 * @param url - 要檢查的 URL
 * @returns 是否為 custom scheme
 */
export const isCustomScheme = (url: string): boolean => {
  if (!url || typeof url !== 'string') {
    return false;
  }

  const allowedSchemes = getAllowedCustomSchemes();
  return allowedSchemes.some(scheme => url.startsWith(scheme));
};

/**
 * 驗證並清理 redirect 參數
 * @param param - 查詢參數值
 * @returns 清理後的字串或 null
 */
export const validateRedirectParam = (param: unknown): string | null => {
  // 檢查是否為字串（防止 array injection）
  if (typeof param !== 'string') {
    return null;
  }

  const trimmed = param.trim();

  // 空字串或過長
  if (!trimmed || trimmed.length > 2048) {
    return null;
  }

  return trimmed;
};

/**
 * 安全地建構 redirect URL
 * 使用 URL API 避免參數注入
 * @param baseUrl - 基礎 URL
 * @param params - 要添加的參數
 * @returns 完整的 URL 字串
 */
export const buildRedirectUrl = (
  baseUrl: string,
  params: Record<string, string>
): string => {
  try {
    // 對於 custom schemes，URL API 可以正常處理
    const url = new URL(baseUrl);

    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    return url.toString();
  } catch {
    // 如果 URL 解析失敗，手動處理
    const separator = baseUrl.includes('?') ? '&' : '?';
    const queryString = Object.entries(params)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
    return `${baseUrl}${separator}${queryString}`;
  }
};

export const redirectValidation = {
  isValidRedirectUri,
  isCustomScheme,
  validateRedirectParam,
  buildRedirectUrl,
  getAllowedCustomSchemes
};

export default redirectValidation;
