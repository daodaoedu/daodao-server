/**
 * 退訂 Token 服務
 * 使用 JWT 產生可驗證的退訂連結，有效期 90 天
 */

import jwt from 'jsonwebtoken';

// ─── 常數 ──────────────────────────────────────────────────────────────────────

const UNSUBSCRIBE_SECRET = process.env.JWT_SECRET || 'unsubscribe-secret';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'https://app.daodao.so';

/** Token 有效期（90 天，秒） */
const TOKEN_EXPIRY_SECONDS = 90 * 24 * 60 * 60;

// ─── JWT Payload 型別 ─────────────────────────────────────────────────────────

interface UnsubscribeTokenPayload {
  userId: number;
  notificationType: string;
  /** purpose 用於區別其他 JWT 用途，避免 token 混用 */
  purpose: 'unsubscribe';
}

// ─── Token 操作 ───────────────────────────────────────────────────────────────

/**
 * 產生退訂 JWT token
 * @param userId - 使用者 ID
 * @param notificationType - 通知類型（e.g. 'comment_on_practice'）
 * @returns 簽署後的 JWT 字串
 */
export function generateUnsubscribeToken(userId: number, notificationType: string): string {
  const payload: UnsubscribeTokenPayload = {
    userId,
    notificationType,
    purpose: 'unsubscribe',
  };

  return jwt.sign(payload, UNSUBSCRIBE_SECRET, {
    expiresIn: TOKEN_EXPIRY_SECONDS,
  });
}

/**
 * 驗證退訂 token 並回傳 payload
 * @param token - JWT 字串
 * @returns 解碼後的 payload，或 null（無效/過期）
 */
export function verifyUnsubscribeToken(
  token: string
): { userId: number; notificationType: string } | null {
  try {
    const decoded = jwt.verify(token, UNSUBSCRIBE_SECRET) as UnsubscribeTokenPayload & jwt.JwtPayload;

    if (decoded.purpose !== 'unsubscribe') return null;
    if (typeof decoded.userId !== 'number') return null;
    if (typeof decoded.notificationType !== 'string') return null;

    return {
      userId: decoded.userId,
      notificationType: decoded.notificationType,
    };
  } catch {
    return null;
  }
}

/**
 * 產生退訂 URL（含 JWT token）
 * 格式：${BACKEND_URL}/api/v1/notifications/unsubscribe?token=<jwt>
 *
 * @param userId - 使用者 ID
 * @param notificationType - 通知類型
 * @returns 完整退訂 URL
 */
export function generateUnsubscribeUrl(userId: number, notificationType: string): string {
  const token = generateUnsubscribeToken(userId, notificationType);
  return `${BACKEND_URL}/api/v1/notifications/unsubscribe?token=${encodeURIComponent(token)}`;
}

/**
 * 產生通知設定頁 URL
 * @returns 設定頁完整 URL
 */
export function generateSettingsUrl(): string {
  return `${FRONTEND_URL}/settings/notifications`;
}
