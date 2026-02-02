/**
 * 裝置資訊工具函數
 * 從 Express Request 提取裝置和瀏覽器資訊
 */

import { Request } from 'express';
import { DeviceInfo } from '../types/user.types';

/**
 * User-Agent 字串最大長度
 * 對應資料庫 user_login_history.user_agent 欄位的 VARCHAR(500) 限制
 * @see prisma/schema.prisma - user_login_history table
 */
const MAX_USER_AGENT_LENGTH = 500;

/**
 * 從 User-Agent 字串解析裝置類型
 * @param userAgent User-Agent 字串
 * @returns 裝置類型 (mobile, tablet, desktop)
 */
const parseDeviceType = (userAgent: string): string => {
  const ua = userAgent.toLowerCase();

  if (/mobile|iphone|ipod|android.*mobile|windows phone|blackberry/i.test(ua)) {
    return 'mobile';
  }
  if (/ipad|android(?!.*mobile)|tablet/i.test(ua)) {
    return 'tablet';
  }
  return 'desktop';
};

/**
 * 從 User-Agent 字串解析作業系統
 * @param userAgent User-Agent 字串
 * @returns 作業系統名稱
 */
const parseOS = (userAgent: string): string => {
  if (/windows nt/i.test(userAgent)) {
    return 'Windows';
  }
  if (/mac os x/i.test(userAgent)) {
    return 'macOS';
  }
  if (/iphone|ipad|ipod/i.test(userAgent)) {
    return 'iOS';
  }
  if (/android/i.test(userAgent)) {
    return 'Android';
  }
  if (/linux/i.test(userAgent)) {
    return 'Linux';
  }
  return 'Unknown';
};

/**
 * 從 User-Agent 字串解析瀏覽器
 * @param userAgent User-Agent 字串
 * @returns 瀏覽器名稱
 */
const parseBrowser = (userAgent: string): string => {
  // 注意：順序很重要，因為很多瀏覽器的 UA 都包含 Safari 和 Chrome
  if (/edg/i.test(userAgent)) {
    return 'Edge';
  }
  if (/opr|opera/i.test(userAgent)) {
    return 'Opera';
  }
  if (/chrome|crios/i.test(userAgent) && !/edg/i.test(userAgent)) {
    return 'Chrome';
  }
  if (/firefox|fxios/i.test(userAgent)) {
    return 'Firefox';
  }
  if (/safari/i.test(userAgent) && !/chrome|crios/i.test(userAgent)) {
    return 'Safari';
  }
  if (/msie|trident/i.test(userAgent)) {
    return 'Internet Explorer';
  }
  return 'Unknown';
};

/**
 * 從 Request 提取客戶端 IP 位址
 * 安全地處理代理伺服器情況，依賴 Express 的 trust proxy 設定
 *
 * 重要：需要在 Express app 中正確配置 trust proxy：
 * - 開發環境：app.set('trust proxy', false)
 * - 生產環境：app.set('trust proxy', 1) 或指定可信任的代理 IP
 *
 * @param req Express Request 物件
 * @returns IP 位址字串
 */
const extractIpAddress = (req: Request): string => {
  // 優先使用 Express 處理過的 req.ip
  // 當 trust proxy 正確配置時，Express 會安全地解析 x-forwarded-for
  if (req.ip) {
    return req.ip;
  }

  // 備用：直接使用 socket 連線的 IP（不經過代理驗證）
  return req.socket?.remoteAddress || 'unknown';
};

/**
 * 從 Express Request 提取完整的裝置資訊
 * 用於登入記錄和活動統計
 *
 * @param req Express Request 物件
 * @returns DeviceInfo 物件
 *
 * @example
 * ```ts
 * const deviceInfo = extractDeviceInfo(req);
 * await authService.updateLastLogin(userId, deviceInfo);
 * ```
 */
export const extractDeviceInfo = (req: Request): DeviceInfo => {
  const userAgent = req.headers['user-agent'] || '';

  return {
    deviceType: parseDeviceType(userAgent),
    os: parseOS(userAgent),
    browser: parseBrowser(userAgent),
    userAgent: userAgent.substring(0, MAX_USER_AGENT_LENGTH),
    ipAddress: extractIpAddress(req)
  };
};
