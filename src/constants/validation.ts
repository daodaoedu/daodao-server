/**
 * 驗證常數和工具函數
 * 提供統一的驗證邏輯,確保整個應用程式的一致性
 */

/**
 * Custom ID 驗證規則
 */
export const CUSTOM_ID_REGEX = /^[a-zA-Z0-9](?:[a-zA-Z0-9_-]*[a-zA-Z0-9])?$/;
export const CUSTOM_ID_MIN_LENGTH = 3;
export const CUSTOM_ID_MAX_LENGTH = 50;

/**
 * Custom ID 錯誤訊息
 */
export const CUSTOM_ID_ERROR_MESSAGES = {
  FORMAT: '自訂 ID 格式不正確：需3-50個字符，只能包含英文字母、數字、底線和連字符，且不能以底線或連字符開頭/結尾',
  MIN_LENGTH: `自訂 ID 至少需要 ${CUSTOM_ID_MIN_LENGTH} 個字符`,
  MAX_LENGTH: `自訂 ID 不能超過 ${CUSTOM_ID_MAX_LENGTH} 個字符`,
  ALREADY_EXISTS: '此自訂 ID 已被使用',
  USER_HAS_CUSTOM_ID: '用戶已設置自訂 ID，請先移除現有 ID',
  NOT_SET: '用戶尚未設置自訂 ID',
} as const;

/**
 * 驗證 Custom ID 格式
 *
 * @param customId - 要驗證的 Custom ID
 * @returns 是否符合格式要求
 *
 * @example
 * ```typescript
 * validateCustomIdFormat('abc')        // true
 * validateCustomIdFormat('user_123')   // true
 * validateCustomIdFormat('_user')      // false
 * validateCustomIdFormat('ab')         // false (太短)
 * ```
 */
export const validateCustomIdFormat = (customId: string): boolean => {
  if (!customId || typeof customId !== 'string') {
    return false;
  }

  // 檢查長度
  if (customId.length < CUSTOM_ID_MIN_LENGTH || customId.length > CUSTOM_ID_MAX_LENGTH) {
    return false;
  }

  // 檢查格式
  return CUSTOM_ID_REGEX.test(customId);
};

/**
 * 驗證 Custom ID 並返回詳細錯誤訊息
 *
 * @param customId - 要驗證的 Custom ID
 * @returns 驗證結果物件,包含是否有效和錯誤訊息
 *
 * @example
 * ```typescript
 * validateCustomIdWithMessage('ab')
 * // { valid: false, error: '自訂 ID 至少需要 3 個字符' }
 *
 * validateCustomIdWithMessage('valid_id')
 * // { valid: true, error: null }
 * ```
 */
export const validateCustomIdWithMessage = (customId: string): {
  valid: boolean;
  error: string | null;
} => {
  if (!customId || typeof customId !== 'string') {
    return { valid: false, error: CUSTOM_ID_ERROR_MESSAGES.FORMAT };
  }

  if (customId.length < CUSTOM_ID_MIN_LENGTH) {
    return { valid: false, error: CUSTOM_ID_ERROR_MESSAGES.MIN_LENGTH };
  }

  if (customId.length > CUSTOM_ID_MAX_LENGTH) {
    return { valid: false, error: CUSTOM_ID_ERROR_MESSAGES.MAX_LENGTH };
  }

  if (!CUSTOM_ID_REGEX.test(customId)) {
    return { valid: false, error: CUSTOM_ID_ERROR_MESSAGES.FORMAT };
  }

  return { valid: true, error: null };
};

/**
 * Custom ID 保留字列表
 * 這些 ID 不能被用戶使用
 */
export const CUSTOM_ID_RESERVED_WORDS = [
  'admin',
  'administrator',
  'system',
  'root',
  'api',
  'www',
  'ftp',
  'mail',
  'support',
  'help',
  'info',
  'contact',
  'about',
  'terms',
  'privacy',
  'settings',
  'profile',
  'account',
  'login',
  'logout',
  'register',
  'signup',
  'signin',
  'auth',
  'oauth',
  'me',
  'user',
  'users',
  'public',
  'private',
  'static',
  'assets',
  'images',
  'uploads',
  'downloads',
  'files',
  'docs',
  'documentation',
  'blog',
  'news',
  'events',
  'community',
  'forum',
  'dashboard',
  'console',
  'config',
  'configuration',
] as const;

/**
 * 檢查 Custom ID 是否為保留字
 *
 * @param customId - 要檢查的 Custom ID
 * @returns 是否為保留字
 */
export const isReservedCustomId = (customId: string): boolean => {
  return CUSTOM_ID_RESERVED_WORDS.includes(customId.toLowerCase() as typeof CUSTOM_ID_RESERVED_WORDS[number]);
};

/**
 * 完整的 Custom ID 驗證
 * 包括格式檢查和保留字檢查
 *
 * @param customId - 要驗證的 Custom ID
 * @returns 驗證結果物件
 */
export const validateCustomIdComplete = (customId: string): {
  valid: boolean;
  error: string | null;
} => {
  // 先檢查格式
  const formatCheck = validateCustomIdWithMessage(customId);
  if (!formatCheck.valid) {
    return formatCheck;
  }

  // 檢查保留字
  if (isReservedCustomId(customId)) {
    return {
      valid: false,
      error: '此 ID 為系統保留字，請選擇其他 ID',
    };
  }

  return { valid: true, error: null };
};
