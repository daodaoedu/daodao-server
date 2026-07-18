/**
 * Notification Preference Service Unit Tests
 *
 * 涵蓋範圍：
 * - getPreferences：DB 無記錄時回傳完整預設值
 * - getPreferences：DB 有部分記錄時合併正確
 * - getPreferences：WeeklyDigest 的 N02/N03 預設為 false
 * - updatePreference：以正確參數呼叫 upsert
 * - setGlobalEnabled：只更新 N01/N03，不動 N02
 */

import { prismaMock } from '@tests/utils/prisma-mock';
import { setupTransactionMock } from '@tests/utils/prisma-mock';

jest.mock('@/services/database/prisma.service', () => ({
  prisma: prismaMock,
}));

jest.mock('@/utils/response-helper', () => ({
  createSuccessResponse: jest.fn().mockImplementation((data: unknown) => ({
    success: true,
    data,
    timestamp: new Date().toISOString(),
  })),
}));

import { notificationPreferenceService } from '@/services/notification-preference.service';

// ============================================================================
// Constants
// ============================================================================

const ALL_TYPES = [
  'Reaction',
  'Comment',
  'CommentReply',
  'Mention',
  'UserFollowed',
  'PracticeFollowed',
  'Connect',
  'ConnectAccepted',
  'PracticeCreated',
  'PracticeCheckinActivity',
  'PracticeUpdateActivity',
  'PartnerCheckinActivity',
  'PartnerUpdateActivity',
  'PracticeFinished',
  'BuddyRequest',
  'BuddyRequestFollower',
  'BuddyAccepted',
  'WeeklyDigest',
] as const;

const CHANNELS = ['N01', 'N02', 'N03'] as const;

// ============================================================================
// Tests
// ============================================================================

describe('NotificationPreferenceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupTransactionMock();
  });

  // --------------------------------------------------------------------------
  // getPreferences
  // --------------------------------------------------------------------------

  describe('getPreferences', () => {
    it('DB 無記錄時回傳所有 type × channel 的預設值', async () => {
      prismaMock.notification_preferences.findMany.mockResolvedValue([]);

      const result = await notificationPreferenceService.getPreferences(1);

      expect(result.data).toHaveLength(ALL_TYPES.length * CHANNELS.length);
    });

    it('WeeklyDigest 的 N02 與 N03 預設為 false', async () => {
      prismaMock.notification_preferences.findMany.mockResolvedValue([]);

      const result = await notificationPreferenceService.getPreferences(1);

      const weeklyN02 = result.data.find(p => p.type === 'WeeklyDigest' && p.channel === 'N02');
      const weeklyN03 = result.data.find(p => p.type === 'WeeklyDigest' && p.channel === 'N03');
      expect(weeklyN02?.isEnabled).toBe(false);
      expect(weeklyN03?.isEnabled).toBe(false);
    });

    it('WeeklyDigest 的 N01 預設為 true', async () => {
      prismaMock.notification_preferences.findMany.mockResolvedValue([]);

      const result = await notificationPreferenceService.getPreferences(1);

      const weeklyN01 = result.data.find(p => p.type === 'WeeklyDigest' && p.channel === 'N01');
      expect(weeklyN01?.isEnabled).toBe(true);
    });

    it('一般通知類型（非 WeeklyDigest）所有頻道預設為 true', async () => {
      prismaMock.notification_preferences.findMany.mockResolvedValue([]);

      const result = await notificationPreferenceService.getPreferences(1);

      const nonWeekly = result.data.filter(p => p.type !== 'WeeklyDigest');
      expect(nonWeekly.every(p => p.isEnabled === true)).toBe(true);
    });

    it('DB 有記錄時，以 DB 值覆蓋預設值', async () => {
      prismaMock.notification_preferences.findMany.mockResolvedValue([
        { notification_type: 'Reaction', channel: 'N01', is_enabled: false } as any,
        { notification_type: 'Comment',  channel: 'N02', is_enabled: false } as any,
      ]);

      const result = await notificationPreferenceService.getPreferences(1);

      const reactionN01 = result.data.find(p => p.type === 'Reaction' && p.channel === 'N01');
      const commentN02  = result.data.find(p => p.type === 'Comment'  && p.channel === 'N02');
      expect(reactionN01?.isEnabled).toBe(false);
      expect(commentN02?.isEnabled).toBe(false);
    });

    it('DB 沒有記錄的 type+channel 仍回傳預設值', async () => {
      prismaMock.notification_preferences.findMany.mockResolvedValue([
        { notification_type: 'Reaction', channel: 'N01', is_enabled: false } as any,
      ]);

      const result = await notificationPreferenceService.getPreferences(1);

      // reaction N02/N03 未被覆蓋，應為預設 true
      const reactionN02 = result.data.find(p => p.type === 'Reaction' && p.channel === 'N02');
      expect(reactionN02?.isEnabled).toBe(true);
    });

    it('以 userId 查詢 DB', async () => {
      prismaMock.notification_preferences.findMany.mockResolvedValue([]);

      await notificationPreferenceService.getPreferences(42);

      expect(prismaMock.notification_preferences.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { user_id: 42 } }),
      );
    });

    it('回傳格式符合 ApiSuccessResponse（success: true）', async () => {
      prismaMock.notification_preferences.findMany.mockResolvedValue([]);

      const result = await notificationPreferenceService.getPreferences(1);

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // updatePreference
  // --------------------------------------------------------------------------

  describe('updatePreference', () => {
    it('以正確參數呼叫 upsert', async () => {
      prismaMock.notification_preferences.upsert.mockResolvedValue({} as any);

      await notificationPreferenceService.updatePreference(7, 'Comment', 'N01', false);

      expect(prismaMock.notification_preferences.upsert).toHaveBeenCalledWith({
        where: {
          user_id_notification_type_channel: {
            user_id:           7,
            notification_type: 'Comment',
            channel:           'N01',
          },
        },
        update: { is_enabled: false },
        create: {
          user_id:           7,
          notification_type: 'Comment',
          channel:           'N01',
          is_enabled:        false,
        },
      });
    });

    it('啟用設定時 is_enabled 為 true', async () => {
      prismaMock.notification_preferences.upsert.mockResolvedValue({} as any);

      await notificationPreferenceService.updatePreference(1, 'Reaction', 'N03', true);

      const call = prismaMock.notification_preferences.upsert.mock.calls[0][0] as any;
      expect(call.update.is_enabled).toBe(true);
      expect(call.create.is_enabled).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // setGlobalEnabled
  // --------------------------------------------------------------------------

  describe('setGlobalEnabled', () => {
    it('只對 N01 和 N03 呼叫 upsert，不動 N02', async () => {
      prismaMock.notification_preferences.upsert.mockResolvedValue({} as any);

      await notificationPreferenceService.setGlobalEnabled(3, false);

      const calls = prismaMock.notification_preferences.upsert.mock.calls;
      const channels = calls.map((c: any) => c[0].where.user_id_notification_type_channel.channel);

      expect(channels.every((ch: string) => ch === 'N01' || ch === 'N03')).toBe(true);
      expect(channels).not.toContain('N02');
    });

    it('更新筆數 = 16 types × 2 channels = 32', async () => {
      prismaMock.notification_preferences.upsert.mockResolvedValue({} as any);

      const result = await notificationPreferenceService.setGlobalEnabled(3, false);

      expect(result.data.updated).toBe(ALL_TYPES.length * 2); // 32
    });

    it('全部設定 is_enabled 為傳入值', async () => {
      prismaMock.notification_preferences.upsert.mockResolvedValue({} as any);

      await notificationPreferenceService.setGlobalEnabled(3, false);

      const calls = prismaMock.notification_preferences.upsert.mock.calls;
      expect(calls.every((c: any) => c[0].update.is_enabled === false)).toBe(true);
    });

    it('透過 $transaction 批次執行', async () => {
      prismaMock.notification_preferences.upsert.mockResolvedValue({} as any);

      await notificationPreferenceService.setGlobalEnabled(3, true);

      expect(prismaMock.$transaction).toHaveBeenCalled();
    });

    it('回傳格式符合 ApiSuccessResponse（success: true）', async () => {
      prismaMock.notification_preferences.upsert.mockResolvedValue({} as any);

      const result = await notificationPreferenceService.setGlobalEnabled(3, true);

      expect(result.success).toBe(true);
    });
  });
});
