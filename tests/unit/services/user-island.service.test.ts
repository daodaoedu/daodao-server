/**
 * User Island Service Unit Tests（openspec change: island-3d, task 2.2）
 *
 * 涵蓋範圍：
 * - isPracticeVisibleTo 純函式：privacy_status × visibility 雙欄位過濾規則
 * - getUserIslandData 三種觀看者情境：島主本人 / 連結夥伴 / 一般訪客
 * - spec「訪客隱私過濾」：私有實踐不出現在訪客 payload
 */

import { prismaMock } from '@tests/utils/prisma-mock';

jest.mock('@/services/database/prisma.service', () => ({
  prisma: prismaMock,
}));

import {
  isPracticeVisibleTo,
  getUserIslandData,
  IslandOwner
} from '@/services/user-island.service';

// ============================================================================
// Fixtures
// ============================================================================

const owner: IslandOwner = {
  id: 1,
  external_id: 'owner-external-id',
  custom_id: 'owner',
  nickname: '島主',
  photoUrl: 'https://example.com/avatar.png'
};

const publicPractice = {
  id: 11,
  external_id: 'p-public',
  title: '公開實踐',
  status: 'active',
  theme_color: '#FF6B6B',
  visibility: 'public',
  privacy_status: 'public'
};

const connectionsOnlyPractice = {
  id: 12,
  external_id: 'p-connections',
  title: '連結限定實踐',
  status: 'active',
  theme_color: null,
  visibility: 'connections_only',
  privacy_status: 'public'
};

const privatePractice = {
  id: 13,
  external_id: 'p-private',
  title: '私有實踐',
  status: 'completed',
  theme_color: null,
  visibility: 'public',
  privacy_status: 'private'
};

const allPractices = [publicPractice, connectionsOnlyPractice, privatePractice];

const daysAgo = (days: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

/**
 * 設定共用 prisma mock：實踐、打卡、quiz 結果
 */
const setupMocks = ({ connected = false } = {}) => {
  prismaMock.practices.findMany.mockResolvedValue(allPractices as never);
  // 依 where.practice_id.in 過濾，模擬真實 DB 行為（隱私過濾後僅查可見實踐的打卡）
  const allCheckins = [
    { id: 101, practice_id: 11, checkin_date: daysAgo(1) },
    { id: 102, practice_id: 11, checkin_date: daysAgo(40) },
    { id: 103, practice_id: 12, checkin_date: daysAgo(2) },
    { id: 104, practice_id: 13, checkin_date: daysAgo(3) }
  ];
  prismaMock.practice_checkins.findMany.mockImplementation(((args: {
    where?: { practice_id?: { in?: number[] } };
  }) => {
    const practiceIds = args?.where?.practice_id?.in ?? [];
    return Promise.resolve(
      allCheckins.filter((checkin) => practiceIds.includes(checkin.practice_id))
    );
  }) as never);
  prismaMock.connections.findUnique.mockResolvedValue(
    (connected ? { id: 99 } : null) as never
  );
  prismaMock.quiz_results.findFirst.mockResolvedValue({
    id: 9,
    result_type: 'D',
    scores: {},
    completed_at: new Date('2026-01-01T00:00:00Z')
  } as never);
};

// ============================================================================
// Tests
// ============================================================================

describe('User Island Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // isPracticeVisibleTo（純函式）
  // --------------------------------------------------------------------------

  describe('isPracticeVisibleTo', () => {
    it('島主本人永遠可見（含私有）', () => {
      expect(isPracticeVisibleTo(privatePractice, 'self')).toBe(true);
      expect(isPracticeVisibleTo(connectionsOnlyPractice, 'self')).toBe(true);
    });

    it('public 實踐對所有關係可見', () => {
      expect(isPracticeVisibleTo(publicPractice, 'visitor')).toBe(true);
      expect(isPracticeVisibleTo(publicPractice, 'connection')).toBe(true);
    });

    it('privacy_status=private 對非本人不可見', () => {
      expect(isPracticeVisibleTo(privatePractice, 'visitor')).toBe(false);
      expect(isPracticeVisibleTo(privatePractice, 'connection')).toBe(false);
    });

    it('visibility=private 對非本人不可見', () => {
      const practice = { status: 'active', visibility: 'private', privacy_status: 'public' };
      expect(isPracticeVisibleTo(practice, 'visitor')).toBe(false);
      expect(isPracticeVisibleTo(practice, 'connection')).toBe(false);
    });

    it('connections_only 僅連結夥伴可見', () => {
      expect(isPracticeVisibleTo(connectionsOnlyPractice, 'connection')).toBe(true);
      expect(isPracticeVisibleTo(connectionsOnlyPractice, 'visitor')).toBe(false);
    });

    it('privacy_status=delayed 未完成不可見、完成後可見', () => {
      const delayedActive = { status: 'active', visibility: 'public', privacy_status: 'delayed' };
      const delayedCompleted = { status: 'completed', visibility: 'public', privacy_status: 'delayed' };
      expect(isPracticeVisibleTo(delayedActive, 'visitor')).toBe(false);
      expect(isPracticeVisibleTo(delayedActive, 'self')).toBe(true);
      expect(isPracticeVisibleTo(delayedCompleted, 'visitor')).toBe(true);
    });

    it('未知或缺值容錯視為 public', () => {
      const practice = { status: 'active', visibility: null, privacy_status: null };
      expect(isPracticeVisibleTo(practice, 'visitor')).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // getUserIslandData：三種觀看者情境
  // --------------------------------------------------------------------------

  describe('getUserIslandData - 島主本人', () => {
    it('viewerRelation 為 self 且收到全部實踐（含私有）', async () => {
      setupMocks();

      const result = await getUserIslandData(owner, owner.id);

      expect(result.viewerRelation).toBe('self');
      expect(result.practices.map((p) => p.id)).toEqual([
        'p-public',
        'p-connections',
        'p-private'
      ]);
      // 本人不需查連結關係
      expect(prismaMock.connections.findUnique).not.toHaveBeenCalled();
    });

    it('聚合 profile、personaType 與打卡統計', async () => {
      setupMocks();

      const result = await getUserIslandData(owner, owner.id);

      expect(result.profile).toEqual({
        id: 'owner-external-id',
        customId: 'owner',
        name: '島主',
        photoURL: 'https://example.com/avatar.png'
      });
      expect(result.personaType).toBe('D');

      const publicOne = result.practices.find((p) => p.id === 'p-public');
      expect(publicOne?.checkinCount).toBe(2);
      expect(publicOne?.checkinIds).toEqual([101, 102]);
      // 30 天內打卡：101(1天前)、103(2天前)、104(3天前)；102 為 40 天前不計
      expect(result.recentCheckinCount).toBe(3);
    });
  });

  describe('getUserIslandData - 連結夥伴', () => {
    it('viewerRelation 為 connection，可見 public 與 connections_only、不可見私有', async () => {
      setupMocks({ connected: true });

      const result = await getUserIslandData(owner, 2);

      expect(result.viewerRelation).toBe('connection');
      expect(result.practices.map((p) => p.id)).toEqual(['p-public', 'p-connections']);
    });
  });

  describe('getUserIslandData - 一般訪客', () => {
    it('未登入訪客僅見 public 實踐', async () => {
      setupMocks();

      const result = await getUserIslandData(owner, null);

      expect(result.viewerRelation).toBe('visitor');
      expect(result.practices.map((p) => p.id)).toEqual(['p-public']);
      // 未登入不需查連結關係
      expect(prismaMock.connections.findUnique).not.toHaveBeenCalled();
    });

    it('已登入但未連結者視為 visitor，僅見 public 實踐', async () => {
      setupMocks({ connected: false });

      const result = await getUserIslandData(owner, 3);

      expect(result.viewerRelation).toBe('visitor');
      expect(result.practices.map((p) => p.id)).toEqual(['p-public']);
    });

    it('spec 訪客隱私過濾：私有實踐完全不出現在 payload', async () => {
      setupMocks();

      const result = await getUserIslandData(owner, null);

      const payload = JSON.stringify(result);
      expect(payload).not.toContain('p-private');
      expect(payload).not.toContain('私有實踐');
      expect(payload).not.toContain('p-connections');
    });

    it('訪客的近 30 天打卡量僅計入可見實踐', async () => {
      setupMocks();

      const result = await getUserIslandData(owner, null);

      // 只剩 p-public 的打卡（101 在 30 天內、102 超過 30 天）
      expect(result.recentCheckinCount).toBe(1);
      expect(prismaMock.practice_checkins.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { practice_id: { in: [11] } }
        })
      );
    });
  });

  describe('getUserIslandData - 未完成 quiz', () => {
    it('personaType 為 null', async () => {
      setupMocks();
      prismaMock.quiz_results.findFirst.mockResolvedValue(null as never);

      const result = await getUserIslandData(owner, owner.id);

      expect(result.personaType).toBeNull();
    });
  });
});
