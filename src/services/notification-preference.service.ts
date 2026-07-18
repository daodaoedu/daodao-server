/**
 * Notification Preference Service
 * 通知偏好設定業務邏輯：查詢、更新、全局開關
 */

import { prisma } from './database/prisma.service';
import { createSuccessResponse } from '../utils/response-helper';
import type { ApiSuccessResponse } from '../types/api-response.types';
import { NOTIFICATION_TYPES } from '../constants/notification-type';

// ============================================================================
// Constants
// ============================================================================

/** 所有通知類型 */
const ALL_NOTIFICATION_TYPES = [
  NOTIFICATION_TYPES.REACTION,
  NOTIFICATION_TYPES.COMMENT,
  NOTIFICATION_TYPES.COMMENT_REPLY,
  NOTIFICATION_TYPES.MENTION,
  NOTIFICATION_TYPES.USER_FOLLOWED,
  NOTIFICATION_TYPES.PRACTICE_FOLLOWED,
  NOTIFICATION_TYPES.CONNECT,
  NOTIFICATION_TYPES.CONNECT_ACCEPTED,
  NOTIFICATION_TYPES.PRACTICE_CREATED,
  NOTIFICATION_TYPES.PRACTICE_CHECKIN_ACTIVITY,
  NOTIFICATION_TYPES.PRACTICE_UPDATE_ACTIVITY,
  NOTIFICATION_TYPES.PARTNER_CHECKIN_ACTIVITY,
  NOTIFICATION_TYPES.PARTNER_UPDATE_ACTIVITY,
  NOTIFICATION_TYPES.PRACTICE_FINISHED,
  NOTIFICATION_TYPES.BUDDY_REQUEST,
  NOTIFICATION_TYPES.BUDDY_REQUEST_FOLLOWER,
  NOTIFICATION_TYPES.BUDDY_ACCEPTED,
  NOTIFICATION_TYPES.WEEKLY_DIGEST,
] as const;

/** 通知頻道 */
const CHANNELS = ['N01', 'N02', 'N03'] as const;

/** WeeklyDigest 不支援的頻道（無 InApp / Push） */
const WEEKLY_DIGEST_DISABLED_CHANNELS = new Set(['N02', 'N03']);

// ============================================================================
// Types
// ============================================================================

export interface NotificationPreferenceItem {
  type:      string;
  channel:   string;
  isEnabled: boolean;
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * 判斷某個 type+channel 組合的預設 is_enabled 值
 */
function getDefaultEnabled(type: string, channel: string): boolean {
  if (type === NOTIFICATION_TYPES.WEEKLY_DIGEST && WEEKLY_DIGEST_DISABLED_CHANNELS.has(channel)) {
    return false;
  }
  return true;
}

/**
 * 產生完整的預設偏好設定列表（所有 type × channel）
 */
function _buildDefaultPreferences(): NotificationPreferenceItem[] {
  const result: NotificationPreferenceItem[] = [];
  for (const type of ALL_NOTIFICATION_TYPES) {
    for (const channel of CHANNELS) {
      result.push({
        type,
        channel,
        isEnabled: getDefaultEnabled(type, channel),
      });
    }
  }
  return result;
}

// ============================================================================
// Service
// ============================================================================

/**
 * 查詢用戶通知偏好設定
 * 資料庫無記錄時回傳預設值
 */
async function getPreferences(userId: number): Promise<ApiSuccessResponse<NotificationPreferenceItem[]>> {
  const rows = await prisma.notification_preferences.findMany({
    where: { user_id: userId },
    select: {
      notification_type: true,
      channel:           true,
      is_enabled:        true,
    },
  });

  // 建立資料庫記錄 map，key = "type:channel"
  const dbMap = new Map<string, boolean>();
  for (const row of rows) {
    dbMap.set(`${row.notification_type}:${row.channel}`, row.is_enabled ?? true);
  }

  // 合併預設值與資料庫記錄
  const preferences: NotificationPreferenceItem[] = ALL_NOTIFICATION_TYPES.flatMap(type =>
    CHANNELS.map(channel => {
      const key = `${type}:${channel}`;
      const isEnabled = dbMap.has(key)
        ? dbMap.get(key)!
        : getDefaultEnabled(type, channel);
      return { type, channel, isEnabled };
    })
  );

  return createSuccessResponse(preferences);
}

/**
 * 更新單一偏好設定（upsert）
 */
async function updatePreference(
  userId:    number,
  type:      string,
  channel:   string,
  isEnabled: boolean,
): Promise<void> {
  await prisma.notification_preferences.upsert({
    where: {
      user_id_notification_type_channel: {
        user_id:           userId,
        notification_type: type,
        channel,
      },
    },
    update: { is_enabled: isEnabled },
    create: {
      user_id:           userId,
      notification_type: type,
      channel,
      is_enabled:        isEnabled,
    },
  });
}

/**
 * 全局開關：一次更新該用戶所有 N01 和 N03 的設定
 * N02 (InApp) 不受影響
 */
async function setGlobalEnabled(userId: number, isEnabled: boolean): Promise<ApiSuccessResponse<{ updated: number }>> {
  const affectedChannels = ['N01', 'N03'];

  // 取得所有 type × 受影響 channel 組合
  const upsertOps = ALL_NOTIFICATION_TYPES.flatMap(type =>
    affectedChannels.map(channel =>
      prisma.notification_preferences.upsert({
        where: {
          user_id_notification_type_channel: {
            user_id:           userId,
            notification_type: type,
            channel,
          },
        },
        update: { is_enabled: isEnabled },
        create: {
          user_id:           userId,
          notification_type: type,
          channel,
          is_enabled:        isEnabled,
        },
      })
    )
  );

  await prisma.$transaction(upsertOps);

  return createSuccessResponse({ updated: upsertOps.length });
}

export const notificationPreferenceService = {
  getPreferences,
  updatePreference,
  setGlobalEnabled,
};
