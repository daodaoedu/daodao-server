/**
 * User Island Service
 * 3D 島嶼頁 islandData 聚合（openspec change: island-3d）
 *
 * 聚合 profile、quiz 人格、可見實踐（含打卡統計與 checkin id 種子）、
 * 近 30 天打卡總量與 viewerRelation。隱私過濾一律在 server 端完成——
 * 不可見的實踐不進 payload，前端無從洩漏。
 */

import { prisma } from './database/prisma.service';
import { connectionService } from './connection.service';
import { getLatestResult } from './quiz.service';

// ============================================================================
// Types
// ============================================================================

export type ViewerRelation = 'self' | 'connection' | 'visitor';

/**
 * 隱私過濾所需的實踐欄位子集
 */
export interface IslandPracticePrivacySource {
  status: string | null;
  visibility: string | null;
  privacy_status: string | null;
}

/**
 * 聚合入口所需的島主資料（由 controller 解析 identifier 後傳入）
 */
export interface IslandOwner {
  id: number;
  external_id: string | null;
  custom_id: string | null;
  nickname: string | null;
  photoUrl: string | null;
}

export interface IslandPractice {
  id: string;
  title: string;
  status: 'active' | 'completed';
  themeColor: string | null;
  checkinCount: number;
  checkinIds: number[];
}

export interface IslandData {
  profile: {
    id: string;
    customId: string | null;
    name: string | null;
    photoURL: string | null;
  };
  personaType: string | null;
  practices: IslandPractice[];
  recentCheckinCount: number;
  viewerRelation: ViewerRelation;
}

// ============================================================================
// Service Functions
// ============================================================================

/**
 * 判斷單一實踐對指定觀看者關係是否可見（純函式，供單元測試）
 *
 * 實踐有兩個隱私欄位（歷史演進），兩者皆須通過（deny 優先）：
 * - `privacy_status`：'public' | 'delayed'（完成後才公開）| 'private'——實踐 CRUD 實際寫入的欄位
 * - `visibility`：'public' | 'connections_only' | 'private'——privacyService 語意欄位
 * 未知值容錯視為 public（與 privacyService 一致）；島主本人永遠可見。
 */
export const isPracticeVisibleTo = (
  practice: IslandPracticePrivacySource,
  relation: ViewerRelation
): boolean => {
  if (relation === 'self') return true;

  const privacyStatus = practice.privacy_status ?? 'public';
  if (privacyStatus === 'private') return false;
  if (privacyStatus === 'delayed' && practice.status !== 'completed') return false;

  const visibility = practice.visibility ?? 'public';
  if (visibility === 'private') return false;
  if (visibility === 'connections_only') return relation === 'connection';

  return true;
};

/**
 * 解析觀看者與島主的關係
 */
export const resolveViewerRelation = async (
  viewerId: number | null | undefined,
  ownerId: number
): Promise<ViewerRelation> => {
  if (viewerId == null) return 'visitor';
  if (viewerId === ownerId) return 'self';
  const connected = await connectionService.isConnected(viewerId, ownerId);
  return connected ? 'connection' : 'visitor';
};

/**
 * 聚合 islandData：可見實踐（含打卡統計與 checkin id 種子）、
 * 近 30 天打卡總量、quiz 人格與 viewerRelation
 */
export const getUserIslandData = async (
  owner: IslandOwner,
  viewerId: number | null | undefined
): Promise<IslandData> => {
  const viewerRelation = await resolveViewerRelation(viewerId, owner.id);

  // 僅 active/completed 需渲染為建築；draft/not_started/archived 不進 payload
  const practices = await prisma.practices.findMany({
    where: {
      user_id: owner.id,
      deleted_at: null,
      status: { in: ['active', 'completed'] }
    },
    select: {
      id: true,
      external_id: true,
      title: true,
      status: true,
      theme_color: true,
      visibility: true,
      privacy_status: true
    },
    orderBy: { id: 'asc' }
  });

  const visiblePractices = practices.filter((practice) =>
    isPracticeVisibleTo(practice, viewerRelation)
  );

  // 依 id 升冪取打卡，保證種子順序 deterministic
  const checkins = visiblePractices.length > 0
    ? await prisma.practice_checkins.findMany({
      where: { practice_id: { in: visiblePractices.map((p) => p.id) } },
      select: { id: true, practice_id: true, checkin_date: true },
      orderBy: { id: 'asc' }
    })
    : [];

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);

  const checkinIdsByPractice = new Map<number, number[]>();
  let recentCheckinCount = 0;
  for (const checkin of checkins) {
    const ids = checkinIdsByPractice.get(checkin.practice_id) ?? [];
    ids.push(checkin.id);
    checkinIdsByPractice.set(checkin.practice_id, ids);
    if (checkin.checkin_date >= cutoff) recentCheckinCount += 1;
  }

  const quizResult = await getLatestResult(owner.id);
  const personaType = quizResult.data?.resultType ?? null;

  return {
    profile: {
      id: owner.external_id ?? '',
      customId: owner.custom_id,
      name: owner.nickname,
      photoURL: owner.photoUrl
    },
    personaType,
    practices: visiblePractices.map((practice) => {
      const checkinIds = checkinIdsByPractice.get(practice.id) ?? [];
      return {
        id: practice.external_id ?? String(practice.id),
        title: practice.title,
        status: practice.status as 'active' | 'completed',
        themeColor: practice.theme_color,
        checkinCount: checkinIds.length,
        checkinIds
      };
    }),
    recentCheckinCount,
    viewerRelation
  };
};

// ============================================================================
// Export
// ============================================================================

export const userIslandService = {
  isPracticeVisibleTo,
  resolveViewerRelation,
  getUserIslandData
};
